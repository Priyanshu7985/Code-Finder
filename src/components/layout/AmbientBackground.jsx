import { useSettings } from '../../context/SettingsContext'
import { cn } from '../../lib/cn'

/**
 * Fixed atmospheric backdrop: grid, soft light pools, vignette and an
 * optional slow scan line. Decorative layers carry the `ambient` class
 * so the "Interface ambience: Off" setting removes them entirely.
 */
export function AmbientBackground({ intensity = 'normal' }) {
  const { ambience } = useSettings()
  const animated = ambience === 'full'

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base" aria-hidden="true">
      <div className={cn('bg-grid absolute inset-0', intensity === 'low' ? 'opacity-50' : 'opacity-100')} />
      <div
        className="ambient absolute -top-1/3 left-1/2 h-[80vh] w-[110vw] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(92 242 168 / 0.07), transparent)' }}
      />
      <div
        className="ambient absolute -right-1/4 bottom-[-30%] h-[70vh] w-[70vw] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(98 214 238 / 0.06), transparent)' }}
      />
      <div className="ambient bg-scanlines absolute inset-0 opacity-60" />
      {animated && (
        <div className="ambient absolute inset-x-0 top-0 h-40 animate-scan bg-gradient-to-b from-transparent via-signal/[0.035] to-transparent" />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgb(3 4 5 / 0.85) 100%)' }}
      />
    </div>
  )
}
