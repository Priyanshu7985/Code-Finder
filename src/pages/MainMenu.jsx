import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Crosshair, FlaskConical, Trophy, SlidersHorizontal, ChevronRight, UserRound } from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { useProgress } from '../context/ProgressContext'
import { LogoMark, Wordmark } from '../components/layout/Logo'
import { PlayerBadge } from '../components/game/PlayerBadge'
import { SystemStatus } from '../components/game/SystemStatus'
import { Kbd } from '../components/ui/Kbd'
import { MISSIONS, getMission } from '../game/missions'
import { isPlayable } from '../game/engine/progression'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export function MainMenu() {
  const { navigate } = useNavigation()
  const { profile, summary, hasProgress } = useProgress()
  const newAchievements = Object.values(profile.achievements).filter((a) => !a.seen).length

  // Continue resumes the last open run, otherwise the most recent open run, otherwise mission select.
  const openRuns = MISSIONS.filter((m) => profile.inProgress[m.id] && isPlayable(m, profile))
  const lastMission = getMission(profile.lastMissionId)
  const resumeTarget = (lastMission && profile.inProgress[lastMission.id] && isPlayable(lastMission, profile) ? lastMission : openRuns[0]) ?? null
  const continueLabel = resumeTarget ? `Resume ${resumeTarget.code} · ${resumeTarget.title}` : 'Return to the campaign'

  const go = (screen, params) => {
    playSound('open')
    navigate(screen, params)
  }

  const onContinue = () => (resumeTarget ? go('workspace', { missionId: resumeTarget.id }) : go('missions'))

  const menu = [
    { key: 'm', label: 'Missions', icon: Crosshair, meta: `${summary.completedMissions}/${summary.totalMissions} cleared`, screen: 'missions' },
    { key: 'o', label: 'Operator profile', icon: UserRound, meta: `Level ${summary.level.level} · ${summary.completionPct}% complete`, screen: 'profile' },
    { key: 't', label: 'Training Lab', icon: FlaskConical, meta: `${summary.lessonCount}/${summary.totalLessons} modules`, screen: 'training' },
    {
      key: 'a',
      label: 'Achievements',
      icon: Trophy,
      meta: `${summary.achievementCount}/${summary.totalAchievements} unlocked${newAchievements ? ` · ${newAchievements} new` : ''}`,
      screen: 'achievements',
    },
    { key: 's', label: 'Settings', icon: SlidersHorizontal, meta: 'Audio · Motion', screen: 'settings' },
  ]

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, [role="dialog"]')) return
      const k = e.key.toLowerCase()
      if (k === 'p') go('missions')
      else if (k === 'c' && hasProgress) onContinue()
      else {
        const hit = menu.find((m) => m.key === k)
        if (hit) go(hit.screen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        {/* Left: identity and primary actions */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="min-w-0">
          <motion.div variants={item} className="flex items-center gap-3">
            <LogoMark className="size-9" />
            <span className="font-mono text-[11px] tracking-[0.24em] text-ink-mute uppercase">Workstation 07 · Simulation</span>
          </motion.div>

          <motion.h1 variants={item} className="mt-6">
            <Wordmark size="xl" />
          </motion.h1>

          <motion.p variants={item} className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
            Every page has a surface and a source. Read the markup, bend the styles, and find what was never meant to be
            seen.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={() => go('missions')}
              className="group relative inline-flex h-14 items-center justify-between gap-6 overflow-hidden rounded-lg bg-signal pr-4 pl-6 text-void shadow-[0_0_0_1px_rgb(92_242_168/0.5),0_18px_40px_-18px_rgb(92_242_168/0.8)] transition hover:bg-[#7af7bb] active:translate-y-px sm:min-w-64"
            >
              <span className="flex items-center gap-3">
                <Play className="size-5 fill-current" aria-hidden="true" />
                <span className="font-display text-lg font-bold tracking-[0.18em]">PLAY</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="rounded border border-void/20 px-1.5 font-mono text-[10px] text-void/70">P</kbd>
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>

            {hasProgress && (
              <button
                type="button"
                onClick={onContinue}
                className="group inline-flex h-14 min-w-0 items-center justify-between gap-4 rounded-lg border border-line-strong bg-raised/80 px-5 text-left backdrop-blur transition hover:border-signal-dim hover:bg-elevated active:translate-y-px"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <RotateCcw className="size-4 shrink-0 text-signal" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">Continue</span>
                    <span className="block truncate font-mono text-[11px] text-ink-mute">{continueLabel}</span>
                  </span>
                </span>
                <Kbd>C</Kbd>
              </button>
            )}
          </motion.div>

          <motion.nav variants={item} aria-label="Main menu" className="mt-10 max-w-xl">
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel/70 backdrop-blur">
              {menu.map(({ key, label, icon: Icon, meta, screen }) => (
                <li key={screen}>
                  <button
                    type="button"
                    onClick={() => go(screen)}
                    onMouseEnter={() => playSound('hover')}
                    className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-raised focus-visible:bg-raised"
                  >
                    <span className="grid size-9 place-items-center rounded-md border border-line-strong bg-raised text-ink-soft transition group-hover:border-signal-dim group-hover:text-signal">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium text-ink">{label}</span>
                      <span className="block font-mono text-[11px] text-ink-mute">{meta}</span>
                    </span>
                    <Kbd>{key.toUpperCase()}</Kbd>
                    <ChevronRight
                      className="size-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-signal"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </motion.nav>
        </motion.div>

        {/* Right: operator + system */}
        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
          aria-label="Operator status"
        >
          <PlayerBadge />
          <SystemStatus />
        </motion.aside>
      </div>

      <footer className={cn('border-t border-line/70 px-4 py-3 sm:px-6')}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-faint">
          <span>All targets are fictional. No real systems, accounts or websites are accessed.</span>
          <span>BUILD 0.3.0</span>
        </div>
      </footer>
    </div>
  )
}
