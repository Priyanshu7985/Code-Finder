import { useState } from 'react'
import { Volume2, Gauge, Sparkles, Database, RotateCcw, Trash2 } from 'lucide-react'
import { ScreenShell } from '../components/layout/ScreenShell'
import { Toggle } from '../components/ui/Toggle'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { useSettings } from '../context/SettingsContext'
import { useProgress } from '../context/ProgressContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../lib/sound'

function Section({ icon: Icon, title, children }) {
  return (
    <section className="panel overflow-hidden" aria-labelledby={`set-${title}`}>
      <h2 id={`set-${title}`} className="flex items-center gap-2 border-b border-line px-5 py-3 font-mono text-[11px] tracking-[0.16em] text-ink-mute uppercase">
        <Icon className="size-3.5 text-signal" aria-hidden="true" />
        {title}
      </h2>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  )
}

function Row({ label, description, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[13px] leading-snug text-ink-mute">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function Settings() {
  const { settings, updateSetting, resetSettings, reducedMotion, osReduced } = useSettings()
  const { resetProgress, hasProgress, summary } = useProgress()
  const { notify } = useToast()
  const [confirmWipe, setConfirmWipe] = useState(false)

  return (
    <ScreenShell eyebrow="Configuration" title="Settings" description="Preferences are saved on this device and applied immediately.">
      <div className="grid max-w-3xl gap-5">
        <Section icon={Volume2} title="Audio">
          <Toggle
            checked={settings.sound}
            onChange={(v) => {
              updateSetting('sound', v)
              if (v) window.setTimeout(() => playSound('success'), 30)
            }}
            label="Sound effects"
            description="Short synthesized interface cues for clicks, hints and mission events."
          />
        </Section>

        <Section icon={Gauge} title="Motion">
          <Row
            label="Reduced motion"
            description={`Follow your system setting (currently ${osReduced ? 'reduced' : 'full motion'}), or override it. Active now: ${reducedMotion ? 'reduced' : 'full'}.`}
          >
            <SegmentedControl
              label="Reduced motion"
              value={settings.motion}
              onChange={(v) => updateSetting('motion', v)}
              options={[
                { value: 'system', label: 'System' },
                { value: 'reduce', label: 'Reduce' },
                { value: 'full', label: 'Full' },
              ]}
            />
          </Row>
        </Section>

        <Section icon={Sparkles} title="Interface">
          <Row
            label="Interface animation"
            description="Full: animated scan and boot typing. Subtle: static atmosphere, instant boot. Off: no decorative effects."
          >
            <SegmentedControl
              label="Interface animation"
              value={settings.ambience}
              onChange={(v) => updateSetting('ambience', v)}
              options={[
                { value: 'full', label: 'Full' },
                { value: 'subtle', label: 'Subtle' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </Row>
          <Toggle
            checked={settings.skipBoot}
            onChange={(v) => updateSetting('skipBoot', v)}
            label="Skip boot sequence"
            description="Open directly on the main menu next time the game loads."
          />
        </Section>

        <Section icon={Database} title="Data">
          <Row label="Restore default settings" description="Resets audio, motion and interface preferences.">
            <Button
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                resetSettings()
                notify({ tone: 'info', title: 'Settings restored', message: 'Default preferences applied.' })
              }}
            >
              Restore defaults
            </Button>
          </Row>
          <Row label="Reset progress" description="Removes XP, levels, mission history, personal bests, achievements and training records. Settings are kept.">
            <Button size="sm" variant="danger" icon={Trash2} disabled={!hasProgress} onClick={() => setConfirmWipe(true)}>
              Reset progress
            </Button>
          </Row>
        </Section>
      </div>

      <Dialog
        open={confirmWipe}
        onClose={() => setConfirmWipe(false)}
        icon={Trash2}
        tone="danger"
        title="Reset all progress?"
        description={`This permanently removes level ${summary.level.level} (${summary.xp} XP), ${summary.completedMissions} completed mission${summary.completedMissions === 1 ? '' : 's'}, ${summary.achievementCount} achievement${summary.achievementCount === 1 ? '' : 's'}, personal bests and training records from this device. Audio, motion and interface settings are kept. This cannot be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmWipe(false)} sound="back" data-autofocus>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                resetProgress()
                setConfirmWipe(false)
                notify({ tone: 'warning', title: 'Progress reset', message: 'A fresh operator profile was created. Your settings were kept.' })
              }}
            >
              Reset progress
            </Button>
          </>
        }
      />
    </ScreenShell>
  )
}
