import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { runCommand, WELCOME_LINES } from '../../../game/engine/console'
import { cn } from '../../../lib/cn'

const TONE = {
  out: 'text-ink',
  info: 'text-cyan',
  ok: 'text-signal',
  warn: 'text-amber',
  err: 'text-danger',
  muted: 'text-ink-mute',
  input: 'text-ink-soft',
}

/**
 * Console tab. Uses the fixed command language from game/engine/console.
 */
export function ConsolePanel({ api, active }) {
  const [lines, setLines] = useState(WELCOME_LINES)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [cursor, setCursor] = useState(-1)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  useEffect(() => {
    if (active) inputRef.current?.focus({ preventScroll: true })
  }, [active])

  function execute(e) {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return
    const output = runCommand(cmd, api)
    setHistory((h) => [...h.slice(-49), cmd])
    setCursor(-1)
    setInput('')
    if (output === 'clear') setLines([])
    else setLines((prev) => [...prev.slice(-200), { text: `> ${cmd}`, tone: 'input' }, ...output])
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const next = cursor === -1 ? history.length - 1 : Math.max(cursor - 1, 0)
      setCursor(next)
      setInput(history[next])
    } else if (e.key === 'ArrowDown' && cursor !== -1) {
      e.preventDefault()
      const next = cursor + 1
      if (next >= history.length) {
        setCursor(-1)
        setInput('')
      } else {
        setCursor(next)
        setInput(history[next])
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12px] leading-5" role="log" aria-live="polite" aria-label="Console output">
        {lines.map((line, i) => (
          <div key={i} className={cn('break-words whitespace-pre-wrap', TONE[line.tone])}>
            {line.text}
          </div>
        ))}
      </div>
      <form onSubmit={execute} className="flex items-center gap-2 border-t border-line bg-base/60 px-3 py-2 transition-shadow focus-within:shadow-[inset_0_0_0_1px_var(--color-signal-dim)]">
        <ChevronRight className="size-3.5 shrink-0 text-signal" aria-hidden="true" />
        <label htmlFor="console-input" className="sr-only">
          Console command
        </label>
        <input
          ref={inputRef}
          id="console-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          placeholder='Type "help"'
          className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </form>
    </div>
  )
}
