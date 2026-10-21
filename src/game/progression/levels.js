import { PROGRESSION_CONFIG } from './config'

/** XP needed to go from `level` to `level + 1`. */
export const levelCost = (level, config = PROGRESSION_CONFIG) => config.levels.base + config.levels.step * (level - 1)

/** Total XP at which `level` starts. Level 1 starts at 0. */
export function xpForLevel(level, config = PROGRESSION_CONFIG) {
  let total = 0
  for (let l = 1; l < level; l++) total += levelCost(l, config)
  return total
}

/**
 * Level details for a total XP value.
 * @returns {{ level, into, cost, toNext, ratio, floor, maxed }}
 */
export function levelInfo(totalXp, config = PROGRESSION_CONFIG) {
  const xp = Math.max(0, Math.floor(totalXp || 0))
  let level = 1
  let floor = 0
  while (level < config.levels.max && xp >= floor + levelCost(level, config)) {
    floor += levelCost(level, config)
    level += 1
  }
  const maxed = level >= config.levels.max
  const cost = levelCost(level, config)
  const into = xp - floor
  return { level, into, cost, toNext: maxed ? 0 : cost - into, ratio: maxed ? 1 : into / cost, floor, maxed }
}

export const RANKS = ['Script Novice', 'Markup Reader', 'DOM Walker', 'Style Breaker', 'Logic Diver', 'Ghost Operator']
export const rankForLevel = (level) => RANKS[Math.min(level - 1, RANKS.length - 1)]
