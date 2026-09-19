import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Tabs } from './Tabs';

const items = [
  { id: 'a', label: 'Alpha', content: <p>Alpha panel</p> },
  { id: 'b', label: 'Beta', content: <p>Beta panel</p> },
  { id: 'c', label: 'Gamma', content: <p>Gamma panel</p> },
];

describe('Tabs', () => {
  it('renders a tablist and shows only the selected panel', () => {
    render(<Tabs items={items} label="Demo tabs" />);

    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false');

    const visiblePanel = screen.getByRole('tabpanel');
    expect(visiblePanel).toHaveAccessibleName('Alpha');
    expect(screen.getByText('Alpha panel')).toBeVisible();
  });

  it('selects a tab on click and updates the visible panel', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Demo tabs" />);

    await user.click(screen.getByRole('tab', { name: 'Beta' }));

    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Beta panel')).toBeVisible();
  });

  it('navigates and selects with ArrowRight/ArrowLeft, wrapping at the ends (automatic activation)', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Demo tabs" />);

    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowLeft}'); // wraps to last
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}'); // wraps back to first
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps to the first/last tab with Home/End', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Demo tabs" />);

    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('skips disabled tabs during arrow-key navigation', async () => {
    const user = userEvent.setup();
    const withDisabled = [items[0], { ...items[1], disabled: true }, items[2]];
    render(<Tabs items={withDisabled} label="Demo tabs" />);

    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false');
  });

  it('in manual activation mode, arrow keys move focus without selecting until Enter/Space', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Demo tabs" activationMode="manual" />);

    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
  });

  it('supports controlled selection via value/onValueChange', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState('a');
      return <Tabs items={items} label="Demo tabs" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);

    await user.click(screen.getByRole('tab', { name: 'Gamma' }));
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onValueChange even when used in fully controlled mode without local state', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs items={items} label="Demo tabs" value="a" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<Tabs items={items} label="Demo tabs" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
