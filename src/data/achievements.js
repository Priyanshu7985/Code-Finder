import { LESSON_IDS } from './lessons'

/**
 * Achievement definitions. `condition(profile, game)` is a pure predicate
 * over the trusted player profile; `game.missions` is the campaign list.
 * Conditions never look at simulated page content.
 *
 * icon: a lucide-react icon name mapped in the UI.
 * secret: hide name/description until unlocked.
 */

const cleared = (profile) => Object.entries(profile.missions).filter(([, s]) => s.completions > 0)
const clearedWithTag = (profile, game, tag) =>
  cleared(profile).some(([id]) => game.missions.find((m) => m.id === id)?.tags?.includes(tag))

export const ACHIEVEMENTS = [
  {
    id: 'first-breach',
    name: 'First Breach',
    description: 'Complete your first mission.',
    icon: 'Unlock',
    condition: (p) => cleared(p).length >= 1,
  },
  {
    id: 'dom-detective',
    name: 'DOM Detective',
    description: 'Complete an HTML inspection mission.',
    icon: 'ScanSearch',
    condition: (p, game) => clearedWithTag(p, game, 'html'),
  },
  {
    id: 'style-hacker',
    name: 'Style Hacker',
    description: 'Complete a CSS manipulation mission.',
    icon: 'Paintbrush',
    condition: (p, game) => clearedWithTag(p, game, 'css'),
  },
  {
    id: 'no-hints',
    name: 'No Hints',
    description: 'Complete a mission without using hints.',
    icon: 'ShieldCheck',
    condition: (p) => cleared(p).some(([, s]) => s.noHintClear),
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete three different missions without using hints.',
    icon: 'Gem',
    condition: (p) => cleared(p).filter(([, s]) => s.noHintClear).length >= 3,
  },
  {
    id: 'mission-master',
    name: 'Mission Master',
    description: 'Complete all five initial missions.',
    icon: 'Crown',
    condition: (p, game) => game.missions.every((m) => p.missions[m.id]?.completions > 0),
  },
  {
    id: 'speed-runner',
    name: 'Speed Runner',
    description: 'Complete a mission within its target time.',
    icon: 'Timer',
    condition: (p) => cleared(p).some(([, s]) => s.speedClear),
  },
  {
    id: 'lab-rat',
    name: 'Lab Rat',
    description: 'Finish your first Training Lab module.',
    icon: 'FlaskConical',
    condition: (p) => p.lessons.length >= 1,
  },
  {
    id: 'graduate',
    name: 'Graduate',
    description: 'Finish every Training Lab module.',
    icon: 'GraduationCap',
    condition: (p) => LESSON_IDS.every((id) => p.lessons.includes(id)),
  },
]

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id)
