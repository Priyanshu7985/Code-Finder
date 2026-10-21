import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Check, ChevronsUp, Crosshair, RotateCcw, Sparkles } from 'lucide-react'
import { Dialog } from '../../ui/Dialog'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { CountUp } from '../../ui/CountUp'
import { LevelProgress } from '../LevelProgress'
import { achievementIcon } from '../achievementIcons'
import { getAchievement } from '../../../game/progression/achievements'
import { rankForLevel } from '../../../game/progression/levels'
import { formatDuration } from '../../../game/progression/scoring'
import { cn } from '../../../lib/cn'

function Stat({ label, value, note, accent, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-panel px-3 py-3">
      <dt className="font-mono text-[10px] tracking-wider text-ink-mute uppercase">{label}</dt>
      <dd className={cn('mt-1 font-display text-xl font-semibold tabular-nums', accent ?? 'text-ink')}>{value}</dd>
      {note && <p className="mt-0.5 font-mono text-[10px] text-signal">{note}</p>}
    </motion.div>
  )
}

function LevelUpBanner({ from, to }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
      className="relative overflow-hidden rounded-lg border border-signal-dim/70 bg-signal-deep px-4 py-3"
      role="status"
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-signal/25 to-transparent"
        initial={{ x: 0 }}
        animate={{ x: '400%' }}
        transition={{ duration: 1.4, delay: 0.7, ease: 'easeInOut' }}
      />
      <div className="relative flex items-center gap-3">
        <motion.span
          className="grid size-10 place-items-center rounded-lg border border-signal bg-base text-signal shadow-[0_0_24px_-4px_var(--color-signal)]"
          initial={{ rotate: -12 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.6 }}
        >
          <ChevronsUp className="size-5" aria-hidden="true" />
        </motion.span>
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.2em] text-signal uppercase">Level up</p>
          <p className="font-display text-lg font-semibold text-ink">
            Level {from} <span className="text-ink-mute">→</span> <span className="text-signal text-glow">{to}</span>
            <span className="ml-2 text-sm font-normal text-ink-soft">{rankForLevel(to)}</span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/** Results screen shown after the validator confirms completion. */
export function MissionResults({ open, mission, result, nextMission, onNext, onReplay, onMissions, onClose }) {
  if (!result) return null
  const { breakdown } = result
  const leveled = result.levelAfter > result.levelBefore
  const timeNote = result.newBestTime && result.previousBestSeconds != null ? 'new best' : null
  const scoreNote = result.newBestScore && result.previousBestScore != null ? 'new best' : null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mission.completion.title}
      description={`${mission.code} · ${mission.title}`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" icon={Crosshair} onClick={onMissions} sound="back">
            Return to missions
          </Button>
          <Button variant="secondary" icon={RotateCcw} onClick={onReplay}>
            Replay mission
          </Button>
          {nextMission && (
            <Button variant="primary" iconRight={ArrowRight} onClick={onNext} sound="open" data-autofocus>
              Next: {nextMission.title}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.05 }}
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-signal-dim bg-signal-deep text-signal shadow-[0_0_32px_-6px_var(--color-signal)]"
          >
            <Check className="size-6" strokeWidth={2.6} aria-hidden="true" />
          </motion.span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="signal">Mission complete</Badge>
              <Badge tone={result.firstCompletion ? 'cyan' : 'neutral'}>{result.firstCompletion ? 'First clear' : 'Replay'}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{mission.completion.message}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
          <Stat label="Time" value={formatDuration(result.seconds)} note={timeNote} delay={0.1} />
          <Stat label="Hints used" value={result.hintsUsed} delay={0.15} />
          <Stat label="Wrong submissions" value={result.failures} delay={0.2} />
          <Stat label="Score" value={<CountUp value={result.score} delay={0.2} />} note={scoreNote} accent="text-cyan" delay={0.25} />
        </dl>
        <p className="-mt-3 font-mono text-[10.5px] text-ink-faint">
          Target time {formatDuration(mission.targetSeconds)}
          {result.previousBestSeconds != null && ` · previous best ${formatDuration(result.previousBestSeconds)}`}
          {result.previousBestScore != null && ` · previous best score ${result.previousBestScore}`}
        </p>

        <section className="rounded-lg border border-line bg-base/50">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h3 className="font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">Experience</h3>
            <span className="font-display text-2xl font-semibold text-signal">
              <CountUp value={result.xpAwarded} prefix="+" delay={0.3} /> <span className="text-sm text-ink-mute">XP</span>
            </span>
          </div>
          {result.firstCompletion ? (
            <ul className="space-y-1 px-4 py-3 font-mono text-[12px]">
              <li className="flex justify-between text-ink-soft">
                <span>{mission.difficulty} mission · first clear</span>
                <span className="text-ink">+{breakdown.base}</span>
              </li>
              {breakdown.bonuses.map((b, i) => (
                <motion.li key={b.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }} className="flex justify-between text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-signal" aria-hidden="true" /> {b.label}
                  </span>
                  <span className="text-signal">+{b.xp}</span>
                </motion.li>
              ))}
              {breakdown.bonuses.length === 0 && <li className="text-ink-faint">No performance bonuses this run.</li>}
            </ul>
          ) : (
            <p className="px-4 py-3 text-[13px] text-ink-mute">
              Replays do not award XP. Permanent XP is granted once, on a mission’s first clear. Your time and score still count toward personal bests.
            </p>
          )}
          <div className="border-t border-line px-4 py-3">
            <LevelProgress xp={result.xpAfter} fromXp={result.xpBefore} />
          </div>
        </section>

        {leveled && <LevelUpBanner from={result.levelBefore} to={result.levelAfter} />}

        {result.achievements.length > 0 && (
          <section>
            <h3 className="font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">Achievements unlocked</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {result.achievements.map((id, i) => {
                const def = getAchievement(id)
                const Icon = achievementIcon(def?.icon)
                return (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 rounded-lg border border-amber/25 bg-amber-deep/50 px-3 py-2"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-amber/40 text-amber">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-ink">{def?.name}</span>
                      <span className="block truncate text-[11.5px] text-ink-mute">{def?.description}</span>
                    </span>
                  </motion.li>
                )
              })}
            </ul>
          </section>
        )}

        <details className="group rounded-lg border border-line bg-base/40 px-4 py-2.5">
          <summary className="flex cursor-pointer items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase select-none">
            <BookOpen className="size-3.5" aria-hidden="true" /> What you learned
          </summary>
          <ul className="mt-2 space-y-1.5 pb-1">
            {mission.completion.learned.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </Dialog>
  )
}
