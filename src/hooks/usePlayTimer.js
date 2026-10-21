import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Measures active play time for a mission run.
 *
 * - Counts only while `active` and the tab is visible.
 * - Flushes whole seconds to `onFlush` every few seconds, when the tab is
 *   hidden and on unmount, so play time survives a refresh.
 * - `getSeconds()` returns the exact total for the run (persisted base +
 *   time measured since mount), used for the results screen and scoring.
 */
export function usePlayTimer({ baseSeconds = 0, active, onFlush, flushEvery = 5000 }) {
  const measured = useRef(0)
  const pending = useRef(0)
  const flushRef = useRef(onFlush)
  const [display, setDisplay] = useState(baseSeconds)

  useEffect(() => {
    flushRef.current = onFlush
  })

  useEffect(() => {
    if (!active) return
    let last = performance.now()

    const tick = () => {
      const now = performance.now()
      if (document.visibilityState === 'visible') {
        const delta = Math.min((now - last) / 1000, 5) // ignore long stalls (sleep, throttling)
        measured.current += delta
        pending.current += delta
        setDisplay(Math.floor(baseSeconds + measured.current))
      }
      last = now
    }
    const flush = () => {
      const whole = Math.floor(pending.current)
      if (whole > 0) {
        pending.current -= whole
        flushRef.current?.(whole)
      }
    }
    const onVisibility = () => {
      tick()
      if (document.visibilityState === 'hidden') flush()
    }

    const ticker = window.setInterval(tick, 1000)
    const flusher = window.setInterval(flush, flushEvery)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      tick()
      flush()
      window.clearInterval(ticker)
      window.clearInterval(flusher)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [active, baseSeconds, flushEvery])

  const getSeconds = useCallback(() => Math.round(baseSeconds + measured.current), [baseSeconds])

  return { seconds: display, getSeconds }
}
