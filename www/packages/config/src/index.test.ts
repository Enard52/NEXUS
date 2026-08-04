import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig, parseDotEnv, Secret } from "./index.js";

describe("parseDotEnv", () => {
  it("parses KEY=VALUE, ignores comments/blank lines, strips quotes", () => {
    const parsed = parseDotEnv(["# comment", "", "A=1", 'B="two"', "C='three'"].join("\n"));
    expect(parsed).toEqual({ A: "1", B: "two", C: "three" });
  });
});

describe("Secret", () => {
  it("masks itself in string/JSON contexts but reveals on demand", () => {
    const s = new Secret("sk-live-123");
    expect(String(s)).toBe("[secret]");
    expect(JSON.stringify({ key: s })).toBe('{"key":"[secret]"}');
    expect(s.reveal()).toBe("sk-live-123");
    expect(s.isSet).toBe(true);
    expect(new Secret("").isSet).toBe(false);
  });
});

describe("loadConfig", () => {
  it("applies defaults when values are absent", () => {
    const cfg = loadConfig({ source: {} });
    expect(cfg.env).toBe("development");
    expect(cfg.logLevel).toBe("info");
    expect(cfg.serviceName).toBe("nexus-core");
    expect(cfg.heartbeatMs).toBe(15000);
    expect(cfg.ai.provider).toBe("openai");
  });

  it("reads and coerces provided values", () => {
    const cfg = loadConfig({
      source: {
        NODE_ENV: "production",
        LOG_LEVEL: "warn",
        NEXUS_HEARTBEAT_MS: "5000",
        OPENAI_API_KEY: "sk-x",
      },
    });
    expect(cfg.env).toBe("production");
    expect(cfg.logLevel).toBe("warn");
    expect(cfg.heartbeatMs).toBe(5000);
    expect(cfg.ai.openaiApiKey.reveal()).toBe("sk-x");
  });

  it("aggregates all validation problems into one ConfigError", () => {
    try {
      loadConfig({ source: { NODE_ENV: "staging", NEXUS_HEARTBEAT_MS: "-3" } });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).message).toContain("NODE_ENV");
      expect((err as ConfigError).message).toContain("NEXUS_HEARTBEAT_MS");
    }
  });

  it("returns a frozen object", () => {
    const cfg = loadConfig({ source: {} });
    expect(Object.isFrozen(cfg)).toBe(true);
  });
});
