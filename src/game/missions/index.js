import { millionaire } from './millionaire'
import { invisibleExit } from './invisibleExit'
import { passwordMystery } from './passwordMystery'
import { brokenAccess } from './brokenAccess'
import { hiddenMessage } from './hiddenMessage'

/** Campaign order. Add new missions here and the UI picks them up automatically. */
export const MISSIONS = [millionaire, invisibleExit, passwordMystery, brokenAccess, hiddenMessage]

export const MISSION_IDS = MISSIONS.map((m) => m.id)

export const getMission = (id) => MISSIONS.find((m) => m.id === id) ?? null

export const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', blurb: 'Read the page. Trust nothing it shows you.' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'Clues, states and client-side restrictions.' },
  { id: 'advanced', label: 'Advanced', blurb: 'Multi-layer investigations across the DOM.' },
]
