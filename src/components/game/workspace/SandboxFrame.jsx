import { createElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ALLOWED_TAGS, VOID_TAGS, toSafeProps } from '../../../game/simulation/safety'
import { inlineStyleObject, serializeRules } from '../../../game/simulation/css'
import { isElement, isText } from '../../../game/simulation/tree'

/**
 * Isolated renderer for simulated websites.
 *
 * Isolation model:
 * - `sandbox="allow-same-origin"` WITHOUT `allow-scripts`: nothing can
 *   execute inside the frame (no scripts, no inline handlers, no
 *   javascript: URLs), forms, popups and top-level navigation are blocked.
 *   Same-origin lets the *parent* read the frame for inspection; the frame
 *   itself has no code that could reach back.
 * - A Content-Security-Policy of `default-src 'none'` blocks every network
 *   request (images, fonts, CSS url(), prefetch) as defence in depth.
 * - Page content is rendered by the parent through a React portal from
 *   the sanitized page model. No HTML strings are ever parsed.
 */

const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'"
const BASE_CSS =
  'html,body{margin:0;min-height:100%;background:#fff}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}*,*::before,*::after{box-sizing:border-box}button,input{font:inherit}'
const SHELL = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="referrer" content="no-referrer"><style>${BASE_CSS}</style></head><body></body></html>`

const OVERLAY_CSS =
  '[data-ih-hover]{outline:1px dashed rgba(34,184,214,.95)!important;outline-offset:2px!important}' +
  '[data-ih-selected]{outline:2px solid #22b8d6!important;outline-offset:2px!important}'
const PICKER_CSS = '*{cursor:crosshair!important}'

const SimNode = memo(function SimNode({ node, selectedUid, hoveredUid }) {
  if (isText(node)) return node.text
  if (!isElement(node)) return null // comments are not rendered, as in a real browser

  const tag = ALLOWED_TAGS.has(node.tag) ? node.tag : 'div'
  const props = { ...toSafeProps(node.attrs), 'data-ih-uid': node.uid }
  const style = inlineStyleObject(node.style)
  if (Object.keys(style).length) props.style = style
  if (node.uid === selectedUid) props['data-ih-selected'] = ''
  else if (node.uid === hoveredUid) props['data-ih-hover'] = ''
  if (tag === 'button' && !props.type) props.type = 'button'

  if (VOID_TAGS.has(tag)) return createElement(tag, props)
  return createElement(
    tag,
    props,
    node.children.map((child) => <SimNode key={child.uid} node={child} selectedUid={selectedUid} hoveredUid={hoveredUid} />),
  )
})

function FrameRoot({ tree, css, selectedUid, hoveredUid, picker, onPick, onHover, onInteract }) {
  const uidOf = (target) => target?.closest?.('[data-ih-uid]')?.getAttribute('data-ih-uid') ?? null

  return (
    <div
      data-ih-root=""
      onClickCapture={(e) => {
        const uid = uidOf(e.target)
        if (picker) {
          e.preventDefault()
          e.stopPropagation()
          if (uid) onPick?.(uid)
          return
        }
        if (e.target.closest?.('a')) e.preventDefault()
        if (uid) onInteract?.(uid)
      }}
      onSubmitCapture={(e) => e.preventDefault()}
      onMouseOver={(e) => picker && onHover?.(uidOf(e.target))}
      onMouseLeave={() => onHover?.(null)}
    >
      <style>{css}</style>
      <SimNode node={tree} selectedUid={selectedUid} hoveredUid={picker ? hoveredUid : null} />
    </div>
  )
}

export function SandboxFrame({ tree, rules, selectedUid = null, hoveredUid = null, picker = false, onPick, onHover, onInteract, onCommit, title, className }) {
  const frameRef = useRef(null)
  const [body, setBody] = useState(null)

  const attach = useCallback(() => {
    const doc = frameRef.current?.contentDocument
    // Only attach to our srcdoc shell, never to the transient about:blank document.
    if (doc?.body && doc.querySelector('meta[http-equiv="Content-Security-Policy"]')) setBody(doc.body)
  }, [])

  useEffect(() => {
    attach()
  }, [attach])

  const css = useMemo(() => `${serializeRules(rules)}\n${OVERLAY_CSS}${picker ? PICKER_CSS : ''}`, [rules, picker])

  // Let the host measure the rendered document after every commit.
  useEffect(() => {
    if (body) onCommit?.(body.ownerDocument)
  })

  // Re-measure when the viewport changes size (responsive panels).
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !body || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => onCommit?.(body.ownerDocument))
    ro.observe(frame)
    return () => ro.disconnect()
  }, [body, onCommit])

  return (
    <>
      <iframe
        ref={frameRef}
        title={title}
        sandbox="allow-same-origin"
        srcDoc={SHELL}
        referrerPolicy="no-referrer"
        onLoad={attach}
        className={className}
      />
      {body &&
        createPortal(
          <FrameRoot
            tree={tree}
            css={css}
            selectedUid={selectedUid}
            hoveredUid={hoveredUid}
            picker={picker}
            onPick={onPick}
            onHover={onHover}
            onInteract={onInteract}
          />,
          body,
        )}
    </>
  )
}
