import { lazy, Suspense, useId, useMemo, useState } from 'react'
import { Eye, EyeOff, MousePointer2, MousePointerClick, Plus, RotateCcw, X } from 'lucide-react'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { InlineInput } from '../../ui/InlineInput'
import { serializeRules } from '../../../game/simulation/css'
import { CSS_PROPERTY_LIST } from '../../../game/simulation/policy'
import { isElement, nodeLabel } from '../../../game/simulation/tree'
import { cn } from '../../../lib/cn'

const CodeView = lazy(() => import('./CodeView'))

function AddDeclaration({ onAdd, disabled, listId }) {
  const [prop, setProp] = useState('')
  const [value, setValue] = useState('')
  return (
    <form
      className="flex items-center gap-1 pt-1 pl-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (onAdd(prop, value)) {
          setProp('')
          setValue('')
        }
      }}
    >
      <input
        value={prop}
        onChange={(e) => setProp(e.target.value)}
        list={listId}
        disabled={disabled}
        placeholder="property"
        aria-label="New property name"
        spellCheck={false}
        autoComplete="off"
        className="h-6 w-[42%] min-w-0 rounded border border-line bg-panel px-1.5 font-mono text-[11.5px] text-ink placeholder:text-ink-faint focus:border-cyan-dim focus:outline-none"
      />
      <span className="text-ink-mute">:</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="value"
        aria-label="New property value"
        spellCheck={false}
        autoComplete="off"
        className="h-6 min-w-0 flex-1 rounded border border-line bg-panel px-1.5 font-mono text-[11.5px] text-ink placeholder:text-ink-faint focus:border-cyan-dim focus:outline-none"
      />
      <button
        type="submit"
        disabled={disabled || !prop.trim() || !value.trim()}
        className="grid size-6 shrink-0 place-items-center rounded text-ink-mute transition hover:text-signal disabled:opacity-40"
        aria-label="Add declaration"
      >
        <Plus className="size-3.5" />
      </button>
    </form>
  )
}

/** Editable block of declarations for a rule or element.style. */
function DeclarationBlock({ title, subtitle, declarations, target, onEdit, locked, listId }) {
  return (
    <li className="rounded-md border border-line bg-base/60 font-mono text-[12px] leading-5">
      <div className="flex items-center justify-between gap-2 border-b border-line/70 px-3 py-1.5">
        <span className="truncate text-cyan">{title}</span>
        {subtitle && <span className="shrink-0 text-[10px] text-ink-faint">{subtitle}</span>}
      </div>
      <div className="py-1.5 pr-2">
        {declarations.length === 0 && <p className="pl-4 text-[11px] text-ink-faint">no declarations</p>}
        {declarations.map((d, index) => (
          <div key={`${index}:${d.prop}`} className="group flex items-center gap-0.5 pl-3">
            <InlineInput
              key={`p:${d.prop}`}
              value={d.prop}
              disabled={locked}
              list={listId}
              aria-label={`Property name ${d.prop}`}
              className="w-[42%] text-ink-soft"
              onCommit={(prop) => onEdit({ type: 'decl:set', target, index, prop, value: d.value })}
            />
            <span className="text-ink-mute">:</span>
            <InlineInput
              key={`v:${d.prop}:${d.value}`}
              value={d.value}
              disabled={locked}
              aria-label={`Value of ${d.prop}`}
              className="min-w-0 flex-1 text-signal"
              onCommit={(value) => onEdit({ type: 'decl:set', target, index, prop: d.prop, value })}
            />
            <button
              type="button"
              disabled={locked}
              onClick={() => onEdit({ type: 'decl:remove', target, index })}
              className="grid size-5 shrink-0 place-items-center rounded text-ink-faint opacity-60 transition group-hover:opacity-100 hover:bg-danger-deep hover:text-danger disabled:invisible"
              aria-label={`Remove ${d.prop}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {!locked && <AddDeclaration listId={listId} onAdd={(prop, value) => onEdit({ type: 'decl:set', target, index: -1, prop, value })} />}
      </div>
    </li>
  )
}

function ComputedCard({ verdict, info }) {
  if (!verdict || !info) return null
  return (
    <section className="rounded-md border border-line bg-base/60">
      <div className="flex flex-wrap gap-1.5 border-b border-line/70 px-3 py-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-px font-mono text-[10.5px]',
            verdict.visible ? 'bg-signal-deep text-signal' : 'bg-amber-deep text-amber',
          )}
        >
          {verdict.visible ? <Eye className="size-3" aria-hidden="true" /> : <EyeOff className="size-3" aria-hidden="true" />}
          {verdict.visible ? 'Visible' : 'Not visible'}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-px font-mono text-[10.5px]',
            verdict.interactive ? 'bg-signal-deep text-signal' : 'bg-elevated text-ink-mute',
          )}
        >
          {verdict.interactive ? <MousePointer2 className="size-3" aria-hidden="true" /> : <MousePointerClick className="size-3" aria-hidden="true" />}
          {verdict.interactive ? 'Clickable' : 'Not clickable'}
        </span>
      </div>
      {(verdict.reasons.length > 0 || verdict.blockers.length > 0) && (
        <ul className="space-y-0.5 border-b border-line/70 px-3 py-2 text-[11.5px] text-amber">
          {verdict.reasons.map((r) => (
            <li key={r}>Hidden by: {r}</li>
          ))}
          {verdict.blockers.map((r) => (
            <li key={r} className="text-ink-soft">
              Blocked by: {r}
            </li>
          ))}
        </ul>
      )}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-3 py-2 font-mono text-[11px]">
        {Object.entries(info.computed).map(([prop, value]) => (
          <div key={prop} className="flex min-w-0 justify-between gap-2">
            <dt className="truncate text-ink-mute">{prop}</dt>
            <dd className="truncate text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * CSS tab: computed visibility, editable element.style, editable matched
 * rules, live stylesheet source, and reset-to-original.
 */
export function CssPanel({ rules, selectedNode, probe, onEdit, onResetStyles, stylesDirty }) {
  const [view, setView] = useState('styles')
  const listId = useId()
  const source = useMemo(() => serializeRules(rules, { comments: true }), [rules])
  const element = selectedNode && isElement(selectedNode) ? selectedNode : null
  const info = element ? probe?.selected : null
  const verdict = element ? probe?.nodes?.[element.uid] : null
  const matched = info ? rules.filter((r) => info.matched.includes(r.id)).reverse() : []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <datalist id={listId}>
        {CSS_PROPERTY_LIST.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <SegmentedControl
          size="sm"
          label="CSS view"
          value={view}
          onChange={setView}
          options={[
            { value: 'styles', label: 'Styles' },
            { value: 'source', label: 'Stylesheet' },
          ]}
        />
        <button
          type="button"
          onClick={onResetStyles}
          disabled={!stylesDirty}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-ink-soft transition hover:bg-raised hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          title="Restore every CSS rule and inline style to the original"
        >
          <RotateCcw className="size-3" aria-hidden="true" /> Reset CSS
        </button>
      </div>

      {view === 'styles' ? (
        <div className="min-h-0 flex-1 space-y-2.5 overflow-auto p-3">
          {!element ? (
            <p className="text-[12px] text-ink-mute">Select an element to see and edit the CSS that applies to it.</p>
          ) : (
            <>
              <ComputedCard verdict={verdict} info={info} />
              <ul className="space-y-2.5">
                <DeclarationBlock
                  title="element.style"
                  subtitle={element.lock ? 'locked' : 'inline'}
                  declarations={element.style}
                  target={{ uid: element.uid }}
                  locked={Boolean(element.lock)}
                  onEdit={onEdit}
                  listId={listId}
                />
                {matched.map((rule) => (
                  <DeclarationBlock
                    key={rule.id}
                    title={rule.selector}
                    subtitle={rule.comment ? `/* ${rule.comment} */` : 'stylesheet'}
                    declarations={rule.declarations}
                    target={{ ruleId: rule.id }}
                    onEdit={onEdit}
                    listId={listId}
                  />
                ))}
              </ul>
              {matched.length === 0 && <p className="text-[12px] text-ink-mute">No stylesheet rules match {nodeLabel(element)}.</p>}
              <p className="text-[11px] leading-snug text-ink-faint">
                Press Enter to apply. Values are validated by the browser engine; url(), @-rules, var() and attr() are blocked.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <Suspense fallback={<p className="p-4 font-mono text-xs text-ink-mute">Loading editor...</p>}>
            <CodeView value={source} language="css" label="Current stylesheet (read-only view; edit in Styles)" />
          </Suspense>
        </div>
      )}
    </div>
  )
}
