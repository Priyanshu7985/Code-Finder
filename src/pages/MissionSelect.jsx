import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Crosshair, Play, Target, Lock } from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { useProgress } from '../context/ProgressContext'
import { ScreenShell } from '../components/layout/ScreenShell'
import { MissionCard, STATE_META, DIFFICULTY_TONE } from '../components/game/MissionCard'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Dialog } from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { MISSIONS, DIFFICULTIES, getMission } from '../game/missions'
import { getMissionState, isPlayable, lockReason } from '../game/engine/progression'
import { baseXpFor, maxXpFor, formatDuration } from '../game/progression/scoring'
import { PROGRESSION_CONFIG } from '../game/progression/config'

const FILTERS = [{ value: 'all', label: 'All' }, ...DIFFICULTIES.map((d) => ({ value: d.id, label: d.label }))]

export function MissionSelect() {
  const { navigate } = useNavigation()
  const { profile, summary } = useProgress()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const closeDialog = () => setDialogOpen(false)
  const openBriefing = (mission) => {
    setSelected(mission)
    setDialogOpen(true)
  }

  const groups = useMemo(
    () =>
      DIFFICULTIES.filter((d) => filter === 'all' || d.id === filter).map((d) => ({
        ...d,
        missions: MISSIONS.filter((m) => m.difficulty === d.id),
      })),
    [filter],
  )

  const completed = summary.completedMissions
  const selectedState = selected ? getMissionState(selected, profile) : null
  const canLaunch = selected ? isPlayable(selected, profile) : false
  const saved = selected ? profile.inProgress[selected.id] : null
  const selectedStats = selected ? profile.missions[selected.id] : null

  function launch() {
    if (!selected || !canLaunch) return
    navigate('workspace', { missionId: selected.id })
  }

  return (
    <ScreenShell
      eyebrow="Campaign · Operation Glasshouse"
      title="Mission select"
      description="Each contract is an isolated, fictional website. Missions unlock in sequence; replays never re-award XP. Every page runs in a sandbox with no scripts and no network access."
      actions={
        <span className="hidden font-mono text-[11px] text-ink-mute md:inline">
          {completed}/{MISSIONS.length} CLEARED
        </span>
      }
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <SegmentedControl label="Filter by difficulty" value={filter} onChange={setFilter} options={FILTERS} />
        <p className="font-mono text-[11px] text-ink-mute">
          {MISSIONS.filter((m) => m.implemented).length} of {MISSIONS.length} scenarios playable in this build
        </p>
      </div>

      <div className="space-y-12">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`grp-${group.id}`}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 id={`grp-${group.id}`} className="font-display text-lg font-semibold text-ink">
                {group.label}
              </h2>
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
              <p className="hidden text-[13px] text-ink-mute sm:block">{group.blurb}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {group.missions.map((mission) => {
                  const state = getMissionState(mission, profile)
                  return (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      state={state}
                      stats={profile.missions[mission.id]}
                      reason={lockReason(mission, profile, getMission)}
                      onSelect={openBriefing}
                    />
                  )
                })}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        icon={canLaunch ? Target : Lock}
        tone={canLaunch ? 'signal' : 'amber'}
        title={selected ? `${selected.code} · ${selected.title}` : ''}
        description={selected?.tagline}
        className="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} sound="back">
              Close
            </Button>
            <Button variant="primary" icon={canLaunch ? Play : Lock} disabled={!canLaunch} onClick={launch} sound="open" data-autofocus>
              {canLaunch ? (saved ? 'Resume mission' : 'Launch mission') : 'Unavailable'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={STATE_META[selectedState].tone} icon={STATE_META[selectedState].icon}>
                {STATE_META[selectedState].label}
              </Badge>
              <Badge tone={DIFFICULTY_TONE[selected.difficulty]}>{selected.difficulty}</Badge>
              <Badge>{selected.skill}</Badge>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-ink-soft">
              {selected.briefing.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-ink-mute uppercase">
                <Crosshair className="size-3.5" aria-hidden="true" /> Objectives
              </h3>
              <ol className="mt-2 space-y-1.5">
                {selected.objectives.map((o, i) => (
                  <li key={o.id} className="flex gap-2.5 text-sm text-ink">
                    <span className="font-mono text-[11px] leading-5 text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                    {o.label}
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-1 rounded-md border border-line bg-panel px-3 py-2 font-mono text-[11px] text-ink-mute">
              {selectedStats?.completions ? (
                <p>
                  Cleared {selectedStats.completions}× · best time {formatDuration(selectedStats.bestSeconds)} · best score {selectedStats.bestScore ?? '—'} · replays award no XP
                </p>
              ) : (
                <p>
                  First clear: {baseXpFor(selected)} XP + up to {maxXpFor(selected) - baseXpFor(selected)} bonus (first attempt +{PROGRESSION_CONFIG.bonuses.firstAttempt}, no hints +
                  {PROGRESSION_CONFIG.bonuses.noHints}, speed up to +{PROGRESSION_CONFIG.bonuses.speedMax})
                </p>
              )}
              <p>Target time {formatDuration(selected.targetSeconds)} · ~{selected.estimatedMinutes} min estimated</p>
              {!canLaunch && <p className="text-amber">{lockReason(selected, profile, getMission)}</p>}
            </div>
          </div>
        )}
      </Dialog>
    </ScreenShell>
  )
}
