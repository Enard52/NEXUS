import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run every package's tests from the repo root.
    include: ["packages/*/src/**/*.{test,spec}.ts"],
    environment: "node",
    passWithNoTests: true,
    // Bazı testler dosya ağacını tarar / süreç başlatır; yavaş makinelerde ya da paralel koşuda 5 sn yetmiyordu.
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: "default",
  },
});
