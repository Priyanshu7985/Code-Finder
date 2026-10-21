import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Crosshair, FlaskConical, Lightbulb, Lock, RotateCw, Trophy, XCircle } from 'lucide-react'
import { ScreenShell } from '../components/layout/ScreenShell'
import { LevelProgress } from '../components/game/LevelProgress'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { achievementIcon } from '../components/game/achievementIcons'
import { DIFFICULTY_TONE } from '../components/game/MissionCard'
import { useProgress } from '../context/ProgressContext'
import { useNavigation } from '../context/NavigationContext'
import { MISSIONS } from '../game/missions'
import { getMissionState, MISSION_STATE } from '../game/engine/progression'
import { rankForLevel } from '../game/progression/levels'
import { achievementViews } from '../game/progression/achievements'
import { formatDuration } from '../game/progression/scoring'
import { formatDate } from './Achievements'
import { cn } from '../lib/cn'

function formatPlayTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h ? `${h}h ${m}m` : m ? `${m}m ${seconds % 60}s` : `${seconds}s`
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-panel px-4 py-3.5">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-ink-mute uppercase">
        <Icon className="size-3.5" aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-semibold text-ink tabular-nums">{value}</dd>
      {sub && <p className="font-mono text-[10.5px] text-ink-faint">{sub}</p>}
    </div>
  )
}

/** Completion ring (SVG) for overall progress. */
function Ring({ pct }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-line" />
      <motion.circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        className="stroke-signal"
        style={{ filter: 'drop-shadow(0 0 6px rgb(92 242 168 / 0.5))' }}
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct / 100) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </svg>
  )
}

export function Profile() {
  const { profile, summary } = useProgress()
  const { navigate } = useNavigation()
  const recent = achievementViews(profile)
    .filter((a) => a.unlockedAt)
    .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
    .slice(0, 4)

  return (
    <ScreenShell
      eyebrow="Operator file"
      title="Profile"
      description="Your progression is stored on this device only. No account, no personal data."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="panel corner-ticks p-5 sm:p-6" aria-labelledby="op-level">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-xl border border-signal-dim/60 bg-signal-deep font-display text-3xl font-bold text-signal shadow-[0_0_28px_-8px_var(--color-signal)]">
                {summary.level.level}
              </span>
              <div>
                <p className="font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">Level {summary.level.level}</p>
                <h2 id="op-level" className="font-display text-2xl font-semibold text-ink">
                  {rankForLevel(summary.level.level)}
                </h2>
                <p className="font-mono text-[11px] text-ink-mute">{summary.xp.toLocaleString('en-US')} XP total</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <Ring pct={summary.completionPct} />
                <span className="absolute inset-0 grid place-items-center font-display text-lg font-semibold text-ink">{summary.completionPct}%</span>
              </div>
              <p className="max-w-[9rem] text-[12px] leading-snug text-ink-mute">Overall completion across missions, achievements and training.</p>
            </div>
          </div>
          <LevelProgress xp={summary.xp} size="lg" className="mt-6" />
        </section>

        <section className="panel p-5" aria-labelledby="recent-ach">
          <div className="flex items-center justify-between">
            <h2 id="recent-ach" className="font-mono text-[11px] tracking-[0.16em] text-ink-mute uppercase">
              Recent achievements
            </h2>
            <span className="font-mono text-[11px] text-amber">
              {summary.achievementCount}/{summary.totalAchievements}
            </span>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-[13px] text-ink-mute">None yet. Clear your first mission to earn First Breach.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.map((a) => {
                const Icon = achievementIcon(a.icon)
                return (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-amber/40 bg-amber-deep text-amber">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-ink">{a.name}</span>
                      <span className="block font-mono text-[10.5px] text-ink-faint">{formatDate(a.unlockedAt)}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <Button size="sm" variant="ghost" className="mt-3 -ml-2" icon={Trophy} onClick={() => navigate('achievements')}>
            All achievements
          </Button>
        </section>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        <Stat icon={CheckCircle2} label="Missions" value={`${summary.completedMissions}/${summary.totalMissions}`} sub={`${summary.completions} total clears`} />
        <Stat icon={RotateCw} label="Mission attempts" value={summary.runs} sub="runs started" />
        <Stat icon={Lightbulb} label="Hints used" value={summary.hintsUsed} />
        <Stat icon={XCircle} label="Wrong submissions" value={summary.failures} />
        <Stat icon={Clock} label="Play time" value={formatPlayTime(summary.playSeconds)} sub="active, in missions" />
        <Stat icon={FlaskConical} label="Training" value={`${summary.lessonCount}/${summary.totalLessons}`} />
      </dl>

      <section className="mt-8" aria-labelledby="mission-records">
        <h2 id="mission-records" className="mb-3 font-display text-lg font-semibold text-ink">
          Mission records
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="bg-raised font-mono text-[10.5px] tracking-wider text-ink-mute uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Mission</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Clears</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Best time</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Best score</th>
                <th scope="col" className="px-4 py-2.5 font-medium">XP earned</th>
                <th scope="col" className="px-4 py-2.5 font-medium">First cleared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-panel">
              {MISSIONS.map((m) => {
                const s = profile.missions[m.id]
                const state = getMissionState(m, profile)
                const locked = state === MISSION_STATE.locked
                return (
                  <tr key={m.id} className={cn(locked && 'text-ink-faint')}>
                    <th scope="row" className="px-4 py-3 font-normal">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-ink-mute">{m.code}</span>
                        <span className={cn('font-medium', locked ? 'text-ink-faint' : 'text-ink')}>{m.title}</span>
                        <Badge tone={DIFFICULTY_TONE[m.difficulty]} className="hidden md:inline-flex">
                          {m.difficulty}
                        </Badge>
                      </span>
                    </th>
                    <td className="px-4 py-3">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-ink-faint">
                          <Lock className="size-3" aria-hidden="true" /> Locked
                        </span>
                      ) : s?.completions ? (
                        <span className="text-signal">Completed</span>
                      ) : state === MISSION_STATE.inProgress ? (
                        <span className="text-cyan">In progress</span>
                      ) : (
                        <span className="text-ink-soft">Available</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{s?.completions ?? 0}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      {s?.bestSeconds != null ? (
                        <span className={s.speedClear ? 'text-signal' : ''} title={`Target ${formatDuration(m.targetSeconds)}`}>
                          {formatDuration(s.bestSeconds)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{s?.bestScore ?? '—'}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{s?.xpEarned ?? 0}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{s?.firstCompletedAt ? formatDate(s.firstCompletedAt) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Button className="mt-4" icon={Crosshair} onClick={() => navigate('missions')}>
          Mission select
        </Button>
      </section>
    </ScreenShell>
  )
}
