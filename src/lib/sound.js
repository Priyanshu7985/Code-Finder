/**
 * Tiny synthesized sound-effect engine (Web Audio API).
 * No audio assets are shipped; every cue is generated from oscillators so
 * the bundle stays small and deterministic.
 */

let ctx = null
let enabled = true

const CUES = {
  click: [{ f: 880, d: 0.035, type: 'square', g: 0.025 }],
  hover: [{ f: 1320, d: 0.02, type: 'sine', g: 0.012 }],
  open: [
    { f: 520, d: 0.05, type: 'triangle', g: 0.04 },
    { f: 780, d: 0.06, type: 'triangle', g: 0.035, at: 0.045 },
  ],
  back: [
    { f: 660, d: 0.05, type: 'triangle', g: 0.035 },
    { f: 440, d: 0.06, type: 'triangle', g: 0.03, at: 0.045 },
  ],
  success: [
    { f: 660, d: 0.08, type: 'triangle', g: 0.05 },
    { f: 880, d: 0.08, type: 'triangle', g: 0.05, at: 0.08 },
    { f: 1320, d: 0.16, type: 'triangle', g: 0.045, at: 0.16 },
  ],
  error: [
    { f: 220, d: 0.09, type: 'sawtooth', g: 0.03 },
    { f: 165, d: 0.12, type: 'sawtooth', g: 0.03, at: 0.09 },
  ],
  boot: [
    { f: 110, d: 0.25, type: 'sine', g: 0.05 },
    { f: 220, d: 0.2, type: 'sine', g: 0.035, at: 0.12 },
  ],
  type: [{ f: 1800, d: 0.012, type: 'square', g: 0.008 }],
}

function getContext() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  // Browsers block audio before the first user gesture; skip instead of warning.
  if (!ctx && navigator.userActivation && !navigator.userActivation.hasBeenActive) return null
  if (!ctx) {
    try {
      ctx = new AC()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

export function setSoundEnabled(value) {
  enabled = Boolean(value)
}

/** Play a named cue. Silently no-ops when muted or audio is unavailable. */
export function playSound(name) {
  if (!enabled) return
  const cue = CUES[name]
  if (!cue) return
  const ac = getContext()
  if (!ac) return
  const now = ac.currentTime
  for (const tone of cue) {
    try {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      const start = now + (tone.at ?? 0)
      osc.type = tone.type
      osc.frequency.setValueAtTime(tone.f, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(tone.g, start + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.d)
      osc.connect(gain).connect(ac.destination)
      osc.start(start)
      osc.stop(start + tone.d + 0.02)
    } catch {
      return
    }
  }
}
