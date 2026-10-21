import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/** Animates an integer from `from` to `value`. Instant under reduced motion. */
export function CountUp({ value, from = 0, duration = 0.9, delay = 0, prefix = '', className }) {
  const reduce = useReducedMotion() || document.documentElement.dataset.motion === 'reduced'
  const [shown, setShown] = useState(reduce ? value : from)

  useEffect(() => {
    if (reduce) {
      setShown(value)
      return
    }
    const controls = animate(from, value, { duration, delay, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [value, from, duration, delay, reduce])

  return (
    <span className={className} aria-label={`${prefix}${value}`}>
      <span aria-hidden="true">
        {prefix}
        {shown.toLocaleString('en-US')}
      </span>
    </span>
  )
}
