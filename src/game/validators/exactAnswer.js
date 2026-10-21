/**
 * Validate a typed answer against an expected value.
 * Pure function: no side effects, no UI.
 *
 * @returns {{ ok: boolean, message: string }}
 */
export function exactAnswer(input, { answer, caseSensitive = false, nearMisses = [] }) {
  const normalize = (s) => {
    const trimmed = String(s ?? '')
      .trim()
      .replace(/[‐-―−]/g, '-') // typographic dashes from copy-paste
      .replace(/^["'`“”‘’]+|["'`“”‘’.]+$/g, '') // surrounding quotes, trailing period
      .replace(/\s+/g, ' ')
    return caseSensitive ? trimmed : trimmed.toUpperCase()
  }
  const value = normalize(input)

  if (!value) return { ok: false, message: 'Enter a value before submitting.' }
  if (value === normalize(answer)) return { ok: true, message: 'Answer accepted. Verified by the mission validator.' }

  const near = nearMisses.find((n) => normalize(n.value) === value)
  if (near) return { ok: false, message: near.message }

  return { ok: false, message: 'Rejected. That answer does not match.' }
}
