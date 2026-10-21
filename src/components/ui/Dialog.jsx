import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal dialog: focus trap, Escape to close, focus restore,
 * labelled by its title. Replaces browser alert/confirm for game UI.
 */
export function Dialog({ open, onClose, title, description, icon: Icon, tone = 'signal', children, footer, className, dismissible = true }) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descId = useId()
  // Keep the latest onClose without re-running the focus effect on every render.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const panel = panelRef.current
    const raf = requestAnimationFrame(() => {
      const target = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE) ?? panel
      target?.focus()
    })

    function onKeyDown(e) {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const nodes = [...panel.querySelectorAll(FOCUSABLE)]
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open, dismissible])

  const toneClass = { signal: 'text-signal', cyan: 'text-cyan', amber: 'text-amber', danger: 'text-danger' }[tone]

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-void/75 backdrop-blur-[3px]"
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className={cn(
              className?.includes('max-w-') ? '' : 'max-w-md',
              'panel corner-ticks relative max-h-[calc(100dvh-2rem)] w-full overflow-auto border-line-strong bg-raised shadow-2xl shadow-black/60 outline-none',
              className,
            )}
          >
            <div className="flex items-start gap-3 border-b border-line px-5 pt-5 pb-4">
              {Icon && (
                <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-line-strong bg-panel', toneClass)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {description}
                  </p>
                )}
              </div>
              {dismissible && (
                <button
                  type="button"
                  onClick={onClose}
                  className="-mt-1 -mr-1 rounded-md p-1.5 text-ink-mute transition hover:bg-elevated hover:text-ink"
                  aria-label="Close dialog"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {children && <div className="px-5 py-4">{children}</div>}
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
