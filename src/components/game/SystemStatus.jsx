import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { MISSIONS } from '../../game/missions'

function useUptime() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const t = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/** Small "system status" readout on the main menu. */
export function SystemStatus() {
  const uptime = useUptime()
  const { settings, reducedMotion } = useSettings()
  const live = MISSIONS.filter((m) => m.implemented).length

  const rows = [
    { label: 'Sandbox', value: 'Isolated', tone: 'text-signal' },
    { label: 'Network', value: 'Simulated', tone: 'text-cyan' },
    { label: 'Scenarios live', value: `${live} / ${MISSIONS.length}`, tone: 'text-ink' },
    { label: 'Audio', value: settings.sound ? 'On' : 'Muted', tone: 'text-ink' },
    { label: 'Motion', value: reducedMotion ? 'Reduced' : 'Full', tone: 'text-ink' },
    { label: 'Session', value: uptime, tone: 'text-ink tabular-nums' },
  ]

  return (
    <section className="panel overflow-hidden" aria-labelledby="sys-status-title">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 id="sys-status-title" className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink-mute uppercase">
          <Activity className="size-3.5 text-signal" aria-hidden="true" />
          System status
        </h2>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-signal">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-signal" aria-hidden="true" />
          NOMINAL
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line">
        {rows.map((row) => (
          <div key={row.label} className="bg-panel px-4 py-2.5">
            <dt className="font-mono text-[10px] tracking-wider text-ink-faint uppercase">{row.label}</dt>
            <dd className={`mt-0.5 font-mono text-[13px] ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
