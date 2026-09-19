import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'jest-axe';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is not in the document until triggered', () => {
    render(
      <Tooltip content="Helpful hint">
        <button>Trigger</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on hover only after the delay elapses, and hides on mouse leave', async () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Helpful hint" delay={300}>
        <button>Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');

    fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful hint');

    // Let the enter animation's own rAF ticks (fake timers intercept
    // `requestAnimationFrame` too) fully settle *before* swapping back to
    // real timers — otherwise a tick left pending under the fake clock is
    // orphaned by the swap and never fires, permanently stalling Motion's
    // shared animation loop for every test that runs after this one.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Switch back to real timers so the exit transition (driven by
    // requestAnimationFrame, not setTimeout) can actually run to completion.
    vi.useRealTimers();
    fireEvent.mouseLeave(trigger);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('shows instantly on keyboard focus, with no delay, and hides on blur', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Helpful hint" delay={300}>
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.tab();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('dismisses on Escape without moving focus away from the trigger', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Helpful hint" delay={0}>
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.tab();
    const trigger = screen.getByRole('button');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('describes the trigger via aria-describedby only while open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Copies the command" delay={0}>
        <button>Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    expect(trigger).not.toHaveAttribute('aria-describedby');

    await user.tab();
    expect(trigger).toHaveAccessibleDescription('Copies the command');
  });

  it('composes with a consumer-supplied onMouseEnter instead of replacing it', () => {
    vi.useFakeTimers();
    const consumerHandler = vi.fn();
    render(
      <Tooltip content="Helpful hint" delay={0}>
        <button onMouseEnter={consumerHandler}>Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(consumerHandler).toHaveBeenCalledOnce();
  });

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'has no detectable accessibility violations, placement=%s',
    async (placement) => {
      const { container } = render(
        <Tooltip content="Helpful hint" placement={placement} delay={0}>
          <button>Trigger</button>
        </Tooltip>,
      );
      fireEvent.focus(screen.getByRole('button'));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );
});
