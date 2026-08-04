---
name: Monorepo setup after import
description: How to get the NEXUS monorepo fully wired after importing from GitHub.
---

# Monorepo setup after import

## Rule
After importing this pnpm monorepo, run `pnpm install --no-frozen-lockfile` and select the **Node.js 22** runtime before any other commands. The default Node 20 runtime does not include `node:sqlite`, which causes durable SQLite tests and the server to fail.

**Why:**
The workspace uses `@nexus/*` package references that only resolve once pnpm creates the workspace symlinks. Running the install step also ensures `tsx` and the correct Vitest version are available. The project relies on Node’s built-in `node:sqlite` module, which is only present in Node 22.5+; the Node 20 runtime in the environment appears to satisfy the `engines` field but lacks the module.

**How to apply:**
1. Switch to Node 22 in the repl module list (or run the project’s Node 22 workflow).
2. Run `pnpm install --no-frozen-lockfile` from the workspace root to link local packages and install the root dev dependencies.
3. Verify with `pnpm typecheck` and `pnpm test` before starting the server.
