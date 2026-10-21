/** Validator: The Hidden Message. */
const FRAGMENTS = ['frag-look', 'frag-beneath', 'frag-the', 'frag-surface']

export const hiddenMessageValidator = {
  objectives: {
    'locate-message': (ctx) => ctx.selected('message') || ctx.selected('capsule'),
    'reveal-message': (ctx) => ctx.visible('capsule') && ctx.visible('message') && FRAGMENTS.every((k) => ctx.visible(k)),
    'transmit': (ctx) => ctx.answered(),
  },

  answer: {
    answer: 'LOOK BENEATH THE SURFACE',
    caseSensitive: false,
    requires: (ctx, completed) => completed.includes('reveal-message'),
    lockedMessage: 'Reveal the full message on the page before transmitting it.',
    nearMisses: [
      { value: 'SURFACE LOOK THE BENEATH', message: 'That is the order in the HTML. Read the words in the order the page displays them.' },
      { value: 'LOOK THE BENEATH SURFACE', message: 'Close. One fragment is displayed in a different position.' },
    ],
  },
}
