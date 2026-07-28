/**
 * NEXUS AI — Core runtime
 *
 * scope: boot the service, wire configuration + logging, run a heartbeat,
 * and shut down gracefully. The intent → agent → plan pipeline arrives in ;
 * this file only proves the process comes up and stays observable.
 */

import { loadConfig, type AppConfig } from "@nexus/config";
import { createLogger, type Logger } from "@nexus/logger";

export * from "./pipeline.js";

export interface CoreService {
  readonly config: AppConfig;
  readonly logger: Logger;
  /** Resolves once the service has stopped (heartbeat cleared, shutdown logged). */
  stop(): Promise<void>;
}

export interface StartOptions {
  /** Override the loaded config (tests). */
  config?: AppConfig;
  /** Override the logger (tests). */
  logger?: Logger;
}

/**
 * Boot the core service. Returns a handle exposing config, logger and stop().
 * The heartbeat is disabled when `heartbeatMs` is 0 (e.g. in tests).
 */
export function startCore(options: StartOptions = {}): CoreService {
  const config = options.config ?? loadConfig();
  const logger =
    options.logger ??
    createLogger({
      name: config.serviceName,
      level: config.logLevel,
      base: { env: config.env, aiProvider: config.ai.provider },
    });

  logger.info("NEXUS core starting", {
    version: "0.0.0",
    phase: "",
    heartbeatMs: config.heartbeatMs,
  });

  if (!config.ai.openaiApiKey.isSet) {
    logger.warn("OPENAI_API_KEY is not set — AI Adapter stays inert until wiring");
  }

  let ticks = 0;
  let timer: NodeJS.Timeout | undefined;
  if (config.heartbeatMs > 0) {
    timer = setInterval(() => {
      ticks += 1;
      logger.debug("heartbeat", { tick: ticks, uptimeSec: Math.round(process.uptime()) });
    }, config.heartbeatMs);
    // Do not keep the event loop alive solely for the heartbeat.
    timer.unref?.();
  }

  logger.info("NEXUS core ready");

  let stopped = false;
  return {
    config,
    logger,
    async stop(): Promise<void> {
      if (stopped) return;
      stopped = true;
      if (timer) clearInterval(timer);
      logger.info("NEXUS core stopped", { ticks });
    },
  };
}
