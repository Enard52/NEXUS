import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The real NEXUS application. Dev server proxies /api to the local sync
// server (packages/server, port 4178) so the SPA always talks to real data.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4178",
      "/health": "http://127.0.0.1:4178",
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Long-term-cacheable chunks: framework, translations and app code
        // change at very different rates, so keep them separate.
        manualChunks: {
          react: ["react", "react-dom"],
          i18n: ["@nexus/i18n"],
        },
      },
    },
  },
});
