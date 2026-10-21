import { normalize } from '../../engine/context'

/** Validator: Password Mystery. The passphrase lives here, never in page content. */
const PASSPHRASE = 'fern-1987'
const isCorrect = (event) => normalize(event.values?.password) === PASSPHRASE

export const passwordMysteryValidator = {
  flags: (ctx) => {
    const attempts = ctx.forms('signin')
    const ok = attempts.some(isCorrect)
    return { loginOk: ok, loginError: !ok && attempts.length > 0 }
  },

  objectives: {
    'find-plant': (ctx) => ctx.selected('plant-name'),
    'find-year': (ctx) => ctx.selected('year-note'),
    'sign-in': (ctx) => ctx.forms('signin').some(isCorrect),
  },

  /** Judge a simulated form submission (counts as an attempt; wrong = failure). */
  judgeForm: (event) => isCorrect(event),
}
