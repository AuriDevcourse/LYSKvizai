import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest needs the same `@/` alias the app uses; without it any test that
 * imports through the alias fails to resolve.
 *
 * Only unit tests run here — pure logic (scoring, colour maths, validators).
 * Rendering and the multiplayer loop are covered by driving the real app.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
