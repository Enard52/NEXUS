/**
 * NEXUS AI — Security policy primitives (FAZ 1).
 *
 * Leaf module holding the risk model and default policy so that both the
 * SecurityEngine (index.ts) and the SecurityMiddleware (middleware.ts) can
 * depend on these runtime values without forming an import cycle. Keeping them
 * here means `DEFAULT_POLICY` is always fully initialized before either
 * consumer's module body runs, regardless of entry order.
 */

/** Ordered from least to most dangerous; numeric values allow comparison. */
export enum RiskLevel {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export type SecurityDecision = "allow" | "confirm" | "deny";

export interface SecurityAction {
  /** Stable identifier, e.g. "device.light.toggle" or "fs.delete". */
  readonly kind: string;
  /** Assessed risk of performing the action. */
  readonly risk: RiskLevel;
  /** Optional human-readable context for the audit trail. */
  readonly description?: string;
}

export interface SecurityPolicy {
  /** At or above this level the action needs explicit user confirmation. */
  readonly confirmAtOrAbove: RiskLevel;
  /** At or above this level the action is denied outright. */
  readonly denyAtOrAbove: RiskLevel;
}

export const DEFAULT_POLICY: SecurityPolicy = {
  confirmAtOrAbove: RiskLevel.Medium,
  denyAtOrAbove: RiskLevel.Critical + 1, // nothing auto-denied in v0
};
