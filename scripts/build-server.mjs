// NEXUS AI - build the local sync server into a single CJS bundle.
//
// The desktop app spawns packages/server/dist/main.cjs with ELECTRON_RUN_AS_NODE
// so the packaged app carries one self-contained server file instead of the
// whole workspace. esbuild bundles the TS entry + all @nexus/* workspace deps
// into dist/main.cjs (CJS, node platform). Run via `pnpm --filter @nexus/server build`.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPkg = resolve(here, "..", "packages", "server");

await build({
  entryPoints: [resolve(serverPkg, "src", "main.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: resolve(serverPkg, "dist", "main.cjs"),
  sourcemap: false,
  minify: true,
  legalComments: "none",
  // Workspace packages are TS sources; esbuild resolves them via the
  // "exports" map (./src/index.ts). No external deps to exclude.
  logLevel: "info",
});

console.log("✓ Built packages/server/dist/main.cjs");
