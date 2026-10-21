import { PROGRESSION_CONFIG } from './config'
import { createProfile, emptyMissionStats, prerequisitesMet, unlockedMissionIds } from './profile'
import { scoreRun } from './scoring'
import { evaluateAchievements } from './achievements'
import { ACHIEVEMENT_IDS } from '../../data/achievements'
import { LESSON_IDS } from '../../data/lessons'

/**
 * Versioned save data.
 *
 *   { version: 2, savedAt, profile, unlockedMissions }
 *
 * - Every load validates and sanitizes field by field; anything unknown or
 *   malformed falls back to a safe default instead of crashing.
 * - Older formats are migrated (v1 = the Phase 1/2 progress object).
 * - Writes keep the previous good save in a backup slot, so a failed or
 *   interrupted write can never destroy the last known good progress.
 * - Only game progress is stored: no names, emails or other personal data.
 */

export const SAVE_VERSION = 2
export const SAVE_KEYS = Object.freeze({ main: 'inspecthack.save', backup: 'inspecthack.save.bak', legacyV1: 'inspecthack.progress.v1' })

/* ------------------------------ Validators ------------------------------ */

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const int = (v, d = 0, min = 0, max = 1e9) => (Number.isInteger(v) && v >= min && v <= max ? v : d)
const bool = (v) => v === true
const date = (v) => (typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : null)
const strList = (v, allowed, cap = 500) =>
  Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x.length <= 80 && (!allowed || allowed.includes(x))))].slice(-cap) : []
const nullableInt = (v, max = 1e7) => (Number.isInteger(v) && v >= 0 && v <= max ? v : null)

function sanitizeMissionStats(raw) {
  const base = emptyMissionStats()
  if (!isObj(raw)) return base
  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(isObj)
        .map((h) => ({ at: date(h.at), seconds: int(h.seconds, 0, 0, 1e7), hintsUsed: int(h.hintsUsed, 0, 0, 99), failures: int(h.failures, 0, 0, 1e5), score: int(h.score, 0, 0, 1e5), xp: int(h.xp, 0, 0, 1e5) }))
        .filter((h) => h.at)
        .slice(-PROGRESSION_CONFIG.historyLimit)
    : []
  const completions = int(raw.completions, 0, 0, 1e6)
  return {
    completions,
    firstCompletedAt: completions ? date(raw.firstCompletedAt) : null,
    lastCompletedAt: completions ? date(raw.lastCompletedAt) : null,
    xpEarned: int(raw.xpEarned, 0, 0, 1e6),
    bestScore: completions ? nullableInt(raw.bestScore, 1e5) : null,
    bestSeconds: completions ? nullableInt(raw.bestSeconds) : null,
    noHintClear: completions > 0 && bool(raw.noHintClear),
    speedClear: completions > 0 && bool(raw.speedClear),
    firstAttemptClear: completions > 0 && bool(raw.firstAttemptClear),
    history,
  }
}

function sanitizeRun(raw, missionId) {
  if (!isObj(raw) || typeof raw.runId !== 'string' || !raw.runId.startsWith(`${missionId}#`) || raw.runId.length > 80) return null
  return {
    runId: raw.runId,
    startedAt: date(raw.startedAt),
    completed: strList(raw.completed, null, 20),
    hintsUsed: int(raw.hintsUsed, 0, 0, 99),
    failures: int(raw.failures, 0, 0, 1e5),
    seconds: int(raw.seconds, 0, 0, 1e7),
  }
}

/** Validate a v2 profile. Never throws. */
export function sanitizeProfile(raw, game, now) {
  const fresh = createProfile(now)
  if (!isObj(raw)) return fresh
  const ids = game.missions.map((m) => m.id)

  const missions = {}
  if (isObj(raw.missions)) for (const id of ids) if (isObj(raw.missions[id])) missions[id] = sanitizeMissionStats(raw.missions[id])

  const inProgress = {}
  if (isObj(raw.inProgress)) {
    for (const id of ids) {
      const run = sanitizeRun(raw.inProgress[id], id)
      if (run) inProgress[id] = run
    }
  }

  const achievements = {}
  if (isObj(raw.achievements)) {
    for (const id of ACHIEVEMENT_IDS) {
      const a = raw.achievements[id]
      if (isObj(a) && date(a.unlockedAt)) achievements[id] = { unlockedAt: a.unlockedAt, seen: bool(a.seen) }
    }
  }

  const totals = isObj(raw.totals) ? raw.totals : {}
  const profile = {
    createdAt: date(raw.createdAt) ?? now,
    xp: int(raw.xp, 0, 0, 1e7),
    totals: {
      runs: int(totals.runs, 0),
      completions: int(totals.completions, 0),
      hintsUsed: int(totals.hintsUsed, 0),
      failures: int(totals.failures, 0),
      playSeconds: int(totals.playSeconds, 0, 0, 1e9),
    },
    missions,
    inProgress,
    achievements,
    lessons: strList(raw.lessons, LESSON_IDS),
    lastMissionId: ids.includes(raw.lastMissionId) ? raw.lastMissionId : null,
    ledger: strList(raw.ledger, null, PROGRESSION_CONFIG.ledgerLimit),
    runCounter: int(raw.runCounter, 0),
  }
  // Remove completion records for missions whose prerequisites were never met (inconsistent data).
  for (const m of game.missions) {
    if (profile.missions[m.id]?.completions && !prerequisitesMet(m, profile)) delete profile.missions[m.id]
  }
  // XP can never exceed what recorded completions earned: guards against hand-edited saves.
  profile.xp = Math.min(profile.xp, Object.values(profile.missions).reduce((s, m) => s + m.xpEarned, 0))
  return profile
}

/* ------------------------------ Migration ------------------------------- */

/** v1 → v2. v1 shape: { xp, completed: { id: { hintsUsed, xpEarned, attempts } }, inProgress, lastMissionId, lessons } */
export function migrateV1(raw, game, now) {
  const profile = createProfile(now)
  if (!isObj(raw)) return profile
  if (isObj(raw.completed)) {
    for (const m of game.missions) {
      const old = raw.completed[m.id]
      if (!isObj(old)) continue
      const hintsUsed = int(old.hintsUsed, 0, 0, 99)
      const failures = int(old.attempts, 1, 0, 1e5) > 1 ? 1 : 0
      // Re-price under the current reward table. Time was not recorded in v1, so no speed bonus or best time is invented.
      const { potentialXp, score } = scoreRun({ mission: { ...m, targetSeconds: 0 }, hintsUsed, failures, seconds: 0 })
      profile.missions[m.id] = {
        ...emptyMissionStats(),
        completions: 1,
        firstCompletedAt: now,
        lastCompletedAt: now,
        xpEarned: potentialXp,
        bestScore: score,
        noHintClear: hintsUsed === 0,
        firstAttemptClear: failures === 0,
      }
      profile.xp += potentialXp
      profile.totals.completions += 1
      profile.totals.runs += 1
      profile.totals.hintsUsed += hintsUsed
    }
  }
  profile.lessons = strList(raw.lessons, LESSON_IDS)
  profile.lastMissionId = game.missions.some((m) => m.id === raw.lastMissionId) ? raw.lastMissionId : null
  const { profile: withAchievements } = evaluateAchievements(profile, game, now)
  // Achievements recovered by migration are not announced as new.
  return { ...withAchievements, achievements: Object.fromEntries(Object.entries(withAchievements.achievements).map(([id, a]) => [id, { ...a, seen: true }])) }
}

/** Parse any supported save envelope. Returns null if unusable. */
export function parseSave(text, game, now) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!isObj(data)) return null
  if (data.version === SAVE_VERSION && isObj(data.profile)) return sanitizeProfile(data.profile, game, now)
  if (data.version > SAVE_VERSION) return null // written by a newer build: do not guess
  return null
}

/* ----------------------------- Persistence ------------------------------ */

const safeGet = (store, key) => {
  try {
    return store?.getItem(key) ?? null
  } catch {
    return null
  }
}

/**
 * Load the profile from storage.
 * @returns {{ profile, source: 'save'|'backup'|'migrated-v1'|'new', recovered: boolean }}
 */
export function loadProfile(store, game, now) {
  const main = safeGet(store, SAVE_KEYS.main)
  if (main != null) {
    const p = parseSave(main, game, now)
    if (p) return { profile: p, source: 'save', recovered: false }
  }
  const backup = safeGet(store, SAVE_KEYS.backup)
  if (backup != null) {
    const p = parseSave(backup, game, now)
    if (p) return { profile: p, source: 'backup', recovered: main != null }
  }
  const legacy = safeGet(store, SAVE_KEYS.legacyV1)
  if (legacy != null) {
    try {
      return { profile: migrateV1(JSON.parse(legacy), game, now), source: 'migrated-v1', recovered: false }
    } catch {
      /* fall through */
    }
  }
  return { profile: createProfile(now), source: 'new', recovered: main != null }
}

export function serializeProfile(profile, game, now) {
  return JSON.stringify({ version: SAVE_VERSION, savedAt: now, unlockedMissions: unlockedMissionIds(profile, game), profile })
}

/**
 * Persist the profile. The current main save is copied to the backup slot
 * first (only if it is valid), then the new save is written.
 * @returns {boolean} true when the new save was written.
 */
export function persistProfile(store, profile, game, now) {
  if (!store) return false
  try {
    const text = serializeProfile(profile, game, now)
    const current = store.getItem(SAVE_KEYS.main)
    if (current && current !== text && parseSave(current, game, now)) store.setItem(SAVE_KEYS.backup, current)
    store.setItem(SAVE_KEYS.main, text)
    if (store.getItem(SAVE_KEYS.legacyV1) != null) store.removeItem(SAVE_KEYS.legacyV1)
    return true
  } catch {
    return false
  }
}

/** Remove all progression data (settings live under a different key and are untouched). */
export function clearSaves(store) {
  for (const key of Object.values(SAVE_KEYS)) {
    try {
      store?.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}
