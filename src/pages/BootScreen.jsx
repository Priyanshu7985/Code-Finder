import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigation } from '../context/NavigationContext'
import { useSettings } from '../context/SettingsContext'
import { LogoMark, Wordmark } from '../components/layout/Logo'
import { Kbd } from '../components/ui/Kbd'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'

const SEQUENCE = [
  { text: 'INITIALIZING SECURE ENVIRONMENT', detail: 'sandbox: isolated · network: simulated' },
  { text: 'LOADING SIMULATION', detail: 'missions: 5 indexed · validators: online' },
  { text: 'SYSTEM READY', detail: null, final: true },
]

const STEP_MS = 420
const HOLD_MS = 650

export function BootScreen() {
  const { navigate } = useNavigation()
  const { ambience, reducedMotion } = useSettings()
  const instant = reducedMotion || ambience !== 'full'
  const [step, setStep] = useState(instant ? SEQUENCE.length : 0)
  const done = useRef(false)

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    navigate('menu')
  }, [navigate])

  // Advance the sequence, then continue to the menu automatically.
  useEffect(() => {
    if (step < SEQUENCE.length) {
      const t = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 260 : STEP_MS)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(finish, instant ? 700 : HOLD_MS)
    return () => window.clearTimeout(t)
  }, [step, finish, instant])

  useEffect(() => {
    if (step > 0 && step <= SEQUENCE.length && !instant) playSound(step === SEQUENCE.length ? 'boot' : 'type')
  }, [step, instant])

  // Any key or click skips.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  const progress = Math.min(step / SEQUENCE.length, 1)

  return (
    <div
      className="relative flex min-h-dvh cursor-pointer items-center justify-center px-6"
      onClick={finish}
      role="presentation"
    >
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <LogoMark className="size-11" />
          <Wordmark className="text-3xl sm:text-4xl" />
        </motion.div>

        <div className="mt-8 h-px w-full overflow-hidden bg-line">
          <div
            className="h-full bg-signal shadow-[0_0_10px_rgb(92_242_168/0.7)] transition-[width] duration-300 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <ol className="mt-6 space-y-3 font-mono text-[13px]" aria-live="polite">
          {SEQUENCE.map((line, i) => {
            const visible = i < step
            const active = i === step - 1 && step < SEQUENCE.length
            return (
              <li
                key={line.text}
                className={cn('transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')}
                aria-hidden={!visible}
              >
                <div className="flex items-center gap-3">
                  <span className={line.final ? 'text-signal' : 'text-ink-faint'}>{line.final ? '■' : '>'}</span>
                  <span className={cn('tracking-[0.12em]', line.final ? 'text-signal text-glow' : 'text-ink')}>
                    {line.text}
                  </span>
                  {!line.final && (
                    <span className="ml-auto text-[11px] text-ink-mute">{visible && !active ? '[ OK ]' : '[ .. ]'}</span>
                  )}
                  {line.final && visible && <span className="h-4 w-2 animate-blink bg-signal" aria-hidden="true" />}
                </div>
                {line.detail && <p className="mt-1 pl-6 text-[11px] text-ink-mute">{line.detail}</p>}
              </li>
            )
          })}
        </ol>

        <div className="mt-10 flex items-center justify-between text-[12px] text-ink-mute">
          <span className="font-mono tracking-wider">FICTIONAL SIMULATION · v0.3.0</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              finish()
            }}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-ink-soft transition hover:bg-raised hover:text-ink"
          >
            Skip <Kbd>any key</Kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
