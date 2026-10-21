import { motion } from 'framer-motion'
import { Clock, Lightbulb, Lock, CheckCircle2, Wrench, CircleDot, ChevronRight, Zap, Trophy, Timer } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { MISSION_STATE } from '../../game/engine/progression'
import { baseXpFor, maxXpFor, formatDuration } from '../../game/progression/scoring'
import { cn } from '../../lib/cn'

export const STATE_META = {
  [MISSION_STATE.completed]: { label: 'Completed', tone: 'signal', icon: CheckCircle2, action: 'Replay' },
  [MISSION_STATE.inProgress]: { label: 'In progress', tone: 'cyan', icon: CircleDot, action: 'Resume' },
  [MISSION_STATE.available]: { label: 'Available', tone: 'cyan', icon: CircleDot, action: 'Start' },
  [MISSION_STATE.locked]: { label: 'Locked', tone: 'muted', icon: Lock, action: 'Details' },
  [MISSION_STATE.inDevelopment]: { label: 'In development', tone: 'amber', icon: Wrench, action: 'Details' },
}

export const DIFFICULTY_TONE = { beginner: 'signal', intermediate: 'cyan', advanced: 'amber' }

export function MissionCard({ mission, state, stats, reason, onSelect }) {
  const cleared = (stats?.completions ?? 0) > 0
  const meta = STATE_META[state]
  const muted = state === MISSION_STATE.locked
  const playable = state === MISSION_STATE.available || state === MISSION_STATE.inProgress || state === MISSION_STATE.completed

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'group panel relative flex flex-col overflow-hidden transition-[border-color,transform] duration-200',
        playable ? 'hover:-translate-y-0.5 hover:border-signal-dim/70' : 'hover:border-line-strong',
        muted && 'opacity-70',
      )}
    >
      {playable && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center justify-between gap-2 px-5 pt-5">
        <span className="font-mono text-[11px] tracking-[0.16em] text-ink-mute">{mission.code}</span>
        <Badge tone={meta.tone} icon={meta.icon}>
          {meta.label}
        </Badge>
      </div>

      <div className="flex-1 px-5 pt-3 pb-4">
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{mission.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{mission.tagline}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone={DIFFICULTY_TONE[mission.difficulty]}>{mission.difficulty}</Badge>
          <Badge tone="neutral">{mission.skill}</Badge>
        </div>
      </div>

      <dl className="grid grid-cols-3 border-t border-line font-mono text-[11px]">
        <div className="flex items-center gap-1.5 px-5 py-3 text-ink-soft">
          <Clock className="size-3.5 text-ink-mute" aria-hidden="true" />
          <dt className="sr-only">Estimated duration</dt>
          <dd>~{mission.estimatedMinutes} min</dd>
        </div>
        <div className="flex items-center gap-1.5 border-x border-line px-4 py-3 text-ink-soft">
          <Lightbulb className="size-3.5 text-ink-mute" aria-hidden="true" />
          <dt className="sr-only">Hints available</dt>
          <dd>
            {mission.hints.length} hint{mission.hints.length === 1 ? '' : 's'}
          </dd>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-3 text-ink-soft">
          <Zap className="size-3.5 text-ink-mute" aria-hidden="true" />
          <dt className="sr-only">Experience reward</dt>
          <dd title={`Up to ${maxXpFor(mission)} XP with all bonuses`}>
            {cleared ? <span className="text-signal">{stats.xpEarned} XP earned</span> : <>{baseXpFor(mission)} XP <span className="text-ink-faint">+{maxXpFor(mission) - baseXpFor(mission)}</span></>}
          </dd>
        </div>
      </dl>

      {cleared && (
        <dl className="grid grid-cols-3 border-t border-line bg-signal-deep/25 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 px-5 py-2.5 text-ink-soft" title={`Target ${formatDuration(mission.targetSeconds)}`}>
            <Timer className="size-3.5 text-signal-dim" aria-hidden="true" />
            <dt className="sr-only">Best time</dt>
            <dd className={stats.speedClear ? 'text-signal' : ''}>{formatDuration(stats.bestSeconds)}</dd>
          </div>
          <div className="flex items-center gap-1.5 border-x border-line px-4 py-2.5 text-ink-soft">
            <Trophy className="size-3.5 text-signal-dim" aria-hidden="true" />
            <dt className="sr-only">Personal best score</dt>
            <dd>{stats.bestScore ?? '—'}</dd>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 text-ink-soft">
            <CheckCircle2 className="size-3.5 text-signal-dim" aria-hidden="true" />
            <dt className="sr-only">Times cleared</dt>
            <dd>
              {stats.completions}× cleared
            </dd>
          </div>
        </dl>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line bg-base/40 px-5 py-3">
        <p className="min-w-0 truncate text-[12px] text-ink-mute">{reason || (playable ? 'Ready for deployment' : '')}</p>
        <button
          type="button"
          onClick={() => onSelect(mission)}
          aria-label={`${meta.action}: ${mission.title}`}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition',
            playable
              ? 'bg-signal-deep text-signal ring-1 ring-signal-dim/50 hover:bg-signal/20'
              : 'text-ink-soft ring-1 ring-line-strong hover:bg-raised hover:text-ink',
          )}
        >
          {meta.action}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  )
}
