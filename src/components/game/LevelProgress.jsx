import { motion } from 'framer-motion'
import { levelInfo, rankForLevel } from '../../game/progression/levels'
import { cn } from '../../lib/cn'

/**
 * Animated XP bar for the current level. When `fromXp` is given the bar
 * animates from that value (same level) or from empty (after a level-up).
 */
export function LevelProgress({ xp, fromXp, size = 'md', showLabels = true, className }) {
  const info = levelInfo(xp)
  const before = fromXp == null ? null : levelInfo(fromXp)
  const start = before == null ? info.ratio : before.level === info.level ? before.ratio : 0
  const pct = Math.round(info.ratio * 100)

  return (
    <div className={className}>
      {showLabels && (
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] text-ink-mute">
          <span>
            LVL <span className="text-ink">{info.level}</span> · {rankForLevel(info.level)}
          </span>
          <span className="tabular-nums">{info.maxed ? 'MAX' : `${info.into} / ${info.cost} XP`}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={`Level ${info.level} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={cn('relative overflow-hidden rounded-full bg-line', size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5')}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-signal shadow-[0_0_10px_rgb(92_242_168/0.6)]"
          initial={{ width: `${start * 100}%` }}
          animate={{ width: `${info.ratio * 100}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </div>
      {showLabels && !info.maxed && <p className="mt-1.5 font-mono text-[10.5px] text-ink-faint">{info.toNext} XP to level {info.level + 1}</p>}
    </div>
  )
}
