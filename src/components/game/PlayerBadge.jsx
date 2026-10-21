import { ChevronRight } from 'lucide-react'
import { useProgress } from '../../context/ProgressContext'
import { useNavigation } from '../../context/NavigationContext'
import { rankForLevel } from '../../game/progression/levels'
import { LevelProgress } from './LevelProgress'
import { cn } from '../../lib/cn'

/** Operator level + XP readout. Both variants open the profile screen. */
export function PlayerBadge({ compact, className }) {
  const { summary } = useProgress()
  const { navigate } = useNavigation()
  const { level } = summary

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate('profile')}
        className={cn('flex items-center gap-3 rounded-lg border border-line bg-panel/80 px-3 py-1.5 transition hover:border-signal-dim', className)}
        aria-label={`Operator level ${level.level}, ${summary.xp} XP. Open profile`}
      >
        <span className="grid size-7 place-items-center rounded-md border border-signal-dim/50 bg-signal-deep font-mono text-xs font-semibold text-signal">
          {level.level}
        </span>
        <span className="hidden w-28 text-left sm:block">
          <span className="flex items-baseline justify-between font-mono text-[10px] text-ink-mute">
            <span>LVL {level.level}</span>
            <span className="tabular-nums">
              {level.into}/{level.cost}
            </span>
          </span>
          <LevelProgress xp={summary.xp} size="sm" showLabels={false} className="mt-1" />
        </span>
      </button>
    )
  }

  return (
    <button type="button" onClick={() => navigate('profile')} className={cn('panel group block w-full p-4 text-left transition hover:border-signal-dim/70', className)}>
      <span className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg border border-signal-dim/50 bg-signal-deep font-display text-lg font-bold text-signal">
          {level.level}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10.5px] tracking-[0.14em] text-ink-mute uppercase">Operator · Level {level.level}</span>
          <span className="block truncate font-display text-[15px] font-semibold text-ink">{rankForLevel(level.level)}</span>
        </span>
        <ChevronRight className="size-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-signal" aria-hidden="true" />
      </span>
      <LevelProgress xp={summary.xp} showLabels={false} className="mt-4" />
      <span className="mt-2 flex justify-between font-mono text-[11px] text-ink-mute">
        <span>{summary.xp.toLocaleString('en-US')} XP total</span>
        <span>{level.maxed ? 'max level' : `${level.toNext} to next`}</span>
      </span>
      <span className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-[11px]">
        <span>
          <span className="block text-ink">
            {summary.completedMissions}/{summary.totalMissions}
          </span>
          <span className="text-ink-faint">missions</span>
        </span>
        <span>
          <span className="block text-ink">
            {summary.achievementCount}/{summary.totalAchievements}
          </span>
          <span className="text-ink-faint">achievements</span>
        </span>
        <span>
          <span className="block text-signal">{summary.completionPct}%</span>
          <span className="text-ink-faint">complete</span>
        </span>
      </span>
    </button>
  )
}
