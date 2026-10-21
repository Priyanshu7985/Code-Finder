import { exactAnswer } from './exactAnswer'
import { millionaireValidator } from './missions/millionaire'
import { invisibleExitValidator } from './missions/invisibleExit'
import { passwordMysteryValidator } from './missions/passwordMystery'
import { brokenAccessValidator } from './missions/brokenAccess'
import { hiddenMessageValidator } from './missions/hiddenMessage'

/**
 * Mission validators, keyed by mission id. Each validator exposes:
 *   flags(ctx)            -> derived page flags (optional)
 *   objectives[id](ctx)   -> boolean, one per mission objective
 *   answer                -> answer-terminal config (optional)
 *
 * Validators live apart from mission content and read the simulation only
 * through the context from engine/context.js.
 */
const VALIDATORS = {
  millionaire: millionaireValidator,
  'invisible-exit': invisibleExitValidator,
  'password-mystery': passwordMysteryValidator,
  'broken-access': brokenAccessValidator,
  'hidden-message': hiddenMessageValidator,
}

export const getValidator = (missionId) => VALIDATORS[missionId] ?? null

/** Check a typed answer. Returns { ok, message }. */
export function validateAnswer(missionId, input, ctx, completed) {
  const config = getValidator(missionId)?.answer
  if (!config) return { ok: false, message: 'This mission does not use the answer terminal.' }
  if (config.requires && !config.requires(ctx, completed)) return { ok: false, message: config.lockedMessage, locked: true }
  return exactAnswer(input, config)
}
