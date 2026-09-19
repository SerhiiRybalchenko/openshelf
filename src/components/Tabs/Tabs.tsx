import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

export interface TabsProps {
  items: TabItem[];
  /** Accessible name for the tablist itself (e.g. "Component categories"). */
  label: string;
  /** Uncontrolled initial selection. Defaults to the first non-disabled tab. */
  defaultValue?: string;
  /** Controlled selection. Pair with `onValueChange`. */
  value?: string;
  onValueChange?: (id: string) => void;
  /** @default 'horizontal' */
  orientation?: TabsOrientation;
  /**
   * 'automatic' (default) selects a tab as soon as it receives focus via
   * arrow keys — the common, fastest pattern. 'manual' only moves focus on
   * arrow keys and requires Enter/Space to select, which suits tabs whose
   * content is expensive to switch to.
   * @default 'automatic'
   */
  activationMode?: TabsActivationMode;
}

/**
 * Implements the WAI-ARIA Authoring Practices "Tabs" pattern from scratch:
 * `tablist`/`tab`/`tabpanel` roles, `aria-selected`, `aria-controls` /
 * `aria-labelledby` cross-references, a roving `tabindex` (only the active —
 * or focused, in manual mode — tab is in the Tab order; arrow keys move
 * focus within the list), and Home/End to jump to the first/last enabled
 * tab. Disabled tabs are skipped by arrow navigation entirely.
 */
export function Tabs({
  items,
  label,
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'automatic',
}: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const reducedMotion = useReducedMotion();

  const firstEnabled = items.find((item) => !item.disabled)?.id ?? items[0]?.id;
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabled);
  const [focusedId, setFocusedId] = useState(defaultValue ?? firstEnabled);

  const selectedId = value ?? internalValue;
  const enabledItems = useMemo(() => items.filter((item) => !item.disabled), [items]);

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setInternalValue(id);
      onValueChange?.(id);
    },
    [value, onValueChange],
  );

  function focusTab(id: string) {
    setFocusedId(id);
    tabRefs.current.get(id)?.focus();
    if (activationMode === 'automatic') select(id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = enabledItems.findIndex((item) => item.id === (focusedId ?? selectedId));
    if (currentIndex === -1) return;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case nextKey: {
        event.preventDefault();
        const next = enabledItems[(currentIndex + 1) % enabledItems.length];
        focusTab(next.id);
        break;
      }
      case prevKey: {
        event.preventDefault();
        const prev = enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];
        focusTab(prev.id);
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusTab(enabledItems[0].id);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusTab(enabledItems[enabledItems.length - 1].id);
        break;
      }
      case 'Enter':
      case ' ': {
        if (activationMode === 'manual' && focusedId) {
          event.preventDefault();
          select(focusedId);
        }
        break;
      }
    }
  }

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  return (
    <div className={clsx('shelf-tabs', `shelf-tabs--${orientation}`)}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        className="shelf-tabs__list"
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isTabbable = item.id === (focusedId ?? selectedId);
          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
                else tabRefs.current.delete(item.id);
              }}
              role="tab"
              id={tabId(item.id)}
              type="button"
              aria-selected={isSelected}
              aria-controls={panelId(item.id)}
              aria-disabled={item.disabled || undefined}
              tabIndex={isTabbable ? 0 : -1}
              disabled={item.disabled}
              className={clsx('shelf-tabs__tab', isSelected && 'shelf-tabs__tab--selected')}
              onClick={() => {
                setFocusedId(item.id);
                select(item.id);
              }}
            >
              {item.label}
              {isSelected && (
                <motion.span
                  className="shelf-tabs__indicator"
                  aria-hidden="true"
                  layoutId={`${baseId}-indicator`}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 40 }
                  }
                />
              )}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={panelId(item.id)}
          aria-labelledby={tabId(item.id)}
          hidden={item.id !== selectedId}
          tabIndex={0}
          className="shelf-tabs__panel"
        >
          {item.id === selectedId && item.content}
        </div>
      ))}
    </div>
  );
}
