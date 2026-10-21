import { h, comment } from '../simulation/tree'

/** Mission 01 — The Millionaire (editing text content). */
export const millionaire = {
  id: 'millionaire',
  code: 'M-01',
  title: 'The Millionaire',
  tagline: 'The balance says zero. The browser will say whatever you tell it.',
  difficulty: 'beginner',
  skill: 'HTML Editing',
  estimatedMinutes: 5,
  targetSeconds: 180,
  tags: ['html'],
  implemented: true,
  unlock: { requires: [] },

  briefing: [
    'Mirrorline Savings is a fictional training bank. Its overview page renders a balance of $0.00, and a VIP lounge widget appears only for balances of one million.',
    'The balance is just text in the page. Edit what your browser displays and make the page show $1,000,000 to unlock the VIP widget.',
    'Nothing here is real money: you are changing your local copy of a simulated page.',
  ],

  objectives: [
    { id: 'inspect-balance', label: 'Select the account balance element' },
    { id: 'set-balance', label: 'Make the page display a balance of $1,000,000' },
  ],

  hints: [
    'The balance is ordinary text inside an element. Developer tools let you change what your copy of the page displays.',
    'Select the "$0.00" element (span#balance). Its Text content field is in the properties pane under the HTML tree.',
    'Set the text to $1,000,000 (or $1000000) and press Enter. The mission completes as soon as the page shows it.',
  ],

  completion: {
    title: 'Balance rewritten',
    message: 'The page believed your $1,000,000 and unlocked its VIP widget. The real account never changed.',
    learned: [
      'Text content can be edited locally with developer tools.',
      'Client-side displays are not a source of truth; servers must hold the real values.',
      'Pages that trust what the browser displays can be fooled into unlocking features.',
    ],
  },

  page: {
    url: 'https://mirrorline.sim/accounts/overview',
    title: 'Mirrorline Savings · Overview',
    tree: h(
      'div',
      { class: 'page' },
      h(
        'header',
        { class: 'topbar' },
        h('span', { class: 'brand' }, 'Mirrorline'),
        h('nav', { class: 'nav' }, h('a', { class: 'nav-link active' }, 'Accounts'), h('a', { class: 'nav-link' }, 'Transfers'), h('a', { class: 'nav-link' }, 'Support')),
      ),
      h(
        'main',
        { class: 'content' },
        h('h1', { class: 'greeting', $lock: true }, 'Welcome back, J. Doe'),
        h('p', { class: 'muted' }, 'Everyday Savings · •••• 4417'),
        h(
          'section',
          { class: 'card', id: 'account-card' },
          h('small', { class: 'label' }, 'Available balance'),
          comment(' display only: VIP lounge widget renders when the shown balance is $1,000,000 '),
          h('span', { class: 'amount', id: 'balance', $key: 'balance' }, '$0.00'),
          h('p', { class: 'status' }, 'Balance under review after system migration.'),
        ),
        h(
          'section',
          { class: 'vip', id: 'vip-lounge', 'data-tier': 'aurum', $key: 'vip', $showWhen: 'vip', $lock: true },
          h('strong', { class: 'vip-title' }, 'VIP lounge unlocked'),
          h('p', { class: 'vip-text' }, 'Welcome to the lounge. (Simulated: the real account was never changed.)'),
        ),
      ),
      h('footer', { class: 'foot' }, 'Simulation environment · No real accounts or institutions.'),
    ),
    stylesheet: [
      { selector: '.page', declarations: { 'font-family': 'system-ui, sans-serif', color: '#1d2433', background: '#f3f5f8', 'min-height': '100vh', display: 'flex', 'flex-direction': 'column' } },
      { selector: '.topbar', declarations: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '14px 24px', background: '#ffffff', 'border-bottom': '1px solid #e2e6ee' } },
      { selector: '.brand', declarations: { 'font-weight': '700', 'letter-spacing': '-0.02em', color: '#23408e', 'font-size': '17px' } },
      { selector: '.nav', declarations: { display: 'flex', gap: '18px' } },
      { selector: '.nav-link', declarations: { 'font-size': '13px', color: '#5b6577' } },
      { selector: '.active', declarations: { color: '#23408e', 'font-weight': '600' } },
      { selector: '.content', declarations: { padding: '28px 24px', flex: '1', display: 'flex', 'flex-direction': 'column', gap: '16px' } },
      { selector: '.greeting', declarations: { 'font-size': '22px', margin: '0', 'font-weight': '650' } },
      { selector: '.muted', declarations: { color: '#6b7486', 'font-size': '13px', margin: '-12px 0 4px' } },
      { selector: '.card', declarations: { background: '#ffffff', border: '1px solid #e2e6ee', 'border-radius': '12px', padding: '20px', 'max-width': '360px', display: 'flex', 'flex-direction': 'column', gap: '6px', 'box-shadow': '0 1px 2px rgba(20,30,60,0.06)' } },
      { selector: '.label', declarations: { 'text-transform': 'uppercase', 'letter-spacing': '0.08em', 'font-size': '11px', color: '#6b7486' } },
      { selector: '.amount', comment: 'balance display', declarations: { 'font-size': '34px', 'font-weight': '700', 'letter-spacing': '-0.02em', color: '#111827' } },
      { selector: '.status', declarations: { 'font-size': '12px', color: '#b45309', margin: '0' } },
      { selector: '.vip', declarations: { 'max-width': '360px', padding: '16px 20px', 'border-radius': '12px', background: '#1c1708', color: '#f6e7b4', border: '1px solid #8a6d1d' } },
      { selector: '.vip-title', declarations: { display: 'block', 'font-size': '14px', 'letter-spacing': '0.06em', 'text-transform': 'uppercase', color: '#f2c45c' } },
      { selector: '.vip-text', declarations: { margin: '6px 0 0', 'font-size': '12px', color: '#d9c992' } },
      { selector: '.foot', declarations: { padding: '14px 24px', 'font-size': '11px', color: '#8a93a3', 'border-top': '1px solid #e2e6ee' } },
    ],
  },
}
