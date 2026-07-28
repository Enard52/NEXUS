/**
 * NEXUS AI — Skill Data Model & Store
 *
 * A "Skill" in NEXUS is a learned micro-automation: the system detects that
 * the user repeats a specific fine-tuning pattern (e.g. "every time I say
 * 'movie mode', also dim lights to 20%") and proposes saving it. Once
 * accepted, the Skill auto-applies on future matching requests.
 *
 * Key design principles:
 *  - User consent: no Skill is created silently; always proposed first
 *  - Pattern-based: triggered by matching intent + slot patterns
 *  - Composable: a Skill's actions are SceneAction-compatible
 *  - Auditable: every activation is counted + timestamped
 */

// ── Skill Definition ──────────────────────────────────────────────────────────

/** A single action a Skill performs when triggered. */
export interface SkillAction {
  /** Action kind identifier (e.g. "device.command", "pc.system.volume"). */
  readonly kind: string;
  /** Parameters for the action. */
  readonly params: Record<string, unknown>;
}

/**
 * The trigger pattern that activates a Skill.
 * Matches when the user's intent name matches AND all required slot values
 * are present. If `slots` is empty, matches on intent name alone.
 */
export interface SkillTrigger {
  /** Intent name pattern (exact match or prefix with wildcard, e.g. "scene.movie*"). */
  readonly intentPattern: string;
  /** Slot values that must be present for the trigger to fire. */
  readonly slots: Record<string, unknown>;
}

/** Status of a Skill in its lifecycle. */
export type SkillStatus = "proposed" | "active" | "paused" | "rejected";

/** Complete Skill definition. */
export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  /** Human-readable description of what this skill does. */
  readonly description: string;
  /** The trigger pattern that activates this skill. */
  readonly trigger: SkillTrigger;
  /** Actions to execute when triggered. */
  readonly actions: readonly SkillAction[];
  /** Current lifecycle status. */
  status: SkillStatus;
  /** How many times this skill has been proposed before acceptance. */
  proposalCount: number;
  /** How many times this skill has been auto-applied. */
  activationCount: number;
  /** ISO timestamp of creation. */
  readonly createdAt: string;
  /** ISO timestamp of last activation (if any). */
  lastActivatedAt?: string;
  /** Source: "learned" (auto-detected) or "manual" (user-created). */
  readonly source: "learned" | "manual";
}

// ── Skill Store ───────────────────────────────────────────────────────────────

/** Input for creating a new Skill. */
export interface CreateSkillInput {
  readonly name: string;
  readonly description: string;
  readonly trigger: SkillTrigger;
  readonly actions: readonly SkillAction[];
  readonly source?: "learned" | "manual";
}

/** Events emitted by the SkillStore. */
export type SkillEvent =
  | { type: "proposed"; skill: SkillDefinition }
  | { type: "accepted"; skill: SkillDefinition }
  | { type: "rejected"; skillId: string }
  | { type: "paused"; skillId: string }
  | { type: "resumed"; skillId: string }
  | { type: "deleted"; skillId: string }
  | { type: "activated"; skill: SkillDefinition };

export type SkillEventListener = (event: SkillEvent) => void;

let nextId = 1;
function generateId(): string {
  return `skill_${Date.now()}_${nextId++}`;
}

/**
 * In-memory Skill store with full lifecycle management.
 * Provides CRUD + state transitions + event emission.
 */
export class SkillStore {
  private readonly skills = new Map<string, SkillDefinition>();
  private readonly listeners = new Set<SkillEventListener>();

  // ── Query ─────────────────────────────────────────────────────────────────

  /** Get a skill by ID. */
  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  /** List all skills, optionally filtered by status. */
  list(status?: SkillStatus): readonly SkillDefinition[] {
    const all = [...this.skills.values()];
    return status ? all.filter((s) => s.status === status) : all;
  }

  /** Find active skills whose trigger matches the given intent + slots. */
  findMatching(
    intentName: string,
    slots: Record<string, unknown> = {},
  ): readonly SkillDefinition[] {
    return this.list("active").filter((skill) => {
      // Check intent pattern match
      if (!matchesPattern(skill.trigger.intentPattern, intentName)) return false;
      // Check slot match
      return matchesSlots(skill.trigger.slots, slots);
    });
  }

  /** Total number of stored skills. */
  get size(): number {
    return this.skills.size;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Propose a new skill (status = "proposed"). */
  propose(input: CreateSkillInput): SkillDefinition {
    const skill: SkillDefinition = {
      id: generateId(),
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      actions: input.actions,
      status: "proposed",
      proposalCount: 1,
      activationCount: 0,
      createdAt: new Date().toISOString(),
      source: input.source ?? "learned",
    };
    this.skills.set(skill.id, skill);
    this.emit({ type: "proposed", skill });
    return skill;
  }

  /** Create a skill directly as active (for manual/user-created skills). */
  create(input: CreateSkillInput): SkillDefinition {
    const skill: SkillDefinition = {
      id: generateId(),
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      actions: input.actions,
      status: "active",
      proposalCount: 0,
      activationCount: 0,
      createdAt: new Date().toISOString(),
      source: input.source ?? "manual",
    };
    this.skills.set(skill.id, skill);
    this.emit({ type: "accepted", skill });
    return skill;
  }

  /** Accept a proposed skill → active. */
  accept(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "proposed") return false;
    skill.status = "active";
    this.emit({ type: "accepted", skill });
    return true;
  }

  /** Reject a proposed skill. */
  reject(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "proposed") return false;
    skill.status = "rejected";
    this.emit({ type: "rejected", skillId: id });
    return true;
  }

  /** Pause an active skill (stops auto-apply without deleting). */
  pause(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "active") return false;
    skill.status = "paused";
    this.emit({ type: "paused", skillId: id });
    return true;
  }

  /** Resume a paused skill. */
  resume(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "paused") return false;
    skill.status = "active";
    this.emit({ type: "resumed", skillId: id });
    return true;
  }

  /** Delete a skill permanently. */
  delete(id: string): boolean {
    if (!this.skills.has(id)) return false;
    this.skills.delete(id);
    this.emit({ type: "deleted", skillId: id });
    return true;
  }

  /** Record that a skill was auto-applied. */
  recordActivation(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "active") return false;
    skill.activationCount += 1;
    skill.lastActivatedAt = new Date().toISOString();
    this.emit({ type: "activated", skill });
    return true;
  }

  /** Increment proposal count (when re-proposing an already-proposed skill). */
  incrementProposal(id: string): void {
    const skill = this.skills.get(id);
    if (skill) skill.proposalCount += 1;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  on(listener: SkillEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SkillEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

// ── Pattern Matching Utilities ────────────────────────────────────────────────

/** Match an intent name against a pattern (supports trailing wildcard "*"). */
export function matchesPattern(pattern: string, intentName: string): boolean {
  if (pattern.endsWith("*")) {
    return intentName.startsWith(pattern.slice(0, -1));
  }
  return pattern === intentName;
}

/** Check if all required slot values are present in the actual slots. */
export function matchesSlots(
  required: Record<string, unknown>,
  actual: Record<string, unknown>,
): boolean {
  for (const [key, value] of Object.entries(required)) {
    if (actual[key] !== value) return false;
  }
  return true;
}

/** Reset internal ID counter (for testing). */
export function __resetIdCounter(): void {
  nextId = 1;
}
