/**
 * Virtual page model for the simulated browser.
 *
 * Mission pages are plain data — never HTML strings — so they can be
 * rendered into the sandbox, inspected and edited without touching the
 * real document.
 *
 * Node shapes:
 *   element: { uid, tag, attrs, style, children, key?, lock?, showWhen?, hideWhen?, action? }
 *   text:    { uid, text }
 *   comment: { uid, comment, key? }
 *
 * `key`, `lock`, `showWhen`, `hideWhen` and `action` are *engine metadata*:
 * they never become DOM attributes and the player cannot edit them, so
 * validators can rely on them.
 */

const META = { $key: 'key', $lock: 'lock', $showWhen: 'showWhen', $hideWhen: 'hideWhen', $action: 'action' }

/** Element builder used by mission definitions. `$`-prefixed props are engine metadata. */
export function h(tag, props = {}, ...children) {
  const attrs = {}
  const node = { tag, attrs, style: [], children: [] }
  for (const [name, value] of Object.entries(props ?? {})) {
    if (name in META) node[META[name]] = value
    else if (name === '$style') node.style = Object.entries(value).map(([prop, v]) => ({ prop, value: v }))
    else attrs[name] = value === true ? '' : String(value)
  }
  node.children = children.flat().map((c) => (typeof c === 'string' ? { text: c } : c))
  return node
}

/** Comment builder (`<!-- ... -->`). An optional key makes it trackable. */
export const comment = (value, key) => (key ? { comment: value, key } : { comment: value })

export const isElement = (node) => typeof node?.tag === 'string'
export const isText = (node) => typeof node?.text === 'string'
export const isComment = (node) => typeof node?.comment === 'string'

/** Deep copy with deterministic path-based uids ("0.2.1"). */
export function indexTree(node, path = '0') {
  if (isElement(node)) {
    return {
      ...node,
      attrs: { ...node.attrs },
      style: (node.style ?? []).map((d) => ({ ...d })),
      uid: path,
      children: node.children.map((child, i) => indexTree(child, `${path}.${i}`)),
    }
  }
  return { ...node, uid: path }
}

export function findNode(root, predicate) {
  if (!root) return null
  if (predicate(root)) return root
  if (isElement(root)) {
    for (const child of root.children) {
      const hit = findNode(child, predicate)
      if (hit) return hit
    }
  }
  return null
}

export const findByUid = (root, uid) => (uid ? findNode(root, (n) => n.uid === uid) : null)
export const findByKey = (root, key) => findNode(root, (n) => n.key === key)

export function walk(root, visit, parent = null) {
  if (!root) return
  visit(root, parent)
  if (isElement(root)) root.children.forEach((c) => walk(c, visit, root))
}

/** Immutable update of one node by uid. */
export function updateNode(root, uid, update) {
  if (root.uid === uid) return update(root)
  if (!isElement(root) || !uid.startsWith(`${root.uid}.`)) return root
  let changed = false
  const children = root.children.map((child) => {
    const next = updateNode(child, uid, update)
    if (next !== child) changed = true
    return next
  })
  return changed ? { ...root, children } : root
}

/**
 * Apply engine flags: drop nodes whose `showWhen` flag is off or whose
 * `hideWhen` flag is on. Conditional content (e.g. a clue revealed only
 * after an objective) therefore does not exist until it is earned.
 */
export function materialize(node, flags) {
  if (!isElement(node)) return node
  const children = []
  for (const child of node.children) {
    if (child.showWhen && !flags[child.showWhen]) continue
    if (child.hideWhen && flags[child.hideWhen]) continue
    children.push(materialize(child, flags))
  }
  return { ...node, children }
}

/** Text content of a node (concatenated text descendants). */
export function textOf(node) {
  if (!node) return ''
  if (isText(node)) return node.text
  if (!isElement(node)) return ''
  return node.children.map(textOf).join('')
}

/** An element whose content can be edited as plain text. */
export const hasEditableText = (node) => isElement(node) && node.children.every((c) => isText(c))

/** All ancestor uids of a node, root first. */
export function ancestorUids(uid) {
  if (!uid) return []
  const parts = uid.split('.')
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('.'))
}

/** Short CSS-like label: `span#balance.amount`. */
export function nodeLabel(node) {
  if (!node) return ''
  if (isComment(node)) return '#comment'
  if (!isElement(node)) return '#text'
  const id = node.attrs.id ? `#${node.attrs.id}` : ''
  const cls = node.attrs.class?.trim() ? `.${node.attrs.class.trim().split(/\s+/).join('.')}` : ''
  return `${node.tag}${id}${cls}`
}
