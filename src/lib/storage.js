/**
 * Defensive localStorage helpers.
 *
 * Storage can be unavailable (private mode, blocked site data) or contain
 * malformed JSON from older builds. Every read falls back to a provided
 * default and every write fails silently — the game must never crash
 * because of persistence.
 */

export const STORAGE_KEYS = {
  settings: 'inspecthack.settings.v1',
  progress: 'inspecthack.progress.v1',
}

function getStore() {
  try {
    const store = window.localStorage
    const probe = '__inspecthack_probe__'
    store.setItem(probe, probe)
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

/**
 * Read and validate a JSON value.
 * @param {string} key
 * @param {(raw: unknown) => T} sanitize - turns unknown data into a valid T
 * @param {T} fallback
 * @template T
 */
export function readJSON(key, sanitize, fallback) {
  const store = getStore()
  if (!store) return fallback
  try {
    const raw = store.getItem(key)
    if (raw == null) return fallback
    return sanitize(JSON.parse(raw))
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  const store = getStore()
  if (!store) return false
  try {
    store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  const store = getStore()
  if (!store) return
  try {
    store.removeItem(key)
  } catch {
    /* ignore */
  }
}

/* Small validation helpers used by sanitizers. */
export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
export const pickBool = (v, fallback) => (typeof v === 'boolean' ? v : fallback)
export const pickEnum = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback)
export const pickInt = (v, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isInteger(v) && v >= min && v <= max ? v : fallback
export const pickStringArray = (v, allowed) =>
  Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && (!allowed || allowed.includes(x))))] : []
