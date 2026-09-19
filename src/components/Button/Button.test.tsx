import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and responds to a click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to shelf</Button>);

    const button = screen.getByRole('button', { name: 'Add to shelf' });
    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is operable from the keyboard via Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not fire onClick and cannot be reached by tab when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Unavailable
      </Button>,
    );

    await user.tab();
    const disabledButton = screen.getByRole('button', { name: 'Unavailable' });
    expect(disabledButton).not.toHaveFocus();
    expect(disabledButton).toBeDisabled();

    await user.click(disabledButton);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks itself busy while loading but keeps the label announced and stays focusable', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Saving
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toBeDisabled();

    // Focusable, but activation is a no-op while loading.
    await user.tab();
    expect(button).toHaveFocus();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards a ref to the underlying <button> element', () => {
    let node: HTMLButtonElement | null = null;
    render(
      <Button
        ref={(el) => {
          node = el;
        }}
      >
        Ref target
      </Button>,
    );
    expect(node).toBeInstanceOf(HTMLButtonElement);
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'has no detectable accessibility violations in the %s variant',
    async (variant) => {
      const { container } = render(<Button variant={variant}>Add to shelf</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );

  it('has no detectable accessibility violations while loading', async () => {
    const { container } = render(<Button loading>Saving</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
