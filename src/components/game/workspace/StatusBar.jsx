import { Circle, Clock, Crosshair, Lightbulb, PencilLine, ShieldCheck, Target } from 'lucide-react'
import { formatDuration } from '../../../game/progression/scoring'
import { nodeLabel } from '../../../game/simulation/tree'
import { cn } from '../../../lib/cn'

export function StatusBar({ session, selectedNode, picker, mission, edits, seconds }) {
  const complete = session.status === 'complete'
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 overflow-hidden border-t border-line bg-void/90 px-3 font-mono text-[10.5px] text-ink-mute sm:px-4">
      <span className={cn('flex items-center gap-1.5', complete ? 'text-signal' : 'text-cyan')}>
        <Circle className="size-2 fill-current" aria-hidden="true" />
        {complete ? 'MISSION COMPLETE' : 'SESSION ACTIVE'}
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        <Target className="size-3" aria-hidden="true" />
        {selectedNode ? nodeLabel(selectedNode) : 'no selection'}
      </span>
      <span className="hidden items-center gap-1.5 md:flex">
        <Crosshair className="size-3" aria-hidden="true" />
        {picker ? 'picking' : 'interact'}
      </span>
      <span className="hidden items-center gap-1.5 md:flex">
        <PencilLine className="size-3" aria-hidden="true" />
        {edits} edit{edits === 1 ? '' : 's'}
      </span>
      <span className="flex items-center gap-1.5">
        <Lightbulb className="size-3" aria-hidden="true" />
        {session.hintsUsed}/{mission.hints.length} hints
      </span>
      <span className="flex items-center gap-1.5 tabular-nums" aria-label="Active play time">
        <Clock className="size-3" aria-hidden="true" />
        {formatDuration(seconds)}
      </span>
      <span className="hidden sm:inline">wrong {session.failures}</span>
      <span className="ml-auto flex items-center gap-1.5 text-signal-dim">
        <ShieldCheck className="size-3" aria-hidden="true" />
        <span className="hidden sm:inline">SANDBOX: NO SCRIPTS · NO NETWORK ·</span> BUILD 0.3.0
      </span>
    </footer>
  )
}
