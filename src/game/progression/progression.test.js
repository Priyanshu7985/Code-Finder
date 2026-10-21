import { describe, it, expect } from 'vitest'
import { MISSIONS, getMission } from '../missions'
import { PROGRESSION_CONFIG } from './config'
import { scoreRun, speedBonus, performanceScore, maxXpFor } from './scoring'
import { levelInfo, xpForLevel, levelCost } from './levels'
import { createProfile, ensureRun, updateRun, addPlayTime, applyCompletion, unlockedMissionIds, nextPlayableMission, completeLesson, profileSummary } from './profile'
import { evaluateAchievements, achievementViews, markAchievementsSeen } from './achievements'
import { SAVE_KEYS, SAVE_VERSION, loadProfile, persistProfile, parseSave, clearSaves, migrateV1, sanitizeProfile } from './save'
import { sessionReducer, createSession } from '../engine/session'

const game = { missions: MISSIONS }
const NOW = '2026-10-21T10:00:00.000Z'
const LATER = '2026-10-21T11:00:00.000Z'

function fakeStore(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

/** Start and complete a run in one step. */
function play(profile, missionId, { hintsUsed = 0, failures = 0, seconds = 60, now = NOW } = {}) {
  let p = ensureRun(profile, missionId, now)
  const runId = p.inProgress[missionId].runId
  p = updateRun(p, missionId, runId, { hintsUsed, failures })
  return applyCompletion(p, { mission: getMission(missionId), runId, hintsUsed, failures, seconds }, now, game)
}

/* ------------------------------------------------------------------ */

describe('XP calculation', () => {
  const beginner = getMission('millionaire') // target 180s
  const advanced = getMission('hidden-message')

  it('uses the configured base reward per difficulty', () => {
    expect(scoreRun({ mission: beginner, hintsUsed: 2, failures: 1, seconds: 9999 }).potentialXp).toBe(100)
    expect(scoreRun({ mission: getMission('password-mystery'), hintsUsed: 2, failures: 1, seconds: 9999 }).potentialXp).toBe(200)
    expect(scoreRun({ mission: advanced, hintsUsed: 2, failures: 1, seconds: 9999 }).potentialXp).toBe(350)
  })

  it('adds first-attempt, no-hint and speed bonuses', () => {
    const r = scoreRun({ mission: beginner, hintsUsed: 0, failures: 0, seconds: 60 })
    expect(r.bonuses.map((b) => b.id)).toEqual(['first-attempt', 'no-hints', 'speed'])
    expect(r.potentialXp).toBe(100 + 25 + 25 + 25)
    expect(maxXpFor(beginner)).toBe(175)
  })

  it('scales the speed bonus linearly between half the target and the target', () => {
    expect(speedBonus(90, 180)).toBe(25)
    expect(speedBonus(135, 180)).toBe(13)
    expect(speedBonus(180, 180)).toBe(0)
    expect(speedBonus(500, 180)).toBe(0)
    expect(speedBonus(10, 0)).toBe(0)
  })

  it('is deterministic', () => {
    const input = { mission: advanced, hintsUsed: 1, failures: 2, seconds: 700 }
    expect(scoreRun(input)).toEqual(scoreRun(input))
  })

  it('computes a bounded performance score', () => {
    expect(performanceScore({ hintsUsed: 0, failures: 0, seconds: 10, targetSeconds: 180 })).toBe(1000)
    expect(performanceScore({ hintsUsed: 1, failures: 1, seconds: 10, targetSeconds: 180 })).toBe(750)
    expect(performanceScore({ hintsUsed: 9, failures: 9, seconds: 1e6, targetSeconds: 180 })).toBe(PROGRESSION_CONFIG.score.min)
  })
})

describe('Level thresholds', () => {
  it('follows the configured curve', () => {
    expect(levelCost(1)).toBe(150)
    expect(levelCost(2)).toBe(250)
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(150)
    expect(xpForLevel(3)).toBe(400)
    expect(levelInfo(0).level).toBe(1)
    expect(levelInfo(149).level).toBe(1)
    expect(levelInfo(150).level).toBe(2)
    expect(levelInfo(399)).toMatchObject({ level: 2, into: 249, toNext: 1 })
    expect(levelInfo(400).level).toBe(3)
  })

  it('reports level-ups in completion results', () => {
    const { result } = play(createProfile(NOW), 'millionaire', { seconds: 60 }) // 175 XP
    expect(result.levelBefore).toBe(1)
    expect(result.levelAfter).toBe(2)
  })
})

describe('Duplicate reward prevention and replay', () => {
  it('ignores a second completion of the same run', () => {
    let p = ensureRun(createProfile(NOW), 'millionaire', NOW)
    const runId = p.inProgress.millionaire.runId
    const first = applyCompletion(p, { mission: getMission('millionaire'), runId, hintsUsed: 0, failures: 0, seconds: 60 }, NOW, game)
    const second = applyCompletion(first.profile, { mission: getMission('millionaire'), runId, hintsUsed: 0, failures: 0, seconds: 60 }, NOW, game)
    expect(second.result.duplicate).toBe(true)
    expect(second.profile).toBe(first.profile)
    expect(first.profile.xp).toBe(175)
  })

  it('awards no XP on replay but updates personal bests', () => {
    const a = play(createProfile(NOW), 'millionaire', { hintsUsed: 2, seconds: 400 })
    expect(a.result.firstCompletion).toBe(true)
    const xpAfterFirst = a.profile.xp
    const b = play(a.profile, 'millionaire', { hintsUsed: 0, seconds: 60, now: LATER })
    expect(b.result.firstCompletion).toBe(false)
    expect(b.result.xpAwarded).toBe(0)
    expect(b.profile.xp).toBe(xpAfterFirst)
    expect(b.profile.missions.millionaire.completions).toBe(2)
    expect(b.profile.missions.millionaire.bestSeconds).toBe(60)
    expect(b.result.newBestScore).toBe(true)
    expect(b.profile.missions.millionaire.history).toHaveLength(2)
  })

  it('makes ensureRun idempotent while a run is active', () => {
    const p1 = ensureRun(createProfile(NOW), 'millionaire', NOW)
    const p2 = ensureRun(p1, 'millionaire', LATER)
    expect(p2.inProgress.millionaire.runId).toBe(p1.inProgress.millionaire.runId)
    expect(p2.totals.runs).toBe(1)
  })

  it('tracks play time per run and in total', () => {
    let p = ensureRun(createProfile(NOW), 'millionaire', NOW)
    const runId = p.inProgress.millionaire.runId
    p = addPlayTime(p, 'millionaire', runId, 12)
    p = addPlayTime(p, 'millionaire', 'stale#99', 50)
    expect(p.inProgress.millionaire.seconds).toBe(12)
    expect(p.totals.playSeconds).toBe(62)
  })
})

describe('Sequential mission unlocking', () => {
  it('starts with only the first mission unlocked', () => {
    expect(unlockedMissionIds(createProfile(NOW), game)).toEqual(['millionaire'])
  })

  it('unlocks missions one at a time in campaign order', () => {
    let p = createProfile(NOW)
    const order = MISSIONS.map((m) => m.id)
    for (let i = 0; i < order.length; i++) {
      expect(unlockedMissionIds(p, game)).toEqual(order.slice(0, i + 1))
      const { profile, result } = play(p, order[i])
      p = profile
      expect(result.nextMissionId).toBe(order[i + 1] ?? null)
    }
    expect(nextPlayableMission(p, game, 'hidden-message')).toBeNull()
  })
})

describe('Achievements', () => {
  it('unlocks First Breach, DOM Detective and No Hints on a clean HTML mission', () => {
    const { result } = play(createProfile(NOW), 'millionaire', { seconds: 500 })
    expect(result.achievements).toEqual(expect.arrayContaining(['first-breach', 'dom-detective', 'no-hints']))
    expect(result.achievements).not.toContain('style-hacker')
    expect(result.achievements).not.toContain('speed-runner')
  })

  it('unlocks Style Hacker on a CSS mission and Speed Runner within target time', () => {
    let p = play(createProfile(NOW), 'millionaire', { hintsUsed: 1, seconds: 500 }).profile
    const { result } = play(p, 'invisible-exit', { hintsUsed: 1, seconds: 100 })
    expect(result.achievements).toEqual(expect.arrayContaining(['style-hacker', 'speed-runner']))
  })

  it('requires three different hint-free missions for Perfectionist', () => {
    let p = createProfile(NOW)
    p = play(p, 'millionaire').profile
    p = play(p, 'millionaire', { now: LATER }).profile // replay: same mission
    p = play(p, 'invisible-exit').profile
    expect(p.achievements.perfectionist).toBeUndefined()
    p = play(p, 'password-mystery').profile
    expect(p.achievements.perfectionist).toBeDefined()
  })

  it('unlocks Mission Master after all five missions', () => {
    let p = createProfile(NOW)
    for (const m of MISSIONS) p = play(p, m.id, { hintsUsed: 3 }).profile
    expect(p.achievements['mission-master']).toBeDefined()
  })

  it('never awards the same achievement twice and keeps the first timestamp', () => {
    const p = play(createProfile(NOW), 'millionaire').profile
    const again = evaluateAchievements(p, game, LATER)
    expect(again.unlocked).toEqual([])
    expect(again.profile.achievements['first-breach'].unlockedAt).toBe(NOW)
  })

  it('exposes display state and marks achievements as seen', () => {
    const p = play(createProfile(NOW), 'millionaire').profile
    expect(achievementViews(p).find((a) => a.id === 'first-breach').state).toBe('new')
    expect(achievementViews(markAchievementsSeen(p)).find((a) => a.id === 'first-breach').state).toBe('unlocked')
    expect(achievementViews(p).find((a) => a.id === 'mission-master').state).toBe('locked')
  })

  it('counts training modules', () => {
    const { profile, unlocked } = completeLesson(createProfile(NOW), 'html-elements', NOW, game)
    expect(unlocked).toEqual(['lab-rat'])
    expect(completeLesson(profile, 'html-elements', NOW, game).unlocked).toEqual([])
  })
})

describe('Save data', () => {
  it('persists and reloads the same profile (refresh)', () => {
    const store = fakeStore()
    const p = play(createProfile(NOW), 'millionaire', { seconds: 77 }).profile
    expect(persistProfile(store, p, game, NOW)).toBe(true)
    const envelope = JSON.parse(store.getItem(SAVE_KEYS.main))
    expect(envelope.version).toBe(SAVE_VERSION)
    expect(envelope.unlockedMissions).toEqual(['millionaire', 'invisible-exit'])
    const loaded = loadProfile(store, game, LATER)
    expect(loaded.source).toBe('save')
    expect(loaded.profile).toEqual(p)
  })

  it('starts fresh on missing data and on malformed JSON', () => {
    expect(loadProfile(fakeStore(), game, NOW).source).toBe('new')
    const bad = loadProfile(fakeStore({ [SAVE_KEYS.main]: '{oops' }), game, NOW)
    expect(bad.source).toBe('new')
    expect(bad.recovered).toBe(true)
    expect(bad.profile).toEqual(createProfile(NOW))
  })

  it('falls back to the backup when the main save is corrupt', () => {
    const store = fakeStore()
    const p1 = play(createProfile(NOW), 'millionaire').profile
    persistProfile(store, p1, game, NOW)
    const p2 = play(p1, 'invisible-exit').profile
    persistProfile(store, p2, game, NOW) // p1 moves to backup
    store.setItem(SAVE_KEYS.main, 'garbage')
    const loaded = loadProfile(store, game, NOW)
    expect(loaded.source).toBe('backup')
    expect(loaded.profile.missions.millionaire.completions).toBe(1)
  })

  it('keeps the previous save when a write fails', () => {
    const store = fakeStore()
    const p1 = play(createProfile(NOW), 'millionaire').profile
    persistProfile(store, p1, game, NOW)
    const before = store.getItem(SAVE_KEYS.main)
    const failing = { ...store, setItem: () => { throw new Error('QuotaExceededError') } }
    expect(persistProfile(failing, play(p1, 'invisible-exit').profile, game, NOW)).toBe(false)
    expect(store.getItem(SAVE_KEYS.main)).toBe(before)
  })

  it('rejects saves from a newer, unknown version', () => {
    expect(parseSave(JSON.stringify({ version: SAVE_VERSION + 1, profile: {} }), game, NOW)).toBeNull()
  })

  it('sanitizes tampered or malformed fields', () => {
    const p = sanitizeProfile(
      {
        xp: 999999,
        missions: {
          millionaire: { completions: 1, xpEarned: 175, bestScore: 'lots', history: [{ at: 'not a date' }] },
          'hidden-message': { completions: 3, xpEarned: 500 }, // prerequisites never met
          'not-a-mission': { completions: 1 },
        },
        achievements: { 'first-breach': { unlockedAt: NOW }, fake: { unlockedAt: NOW }, 'no-hints': { unlockedAt: 'never' } },
        lessons: ['html-elements', 'bogus', 42],
        inProgress: { millionaire: { runId: 'other#1' } },
        totals: { runs: -5, playSeconds: 'x' },
      },
      game,
      NOW,
    )
    expect(Object.keys(p.missions)).toEqual(['millionaire'])
    expect(p.missions.millionaire.bestScore).toBeNull()
    expect(p.missions.millionaire.history).toEqual([])
    expect(p.xp).toBe(175) // clamped to what completions earned
    expect(Object.keys(p.achievements)).toEqual(['first-breach'])
    expect(p.lessons).toEqual(['html-elements'])
    expect(p.inProgress).toEqual({})
    expect(p.totals.runs).toBe(0)
  })

  it('migrates v1 progress without inventing times', () => {
    const store = fakeStore({
      [SAVE_KEYS.legacyV1]: JSON.stringify({ xp: 650, completed: { millionaire: { hintsUsed: 0, xpEarned: 300, attempts: 1 } }, lessons: ['html-elements'] }),
    })
    const { profile, source } = loadProfile(store, game, NOW)
    expect(source).toBe('migrated-v1')
    expect(profile.missions.millionaire.completions).toBe(1)
    expect(profile.missions.millionaire.bestSeconds).toBeNull()
    expect(profile.xp).toBe(150) // 100 base + 25 first attempt + 25 no hints, no speed bonus
    expect(profile.achievements['first-breach'].seen).toBe(true)
    expect(migrateV1(null, game, NOW)).toEqual(createProfile(NOW))
    persistProfile(store, profile, game, NOW)
    expect(store.getItem(SAVE_KEYS.legacyV1)).toBeNull()
  })
})

describe('Reset progress', () => {
  it('clears progression keys but keeps settings', () => {
    const store = fakeStore({ 'inspecthack.settings.v1': '{"sound":false}' })
    persistProfile(store, play(createProfile(NOW), 'millionaire').profile, game, NOW)
    persistProfile(store, createProfile(NOW), game, NOW)
    clearSaves(store)
    expect(store.getItem(SAVE_KEYS.main)).toBeNull()
    expect(store.getItem(SAVE_KEYS.backup)).toBeNull()
    expect(store.getItem('inspecthack.settings.v1')).toBe('{"sound":false}')
    expect(loadProfile(store, game, NOW).source).toBe('new')
  })

  it('does not touch progression when a single mission is reset', () => {
    const mission = getMission('millionaire')
    let s = createSession(mission, { hintsUsed: 2, failures: 1, attempts: 3, completed: ['inspect-balance'] })
    s = sessionReducer(s, { type: 'reset', mission })
    expect(s.completed).toEqual([])
    expect(s).toMatchObject({ hintsUsed: 2, failures: 1, attempts: 3 })
  })
})

describe('Profile summary', () => {
  it('reports completion percentage across missions, achievements and lessons', () => {
    const s = profileSummary(createProfile(NOW), game)
    expect(s.completionPct).toBe(0)
    expect(s.completedMissions).toBe(0)
    const p = play(createProfile(NOW), 'millionaire').profile
    expect(profileSummary(p, game).completedMissions).toBe(1)
    expect(profileSummary(p, game).completionPct).toBeGreaterThan(0)
  })
})
