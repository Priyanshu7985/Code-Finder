import { memo, useEffect, useRef } from 'react'
import { ChevronRight, EyeOff, Lock } from 'lucide-react'
import { isComment, isElement, isText } from '../../../game/simulation/tree'
import { serializeInline } from '../../../game/simulation/css'
import { VOID_TAGS } from '../../../game/simulation/safety'
import { cn } from '../../../lib/cn'

function Attr({ name, value }) {
  return (
    <span>
      {' '}
      <span className="text-ink-soft">{name}</span>
      {value !== '' && (
        <>
          <span className="text-ink-mute">=&quot;</span>
          <span className="text-signal">{value}</span>
          <span className="text-ink-mute">&quot;</span>
        </>
      )}
    </span>
  )
}

/** Syntax-coloured opening tag: <tag attr="value"> */
function OpenTag({ node, selfClose }) {
  return (
    <>
      <span className="text-ink-mute">&lt;</span>
      <span className="text-cyan">{node.tag}</span>
      {Object.entries(node.attrs).map(([name, value]) => (
        <Attr key={name} name={name} value={String(value)} />
      ))}
      {node.style?.length > 0 && <Attr name="style" value={serializeInline(node.style)} />}
      <span className="text-ink-mute">{selfClose ? ' />' : '>'}</span>
    </>
  )
}

const CloseTag = ({ tag }) => (
  <>
    <span className="text-ink-mute">&lt;/</span>
    <span className="text-cyan">{tag}</span>
    <span className="text-ink-mute">&gt;</span>
  </>
)

const isInlineText = (node) => node.children.length === 1 && isText(node.children[0]) && node.children[0].text.length < 48
const pad = (depth, extra = 0) => ({ paddingLeft: `${depth * 14 + 8 + extra}px` })

const TreeNode = memo(function TreeNode({ node, depth, selectedUid, collapsed, probe, onToggle, onSelect }) {
  if (isText(node)) {
    if (!node.text.trim()) return null
    return (
      <li className="py-px pr-2 font-mono text-[12px] leading-5 [overflow-wrap:anywhere] text-ink" style={pad(depth, 14)}>
        {node.text}
      </li>
    )
  }

  if (isComment(node)) {
    const selected = node.uid === selectedUid
    return (
      <li style={pad(depth, 14)} className={cn('pr-2', selected ? 'bg-cyan-deep/80 shadow-[inset_2px_0_0_var(--color-cyan)]' : 'hover:bg-raised')}>
        <button
          type="button"
          onClick={() => onSelect(node.uid)}
          aria-current={selected ? 'true' : undefined}
          className="py-px text-left font-mono text-[12px] leading-5 [overflow-wrap:anywhere] text-signal-dim italic"
        >
          &lt;!--{node.comment}--&gt;
        </button>
      </li>
    )
  }

  if (!isElement(node)) return null

  const selected = node.uid === selectedUid
  const isVoid = VOID_TAGS.has(node.tag)
  const inline = !isVoid && isInlineText(node)
  const expandable = !isVoid && !inline && node.children.length > 0
  const open = expandable && !collapsed.has(node.uid)
  const verdict = probe?.nodes?.[node.uid]
  const hidden = verdict && !verdict.visible

  return (
    <li>
      <div
        data-tree-uid={node.uid}
        className={cn(
          'group flex items-start pr-2 font-mono text-[12px] leading-5',
          selected ? 'bg-cyan-deep/80 shadow-[inset_2px_0_0_var(--color-cyan)]' : 'hover:bg-raised',
          hidden && !selected && 'opacity-55',
        )}
        style={pad(depth)}
      >
        {expandable ? (
          <button
            type="button"
            onClick={() => onToggle(node.uid)}
            className="mt-0.5 mr-0.5 grid size-4 shrink-0 place-items-center rounded text-ink-mute hover:text-ink"
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.tag}`}
            aria-expanded={open}
          >
            <ChevronRight className={cn('size-3 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="mr-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <button type="button" onClick={() => onSelect(node.uid)} aria-current={selected ? 'true' : undefined} className="min-w-0 flex-1 py-px text-left [overflow-wrap:anywhere]">
          <OpenTag node={node} selfClose={isVoid} />
          {inline && (
            <>
              <span className="text-ink">{node.children[0].text}</span>
              <CloseTag tag={node.tag} />
            </>
          )}
          {expandable && !open && (
            <>
              <span className="mx-0.5 rounded bg-elevated px-1 text-ink-mute">…</span>
              <CloseTag tag={node.tag} />
            </>
          )}
          {hidden && <span className="sr-only"> (not rendered)</span>}
        </button>
        <span className="mt-1 ml-1 flex shrink-0 gap-1 text-ink-faint">
          {hidden && <EyeOff className="size-3" aria-hidden="true" />}
          {node.lock && <Lock className="size-3" aria-hidden="true" />}
        </span>
      </div>
      {open && (
        <>
          <ul>
            {node.children.map((child) => (
              <TreeNode
                key={child.uid}
                node={child}
                depth={depth + 1}
                selectedUid={selectedUid}
                collapsed={collapsed}
                probe={probe}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </ul>
          <div className="pr-2 font-mono text-[12px] leading-5" style={pad(depth, 18)}>
            <CloseTag tag={node.tag} />
          </div>
        </>
      )}
    </li>
  )
})

/**
 * DevTools-style element tree for a simulated page. Reused by the
 * workspace HTML panel and the Training Lab. Elements that are not
 * rendered are dimmed, as in real developer tools.
 */
export function DomTree({ tree, selectedUid, collapsed, probe, onToggle, onSelect, className }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!selectedUid || !ref.current) return
    const row = ref.current.querySelector(`[data-tree-uid="${CSS.escape(selectedUid)}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selectedUid])

  return (
    <div ref={ref} className={cn('py-2', className)}>
      <ul aria-label="Document tree">
        <TreeNode node={tree} depth={0} selectedUid={selectedUid} collapsed={collapsed} probe={probe} onToggle={onToggle} onSelect={onSelect} />
      </ul>
    </div>
  )
}
