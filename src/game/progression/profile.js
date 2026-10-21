import { PROGRESSION_CONFIG } from './config'
import { scoreRun } from './scoring'
import { levelInfo } from './levels'
import { evaluateAchievements } from './achievements'
import { ACHIEVEMENTS } from '../../data/achievements'
import { LESSONS } from '../../data/lessons'

/**
 * Player profile model and every operation that changes it.
 *
 * All functions are pure: (profile, input, now) -> new profile. The React
 * layer only stores the result and persists it. `game` is
 * { missions } so the logic can be tested with any campaign.
 */

export function createProfile(now) {
  return {
    createdAt: now,
    xp: 0,
    totals: { runs: 0, completions: 0, hintsUsed: 0, failures: 0, playSeconds: 0 },
    missions: {},
    inProgress: {},
    achievements: {},
    lessons: [],
    lastMissionId: null,
    ledger: [],
    runCounter: 0,
  }
}

export const emptyMissionStats = () => ({
  completions: 0,
  firstCompletedAt: null,
  lastCompletedAt: null,
  xpEarned: 0,
  bestScore: null,
  bestSeconds: null,
  noHintClear: false,
  speedClear: false,
  firstAttemptClear: false,
  history: [],
})

const isCompleted = (profile, id) => (profile.missions[id]?.completions ?? 0) > 0

/* ------------------------------ Unlocking ------------------------------ */

export const prerequisitesMet = (mission, profile) => mission.unlock.requires.every((id) => isCompleted(profile, id))

export function unlockedMissionIds(profile, game) {
  return game.missions.filter((m) => m.implemented && prerequisitesMet(m, profile)).map((m) => m.id)
}

/** Next mission in campaign order that is actually playable for this profile. */
export function nextPlayableMission(profile, game, afterId) {
  const index = game.missions.findIndex((m) => m.id === afterId)
  return game.missions.slice(index + 1).find((m) => m.implemented && prerequisitesMet(m, profile)) ?? null
}

/* -------------------------------- Runs -------------------------------- */

/**
 * Resume the in-progress run for a mission, or start a new one.
 * Idempotent while a run exists, so repeated calls never double-count.
 */
export function ensureRun(profile, missionId, now) {
  const existing = profile.inProgress[missionId]
  if (existing) return profile.lastMissionId === missionId ? profile : { ...profile, lastMissionId: missionId }
  const runCounter = profile.runCounter + 1
  return {
    ...profile,
    runCounter,
    lastMissionId: missionId,
    totals: { ...profile.totals, runs: profile.totals.runs + 1 },
    inProgress: {
      ...profile.inProgress,
      [missionId]: { runId: `${missionId}#${runCounter}`, startedAt: now, completed: [], hintsUsed: 0, failures: 0, seconds: 0 },
    },
  }
}

/** Save objective progress / hint count / failures for the active run. */
export function updateRun(profile, missionId, runId, patch) {
  const run = profile.inProgress[missionId]
  if (!run || run.runId !== runId) return profile
  const next = { ...run }
  if (Array.isArray(patch.completed)) next.completed = patch.completed.filter((x) => typeof x === 'string')
  if (Number.isInteger(patch.hintsUsed)) next.hintsUsed = Math.max(run.hintsUsed, patch.hintsUsed)
  if (Number.isInteger(patch.failures)) next.failures = Math.max(run.failures, patch.failures)
  const totals = { ...profile.totals }
  totals.hintsUsed += next.hintsUsed - run.hintsUsed
  totals.failures += next.failures - run.failures
  return { ...profile, totals, inProgress: { ...profile.inProgress, [missionId]: next } }
}

/** Accumulate active play time for a run (and the global total). */
export function addPlayTime(profile, missionId, runId, seconds) {
  const s = Math.max(0, Math.min(Math.round(seconds), 3600))
  if (!s) return profile
  const run = profile.inProgress[missionId]
  const inProgress = run && run.runId === runId ? { ...profile.inProgress, [missionId]: { ...run, seconds: run.seconds + s } } : profile.inProgress
  return { ...profile, inProgress, totals: { ...profile.totals, playSeconds: profile.totals.playSeconds + s } }
}

/* ----------------------------- Completion ----------------------------- */

/**
 * Apply a validator-confirmed completion.
 *
 * Duplicate protection: a run id can only be completed once (ledger).
 * XP is only awarded on a mission's first completion; replays update
 * statistics and personal bests but never add permanent XP.
 */
export function applyCompletion(profile, { mission, runId, hintsUsed, failures, seconds }, now, game, config = PROGRESSION_CONFIG) {
  if (!runId || profile.ledger.includes(runId)) return { profile, result: { duplicate: true } }

  const prev = profile.missions[mission.id] ?? emptyMissionStats()
  const firstCompletion = prev.completions === 0
  const breakdown = scoreRun({ mission, hintsUsed, failures, seconds }, config)
  const xpAwarded = firstCompletion ? breakdown.potentialXp : 0

  const stats = {
    ...prev,
    completions: prev.completions + 1,
    firstCompletedAt: prev.firstCompletedAt ?? now,
    lastCompletedAt: now,
    xpEarned: prev.xpEarned + xpAwarded,
    bestScore: prev.bestScore == null ? breakdown.score : Math.max(prev.bestScore, breakdown.score),
    bestSeconds: prev.bestSeconds == null ? seconds : Math.min(prev.bestSeconds, seconds),
    noHintClear: prev.noHintClear || hintsUsed === 0,
    speedClear: prev.speedClear || breakdown.withinTarget,
    firstAttemptClear: prev.firstAttemptClear || failures === 0,
    history: [...prev.history, { at: now, seconds, hintsUsed, failures, score: breakdown.score, xp: xpAwarded }].slice(-config.historyLimit),
  }

  const inProgress = { ...profile.inProgress }
  delete inProgress[mission.id]

  const updated = {
    ...profile,
    xp: profile.xp + xpAwarded,
    totals: { ...profile.totals, completions: profile.totals.completions + 1 },
    missions: { ...profile.missions, [mission.id]: stats },
    inProgress,
    lastMissionId: mission.id,
    ledger: [...profile.ledger, runId].slice(-config.ledgerLimit),
  }
  const { profile: final, unlocked } = evaluateAchievements(updated, game, now)

  const before = levelInfo(profile.xp, config)
  const after = levelInfo(final.xp, config)
  return {
    profile: final,
    result: {
      duplicate: false,
      missionId: mission.id,
      firstCompletion,
      xpAwarded,
      breakdown,
      score: breakdown.score,
      seconds,
      hintsUsed,
      failures,
      previousBestScore: prev.bestScore,
      previousBestSeconds: prev.bestSeconds,
      newBestScore: prev.bestScore == null || breakdown.score > prev.bestScore,
      newBestTime: prev.bestSeconds == null || seconds < prev.bestSeconds,
      achievements: unlocked,
      xpBefore: profile.xp,
      xpAfter: final.xp,
      levelBefore: before.level,
      levelAfter: after.level,
      nextMissionId: nextPlayableMission(final, game, mission.id)?.id ?? null,
    },
  }
}

/* ------------------------------ Training ------------------------------ */

export function completeLesson(profile, lessonId, now, game) {
  if (profile.lessons.includes(lessonId)) return { profile, unlocked: [] }
  return evaluateAchievements({ ...profile, lessons: [...profile.lessons, lessonId] }, game, now)
}

/* ------------------------------- Summary ------------------------------ */

export function profileSummary(profile, game) {
  const completedMissions = game.missions.filter((m) => isCompleted(profile, m.id)).length
  const achievementCount = Object.keys(profile.achievements).length
  const lessonCount = profile.lessons.length
  const totalItems = game.missions.length + ACHIEVEMENTS.length + LESSONS.length
  return {
    level: levelInfo(profile.xp),
    xp: profile.xp,
    completedMissions,
    totalMissions: game.missions.length,
    achievementCount,
    totalAchievements: ACHIEVEMENTS.length,
    lessonCount,
    totalLessons: LESSONS.length,
    /** Missions, achievements and training modules, equally weighted per item. */
    completionPct: Math.round(((completedMissions + achievementCount + lessonCount) / totalItems) * 100),
    unlocked: unlockedMissionIds(profile, game),
    ...profile.totals,
  }
}

export const hasProgress = (profile) =>
  profile.xp > 0 || profile.totals.runs > 0 || profile.lessons.length > 0 || Object.keys(profile.achievements).length > 0
