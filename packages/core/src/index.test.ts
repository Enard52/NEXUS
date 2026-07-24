import { describe, expect, it } from "vitest";
import { loadConfig } from "@nexus/config";
import { createLogger, type LogLevel } from "@nexus/logger";
import { startCore } from "./index.js";

function testLogger() {
  const lines: string[] = [];
  const logger = createLogger({
    name: "core-test",
    level: "trace" as LogLevel,
    pretty: false,
    sink: (_l, line) => lines.push(line),
  });
  return { logger, lines };
}

describe("startCore", () => {
  it("boots, exposes config/logger, and logs readiness", async () => {
    const { logger, lines } = testLogger();
    const config = loadConfig({ source: { NEXUS_HEARTBEAT_MS: "0" } });
    const svc = startCore({ config, logger });

    expect(svc.config.serviceName).toBe("nexus-core");
    expect(lines.some((l) => l.includes("NEXUS core starting"))).toBe(true);
    expect(lines.some((l) => l.includes("NEXUS core ready"))).toBe(true);

    await svc.stop();
    expect(lines.some((l) => l.includes("NEXUS core stopped"))).toBe(true);
  });

  it("stop() is idempotent", async () => {
    const { logger } = testLogger();
    const config = loadConfig({ source: { NEXUS_HEARTBEAT_MS: "0" } });
    const svc = startCore({ config, logger });
    await svc.stop();
    await expect(svc.stop()).resolves.toBeUndefined();
  });

  it("warns when the OpenAI key is missing", () => {
    const { logger, lines } = testLogger();
    const config = loadConfig({ source: { NEXUS_HEARTBEAT_MS: "0", OPENAI_API_KEY: "" } });
    startCore({ config, logger });
    expect(lines.some((l) => l.includes("OPENAI_API_KEY is not set"))).toBe(true);
  });
});
