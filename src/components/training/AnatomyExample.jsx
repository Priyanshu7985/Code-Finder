import { useState } from 'react'
import { cn } from '../../lib/cn'

const PARTS = {
  open: { label: 'Opening tag', text: 'Starts the element and names its type. Here, a button.' },
  attrName: { label: 'Attribute name', text: 'Extra information attached to the element. class is used by CSS to style it.' },
  attrValue: { label: 'Attribute value', text: 'The value assigned to an attribute, always in quotes.' },
  data: { label: 'data-* attribute', text: 'Custom data for scripts. Browsers never display it, but anyone inspecting the page can read it.' },
  content: { label: 'Content', text: 'What the visitor actually sees on screen.' },
  close: { label: 'Closing tag', text: 'Ends the element. Everything between the tags belongs to it.' },
}

function Part({ id, active, onActivate, className, children }) {
  return (
    <button
      type="button"
      onMouseEnter={() => onActivate(id)}
      onFocus={() => onActivate(id)}
      onClick={() => onActivate(id)}
      aria-pressed={active === id}
      className={cn(
        'rounded px-0.5 transition-colors',
        active === id ? 'bg-cyan-deep ring-1 ring-cyan-dim' : 'hover:bg-raised',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function AnatomyExample() {
  const [active, setActive] = useState('open')
  const p = { active, onActivate: setActive }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
      <div className="rounded-lg border border-line bg-base/70 p-4">
        <p className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-ink-mute uppercase">Source · hover or tab through parts</p>
        <code className="block font-mono text-[13px] leading-7 break-words">
          <Part id="open" {...p} className="text-cyan">
            &lt;button
          </Part>{' '}
          <Part id="attrName" {...p} className="text-ink-soft">
            class
          </Part>
          =
          <Part id="attrValue" {...p} className="text-signal">
            &quot;pay-btn&quot;
          </Part>{' '}
          <Part id="data" {...p} className="text-amber">
            data-discount=&quot;FREE100&quot;
          </Part>
          <span className="text-cyan">&gt;</span>
          <Part id="content" {...p} className="text-ink">
            Pay now
          </Part>
          <Part id="close" {...p} className="text-cyan">
            &lt;/button&gt;
          </Part>
        </code>
        <div className="mt-4 rounded-md border border-line bg-panel p-3" aria-live="polite">
          <p className="text-[13px] font-medium text-ink">{PARTS[active].label}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{PARTS[active].text}</p>
        </div>
      </div>
      <div className="flex flex-col rounded-lg border border-line bg-white p-4">
        <p className="mb-3 font-mono text-[10.5px] tracking-[0.14em] text-slate-500 uppercase">Rendered</p>
        <div className="grid flex-1 place-items-center">
          <span className="rounded-md bg-[#23408e] px-4 py-2 text-sm font-semibold text-white">Pay now</span>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">The discount code is invisible here.</p>
      </div>
    </div>
  )
}
