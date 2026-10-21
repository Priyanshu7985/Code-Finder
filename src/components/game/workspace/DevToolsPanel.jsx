import { useRef } from 'react'
import { Code2, Paintbrush, TerminalSquare } from 'lucide-react'
import { HtmlPanel } from './HtmlPanel'
import { CssPanel } from './CssPanel'
import { ConsolePanel } from './ConsolePanel'
import { playSound } from '../../../lib/sound'
import { cn } from '../../../lib/cn'

export const DEVTOOLS_TABS = [
  { id: 'html', label: 'HTML', icon: Code2 },
  { id: 'css', label: 'CSS', icon: Paintbrush },
  { id: 'console', label: 'Console', icon: TerminalSquare },
]

/**
 * Right-hand developer tools. Panels stay mounted (hidden when inactive)
 * so console history and tree state survive tab switches.
 */
export function DevToolsPanel({ tab, onTabChange, tree, rules, selectedNode, collapsed, probe, onToggleNode, onSelectNode, onEdit, onResetStyles, stylesDirty, consoleApi }) {
  const tabRefs = useRef({})

  function onKeyDown(e) {
    const i = DEVTOOLS_TABS.findIndex((t) => t.id === tab)
    let next = null
    if (e.key === 'ArrowRight') next = DEVTOOLS_TABS[(i + 1) % DEVTOOLS_TABS.length]
    if (e.key === 'ArrowLeft') next = DEVTOOLS_TABS[(i - 1 + DEVTOOLS_TABS.length) % DEVTOOLS_TABS.length]
    if (next) {
      e.preventDefault()
      onTabChange(next.id)
      tabRefs.current[next.id]?.focus()
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line-strong bg-panel" aria-label="Developer tools">
      <div className="flex items-center border-b border-line bg-raised px-1.5" role="tablist" aria-label="Developer tools panels" onKeyDown={onKeyDown}>
        {DEVTOOLS_TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab
          return (
            <button
              key={id}
              ref={(el) => (tabRefs.current[id] = el)}
              id={`devtab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`devpanel-${id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => {
                if (!active) playSound('click')
                onTabChange(id)
              }}
              className={cn(
                'relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors',
                active ? 'text-ink' : 'text-ink-mute hover:text-ink-soft',
              )}
            >
              <Icon className={cn('size-3.5', active ? 'text-signal' : '')} aria-hidden="true" />
              {label}
              {active && <span className="absolute inset-x-2 -bottom-px h-px bg-signal shadow-[0_0_8px_var(--color-signal)]" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <div className="relative min-h-0 flex-1">
        <div role="tabpanel" id="devpanel-html" aria-labelledby="devtab-html" hidden={tab !== 'html'} className="absolute inset-0">
          <HtmlPanel tree={tree} selectedNode={selectedNode} collapsed={collapsed} probe={probe} onToggle={onToggleNode} onSelect={onSelectNode} onEdit={onEdit} />
        </div>
        <div role="tabpanel" id="devpanel-css" aria-labelledby="devtab-css" hidden={tab !== 'css'} className="absolute inset-0">
          {tab === 'css' && (
            <CssPanel rules={rules} selectedNode={selectedNode} probe={probe} onEdit={onEdit} onResetStyles={onResetStyles} stylesDirty={stylesDirty} />
          )}
        </div>
        <div role="tabpanel" id="devpanel-console" aria-labelledby="devtab-console" hidden={tab !== 'console'} className="absolute inset-0">
          <ConsolePanel api={consoleApi} active={tab === 'console'} />
        </div>
      </div>
    </section>
  )
}
