/**
 * NEXUS AI — Beta Management & Launch Readiness
 *
 * Manages closed beta: tester cohorts, feature flags, feedback collection,
 * launch readiness checklist, and store submission tracking.
 *
 * "Uygulama mağazalarında yayında; gerçek ödeyen ilk kullanıcı kohortu
 * sorunsuz şekilde abone olup ürünü kullanabiliyor."
 */

// ── Beta Tester Management ────────────────────────────────────────────────────

export interface BetaTester {
  readonly userId: string;
  readonly email: string;
  readonly cohort: string;
  readonly joinedAt: string;
  readonly deviceBrands: readonly string[];
  readonly locale: string;
  readonly feedback: readonly BetaFeedback[];
}

export interface BetaFeedback {
  readonly id: string;
  readonly category: "bug" | "feature" | "usability" | "performance";
  readonly message: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly submittedAt: string;
  readonly resolved: boolean;
}

export interface FeatureFlag {
  readonly name: string;
  readonly enabled: boolean;
  /** If set, only these cohorts have access. Empty = all. */
  readonly cohorts: readonly string[];
}

export interface BetaManagerOptions {
  readonly now?: () => Date;
}

export class BetaManager {
  private readonly testers = new Map<string, BetaTester>();
  private readonly flags = new Map<string, FeatureFlag>();
  private readonly now: () => Date;
  private feedbackSeq = 0;

  constructor(options: BetaManagerOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  /** Register a beta tester in a cohort. */
  addTester(input: {
    userId: string;
    email: string;
    cohort: string;
    deviceBrands: readonly string[];
    locale: string;
  }): BetaTester {
    const tester: BetaTester = {
      ...input,
      joinedAt: this.now().toISOString(),
      feedback: [],
    };
    this.testers.set(input.userId, tester);
    return tester;
  }

  /** Submit feedback from a tester. */
  submitFeedback(
    userId: string,
    category: BetaFeedback["category"],
    message: string,
    severity: BetaFeedback["severity"] = "medium",
  ): BetaFeedback {
    const tester = this.testers.get(userId);
    if (!tester) throw new Error(`User ${userId} is not a beta tester.`);
    const fb: BetaFeedback = {
      id: `fb-${++this.feedbackSeq}`,
      category,
      message,
      severity,
      submittedAt: this.now().toISOString(),
      resolved: false,
    };
    const updated: BetaTester = { ...tester, feedback: [...tester.feedback, fb] };
    this.testers.set(userId, updated);
    return fb;
  }

  /** Resolve a feedback item. */
  resolveFeedback(userId: string, feedbackId: string): void {
    const tester = this.testers.get(userId);
    if (!tester) return;
    const updated: BetaTester = {
      ...tester,
      feedback: tester.feedback.map((f) => (f.id === feedbackId ? { ...f, resolved: true } : f)),
    };
    this.testers.set(userId, updated);
  }

  /** Register a feature flag. */
  setFlag(name: string, enabled: boolean, cohorts: readonly string[] = []): void {
    this.flags.set(name, { name, enabled, cohorts });
  }

  /** Check if a feature is enabled for a specific user. */
  isEnabled(flagName: string, userId: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.cohorts.length === 0) return true;
    const tester = this.testers.get(userId);
    return tester ? flag.cohorts.includes(tester.cohort) : false;
  }

  /** Get all testers in a cohort. */
  getCohort(cohort: string): readonly BetaTester[] {
    return [...this.testers.values()].filter((t) => t.cohort === cohort);
  }

  /** Get all unresolved critical/high feedback. */
  getBlockingFeedback(): readonly BetaFeedback[] {
    const all: BetaFeedback[] = [];
    for (const tester of this.testers.values()) {
      for (const fb of tester.feedback) {
        if (!fb.resolved && (fb.severity === "critical" || fb.severity === "high")) {
          all.push(fb);
        }
      }
    }
    return all;
  }

  /** Total testers count. */
  get testerCount(): number {
    return this.testers.size;
  }
}

// ── Launch Readiness Checklist ────────────────────────────────────────────────

export type ChecklistItemStatus = "pass" | "fail" | "pending" | "done";

export interface ChecklistItem {
  readonly id: string;
  readonly description: string;
  readonly status: ChecklistItemStatus;
  readonly phase?: string;
}

/**
 * Validates all prerequisites for public launch.
 * Each check corresponds to a ROADMAP bitiş kriteri.
 */
export class LaunchChecklist {
  private readonly items: ChecklistItem[] = [];

  constructor() {
    this.seedChecklist();
  }

  /** Update a check item's status. */
  setStatus(id: string, status: ChecklistItemStatus): void {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      (this.items as any)[idx] = { ...this.items[idx], status };
    }
  }

  /** Get all checklist items. */
  getAll(): readonly ChecklistItem[] {
    return [...this.items];
  }

  /** Check if all items pass. */
  isReady(): boolean {
    return this.items.every((i) => i.status === "pass");
  }

  /** Get blocking items (not passed). */
  getBlockers(): readonly ChecklistItem[] {
    return this.items.filter((i) => i.status !== "pass");
  }

  private seedChecklist(): void {
    this.items.push(
      { id: "core-tests", description: "All core tests passing", status: "done" },
      {
        id: "security-audit",
        description: "Security audit complete, no critical vulnerabilities",
        status: "pending",
      },
      { id: "legal-docs", description: "ToS and Privacy Policy accessible in-app", status: "done" },
      { id: "gdpr-compliance", description: "Data export/delete functional", status: "done" },
      { id: "billing-live", description: "Patreon billing operational", status: "pending" },
      { id: "ci-cd", description: "CI/CD pipeline deploying to production", status: "done" },
      { id: "monitoring", description: "Health monitoring and alerting active", status: "pending" },
      { id: "onboarding", description: "New user can complete onboarding flow", status: "done" },
      {
        id: "beta-feedback",
        description: "No unresolved critical feedback from beta",
        status: "pending",
      },
      {
        id: "store-submission",
        description: "App Store / Google Play approved",
        status: "pending",
      },
      { id: "cross-sync", description: "Cross-device sync working", status: "pending" },
    );
  }
}

// ── Store Submission Tracking ─────────────────────────────────────────────────

export type StoreId = "app_store" | "google_play";
export type SubmissionStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected";

export interface StoreSubmission {
  readonly store: StoreId;
  readonly version: string;
  readonly status: SubmissionStatus;
  readonly submittedAt?: string;
  readonly reviewedAt?: string;
  readonly notes?: string;
}

export class StoreSubmissionTracker {
  private readonly submissions = new Map<StoreId, StoreSubmission>();

  submit(store: StoreId, version: string): StoreSubmission {
    const submission: StoreSubmission = {
      store,
      version,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };
    this.submissions.set(store, submission);
    return submission;
  }

  updateStatus(
    store: StoreId,
    status: SubmissionStatus,
    notes?: string,
  ): StoreSubmission | undefined {
    const current = this.submissions.get(store);
    if (!current) return undefined;
    const updated: StoreSubmission = {
      ...current,
      status,
      reviewedAt: new Date().toISOString(),
      notes,
    };
    this.submissions.set(store, updated);
    return updated;
  }

  get(store: StoreId): StoreSubmission | undefined {
    return this.submissions.get(store);
  }

  allApproved(): boolean {
    if (this.submissions.size === 0) return false;
    return [...this.submissions.values()].every((s) => s.status === "approved");
  }
}
