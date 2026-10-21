import { useState } from 'react'
import { Eye, EyeOff, Lock, MousePointerClick, Plus, X } from 'lucide-react'
import { DomTree } from './DomTree'
import { InlineInput } from '../../ui/InlineInput'
import { isComment, isElement, nodeLabel, textOf, hasEditableText } from '../../../game/simulation/tree'
import { BOOLEAN_ATTRIBUTES } from '../../../game/simulation/policy'
import { cn } from '../../../lib/cn'

const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
    <h3 className="font-mono text-[10px] tracking-[0.14em] text-ink-mute uppercase">{children}</h3>
    {right}
  </div>
)

function AddAttribute({ onAdd, disabled }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  return (
    <form
      className="flex items-center gap-1.5 px-3 pb-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (onAdd(name, value)) {
          setName('')
          setValue('')
        }
      }}
    >
      <label className="sr-only" htmlFor="new-attr-name">New attribute name</label>
      <input
        id="new-attr-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={disabled}
        placeholder="name"
        spellCheck={false}
        autoComplete="off"
        className="h-7 w-[38%] min-w-0 rounded border border-line-strong bg-panel px-2 font-mono text-[12px] text-ink placeholder:text-ink-faint focus:border-cyan-dim focus:outline-none disabled:opacity-50"
      />
      <label className="sr-only" htmlFor="new-attr-value">New attribute value</label>
      <input
        id="new-attr-value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="value"
        spellCheck={false}
        autoComplete="off"
        className="h-7 min-w-0 flex-1 rounded border border-line-strong bg-panel px-2 font-mono text-[12px] text-ink placeholder:text-ink-faint focus:border-cyan-dim focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !name.trim()}
        className="grid size-7 shrink-0 place-items-center rounded border border-line-strong text-ink-soft transition hover:border-signal-dim hover:text-signal disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-ink-soft"
        aria-label="Add attribute"
      >
        <Plus className="size-3.5" />
      </button>
    </form>
  )
}

function ElementProperties({ node, verdict, onEdit }) {
  const locked = Boolean(node.lock)
  const attrs = Object.entries(node.attrs)
  const editableText = hasEditableText(node)
  const text = textOf(node)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <span className="truncate font-mono text-[12px] text-cyan">{nodeLabel(node)}</span>
        {verdict && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-px font-mono text-[10px]',
              verdict.visible ? 'bg-signal-deep text-signal' : 'bg-amber-deep text-amber',
            )}
            title={verdict.reasons.join(', ')}
          >
            {verdict.visible ? <Eye className="size-3" aria-hidden="true" /> : <EyeOff className="size-3" aria-hidden="true" />}
            {verdict.visible ? 'rendered' : 'not rendered'}
          </span>
        )}
        {locked && (
          <span className="inline-flex items-center gap-1 rounded bg-elevated px-1.5 py-px font-mono text-[10px] text-ink-mute">
            <Lock className="size-3" aria-hidden="true" /> locked
          </span>
        )}
      </div>

      {editableText && (
        <>
          <SectionTitle>Text content</SectionTitle>
          <div className="px-2 pb-1">
            <InlineInput
              key={`${node.uid}:${text}`}
              value={text}
              disabled={locked}
              aria-label="Text content"
              className="w-full border-line bg-panel py-1"
              onCommit={(v) => onEdit({ type: 'text', uid: node.uid, value: v })}
            />
          </div>
        </>
      )}

      <SectionTitle>Attributes</SectionTitle>
      {attrs.length === 0 ? (
        <p className="px-3 pb-2 text-[12px] text-ink-mute">No attributes.</p>
      ) : (
        <dl className="pb-1 font-mono text-[12px]">
          {attrs.map(([name, value]) => (
            <div key={name} className="group grid grid-cols-[minmax(0,38%)_1fr_auto] items-center gap-1 px-2 py-0.5 hover:bg-raised/60">
              <dt className="truncate px-1 text-ink-soft" title={name}>
                {name}
              </dt>
              <dd className="min-w-0">
                {BOOLEAN_ATTRIBUTES.has(name) ? (
                  <span className="px-1 text-[11px] text-ink-mute italic">boolean · present</span>
                ) : (
                  <InlineInput
                    key={`${node.uid}:${name}:${value}`}
                    value={String(value)}
                    disabled={locked}
                    aria-label={`Value of ${name}`}
                    className="w-full text-signal"
                    onCommit={(v) => onEdit({ type: 'attr:set', uid: node.uid, name, value: v })}
                  />
                )}
              </dd>
              <button
                type="button"
                disabled={locked}
                onClick={() => onEdit({ type: 'attr:remove', uid: node.uid, name })}
                className="grid size-6 place-items-center rounded text-ink-faint transition hover:bg-danger-deep hover:text-danger disabled:invisible"
                aria-label={`Remove attribute ${name}`}
                title="Remove attribute"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </dl>
      )}
      <AddAttribute
        disabled={locked}
        onAdd={(name, value) => onEdit({ type: 'attr:set', uid: node.uid, name, value })}
      />
    </div>
  )
}

/** HTML tab: element tree + editable properties of the selection. */
export function HtmlPanel({ tree, selectedNode, collapsed, probe, onToggle, onSelect, onEdit }) {
  const verdict = selectedNode ? probe?.nodes?.[selectedNode.uid] : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <DomTree tree={tree} selectedUid={selectedNode?.uid ?? null} collapsed={collapsed} probe={probe} onToggle={onToggle} onSelect={onSelect} />
      </div>

      <div className="max-h-[52%] min-h-[30%] shrink-0 overflow-auto border-t border-line bg-base/50">
        {!selectedNode ? (
          <p className="flex items-center gap-2 px-3 py-3 text-[12px] text-ink-mute">
            <MousePointerClick className="size-3.5" aria-hidden="true" />
            Select an element in the tree, or use Pick element in the browser.
          </p>
        ) : isComment(selectedNode) ? (
          <div className="px-3 py-3">
            <p className="font-mono text-[10px] tracking-[0.14em] text-ink-mute uppercase">HTML comment</p>
            <p className="mt-2 font-mono text-[12px] leading-5 text-signal-dim italic">{selectedNode.comment.trim()}</p>
            <p className="mt-2 text-[12px] text-ink-mute">Comments are never rendered, but every visitor downloads them.</p>
          </div>
        ) : isElement(selectedNode) ? (
          <ElementProperties node={selectedNode} verdict={verdict} onEdit={onEdit} />
        ) : null}
      </div>
    </div>
  )
}
