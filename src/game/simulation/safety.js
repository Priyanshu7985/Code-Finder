/**
 * Whitelists for rendering simulated pages into the sandbox. Unknown tags
 * render as <div>; only allowlisted attributes reach the DOM.
 */

export const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'a', 'button', 'input', 'label',
  'ul', 'ol', 'li', 'nav', 'header', 'main', 'footer', 'section', 'article',
  'aside', 'strong', 'em', 'small', 'code', 'pre', 'hr', 'br',
])

export const VOID_TAGS = new Set(['input', 'hr', 'br'])

const PASSTHROUGH = new Set(['id', 'title', 'role', 'type', 'placeholder', 'name', 'tabindex'])

/** Map simulated attributes to React props for the sandboxed document. */
export function toSafeProps(attrs = {}) {
  const props = {}
  for (const [name, raw] of Object.entries(attrs)) {
    const value = String(raw)
    if (name === 'class') props.className = value
    else if (name === 'for') props.htmlFor = value
    else if (name === 'tabindex') props.tabIndex = Number.parseInt(value, 10) || 0
    else if (PASSTHROUGH.has(name)) props[name] = value
    else if ((name.startsWith('data-') && !name.startsWith('data-ih-')) || name.startsWith('aria-')) props[name] = value
    else if (name === 'disabled' || name === 'hidden' || name === 'readonly' || name === 'checked') {
      props[name === 'readonly' ? 'readOnly' : name === 'checked' ? 'defaultChecked' : name] = true
    } else if (name === 'value') props.defaultValue = value
    // href, src, style, on* and anything else are intentionally dropped.
  }
  return props
}
