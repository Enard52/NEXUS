import { describe, expect, it } from "vitest";
import { DigitalTwin, resolveLightPlan } from "./digital-twin.js";

function twinWithLight(on: boolean) {
  const twin = new DigitalTwin();
  twin.upsertDevice({ id: "l1", kind: "light", room: "living", on });
  return twin;
}

describe("DigitalTwin (FAZ 6)", () => {
  it("finds a device by room and capability kind", () => {
    const twin = twinWithLight(false);
    expect(twin.findByRoomKind("living", "light")?.id).toBe("l1");
    expect(twin.findByRoomKind("kitchen", "light")).toBeUndefined();
  });

  it("same intent produces a different plan depending on time of day", () => {
    const day = twinWithLight(false);
    day.setContext({ timeOfDay: "day" });
    const dayPlan = resolveLightPlan(day, "living", true);

    const evening = twinWithLight(false);
    evening.setContext({ timeOfDay: "evening" });
    const eveningPlan = resolveLightPlan(evening, "living", true);

    expect(dayPlan.steps[0]!.params.brightness).toBe("100");
    expect(eveningPlan.steps[0]!.params.brightness).toBe("30");
    expect(dayPlan.rationale).not.toBe(eveningPlan.rationale);
  });

  it("does not re-issue a command when the world already matches the intent", () => {
    const alreadyOn = twinWithLight(true);
    const plan = resolveLightPlan(alreadyOn, "living", true);
    expect(plan.steps).toHaveLength(0);
    expect(plan.rationale).toContain("already on");
  });

  it("reports gracefully when there is no such device", () => {
    const empty = new DigitalTwin();
    const plan = resolveLightPlan(empty, "living", true);
    expect(plan.steps).toHaveLength(0);
    expect(plan.rationale).toContain("No light");
  });

  it("findByDisplayName locates device by custom name (case-insensitive)", () => {
    const twin = new DigitalTwin();
    twin.upsertDevice({
      id: "l1",
      kind: "light",
      room: "living",
      on: false,
      displayName: "Aurora",
    });
    twin.upsertDevice({ id: "l2", kind: "light", room: "bedroom", on: true });

    expect(twin.findByDisplayName("aurora")?.id).toBe("l1");
    expect(twin.findByDisplayName("AURORA")?.id).toBe("l1");
    expect(twin.findByDisplayName("ghost")).toBeUndefined();
    // Device without displayName is not matched
    expect(twin.findByDisplayName("bedroom")).toBeUndefined();
  });
});

describe("DigitalTwin Experience Memory (FAZ 6 deepening)", () => {
  it("records habits with brightness and computes rolling average", () => {
    const twin = new DigitalTwin();
    twin.recordHabit("light", "living", "evening", 20);
    twin.recordHabit("light", "living", "evening", 40);
    twin.recordHabit("light", "living", "evening", 30);

    const habits = twin.getHabitsForTime("evening");
    expect(habits).toHaveLength(1);
    expect(habits[0]!.frequency).toBe(3);
    expect(habits[0]!.avgBrightness).toBe(30); // (20+40+30)/3 = 30
  });

  it("getLearnedBrightness returns undefined below minFrequency", () => {
    const twin = new DigitalTwin();
    twin.recordHabit("light", "living", "evening", 20);
    twin.recordHabit("light", "living", "evening", 20);

    // Only 2 observations, default minFrequency is 3
    expect(twin.getLearnedBrightness("living", "evening")).toBeUndefined();
  });

  it("getLearnedBrightness returns average once threshold is met", () => {
    const twin = new DigitalTwin();
    twin.recordHabit("light", "bedroom", "night", 10);
    twin.recordHabit("light", "bedroom", "night", 20);
    twin.recordHabit("light", "bedroom", "night", 15);

    expect(twin.getLearnedBrightness("bedroom", "night")).toBe(15); // (10+20+15)/3 = 15
  });

  it("resolveLightPlan uses learned brightness after enough observations", () => {
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false });
    twin.setContext({ timeOfDay: "evening" });

    // Simulate 3 prior uses at 20% brightness
    twin.recordHabit("light", "living", "evening", 20);
    twin.recordHabit("light", "living", "evening", 20);
    twin.recordHabit("light", "living", "evening", 20);

    const plan = resolveLightPlan(twin, "living", true);
    expect(plan.steps[0]!.params.brightness).toBe("20");
    expect(plan.rationale).toContain("habit");
    expect(plan.rationale).toContain("20%");
  });

  it("resolveLightPlan falls back to time-based when no habit exists", () => {
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "kitchen", on: false });
    twin.setContext({ timeOfDay: "evening" });

    // No habit recorded for kitchen
    const plan = resolveLightPlan(twin, "kitchen", true);
    expect(plan.steps[0]!.params.brightness).toBe("30"); // time-based default
    expect(plan.rationale).toContain("evening");
    expect(plan.rationale).not.toContain("habit");
  });

  it("resolveLightPlan accumulates habits over repeated calls", () => {
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false });
    twin.setContext({ timeOfDay: "day" });

    // First 3 calls use time-based default (100%)
    resolveLightPlan(twin, "living", true);
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false }); // reset
    resolveLightPlan(twin, "living", true);
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false });
    resolveLightPlan(twin, "living", true);
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false });

    // 4th call — habit should now be learned (avg 100%)
    const plan = resolveLightPlan(twin, "living", true);
    expect(plan.steps[0]!.params.brightness).toBe("100");
    expect(plan.rationale).toContain("habit");
  });
});
