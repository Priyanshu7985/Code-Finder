import { cn } from '../../lib/cn'

/** Brand mark: angle brackets split by a slash. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true" fill="none">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" className="fill-panel stroke-line-strong" />
      <path d="M10 10.5 6 16l4 5.5M22 10.5l4 5.5-4 5.5" className="stroke-signal" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 8.5 14 23.5" className="stroke-cyan" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/** Wordmark: CODE FINDER with "FINDER" in the accent colour. */
export function Wordmark({ className, size = 'md' }) {
  const sizes = {
    sm: 'text-[15px] tracking-[0.12em]',
    md: 'text-xl tracking-[0.14em]',
    xl: 'text-[clamp(2.4rem,7vw,4.75rem)] tracking-[0.08em] leading-none',
  }
  return (
    <span className={cn('font-display font-bold text-ink', sizes[size], className)}>
      CODE <span className="text-signal">FINDER</span>
    </span>
  )
}

export function Logo({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <Wordmark size="sm" />
    </span>
  )
}
