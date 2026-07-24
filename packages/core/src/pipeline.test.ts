import { describe, expect, it } from "vitest";
import { MockProvider } from "@nexus/ai";
import { DigitalTwin, InMemoryUserMemory } from "@nexus/memory";
import { defineScene, RoutineEngine } from "@nexus/routines";
import { RiskLevel, SecurityEngine } from "@nexus/security";
import { extractIntent, NexusCore, sceneActionRisk } from "./pipeline.js";

function makeCore() {
  const memory = new InMemoryUserMemory();
  return { memory, core: new NexusCore({ memory, provider: new MockProvider() }) };
}

describe("extractIntent", () => {
  it("recognizes name, address, language and home-control intents", () => {
    expect(extractIntent("your name is Nova").name).toBe("personalization.setName");
    expect(extractIntent("call me Captain").name).toBe("personalization.setAddress");
    expect(extractIntent("switch to Turkish").name).toBe("personalization.setLanguage");
    expect(extractIntent("turn on the light").name).toBe("home.control");
    expect(extractIntent("tell me a joke").name).toBe("chitchat");
  });
});

describe("NexusCore personalization (FAZ 1 Bitiş Kriteri)", () => {
  it("reflects a name change immediately in the next response", async () => {
    const { core } = makeCore();
    const r1 = await core.handle("u1", "your name is Nova");
    expect(r1.text).toContain("Nova");
  });

  it("reflects an address change immediately", async () => {
    const { core } = makeCore();
    const r = await core.handle("u1", "call me Captain");
    expect(r.text).toContain("Captain");
  });

  it("switches response language on request", async () => {
    const { core } = makeCore();
    const r = await core.handle("u1", "switch to Turkish");
    expect(r.text).toContain("Türkçe");
    // A subsequent chitchat keeps using the new language context.
    const profile = (await core.handle("u1", "merhaba")) !== undefined;
    expect(profile).toBe(true);
  });

  it("combined preferences persist across turns", async () => {
    const { core, memory } = makeCore();
    await core.handle("u1", "your name is Nova");
    await core.handle("u1", "call me Captain");
    const p = memory.getProfile("u1").personalization;
    expect(p.assistantName).toBe("Nova");
    expect(p.userAddress).toBe("Captain");
  });
});

describe("NexusCore security gating", () => {
  it("holds a risky home action for confirmation, then executes when confirmed", async () => {
    const { core } = makeCore();
    const held = await core.handle("u1", "turn on the light");
    expect(held.pending).toHaveLength(1);
    expect(held.executed).toHaveLength(0);

    const approved = await core.handle("u1", "turn on the light", { confirm: true });
    expect(approved.executed).toHaveLength(1);
    expect(approved.pending).toHaveLength(0);
  });
});

describe("NexusCore chitchat", () => {
  it("routes fallback utterances through the AI provider", async () => {
    const { core } = makeCore();
    const r = await core.handle("u1", "tell me something");
    expect(r.agent).toBe("chitchat");
    expect(r.text).toBe("mock: tell me something");
  });
});

describe("NexusCore Scenes & Routines (integration)", () => {
  const movie = defineScene("Film Gecesi", "film izleyeceğim", [
    { kind: "device.tv.set", params: { power: "on", input: "hdmi1" } },
    { kind: "device.light.set", params: { room: "living", brightness: "20" } },
    { kind: "device.blinds.set", params: { room: "living", position: "closed" } },
  ]);

  it("fires a voice scene end-to-end, each step gated by Security", async () => {
    const memory = new InMemoryUserMemory();
    const routines = new RoutineEngine();
    routines.add(movie);
    const core = new NexusCore({ memory, provider: new MockProvider(), routines });

    const held = await core.handle("u1", "nexus film izleyeceğim");
    expect(held.agent).toBe("routines");
    expect(held.intent).toBe("routine.run");
    expect(held.pending).toHaveLength(3);
    expect(held.executed).toHaveLength(0);

    const run = await core.handle("u1", "nexus film izleyeceğim", { confirm: true });
    expect(run.executed).toHaveLength(3);
    expect(run.pending).toHaveLength(0);
  });

  it("falls back to normal intent parsing when no routine matches", async () => {
    const memory = new InMemoryUserMemory();
    const routines = new RoutineEngine();
    routines.add(movie);
    const core = new NexusCore({ memory, provider: new MockProvider(), routines });

    const r = await core.handle("u1", "tell me a joke");
    expect(r.agent).toBe("chitchat");
  });

  it("denies a destructive routine step under a strict policy, even when confirmed", async () => {
    const memory = new InMemoryUserMemory();
    const routines = new RoutineEngine();
    routines.add(
      defineScene("Temizlik", "her şeyi sil", [
        { kind: "device.light.set", params: { power: "off" } },
        { kind: "memory.delete", params: { scope: "all" } },
      ]),
    );
    const security = new SecurityEngine({
      confirmAtOrAbove: RiskLevel.Medium,
      denyAtOrAbove: RiskLevel.Critical,
    });
    const core = new NexusCore({ memory, provider: new MockProvider(), routines, security });

    const run = await core.handle("u1", "her şeyi sil", { confirm: true });
    // The light toggle runs; the Critical delete is refused outright.
    expect(run.executed.map((s) => s.action.kind)).toEqual(["device.light.set"]);
  });

  it("classifies scene action risk conservatively", () => {
    expect(sceneActionRisk("device.light.set")).toBe(RiskLevel.Medium);
    expect(sceneActionRisk("door.unlock")).toBe(RiskLevel.High);
    expect(sceneActionRisk("account.delete")).toBe(RiskLevel.Critical);
  });
});

describe("NexusCore Digital Twin (FAZ 6)", () => {
  it("produces a context-aware home plan from the twin's world state", async () => {
    const memory = new InMemoryUserMemory();
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false });
    twin.setContext({ timeOfDay: "evening" });
    const core = new NexusCore({ memory, provider: new MockProvider(), twin });

    const r = await core.handle("u1", "turn on the living light", { confirm: true });
    expect(r.executed).toHaveLength(1);
    expect(r.text).toContain("evening");
    expect(r.text).toContain("30%");
  });

  it("does not act when the twin shows the light is already on", async () => {
    const memory = new InMemoryUserMemory();
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: true });
    const core = new NexusCore({ memory, provider: new MockProvider(), twin });

    const r = await core.handle("u1", "turn on the living light");
    expect(r.executed).toHaveLength(0);
    expect(r.pending).toHaveLength(0);
    expect(r.text).toContain("already on");
  });
});
