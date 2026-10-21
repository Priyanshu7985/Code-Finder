import { isPlainObject, pickBool, pickEnum } from './storage'

export const MOTION_OPTIONS = ['system', 'reduce', 'full']
export const AMBIENCE_OPTIONS = ['full', 'subtle', 'off']

export const DEFAULT_SETTINGS = Object.freeze({
  sound: true,
  /** Reduced-motion preference: follow the OS, always reduce, or always animate. */
  motion: 'system',
  /** Interface ambience: animated backgrounds, scanlines and boot typing. */
  ambience: 'full',
  skipBoot: false,
})

export function sanitizeSettings(raw) {
  if (!isPlainObject(raw)) return { ...DEFAULT_SETTINGS }
  return {
    sound: pickBool(raw.sound, DEFAULT_SETTINGS.sound),
    motion: pickEnum(raw.motion, MOTION_OPTIONS, DEFAULT_SETTINGS.motion),
    ambience: pickEnum(raw.ambience, AMBIENCE_OPTIONS, DEFAULT_SETTINGS.ambience),
    skipBoot: pickBool(raw.skipBoot, DEFAULT_SETTINGS.skipBoot),
  }
}
