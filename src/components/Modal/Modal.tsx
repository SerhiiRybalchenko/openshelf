import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  /** Whether the dialog is open. The component stays mounted so it can play
   * its exit transition — nothing appears in the DOM when closed and the
   * transition has finished. */
  open: boolean;
  /** Called when the user asks to close: Escape, backdrop click, or the close button. */
  onClose: () => void;
  /** Required accessible name, rendered as the dialog's heading. */
  title: ReactNode;
  /** Optional supporting text, wired to `aria-describedby`. */
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** @default true */
  closeOnBackdropClick?: boolean;
  /** @default true */
  closeOnEscape?: boolean;
  /** @default false — set for destructive confirmations that must be a deliberate choice. */
  hideCloseButton?: boolean;
  /** Element to focus when the dialog opens, instead of the first focusable child. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * An accessible dialog built on the native focus-trapping + `aria-modal`
 * pattern (WAI-ARIA "Dialog (Modal)"), not a library primitive.
 *
 * - `role="dialog"` + `aria-modal="true"`, named by its heading via
 *   `aria-labelledby` and optionally described via `aria-describedby`.
 * - Focus moves into the dialog on open and is trapped there (Tab/Shift+Tab
 *   cycle among its focusable children) and is restored to the triggering
 *   element on close.
 * - Escape closes it (configurable); background content is inert to pointer
 *   interaction and hidden from screen readers (`aria-hidden` via a
 *   dedicated portal root) while open.
 * - Background scroll is locked while open so keyboard/touch scroll can't
 *   move content the user can't see.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  hideCloseButton = false,
  initialFocusRef,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reducedMotion = useReducedMotion();

  useFocusTrap(dialogRef, open, initialFocusRef);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  }

  const backdropTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.65, 0, 0.35, 1] as const };
  const dialogTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="shelf-modal__backdrop"
          onMouseDown={handleBackdropMouseDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={clsx('shelf-modal', `shelf-modal--${size}`)}
            tabIndex={-1}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 16, scale: reducedMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 10, scale: reducedMotion ? 1 : 0.98 }}
            transition={dialogTransition}
          >
            <header className="shelf-modal__header">
              <h2 id={titleId} className="shelf-modal__title">
                {title}
              </h2>
              {!hideCloseButton && (
                <button
                  type="button"
                  className="shelf-modal__close"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </header>
            {description && (
              <p id={descriptionId} className="shelf-modal__description">
                {description}
              </p>
            )}
            {children && <div className="shelf-modal__body">{children}</div>}
            {footer && <footer className="shelf-modal__footer">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
