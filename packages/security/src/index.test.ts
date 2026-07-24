import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY, RiskLevel, SecurityEngine, type SecurityPolicy } from "./index.js";

describe("SecurityEngine (v0)", () => {
  it("allows low-risk actions under the default policy", () => {
    const engine = new SecurityEngine();
    const e = engine.evaluate({ kind: "device.light.toggle", risk: RiskLevel.Low });
    expect(e.decision).toBe("allow");
  });

  it("requires confirmation at or above the confirm threshold", () => {
    const engine = new SecurityEngine();
    expect(engine.evaluate({ kind: "fs.move", risk: RiskLevel.Medium }).decision).toBe("confirm");
    expect(engine.evaluate({ kind: "fs.delete", risk: RiskLevel.High }).decision).toBe("confirm");
  });

  it("denies when a deny threshold is configured", () => {
    const strict: SecurityPolicy = {
      confirmAtOrAbove: RiskLevel.Low,
      denyAtOrAbove: RiskLevel.High,
    };
    const engine = new SecurityEngine(strict);
    expect(engine.evaluate({ kind: "system.wipe", risk: RiskLevel.Critical }).decision).toBe(
      "deny",
    );
  });

  it("records every decision in the audit log", () => {
    const engine = new SecurityEngine();
    engine.evaluate({ kind: "a", risk: RiskLevel.None });
    engine.evaluate({ kind: "b", risk: RiskLevel.High });
    const log = engine.auditLog();
    expect(log).toHaveLength(2);
    expect(log[0]!.at).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("does not auto-deny anything under the default v0 policy", () => {
    expect(DEFAULT_POLICY.denyAtOrAbove).toBeGreaterThan(RiskLevel.Critical);
  });
});
