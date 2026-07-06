import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The tested code (`src/lib`, `src/data`) is pure TypeScript with no DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
