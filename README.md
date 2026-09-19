# OpenShelf

**Відкрита бібліотека React-компонентів** — an open-source-style React
component library where accessibility and testing rigor are the point, not
an afterthought. Five components — **Button**, **Modal/Dialog**, **Tabs**,
**Tooltip**, and **Toast** — each built from its real WAI-ARIA Authoring
Practices pattern, documented in Storybook with the official a11y addon, and
covered by a behavioral + accessibility test suite (not smoke tests).

This is a portfolio demo card. `npm run dev` boots a marketing-style
showcase page (`src/App.tsx`) that renders the real, live components; the
components themselves live in `src/components/*` and are what Storybook and
the test suite exercise directly.

## Stack

| Concern | Choice |
| --- | --- |
| Language / UI | TypeScript, React 19 |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| Component docs | Storybook 10 (`@storybook/react-vite`) + **`@storybook/addon-a11y`** |
| Tests | Vitest 4, `@testing-library/react`, `@testing-library/user-event`, **`jest-axe`** |
| Story-level tests | `@storybook/addon-vitest` running each story's `play` function + the a11y addon in a real headless Chromium (Playwright) |
| Motion | `framer-motion`, respecting `prefers-reduced-motion` everywhere |
| Toast state | a small `zustand` store (`toastStore.ts`) behind an imperative `toast()` API |
| Lint | `oxlint` |

No server, database, or auth is part of this project — it's a client-side
component library, so there was nothing to substitute for a missing local
service. The one thing worth flagging: **Storybook's interaction/a11y test
project (`npm run test:storybook`) needs a real browser**, so `storybook init`
downloaded a headless Chromium build via Playwright to this machine
(`~/AppData/Local/ms-playwright`) the first time it ran. That's a one-time,
machine-local download, not a substitution for anything — it's the same
browser Storybook would need in CI.

## Running it locally

```bash
npm install          # already run once; safe to re-run
npm run dev           # showcase page at the printed localhost URL
npm run storybook      # component docs + a11y panel at :6006
```

(Per this task's instructions, no dev server was left running by the agent
that built this — start one of the two above yourself to view it.)

## Verifying it

```bash
npm run typecheck       # tsc -b — project references, zero errors
npm run build            # tsc -b && vite build — library + showcase build
npm test                  # vitest (unit project): behavior + jest-axe, jsdom
npm run test:storybook     # vitest (storybook project): every story's play()
                            # function + addon-a11y, in real headless Chromium
npm run build-storybook     # static Storybook build (storybook-static/)
npm run lint                # oxlint
```

All of the above were run before finishing this project and are green:
**0 TypeScript errors, a clean production build, 48/48 unit tests, and
29/29 Storybook interaction/a11y tests** (2 pre-existing `oxlint` style
warnings remain — see *Caveats* below — they don't fail the lint script).

## What each component actually does for accessibility

- **Button** — native `<button>` semantics; a `loading` state that stays
  focusable and announces "busy" (`aria-busy` + `aria-disabled`) instead of
  vanishing from the tab order.
- **Modal** — `role="dialog"` + `aria-modal`, named via `aria-labelledby`;
  focus moves in on open, is trapped (Tab/Shift+Tab cycle), and is restored
  to the trigger on close; Escape and backdrop-click are configurable;
  background scroll is locked while open.
- **Tabs** — the WAI-ARIA "Tabs" pattern from scratch: `tablist`/`tab`/
  `tabpanel`, roving `tabindex`, Arrow/Home/End navigation, both automatic
  and manual activation modes.
- **Tooltip** — `role="tooltip"` wired to the trigger via
  `aria-describedby`; shows on hover (after a delay) **and** keyboard focus
  (instantly); dismissible with Escape without moving focus away.
- **Toast** — `role="status"` (polite) for routine toasts and `role="alert"`
  (assertive) for errors; the auto-dismiss timer pauses on hover *and*
  keyboard focus (WCAG 2.2.1, Timing Adjustable).

Every transition above is built with `framer-motion` and collapses to
near-instant when the OS `prefers-reduced-motion` setting is on.

## Caveats / local-environment notes

- **No substitutions were needed.** This is a pure client-side library with
  no server, database, or external API, so there was nothing on this
  machine to stand in for.
- **Playwright's headless Chromium** was downloaded locally by
  `storybook init`/`@vitest/browser-playwright` the first time the
  Storybook test project ran, so `npm run test:storybook` works offline
  afterward. If you clone this repo on a fresh machine, the first
  `npm run test:storybook` run will (re-)download it.
- **Two non-blocking `oxlint` warnings remain** (`react/refs` in
  `Tooltip.tsx`, `react/set-state-in-effect` in `App.tsx`, the showcase
  page). Both were reviewed: the "refs" one is a false positive (the code
  reads `children.props`, not a ref, inside a `cloneElement` call the rule's
  heuristic misreads); the `setState`-in-effect one intentionally
  synchronizes a counter's display value with an `IntersectionObserver`-driven
  "is this in view yet" signal, which can't be derived during render. Neither
  affects `npm run lint`'s exit code (warnings, not errors) or any other
  verification command above.
- **`npm run dev` was not started** by the agent that built this project, per
  the task's instructions — a later step verifies it runs.

## Project layout

```
src/
  components/
    Button/   Modal/   Tabs/   Tooltip/   Toast/   # component + .css + .stories.tsx + .test.tsx
  hooks/
    useFocusTrap.ts        # Modal's Tab-trap + focus restore
    useReducedMotion.ts     # live prefers-reduced-motion
  styles/
    tokens.css               # design tokens (dark, brass/verdigris — not default AI purple)
    global.css
  App.tsx                     # the portfolio showcase page (not part of the library's public API)
  index.ts                     # the library's public exports
.storybook/                     # Storybook config, incl. addon-a11y + a custom dark theme
```
