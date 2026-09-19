import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Toaster } from './Toast';
import { toast, useToastStore } from './toastStore';
import { Button } from '../Button';

function ResetOnMount() {
  useEffect(() => {
    useToastStore.getState().clear();
  }, []);
  return null;
}

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <ResetOnMount />
        <Story />
      </>
    ),
  ],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          onClick={() => toast.info('Sync started', { description: 'Fetching the latest component versions.' })}
        >
          Info toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.success('Component published', { description: 'Tooltip v2.1.0 is now live.' })}
        >
          Success toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.warning('Version drift detected', { description: 'Peer dependency out of range.' })}
        >
          Warning toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.error('Publish failed', { description: 'Storybook build exited with code 1.' })}
        >
          Error toast
        </Button>
      </div>
      <Toaster />
    </>
  ),
};

export const WithAction: Story = {
  render: () => (
    <>
      <Button
        variant="primary"
        onClick={() =>
          toast.error('Component deleted', {
            duration: 8000,
            action: { label: 'Undo', onClick: () => toast.success('Restored') },
          })
        }
      >
        Delete component
      </Button>
      <Toaster />
    </>
  ),
};

export const PersistentUntilDismissed: Story = {
  render: () => (
    <>
      <Button
        variant="secondary"
        onClick={() => toast.info('Manual dismiss only', { duration: 0, description: 'This toast will not auto-dismiss.' })}
      >
        Show persistent toast
      </Button>
      <Toaster />
    </>
  ),
};

export const StackedPositions: Story = {
  render: () => (
    <>
      <Button variant="secondary" onClick={() => toast.info('Bottom-right stack', {})}>
        Push a toast
      </Button>
      <Toaster position="bottom-right" />
    </>
  ),
};

export const Interaction: Story = {
  render: () => (
    <>
      <Button variant="primary" onClick={() => toast.success('Saved changes')}>
        Trigger toast
      </Button>
      <Toaster />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Trigger toast' }));
    const toastEl = await body.findByText('Saved changes');
    await expect(toastEl).toBeInTheDocument();

    const dismissButtons = body.getAllByRole('button', { name: 'Dismiss notification' });
    await userEvent.click(dismissButtons[dismissButtons.length - 1]);

    await waitFor(() => expect(body.queryByText('Saved changes')).not.toBeInTheDocument());
  },
};
