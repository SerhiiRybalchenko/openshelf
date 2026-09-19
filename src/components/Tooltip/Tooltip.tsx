import { cloneElement, isValidElement, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './Tooltip.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** The tooltip's text. Keep it short — tooltips are not a place for interactive content. */
  content: ReactNode;
  /** A single focusable element (button, link, ...) that triggers the tooltip. */
  children: ReactElement;
  placement?: TooltipPlacement;
  /** Hover delay in ms before showing. Focus always shows instantly. @default 300 */
  delay?: number;
}

const OFFSET: Record<TooltipPlacement, { x: number; y: number }> = {
  top: { x: 0, y: -8 },
  bottom: { x: 0, y: 8 },
  left: { x: -8, y: 0 },
  right: { x: 8, y: 0 },
};

/**
 * A hover/focus tooltip following the WAI-ARIA "tooltip" pattern:
 * - `role="tooltip"`, referenced from the trigger via `aria-describedby` —
 *   it supplements the trigger's accessible name, it never replaces it.
 * - Appears on both mouse hover (after `delay`, so it doesn't flash while
 *   the pointer passes over) and keyboard focus (instantly — keyboard users
 *   shouldn't have to wait).
 * - Dismisses on `Escape` without moving focus away from the trigger, and
 *   on blur/mouseleave, per the APG pattern.
 * - Never itself becomes focusable or interactive: it can disappear on
 *   hover-out without stranding a keyboard/AT user inside it.
 */
export function Tooltip({ content, children, placement = 'top', delay = 300 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reducedMotion = useReducedMotion();

  function show(withDelay: boolean) {
    window.clearTimeout(timeoutRef.current);
    if (withDelay && delay > 0) {
      timeoutRef.current = setTimeout(() => setOpen(true), delay);
    } else {
      setOpen(true);
    }
  }

  function hide() {
    window.clearTimeout(timeoutRef.current);
    setOpen(false);
  }

  if (!isValidElement(children)) return children;

  const childProps = children.props as Record<string, unknown>;
  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: (event: React.MouseEvent) => {
      (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(event);
      show(true);
    },
    onMouseLeave: (event: React.MouseEvent) => {
      (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(event);
      hide();
    },
    onFocus: (event: React.FocusEvent) => {
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(event);
      show(false);
    },
    onBlur: (event: React.FocusEvent) => {
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(event);
      hide();
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      (childProps.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined)?.(event);
      if (event.key === 'Escape' && open) {
        hide();
      }
    },
  });

  const offset = OFFSET[placement];
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.14, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <span className="shelf-tooltip__wrapper">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            id={tooltipId}
            className={clsx('shelf-tooltip', `shelf-tooltip--${placement}`)}
            initial={{ opacity: 0, x: reducedMotion ? 0 : offset.x, y: reducedMotion ? 0 : offset.y }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: reducedMotion ? 0 : offset.x * 0.5, y: reducedMotion ? 0 : offset.y * 0.5 }}
            transition={transition}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
