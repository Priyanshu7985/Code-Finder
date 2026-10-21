import { cn } from '../../lib/cn'

const TONES = {
  neutral: 'text-ink-soft border-line-strong bg-raised',
  signal: 'text-signal border-signal-dim/50 bg-signal-deep',
  cyan: 'text-cyan border-cyan-dim/50 bg-cyan-deep',
  amber: 'text-amber border-amber/30 bg-amber-deep',
  danger: 'text-danger border-danger/30 bg-danger-deep',
  muted: 'text-ink-mute border-line bg-panel',
}

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] border px-1.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] uppercase',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  )
}
