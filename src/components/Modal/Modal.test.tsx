import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Modal } from './Modal';

function ControlledModal(props: Partial<React.ComponentProps<typeof Modal>>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal title="Dialog title" open={open} onClose={() => setOpen(false)} {...props}>
        <button>First focusable</button>
        <button>Second focusable</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders nothing in the document when closed', () => {
    render(
      <Modal title="Hidden" open={false} onClose={vi.fn()}>
        content
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes dialog semantics: role, aria-modal, and a name from the title', () => {
    render(
      <Modal title="Remove component" open onClose={vi.fn()} description="Are you sure?">
        content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Remove component' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Are you sure?');
  });

  it('moves focus inside the dialog on open and restores it to the trigger on close', async () => {
    const user = userEvent.setup();
    // The close (×) button is the first focusable element in DOM order — its
    // own tab-order position is covered by the dedicated focus-trap test
    // below. Hiding it here isolates what *this* test checks: that opening
    // moves focus into the dialog's content and closing restores it.
    render(<ControlledModal hideCloseButton />);

    const openButton = screen.getByRole('button', { name: 'Open' });
    await user.click(openButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'First focusable' })).toHaveFocus();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(openButton).toHaveFocus();
  });

  it('traps Tab so focus cycles between the close button and the last focusable element', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const closeButton = await screen.findByRole('button', { name: 'Close dialog' });
    const second = screen.getByRole('button', { name: 'Second focusable' });

    second.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(second).toHaveFocus();
  });

  it('calls onClose on Escape by default, and can opt out', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal title="T" open onClose={onClose}>
        body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockClear();
    rerender(
      <Modal title="T" open onClose={onClose} closeOnEscape={false}>
        body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on backdrop click but not on a click inside the dialog', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="T" open onClose={onClose}>
        <button>Inside</button>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    // The backdrop is the dialog's positioning parent.
    fireEvent.mouseDown(dialog.parentElement as Element, { target: dialog.parentElement });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close on backdrop click when closeOnBackdropClick is false', () => {
    const onClose = vi.fn();
    render(
      <Modal title="T" open onClose={onClose} closeOnBackdropClick={false}>
        body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog.parentElement as Element, { target: dialog.parentElement });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks background scroll while open', async () => {
    const { rerender } = render(
      <Modal title="T" open={false} onClose={vi.fn()}>
        body
      </Modal>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');

    rerender(
      <Modal title="T" open onClose={vi.fn()}>
        body
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal title="T" open={false} onClose={vi.fn()}>
        body
      </Modal>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('has no detectable accessibility violations while open', async () => {
    render(
      <Modal title="Remove component" open onClose={vi.fn()} description="Are you sure?">
        <button>OK</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const results = await axe(dialog.parentElement as HTMLElement);
    expect(results).toHaveNoViolations();
  });
});
