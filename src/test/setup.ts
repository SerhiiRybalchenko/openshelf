import '@testing-library/jest-dom/vitest';
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Testing Library's auto-cleanup only self-registers when it finds a global
// `afterEach` (true under Jest, or Vitest's `globals: true`). This project
// keeps `globals: false` and imports test APIs explicitly, so cleanup is
// wired up by hand instead — otherwise every component mounted by `render`
// in one test would still be in the DOM for the next.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia — every component that reads
// `prefers-reduced-motion` needs a stub so it doesn't throw during tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}
