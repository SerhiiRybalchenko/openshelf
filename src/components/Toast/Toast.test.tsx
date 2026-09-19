import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'jest-axe';
import { Toaster } from './Toast';
import { toast, useToastStore } from './toastStore';

afterEach(() => {
  act(() => {
    useToastStore.getState().clear();
  });
  vi.useRealTimers();
});

/**
 * Drains a Motion exit animation under fake timers. `requestAnimationFrame`
 * is fake-timer-intercepted too, but its recursive tick chain only re-arms
 * itself once React actually commits the previous tick's work — a single
 * large `advanceTimersByTime` doesn't yield the microtask turn React's
 * scheduler needs for that in between. Stepping in small increments (with a
 * microtask yield after each) lets the chain unwind for real, so no tick is
 * left pending when a test later swaps back to real timers.
 */
async function flushExitAnimation(totalMs = 600, stepMs = 50) {
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      vi.advanceTimersByTime(stepMs);
      await Promise.resolve();
    });
  }
}

describe('toastStore', () => {
  it('adds and removes toasts from the store', () => {
    const id = toast.info('Hello');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    toast.dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('defaults variant to info and duration to 5000ms', () => {
    toast({ title: 'Plain' });
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'info', duration: 5000 });
  });
});

describe('Toaster', () => {
  it('renders a pushed toast with the right title, description, and live-region role', () => {
    render(<Toaster />);

    act(() => {
      toast.success('Component published', { description: 'Tooltip v2.1.0 is now live.' });
    });

    // Each toast is a plain `div` (not a `<ul>/<li>` list — see the comment
    // on `Toaster`), so it's located by its `.shelf-toast` class rather than
    // list-item semantics.
    const item = screen.getByText('Component published').closest('.shelf-toast');
    expect(item).toHaveAttribute('role', 'status');
    expect(screen.getByText('Tooltip v2.1.0 is now live.')).toBeInTheDocument();
  });

  it('uses role="alert" (assertive) for error toasts and role="status" (polite) otherwise', () => {
    render(<Toaster />);
    act(() => {
      toast.error('Publish failed');
      toast.info('Sync started');
    });

    expect(screen.getByText('Publish failed').closest('.shelf-toast')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Sync started').closest('.shelf-toast')).toHaveAttribute('role', 'status');
  });

  it('auto-dismisses after its duration elapses', async () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast.info('Will vanish', { duration: 1000 });
    });
    expect(screen.getByText('Will vanish')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Removal from the store doesn't unmount the toast until its exit
    // transition finishes — drain it before asserting.
    await flushExitAnimation();
    expect(screen.queryByText('Will vanish')).not.toBeInTheDocument();
  });

  it('never auto-dismisses when duration is 0', async () => {
    vi.useFakeTimers();
    render(<Toaster />);
    let id = '';
    act(() => {
      id = toast.info('Stays forever', { duration: 0 });
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Stays forever')).toBeInTheDocument();

    // Dismiss it through the same state-driven path a real timeout would —
    // and let the exit transition it kicks off actually finish — instead of
    // leaving Testing Library's `afterEach` cleanup to abruptly unmount a
    // toast AnimatePresence still considers "present". Motion's exit
    // bookkeeping doesn't unwind cleanly from that abrupt a teardown, which
    // otherwise stalls the *next* test's own exit animation.
    act(() => {
      toast.dismiss(id);
    });
    await flushExitAnimation();
  });

  it('pauses the auto-dismiss timer on hover and resumes it on mouse leave', async () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast.info('Hover me', { duration: 1000 });
    });
    const item = screen.getByText('Hover me').closest('.shelf-toast') as HTMLElement;

    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    fireEvent.mouseEnter(item);

    // Paused: waiting well past the original duration must not dismiss it.
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Hover me')).toBeInTheDocument();

    fireEvent.mouseLeave(item);
    // Only ~200ms of the original 1000ms budget remained when paused.
    await act(async () => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.getByText('Hover me')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2);
    });
    // The dismiss timer just fired; drain the resulting exit transition
    // before asserting it actually left the DOM.
    await flushExitAnimation();
    expect(screen.queryByText('Hover me')).not.toBeInTheDocument();
  });

  it('dismisses via the close button', async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast.info('Dismiss me', { duration: 0 });
    });

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument());
  });

  it('runs the action callback and dismisses the toast when the action is clicked', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast.error('Delete failed', { duration: 0, action: { label: 'Retry', onClick: onAction } });
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText('Delete failed')).not.toBeInTheDocument());
  });

  it('has no detectable accessibility violations with multiple toasts visible', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('Saved');
      toast.warning('Check your connection');
      toast.error('Something broke');
    });

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
