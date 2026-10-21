import { indexTree, findByUid, updateNode, isElement, hasEditableText, walk } from './tree'
import { normalizeRules } from './css'
import {
  BOOLEAN_ATTRIBUTES,
  checkAttributeName,
  checkAttributeValue,
  checkCssProperty,
  checkCssValue,
  checkText,
  cleanText,
} from './policy'

/**
 * Editable state of a simulated page and the only operations that may
 * change it. `applyEdit` is pure: it returns `{ state }` on success or
 * `{ error }` with the unchanged state on rejection.
 *
 * Edit shapes:
 *   { type: 'text', uid, value }
 *   { type: 'attr:set', uid, name, value }
 *   { type: 'attr:remove', uid, name }
 *   { type: 'decl:set', target, index, prop, value }   // index -1 = add
 *   { type: 'decl:remove', target, index }
 *   target = { ruleId } | { uid }
 */

export function createPageState(mission) {
  return { tree: indexTree(mission.page.tree), rules: normalizeRules(mission.page.stylesheet), edits: 0 }
}

const fail = (state, error) => ({ state, error })
const ok = (state) => ({ state: { ...state, edits: state.edits + 1 } })

function editableElement(state, uid) {
  const node = findByUid(state.tree, uid)
  if (!node || !isElement(node)) return [null, 'That element no longer exists.']
  if (node.lock) return [null, 'This element is locked by the mission and cannot be edited.']
  return [node, null]
}

function applyDeclarations(state, target, update) {
  if (target?.ruleId) {
    const rule = state.rules.find((r) => r.id === target.ruleId)
    if (!rule) return fail(state, 'That CSS rule no longer exists.')
    const result = update(rule.declarations)
    if (typeof result === 'string') return fail(state, result)
    return ok({ ...state, rules: state.rules.map((r) => (r.id === rule.id ? { ...r, declarations: result } : r)) })
  }
  const [node, error] = editableElement(state, target?.uid)
  if (error) return fail(state, error)
  const result = update(node.style)
  if (typeof result === 'string') return fail(state, result)
  return ok({ ...state, tree: updateNode(state.tree, node.uid, (n) => ({ ...n, style: result })) })
}

export function applyEdit(state, edit) {
  switch (edit?.type) {
    case 'text': {
      const [node, error] = editableElement(state, edit.uid)
      if (error) return fail(state, error)
      if (!hasEditableText(node)) return fail(state, 'Only elements that contain plain text can have their text edited.')
      const value = cleanText(edit.value)
      const problem = checkText(value)
      if (problem) return fail(state, problem)
      return ok({ ...state, tree: updateNode(state.tree, node.uid, (n) => ({ ...n, children: value ? [{ text: value, uid: `${n.uid}.0` }] : [] })) })
    }

    case 'attr:set': {
      const [node, error] = editableElement(state, edit.uid)
      if (error) return fail(state, error)
      const name = String(edit.name ?? '').trim().toLowerCase()
      const nameProblem = checkAttributeName(name)
      if (nameProblem) return fail(state, nameProblem)
      const value = BOOLEAN_ATTRIBUTES.has(name) ? '' : String(edit.value ?? '').trim()
      const valueProblem = checkAttributeValue(name, value)
      if (valueProblem) return fail(state, valueProblem)
      return ok({ ...state, tree: updateNode(state.tree, node.uid, (n) => ({ ...n, attrs: { ...n.attrs, [name]: value } })) })
    }

    case 'attr:remove': {
      const [node, error] = editableElement(state, edit.uid)
      if (error) return fail(state, error)
      if (!(edit.name in node.attrs)) return fail(state, 'Attribute not found.')
      return ok({
        ...state,
        tree: updateNode(state.tree, node.uid, (n) => {
          const attrs = { ...n.attrs }
          delete attrs[edit.name]
          return { ...n, attrs }
        }),
      })
    }

    case 'decl:set':
      return applyDeclarations(state, edit.target, (decls) => {
        const prop = String(edit.prop ?? '').trim().toLowerCase()
        const value = String(edit.value ?? '').trim()
        const problem = checkCssProperty(prop) || checkCssValue(prop, value)
        if (problem) return problem
        if (edit.index === -1 || edit.index == null) {
          const existing = decls.findIndex((d) => d.prop === prop)
          if (existing !== -1) return decls.map((d, i) => (i === existing ? { prop, value } : d))
          return [...decls, { prop, value }]
        }
        if (!decls[edit.index]) return 'Declaration not found.'
        return decls.map((d, i) => (i === edit.index ? { prop, value } : d))
      })

    case 'decl:remove':
      return applyDeclarations(state, edit.target, (decls) =>
        decls[edit.index] ? decls.filter((_, i) => i !== edit.index) : 'Declaration not found.',
      )

    default:
      return fail(state, 'Unsupported edit.')
  }
}

/** True when any rule or inline style differs from the original. */
export function stylesChanged(state, original) {
  if (JSON.stringify(state.rules) !== JSON.stringify(original.rules)) return true
  const inline = (tree) => {
    const out = []
    walk(tree, (n) => isElement(n) && n.style.length && out.push([n.uid, n.style]))
    return JSON.stringify(out)
  }
  return inline(state.tree) !== inline(original.tree)
}

/** Restore all CSS (rules and inline styles) to the mission's original values. */
export function resetStyles(state, original) {
  const originalStyles = new Map()
  walk(original.tree, (n) => isElement(n) && originalStyles.set(n.uid, n.style))
  const restore = (node) =>
    isElement(node) ? { ...node, style: originalStyles.get(node.uid) ?? [], children: node.children.map(restore) } : node
  return { ...state, rules: original.rules, tree: restore(state.tree), edits: state.edits + 1 }
}
