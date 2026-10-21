import { walk, textOf, isElement } from '../simulation/tree'

/**
 * Builds the read-only context handed to mission validators.
 *
 * Everything is addressed by engine `key`s, which are metadata the player
 * cannot edit, so renaming ids/classes or rewriting text elsewhere on the
 * page can never satisfy an objective by accident.
 *
 * @param {object} args
 * @param {object} args.tree    full page model (unfiltered)
 * @param {object} args.view    rendered page model (flags applied)
 * @param {object} args.probe   probe snapshot { nodes: { uid: verdict } }
 * @param {Array}  args.events  session action log
 * @param {object} args.flags   derived mission flags
 */
export function createContext({ tree, view, probe, events = [], flags = {} }) {
  const modelKeys = indexKeys(tree)
  const viewKeys = indexKeys(view ?? tree)
  const verdict = (key) => {
    const node = viewKeys[key]
    return node ? probe?.nodes?.[node.uid] : undefined
  }

  return {
    flags,
    events,
    /** Node in the page model (exists even if not currently rendered). */
    node: (key) => modelKeys[key] ?? null,
    text: (key) => textOf(modelKeys[key]).trim(),
    attr: (key, name) => modelKeys[key]?.attrs?.[name],
    hasAttr: (key, name) => Boolean(modelKeys[key]?.attrs && name in modelKeys[key].attrs),
    hasClass: (key, cls) => String(modelKeys[key]?.attrs?.class ?? '').split(/\s+/).includes(cls),
    rendered: (key) => Boolean(viewKeys[key]),
    visible: (key) => verdict(key)?.visible === true,
    interactive: (key) => verdict(key)?.interactive === true,
    selected: (key) => events.some((e) => e.type === 'select' && e.key === key),
    /** Clicked while visible (and, by default, interactive) at the moment of the click. */
    clicked: (key, { requireInteractive = true } = {}) =>
      events.some(
        (e) =>
          e.type === 'click' &&
          e.keys.includes(key) &&
          e.state?.[key]?.visible &&
          (!requireInteractive || e.state?.[key]?.interactive),
      ),
    forms: (key) => events.filter((e) => e.type === 'form' && e.key === key),
    answered: () => events.some((e) => e.type === 'answer' && e.ok),
  }
}

function indexKeys(root) {
  const out = {}
  walk(root, (n) => {
    if (n.key && (isElement(n) || n.comment !== undefined)) out[n.key] = n
  })
  return out
}

export const normalize = (s) => String(s ?? '').trim().toLowerCase()
