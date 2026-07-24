import { describe, expect, it } from "vitest";
import { defineScene, RoutineEngine, RoutineError, moduleName, type SceneAction } from "./index.js";

const movieActions: SceneAction[] = [
  { kind: "device.tv.set", params: { power: "on", input: "hdmi1" } },
  { kind: "device.light.set", params: { room: "living", brightness: "20" } },
  { kind: "device.blinds.set", params: { room: "living", position: "closed" } },
];

describe("@nexus/routines", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("routines");
  });

  it("defines and fires a voice scene (FAZ 17 'Film izleyeceğim')", () => {
    const engine = new RoutineEngine();
    engine.add(defineScene("Film Gecesi", "film izleyeceğim", movieActions));

    const matched = engine.matchVoice("nexus film izleyeceğim");
    expect(matched).toHaveLength(1);
    expect(engine.plan(matched[0])).toEqual(movieActions);
  });

  it("supports time and event triggers on one routine", () => {
    const engine = new RoutineEngine();
    engine.add({
      name: "Good Morning",
      triggers: [
        { type: "time", at: "07:00" },
        { type: "event", event: "arrive-home" },
      ],
      actions: [{ kind: "device.light.set", params: { brightness: "80" } }],
    });

    expect(engine.due("07:00")).toHaveLength(1);
    expect(engine.due("09:30")).toHaveLength(0);
    expect(engine.matchEvent("ARRIVE-HOME")).toHaveLength(1);
    expect(engine.matchEvent("leave-home")).toHaveLength(0);
  });

  it("prefers the most specific voice phrase when several match", () => {
    const engine = new RoutineEngine();
    engine.add(
      defineScene("Lights", "ışıkları aç", [{ kind: "device.light.set", params: { power: "on" } }]),
    );
    engine.add(
      defineScene("Party", "ışıkları aç ve müzik çal", [
        { kind: "device.speaker.set", params: { power: "on" } },
      ]),
    );

    const matched = engine.matchVoice("ışıkları aç ve müzik çal");
    expect(matched[0].name).toBe("Party");
  });

  it("never matches a disabled routine but keeps it stored", () => {
    const engine = new RoutineEngine();
    const r = engine.add(defineScene("Night", "iyi geceler", movieActions));
    engine.setEnabled(r.id, false);

    expect(engine.matchVoice("iyi geceler")).toHaveLength(0);
    expect(engine.plan(engine.get(r.id)!)).toEqual([]);
    expect(engine.list()).toHaveLength(1);

    engine.setEnabled(r.id, true);
    expect(engine.matchVoice("iyi geceler")).toHaveLength(1);
  });

  it("rejects invalid routines", () => {
    const engine = new RoutineEngine();
    expect(() => engine.add(defineScene("Empty", "x", []))).toThrow(RoutineError);
    expect(() =>
      engine.add({
        name: "Bad time",
        triggers: [{ type: "time", at: "25:00" }],
        actions: movieActions,
      }),
    ).toThrow(RoutineError);
    expect(() => engine.setEnabled("nope", true)).toThrow(RoutineError);
  });
});
