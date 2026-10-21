/**
 * Validator: The Millionaire.
 * Reads page state through the validator context only.
 */

const TARGETS = new Set(['$1,000,000', '$1,000,000.00', '$1000000', '$1000000.00'])
const showsMillion = (ctx) => TARGETS.has(ctx.text('balance').replace(/\s+/g, ''))

export const millionaireValidator = {
  /** Trusted, derived page flags. The VIP panel only exists once earned. */
  flags: (ctx) => ({ vip: showsMillion(ctx) }),

  objectives: {
    'inspect-balance': (ctx) => ctx.selected('balance'),
    'set-balance': (ctx) => showsMillion(ctx) && ctx.visible('balance'),
  },
}
