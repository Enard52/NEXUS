import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run every package's tests from the repo root.
    include: ["packages/*/src/**/*.{test,spec}.ts"],
    environment: "node",
    passWithNoTests: true,
    reporters: "default",
  },
});
