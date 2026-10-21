import { useState } from 'react'
import { SegmentedControl } from '../ui/SegmentedControl'

const MODES = {
  visible: { label: 'Default', css: '/* no hiding rule */', style: {}, layout: 'Takes space', interactive: 'Yes' },
  display: { label: 'display', css: 'display: none;', style: { display: 'none' }, layout: 'Removed from layout', interactive: 'No' },
  visibility: { label: 'visibility', css: 'visibility: hidden;', style: { visibility: 'hidden' }, layout: 'Space kept', interactive: 'No' },
  opacity: { label: 'opacity', css: 'opacity: 0;', style: { opacity: 0 }, layout: 'Space kept', interactive: 'Yes, while invisible' },
}

export function VisibilityExample() {
  const [mode, setMode] = useState('display')
  const m = MODES[mode]

  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Hiding technique"
        value={mode}
        onChange={setMode}
        options={Object.entries(MODES).map(([value, { label }]) => ({ value, label }))}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-base/70 p-4 font-mono text-[13px] leading-6">
          <span className="text-cyan">.exit-btn</span> <span className="text-ink-mute">{'{'}</span>
          <div className="pl-4 text-signal">{m.css}</div>
          <span className="text-ink-mute">{'}'}</span>
          <dl className="mt-4 grid grid-cols-2 gap-2 font-sans text-[12px]">
            <div className="rounded-md border border-line bg-panel p-2">
              <dt className="text-ink-mute">Layout</dt>
              <dd className="mt-0.5 text-ink">{m.layout}</dd>
            </div>
            <div className="rounded-md border border-line bg-panel p-2">
              <dt className="text-ink-mute">Clickable</dt>
              <dd className="mt-0.5 text-ink">{m.interactive}</dd>
            </div>
            <div className="col-span-2 rounded-md border border-signal-dim/40 bg-signal-deep/60 p-2">
              <dt className="text-ink-mute">Still in the HTML?</dt>
              <dd className="mt-0.5 text-signal">Yes, in every case</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 text-slate-800">
          <p className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-slate-500 uppercase">Rendered</p>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 p-3">
            <span className="rounded bg-slate-200 px-3 py-1.5 text-sm">Continue</span>
            <span className="rounded bg-rose-600 px-3 py-1.5 text-sm font-medium text-white" style={m.style}>
              Exit
            </span>
            <span className="rounded bg-slate-200 px-3 py-1.5 text-sm">Help</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Watch how the neighbouring buttons move, or do not.</p>
        </div>
      </div>
    </div>
  )
}
