import { useEffect, useState } from 'react'
import { Lock, Trophy } from 'lucide-react'
import { ScreenShell } from '../components/layout/ScreenShell'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { achievementIcon } from '../components/game/achievementIcons'
import { achievementViews } from '../game/progression/achievements'
import { useProgress } from '../context/ProgressContext'
import { cn } from '../lib/cn'

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function Achievements() {
  const { profile, markAchievementsSeen } = useProgress()
  const views = achievementViews(profile)
  // Remember which were new when the screen opened, so the badges stay visible during this visit.
  const [freshIds] = useState(() => new Set(views.filter((v) => v.state === 'new').map((v) => v.id)))
  const unlockedCount = views.filter((v) => v.unlockedAt).length

  useEffect(() => {
    const t = window.setTimeout(markAchievementsSeen, 800)
    return () => window.clearTimeout(t)
  }, [markAchievementsSeen])

  return (
    <ScreenShell
      eyebrow="Service record"
      title="Achievements"
      description="Milestones are evaluated by game logic from your verified mission results. Each can be earned once."
    >
      <div className="panel mb-8 flex flex-wrap items-center gap-6 p-5">
        <Trophy className="size-6 text-amber" aria-hidden="true" />
        <div className="min-w-48 flex-1">
          <p className="font-display text-lg font-semibold text-ink">
            {unlockedCount} of {views.length} unlocked
          </p>
          <ProgressBar value={unlockedCount / views.length} label="Achievements unlocked" className="mt-2 max-w-sm" />
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {views.map((a) => {
          const isUnlocked = Boolean(a.unlockedAt)
          const Icon = isUnlocked ? achievementIcon(a.icon) : Lock
          return (
            <li key={a.id} className={cn('panel relative flex items-start gap-4 p-5 transition-colors', isUnlocked ? 'border-amber/25' : 'opacity-75')}>
              {freshIds.has(a.id) && (
                <Badge tone="amber" className="absolute top-3 right-3">
                  New
                </Badge>
              )}
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-lg border',
                  isUnlocked ? 'border-amber/40 bg-amber-deep text-amber shadow-[0_0_18px_-6px_var(--color-amber)]' : 'border-line-strong bg-raised text-ink-faint',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className={cn('font-display text-[15px] font-semibold', isUnlocked ? 'text-ink' : 'text-ink-soft')}>{a.name}</h2>
                <p className="mt-1 text-[13px] leading-snug text-ink-mute">{a.description}</p>
                <p className={cn('mt-2 font-mono text-[10.5px] tracking-wider uppercase', isUnlocked ? 'text-amber' : 'text-ink-faint')}>
                  {isUnlocked ? `Unlocked ${formatDate(a.unlockedAt)}` : 'Locked'}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </ScreenShell>
  )
}
