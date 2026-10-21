/** Validator: Broken Access. */
export const brokenAccessValidator = {
  flags: (ctx) => ({ downloaded: ctx.clicked('download') }),

  objectives: {
    'inspect-button': (ctx) => ctx.selected('download'),
    // Both blockers must be gone: the disabled attribute and pointer-events: none.
    'restore-access': (ctx) => !ctx.hasAttr('download', 'disabled') && ctx.interactive('download'),
    'download': (ctx) => ctx.clicked('download'),
  },
}
