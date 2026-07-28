/**
 * NEXUS AI — Security Engine
 *
 * The single decision point every risky action must pass through.
 * Ships the risk-level model, threshold-based policy, mandatory middleware,
 * and immutable audit logging.
 */

// Runtime policy primitives live in a leaf module so the SecurityEngine here
// and the SecurityMiddleware (which re-enters this file via `export *`) can both
// depend on DEFAULT_POLICY without an init-time import cycle. Re-exported below
// so external consumers keep importing them from "@nexus/security" unchanged.
import {
  DEFAULT_POLICY,
  RiskLevel,
  type SecurityAction,
  type SecurityDecision,
  type SecurityPolicy,
} from "./policy.js";
export * from "./policy.js";
import type { KeyValueStore } from "@nexus/database";

export interface SecurityEvaluation {
  readonly action: SecurityAction;
  readonly decision: SecurityDecision;
  readonly reason: string;
  readonly at: string;
}

export class SecurityEngine {
  private readonly policy: SecurityPolicy;
  private readonly store?: KeyValueStore;
  private readonly audit: SecurityEvaluation[] = [];
  private static readonly AUDIT_KEY = "security:audit_log";

  constructor(policy: SecurityPolicy = DEFAULT_POLICY, store?: KeyValueStore) {
    this.policy = policy;
    this.store = store;
    if (this.store) {
      const saved = this.store.get(SecurityEngine.AUDIT_KEY);
      if (saved) {
        try {
          this.audit = JSON.parse(saved);
        } catch (e) {
          // ignore invalid JSON
        }
      }
    }
  }

  /** Evaluate a single action against the policy and record the decision. */
  evaluate(action: SecurityAction): SecurityEvaluation {
    let decision: SecurityDecision;
    let reason: string;

    if (action.risk >= this.policy.denyAtOrAbove) {
      decision = "deny";
      reason = `risk ${RiskLevel[action.risk]} >= deny threshold`;
    } else if (action.risk >= this.policy.confirmAtOrAbove) {
      decision = "confirm";
      reason = `risk ${RiskLevel[action.risk]} >= confirm threshold`;
    } else {
      decision = "allow";
      reason = `risk ${RiskLevel[action.risk]} below confirm threshold`;
    }

    const evaluation: SecurityEvaluation = {
      action,
      decision,
      reason,
      at: new Date().toISOString(),
    };
    this.audit.push(evaluation);

    if (this.store) {
      this.store.set(SecurityEngine.AUDIT_KEY, JSON.stringify(this.audit));
    }

    return evaluation;
  }

  /** Read-only view of every decision made so far. */
  auditLog(): readonly SecurityEvaluation[] {
    return [...this.audit];
  }
}

export * from "./middleware.js";
export * from "./rate-limit.js";
export * from "./email-blocklist.js";

export const moduleName = "security" as const;
export const implemented = true;
