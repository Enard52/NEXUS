/**
 * NEXUS AI — Security Middleware (FAZ 11)
 *
 * Turns the FAZ 1 risk model into the mandatory gate every action passes
 * through. Nothing risky executes without going through `guard`:
 *   - allow  → run immediately
 *   - confirm → held as a pending approval; runs only after explicit approve()
 *   - deny   → refused, never runs
 *
 * A policy config can override risk per action-kind (the "policy file"). Every
 * decision and execution is written to an append-only, hash-chained audit log
 * so tampering is detectable (immutable logging). Dependency-free except for the
 * platform crypto used to chain log entries.
 */

import { createHash } from "node:crypto";
import { RiskLevel, SecurityEngine, type SecurityAction } from "./index.js";

export interface PolicyConfig {
  readonly confirmAtOrAbove: RiskLevel;
  readonly denyAtOrAbove: RiskLevel;
  /** Force a specific risk level for a given action kind. */
  readonly riskOverrides?: Readonly<Record<string, RiskLevel>>;
}

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  confirmAtOrAbove: RiskLevel.Medium,
  denyAtOrAbove: RiskLevel.Critical + 1,
  riskOverrides: {},
};

export type AuditKind = "decision" | "executed" | "approved" | "rejected" | "denied";

export interface AuditEntry {
  readonly seq: number;
  readonly kind: AuditKind;
  readonly action: string;
  readonly detail: string;
  readonly at: string;
  /** Hash of this entry chained with the previous one's hash. */
  readonly hash: string;
  readonly prevHash: string;
}

export interface PendingApproval {
  readonly token: string;
  readonly action: SecurityAction;
}

export interface GuardResult<T> {
  readonly status: "executed" | "pending" | "denied";
  readonly value?: T;
  readonly approval?: PendingApproval;
  readonly reason: string;
}

/** Append-only audit log with a simple hash chain for tamper evidence. */
class AuditTrail {
  private readonly entries: AuditEntry[] = [];

  append(kind: AuditKind, action: string, detail: string): AuditEntry {
    const seq = this.entries.length;
    const prevHash = seq === 0 ? "genesis" : this.entries[seq - 1]!.hash;
    const at = new Date().toISOString();
    const hash = createHash("sha256")
      .update(`${seq}|${kind}|${action}|${detail}|${at}|${prevHash}`)
      .digest("hex");
    const entry: AuditEntry = Object.freeze({ seq, kind, action, detail, at, hash, prevHash });
    this.entries.push(entry);
    return entry;
  }

  list(): readonly AuditEntry[] {
    return [...this.entries];
  }

  /** Recompute the chain and confirm no entry was altered or reordered. */
  verifyIntegrity(): boolean {
    let prevHash = "genesis";
    for (const e of this.entries) {
      const expected = createHash("sha256")
        .update(`${e.seq}|${e.kind}|${e.action}|${e.detail}|${e.at}|${prevHash}`)
        .digest("hex");
      if (expected !== e.hash || e.prevHash !== prevHash) return false;
      prevHash = e.hash;
    }
    return true;
  }
}

export class SecurityMiddleware {
  private readonly engine: SecurityEngine;
  private readonly overrides: Readonly<Record<string, RiskLevel>>;
  private readonly trail = new AuditTrail();
  private readonly pending = new Map<string, SecurityAction>();
  private tokenSeq = 0;

  constructor(config: PolicyConfig = DEFAULT_POLICY_CONFIG) {
    this.engine = new SecurityEngine({
      confirmAtOrAbove: config.confirmAtOrAbove,
      denyAtOrAbove: config.denyAtOrAbove,
    });
    this.overrides = config.riskOverrides ?? {};
  }

  private effectiveAction(action: SecurityAction): SecurityAction {
    const override = this.overrides[action.kind];
    return override === undefined ? action : { ...action, risk: override };
  }

  /** The single entry point for performing any action. */
  guard<T>(action: SecurityAction, execute: () => T): GuardResult<T> {
    const effective = this.effectiveAction(action);
    const evalResult = this.engine.evaluate(effective);
    this.trail.append("decision", effective.kind, evalResult.reason);

    if (evalResult.decision === "deny") {
      this.trail.append("denied", effective.kind, "policy deny");
      return { status: "denied", reason: evalResult.reason };
    }
    if (evalResult.decision === "confirm") {
      const token = `apr_${++this.tokenSeq}`;
      this.pending.set(token, effective);
      return {
        status: "pending",
        approval: { token, action: effective },
        reason: evalResult.reason,
      };
    }
    const value = execute();
    this.trail.append("executed", effective.kind, "auto-allowed");
    return { status: "executed", value, reason: evalResult.reason };
  }

  /** Approve a held action and run it. */
  approve<T>(token: string, execute: () => T): T {
    const action = this.pending.get(token);
    if (!action) throw new Error(`Unknown or already-resolved approval ${token}`);
    this.pending.delete(token);
    const value = execute();
    this.trail.append("approved", action.kind, `approved via ${token}`);
    return value;
  }

  reject(token: string): void {
    const action = this.pending.get(token);
    if (!action) throw new Error(`Unknown or already-resolved approval ${token}`);
    this.pending.delete(token);
    this.trail.append("rejected", action.kind, `rejected via ${token}`);
  }

  pendingCount(): number {
    return this.pending.size;
  }

  auditLog(): readonly AuditEntry[] {
    return this.trail.list();
  }

  verifyAuditIntegrity(): boolean {
    return this.trail.verifyIntegrity();
  }
}
