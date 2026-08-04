import { describe, expect, it } from "vitest";
import { RiskLevel, type SecurityAction } from "./index.js";
import { SecurityMiddleware } from "./middleware.js";

const lowAction: SecurityAction = { kind: "device.status.read", risk: RiskLevel.Low };
const riskyAction: SecurityAction = { kind: "device.light.set", risk: RiskLevel.Medium };

describe("SecurityMiddleware guard (FAZ 11)", () => {
  it("auto-runs low-risk actions", () => {
    const mw = new SecurityMiddleware();
    const result = mw.guard(lowAction, () => 42);
    expect(result.status).toBe("executed");
    expect(result.value).toBe(42);
  });

  it("holds a risky action until it is explicitly approved", () => {
    const mw = new SecurityMiddleware();
    let ran = false;
    const held = mw.guard(riskyAction, () => {
      ran = true;
      return "done";
    });
    expect(held.status).toBe("pending");
    expect(ran).toBe(false);
    expect(mw.pendingCount()).toBe(1);

    const value = mw.approve(held.approval!.token, () => {
      ran = true;
      return "done";
    });
    expect(value).toBe("done");
    expect(ran).toBe(true);
    expect(mw.pendingCount()).toBe(0);
  });

  it("never runs a denied action", () => {
    const mw = new SecurityMiddleware({
      confirmAtOrAbove: RiskLevel.Medium,
      denyAtOrAbove: RiskLevel.High,
    });
    let ran = false;
    const result = mw.guard({ kind: "fs.delete", risk: RiskLevel.Critical }, () => {
      ran = true;
    });
    expect(result.status).toBe("denied");
    expect(ran).toBe(false);
  });

  it("applies per-action-kind risk overrides from the policy config", () => {
    const mw = new SecurityMiddleware({
      confirmAtOrAbove: RiskLevel.Medium,
      denyAtOrAbove: RiskLevel.Critical + 1,
      riskOverrides: { "device.status.read": RiskLevel.High },
    });
    // The normally-low read is elevated and now requires confirmation.
    expect(mw.guard(lowAction, () => 1).status).toBe("pending");
  });
});

describe("immutable audit log (FAZ 11)", () => {
  it("records every decision and verifies its hash chain", () => {
    const mw = new SecurityMiddleware();
    mw.guard(lowAction, () => 1);
    const held = mw.guard(riskyAction, () => 2);
    mw.reject(held.approval!.token);

    const log = mw.auditLog();
    expect(log.length).toBeGreaterThanOrEqual(4);
    expect(log[0]!.prevHash).toBe("genesis");
    expect(mw.verifyAuditIntegrity()).toBe(true);
  });

  it("freezes entries so a returned reference cannot be tampered with", () => {
    const mw = new SecurityMiddleware();
    mw.guard(lowAction, () => 1);
    const log = mw.auditLog();
    // Entries are frozen: any attempt to mutate them throws, and the source
    // audit trail stays verifiable.
    expect(() => {
      (log[0] as { detail: string }).detail = "hacked";
    }).toThrow(TypeError);
    expect(mw.verifyAuditIntegrity()).toBe(true);
  });
});
