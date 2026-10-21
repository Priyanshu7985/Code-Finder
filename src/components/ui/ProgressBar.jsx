import { cn } from '../../lib/cn'

export function ProgressBar({ value, label, tone = 'signal', className, thin }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('relative overflow-hidden rounded-full bg-line', thin ? 'h-1' : 'h-1.5', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          tone === 'signal' ? 'bg-signal shadow-[0_0_8px_rgb(92_242_168/0.6)]' : 'bg-cyan shadow-[0_0_8px_rgb(98_214_238/0.5)]',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
