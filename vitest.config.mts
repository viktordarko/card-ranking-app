import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The tested code (`src/lib`, `src/data`) is pure TypeScript with no DOM.
    environment: "node",
    // West of Greenwich, like every user of the app: a date formatted in local
    // time instead of UTC shows up here as the day before.
    env: { TZ: "America/Toronto" },
    include: ["src/**/*.test.ts"],
  },
});
