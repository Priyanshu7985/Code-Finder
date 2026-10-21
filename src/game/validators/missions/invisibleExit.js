/** Validator: Invisible Exit. */
export const invisibleExitValidator = {
  flags: (ctx) => ({ exited: ctx.clicked('exit') }),

  objectives: {
    'find-exit': (ctx) => ctx.selected('exit'),
    'reveal-exit': (ctx) => ctx.visible('exit'),
    'click-exit': (ctx) => ctx.clicked('exit'),
  },
}
