# Code Finder

A browser-based hacking puzzle game set entirely inside fictional, simulated websites.
Players inspect HTML, read CSS and investigate page structure to solve missions.

**Build 0.3.0:** five playable missions on a sandboxed inspect-element engine, plus a local progression system (XP, levels, achievements, personal bests, versioned saves).

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:5173)
npm run build     # production build -> dist/
npm run preview   # serve the production build
npm test          # run progression unit tests (Vitest)
```

Requires Node.js 20.19+ or 22.12+.

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · Framer Motion · Lucide React · Monaco Editor (bundled locally, lazy-loaded)

## Structure

```
src/
  App.jsx, main.jsx         providers + screen router
  context/                  Settings, Progress, Navigation, Toast providers
  pages/                    Boot, MainMenu, MissionSelect, Workspace, TrainingLab, Achievements, Settings
  components/
    ui/                     Button, Badge, Dialog, Toggle, SegmentedControl, ProgressBar, Kbd
    layout/                 Logo, AmbientBackground, ScreenShell
    game/                   MissionCard, PlayerBadge, SystemStatus
    game/workspace/         TopBar, MissionPanel, BrowserFrame, SimRenderer, DevTools (HTML/CSS/Console), StatusBar, CodeView
    training/               interactive lesson demos
  game/
    missions/               mission definitions (pure data)
    validators/             answer validation (pure functions)
    engine/                 session reducer, progression, XP, console commands, progress model
    simulation/             virtual DOM tree, safe CSS engine, render whitelist
  data/                     lessons, achievements
  lib/                      storage, settings, sound, cn
  hooks/                    usePrefersReducedMotion
```

## Progression

All rules live in `src/game/progression/` as pure, tested functions; React only stores and displays the results.

- **config.js**: XP per difficulty (100 / 200 / 350), bonuses (+25 first attempt, +25 no hints, +0–25 speed), level curve, score rules.
- **scoring.js**: deterministic XP breakdown and 0–1000 performance score.
- **profile.js**: runs, completion, unlocking. Each run has an id; `applyCompletion` ignores a run id it has already seen, and XP is only granted on a mission's first clear. Replays update personal bests only.
- **achievements.js** + `src/data/achievements.js`: achievement engine; unlocks are permanent and timestamped.
- **save.js**: versioned save (`inspecthack.save`, v2) with field-level validation, a backup slot, and migration from the v1 format. Settings are stored separately and survive Reset Progress.

Completion is only reported to the progression layer after the mission validator confirms every objective.

## Adding a mission

1. Create `src/game/missions/<id>.js` with `difficulty`, `targetSeconds`, `tags` (`html`/`css`, used by achievements), the page (`h()` tree + stylesheet), objectives, hints, completion text and optional `answerPrompt`.
   - Mark nodes the validator needs with `$key`. Keys are engine metadata, never DOM attributes, so players cannot fake them.
   - `$lock` blocks edits, `$showWhen`/`$hideWhen` tie a node to a validator flag, `$action` makes a button submit form fields.
2. Create `src/game/validators/missions/<id>.js` exporting `objectives` (one check per objective id), optional `flags` and optional `answer`.
3. Register both in `src/game/missions/index.js` and `src/game/validators/index.js`.

Validators receive a read-only context (`engine/context.js`): model text/attributes by key, the rendered-visibility probe, and the action log (selections, clicks with visibility at click time, form submissions, answers).

## Safety model

- **Sandbox:** pages render in an `<iframe sandbox="allow-same-origin">` with no `allow-scripts`, so nothing executes inside it (scripts, inline handlers, `javascript:` URLs). Forms, popups and navigation are blocked. A CSP of `default-src 'none'` blocks all network access. The parent renders into the frame via a React portal and reads it for inspection; the frame has no code that could reach back.
- **Model, not markup:** pages are JSON trees. Player edits are typed operations (`game/simulation/pageState.js`), never HTML strings or innerHTML.
- **Edit policy** (`game/simulation/policy.js`): attribute allowlist (no `on*`, `style`, `href`, `src` or reserved `data-ih-*`); CSS property allowlist; values checked with `CSS.supports`; `url()`, `@`-rules, `var()`, `attr()`, comments and braces rejected. Declarations are re-validated when serialized.
- **Validation:** completion is decided by trusted validator code from model state, measured render state and recorded actions, never by searching editable page text.
- **Console:** fixed command language; input is never evaluated.
