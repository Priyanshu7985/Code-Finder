import { useId } from 'react'
import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'

/** Accessible switch (role="switch"). */
export function Toggle({ checked, onChange, label, description, disabled }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] leading-snug text-ink-mute">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          onChange(!checked)
          playSound('click')
        }}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200',
          checked ? 'border-signal-dim bg-signal-deep' : 'border-line-strong bg-panel',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 rounded-full transition-transform duration-200',
            checked ? 'translate-x-[22px] bg-signal shadow-[0_0_10px_rgb(92_242_168/0.6)]' : 'translate-x-[3px] bg-ink-mute',
          )}
        />
      </button>
    </div>
  )
}
