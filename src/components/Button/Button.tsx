import { forwardRef, useCallback } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `primary` is the brass call-to-action, `danger` for destructive actions. */
  variant?: ButtonVariant;
  /** Controls padding/font-size. */
  size?: ButtonSize;
  /** Shows a spinner, disables interaction, and sets `aria-busy`. The label stays
   * in the accessibility tree (announced as "busy") instead of disappearing. */
  loading?: boolean;
  /** Icon rendered before the label. Decorative — hidden from assistive tech. */
  iconStart?: ReactNode;
  /** Icon rendered after the label. Decorative — hidden from assistive tech. */
  iconEnd?: ReactNode;
  /** Stretches the button to fill its container. */
  fullWidth?: boolean;
}

/**
 * OpenShelf's Button. A single component covers every button-like affordance
 * in the library, so focus styles, disabled semantics, and loading behaviour
 * stay consistent everywhere it's used.
 *
 * Accessibility:
 * - Native `<button>` — full keyboard operability (Space/Enter) for free.
 * - `disabled` uses the real DOM attribute, so it's removed from the tab
 *   order and announced correctly, instead of a faked `aria-disabled` look.
 * - `loading` keeps the button focusable but non-activatable (`aria-disabled`
 *   + `aria-busy`), so screen-reader users hear "busy" rather than the
 *   control silently vanishing from the tab order mid-task.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    iconStart,
    iconEnd,
    className,
    children,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  // Loading buttons stay focusable (unlike `disabled`) so screen-reader
  // users still land on them and hear "busy", but activation is a no-op.
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    [loading, onClick],
  );

  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'shelf-button',
        `shelf-button--${variant}`,
        `shelf-button--${size}`,
        fullWidth && 'shelf-button--full',
        loading && 'shelf-button--loading',
        className,
      )}
      disabled={disabled}
      aria-disabled={loading ? true : undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading && (
        <span className="shelf-button__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="42 100"
            />
          </svg>
        </span>
      )}
      {!loading && iconStart && (
        <span className="shelf-button__icon" aria-hidden="true">
          {iconStart}
        </span>
      )}
      <span className="shelf-button__label">{children}</span>
      {!loading && iconEnd && (
        <span className="shelf-button__icon" aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </button>
  );
});
