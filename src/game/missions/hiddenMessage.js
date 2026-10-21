import { h, comment } from '../simulation/tree'

/** Mission 05 — The Hidden Message (multi-layer DOM + CSS investigation). */
export const hiddenMessage = {
  id: 'hidden-message',
  code: 'M-05',
  title: 'The Hidden Message',
  tagline: 'Read the structure, not the surface.',
  difficulty: 'advanced',
  skill: 'DOM Structure',
  estimatedMinutes: 15,
  targetSeconds: 480,
  tags: ['html', 'css'],
  implemented: true,
  unlock: { requires: ['broken-access'] },

  briefing: [
    'Collective Null, a fictional art group, hid a transmission inside its exhibit page. Visitors see an empty gallery wall.',
    'The message is assembled by the page itself, but several layers keep it hidden. Reveal every fragment, read the message as it is displayed, and transmit it.',
  ],

  objectives: [
    { id: 'locate-message', label: 'Locate the hidden transmission in the DOM' },
    { id: 'reveal-message', label: 'Reveal every fragment of the message on the page' },
    { id: 'transmit', label: 'Transmit the message exactly as displayed' },
  ],

  hints: [
    'Not every element in the tree is rendered. Elements that are not drawn appear dimmed in the inspector. Look for a structure that never appears.',
    'Three layers hide it: .capsule has display: none, .message has visibility: hidden, and one fragment (.faint) has font-size: 0.',
    'Fix all three layers, then read the words in the order the page displays them. The CSS order property rearranges them. Submit that phrase.',
  ],

  answerPrompt: { label: 'Transmission', placeholder: 'FOUR WORDS' },

  completion: {
    title: 'Transmission received',
    message: 'You peeled back three layers of CSS and read the message the way the page assembled it.',
    learned: [
      'Hidden ancestors hide everything inside them.',
      'font-size: 0 and zero-size boxes hide text without display: none.',
      'Visual order (flex order) can differ from the order in the HTML.',
    ],
  },

  page: {
    url: 'https://null.collective.sim/exhibits/05',
    title: 'Collective Null · Exhibit 05',
    tree: h(
      'div',
      { class: 'gallery' },
      h('header', { class: 'g-head' }, h('span', { class: 'g-brand' }, 'COLLECTIVE NULL'), h('span', { class: 'g-sub' }, 'Exhibit 05 · Signal')),
      h(
        'main',
        { class: 'g-body' },
        h('h1', { class: 'g-title' }, 'Signal'),
        h('p', { class: 'g-text' }, 'Some works are only visible to those who look closer.'),
        h('div', { class: 'g-wall' }, h('p', { class: 'g-empty' }, 'This wall is intentionally empty.')),
        comment(' curator: the capsule assembles itself once it is rendered '),
        h(
          'section',
          { class: 'capsule', $key: 'capsule' },
          h('p', { class: 'c-label' }, 'Transmission'),
          h(
            'div',
            { class: 'message', $key: 'message' },
            h('span', { class: 'frag f4', $key: 'frag-surface', $lock: true }, 'SURFACE'),
            h('span', { class: 'frag f1', $key: 'frag-look', $lock: true }, 'LOOK'),
            h('span', { class: 'frag f3', $key: 'frag-the', $lock: true }, 'THE'),
            h('span', { class: 'frag f2 faint', $key: 'frag-beneath', $lock: true }, 'BENEATH'),
          ),
        ),
      ),
    ),
    stylesheet: [
      { selector: '.gallery', declarations: { 'font-family': 'system-ui, sans-serif', 'min-height': '100vh', background: '#0f0f12', color: '#e7e5ee' } },
      { selector: '.g-head', declarations: { display: 'flex', 'justify-content': 'space-between', padding: '14px 24px', 'border-bottom': '1px solid #2a2a33' } },
      { selector: '.g-brand', declarations: { 'letter-spacing': '0.3em', 'font-size': '12px', 'font-weight': '700' } },
      { selector: '.g-sub', declarations: { 'font-size': '12px', color: '#8b8a99' } },
      { selector: '.g-body', declarations: { padding: '32px 24px' } },
      { selector: '.g-title', declarations: { margin: '0', 'font-size': '30px', 'font-weight': '300', 'letter-spacing': '0.1em' } },
      { selector: '.g-text', declarations: { color: '#8b8a99', 'font-size': '13px' } },
      { selector: '.g-wall', declarations: { height: '90px', border: '1px dashed #33333d', 'border-radius': '10px', display: 'flex', 'align-items': 'center', 'justify-content': 'center' } },
      { selector: '.g-empty', declarations: { color: '#55545f', 'font-size': '12px' } },
      { selector: '.capsule', comment: 'layer 1', declarations: { display: 'none', 'margin-top': '20px', padding: '18px', border: '1px solid #6d28d9', 'border-radius': '10px', background: '#17121f' } },
      { selector: '.c-label', declarations: { margin: '0 0 10px', 'font-size': '11px', 'letter-spacing': '0.2em', color: '#a78bfa', 'text-transform': 'uppercase' } },
      { selector: '.message', comment: 'layer 2', declarations: { display: 'flex', gap: '12px', visibility: 'hidden' } },
      { selector: '.frag', declarations: { 'font-size': '20px', 'font-weight': '700', 'letter-spacing': '0.08em' } },
      { selector: '.f1', declarations: { order: '1' } },
      { selector: '.f2', declarations: { order: '2' } },
      { selector: '.f3', declarations: { order: '3' } },
      { selector: '.f4', declarations: { order: '4' } },
      { selector: '.faint', comment: 'layer 3', declarations: { 'font-size': '0' } },
    ],
  },
}
