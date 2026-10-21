import { prerequisitesMet } from '../progression/profile'

/**
 * Mission availability, derived from the player profile.
 * Unlocks are never stored as truth: they are recomputed from validated
 * completions, so a save cannot unlock a mission its rules forbid.
 */

export const MISSION_STATE = {
  completed: 'completed',
  inProgress: 'in-progress',
  available: 'available',
  locked: 'locked',
  inDevelopment: 'in-development',
}

export { prerequisitesMet }

export function getMissionState(mission, profile) {
  if ((profile.missions[mission.id]?.completions ?? 0) > 0) return MISSION_STATE.completed
  if (!prerequisitesMet(mission, profile)) return MISSION_STATE.locked
  if (!mission.implemented) return MISSION_STATE.inDevelopment
  const run = profile.inProgress[mission.id]
  if (run && (run.completed.length > 0 || run.seconds > 0)) return MISSION_STATE.inProgress
  return MISSION_STATE.available
}

export const isPlayable = (mission, profile) => mission.implemented && prerequisitesMet(mission, profile)

/** Human-readable reason a mission cannot be played. */
export function lockReason(mission, profile, getMission) {
  const missing = mission.unlock.requires.filter((id) => !((profile.missions[id]?.completions ?? 0) > 0))
  if (missing.length) return `Complete ${missing.map((id) => getMission(id)?.title ?? id).join(' and ')} to unlock.`
  if (!mission.implemented) return 'Scenario in development. Arrives in an upcoming build.'
  return ''
}
