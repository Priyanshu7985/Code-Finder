import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'

const VARIANTS = {
  primary:
    'bg-signal text-void font-semibold hover:bg-[#7af7bb] active:bg-signal-dim shadow-[0_0_0_1px_rgb(92_242_168/0.4),0_8px_24px_-12px_rgb(92_242_168/0.7)] disabled:bg-signal-dim/40 disabled:text-void/60 disabled:shadow-none',
  secondary:
    'bg-raised text-ink border border-line-strong hover:border-signal-dim hover:bg-elevated active:bg-panel disabled:text-ink-faint disabled:hover:border-line-strong',
  ghost: 'text-ink-soft hover:text-ink hover:bg-raised active:bg-panel disabled:text-ink-faint disabled:hover:bg-transparent',
  danger:
    'bg-danger-deep text-danger border border-danger/30 hover:border-danger/60 hover:bg-danger/15 disabled:opacity-50',
  cyan: 'bg-cyan-deep text-cyan border border-cyan-dim/50 hover:border-cyan hover:bg-cyan/15 disabled:opacity-50',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-lg',
  icon: 'size-9 justify-center rounded-md',
}

/**
 * Base button. Plays a short UI cue on click (muted globally via settings).
 */
export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, sound = 'click', className, children, onClick, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      onClick={(e) => {
        if (sound) playSound(sound)
        onClick?.(e)
      }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium tracking-tight transition-[background-color,border-color,color,box-shadow,transform] duration-150 select-none active:translate-y-px disabled:active:translate-y-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight className={size === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden="true" />}
    </button>
  )
})
