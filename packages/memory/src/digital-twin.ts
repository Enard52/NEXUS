/**
 * NEXUS AI — Digital Twin (FAZ 6)
 *
 * A live model of the user's environment (rooms, devices and their state) plus
 * lightweight context (time of day, occupancy). The Core queries this when
 * building a plan, so the *same* intent produces a *consistent but different*
 * plan depending on the current world state (FAZ 6 Bitiş Kriteri).
 *
 * Deterministic and dependency-free so planning is fully testable.
 */

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export interface DeviceState {
  readonly id: string;
  /** Universal capability kind, e.g. "light", "thermostat". Brand-agnostic. */
  readonly kind: string;
  readonly room: string;
  readonly on: boolean;
  /** 0–100 for dimmable devices; omitted when not applicable. */
  readonly brightness?: number;
}

export interface EnvironmentContext {
  readonly timeOfDay: TimeOfDay;
  /** Whether anyone is present in the space (drives safety/energy choices). */
  readonly occupied: boolean;
}

export interface HabitRecord {
  readonly id: string;
  readonly kind: string;
  readonly room: string;
  readonly timeOfDay: TimeOfDay;
  readonly frequency: number;
}

const DEFAULT_CONTEXT: EnvironmentContext = { timeOfDay: "day", occupied: true };

/** Mutable world model. FAZ 16 will back this with cloud/persistent storage. */
export class DigitalTwin {
  private readonly devices = new Map<string, DeviceState>();
  private readonly habits = new Map<string, HabitRecord>();
  private context: EnvironmentContext = { ...DEFAULT_CONTEXT };

  upsertDevice(state: DeviceState): void {
    this.devices.set(state.id, { ...state });
  }

  getDevice(id: string): DeviceState | undefined {
    const d = this.devices.get(id);
    return d ? { ...d } : undefined;
  }

  /** First device of a kind in a room — the natural target of a room command. */
  findByRoomKind(room: string, kind: string): DeviceState | undefined {
    for (const d of this.devices.values()) {
      if (d.room === room && d.kind === kind) return { ...d };
    }
    return undefined;
  }

  recordHabit(kind: string, room: string, timeOfDay: TimeOfDay): void {
    const key = `${kind}-${room}-${timeOfDay}`;
    const existing = this.habits.get(key);
    if (existing) {
      this.habits.set(key, { ...existing, frequency: existing.frequency + 1 });
    } else {
      this.habits.set(key, { id: key, kind, room, timeOfDay, frequency: 1 });
    }
  }

  getHabitsForTime(timeOfDay: TimeOfDay): HabitRecord[] {
    return Array.from(this.habits.values())
      .filter((h) => h.timeOfDay === timeOfDay)
      .sort((a, b) => b.frequency - a.frequency);
  }

  setContext(patch: Partial<EnvironmentContext>): EnvironmentContext {
    this.context = { ...this.context, ...patch };
    return { ...this.context };
  }

  getContext(): EnvironmentContext {
    return { ...this.context };
  }
}

export interface TwinPlanStep {
  readonly kind: string;
  readonly params: Record<string, string>;
  readonly summary: string;
}

export interface TwinPlan {
  readonly steps: readonly TwinPlanStep[];
  /** Human-readable rationale explaining why the plan fits the world state. */
  readonly rationale: string;
}

/**
 * Resolve a "turn a light on" request against the twin. The intent is constant;
 * the resulting plan depends on the world state:
 *  - already on  → no-op (report state), never blindly re-issues the command
 *  - evening/night → dim, warm level to avoid a harsh full-brightness burst
 *  - day/morning → full brightness
 */
export function resolveLightPlan(twin: DigitalTwin, room: string, desiredOn: boolean): TwinPlan {
  const device = twin.findByRoomKind(room, "light");
  const ctx = twin.getContext();

  if (!device) {
    return { steps: [], rationale: `No light known in ${room}; nothing to control.` };
  }

  if (!desiredOn) {
    if (!device.on) {
      return { steps: [], rationale: `The ${room} light is already off.` };
    }
    return {
      steps: [
        {
          kind: "light.set",
          params: { id: device.id, on: "false" },
          summary: `Turn off ${room} light`,
        },
      ],
      rationale: `Turning the ${room} light off.`,
    };
  }

  if (device.on) {
    return { steps: [], rationale: `The ${room} light is already on.` };
  }

  const dim = ctx.timeOfDay === "evening" || ctx.timeOfDay === "night";
  const brightness = dim ? 30 : 100;
  return {
    steps: [
      {
        kind: "light.set",
        params: { id: device.id, on: "true", brightness: String(brightness) },
        summary: `Turn on ${room} light at ${brightness}%`,
      },
    ],
    rationale: dim
      ? `It's ${ctx.timeOfDay}, so the ${room} light comes on gently at ${brightness}%.`
      : `It's ${ctx.timeOfDay}, so the ${room} light comes on at full ${brightness}%.`,
  };
}
