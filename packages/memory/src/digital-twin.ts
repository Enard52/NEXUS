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
  /** User-assigned display name / alias for the device. */
  readonly displayName?: string;
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
  /** Average brightness value observed for this habit (light-specific). */
  readonly avgBrightness?: number;
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

  /** Find a device by its user-assigned display name (case-insensitive). */
  findByDisplayName(name: string): DeviceState | undefined {
    const lower = name.toLowerCase();
    for (const d of this.devices.values()) {
      if (d.displayName && d.displayName.toLowerCase() === lower) return { ...d };
    }
    return undefined;
  }

  /**
   * Record a habit observation. When userId is provided, the habit is scoped
   * to that user (FAZ 12: per-user personalization). Without userId, habits
   * are stored globally (backward-compatible with pre-FAZ 12 code).
   */
  recordHabit(kind: string, room: string, timeOfDay: TimeOfDay, brightness?: number, userId?: string): void {
    const key = userId
      ? `${userId}:${kind}-${room}-${timeOfDay}`
      : `${kind}-${room}-${timeOfDay}`;
    const existing = this.habits.get(key);
    if (existing) {
      // Rolling average for brightness
      const newFreq = existing.frequency + 1;
      const avgB = brightness !== undefined && existing.avgBrightness !== undefined
        ? Math.round((existing.avgBrightness * existing.frequency + brightness) / newFreq)
        : brightness ?? existing.avgBrightness;
      this.habits.set(key, { ...existing, frequency: newFreq, avgBrightness: avgB });
    } else {
      this.habits.set(key, { id: key, kind, room, timeOfDay, frequency: 1, avgBrightness: brightness });
    }
  }

  /**
   * Get the learned brightness preference for a room/time combination.
   * When userId is provided, returns user-specific preference first, then
   * falls back to the global habit (shared Digital Twin awareness, FAZ 12).
   */
  getLearnedBrightness(room: string, timeOfDay: TimeOfDay, minFrequency = 3, userId?: string): number | undefined {
    // User-specific habit takes priority
    if (userId) {
      const userKey = `${userId}:light-${room}-${timeOfDay}`;
      const userHabit = this.habits.get(userKey);
      if (userHabit && userHabit.frequency >= minFrequency && userHabit.avgBrightness !== undefined) {
        return userHabit.avgBrightness;
      }
    }
    // Fallback to global habit
    const key = `light-${room}-${timeOfDay}`;
    const habit = this.habits.get(key);
    if (!habit || habit.frequency < minFrequency || habit.avgBrightness === undefined) {
      return undefined;
    }
    return habit.avgBrightness;
  }

  /**
   * Get habits for a time of day. When userId is provided, returns only that
   * user's habits; otherwise returns all habits (global + per-user mixed).
   */
  getHabitsForTime(timeOfDay: TimeOfDay, userId?: string): HabitRecord[] {
    const prefix = userId ? `${userId}:` : undefined;
    return Array.from(this.habits.values())
      .filter((h) => {
        if (h.timeOfDay !== timeOfDay) return false;
        if (prefix) return h.id.startsWith(prefix);
        return true;
      })
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
 *  - habit override → if user consistently uses a specific brightness at this time,
 *    prefer the learned value (experience memory deepening)
 *
 * When userId is provided (FAZ 12), habits are tracked and resolved per-user.
 */
export function resolveLightPlan(twin: DigitalTwin, room: string, desiredOn: boolean, userId?: string): TwinPlan {
  const device = twin.findByRoomKind(room, "light");
  const ctx = twin.getContext();

  if (!device) {
    return { steps: [], rationale: `No light known in ${room}; nothing to control.` };
  }

  if (!desiredOn) {
    if (!device.on) {
      return { steps: [], rationale: `The ${room} light is already off.` };
    }
    // Record the "turn off" habit
    twin.recordHabit("light.off", room, ctx.timeOfDay, undefined, userId);
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

  // Determine brightness: learned preference > time-based default
  const learned = twin.getLearnedBrightness(room, ctx.timeOfDay, 3, userId);
  const dim = ctx.timeOfDay === "evening" || ctx.timeOfDay === "night";
  const brightness = learned ?? (dim ? 30 : 100);
  const source = learned !== undefined ? "learned" : "time-based";

  // Record this as a habit observation
  twin.recordHabit("light", room, ctx.timeOfDay, brightness, userId);

  return {
    steps: [
      {
        kind: "light.set",
        params: { id: device.id, on: "true", brightness: String(brightness) },
        summary: `Turn on ${room} light at ${brightness}%`,
      },
    ],
    rationale: source === "learned"
      ? `Based on your habit, the ${room} light comes on at ${brightness}% (you usually prefer this at ${ctx.timeOfDay}).`
      : dim
        ? `It's ${ctx.timeOfDay}, so the ${room} light comes on gently at ${brightness}%.`
        : `It's ${ctx.timeOfDay}, so the ${room} light comes on at full ${brightness}%.`,
  };
}
