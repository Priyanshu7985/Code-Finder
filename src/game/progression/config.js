/**
 * Progression configuration. All tuning lives here; the scoring, level and
 * achievement modules read from this object so balance changes never
 * require touching game logic.
 */
export const PROGRESSION_CONFIG = Object.freeze({
  /** XP for the first completion of a mission, by difficulty. */
  baseXp: Object.freeze({ beginner: 100, intermediate: 200, advanced: 350 }),

  /** Performance bonuses, also only awarded on first completion. */
  bonuses: Object.freeze({
    firstAttempt: 25, // no rejected answers or failed sign-ins
    noHints: 25, // no hints revealed during the run
    speedMax: 25, // scales from speedMax down to 0 (see speed)
  }),

  /**
   * Speed bonus: full bonus at or under `fullAt` × target time, falling
   * linearly to 0 at the target time. Slower runs earn no speed bonus.
   */
  speed: Object.freeze({ fullAt: 0.5 }),

  /** Level curve: going from level N to N+1 costs base + step × (N − 1). */
  levels: Object.freeze({ base: 150, step: 100, max: 50 }),

  /** Personal-best score (0–1000), deterministic and independent of XP. */
  score: Object.freeze({ max: 1000, min: 100, perHint: 150, perFailure: 100, slowMax: 300, slowWindow: 2 }),

  /** History entries kept per mission. */
  historyLimit: 20,
  /** Completed run ids remembered for duplicate-reward protection. */
  ledgerLimit: 500,
})
