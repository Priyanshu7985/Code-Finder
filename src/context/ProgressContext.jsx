import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MISSIONS } from '../game/missions'
import { loadProfile, persistProfile, clearSaves } from '../game/progression/save'
import {
  createProfile,
  ensureRun as ensureRunOp,
  updateRun as updateRunOp,
  addPlayTime as addPlayTimeOp,
  applyCompletion,
  completeLesson as completeLessonOp,
  profileSummary,
  hasProgress as hasProgressOp,
} from '../game/progression/profile'
import { markAchievementsSeen as markSeenOp, getAchievement } from '../game/progression/achievements'
import { useToast } from './ToastContext'
import { playSound } from '../lib/sound'

/**
 * React shell around the pure progression module (game/progression).
 * Every change goes through `commit`, which updates a synchronous ref (so
 * back-to-back calls never see stale data) and persists immediately, so a
 * refresh right after a completion cannot lose or duplicate rewards.
 */

const GAME = { missions: MISSIONS }
const nowIso = () => new Date().toISOString()

function getStore() {
  try {
    const s = window.localStorage
    s.getItem('inspecthack.probe')
    return s
  } catch {
    return null
  }
}

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const { notify } = useToast()
  const [loaded] = useState(() => loadProfile(getStore(), GAME, nowIso()))
  const [profile, setProfile] = useState(loaded.profile)
  const ref = useRef(loaded.profile)
  const saveFailed = useRef(false)

  // Commit migrated or backup-restored data right away so it is not re-derived on every load.
  useEffect(() => {
    if (loaded.source === 'migrated-v1' || loaded.source === 'backup') persistProfile(getStore(), loaded.profile, GAME, nowIso())
  }, [loaded])

  // Explain recoveries once.
  useEffect(() => {
    if (loaded.source === 'backup') notify({ tone: 'warning', title: 'Save restored from backup', message: 'Your latest save was unreadable, so the previous good save was loaded.' })
    else if (loaded.recovered) notify({ tone: 'warning', title: 'Save data was unreadable', message: 'A fresh operator profile was created.' })
    else if (loaded.source === 'migrated-v1') notify({ tone: 'info', title: 'Progress upgraded', message: 'Your earlier progress was converted to the new progression system.' })
  }, [loaded, notify])

  const commit = useCallback(
    (next) => {
      if (next === ref.current) return
      ref.current = next
      setProfile(next)
      const ok = persistProfile(getStore(), next, GAME, nowIso())
      if (!ok && !saveFailed.current) {
        notify({ tone: 'warning', title: 'Progress not saved', message: 'Browser storage is unavailable or full. Progress is kept for this session only.', duration: 6000 })
      }
      saveFailed.current = !ok
    },
    [notify],
  )

  const announce = useCallback(
    (ids) => {
      ids.forEach((id, i) => {
        const def = getAchievement(id)
        if (!def) return
        window.setTimeout(() => {
          notify({ tone: 'achievement', title: `Achievement unlocked · ${def.name}`, message: def.description, duration: 5000 })
          playSound('success')
        }, i * 350)
      })
    },
    [notify],
  )

  /** Resume or start a run. Returns the run record. */
  const ensureRun = useCallback(
    (missionId) => {
      commit(ensureRunOp(ref.current, missionId, nowIso()))
      return ref.current.inProgress[missionId]
    },
    [commit],
  )

  const updateRun = useCallback((missionId, runId, patch) => commit(updateRunOp(ref.current, missionId, runId, patch)), [commit])

  const addPlayTime = useCallback((missionId, runId, seconds) => commit(addPlayTimeOp(ref.current, missionId, runId, seconds)), [commit])

  /** Record a validator-confirmed completion. Safe to call more than once per run. */
  const completeRun = useCallback(
    (mission, run) => {
      const { profile: next, result } = applyCompletion(ref.current, { mission, ...run }, nowIso(), GAME)
      if (!result.duplicate) {
        commit(next)
        announce(result.achievements)
      }
      return result
    },
    [commit, announce],
  )

  const completeLesson = useCallback(
    (lessonId) => {
      const { profile: next, unlocked } = completeLessonOp(ref.current, lessonId, nowIso(), GAME)
      commit(next)
      announce(unlocked)
    },
    [commit, announce],
  )

  const markAchievementsSeen = useCallback(() => commit(markSeenOp(ref.current)), [commit])

  /** Wipe progression (settings are stored separately and kept). */
  const resetProgress = useCallback(() => {
    clearSaves(getStore())
    const fresh = createProfile(nowIso())
    ref.current = fresh
    setProfile(fresh)
  }, [])

  const summary = useMemo(() => profileSummary(profile, GAME), [profile])

  const value = useMemo(
    () => ({
      profile,
      summary,
      hasProgress: hasProgressOp(profile),
      ensureRun,
      updateRun,
      addPlayTime,
      completeRun,
      completeLesson,
      markAchievementsSeen,
      resetProgress,
    }),
    [profile, summary, ensureRun, updateRun, addPlayTime, completeRun, completeLesson, markAchievementsSeen, resetProgress],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
