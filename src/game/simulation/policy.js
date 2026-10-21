/**
 * Edit policy for the simulated page.
 *
 * Every player edit passes through these functions. They are allowlists:
 * anything not explicitly permitted is rejected with a readable reason.
 */

/* ----------------------------- Attributes ----------------------------- */

const ATTRIBUTE_ALLOWLIST = new Set([
  'id', 'class', 'title', 'role', 'hidden', 'disabled', 'readonly', 'checked',
  'type', 'placeholder', 'value', 'name', 'for', 'tabindex',
])
export const BOOLEAN_ATTRIBUTES = new Set(['hidden', 'disabled', 'readonly', 'checked'])
const INPUT_TYPES = new Set(['text', 'password', 'email', 'number', 'search', 'button', 'submit', 'checkbox'])
const NAME_RE = /^[a-z][a-z0-9-]{0,40}$/

export const LIMITS = { text: 200, attrValue: 200, cssValue: 160 }

export function checkAttributeName(name) {
  if (typeof name !== 'string' || !name) return 'Attribute name is required.'
  const n = name.trim().toLowerCase()
  if (!NAME_RE.test(n)) return 'Attribute names may only contain lowercase letters, digits and hyphens.'
  if (n.startsWith('on')) return 'Event-handler attributes are not permitted in the simulation.'
  if (n === 'style') return 'Use the CSS panel to edit inline styles.'
  if (n.startsWith('data-ih-')) return 'data-ih-* attributes are reserved by the simulator.'
  if (n.startsWith('data-') || n.startsWith('aria-')) return null
  if (!ATTRIBUTE_ALLOWLIST.has(n)) return `The "${n}" attribute is not editable here. Allowed: ${[...ATTRIBUTE_ALLOWLIST].join(', ')}, data-*, aria-*.`
  return null
}

export function checkAttributeValue(name, value) {
  const v = String(value ?? '')
  if (v.length > LIMITS.attrValue) return `Values are limited to ${LIMITS.attrValue} characters.`
  if (/[<>]/.test(v)) return 'Angle brackets are not allowed in attribute values.'
  if (/^\s*(javascript|data|vbscript):/i.test(v)) return 'URL schemes are not allowed in attribute values.'
  if (name === 'type' && v && !INPUT_TYPES.has(v.toLowerCase())) return `Unsupported type. Use one of: ${[...INPUT_TYPES].join(', ')}.`
  if (name === 'tabindex' && v && !/^-?\d{1,2}$/.test(v)) return 'tabindex must be a small integer.'
  return null
}

export function checkText(value) {
  const v = String(value ?? '')
  if (v.length > LIMITS.text) return `Text is limited to ${LIMITS.text} characters.`
  return null
}

export const cleanText = (value) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

/* --------------------------------- CSS -------------------------------- */

const CSS_PROPERTIES = [
  'display', 'visibility', 'opacity', 'color', 'background', 'background-color',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'position', 'top', 'right', 'bottom', 'left', 'inset', 'z-index',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-color', 'border-width', 'border-style', 'border-radius',
  'border-top', 'border-right', 'border-bottom', 'border-left', 'outline',
  'box-shadow', 'box-sizing', 'font-size', 'font-weight', 'font-style', 'font-family',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-transform',
  'text-indent', 'white-space', 'vertical-align', 'overflow', 'overflow-x', 'overflow-y',
  'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'order',
  'gap', 'row-gap', 'column-gap', 'justify-content', 'align-items', 'align-self', 'align-content',
  'grid-template-columns', 'cursor', 'pointer-events', 'transform', 'filter', 'user-select',
  'list-style', 'aspect-ratio',
]
export const CSS_PROPERTY_SET = new Set(CSS_PROPERTIES)
export const CSS_PROPERTY_LIST = CSS_PROPERTIES

/** Features that could load resources, read attributes or break out of a declaration. */
const CSS_FORBIDDEN = /url\s*\(|image-set|image\s*\(|element\s*\(|cross-fade|expression|javascript:|attr\s*\(|var\s*\(|env\s*\(|@|\\|<|>|\{|\}|;|\/\*|\*\//i

export function checkCssProperty(prop) {
  const p = String(prop ?? '').trim().toLowerCase()
  if (!p) return 'Property name is required.'
  if (!CSS_PROPERTY_SET.has(p)) return `"${p}" is not an editable property in this simulation.`
  return null
}

export function checkCssValue(prop, value) {
  const v = String(value ?? '').trim()
  if (!v) return 'Value is required.'
  if (v.length > LIMITS.cssValue) return `Values are limited to ${LIMITS.cssValue} characters.`
  if (CSS_FORBIDDEN.test(v)) return 'That value uses a CSS feature that is blocked in the sandbox (url(), @-rules, var(), attr(), comments or braces).'
  const bare = v.replace(/\s*!important\s*$/i, '')
  if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports(prop, bare)) return `"${bare}" is not a valid value for ${prop}.`
  return null
}

/** Returns a normalized [prop, value] pair or null. Used again at render time. */
export function sanitizeDeclaration(prop, value) {
  const p = String(prop ?? '').trim().toLowerCase()
  const v = String(value ?? '').trim()
  if (checkCssProperty(p) || checkCssValue(p, v)) return null
  return [p, v]
}

const SELECTOR_FORBIDDEN = /[{}<>;@\\]|\/\*/
export const isSafeSelector = (selector) => typeof selector === 'string' && selector.trim() && !SELECTOR_FORBIDDEN.test(selector)
