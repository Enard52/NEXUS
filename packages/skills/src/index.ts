/**
 * NEXUS AI — Skill System (FAZ 5)
 *
 * Experience memory + automatic Skill formation. The system records the actions
 * a user performs, detects repeated patterns, and *proposes* turning them into a
 * named Skill. Nothing is saved without explicit user approval (roadmap intent:
 * "kullanıcı onayıyla"). Once saved, a Skill can be matched by trigger and
 * auto-applied on later requests.
 *
 * Dependency-free and deterministic so it is fully testable in dev mode.
 */

export interface SkillAction {
  /** Stable action id, e.g. "device.light.set". */
  readonly kind: string;
  /** Parameters for the action, e.g. { device: "light", brightness: "30" }. */
  readonly params: Record<string, string>;
}

export interface Skill {
  readonly id: string;
  readonly name: string;
  /** Phrase/intent that triggers this skill, normalized lower-case. */
  readonly trigger: string;
  readonly actions: readonly SkillAction[];
}

export interface SkillSuggestion {
  /** Signature of the repeated action pattern. */
  readonly signature: string;
  /** How many times the pattern was observed. */
  readonly count: number;
  readonly actions: readonly SkillAction[];
}

/** Stable signature for an action (order-independent params). */
export function actionSignature(action: SkillAction): string {
  const params = Object.keys(action.params)
    .sort()
    .map((k) => `${k}=${action.params[k]}`)
    .join(",");
  return params ? `${action.kind}(${params})` : action.kind;
}

function normalizeTrigger(trigger: string): string {
  return trigger.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface SkillManagerOptions {
  /** Observations of the same signature needed before a suggestion is raised. */
  readonly suggestThreshold?: number;
}

export class SkillManager {
  private readonly history = new Map<string, SkillAction[]>();
  private readonly skills = new Map<string, Skill[]>();
  private readonly suggested = new Map<string, Set<string>>();
  private readonly threshold: number;
  private seq = 0;

  constructor(options: SkillManagerOptions = {}) {
    this.threshold = Math.max(2, options.suggestThreshold ?? 3);
  }

  /** Record an action a user performed (feeds experience memory). */
  record(userId: string, action: SkillAction): void {
    const list = this.history.get(userId) ?? [];
    list.push(action);
    this.history.set(userId, list);
  }

  /**
   * Detect repeated action patterns that have reached the threshold and are not
   * already saved as a Skill or previously suggested. Returns proposals only —
   * the caller must confirm before anything is persisted.
   */
  detectSuggestions(userId: string): SkillSuggestion[] {
    const list = this.history.get(userId) ?? [];
    const counts = new Map<string, { count: number; action: SkillAction }>();
    for (const action of list) {
      const sig = actionSignature(action);
      const entry = counts.get(sig) ?? { count: 0, action };
      entry.count += 1;
      counts.set(sig, entry);
    }

    const alreadySuggested = this.suggested.get(userId) ?? new Set<string>();
    const savedSignatures = new Set(
      (this.skills.get(userId) ?? []).flatMap((s) => s.actions.map(actionSignature)),
    );

    const suggestions: SkillSuggestion[] = [];
    for (const [sig, { count, action }] of counts) {
      if (count < this.threshold) continue;
      if (alreadySuggested.has(sig) || savedSignatures.has(sig)) continue;
      suggestions.push({ signature: sig, count, actions: [action] });
    }
    return suggestions;
  }

  /** Persist a suggestion as a named, triggerable Skill (user approval step). */
  confirmSuggestion(
    userId: string,
    suggestion: SkillSuggestion,
    name: string,
    trigger: string,
  ): Skill {
    const skill: Skill = {
      id: `skill_${++this.seq}`,
      name,
      trigger: normalizeTrigger(trigger),
      actions: suggestion.actions,
    };
    const list = this.skills.get(userId) ?? [];
    list.push(skill);
    this.skills.set(userId, list);

    const suggested = this.suggested.get(userId) ?? new Set<string>();
    suggested.add(suggestion.signature);
    this.suggested.set(userId, suggested);
    return skill;
  }

  /** Create a Skill directly (e.g. a multi-step macro), also user-initiated. */
  createSkill(userId: string, name: string, trigger: string, actions: SkillAction[]): Skill {
    return this.confirmSuggestion(
      userId,
      { signature: `manual_${++this.seq}`, count: 0, actions },
      name,
      trigger,
    );
  }

  listSkills(userId: string): readonly Skill[] {
    return [...(this.skills.get(userId) ?? [])];
  }

  /** Find a saved Skill whose trigger matches the utterance (auto-apply lookup). */
  findByTrigger(userId: string, utterance: string): Skill | undefined {
    const norm = normalizeTrigger(utterance);
    return (this.skills.get(userId) ?? []).find((s) => norm.includes(s.trigger));
  }

  /** Return the actions to execute for a matched Skill (execution is the caller's job). */
  apply(skill: Skill): readonly SkillAction[] {
    return skill.actions;
  }
}

export const moduleName = "skills" as const;
export const implemented = true;
