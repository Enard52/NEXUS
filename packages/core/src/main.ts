/**
 * NEXUS AI — Core entrypoint (FAZ 0)
 *
 * Boots the core service and keeps the process alive until it receives a
 * termination signal, then shuts down gracefully.
 */

import { startCore } from "./index.js";

const service = startCore();

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  service.logger.info("shutdown signal received", { signal });
  await service.stop();
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

process.on("uncaughtException", (err) => {
  service.logger.fatal("uncaught exception", { err });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  service.logger.fatal("unhandled rejection", { reason: String(reason) });
  process.exit(1);
});

// Keep the process alive; the heartbeat timer is unref'd, so hold the loop open.
setInterval(() => {}, 1 << 30);
