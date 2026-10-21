import { isSafeSelector, sanitizeDeclaration } from './policy'

/**
 * Stylesheet model.
 *
 * Authoring format (mission files):  { selector, comment?, declarations: { prop: value } }
 * Internal format (editable state):  { id, selector, comment?, declarations: [{ prop, value }] }
 *
 * The real browser engine inside the sandbox performs the cascade; this
 * module only normalizes, sanitizes and serializes.
 */

export function normalizeRules(stylesheet = []) {
  return stylesheet.map((rule, i) => ({
    id: `r${i}`,
    selector: rule.selector,
    comment: rule.comment,
    declarations: Object.entries(rule.declarations).map(([prop, value]) => ({ prop, value })),
  }))
}

/** CSS text for the sandbox. Every declaration is re-validated here. */
export function serializeRules(rules, { comments = false } = {}) {
  return rules
    .filter((rule) => isSafeSelector(rule.selector))
    .map((rule) => {
      const body = rule.declarations
        .map((d) => sanitizeDeclaration(d.prop, d.value))
        .filter(Boolean)
        .map(([p, v]) => `  ${p}: ${v};`)
        .join('\n')
      const note = comments && rule.comment ? `/* ${rule.comment.replace(/\*\//g, '')} */\n` : ''
      return `${note}${rule.selector} {\n${body}\n}`
    })
    .join('\n\n')
}

const toCamel = (prop) => prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

/** Inline declarations -> React style object (sanitized). `!important` is not supported inline. */
export function inlineStyleObject(declarations = []) {
  const style = {}
  for (const d of declarations) {
    const clean = sanitizeDeclaration(d.prop, d.value)
    if (clean) style[toCamel(clean[0])] = clean[1].replace(/\s*!important\s*$/i, '')
  }
  return style
}

export const serializeInline = (declarations = []) =>
  declarations.map((d) => `${d.prop}: ${d.value}`).join('; ')
