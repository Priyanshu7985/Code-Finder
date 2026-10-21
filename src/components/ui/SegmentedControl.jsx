import { useId, useRef } from 'react'
import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'

/**
 * Radio-group styled as a segmented control, with arrow-key navigation.
 * options: [{ value, label }]
 */
export function SegmentedControl({ value, onChange, options, label, size = 'md', className }) {
  const groupId = useId()
  const refs = useRef([])

  function select(index) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    playSound('click')
    refs.current[index]?.focus()
  }

  function onKeyDown(e, index) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      select((index + 1) % options.length)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      select((index - 1 + options.length) % options.length)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      id={groupId}
      className={cn('inline-flex rounded-lg border border-line-strong bg-panel p-0.5', className)}
    >
      {options.map((option, i) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              active ? 'bg-elevated text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]' : 'text-ink-mute hover:text-ink-soft',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
