/**
 * Mission session engine.
 *
 * A session is the gameplay record for one run: completed objectives,
 * hints, submissions and the log of player *actions* (selections, clicks,
 * form submissions, answers). Page edits live in the page state; the
 * validators combine both.
 */

const MAX_EVENTS = 300

/** @param saved the persisted run ({ completed, hintsUsed, failures }) when resuming */
export function createSession(mission, saved) {
  const objectiveIds = new Set(mission.objectives.map((o) => o.id))
  const completed = Array.isArray(saved?.completed) ? saved.completed.filter((id) => objectiveIds.has(id)) : []
  const count = (v, max = 1e5) => (Number.isInteger(v) && v >= 0 ? Math.min(v, max) : 0)
  return {
    missionId: mission.id,
    completed,
    hintsUsed: count(saved?.hintsUsed, mission.hints.length),
    attempts: count(saved?.attempts),
    failures: count(saved?.failures),
    events: [],
    status: 'active',
  }
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'record':
      if (state.status === 'complete') return state
      return { ...state, events: [...state.events.slice(-(MAX_EVENTS - 1)), action.event] }

    case 'complete': {
      if (state.status === 'complete') return state
      const order = action.mission.objectives.map((o) => o.id)
      // Completing objective N implies every earlier objective is satisfied.
      const furthest = Math.max(...action.ids.map((id) => order.indexOf(id)))
      const completed = order.filter((id, i) => i <= furthest || state.completed.includes(id) || action.ids.includes(id))
      return { ...state, completed, status: completed.length === order.length ? 'complete' : 'active' }
    }

    case 'hint':
      return { ...state, hintsUsed: Math.min(state.hintsUsed + 1, action.mission.hints.length) }

    /** A submission judged by the validator (answer or simulated form). */
    case 'attempt':
      if (state.status === 'complete') return state
      return { ...state, attempts: state.attempts + 1, failures: state.failures + (action.ok ? 0 : 1) }

    case 'reset':
      // Resetting restores the page and objectives only. Hints, attempts and
      // failures belong to the run, so a reset cannot erase them or farm bonuses.
      return { ...createSession(action.mission), hintsUsed: state.hintsUsed, attempts: state.attempts, failures: state.failures }

    default:
      return state
  }
}

export function sessionProgress(mission, session) {
  const total = mission.objectives.length
  const done = session.completed.length
  return { done, total, ratio: total ? done / total : 0 }
}
