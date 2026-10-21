import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, Trophy, X } from 'lucide-react'
import { cn } from '../lib/cn'

const ToastContext = createContext(null)

const TONES = {
  info: { icon: Info, accent: 'text-cyan', bar: 'bg-cyan' },
  success: { icon: CheckCircle2, accent: 'text-signal', bar: 'bg-signal' },
  warning: { icon: TriangleAlert, accent: 'text-amber', bar: 'bg-amber' },
  error: { icon: TriangleAlert, accent: 'text-danger', bar: 'bg-danger' },
  achievement: { icon: Trophy, accent: 'text-amber', bar: 'bg-amber' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    ({ tone = 'info', title, message, duration = 4200 }) => {
      counter.current += 1
      const id = counter.current
      setToasts((list) => [...list.slice(-3), { id, tone, title, message }])
      if (duration > 0) window.setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-16 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const tone = TONES[toast.tone] ?? TONES.info
            const Icon = tone.icon
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-auto relative w-full overflow-hidden rounded-lg border border-line-strong bg-raised/95 shadow-2xl shadow-black/50 backdrop-blur sm:w-[22rem]"
                role="status"
              >
                <span className={cn('absolute inset-y-0 left-0 w-[2px]', tone.bar)} aria-hidden="true" />
                <div className="flex items-start gap-3 py-3 pr-2 pl-4">
                  <Icon className={cn('mt-0.5 size-4 shrink-0', tone.accent)} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    {toast.title && <p className="text-sm font-medium text-ink">{toast.title}</p>}
                    {toast.message && <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{toast.message}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="rounded p-1 text-ink-mute transition hover:bg-elevated hover:text-ink"
                    aria-label="Dismiss notification"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
