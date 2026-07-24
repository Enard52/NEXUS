import { describe, expect, it } from "vitest";
import { RiskLevel, SecurityMiddleware } from "@nexus/security";
import {
  implemented,
  MockPlatformAgent,
  moduleName,
  PlatformError,
  riskOf,
  toSecurityAction,
  UnconfiguredPlatformAgent,
} from "./index.js";

describe("MockPlatformAgent app & system control (FAZ 3)", () => {
  it("opens and closes apps", () => {
    const pc = new MockPlatformAgent("macos");
    expect(pc.run({ action: "app.open", target: "Notes" }).ok).toBe(true);
    expect(pc.isRunning("Notes")).toBe(true);
    expect(pc.run({ action: "app.close", target: "Notes" }).ok).toBe(true);
    expect(pc.isRunning("Notes")).toBe(false);
  });

  it("reads, writes and deletes files in the virtual FS", () => {
    const pc = new MockPlatformAgent("macos", { "/notes.txt": "hello" });
    expect(pc.run({ action: "file.read", target: "/notes.txt" }).data).toBe("hello");
    pc.run({ action: "file.write", target: "/notes.txt", value: "world" });
    expect(pc.run({ action: "file.read", target: "/notes.txt" }).data).toBe("world");
    expect(pc.run({ action: "file.delete", target: "/notes.txt" }).ok).toBe(true);
    expect(pc.run({ action: "file.read", target: "/notes.txt" }).ok).toBe(false);
  });

  it("validates the volume range and tracks sleep", () => {
    const pc = new MockPlatformAgent();
    expect(pc.run({ action: "system.volume", value: 150 }).ok).toBe(false);
    expect(pc.run({ action: "system.volume", value: 20 }).ok).toBe(true);
    expect(pc.readVolume()).toBe(20);
    pc.run({ action: "system.sleep" });
    expect(pc.isAsleep()).toBe(true);
  });

  it("requires a target for targeted actions", () => {
    const pc = new MockPlatformAgent();
    expect(() => pc.run({ action: "file.read" })).toThrow(PlatformError);
  });
});

describe("risk model & security routing (FAZ 3 x 11)", () => {
  it("assigns higher risk to destructive actions", () => {
    expect(riskOf("file.read")).toBe(RiskLevel.Low);
    expect(riskOf("file.write")).toBe(RiskLevel.Medium);
    expect(riskOf("system.sleep")).toBe(RiskLevel.High);
    expect(riskOf("file.delete")).toBe(RiskLevel.Critical);
  });

  it("holds a risky delete until it is explicitly approved", () => {
    const pc = new MockPlatformAgent("macos", { "/secret.txt": "x" });
    const mw = new SecurityMiddleware();
    const command = { action: "file.delete", target: "/secret.txt" } as const;

    const held = mw.guard(toSecurityAction(command), () => pc.run(command));
    expect(held.status).toBe("pending");
    // Nothing deleted while pending.
    expect(pc.run({ action: "file.read", target: "/secret.txt" }).ok).toBe(true);

    const result = mw.approve(held.approval!.token, () => pc.run(command));
    expect(result.ok).toBe(true);
    expect(pc.run({ action: "file.read", target: "/secret.txt" }).ok).toBe(false);
  });

  it("auto-runs a low-risk read through the middleware", () => {
    const pc = new MockPlatformAgent("macos", { "/a.txt": "hi" });
    const mw = new SecurityMiddleware();
    const command = { action: "file.read", target: "/a.txt" } as const;
    const res = mw.guard(toSecurityAction(command), () => pc.run(command));
    expect(res.status).toBe("executed");
    expect(res.value?.data).toBe("hi");
  });
});

describe("cross-OS parity via the PAL (FAZ 8)", () => {
  it("runs the identical command sequence unchanged on macOS, Windows and Linux", () => {
    const script = [
      { action: "app.open", target: "Browser" },
      { action: "file.write", target: "/log.txt", value: "ok" },
      { action: "file.read", target: "/log.txt" },
    ] as const;

    for (const os of ["macos", "windows", "linux"] as const) {
      const pc = new MockPlatformAgent(os);
      const results = script.map((c) => pc.run(c));
      expect(results.every((r) => r.ok)).toBe(true);
      expect(results[2]!.data).toBe("ok");
      expect(pc.os).toBe(os);
    }
  });
});

describe("never-fake-success for a real OS (FAZ 3, rule #8)", () => {
  it("throws instead of pretending to control an unwired OS", () => {
    const real = new UnconfiguredPlatformAgent("windows");
    expect(() => real.run({ action: "app.open", target: "Explorer" })).toThrow(/not wired/);
  });
});

describe("@nexus/platform module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("platform");
    expect(implemented).toBe(true);
  });
});
