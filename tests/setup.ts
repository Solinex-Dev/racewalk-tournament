import "@testing-library/jest-dom/vitest";

// Minimal polyfills for Radix UI primitives running under jsdom. Guarded so the
// node-environment (pure-logic) tests are unaffected.
if (globalThis.window !== undefined) {
  globalThis.ResizeObserver ??= class {
    observe() {
      /* no-op: jsdom has no layout engine to observe */
    }
    unobserve() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
  } as unknown as typeof ResizeObserver;

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {
      /* no-op: jsdom does not implement scrolling */
    };
  }
}
