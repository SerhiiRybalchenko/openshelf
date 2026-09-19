// jest-axe ships Jest matcher types, not Vitest ones. This augments Vitest's
// `expect` with `toHaveNoViolations()` so `src/test/setup.ts`
// (`expect.extend(toHaveNoViolations)`) is fully typed.
import type { AxeResults } from 'axe-core';

interface AxeMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

declare module 'vitest' {
  interface Assertion<T = AxeResults> extends AxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
