import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Modal } from './Modal';
import type { ModalProps } from './Modal';
import { Button } from '../Button';

type ModalDemoProps = Partial<Pick<ModalProps, 'size' | 'closeOnBackdropClick' | 'closeOnEscape' | 'hideCloseButton'>>;

// Modal is controlled (`open`/`onClose`), so every story needs a bit of
// local state to open it — this wrapper is what Storybook actually renders,
// which also lets every story below use plain `args` instead of a one-off
// `render` (and keeps each story typed without faking Modal's required props).
function ModalDemo({ size, closeOnBackdropClick, closeOnEscape, hideCloseButton }: ModalDemoProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Modal
        title="Remove from shelf?"
        description="This removes the component from your saved collection. You can add it back later."
        open={open}
        onClose={() => setOpen(false)}
        size={size}
        closeOnBackdropClick={closeOnBackdropClick}
        closeOnEscape={closeOnEscape}
        hideCloseButton={hideCloseButton}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Remove
            </Button>
          </>
        }
      >
        <p>The removal only affects this browser — nothing is deleted from the published library.</p>
      </Modal>
    </>
  );
}

const meta = {
  title: 'Components/Modal',
  component: ModalDemo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const NoBackdropDismiss: Story = {
  name: 'Non-dismissible (confirmation)',
  args: { closeOnBackdropClick: false, closeOnEscape: false, hideCloseButton: true },
};

export const OpenAndClose: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog', { name: 'Remove from shelf?' });
    await expect(dialog).toBeInTheDocument();

    // Focus should move into the dialog automatically.
    await expect(body.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    // The dialog doesn't leave the DOM until its exit transition finishes.
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
