import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useToastStore } from './toastStore';
import type { ToastRecord, ToastVariant } from './toastStore';
import './Toast.css';

export type ToasterPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToasterProps {
  /** Corner the stack anchors to. @default 'bottom-right' */
  position?: ToasterPosition;
}

const ICONS: Record<ToastVariant, ReactElement> = {
  success: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3l8.5 14.5H1.5L10 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.6" r="0.9" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="1" fill="currentColor" />
    </svg>
  ),
};

/**
 * A single toast. Mounted by `<Toaster />`; not exported on its own since a
 * toast without the viewport's ordering/live-region context isn't meaningful.
 *
 * Accessibility:
 * - `role="alert"` (implicit assertive live region) for errors, `role="status"`
 *   (implicit polite live region) for everything else — errors interrupt,
 *   routine confirmations don't.
 * - The auto-dismiss timer pauses on hover *and* on keyboard focus, and only
 *   resumes on mouse-leave/blur, satisfying WCAG 2.2.1 (Timing Adjustable)
 *   instead of racing a screen-reader or low-vision user's reading speed.
 * - The dismiss control has an explicit `aria-label` since it's icon-only.
 */
function ToastItem({ record, position, onDismiss }: { record: ToastRecord; position: ToasterPosition; onDismiss: () => void }) {
  const reducedMotion = useReducedMotion();
  const remainingRef = useRef(record.duration);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (record.duration <= 0) return undefined;
    start(remainingRef.current);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start(ms: number) {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(onDismiss, ms);
  }

  function stop() {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
  }

  function pause() {
    if (record.duration <= 0) return;
    stop();
    remainingRef.current = Math.max(remainingRef.current - (Date.now() - startedAtRef.current), 0);
  }

  function resume() {
    if (record.duration <= 0) return;
    start(remainingRef.current);
  }

  const fromRight = position.endsWith('right');
  const offsetX = reducedMotion ? 0 : fromRight ? 56 : -56;

  return (
    <motion.div
      role={record.variant === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      layout={!reducedMotion}
      initial={{ opacity: 0, x: offsetX, scale: reducedMotion ? 1 : 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9, transition: { duration: reducedMotion ? 0 : 0.15 } }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
      className={clsx('shelf-toast', `shelf-toast--${record.variant}`)}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <span className="shelf-toast__icon" aria-hidden="true">
        {ICONS[record.variant]}
      </span>
      <div className="shelf-toast__content">
        <p className="shelf-toast__title">{record.title}</p>
        {record.description && <p className="shelf-toast__description">{record.description}</p>}
        {record.action && (
          <button
            type="button"
            className="shelf-toast__action"
            onClick={() => {
              record.action?.onClick();
              onDismiss();
            }}
          >
            {record.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="shelf-toast__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

/**
 * The toast viewport. Render it once near the root of the app; push toasts
 * from anywhere with the `toast()` helper exported alongside it.
 */
export function Toaster({ position = 'bottom-right' }: ToasterProps) {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (typeof document === 'undefined') return null;

  return createPortal(
    // `role="region"` + a name gives this floating portal its own landmark:
    // without it, a toast that renders as a direct child of <body> would
    // sit outside every landmark on the page (header/main/footer), which
    // axe's `region` rule (rightly) flags. A plain <div> — not a <ul>/<li>
    // list — also sidesteps `aria-allowed-role`: role="status"/"alert" is
    // not a valid role for an <li>.
    <div
      className={clsx('shelf-toaster', `shelf-toaster--${position}`)}
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((record) => (
          <ToastItem key={record.id} record={record} position={position} onDismiss={() => dismiss(record.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
