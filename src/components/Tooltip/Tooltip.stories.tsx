import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Tooltip } from './Tooltip';
import type { TooltipPlacement } from './Tooltip';
import { Button } from '../Button';

interface TooltipDemoProps {
  placement?: TooltipPlacement;
  delay?: number;
  label?: string;
}

// Tooltip requires a single element `children` to clone props onto, which
// doesn't fit CSF3's `args`-driven story shape — this wrapper supplies that
// child so every story below can just pass plain, optional `args`.
function TooltipDemo({ placement = 'top', delay = 0, label = 'Hover or focus me' }: TooltipDemoProps) {
  return (
    <Tooltip content="Copies the install command to your clipboard" placement={placement} delay={delay}>
      <Button variant="secondary">{label}</Button>
    </Tooltip>
  );
}

const meta = {
  title: 'Components/Tooltip',
  component: TooltipDemo,
  tags: ['autodocs'],
  argTypes: {
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
  },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TooltipDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  args: { placement: 'top' },
};

export const Bottom: Story = {
  args: { placement: 'bottom' },
};

export const Left: Story = {
  args: { placement: 'left' },
};

export const Right: Story = {
  args: { placement: 'right' },
};

export const AppearsOnKeyboardFocus: Story = {
  args: { label: 'Tab to me' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const trigger = canvas.getByRole('button');
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(canvas.getByRole('tooltip')).toBeInTheDocument());
    await expect(trigger).toHaveAccessibleDescription(
      'Copies the install command to your clipboard',
    );
  },
};
