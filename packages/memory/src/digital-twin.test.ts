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
});
