import { PROGRESSION_CONFIG } from './config'

/**
 * Deterministic run scoring. Pure functions only: same inputs, same
 * outputs, no clock or randomness, so results are reproducible in tests.
 *
 * Inputs come from the trusted session (hints revealed, rejected
 * submissions, measured time), never from editable page content.
 */

export const baseXpFor = (mission, config = PROGRESSION_CONFIG) => config.baseXp[mission.difficulty] ?? 0

/** Speed bonus for a run, 0..speedMax. Missions without a target time are not eligible. */
export function speedBonus(seconds, targetSeconds, config = PROGRESSION_CONFIG) {
  if (!targetSeconds || !Number.isFinite(seconds) || seconds < 0) return 0
  const full = targetSeconds * config.speed.fullAt
  if (seconds <= full) return config.bonuses.speedMax
  if (seconds >= targetSeconds) return 0
  const ratio = (targetSeconds - seconds) / (targetSeconds - full)
  return Math.round(config.bonuses.speedMax * ratio)
}

/** Performance score 0..max used for personal bests. */
export function performanceScore({ hintsUsed, failures, seconds, targetSeconds }, config = PROGRESSION_CONFIG) {
  const s = config.score
  let score = s.max - hintsUsed * s.perHint - failures * s.perFailure
  if (targetSeconds && seconds > targetSeconds) {
    const over = Math.min((seconds - targetSeconds) / (targetSeconds * s.slowWindow), 1)
    score -= Math.round(s.slowMax * over)
  }
  return Math.max(s.min, Math.min(s.max, Math.round(score)))
}

/**
 * Full breakdown for a validated run.
 * @returns {{ base, bonuses: {id,label,xp}[], potentialXp, score, withinTarget }}
 */
export function scoreRun({ mission, hintsUsed = 0, failures = 0, seconds = 0 }, config = PROGRESSION_CONFIG) {
  const base = baseXpFor(mission, config)
  const bonuses = []
  if (failures === 0) bonuses.push({ id: 'first-attempt', label: 'First-attempt completion', xp: config.bonuses.firstAttempt })
  if (hintsUsed === 0) bonuses.push({ id: 'no-hints', label: 'No hints used', xp: config.bonuses.noHints })
  const speed = speedBonus(seconds, mission.targetSeconds, config)
  if (speed > 0) bonuses.push({ id: 'speed', label: 'Speed bonus', xp: speed })

  return {
    base,
    bonuses,
    potentialXp: base + bonuses.reduce((sum, b) => sum + b.xp, 0),
    score: performanceScore({ hintsUsed, failures, seconds, targetSeconds: mission.targetSeconds }, config),
    withinTarget: Boolean(mission.targetSeconds) && seconds <= mission.targetSeconds,
  }
}

/** Maximum XP a mission can award on first completion (for mission cards). */
export function maxXpFor(mission, config = PROGRESSION_CONFIG) {
  const b = config.bonuses
  return baseXpFor(mission, config) + b.firstAttempt + b.noHints + (mission.targetSeconds ? b.speedMax : 0)
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
