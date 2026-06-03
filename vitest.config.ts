import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Expose vitest's lifecycle hooks globally so @testing-library/react can
    // auto-register its afterEach(cleanup); without this, renders accumulate in
    // document.body across tests and `screen` queries see stale copies.
    globals: true,
    // Default to node; component test files opt into jsdom via a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "./coverage",
      // coverage.all defaults to false, so only files actually imported by a test
      // are measured — this just scopes the report to first-party source.
      include: [
        "lib/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
      ],
    },
  },
});
