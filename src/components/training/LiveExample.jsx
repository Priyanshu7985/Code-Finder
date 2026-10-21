import { useMemo, useState } from 'react'
import { SandboxFrame } from '../game/workspace/SandboxFrame'
import { Toggle } from '../ui/Toggle'
import { SegmentedControl } from '../ui/SegmentedControl'
import { h, indexTree } from '../../game/simulation/tree'
import { normalizeRules, serializeRules } from '../../game/simulation/css'

const ACCENTS = { blue: '#23408e', green: '#0f7a4f', crimson: '#a3123a' }

/** Edits a small page model through constrained controls and re-renders it. */
export function LiveExample() {
  const [showBanner, setShowBanner] = useState(false)
  const [accent, setAccent] = useState('blue')
  const [heading, setHeading] = useState('Members area')

  const tree = useMemo(
    () =>
      indexTree(
        h(
          'div',
          { class: 'shell' },
          h('div', { class: showBanner ? 'banner' : 'banner hidden' }, 'Maintenance tonight at 22:00'),
          h('h3', { class: 'heading' }, heading),
          h('button', { class: 'cta', type: 'button' }, 'Open dashboard'),
        ),
      ),
    [showBanner, heading],
  )

  const rules = useMemo(
    () =>
      normalizeRules([
        { selector: '.shell', declarations: { padding: '16px', color: '#1d2433' } },
        { selector: '.banner', declarations: { background: '#fff7e6', color: '#8a5a00', 'font-size': '12px', padding: '6px 10px', 'border-radius': '6px', 'margin-bottom': '10px' } },
        { selector: '.hidden', declarations: { display: 'none' } },
        { selector: '.heading', declarations: { margin: '0 0 10px', 'font-size': '18px' } },
        { selector: '.cta', declarations: { background: ACCENTS[accent], color: '#ffffff', border: 'none', padding: '8px 12px', 'border-radius': '6px', 'font-size': '13px' } },
      ]),
    [accent],
  )

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4 rounded-lg border border-line bg-base/70 p-4">
        <Toggle checked={showBanner} onChange={setShowBanner} label="Remove .hidden from banner" description="Changes the element's class attribute." />
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Button colour</p>
          <SegmentedControl size="sm" label="Button colour" value={accent} onChange={setAccent} options={Object.keys(ACCENTS).map((k) => ({ value: k, label: k }))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Heading text</p>
          <SegmentedControl
            size="sm"
            label="Heading text"
            value={heading}
            onChange={setHeading}
            options={['Members area', 'Welcome back', 'Restricted'].map((v) => ({ value: v, label: v }))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-36 overflow-hidden rounded-lg border border-line bg-white">
          <SandboxFrame title="Live example page" className="size-full border-0" tree={tree} rules={rules} />
        </div>
        <pre className="max-h-40 overflow-auto rounded-lg border border-line bg-base/70 p-3 font-mono text-[11px] leading-5 text-ink-soft">
          {serializeRules(rules.filter((r) => r.selector === '.cta' || r.selector === '.hidden'))}
        </pre>
      </div>
    </div>
  )
}
