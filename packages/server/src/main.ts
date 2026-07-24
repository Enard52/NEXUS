/**
 * NEXUS AI — Runnable server entrypoint (FAZ 18)
 *
 * Boots the sync server on a durable SQLite file so real accounts and per-user
 * data survive restarts. The data directory defaults to `~/.nexus` and can be
 * overridden with NEXUS_DATA_DIR; the port defaults to 4178 (override with PORT).
 * Static assets and the installer download are served from the built web app.
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { SqliteKeyValueStore } from "@nexus/database";
import { createNexusApp, startServer } from "./index.js";

const dataDir = process.env.NEXUS_DATA_DIR ?? join(homedir(), ".nexus");
const dbFile = join(dataDir, "nexus.db");
const here = dirname(fileURLToPath(import.meta.url));
const staticRoot = resolve(here, "../../web/dist");

const store = new SqliteKeyValueStore(dbFile);
const app = createNexusApp({ store, staticRoot });
const port = Number(process.env.PORT ?? 4178);

void startServer(app, port).then(({ port: bound }) => {
  // eslint-disable-next-line no-console
  console.log(`NEXUS sync server listening on http://localhost:${bound}`);
  // eslint-disable-next-line no-console
  console.log(`  data: ${dbFile}`);
  // eslint-disable-next-line no-console
  console.log(`  static: ${staticRoot}`);
});
