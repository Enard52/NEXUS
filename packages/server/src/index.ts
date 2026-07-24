/**
 * NEXUS AI — Local sync server (FAZ 18)
 *
 * Public surface: a testable factory that wires the durable AccountService and
 * UserDataStore to the HTTP request handler, plus a `startServer` helper that
 * opens a socket. `main.ts` is the runnable entrypoint that picks a durable
 * SQLite file so real accounts and data survive restarts.
 */

import { createServer, type Server } from "node:http";
import { AccountService } from "@nexus/accounts";
import { InMemoryKeyValueStore, type KeyValueStore } from "@nexus/database";
import { UserDataStore } from "./userdata.js";
import { createRequestHandler, type AppDeps } from "./app.js";
import { buildOAuthRegistry } from "./oauth.js";

export * from "./userdata.js";
export * from "./pages.js";
export * from "./app.js";
export * from "./oauth.js";

export interface NexusApp extends AppDeps {
  readonly handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void;
}

export interface NexusAppOptions {
  /** Durable backend. Defaults to in-memory (dev/test). */
  readonly store?: KeyValueStore;
  /** Absolute path to built web assets for static hosting + downloads. */
  readonly staticRoot?: string;
}

/** Compose the whole server over a store — the single wiring point for every entrypoint. */
export function createNexusApp(opts: NexusAppOptions = {}): NexusApp {
  const store = opts.store ?? new InMemoryKeyValueStore();
  const accounts = new AccountService({ store });
  const userData = new UserDataStore(store);
  const oauth = buildOAuthRegistry();
  const handler = createRequestHandler({ accounts, userData, staticRoot: opts.staticRoot, oauth });
  return { handler, accounts, userData, staticRoot: opts.staticRoot };
}

/** Open an HTTP server on the given port (0 = ephemeral, useful for tests). */
export function startServer(app: NexusApp, port: number): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer(app.handler);
    server.listen(port, () => {
      const addr = server.address();
      const boundPort = typeof addr === "object" && addr ? addr.port : port;
      resolve({ server, port: boundPort });
    });
  });
}

export const moduleName = "server" as const;
export const implemented = true;
