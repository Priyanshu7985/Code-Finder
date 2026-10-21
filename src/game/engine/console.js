/**
 * Simulated developer console.
 *
 * Player input is parsed as a fixed command language and is NEVER
 * evaluated as JavaScript. Commands talk to the workspace only through
 * the `api` object, which keeps this module free of React and UI code.
 *
 * A command returns an array of output lines: { tone, text }.
 * tone: 'out' | 'info' | 'ok' | 'warn' | 'err' | 'muted'
 */

const line = (text, tone = 'out') => ({ text, tone })

export const COMMANDS = {
  help: {
    usage: 'help',
    summary: 'List available commands',
    run: () => [
      line('Available commands:', 'info'),
      ...Object.entries(COMMANDS).map(([, c]) => line(`  ${c.usage.padEnd(20)} ${c.summary}`, 'muted')),
    ],
  },
  inspect: {
    usage: 'inspect <selector>',
    summary: 'Select an element, e.g. inspect #balance',
    run: (args, api) => {
      const selector = args.join(' ').trim()
      if (!selector) return [line('Usage: inspect <selector>   (tag, .class or #id)', 'warn')]
      const result = api.selectBySelector(selector)
      if (result === 'invalid') return [line(`Unsupported selector "${selector}". Use tag, .class or #id.`, 'err')]
      if (!result) return [line(`No element matches ${selector}`, 'warn')]
      return [line(`Selected ${result}`, 'ok'), line('Its attributes are shown in the HTML panel. Try: attrs', 'muted')]
    },
  },
  attrs: {
    usage: 'attrs',
    summary: 'Print attributes of the selected element',
    run: (_, api) => {
      const node = api.getSelected()
      if (!node) return [line('No element selected. Click one in the browser or use inspect.', 'warn')]
      const entries = Object.entries(node.attrs ?? {})
      if (!entries.length) return [line(`${api.label(node)} has no attributes`, 'muted')]
      return [line(api.label(node), 'info'), ...entries.map(([k, v]) => line(`  ${k} = "${v}"`))]
    },
  },
  objectives: {
    usage: 'objectives',
    summary: 'Show mission objectives',
    run: (_, api) =>
      api.objectives().map((o) => line(`${o.done ? '[x]' : '[ ]'} ${o.label}`, o.done ? 'ok' : 'out')),
  },
  submit: {
    usage: 'submit <answer>',
    summary: 'Submit an answer for validation',
    run: (args, api) => {
      const answer = args.join(' ').trim()
      if (!answer) return [line('Usage: submit <answer>', 'warn')]
      const result = api.submit(answer)
      return [line(result.message, result.ok ? 'ok' : 'err')]
    },
  },
  hint: {
    usage: 'hint',
    summary: 'Open the hint terminal',
    run: (_, api) => {
      api.openHint()
      return [line('Opening hint terminal...', 'muted')]
    },
  },
  whoami: {
    usage: 'whoami',
    summary: 'Identify the current operator',
    run: () => [line('operator@workstation-07 (simulated session, no network access)')],
  },
  clear: {
    usage: 'clear',
    summary: 'Clear the console',
    run: () => 'clear',
  },
}

export function parseCommand(input) {
  const parts = String(input).trim().split(/\s+/).filter(Boolean)
  const [name = '', ...args] = parts
  return { name: name.toLowerCase(), args }
}

/** Execute a console command. Returns output lines or the string 'clear'. */
export function runCommand(input, api) {
  const { name, args } = parseCommand(input)
  if (!name) return []
  const command = COMMANDS[name]
  if (!command) {
    return [
      line(`${name}: command not found`, 'err'),
      line('This console does not run JavaScript. Type "help" to see supported commands.', 'muted'),
    ]
  }
  return command.run(args, api)
}

export const WELCOME_LINES = [
  line('CODE FINDER simulated console · sandboxed', 'info'),
  line('Type "help" for commands. Input is parsed, never executed.', 'muted'),
]
