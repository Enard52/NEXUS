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
import { NexusCore } from "@nexus/core";
import { InMemoryUserMemory } from "@nexus/memory";
import { selectProvider } from "@nexus/ai";
import { SecurityEngine, RateLimiter, LoginLockout } from "@nexus/security";
import { RoutineEngine } from "@nexus/routines";
import { ConnectorStore } from "@nexus/connectors";
import { PluginRegistry, createHuePlugin, createTuyaPlugin } from "@nexus/plugins";
import { BillingService, SandboxPaymentProvider } from "@nexus/billing";
import { LegalService } from "@nexus/legal";
import { SupportService } from "@nexus/support";
import { PlatformService } from "@nexus/platform";
import type { AppConfig } from "@nexus/config";

export * from "./userdata.js";
export * from "./pages.js";
export * from "./app.js";
export * from "./oauth.js";

export interface NexusApp extends AppDeps {
  readonly handler: (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ) => void;
}

export interface NexusAppOptions {
  /** Durable backend. Defaults to in-memory (dev/test). */
  readonly store?: KeyValueStore;
  /** Durable memory backend. Defaults to in-memory. */
  readonly memory?: import("@nexus/memory").UserMemoryStore;
  /** Absolute path to built web assets for static hosting + downloads. */
  readonly staticRoot?: string;
  readonly config?: AppConfig;
  readonly support?: SupportService;
  readonly platform?: PlatformService;
}

/** Compose the whole server over a store — the single wiring point for every entrypoint. */
export function createNexusApp(opts: NexusAppOptions = {}): NexusApp {
  const store = opts.store ?? new InMemoryKeyValueStore();
  const rateLimiter = new RateLimiter({ maxRequests: 100, windowMs: 15 * 60 * 1000 });
  const lockout = new LoginLockout();
  const accounts = new AccountService({ store, rateLimiter, lockout, emailBlocklist: true });
  const userData = new UserDataStore(store);
  const oauth = buildOAuthRegistry();

  const memory = opts.memory ?? new InMemoryUserMemory();
  const provider = opts.config
    ? selectProvider({
        provider: opts.config.ai.provider,
        openaiApiKey: opts.config.ai.openaiApiKey.reveal(),
      })
    : selectProvider({ provider: "mock" as any });
  const security = new SecurityEngine(undefined, store);
  const routines = new RoutineEngine();
  const core = new NexusCore({ memory, provider, security, routines });

  const plugins = new PluginRegistry();
  plugins.register(createHuePlugin());
  plugins.register(createTuyaPlugin());
  const connectors = new ConnectorStore(plugins, core.devices);
  const billing = new BillingService(new SandboxPaymentProvider());
  const legal = new LegalService();
  const support = opts.support ?? new SupportService();
  const platform = opts.platform ?? new PlatformService();

  const handler = createRequestHandler({
    accounts,
    userData,
    staticRoot: opts.staticRoot,
    oauth,
    core,
    connectors,
    billing,
    legal,
    support,
    platform,
  });
  return {
    handler,
    accounts,
    userData,
    staticRoot: opts.staticRoot,
    oauth,
    core,
    connectors,
    billing,
    legal,
    support,
    platform,
  };
}

/** Open an HTTP server on the given port (0 = ephemeral, useful for tests). */
export function startServer(
  app: NexusApp,
  port: number,
): Promise<{ server: Server; port: number }> {
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
