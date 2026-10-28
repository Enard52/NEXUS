import { describe, expect, it, vi } from "vitest";
import { createLogger, type LogLevel } from "./index.js";

function capture(level: LogLevel = "trace") {
  const lines: string[] = [];
  const logger = createLogger({
    name: "test",
    level,
    pretty: false,
    sink: (_lvl, line) => lines.push(line),
  });
  return { logger, lines };
}

describe("Logger", () => {
  it("emits a JSON record with name, level and message", () => {
    const { logger, lines } = capture();
    logger.info("hello", { userId: 42 });
    expect(lines).toHaveLength(1);
    const rec = JSON.parse(lines[0]!);
    expect(rec).toMatchObject({ name: "test", level: "info", msg: "hello", userId: 42 });
  });

  it("respects the minimum level", () => {
    const { logger, lines } = capture("warn");
    logger.info("skipped");
    logger.warn("kept");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!).msg).toBe("kept");
  });

  it("redacts sensitive fields", () => {
    const { logger, lines } = capture();
    logger.info("auth", { apiKey: "sk-secret", nested: { password: "p" }, ok: "visible" });
    const rec = JSON.parse(lines[0]!);
    expect(rec.apiKey).toBe("[REDACTED]");
    expect(rec.nested.password).toBe("[REDACTED]");
    expect(rec.ok).toBe("visible");
  });

  it("routes errors/fatals to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createLogger({ name: "t", pretty: false });
    logger.error("boom");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("child loggers namespace and merge base fields", () => {
    const { logger, lines } = capture();
    logger.child("sub", { requestId: "r1" }).info("msg");
    const rec = JSON.parse(lines[0]!);
    expect(rec.name).toBe("test:sub");
    expect(rec.requestId).toBe("r1");
  });
});
