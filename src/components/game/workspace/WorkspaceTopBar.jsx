import { Home, Lightbulb, LogOut, RotateCcw } from 'lucide-react'
import { Button } from '../../ui/Button'
import { ProgressBar } from '../../ui/ProgressBar'
import { LogoMark } from '../../layout/Logo'

export function WorkspaceTopBar({ mission, progress, hintsLeft, onExit, onHome, onHint, onReset }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-base/85 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
      <Button variant="ghost" size="sm" icon={LogOut} onClick={onExit} sound="back" aria-label="Exit to mission select">
        <span className="hidden sm:inline">Exit</span>
      </Button>
      <Button variant="ghost" size="icon" icon={Home} onClick={onHome} sound="back" aria-label="Main menu" title="Main menu" className="hidden sm:inline-flex" />
      <span className="h-5 w-px bg-line" aria-hidden="true" />
      <LogoMark className="hidden size-6 md:block" />
      <div className="min-w-0">
        <p className="truncate font-mono text-[10px] tracking-[0.16em] text-ink-mute uppercase">
          {mission.code} · {mission.skill}
        </p>
        <h1 className="truncate font-display text-[15px] font-semibold tracking-tight text-ink">{mission.title}</h1>
      </div>

      <div className="mx-auto hidden w-56 md:block" aria-label="Mission progress">
        <div className="flex justify-between font-mono text-[10px] text-ink-mute">
          <span>PROGRESS</span>
          <span>
            {progress.done}/{progress.total} OBJECTIVES
          </span>
        </div>
        <ProgressBar value={progress.ratio} label="Mission objectives complete" className="mt-1.5" />
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:ml-0">
        <span className="font-mono text-[11px] text-ink-mute md:hidden">
          {progress.done}/{progress.total}
        </span>
        <Button variant="secondary" size="sm" icon={Lightbulb} onClick={onHint} sound="open">
          <span className="hidden sm:inline">Hint</span>
          <span className="font-mono text-[10px] text-ink-mute">{hintsLeft}</span>
        </Button>
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onReset} aria-label="Reset mission">
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>
    </header>
  )
}
