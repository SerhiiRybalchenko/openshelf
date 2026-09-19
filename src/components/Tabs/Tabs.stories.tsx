import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from './Tabs';

const items = [
  { id: 'overview', label: 'Overview', content: <p>OpenShelf ships five accessible primitives.</p> },
  { id: 'install', label: 'Install', content: <p>npm install @openshelf/ui</p> },
  { id: 'theming', label: 'Theming', content: <p>Override the CSS custom properties on :root.</p> },
  { id: 'changelog', label: 'Changelog', content: <p>See CHANGELOG.md for release notes.</p> },
];

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: { items, label: 'Component documentation sections' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

export const ManualActivation: Story = {
  args: { activationMode: 'manual' },
};

export const WithDisabledTab: Story = {
  args: {
    items: [
      items[0],
      { ...items[1], disabled: true },
      items[2],
      items[3],
    ],
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overviewTab = canvas.getByRole('tab', { name: 'Overview' });
    overviewTab.focus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Install' })).toHaveFocus();
    await expect(canvas.getByRole('tab', { name: 'Install' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('tab', { name: 'Changelog' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus();

    const panel = canvas.getByRole('tabpanel');
    await expect(panel).toHaveAccessibleName('Overview');
  },
};
