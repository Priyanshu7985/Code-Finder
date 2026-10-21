import { h, comment } from '../simulation/tree'

/** Mission 03 — Password Mystery (finding clues in page content). */
export const passwordMystery = {
  id: 'password-mystery',
  code: 'M-03',
  title: 'Password Mystery',
  tagline: 'Never put the answer next to the question.',
  difficulty: 'intermediate',
  skill: 'DOM Clues',
  estimatedMinutes: 10,
  targetSeconds: 360,
  tags: ['html'],
  implemented: true,
  unlock: { requires: ['invisible-exit'] },

  briefing: [
    'Northwind Facilities, a fictional company, runs a staff portal for its front desk. The receptionist forgot the password, but the hint is on the sign-in card.',
    'Everything the hint refers to is somewhere on this page, even if it is not readable on screen. Recover the passphrase and sign in to the simulated portal.',
    'This is a puzzle passphrase for a fictional page. No real accounts or credentials are involved.',
  ],

  objectives: [
    { id: 'find-plant', label: 'Find the office plant name hidden in the news card' },
    { id: 'find-year', label: 'Find the year the office opened' },
    { id: 'sign-in', label: 'Sign in with the recovered passphrase' },
  ],

  hints: [
    'The hint mentions two facts about the office. Both are on this page, but you may not be able to read them on screen.',
    'The plant name is in the news card, styled to blend into the background; select it in the tree. The year is in an HTML comment, which you can select too.',
    'Combine them as name-year in lowercase, type that into the password field, turn off the picker, and click Sign in.',
  ],

  completion: {
    title: 'Signed in',
    message: 'The password was assembled from clues the page itself gave away.',
    learned: [
      'Text styled to match its background is still readable in the DOM.',
      'HTML comments ship to every visitor and are not private.',
      'Password hints built from public information are easy to solve.',
    ],
  },

  page: {
    url: 'https://portal.northwind.sim/staff/login',
    title: 'Northwind Facilities · Staff portal',
    tree: h(
      'div',
      { class: 'portal' },
      h('header', { class: 'p-head' }, h('span', { class: 'p-brand' }, 'Northwind Facilities'), h('span', { class: 'p-tag' }, 'Staff portal')),
      h(
        'main',
        { class: 'p-grid' },
        h(
          'section',
          { class: 'login', $hideWhen: 'loginOk' },
          h('h2', { class: 'p-title' }, 'Staff sign-in'),
          h('label', { class: 'p-label', for: 'user' }, 'Username'),
          h('input', { class: 'p-input', id: 'user', type: 'text', value: 'reception', readonly: true, $lock: true }),
          h('label', { class: 'p-label', for: 'pw' }, 'Password'),
          h('input', { class: 'p-input', id: 'pw', type: 'password', placeholder: '••••••••', $key: 'password' }),
          h('p', { class: 'p-hint', $key: 'pw-hint', $lock: true }, 'Hint: our office plant’s name, a dash, then the year we opened.'),
          h('p', { class: 'p-error', $showWhen: 'loginError', $lock: true }, 'Incorrect password. Check the hint.'),
          h('button', { class: 'p-btn', type: 'button', $key: 'signin', $action: { type: 'form', fields: { password: 'password' } } }, 'Sign in'),
        ),
        h(
          'section',
          { class: 'welcome', $showWhen: 'loginOk', $lock: true },
          h('h2', { class: 'p-title' }, 'Welcome, reception'),
          h('p', { class: 'p-text' }, 'You are signed in to a simulated account. Nothing here is real.'),
        ),
        h(
          'aside',
          { class: 'news' },
          h('h3', { class: 'n-title' }, 'Office news'),
          h(
            'article',
            { class: 'n-card' },
            h('p', { class: 'n-text' }, 'Say hello to our office plant! Water it on Mondays.'),
            h('p', { class: 'n-text' }, h('span', {}, 'Name: '), h('span', { class: 'plant-name', $key: 'plant-name' }, 'Fern')),
          ),
          comment(' history: Northwind opened its first office in 1987 ', 'year-note'),
          h('p', { class: 'n-foot' }, 'Northwind Facilities · Front desk'),
        ),
      ),
    ),
    stylesheet: [
      { selector: '.portal', declarations: { 'font-family': 'system-ui, sans-serif', 'min-height': '100vh', background: '#eef3f1', color: '#1f2d29' } },
      { selector: '.p-head', declarations: { display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', padding: '14px 24px', background: '#14532d', color: '#ecfdf5' } },
      { selector: '.p-brand', declarations: { 'font-weight': '700' } },
      { selector: '.p-tag', declarations: { 'font-size': '12px', opacity: '0.8' } },
      { selector: '.p-grid', declarations: { display: 'flex', 'flex-wrap': 'wrap', gap: '20px', padding: '28px 24px' } },
      { selector: '.login', declarations: { display: 'flex', 'flex-direction': 'column', gap: '6px', background: '#ffffff', padding: '20px', 'border-radius': '12px', border: '1px solid #d5e2dd', width: '280px' } },
      { selector: '.welcome', declarations: { background: '#ffffff', padding: '20px', 'border-radius': '12px', border: '1px solid #86efac', width: '280px' } },
      { selector: '.p-title', declarations: { margin: '0 0 8px', 'font-size': '18px' } },
      { selector: '.p-label', declarations: { 'font-size': '12px', color: '#4b5e57', 'margin-top': '4px' } },
      { selector: '.p-input', declarations: { padding: '8px 10px', border: '1px solid #c3d4cd', 'border-radius': '6px', 'font-size': '14px' } },
      { selector: '.p-hint', declarations: { 'font-size': '12px', color: '#4b5e57', margin: '6px 0' } },
      { selector: '.p-error', declarations: { 'font-size': '12px', color: '#b91c1c', margin: '0' } },
      { selector: '.p-btn', declarations: { 'margin-top': '6px', background: '#15803d', color: '#ffffff', border: 'none', padding: '10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '14px' } },
      { selector: '.p-text', declarations: { 'font-size': '13px', color: '#4b5e57' } },
      { selector: '.news', declarations: { width: '260px' } },
      { selector: '.n-title', declarations: { margin: '0 0 10px', 'font-size': '15px' } },
      { selector: '.n-card', declarations: { background: '#ffffff', padding: '14px', 'border-radius': '10px', border: '1px solid #d5e2dd' } },
      { selector: '.n-text', declarations: { margin: '0 0 6px', 'font-size': '13px' } },
      { selector: '.plant-name', comment: 'blend into the card', declarations: { color: '#ffffff' } },
      { selector: '.n-foot', declarations: { 'font-size': '11px', color: '#7b8c86', 'margin-top': '12px' } },
    ],
  },
}
