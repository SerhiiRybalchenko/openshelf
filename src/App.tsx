import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Tabs } from './components/Tabs';
import type { TabItem } from './components/Tabs';
import { Tooltip } from './components/Tooltip';
import { Toaster, toast } from './components/Toast';
import { BookSpines } from './components/BookSpines';
import { useReducedMotion } from './hooks/useReducedMotion';
import './App.css';

const STACK_BADGES = ['TypeScript', 'Storybook', 'a11y'];

const STATS: Array<{ value: number; suffix: string; label: string }> = [
  { value: 5, suffix: '', label: 'Accessible primitives' },
  { value: 100, suffix: '%', label: 'Operable by keyboard' },
  { value: 0, suffix: '', label: 'Known axe violations' },
  { value: 2.1, suffix: '', label: 'WCAG level AA target' },
];

const A11Y_CHECKLIST = [
  {
    title: 'Real ARIA, not decoration',
    body: 'role="dialog" / "tablist" / "tab" / "tabpanel" / "tooltip" / "status" / "alert" are wired to the actual interaction state, not just present in the markup.',
  },
  {
    title: 'Full keyboard support',
    body: 'Tab/Shift+Tab, Arrow keys, Home/End, Enter/Space, and Escape all do what the WAI-ARIA APG says they should for each pattern.',
  },
  {
    title: 'Managed focus',
    body: 'Modal traps focus while open and restores it to the trigger on close. Nothing ever silently strands keyboard focus off-screen.',
  },
  {
    title: 'Visible focus, everywhere',
    body: 'One consistent :focus-visible ring across every component — never suppressed, never mouse-only.',
  },
  {
    title: 'prefers-reduced-motion respected',
    body: 'Every spring, slide, and fade in this library — including this page — collapses to an instant, non-jarring change when the OS setting is on.',
  },
  {
    title: 'Tested, not assumed',
    body: 'jest-axe runs against every component in every documented state as part of the real test suite, alongside behavioural assertions.',
  },
];

const TAB_ITEMS: TabItem[] = [
  {
    id: 'pattern',
    label: 'ARIA pattern',
    content: (
      <p>
        Built directly from the WAI-ARIA Authoring Practices "Tabs" pattern: a roving
        <code> tabindex</code>, arrow-key navigation, and <code>aria-controls</code> /
        <code> aria-labelledby</code> cross-references between each tab and its panel.
      </p>
    ),
  },
  {
    id: 'modes',
    label: 'Activation modes',
    content: (
      <p>
        Supports both <strong>automatic</strong> activation (arrow keys select immediately) and
        <strong> manual</strong> activation (arrow keys move focus; Enter/Space selects) — useful
        when switching tabs is expensive.
      </p>
    ),
  },
  {
    id: 'code',
    label: 'Usage',
    content: (
      <pre className="app-code">
        <code>{`<Tabs
  label="Component documentation"
  items={items}
  activationMode="manual"
/>`}</code>
      </pre>
    ),
  },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-64px' });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Number.isInteger(value) ? Math.round(v) : Math.round(v * 10) / 10),
    });
    return () => controls.stop();
  }, [inView, value, reducedMotion]);

  return (
    <span ref={ref} className="app-stat__value">
      {display}
      {suffix}
    </span>
  );
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <Reveal className="app-section-heading">
      <p className="app-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {lede && <p className="app-lede">{lede}</p>}
    </Reveal>
  );
}

function ButtonShowcase() {
  const [loading, setLoading] = useState(false);

  function handleDemoClick() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      toast.success('Component added', { description: 'Button v1.4.0 was added to your shelf.' });
    }, 1400);
  }

  return (
    <div className="app-showcase-card">
      <div className="app-showcase-row">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="app-showcase-row">
        <Button size="sm" variant="secondary">
          Small
        </Button>
        <Button size="md" variant="secondary">
          Medium
        </Button>
        <Button size="lg" variant="secondary">
          Large
        </Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </div>
      <div className="app-showcase-row">
        <Button variant="primary" loading={loading} onClick={handleDemoClick}>
          {loading ? 'Adding…' : 'Add to shelf'}
        </Button>
        <p className="app-hint">
          Loading state keeps <code>aria-busy</code> and focus intact — it never disappears from
          the tab order mid-task.
        </p>
      </div>
    </div>
  );
}

function ModalShowcase() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-showcase-card">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open confirmation dialog
      </Button>
      <p className="app-hint">
        Focus moves in, Tab is trapped, Escape and backdrop-click close it, and focus returns to
        this button afterward.
      </p>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Remove Tooltip from shelf?"
        description="This only affects your local collection — nothing is deleted from the published library."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setOpen(false);
                toast.info('Removed', { description: 'Tooltip was removed from your shelf.' });
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p>You can always add it back later from the component catalog.</p>
      </Modal>
    </div>
  );
}

function TooltipShowcase() {
  return (
    <div className="app-showcase-card">
      <div className="app-showcase-row app-showcase-row--tooltips">
        <Tooltip content="Shown after a short hover delay" placement="top">
          <Button variant="secondary">Hover (top)</Button>
        </Tooltip>
        <Tooltip content="Focus shows it instantly, no delay" placement="bottom">
          <Button variant="secondary">Tab to me (bottom)</Button>
        </Tooltip>
        <Tooltip content="Dismisses on Escape, focus stays put" placement="right">
          <Button variant="secondary">Right placement</Button>
        </Tooltip>
      </div>
      <p className="app-hint">
        Keyboard focus shows the tooltip immediately; hover waits briefly so it doesn't flicker as
        the pointer passes through.
      </p>
    </div>
  );
}

function ToastShowcase() {
  return (
    <div className="app-showcase-card">
      <div className="app-showcase-row">
        <Button variant="secondary" onClick={() => toast.info('Sync started', { description: 'Fetching the latest releases.' })}>
          Info
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.success('Published', { description: 'Modal v3.0.0 is live.' })}
        >
          Success
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.warning('Peer dependency drift', { description: 'react-dom is out of range.' })}
        >
          Warning
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            toast.error('Delete failed', {
              duration: 8000,
              action: { label: 'Retry', onClick: () => toast.success('Deleted') },
            })
          }
        >
          Error + action
        </Button>
      </div>
      <p className="app-hint">
        Errors use <code>role="alert"</code> (assertive); everything else uses{' '}
        <code>role="status"</code> (polite). Hover or focus a toast to pause its timer.
      </p>
    </div>
  );
}

export default function App() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <a className="app-skip-link" href="#main-content">
        Skip to content
      </a>
      <Toaster position="bottom-right" />

      <header className="app-header">
        <div className="app-shell app-header__inner">
          <a href="#top" className="app-logo">
            <span className="app-logo__mark" aria-hidden="true">
              ⌸
            </span>
            OpenShelf
          </a>
          <nav className="app-nav" aria-label="Primary">
            <a href="#components">Components</a>
            <a href="#accessibility">Accessibility</a>
            <a href="#install">Install</a>
          </nav>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info('This is a portfolio demo', { description: 'No real repository is linked here.' })}
          >
            View on GitHub
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section id="top" className="app-hero">
          <div className="app-shell app-hero__inner">
            <motion.div
              className="app-hero__copy"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="app-hero__tagline">Відкрита бібліотека React-компонентів</p>
              <h1>
                Component primitives that take <span className="app-highlight">accessibility</span> as
                seriously as pixels.
              </h1>
              <p className="app-hero__lede">
                Five production-shaped React components — Button, Modal, Tabs, Tooltip, and Toast —
                each built on its real WAI-ARIA pattern, documented in Storybook with the official
                a11y addon, and covered by behavioural + <code>jest-axe</code> tests. Not smoke
                tests. Not vibes.
              </p>
              <div className="app-hero__actions">
                <Button variant="primary" size="lg" onClick={() => document.getElementById('components')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })}>
                  Explore components
                </Button>
                <Button variant="ghost" size="lg" onClick={() => document.getElementById('accessibility')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })}>
                  How accessibility works here
                </Button>
              </div>
              <ul className="app-badges" aria-label="Technology stack">
                {STACK_BADGES.map((badge) => (
                  <li key={badge} className="app-badge">
                    {badge}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="app-hero__art"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.8, ease: [0.16, 1, 0.3, 1], delay: reducedMotion ? 0 : 0.15 }}
            >
              <BookSpines />
            </motion.div>
          </div>
        </section>

        <section className="app-stats" aria-label="Project stats">
          <div className="app-shell app-stats__grid">
            {STATS.map((stat) => (
              <Reveal key={stat.label} className="app-stat">
                <Counter value={stat.value} suffix={stat.suffix} />
                <span className="app-stat__label">{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="components" className="app-section">
          <div className="app-shell">
            <SectionHeading
              eyebrow="Live components"
              title="Every primitive, actually interactive"
              lede="This isn't a screenshot. Click, hover, and tab through the real components rendered from the same source Storybook documents."
            />

            <Reveal className="app-component-block">
              <div className="app-component-block__meta">
                <h3>Button</h3>
                <p>Four variants, three sizes, a real loading state, and full keyboard support.</p>
              </div>
              <ButtonShowcase />
            </Reveal>

            <Reveal className="app-component-block">
              <div className="app-component-block__meta">
                <h3>Modal</h3>
                <p>Focus-trapped dialog with the WAI-ARIA "Dialog (Modal)" pattern, built from scratch.</p>
              </div>
              <ModalShowcase />
            </Reveal>

            <Reveal className="app-component-block app-component-block--reverse">
              <div className="app-component-block__meta">
                <h3>Tabs</h3>
                <p>Roving tabindex, arrow-key navigation, and both activation modes.</p>
              </div>
              <div className="app-showcase-card">
                <Tabs items={TAB_ITEMS} label="Tabs component details" />
              </div>
            </Reveal>

            <Reveal className="app-component-block">
              <div className="app-component-block__meta">
                <h3>Tooltip</h3>
                <p>Hover with a sane delay, instant on focus, dismissible with Escape.</p>
              </div>
              <TooltipShowcase />
            </Reveal>

            <Reveal className="app-component-block app-component-block--reverse">
              <div className="app-component-block__meta">
                <h3>Toast</h3>
                <p>A tiny zustand store, live-region roles matched to severity, pausable timers.</p>
              </div>
              <ToastShowcase />
            </Reveal>
          </div>
        </section>

        <section id="accessibility" className="app-section app-section--accessibility">
          <div className="app-shell">
            <SectionHeading
              eyebrow="Why this exists"
              title="Accessibility is the feature, not a checkbox"
              lede="Every component below is built from its real ARIA Authoring Practices pattern and verified — not just described in a README."
            />
            <div className="app-checklist">
              {A11Y_CHECKLIST.map((item) => (
                <Reveal key={item.title} className="app-checklist__item">
                  <span className="app-checklist__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none">
                      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="app-section app-section--install">
          <div className="app-shell app-install">
            <Reveal>
              <p className="app-eyebrow">Get started</p>
              <h2>Read the docs, run the tests, poke at the components.</h2>
            </Reveal>
            <Reveal>
              <pre className="app-code app-code--block">
                <code>{`npm install
npm run storybook   # browse every state, a11y panel included
npm test             # vitest + Testing Library + jest-axe
npm run build        # type-checks and bundles the library`}</code>
              </pre>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="app-shell app-footer__inner">
          <p>OpenShelf — a portfolio demo. Built with React, TypeScript, Storybook, and Vitest.</p>
          <ul className="app-badges" aria-label="Technology stack">
            {STACK_BADGES.map((badge) => (
              <li key={badge} className="app-badge app-badge--muted">
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
