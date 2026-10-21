import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../lib/storage'
import { DEFAULT_SETTINGS, sanitizeSettings } from '../lib/settings'
import { setSoundEnabled, playSound } from '../lib/sound'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() =>
    readJSON(STORAGE_KEYS.settings, sanitizeSettings, { ...DEFAULT_SETTINGS }),
  )
  const osReduced = usePrefersReducedMotion()

  const reducedMotion = settings.motion === 'reduce' || (settings.motion === 'system' && osReduced)
  const ambience = reducedMotion && settings.ambience === 'full' ? 'subtle' : settings.ambience

  useEffect(() => {
    writeJSON(STORAGE_KEYS.settings, settings)
    setSoundEnabled(settings.sound)
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.motion = reducedMotion ? 'reduced' : 'full'
    root.dataset.ambient = ambience === 'off' ? 'off' : 'on'
  }, [reducedMotion, ambience])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => sanitizeSettings({ ...prev, [key]: value }))
  }, [])

  const resetSettings = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), [])

  const value = useMemo(
    () => ({ settings, updateSetting, resetSettings, reducedMotion, ambience, osReduced }),
    [settings, updateSetting, resetSettings, reducedMotion, ambience, osReduced],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}

/** Convenience hook: returns a stable sound player (muting handled globally). */
export function useSound() {
  return playSound
}
