import { h, comment } from '../simulation/tree'

/** Mission 04 — Broken Access (element state and interactivity). */
export const brokenAccess = {
  id: 'broken-access',
  code: 'M-04',
  title: 'Broken Access',
  tagline: 'Disabled in the UI does not mean disabled.',
  difficulty: 'intermediate',
  skill: 'Element States',
  estimatedMinutes: 10,
  targetSeconds: 300,
  tags: ['html', 'css'],
  implemented: true,
  unlock: { requires: ['password-mystery'] },

  briefing: [
    'Lumen Records, a fictional archive, greys out its download button for visitors with the Viewer role.',
    'Work out what is stopping the button from responding, restore it with the tools you have, and start the simulated download.',
  ],

  objectives: [
    { id: 'inspect-button', label: 'Inspect the disabled download button' },
    { id: 'restore-access', label: 'Remove everything that blocks the button' },
    { id: 'download', label: 'Click the download button' },
  ],

  hints: [
    'Something is stopping the button from responding. Inspect it and look at both its attributes and the styles that apply to it.',
    'There are two blockers: a disabled attribute, and the .is-locked class, which sets pointer-events: none.',
    'Remove the disabled attribute in the HTML panel, then remove is-locked from the class attribute (or set pointer-events: auto). Turn off the picker and click Download.',
  ],

  completion: {
    title: 'Access restored',
    message: 'The download was only blocked in your browser. Nothing on the (simulated) server checked your role.',
    learned: [
      'The disabled attribute stops form controls from receiving clicks.',
      'pointer-events: none makes an element ignore the mouse entirely.',
      'Client-side restrictions are not security; servers must enforce permissions.',
    ],
  },

  page: {
    url: 'https://archive.lumen.sim/reports/q3',
    title: 'Lumen Records · Q3 report',
    tree: h(
      'div',
      { class: 'archive' },
      h('header', { class: 'a-head' }, h('span', { class: 'a-brand' }, 'Lumen Records'), h('span', { class: 'a-role' }, 'Signed in as: Viewer')),
      h(
        'main',
        { class: 'a-body' },
        h('h1', { class: 'a-title' }, 'Quarterly report · Q3'),
        h('p', { class: 'a-text' }, 'Summary of fictional archive activity for the third quarter.'),
        h(
          'div',
          { class: 'a-box' },
          h('button', { class: 'download is-locked', id: 'download', type: 'button', disabled: true, 'data-required-role': 'editor', $key: 'download' }, 'Download report'),
          h('p', { class: 'a-note', $hideWhen: 'downloaded' }, 'Downloads are disabled for your role.'),
          comment(' UI-only restriction. Server-side role check still TODO (ticket SEC-404) '),
          h('p', { class: 'a-done', $showWhen: 'downloaded', $lock: true }, 'Download started: q3-report.pdf (simulated, no file was transferred).'),
        ),
      ),
    ),
    stylesheet: [
      { selector: '.archive', declarations: { 'font-family': 'system-ui, sans-serif', 'min-height': '100vh', background: '#f7f5f0', color: '#2a2620' } },
      { selector: '.a-head', declarations: { display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', padding: '14px 24px', background: '#2a2620', color: '#f7f5f0' } },
      { selector: '.a-brand', declarations: { 'font-weight': '700', 'letter-spacing': '0.04em' } },
      { selector: '.a-role', declarations: { 'font-size': '12px', opacity: '0.75' } },
      { selector: '.a-body', declarations: { padding: '32px 24px', 'max-width': '560px' } },
      { selector: '.a-title', declarations: { margin: '0 0 6px', 'font-size': '22px' } },
      { selector: '.a-text', declarations: { margin: '0 0 20px', color: '#6b6457', 'font-size': '14px' } },
      { selector: '.a-box', declarations: { background: '#ffffff', border: '1px solid #e4dfd3', 'border-radius': '12px', padding: '20px' } },
      { selector: '.download', declarations: { background: '#9a3412', color: '#ffffff', border: 'none', padding: '10px 18px', 'border-radius': '8px', 'font-size': '14px', 'font-weight': '600', cursor: 'pointer' } },
      { selector: '.is-locked', comment: 'viewer role lock', declarations: { opacity: '0.45', 'pointer-events': 'none', filter: 'grayscale(1)' } },
      { selector: '.a-note', declarations: { margin: '10px 0 0', 'font-size': '12px', color: '#6b6457' } },
      { selector: '.a-done', declarations: { margin: '12px 0 0', 'font-size': '13px', color: '#166534', 'font-weight': '600' } },
    ],
  },
}
