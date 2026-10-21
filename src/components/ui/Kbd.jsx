export function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-panel px-1 font-mono text-[10px] text-ink-mute">
      {children}
    </kbd>
  )
}
