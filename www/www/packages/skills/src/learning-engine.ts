/**
 * NEXUS AI — Skill Learning Engine
 *
 * The learning engine observes user interactions and detects repetitive
 * fine-tuning patterns. When a pattern recurs enough times (threshold),
 * it proposes saving it as a Skill — the user must consent before it
 * becomes active.
 *
 * What it detects:
 *  - Repeated parameter adjustments after a specific intent
 *    (e.g. "after movie mode, always dim to 20%")
 *  - Repeated follow-up actions to a base command
 *    (e.g. "after setting volume, always mute notifications")
 *
 * Design:
 *  - Stateless regarding time: patterns are keyed by (base intent + follow-up action)
 *  - No external dependencies; the engine is fully deterministic and testable
 *  - Respects user consent: never creates a Skill silently
 */

import { type CreateSkillInput, type SkillDefinition, type SkillStore } from "./skill-store.js";

// ── Observation Types ─────────────────────────────────────────────────────────

/** A single observed user interaction (what the user asked for). */
export interface Interaction {
  /** The intent name that was processed. */
  readonly intentName: string;
  /** The slot values of the intent. */
  readonly slots: Record<string, unknown>;
  /** Any follow-up adjustments the user made after the initial response. */
  readonly followUpActions?: readonly FollowUpAction[];
}

/** A follow-up action the user took after an initial intent was processed. */
export interface FollowUpAction {
  /** Action kind (e.g. "device.command", "pc.system.volume"). */
  readonly kind: string;
  /** Action parameters. */
  readonly params: Record<string, unknown>;
}

// ── Pattern Detection ─────────────────────────────────────────────────────────

/** Internal record of a detected pattern. */
interface PatternRecord {
  /** Stable key for this pattern. */
  readonly signature: string;
  /** The base intent that triggers this pattern. */
  readonly baseIntent: string;
  /** Slot values that are consistently present. */
  readonly baseSlots: Record<string, unknown>;
  /** The follow-up actions that consistently occur. */
  readonly followUpActions: readonly FollowUpAction[];
  /** How many times this pattern has been observed. */
  count: number;
  /** Whether we already proposed this as a Skill. */
  proposedSkillId?: string;
}

export interface LearningEngineOptions {
  /** Number of occurrences before a pattern is proposed (min 2, default 3). */
  readonly threshold?: number;
  /** Maximum patterns to track (prevents memory bloat, default 100). */
  readonly maxPatterns?: number;
}

/**
 * Observes user interactions and proposes Skills when patterns repeat.
 */
export class SkillLearningEngine {
  private readonly patterns = new Map<string, PatternRecord>();
  private readonly threshold: number;
  private readonly maxPatterns: number;
  private readonly store: SkillStore;

  constructor(store: SkillStore, options: LearningEngineOptions = {}) {
    this.store = store;
    this.threshold = Math.max(2, options.threshold ?? 3);
    this.maxPatterns = options.maxPatterns ?? 100;
  }

  /**
   * Record an interaction. If it has follow-up actions, the engine tracks
   * the (intent → follow-up) pattern. Returns a proposed Skill if threshold is met.
   */
  observe(interaction: Interaction): SkillDefinition | undefined {
    if (!interaction.followUpActions || interaction.followUpActions.length === 0) {
      return undefined;
    }

    const signature = this.computeSignature(interaction);
    let pattern = this.patterns.get(signature);

    if (!pattern) {
      // Enforce max patterns (evict oldest by lowest count)
      if (this.patterns.size >= this.maxPatterns) {
        this.evictLowest();
      }

      pattern = {
        signature,
        baseIntent: interaction.intentName,
        baseSlots: { ...interaction.slots },
        followUpActions: interaction.followUpActions,
        count: 0,
      };
      this.patterns.set(signature, pattern);
    }

    pattern.count += 1;

    // Check if threshold is met and we haven't already proposed
    if (pattern.count >= this.threshold && !pattern.proposedSkillId) {
      return this.proposeSkill(pattern);
    }

    // If already proposed but was rejected, re-propose with higher count
    if (pattern.proposedSkillId) {
      const existing = this.store.get(pattern.proposedSkillId);
      if (existing && existing.status === "rejected" && pattern.count >= this.threshold * 2) {
        // Re-propose only at double threshold after rejection
        this.store.incrementProposal(pattern.proposedSkillId);
        return existing;
      }
    }

    return undefined;
  }

  /** Get current pattern stats (for debugging/UI). */
  getPatterns(): readonly { signature: string; count: number; threshold: number }[] {
    return [...this.patterns.values()].map((p) => ({
      signature: p.signature,
      count: p.count,
      threshold: this.threshold,
    }));
  }

  /** Clear all observed patterns. */
  reset(): void {
    this.patterns.clear();
  }

  /** Number of tracked patterns. */
  get patternCount(): number {
    return this.patterns.size;
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private computeSignature(interaction: Interaction): string {
    const slotPart = Object.keys(interaction.slots)
      .sort()
      .map((k) => `${k}=${JSON.stringify(interaction.slots[k])}`)
      .join(",");

    const actionPart = interaction
      .followUpActions!.map((a) => {
        const params = Object.keys(a.params)
          .sort()
          .map((k) => `${k}=${JSON.stringify(a.params[k])}`)
          .join(",");
        return params ? `${a.kind}(${params})` : a.kind;
      })
      .join("+");

    return `${interaction.intentName}[${slotPart}]→${actionPart}`;
  }

  private proposeSkill(pattern: PatternRecord): SkillDefinition {
    const input: CreateSkillInput = {
      name: this.generateName(pattern),
      description: this.generateDescription(pattern),
      trigger: {
        intentPattern: pattern.baseIntent,
        slots: pattern.baseSlots,
      },
      actions: pattern.followUpActions.map((a) => ({
        kind: a.kind,
        params: { ...a.params },
      })),
      source: "learned",
    };

    const skill = this.store.propose(input);
    pattern.proposedSkillId = skill.id;
    return skill;
  }

  private generateName(pattern: PatternRecord): string {
    const actions = pattern.followUpActions
      .map((a) => a.kind.split(".").pop() ?? a.kind)
      .join(" + ");
    return `Auto: ${pattern.baseIntent} → ${actions}`;
  }

  private generateDescription(pattern: PatternRecord): string {
    const times = pattern.count;
    return (
      `Detected ${times} times: after "${pattern.baseIntent}", ` +
      `you always ${pattern.followUpActions.map((a) => a.kind).join(", ")}. ` +
      `This skill will auto-apply those adjustments.`
    );
  }

  private evictLowest(): void {
    let lowestKey: string | undefined;
    let lowestCount = Infinity;
    for (const [key, p] of this.patterns) {
      if (p.count < lowestCount) {
        lowestCount = p.count;
        lowestKey = key;
      }
    }
    if (lowestKey) this.patterns.delete(lowestKey);
  }
}

// ── Skill Executor ────────────────────────────────────────────────────────────

/**
 * Checks incoming intents against active skills and returns actions to execute.
 * This is the "auto-apply" component: when a matching skill exists, its actions
 * are returned so the pipeline can execute them alongside the normal response.
 */
export class SkillExecutor {
  private readonly store: SkillStore;

  constructor(store: SkillStore) {
    this.store = store;
  }

  /**
   * Given an intent + slots, find all matching active skills and return
   * the combined actions to auto-apply. Records activation for each.
   */
  execute(intentName: string, slots: Record<string, unknown> = {}): ExecutionResult {
    const matching = this.store.findMatching(intentName, slots);
    if (matching.length === 0) {
      return { applied: false, skills: [], actions: [] };
    }

    const allActions: import("./skill-store.js").SkillAction[] = [];
    const appliedSkills: SkillDefinition[] = [];

    for (const skill of matching) {
      this.store.recordActivation(skill.id);
      allActions.push(...skill.actions);
      appliedSkills.push(skill);
    }

    return {
      applied: true,
      skills: appliedSkills,
      actions: allActions,
    };
  }

  /**
   * Preview which skills would fire for a given intent (without activating).
   */
  preview(intentName: string, slots: Record<string, unknown> = {}): readonly SkillDefinition[] {
    return this.store.findMatching(intentName, slots);
  }
}

export interface ExecutionResult {
  /** Whether any skill was applied. */
  readonly applied: boolean;
  /** The skills that were applied. */
  readonly skills: readonly SkillDefinition[];
  /** Combined actions from all matching skills. */
  readonly actions: readonly import("./skill-store.js").SkillAction[];
}

// ── Consent Manager ───────────────────────────────────────────────────────────

/**
 * Manages the user consent flow for proposed skills.
 * Provides pending proposals and handles accept/reject decisions.
 */
export class SkillConsentManager {
  private readonly store: SkillStore;

  constructor(store: SkillStore) {
    this.store = store;
  }

  /** Get all skills pending user decision. */
  getPendingProposals(): readonly SkillDefinition[] {
    return this.store.list("proposed");
  }

  /** User accepts a proposed skill → it becomes active. */
  accept(skillId: string): boolean {
    return this.store.accept(skillId);
  }

  /** User rejects a proposed skill. */
  reject(skillId: string): boolean {
    return this.store.reject(skillId);
  }

  /** User dismisses all pending proposals. */
  dismissAll(): number {
    const pending = this.store.list("proposed");
    let count = 0;
    for (const skill of pending) {
      if (this.store.reject(skill.id)) count++;
    }
    return count;
  }

  /** Check if there are any pending proposals. */
  get hasPending(): boolean {
    return this.store.list("proposed").length > 0;
  }

  /** Number of pending proposals. */
  get pendingCount(): number {
    return this.store.list("proposed").length;
  }
}
