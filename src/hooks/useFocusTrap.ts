import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isRendered(el: HTMLElement): boolean {
  // Deliberately not `offsetParent !== null`: that's false for
  // `position: fixed` elements in every real browser too, and jsdom (used
  // in tests) never computes layout at all, so `offsetParent` is always
  // null there. `getComputedStyle` reflects inline styles and the
  // `[hidden]` UA rule in both environments.
  if (el.hidden) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isRendered,
  );
}

/**
 * Traps Tab/Shift+Tab focus cycling within `containerRef` while `active` is
 * true, moves focus into the container (or `initialFocusRef` when given) on
 * activation, and restores focus to whatever was focused beforehand on
 * deactivation. Used by Modal so keyboard and screen-reader users never get
 * lost behind an open dialog.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  initialFocusRef?: React.RefObject<HTMLElement | null>,
) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusTarget = initialFocusRef?.current ?? getFocusable(container)[0] ?? container;
    // Defer to let enter transitions mount before we steal focus.
    const raf = requestAnimationFrame(() => focusTarget.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [active, containerRef, initialFocusRef]);
}
