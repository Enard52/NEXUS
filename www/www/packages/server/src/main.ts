/**
 * NEXUS AI — Runnable server entrypoint
 *
 * Boots the sync server on a durable SQLite file so real accounts and per-user
 * data survive restarts. The data directory defaults to `~/.nexus` and can be
 * overridden with NEXUS_DATA_DIR; the port defaults to 4181 (override with PORT).
 * Static assets and the installer download are served from the built web app.
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { existsSync } from "node:fs";
import { SqliteKeyValueStore } from "@nexus/database";
import { loadConfig } from "@nexus/config";
import { SqliteUserMemoryStore } from "@nexus/memory";
import { createNexusApp, startServer } from "./index.js";

const config = loadConfig();
const dataDir = process.env.NEXUS_DATA_DIR ?? join(homedir(), ".nexus");
const dbFile = join(dataDir, "nexus.db");
const memoryDbFile = join(dataDir, "memory.db");
const here = dirname(fileURLToPath(import.meta.url));
// Prefer the aggregated repo-root public/ (built pages + real installer
// binaries under public/downloads); fall back to the raw web build output.
const publicRoot = resolve(here, "../../../public");
const staticRoot = existsSync(publicRoot) ? publicRoot : resolve(here, "../../web/dist");
// The built React SPA (packages/client). When present, /app serves it.
const clientDist = resolve(here, "../../client/dist");
const clientRoot = existsSync(clientDist) ? clientDist : undefined;

const store = new SqliteKeyValueStore(dbFile);
const memory = new SqliteUserMemoryStore(memoryDbFile);
const app = createNexusApp({ store, memory, staticRoot, clientRoot, config });
const port = Number(process.env.PORT ?? 4181);

void startServer(app, port).then(({ port: bound }) => {
  // eslint-disable-next-line no-console
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
    console.log(`NEXUS sync server listening on http://localhost:${bound}`);
  // eslint-disable-next-line no-console
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
    console.log(`  data: ${dbFile}`);
  // eslint-disable-next-line no-console
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
    console.log(`  static: ${staticRoot}`);
});
