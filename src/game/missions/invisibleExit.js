import { h, comment } from '../simulation/tree'

/** Mission 02 — Invisible Exit (CSS visibility). */
export const invisibleExit = {
  id: 'invisible-exit',
  code: 'M-02',
  title: 'Invisible Exit',
  tagline: 'The way out exists. It just is not being shown.',
  difficulty: 'beginner',
  skill: 'CSS Visibility',
  estimatedMinutes: 8,
  targetSeconds: 240,
  tags: ['css'],
  implemented: true,
  unlock: { requires: ['millionaire'] },

  briefing: [
    'A fictional kiosk app, SurveyLoop, traps visitors in a survey with no visible way to leave.',
    'The exit button is in the markup, but the stylesheet keeps it from being painted. Find it, make it visible with CSS, then click it.',
  ],

  objectives: [
    { id: 'find-exit', label: 'Locate the hidden exit element in the DOM' },
    { id: 'reveal-exit', label: 'Make the exit button visible using CSS' },
    { id: 'click-exit', label: 'Click the exit button' },
  ],

  hints: [
    'The exit is still part of the document; it just is not being painted. Scan the HTML tree for anything that looks like a way out.',
    'Select the button with class exit-btn and open the CSS tab. The Computed section explains exactly why it is not visible.',
    'In the .exit-btn rule, change display: none to display: inline-block and visibility: hidden to visible. Then turn off the picker and click the button.',
  ],

  completion: {
    title: 'You found the way out',
    message: 'The exit control was there all along, hidden by two CSS declarations.',
    learned: [
      'display: none removes an element from layout entirely.',
      'visibility: hidden hides an element but keeps its space.',
      'Hidden elements are still in the DOM and can be restored with CSS.',
    ],
  },

  page: {
    url: 'https://surveyloop.sim/kiosk/session',
    title: 'SurveyLoop Kiosk',
    tree: h(
      'div',
      { class: 'kiosk' },
      h('header', { class: 'k-head' }, h('span', { class: 'k-brand' }, 'SurveyLoop'), h('span', { class: 'k-step' }, 'Question 48 of ∞')),
      h(
        'main',
        { class: 'k-body', $hideWhen: 'exited' },
        h('h1', { class: 'k-question' }, 'How satisfied are you with this survey?'),
        h(
          'div',
          { class: 'k-options' },
          h('button', { class: 'opt', type: 'button' }, 'Very satisfied'),
          h('button', { class: 'opt', type: 'button' }, 'Extremely satisfied'),
          h('button', { class: 'opt', type: 'button' }, 'Unimaginably satisfied'),
        ),
        h('p', { class: 'k-note' }, 'There is no way out. Please keep answering.'),
        comment(' accessibility audit: exit control hidden at marketing request '),
        h('div', { class: 'exit-zone' }, h('button', { class: 'exit-btn', id: 'exit', type: 'button', $key: 'exit' }, 'Exit survey')),
      ),
      h(
        'section',
        { class: 'k-done', $showWhen: 'exited', $lock: true },
        h('h1', { class: 'k-question' }, 'Session closed'),
        h('p', { class: 'k-note' }, 'Thank you. You may now leave the kiosk.'),
      ),
    ),
    stylesheet: [
      { selector: '.kiosk', declarations: { 'font-family': 'system-ui, sans-serif', 'min-height': '100vh', background: '#f6f1ff', color: '#2b2140' } },
      { selector: '.k-head', declarations: { display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', padding: '14px 24px', background: '#5b3cc4', color: '#ffffff' } },
      { selector: '.k-brand', declarations: { 'font-weight': '700', 'letter-spacing': '0.02em' } },
      { selector: '.k-step', declarations: { 'font-size': '12px', opacity: '0.8' } },
      { selector: '.k-body', declarations: { padding: '36px 24px', 'max-width': '520px' } },
      { selector: '.k-done', declarations: { padding: '36px 24px' } },
      { selector: '.k-question', declarations: { margin: '0 0 18px', 'font-size': '22px' } },
      { selector: '.k-options', declarations: { display: 'flex', 'flex-direction': 'column', gap: '10px' } },
      { selector: '.opt', declarations: { padding: '12px 16px', 'text-align': 'left', background: '#ffffff', border: '1px solid #d8ccf7', 'border-radius': '10px', 'font-size': '14px', color: '#2b2140' } },
      { selector: '.k-note', declarations: { margin: '18px 0', 'font-size': '13px', color: '#6b5f86' } },
      { selector: '.exit-zone', declarations: { 'margin-top': '8px' } },
      { selector: '.exit-btn', comment: 'hidden per marketing', declarations: { display: 'none', visibility: 'hidden', background: '#b91c1c', color: '#ffffff', border: 'none', 'border-radius': '8px', padding: '10px 18px', 'font-size': '14px', 'font-weight': '600' } },
    ],
  },
}
