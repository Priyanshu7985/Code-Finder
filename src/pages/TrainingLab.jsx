import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, CircleCheck, Lightbulb } from 'lucide-react'
import { ScreenShell } from '../components/layout/ScreenShell'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { LESSONS } from '../data/lessons'
import { LESSON_EXAMPLES } from '../components/training/examples'
import { useProgress } from '../context/ProgressContext'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/cn'

export function TrainingLab() {
  const { profile, completeLesson } = useProgress()
  const { notify } = useToast()
  const [index, setIndex] = useState(() => {
    const firstOpen = LESSONS.findIndex((l) => !profile.lessons.includes(l.id))
    return firstOpen === -1 ? 0 : firstOpen
  })

  const lesson = LESSONS[index]
  const Example = LESSON_EXAMPLES[lesson.example]
  const done = profile.lessons.includes(lesson.id)
  const completedCount = profile.lessons.length

  function markComplete() {
    if (!done) {
      completeLesson(lesson.id)
      notify({ tone: 'success', title: `${lesson.code} complete`, message: lesson.title, duration: 2500 })
    }
    if (index < LESSONS.length - 1) setIndex(index + 1)
  }

  return (
    <ScreenShell
      eyebrow="Training Lab"
      title="Learn the toolkit"
      description="Five short, interactive modules covering the concepts every mission relies on. Everything here runs in a deterministic sandbox."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Training modules" className="lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-3">
            <div className="flex items-center justify-between px-1 pb-2 font-mono text-[11px] text-ink-mute">
              <span>MODULES</span>
              <span>
                {completedCount}/{LESSONS.length}
              </span>
            </div>
            <ProgressBar value={completedCount / LESSONS.length} label="Training progress" thin className="mx-1 mb-3" />
            <ol className="space-y-1">
              {LESSONS.map((l, i) => {
                const isDone = profile.lessons.includes(l.id)
                const active = i === index
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
                        active ? 'bg-elevated text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-6 shrink-0 place-items-center rounded-md border font-mono text-[10px]',
                          isDone ? 'border-signal-dim bg-signal-deep text-signal' : 'border-line-strong text-ink-mute',
                        )}
                      >
                        {isDone ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium">{l.title}</span>
                        <span className="block font-mono text-[10px] text-ink-mute">{l.code}</span>
                      </span>
                      <span className="sr-only">{isDone ? '(completed)' : ''}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          <motion.article
            key={lesson.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="panel min-w-0 overflow-hidden"
            aria-labelledby="lesson-title"
          >
            <header className="border-b border-line px-5 py-5 sm:px-6">
              <p className="font-mono text-[11px] tracking-[0.16em] text-signal">{lesson.code}</p>
              <h2 id="lesson-title" className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                {lesson.title}
              </h2>
              <p className="mt-1 text-sm text-ink-mute">{lesson.summary}</p>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="max-w-3xl space-y-3 text-[14.5px] leading-relaxed text-ink-soft">
                {lesson.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>

              {Example && (
                <section aria-label="Interactive example" className="rounded-xl border border-line bg-panel/60 p-4">
                  <Example />
                </section>
              )}

              <p className="flex items-start gap-2.5 rounded-lg border border-amber/20 bg-amber-deep/40 px-3.5 py-3 text-[13.5px] text-ink">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />
                {lesson.takeaway}
              </p>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
              <Button variant="ghost" size="sm" icon={ChevronLeft} disabled={index === 0} onClick={() => setIndex(index - 1)}>
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {done && (
                  <span className="flex items-center gap-1.5 text-[13px] text-signal">
                    <CircleCheck className="size-4" aria-hidden="true" /> Completed
                  </span>
                )}
                {!done || index < LESSONS.length - 1 ? (
                  <Button variant={done ? 'secondary' : 'primary'} size="sm" iconRight={ChevronRight} onClick={markComplete}>
                    {done ? 'Next module' : index < LESSONS.length - 1 ? 'Complete & continue' : 'Complete module'}
                  </Button>
                ) : null}
              </div>
            </footer>
          </motion.article>
        </AnimatePresence>
      </div>
    </ScreenShell>
  )
}
