/**
 * NEXUS AI — Scenes & Routines (enhancement beyond the roadmap)
 *
 * Every major ecosystem — Amazon Alexa Routines, Google Home Routines, Apple
 * HomeKit Scenes/Automations, Samsung SmartThings Scenes — is built around one
 * idea the roadmap only half-covered: a user-defined *Scene* (a named bundle of
 * device actions, e.g. "Movie night") fired by a *trigger* (a spoken phrase, a
 * time of day, or an event like sunset / arriving home).
 *
 * NEXUS already had auto-learned Skills (FAZ 5: the system notices repetition
 * and proposes a shortcut). This adds the complementary half: routines the user
 * declares up front. Together they cover both "learn what I do" and "do exactly
 * what I told you". This engine also powers the FAZ 17 "Film izleyeceğim"
 * (movie-night) end-to-end scenario.
 *
 * Consistent with the Skill/Platform pattern: the engine *plans* the actions to
 * run and never executes them itself — Core + Security (FAZ 11) still gate and
 * carry out every action. Dependency-free and deterministic; time/events are
 * inputs, so it is fully testable.
 */

/** A single step in a routine. Structurally compatible with Skill/Device actions. */
export interface SceneAction {
  /** Stable action id, e.g. "device.tv.set", "device.light.set". */
  readonly kind: string;
  /** Parameters, e.g. { device: "tv", power: "on" }. */
  readonly params: Record<string, string>;
}

/** What fires a routine. A routine may carry several triggers. */
export type RoutineTrigger =
  | { readonly type: "voice"; readonly phrase: string }
  /** 24-hour local time, "HH:MM". */
  | { readonly type: "time"; readonly at: string }
  /** Named event, e.g. "sunset", "arrive-home", "leave-home". */
  | { readonly type: "event"; readonly event: string };

export interface Routine {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly triggers: readonly RoutineTrigger[];
  readonly actions: readonly SceneAction[];
}

export interface RoutineInput {
  readonly name: string;
  readonly triggers: readonly RoutineTrigger[];
  readonly actions: readonly SceneAction[];
  /** Defaults to true. */
  readonly enabled?: boolean;
}

export class RoutineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoutineError";
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

function validate(input: RoutineInput): void {
  if (!input.name.trim()) throw new RoutineError("Routine name is required");
  if (input.actions.length === 0) {
    throw new RoutineError(`Routine "${input.name}" must have at least one action`);
  }
  if (input.triggers.length === 0) {
    throw new RoutineError(`Routine "${input.name}" must have at least one trigger`);
  }
  for (const t of input.triggers) {
    if (t.type === "time" && !TIME_RE.test(t.at)) {
      throw new RoutineError(`Invalid time trigger "${t.at}" (expected HH:MM, 24h)`);
    }
    if (t.type === "voice" && !t.phrase.trim()) {
      throw new RoutineError("Voice trigger phrase is required");
    }
    if (t.type === "event" && !t.event.trim()) {
      throw new RoutineError("Event trigger name is required");
    }
  }
}

/**
 * Convenience for the most common case: a voice-triggered scene, e.g.
 * `defineScene("Movie night", "film izleyeceğim", [...])`.
 */
export function defineScene(
  name: string,
  phrase: string,
  actions: readonly SceneAction[],
): RoutineInput {
  return { name, triggers: [{ type: "voice", phrase }], actions };
}

export class RoutineEngine {
  private readonly routines = new Map<string, Routine>();
  private seq = 0;

  /** Register a routine after validation. Returns the stored routine. */
  add(input: RoutineInput): Routine {
    validate(input);
    const routine: Routine = {
      id: `routine_${++this.seq}`,
      name: input.name.trim(),
      enabled: input.enabled ?? true,
      triggers: input.triggers,
      actions: input.actions,
    };
    this.routines.set(routine.id, routine);
    return routine;
  }

  get(id: string): Routine | undefined {
    return this.routines.get(id);
  }

  remove(id: string): boolean {
    return this.routines.delete(id);
  }

  list(): readonly Routine[] {
    return [...this.routines.values()];
  }

  /** Enable/disable without deleting. Disabled routines never match. */
  setEnabled(id: string, enabled: boolean): Routine {
    const routine = this.routines.get(id);
    if (!routine) throw new RoutineError(`Unknown routine "${id}"`);
    const updated: Routine = { ...routine, enabled };
    this.routines.set(id, updated);
    return updated;
  }

  private enabled(): Routine[] {
    return [...this.routines.values()].filter((r) => r.enabled);
  }

  /** Routines whose voice phrase is contained in the utterance (longest first). */
  matchVoice(utterance: string): Routine[] {
    const norm = normalizePhrase(utterance);
    return this.enabled()
      .filter((r) =>
        r.triggers.some((t) => t.type === "voice" && norm.includes(normalizePhrase(t.phrase))),
      )
      .sort((a, b) => longestVoice(b) - longestVoice(a));
  }

  /** Routines triggered by the given event name. */
  matchEvent(event: string): Routine[] {
    const key = event.trim().toLowerCase();
    return this.enabled().filter((r) =>
      r.triggers.some((t) => t.type === "event" && t.event.trim().toLowerCase() === key),
    );
  }

  /** Routines scheduled for the given "HH:MM" local time. */
  due(time: string): Routine[] {
    if (!TIME_RE.test(time)) throw new RoutineError(`Invalid time "${time}" (expected HH:MM)`);
    return this.enabled().filter((r) => r.triggers.some((t) => t.type === "time" && t.at === time));
  }

  /** The ordered actions to execute for a routine (execution is the caller's job). */
  plan(routine: Routine): readonly SceneAction[] {
    if (!routine.enabled) return [];
    return routine.actions;
  }
}

function longestVoice(r: Routine): number {
  return Math.max(
    0,
    ...r.triggers
      .filter((t) => t.type === "voice")
      .map((t) => (t as { phrase: string }).phrase.length),
  );
}

export const moduleName = "routines" as const;
export const implemented = true;

export * from "./suggestions.js";
