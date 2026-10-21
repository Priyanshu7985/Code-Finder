/**
 * Probe: measures the *rendered* state of the sandboxed document.
 *
 * Runs in the parent application against the same-origin, script-less
 * sandbox. Validators never see the DOM; they receive the plain-data
 * snapshot produced here, so their logic is deterministic and testable.
 */

const UID_ATTR = 'data-ih-uid'

export const elementFor = (doc, uid) => (doc && uid ? doc.querySelector(`[${UID_ATTR}="${uid}"]`) : null)

function describe(el) {
  const tag = el.tagName.toLowerCase()
  const cls = el.classList.length ? `.${[...el.classList].join('.')}` : ''
  return `<${tag}${el.id ? `#${el.id}` : ''}${cls}>`
}

/** Visibility + interactivity verdict for one element, with reasons. */
export function inspectElement(el) {
  if (!el || !el.isConnected) return { exists: false, visible: false, interactive: false, reasons: ['Not in the document'], blockers: [] }
  const doc = el.ownerDocument
  const win = doc.defaultView
  const reasons = []
  const blockers = []

  for (let n = el; n && n.nodeType === 1 && n !== doc.body; n = n.parentElement) {
    const cs = win.getComputedStyle(n)
    const who = n === el ? '' : ` on ancestor ${describe(n)}`
    if (cs.display === 'none') reasons.push(`display: none${who}`)
    if (Number.parseFloat(cs.opacity) < 0.05) reasons.push(`opacity: ${cs.opacity}${who}`)
  }

  const cs = win.getComputedStyle(el)
  if (cs.visibility !== 'visible') reasons.push(`visibility: ${cs.visibility}`)

  const rect = el.getBoundingClientRect()
  if (!reasons.some((r) => r.startsWith('display'))) {
    if (rect.width < 1 || rect.height < 1) reasons.push('rendered with zero size')
    else {
      const sx = win.scrollX
      const sy = win.scrollY
      const docW = doc.documentElement.scrollWidth
      if (rect.right + sx <= 0 || rect.bottom + sy <= 0 || rect.left + sx >= docW) reasons.push('positioned outside the page')
      // Clipped by an ancestor with overflow other than visible.
      for (let n = el.parentElement; n && n !== doc.body; n = n.parentElement) {
        const pcs = win.getComputedStyle(n)
        if (pcs.overflow === 'visible' && pcs.overflowX === 'visible' && pcs.overflowY === 'visible') continue
        const pr = n.getBoundingClientRect()
        const w = Math.min(rect.right, pr.right) - Math.max(rect.left, pr.left)
        const hgt = Math.min(rect.bottom, pr.bottom) - Math.max(rect.top, pr.top)
        if (w < 1 || hgt < 1) {
          reasons.push(`clipped by ${describe(n)} (overflow: ${pcs.overflow})`)
          break
        }
      }
    }
  }

  const visible = reasons.length === 0
  if (el.disabled || el.closest('fieldset[disabled]')) blockers.push('disabled attribute')
  if (cs.pointerEvents === 'none') blockers.push('pointer-events: none')
  if (visible && !blockers.length) {
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    if (cx >= 0 && cy >= 0 && cx <= win.innerWidth && cy <= win.innerHeight) {
      const top = doc.elementFromPoint(cx, cy)
      if (top && top !== el && !el.contains(top) && !top.contains(el)) blockers.push(`covered by ${describe(top)}`)
    }
  }

  return { exists: true, visible, interactive: visible && blockers.length === 0, reasons, blockers }
}

const COMPUTED_PROPS = ['display', 'visibility', 'opacity', 'position', 'color', 'background-color', 'pointer-events', 'z-index', 'font-size']

/** Detailed info for the CSS panel: computed values and matched rule ids. */
export function inspectSelected(el, rules) {
  if (!el) return null
  const cs = el.ownerDocument.defaultView.getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const computed = Object.fromEntries(COMPUTED_PROPS.map((p) => [p, cs.getPropertyValue(p)]))
  computed.size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`
  const matched = rules
    .filter((r) => {
      try {
        return el.matches(r.selector)
      } catch {
        return false
      }
    })
    .map((r) => r.id)
  return { computed, matched }
}

/** Snapshot of every rendered element plus details for the selection. */
export function probeDocument(doc, rules, selectedUid) {
  const nodes = {}
  if (!doc) return { nodes, selected: null }
  for (const el of doc.querySelectorAll(`[${UID_ATTR}]`)) {
    const v = inspectElement(el)
    nodes[el.getAttribute(UID_ATTR)] = v
  }
  return { nodes, selected: selectedUid ? inspectSelected(elementFor(doc, selectedUid), rules) : null }
}

/** Resolve any CSS selector inside the sandbox to a simulated uid. */
export function queryUid(doc, selector) {
  try {
    const el = doc?.querySelector(selector)
    return el?.closest(`[${UID_ATTR}]`)?.getAttribute(UID_ATTR) ?? null
  } catch {
    return 'invalid'
  }
}
