import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ArrowLeft, Lightbulb, RotateCcw, TriangleAlert } from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { useProgress } from '../context/ProgressContext'
import { useToast } from '../context/ToastContext'
import { getMission } from '../game/missions'
import { isPlayable } from '../game/engine/progression'
import { createSession, sessionProgress, sessionReducer } from '../game/engine/session'
import { createContext } from '../game/engine/context'
import { PROGRESSION_CONFIG } from '../game/progression/config'
import { getValidator, validateAnswer } from '../game/validators'
import { usePlayTimer } from '../hooks/usePlayTimer'
import { findByUid, findByKey, ancestorUids, nodeLabel, materialize, isElement } from '../game/simulation/tree'
import { createPageState, applyEdit, resetStyles, stylesChanged } from '../game/simulation/pageState'
import { probeDocument, inspectElement, elementFor, queryUid } from '../game/simulation/probe'
import { WorkspaceTopBar } from '../components/game/workspace/WorkspaceTopBar'
import { MissionPanel } from '../components/game/workspace/MissionPanel'
import { BrowserFrame } from '../components/game/workspace/BrowserFrame'
import { DevToolsPanel } from '../components/game/workspace/DevToolsPanel'
import { StatusBar } from '../components/game/workspace/StatusBar'
import { MissionResults } from '../components/game/workspace/MissionResults'
import { Dialog } from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'

const MOBILE_VIEWS = [
  { value: 'brief', label: 'Brief' },
  { value: 'browser', label: 'Browser' },
  { value: 'tools', label: 'DevTools' },
]

const EMPTY_PROBE = { nodes: {}, selected: null }
const parentUid = (uid) => (uid.includes('.') ? uid.slice(0, uid.lastIndexOf('.')) : null)

export function Workspace({ missionId }) {
  const { navigate } = useNavigation()
  const { profile } = useProgress()
  const mission = getMission(missionId)

  if (!mission || !isPlayable(mission, profile) || !getValidator(mission.id)) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="panel max-w-md p-6 text-center">
          <TriangleAlert className="mx-auto size-6 text-amber" aria-hidden="true" />
          <h1 className="mt-3 font-display text-xl font-semibold">Mission unavailable</h1>
          <p className="mt-2 text-sm text-ink-soft">This scenario is locked or not playable in the current build.</p>
          <Button className="mt-5" icon={ArrowLeft} onClick={() => navigate('missions')}>
            Back to missions
          </Button>
        </div>
      </div>
    )
  }

  return <RunGate mission={mission} />
}

/**
 * Owns the persisted run for this visit. The run is kept in local state so
 * the results screen stays mounted after completion removes it from the
 * profile; Replay clears it, which starts a fresh run (new run id).
 */
function RunGate({ mission }) {
  const { profile, ensureRun } = useProgress()
  const [run, setRun] = useState(() => profile.inProgress[mission.id] ?? null)

  useEffect(() => {
    if (!run) setRun(ensureRun(mission.id))
  }, [run, ensureRun, mission.id])

  if (!run) return null
  return <MissionWorkspace key={run.runId} mission={mission} run={run} onReplay={() => setRun(null)} />
}

function MissionWorkspace({ mission, run, onReplay }) {
  const { navigate } = useNavigation()
  const { updateRun, addPlayTime, completeRun } = useProgress()
  const { notify } = useToast()
  const validator = getValidator(mission.id)

  /* ------------------------------ State ------------------------------ */
  const original = useMemo(() => createPageState(mission), [mission])
  const [page, setPage] = useState(original)
  const [session, dispatch] = useReducer(sessionReducer, run, (saved) => createSession(mission, saved))
  const [probe, setProbe] = useState(EMPTY_PROBE)
  const [tab, setTab] = useState('html')
  const [selectedUid, setSelectedUid] = useState(null)
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [picker, setPicker] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [mobileView, setMobileView] = useState('browser')
  const [resetNonce, setResetNonce] = useState(0)
  const [dialog, setDialog] = useState(null) // 'hint' | 'reset' | 'complete' | null
  const [result, setResult] = useState(null)

  const docRef = useRef(null)
  const probeKey = useRef('')

  /* ------------------------- Derived simulation ---------------------- */
  // Flags are computed by the trusted validator from the model + action log.
  const flags = useMemo(
    () => validator.flags?.(createContext({ tree: page.tree, events: session.events })) ?? {},
    [validator, page.tree, session.events],
  )
  const view = useMemo(() => materialize(page.tree, flags), [page.tree, flags])
  const selectedNode = findByUid(view, selectedUid)
  const stats = sessionProgress(mission, session)
  const stylesDirty = useMemo(() => stylesChanged(page, original), [page, original])
  const ctx = useMemo(
    () => createContext({ tree: page.tree, view, probe, events: session.events, flags }),
    [page.tree, view, probe, session.events, flags],
  )

  // Measure the sandbox after each commit; only update state when it changed.
  const handleCommit = useCallback(
    (doc) => {
      docRef.current = doc
      // A frame without layout (e.g. collapsed panel) would report everything hidden.
      if (!doc.documentElement.clientWidth) return
      const next = probeDocument(doc, page.rules, isElement(selectedNode) ? selectedUid : null)
      const key = JSON.stringify(next)
      if (key !== probeKey.current) {
        probeKey.current = key
        setProbe(next)
      }
    },
    [page.rules, selectedNode, selectedUid],
  )

  /* -------------------------- Persistence ---------------------------- */
  // Objective progress, hints and failures are saved to the run so Continue can resume it.
  useEffect(() => {
    if (session.status === 'complete') return
    updateRun(mission.id, run.runId, { completed: session.completed, hintsUsed: session.hintsUsed, failures: session.failures })
  }, [session.completed, session.hintsUsed, session.failures, session.status, mission.id, run.runId, updateRun])

  const timer = usePlayTimer({
    baseSeconds: run.seconds,
    active: session.status !== 'complete',
    onFlush: (s) => addPlayTime(mission.id, run.runId, s),
  })

  /* --------------------------- Validation ---------------------------- */
  useEffect(() => {
    if (session.status === 'complete') return
    const ids = mission.objectives
      .filter((o) => !session.completed.includes(o.id) && validator.objectives[o.id]?.(ctx))
      .map((o) => o.id)
    if (ids.length) dispatch({ type: 'complete', mission, ids })
  }, [ctx, mission, validator, session.completed, session.status])

  // Objective toasts.
  const doneCount = useRef(session.completed.length)
  useEffect(() => {
    if (session.completed.length > doneCount.current && session.status !== 'complete') {
      const latest = mission.objectives.filter((o) => session.completed.includes(o.id)).at(-1)
      notify({ tone: 'success', title: 'Objective complete', message: latest?.label, duration: 2800 })
      playSound('success')
    }
    doneCount.current = session.completed.length
  }, [session.completed, session.status, mission.objectives, notify])

  // Mission completion. Only reached when the validator has confirmed every
  // objective; the run id makes the reward idempotent (see applyCompletion).
  const completedRun = useRef(false)
  useEffect(() => {
    if (session.status !== 'complete' || completedRun.current) return
    completedRun.current = true
    const outcome = completeRun(mission, {
      runId: run.runId,
      hintsUsed: session.hintsUsed,
      failures: session.failures,
      seconds: timer.getSeconds(),
    })
    if (outcome.duplicate) return
    setResult(outcome)
    setPicker(false)
    playSound('success')
    window.setTimeout(() => setDialog('complete'), 450)
  }, [session.status, session.hintsUsed, session.failures, mission, run.runId, completeRun, timer])

  /* ----------------------------- Actions ----------------------------- */
  const record = useCallback((event) => dispatch({ type: 'record', event }), [])

  const openTab = useCallback((id) => {
    setTab(id)
    setMobileView('tools')
  }, [])

  const selectNode = useCallback(
    (uid) => {
      const node = findByUid(view, uid)
      if (!node) return
      setSelectedUid(uid)
      setCollapsed((prev) => {
        const ancestors = ancestorUids(uid)
        if (!ancestors.some((a) => prev.has(a))) return prev
        const next = new Set(prev)
        ancestors.forEach((a) => next.delete(a))
        return next
      })
      if (node.key) record({ type: 'select', key: node.key })
    },
    [view, record],
  )

  const pickNode = useCallback(
    (uid) => {
      selectNode(uid)
      setPicker(false)
      setTab((t) => (t === 'console' ? 'html' : t))
    },
    [selectNode],
  )

  const toggleNode = useCallback((uid) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }, [])

  /** Real interaction inside the sandbox (picker off). */
  const handleInteract = useCallback(
    (uid) => {
      const doc = docRef.current
      if (!doc || session.status === 'complete') return
      const keyed = []
      for (let u = uid; u; u = parentUid(u)) {
        const n = findByUid(view, u)
        if (n?.key) keyed.push(n)
      }
      if (!keyed.length) return
      // Visibility is measured at the moment of the click, from the live document.
      const state = Object.fromEntries(keyed.map((n) => [n.key, inspectElement(elementFor(doc, n.uid))]))
      record({ type: 'click', keys: keyed.map((n) => n.key), state })

      const actor = keyed.find((n) => n.action)
      if (actor?.action.type === 'form' && state[actor.key]?.interactive) {
        const values = {}
        for (const [field, key] of Object.entries(actor.action.fields)) {
          const target = findByKey(view, key)
          values[field] = String(elementFor(doc, target?.uid)?.value ?? '').slice(0, 120)
        }
        const event = { type: 'form', key: actor.key, values }
        dispatch({ type: 'attempt', ok: validator.judgeForm ? validator.judgeForm(event) : true })
        record(event)
      }
    },
    [view, record, session.status, validator],
  )

  /** Apply a validated edit to the page model. Returns false when rejected. */
  const edit = useCallback(
    (op) => {
      const { state, error } = applyEdit(page, op)
      if (error) {
        notify({ tone: 'warning', title: 'Edit rejected', message: error, duration: 3600 })
        playSound('error')
        return false
      }
      setPage(state)
      return true
    },
    [page, notify],
  )

  const resetCss = useCallback(() => {
    setPage((p) => resetStyles(p, original))
    notify({ tone: 'info', title: 'CSS restored', message: 'All rules and inline styles are back to their original values.', duration: 2600 })
  }, [original, notify])

  const submitAnswer = useCallback(
    (value) => {
      if (!validator.answer) return { ok: false, message: 'This mission is validated from the page itself. No answer is needed.' }
      if (session.status === 'complete') return { ok: false, message: 'Mission already complete.' }
      const outcome = validateAnswer(mission.id, value, ctx, session.completed)
      if (!outcome.locked && String(value).trim()) dispatch({ type: 'attempt', ok: outcome.ok })
      setFeedback(outcome)
      if (outcome.ok) record({ type: 'answer', ok: true })
      else playSound('error')
      return outcome
    },
    [validator, session.status, session.completed, mission.id, ctx, record],
  )

  const consoleApi = useMemo(
    () => ({
      selectBySelector: (selector) => {
        const uid = queryUid(docRef.current, selector)
        if (uid === 'invalid') return 'invalid'
        if (!uid) return null
        selectNode(uid)
        return nodeLabel(findByUid(view, uid))
      },
      getSelected: () => (isElement(selectedNode) ? selectedNode : null),
      label: nodeLabel,
      objectives: () => mission.objectives.map((o) => ({ label: o.label, done: session.completed.includes(o.id) })),
      submit: submitAnswer,
      openHint: () => setDialog('hint'),
    }),
    [selectNode, view, selectedNode, mission.objectives, session.completed, submitAnswer],
  )

  function revealHint() {
    dispatch({ type: 'hint', mission })
    playSound('open')
    setDialog(null)
  }

  function doReset() {
    setPage(original)
    dispatch({ type: 'reset', mission })
    setSelectedUid(null)
    setCollapsed(new Set())
    setFeedback(null)
    setPicker(false)
    setResult(null)
    setProbe(EMPTY_PROBE)
    probeKey.current = ''
    doneCount.current = 0
    completedRun.current = false
    setResetNonce((n) => n + 1)
    setDialog(null)
    notify({ tone: 'info', title: 'Mission reset', message: 'The simulated page and objectives are back to their initial state.', duration: 2600 })
  }

  // Confirm only when there is something to lose.
  // After completion the run is closed, so resetting means starting a new run.
  const needsConfirm = page.edits > 0 || session.completed.length > 0 || session.events.length > 0
  const requestReset = () => {
    if (session.status === 'complete') onReplay()
    else if (needsConfirm) setDialog('reset')
    else doReset()
  }

  // Esc exits only when nothing else is handling it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || dialog) return
      if (picker) {
        setPicker(false)
        return
      }
      if (!e.target.closest?.('input, textarea')) navigate('missions')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, picker, navigate])

  const hintsLeft = mission.hints.length - session.hintsUsed
  const nextHint = mission.hints[session.hintsUsed]
  const nextMission = getMission(result?.nextMissionId)

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <WorkspaceTopBar
        mission={mission}
        progress={stats}
        hintsLeft={hintsLeft}
        onExit={() => navigate('missions')}
        onHome={() => navigate('menu')}
        onHint={() => setDialog('hint')}
        onReset={requestReset}
      />

      <div className="flex justify-center border-b border-line bg-base/80 px-3 py-2 lg:hidden">
        <SegmentedControl label="Workspace panel" value={mobileView} onChange={setMobileView} options={MOBILE_VIEWS} size="sm" />
      </div>

      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-3 p-3 lg:grid-cols-[minmax(250px,290px)_minmax(0,1fr)_minmax(340px,400px)] xl:grid-cols-[310px_minmax(0,1fr)_440px]">
        <div className={cn('min-h-0', mobileView === 'brief' ? 'block' : 'hidden', 'lg:block')}>
          <MissionPanel
            key={`brief-${resetNonce}`}
            mission={mission}
            session={session}
            feedback={feedback}
            onSubmit={(v) => submitAnswer(v).ok}
            onHint={() => setDialog('hint')}
          />
        </div>
        {/* The browser stays laid out (only invisible) on small screens so the sandbox can still be measured. */}
        <div
          className={cn(
            'min-h-0',
            mobileView !== 'browser' && 'pointer-events-none invisible absolute inset-3 lg:pointer-events-auto lg:visible lg:static',
          )}
          aria-hidden={mobileView !== 'browser' ? true : undefined}
        >
          <BrowserFrame
            key={`browser-${resetNonce}`}
            page={mission.page}
            tree={view}
            rules={page.rules}
            selectedUid={isElement(selectedNode) ? selectedUid : null}
            picker={picker}
            onTogglePicker={() => setPicker((v) => !v)}
            onPick={pickNode}
            onInteract={handleInteract}
            onCommit={handleCommit}
          />
        </div>
        <div className={cn('min-h-0', mobileView === 'tools' ? 'block' : 'hidden', 'lg:block')}>
          <DevToolsPanel
            key={`tools-${resetNonce}`}
            tab={tab}
            onTabChange={openTab}
            tree={view}
            rules={page.rules}
            selectedNode={selectedNode}
            collapsed={collapsed}
            probe={probe}
            onToggleNode={toggleNode}
            onSelectNode={selectNode}
            onEdit={edit}
            onResetStyles={resetCss}
            stylesDirty={stylesDirty}
            consoleApi={consoleApi}
          />
        </div>
      </div>

      <StatusBar
        session={session}
        selectedNode={selectedNode}
        picker={picker}
        mission={mission}
        edits={page.edits}
        seconds={timer.seconds}
      />

      <Dialog
        open={dialog === 'hint'}
        onClose={() => setDialog(null)}
        icon={Lightbulb}
        tone="amber"
        title="Hint terminal"
        description={
          nextHint
            ? `${hintsLeft} hint${hintsLeft === 1 ? '' : 's'} remaining.`
            : 'All hints for this mission have been revealed. The latest is shown in the mission panel.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)} sound="back">
              Close
            </Button>
            {nextHint && session.status !== 'complete' && (
              <Button variant="primary" icon={Lightbulb} onClick={revealHint} sound={null} data-autofocus>
                Reveal hint {session.hintsUsed + 1}
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {nextHint ? (
            <>
              {session.hintsUsed === 0 ? (
                <>
                  Using any hint forfeits the <span className="font-mono text-amber">+{PROGRESSION_CONFIG.bonuses.noHints} XP</span> no-hint bonus on a first
                  clear, and every hint lowers your run score by {PROGRESSION_CONFIG.score.perHint}.
                </>
              ) : (
                <>Each additional hint lowers your run score by {PROGRESSION_CONFIG.score.perHint}.</>
              )}{' '}
              Hints stay revealed even if you reset the mission.
            </>
          ) : (
            'Keep investigating. The Computed section of the CSS tab explains why any element is hidden.'
          )}
        </p>
      </Dialog>

      <Dialog
        open={dialog === 'reset'}
        onClose={() => setDialog(null)}
        icon={RotateCcw}
        tone="danger"
        title="Reset this mission?"
        description="Your page edits, objective progress, selections and console history will be cleared. Revealed hints remain revealed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)} sound="back" data-autofocus>
              Cancel
            </Button>
            <Button variant="danger" icon={RotateCcw} onClick={doReset}>
              Reset mission
            </Button>
          </>
        }
      />

      <MissionResults
        open={dialog === 'complete'}
        mission={mission}
        result={result}
        nextMission={nextMission}
        onClose={() => setDialog(null)}
        onReplay={onReplay}
        onMissions={() => navigate('missions')}
        onNext={() => nextMission && navigate('workspace', { missionId: nextMission.id })}
      />
    </div>
  )
}
