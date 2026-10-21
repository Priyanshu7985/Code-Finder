import { forwardRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * DevTools-style inline field: edits a local draft and commits on Enter
 * or blur; Escape reverts. `onCommit` returns false to signal rejection,
 * in which case the draft reverts to the last good value.
 * Remount with a new `key` when the committed value changes externally.
 */
export const InlineInput = forwardRef(function InlineInput({ value, onCommit, className, disabled, list, ...rest }, ref) {
  const [draft, setDraft] = useState(value)

  function commit() {
    if (draft === value) return
    const accepted = onCommit(draft)
    if (accepted === false) setDraft(value)
  }

  return (
    <input
      ref={ref}
      value={draft}
      disabled={disabled}
      list={list}
      spellCheck={false}
      autoComplete="off"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        } else if (e.key === 'Escape') {
          e.stopPropagation()
          setDraft(value)
        }
      }}
      className={cn(
        'min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-[12px] text-ink transition-colors',
        'hover:border-line-strong focus:border-cyan-dim focus:bg-base focus:outline-none disabled:cursor-default disabled:hover:border-transparent',
        className,
      )}
      {...rest}
    />
  )
})
