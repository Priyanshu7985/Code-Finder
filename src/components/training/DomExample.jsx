import { useCallback, useMemo, useState } from 'react'
import { DomTree } from '../game/workspace/DomTree'
import { SandboxFrame } from '../game/workspace/SandboxFrame'
import { h, comment, indexTree, findByUid, nodeLabel } from '../../game/simulation/tree'
import { normalizeRules } from '../../game/simulation/css'

const PAGE = h(
  'article',
  { class: 'post' },
  h('h2', { class: 'title' }, 'Field notes'),
  comment(' draft: publish after review '),
  h('p', { class: 'body' }, 'The DOM is a tree. Every element is a node.'),
  h('ul', { class: 'tags' }, h('li', { class: 'tag' }, 'html'), h('li', { class: 'tag', 'data-internal': 'true' }, 'dom')),
)

const RULES = normalizeRules([
  { selector: '.post', declarations: { padding: '16px', color: '#1d2433' } },
  { selector: '.title', declarations: { margin: '0 0 6px', 'font-size': '18px' } },
  { selector: '.body', declarations: { margin: '0 0 10px', 'font-size': '13px', color: '#4b5563' } },
  { selector: '.tags', declarations: { display: 'flex', gap: '6px', padding: '0', margin: '0', 'list-style': 'none' } },
  { selector: '.tag', declarations: { 'font-size': '11px', padding: '2px 8px', background: '#e8eefc', color: '#23408e', 'border-radius': '99px' } },
])

export function DomExample() {
  const tree = useMemo(() => indexTree(PAGE), [])
  const [selected, setSelected] = useState('0.2')
  const [hovered, setHovered] = useState(null)
  const [collapsed, setCollapsed] = useState(() => new Set())
  const node = findByUid(tree, selected)

  const toggle = useCallback((uid) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="max-h-72 overflow-auto rounded-lg border border-line bg-base/70">
        <DomTree tree={tree} selectedUid={selected} collapsed={collapsed} onToggle={toggle} onSelect={setSelected} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-40 overflow-hidden rounded-lg border border-line bg-white">
          <SandboxFrame
            title="Training example page"
            className="size-full border-0"
            tree={tree}
            rules={RULES}
            selectedUid={selected}
            hoveredUid={hovered}
            picker
            onPick={setSelected}
            onHover={setHovered}
          />
        </div>
        <p className="font-mono text-[12px] text-ink-soft" aria-live="polite">
          Selected: <span className="text-cyan">{node ? nodeLabel(node) : 'none'}</span>
        </p>
        <p className="text-[12px] text-ink-mute">The comment and the data-internal attribute exist in the tree but not on screen.</p>
      </div>
    </div>
  )
}
