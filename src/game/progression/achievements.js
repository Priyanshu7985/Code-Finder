import { ACHIEVEMENTS } from '../../data/achievements'

/**
 * Reusable achievement engine.
 *
 * Unlocks are stored as { unlockedAt, seen } and are permanent: once an id
 * is in `profile.achievements` it is never awarded again, which makes
 * evaluation idempotent no matter how often it runs.
 */

export function evaluateAchievements(profile, game, now, definitions = ACHIEVEMENTS) {
  const unlocked = []
  let achievements = profile.achievements
  for (const def of definitions) {
    if (achievements[def.id]) continue
    let met = false
    try {
      met = Boolean(def.condition(profile, game))
    } catch {
      met = false
    }
    if (met) {
      if (achievements === profile.achievements) achievements = { ...achievements }
      achievements[def.id] = { unlockedAt: now, seen: false }
      unlocked.push(def.id)
    }
  }
  return { profile: unlocked.length ? { ...profile, achievements } : profile, unlocked }
}

/**
 * Display model for the UI.
 * state: 'new' (unlocked, not yet viewed) | 'unlocked' | 'locked' | 'secret'
 */
export function achievementViews(profile, definitions = ACHIEVEMENTS) {
  return definitions.map((def) => {
    const record = profile.achievements[def.id]
    const state = record ? (record.seen ? 'unlocked' : 'new') : def.secret ? 'secret' : 'locked'
    return {
      id: def.id,
      name: state === 'secret' ? 'Classified' : def.name,
      description: state === 'secret' ? 'Unlock to reveal.' : def.description,
      icon: def.icon,
      state,
      unlockedAt: record?.unlockedAt ?? null,
    }
  })
}

export function markAchievementsSeen(profile) {
  const entries = Object.entries(profile.achievements)
  if (!entries.some(([, r]) => !r.seen)) return profile
  return { ...profile, achievements: Object.fromEntries(entries.map(([id, r]) => [id, { ...r, seen: true }])) }
}

export const getAchievement = (id, definitions = ACHIEVEMENTS) => definitions.find((a) => a.id === id) ?? null
