import { useState } from 'react'
import { Lock, MousePointerClick, RotateCw, ShieldCheck } from 'lucide-react'
import { SandboxFrame } from './SandboxFrame'
import { findByUid, nodeLabel } from '../../../game/simulation/tree'
import { playSound } from '../../../lib/sound'
import { cn } from '../../../lib/cn'

/**
 * Fictional browser window around the sandboxed page.
 * Picker on: clicks select elements (and the picker switches off, like
 * real DevTools). Picker off: clicks interact with the page.
 */
export function BrowserFrame({ page, tree, rules, selectedUid, picker, onTogglePicker, onPick, onInteract, onCommit }) {
  const [hoveredUid, setHoveredUid] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const hovered = picker && hoveredUid ? findByUid(tree, hoveredUid) : null

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line-strong bg-panel" aria-label="Simulated browser">
      <div className="flex items-center gap-2 border-b border-line bg-raised px-3 py-2">
        <div className="flex gap-1.5 pr-1" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </div>
        <button
          type="button"
          onClick={() => {
            playSound('click')
            setReloadKey((k) => k + 1)
          }}
          className="rounded-md p-1.5 text-ink-mute transition hover:bg-elevated hover:text-ink"
          aria-label="Reload simulated page (keeps your edits, clears typed input)"
          title="Reload page"
        >
          <RotateCw className="size-3.5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1">
          <Lock className="size-3 shrink-0 text-signal" aria-hidden="true" />
          <span className="truncate font-mono text-[12px] text-ink-soft">{page.url}</span>
          <span className="ml-auto hidden shrink-0 items-center gap-1 rounded bg-signal-deep px-1.5 py-px font-mono text-[9.5px] tracking-wider text-signal sm:inline-flex">
            <ShieldCheck className="size-3" aria-hidden="true" /> SANDBOXED
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            playSound('click')
            onTogglePicker()
          }}
          aria-pressed={picker}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition',
            picker ? 'bg-cyan-deep text-cyan ring-1 ring-cyan-dim/60' : 'text-ink-mute hover:bg-elevated hover:text-ink',
          )}
          title="Select an element in the page to inspect it"
        >
          <MousePointerClick className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{picker ? 'Picking…' : 'Pick element'}</span>
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        <SandboxFrame
          key={reloadKey}
          title={`Simulated page: ${page.title}`}
          className="absolute inset-0 size-full border-0"
          tree={tree}
          rules={rules}
          selectedUid={selectedUid}
          hoveredUid={hoveredUid}
          picker={picker}
          onPick={(uid) => {
            playSound('click')
            setHoveredUid(null)
            onPick(uid)
          }}
          onHover={setHoveredUid}
          onInteract={onInteract}
          onCommit={onCommit}
        />
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-between gap-2">
          {hovered ? (
            <span className="rounded border border-cyan-dim/60 bg-void/90 px-2 py-1 font-mono text-[11px] text-cyan shadow-lg">{nodeLabel(hovered)}</span>
          ) : (
            <span />
          )}
          <span className="rounded bg-void/80 px-2 py-1 font-mono text-[10px] text-ink-mute">
            {picker ? 'Click an element to inspect it' : 'Interact mode · clicks reach the page'}
          </span>
        </div>
      </div>
    </section>
  )
}
