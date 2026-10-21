import { ArrowLeft } from 'lucide-react'
import { useNavigation } from '../../context/NavigationContext'
import { Button } from '../ui/Button'
import { Logo } from './Logo'
import { PlayerBadge } from '../game/PlayerBadge'

/**
 * Standard frame for menu-level screens: header with back control,
 * screen title, player badge, and a centered content column.
 */
export function ScreenShell({ title, eyebrow, description, backTo = 'menu', backLabel = 'Main menu', actions, children }) {
  const { navigate } = useNavigation()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Button variant="ghost" size="sm" icon={ArrowLeft} sound="back" onClick={() => navigate(backTo)}>
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <span className="h-5 w-px bg-line" aria-hidden="true" />
          <Logo className="hidden md:inline-flex" />
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <PlayerBadge compact />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
        <div className="mb-8 sm:mb-10">
          {eyebrow && <p className="font-mono text-[11px] tracking-[0.2em] text-signal uppercase">{eyebrow}</p>}
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
