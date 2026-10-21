import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Check, KeyRound, Lightbulb, ScrollText, Send } from 'lucide-react'
import { Button } from '../../ui/Button'
import { cn } from '../../../lib/cn'

/**
 * Left column: briefing, live objectives, current hint and (for missions
 * that need one) the answer terminal.
 */
export function MissionPanel({ mission, session, feedback, onSubmit, onHint }) {
  const [answer, setAnswer] = useState('')
  const complete = session.status === 'complete'
  const revealed = mission.hints.slice(0, session.hintsUsed)
  const current = revealed[revealed.length - 1]
  const hintsLeft = mission.hints.length - session.hintsUsed

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line-strong bg-panel" aria-label="Mission briefing">
      <div className="min-h-0 flex-1 space-y-6 overflow-auto p-4">
        <section>
          <h2 className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">
            <ScrollText className="size-3.5" aria-hidden="true" /> Briefing
          </h2>
          <div className="mt-2.5 space-y-2.5 text-[13.5px] leading-relaxed text-ink-soft">
            {mission.briefing.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">
            Objectives
            <span className="flex items-center gap-1 normal-case tracking-normal text-signal-dim">
              <Activity className="size-3" aria-hidden="true" /> live
            </span>
          </h2>
          <ol className="mt-2.5 space-y-1.5">
            {mission.objectives.map((o, i) => {
              const done = session.completed.includes(o.id)
              return (
                <li
                  key={o.id}
                  className={cn(
                    'flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-[13px] transition-colors duration-300',
                    done ? 'border-signal-dim/40 bg-signal-deep/60 text-ink' : 'border-line bg-base/40 text-ink-soft',
                  )}
                >
                  <span
                    className={cn(
                      'mt-px grid size-4 shrink-0 place-items-center rounded-[4px] border font-mono text-[9px]',
                      done ? 'border-signal bg-signal text-void' : 'border-line-strong text-ink-mute',
                    )}
                  >
                    {done ? (
                      <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }}>
                        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                      </motion.span>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={cn(done && 'line-through decoration-signal-dim/70')}>{o.label}</span>
                  <span className="sr-only">{done ? '(complete)' : '(incomplete)'}</span>
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-live="polite">
          <h2 className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">
            <span className="flex items-center gap-2">
              <Lightbulb className={cn('size-3.5', current ? 'text-amber' : '')} aria-hidden="true" /> Hint
            </span>
            <span className="tracking-normal normal-case">
              {session.hintsUsed}/{mission.hints.length}
            </span>
          </h2>
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={session.hintsUsed}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 rounded-md border border-amber/25 bg-amber-deep/50 px-3 py-2.5"
              >
                <p className="font-mono text-[10px] text-amber">HINT {session.hintsUsed}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink">{current}</p>
              </motion.div>
            ) : (
              <p className="mt-2.5 text-[12.5px] text-ink-mute">No hints used. Investigate first: any hint forfeits the no-hint bonus and lowers your score.</p>
            )}
          </AnimatePresence>
          {revealed.length > 1 && (
            <details className="mt-2 text-[12px] text-ink-mute">
              <summary className="cursor-pointer select-none hover:text-ink-soft">Earlier hints</summary>
              <ol className="mt-1.5 space-y-1.5">
                {revealed.slice(0, -1).map((hint, i) => (
                  <li key={hint} className="leading-relaxed">
                    <span className="mr-1 font-mono text-[10px] text-amber">#{i + 1}</span>
                    {hint}
                  </li>
                ))}
              </ol>
            </details>
          )}
          {hintsLeft > 0 && !complete && (
            <Button size="sm" variant="ghost" icon={Lightbulb} onClick={onHint} sound="open" className="mt-2 -ml-2">
              {current ? 'Next hint' : 'Request a hint'}
            </Button>
          )}
        </section>
      </div>

      {mission.answerPrompt && (
        <form
          className="shrink-0 border-t border-line bg-base/50 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (onSubmit(answer)) setAnswer('')
          }}
        >
          <label htmlFor="answer-input" className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-ink-mute uppercase">
            <KeyRound className="size-3.5" aria-hidden="true" /> {mission.answerPrompt.label}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={complete}
              autoComplete="off"
              spellCheck={false}
              maxLength={80}
              placeholder={complete ? 'Mission complete' : mission.answerPrompt.placeholder}
              aria-describedby="answer-feedback"
              className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-panel px-3 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-signal-dim focus:outline-none disabled:opacity-60"
            />
            <Button type="submit" variant="primary" size="icon" icon={Send} disabled={complete} aria-label="Submit answer" sound={null} />
          </div>
          <p
            id="answer-feedback"
            aria-live="polite"
            className={cn('mt-2 min-h-[1.25rem] text-[12px] leading-snug', feedback?.ok ? 'text-signal' : feedback ? 'text-danger' : 'text-ink-faint')}
          >
            {feedback?.message ?? 'Answers are checked by the mission validator, not the page.'}
          </p>
        </form>
      )}
    </aside>
  )
}
