import { describe, expect, it } from "vitest";
import { RoutineEngine, RoutineSuggestionEngine, type SceneAction } from "./index.js";

const eveningLight: SceneAction = {
  kind: "device.light.set",
  params: { room: "living", brightness: "30" },
};

describe("@nexus/routines suggestions (Hunches)", () => {
  it("suggests a scheduled routine once a pattern recurs at the same hour", () => {
    const engine = new RoutineSuggestionEngine({ threshold: 3 });
    engine.observe({ action: eveningLight, at: "19:05" });
    engine.observe({ action: eveningLight, at: "19:12" });
    expect(engine.suggest()).toHaveLength(0); // below threshold

    engine.observe({ action: eveningLight, at: "19:40" });
    const suggestions = engine.suggest();
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].count).toBe(3);
    expect(suggestions[0].at).toBe("19:00");
    expect(suggestions[0].proposal.triggers[0]).toEqual({ type: "time", at: "19:00" });
  });

  it("does not conflate the same action at different hours", () => {
    const engine = new RoutineSuggestionEngine({ threshold: 2 });
    engine.observe({ action: eveningLight, at: "07:00" });
    engine.observe({ action: eveningLight, at: "07:30" });
    engine.observe({ action: eveningLight, at: "22:00" });
    const suggestions = engine.suggest();
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].at).toBe("07:00");
  });

  it("stops proposing a dismissed pattern", () => {
    const engine = new RoutineSuggestionEngine({ threshold: 2 });
    engine.observe({ action: eveningLight, at: "19:00" });
    engine.observe({ action: eveningLight, at: "19:10" });
    const sig = engine.suggest()[0].signature;
    engine.dismiss(sig);
    expect(engine.suggest()).toHaveLength(0);
  });

  it("an accepted suggestion installs directly into the RoutineEngine", () => {
    const suggestions = (() => {
      const s = new RoutineSuggestionEngine({ threshold: 2 });
      s.observe({ action: eveningLight, at: "19:00" });
      s.observe({ action: eveningLight, at: "19:20" });
      return s.suggest();
    })();

    const routines = new RoutineEngine();
    const installed = routines.add(suggestions[0].proposal);
    expect(routines.due("19:00").map((r) => r.id)).toContain(installed.id);
  });

  it("rejects malformed observation times", () => {
    const engine = new RoutineSuggestionEngine();
    expect(() => engine.observe({ action: eveningLight, at: "9am" })).toThrow();
  });
});
