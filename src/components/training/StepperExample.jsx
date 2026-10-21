import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { cn } from '../../lib/cn'

const CODE = [
  'function checkPassword(input) {',
  '  const parts = ["open", "sesame"]',
  '  const secret = parts.join("-")',
  '  if (input === secret) {',
  '    return "ACCESS GRANTED"',
  '  }',
  '  return "ACCESS DENIED"',
  '}',
]

/** Deterministic trace for each sample input. Nothing is executed. */
function buildTrace(input) {
  const ok = input === 'open-sesame'
  return [
    { line: 0, vars: { input: `"${input}"` }, note: 'The function receives what the visitor typed.' },
    { line: 1, vars: { input: `"${input}"`, parts: '["open", "sesame"]' }, note: 'The secret is built from pieces stored right in the code.' },
    { line: 2, vars: { input: `"${input}"`, parts: '["open", "sesame"]', secret: '"open-sesame"' }, note: 'Anyone reading this script now knows the password.' },
    { line: 3, vars: { input: `"${input}"`, secret: '"open-sesame"', 'input === secret': String(ok) }, note: 'The comparison happens in the browser.' },
    ok
      ? { line: 4, vars: { result: '"ACCESS GRANTED"' }, note: 'Correct input. Access granted.' }
      : { line: 6, vars: { result: '"ACCESS DENIED"' }, note: 'Wrong input. Access denied.' },
  ]
}

export function StepperExample() {
  const [input, setInput] = useState('letmein')
  const [step, setStep] = useState(0)
  const trace = buildTrace(input)
  const current = trace[step]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] text-ink-mute">Visitor types:</span>
        <SegmentedControl
          size="sm"
          label="Sample input"
          value={input}
          onChange={(v) => {
            setInput(v)
            setStep(0)
          }}
          options={[
            { value: 'letmein', label: '"letmein"' },
            { value: 'open-sesame', label: '"open-sesame"' },
          ]}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <pre className="overflow-x-auto rounded-lg border border-line bg-base/70 py-3 font-mono text-[12.5px] leading-6">
          {CODE.map((text, i) => (
            <div key={i} className={cn('flex px-3', i === current.line ? 'bg-cyan-deep/80 shadow-[inset_2px_0_0_var(--color-cyan)]' : '')}>
              <span className="mr-4 w-4 shrink-0 text-right text-ink-faint select-none">{i + 1}</span>
              <span className={i === current.line ? 'text-ink' : 'text-ink-soft'}>{text}</span>
            </div>
          ))}
        </pre>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-line bg-panel p-3">
            <p className="font-mono text-[10.5px] tracking-[0.14em] text-ink-mute uppercase">Variables</p>
            <dl className="mt-2 space-y-1 font-mono text-[12px]">
              {Object.entries(current.vars).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="truncate text-signal">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft" aria-live="polite">
            {current.note}
          </p>
          <div className="mt-auto flex items-center gap-2">
            <Button size="icon" icon={ChevronLeft} onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} aria-label="Previous step" />
            <Button size="sm" variant="cyan" iconRight={ChevronRight} onClick={() => setStep((s) => Math.min(s + 1, trace.length - 1))} disabled={step === trace.length - 1} className="flex-1">
              Step {step + 1}/{trace.length}
            </Button>
            <Button size="icon" variant="ghost" icon={RotateCcw} onClick={() => setStep(0)} aria-label="Restart walkthrough" />
          </div>
        </div>
      </div>
    </div>
  )
}
