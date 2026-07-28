/**
 * NEXUS AI — Proactive automation suggestions ("Hunches")
 *
 * Inspired by Amazon Alexa Hunches and Google Home's suggested routines: the
 * system watches what the user repeatedly does at similar times and *proposes*
 * turning it into a scheduled Routine — it never creates one silently (same
 * consent rule as learned Skills, ).
 *
 * Deterministic and dependency-free: observations carry their own timestamp
 * ("HH:MM"), so the engine is fully testable without a clock. A pattern is the
 * pairing of an action's signature with the hour it tends to happen; once it
 * recurs enough it becomes a suggestion the user can accept as a Routine.
 */

import type { RoutineInput, SceneAction } from "./index.js";

export interface ActivityObservation {
  readonly action: SceneAction;
  /** Local time the action happened, "HH:MM" (24h). */
  readonly at: string;
}

export interface RoutineSuggestion {
  /** Stable id for the (action, hour) pattern. */
  readonly signature: string;
  /** How many times the pattern was seen. */
  readonly count: number;
  /** Hour the pattern clusters around, "HH:00". */
  readonly at: string;
  /** A ready-to-accept routine the user can confirm as-is. */
  readonly proposal: RoutineInput;
}

const HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function actionSignature(action: SceneAction): string {
  const params = Object.keys(action.params)
    .sort()
    .map((k) => `${k}=${action.params[k]}`)
    .join(",");
  return params ? `${action.kind}(${params})` : action.kind;
}

export interface SuggestionOptions {
  /** Times a pattern must recur before it is suggested (min 2). */
  readonly threshold?: number;
}

export class RoutineSuggestionEngine {
  private readonly observations: ActivityObservation[] = [];
  private readonly dismissed = new Set<string>();
  private readonly threshold: number;

  constructor(options: SuggestionOptions = {}) {
    this.threshold = Math.max(2, options.threshold ?? 3);
  }

  /** Record something the user did (feeds the pattern detector). */
  observe(observation: ActivityObservation): void {
    if (!HOUR_RE.test(observation.at)) {
      throw new Error(`Invalid observation time "${observation.at}" (expected HH:MM)`);
    }
    this.observations.push(observation);
  }

  /** Stop proposing a pattern the user has rejected. */
  dismiss(signature: string): void {
    this.dismissed.add(signature);
  }

  /**
   * Patterns that have recurred at the same hour at least `threshold` times and
   * have not been dismissed. Each carries a ready-to-accept scheduled routine.
   */
  suggest(): RoutineSuggestion[] {
    const groups = new Map<string, { count: number; hour: string; action: SceneAction }>();
    for (const obs of this.observations) {
      const hour = `${obs.at.slice(0, 2)}:00`;
      const sig = `${actionSignature(obs.action)}@${hour}`;
      const entry = groups.get(sig) ?? { count: 0, hour, action: obs.action };
      entry.count += 1;
      groups.set(sig, entry);
    }

    const out: RoutineSuggestion[] = [];
    for (const [sig, { count, hour, action }] of groups) {
      if (count < this.threshold || this.dismissed.has(sig)) continue;
      out.push({
        signature: sig,
        count,
        at: hour,
        proposal: {
          name: `${action.kind} @ ${hour}`,
          triggers: [{ type: "time", at: hour }],
          actions: [action],
        },
      });
    }
    return out.sort((a, b) => b.count - a.count);
  }
}
