import { describe, expect, it } from "vitest";
import { implemented, InMemorySyncBackend, mergeState, moduleName, SyncEngine } from "./index.js";

describe("SyncEngine cross-device convergence (FAZ 22)", () => {
  it("propagates a skill taught on one device to another", () => {
    const backend = new InMemorySyncBackend();
    const desktop = new SyncEngine("acct-1", "desktop", backend);
    const phone = new SyncEngine("acct-1", "phone", backend);

    desktop.set("skills", "movie-night", { steps: ["dim", "tv-on"] });
    desktop.sync();

    // The phone had no knowledge of it until it syncs.
    expect(phone.get("skills", "movie-night")).toBeUndefined();
    phone.sync();
    expect(phone.get<{ steps: string[] }>("skills", "movie-night")?.steps).toEqual([
      "dim",
      "tv-on",
    ]);
  });

  it("syncs preferences and memory domains independently", () => {
    const backend = new InMemorySyncBackend();
    const a = new SyncEngine("acct-1", "a", backend);
    const b = new SyncEngine("acct-1", "b", backend);

    a.set("preferences", "assistantName", "Nova");
    a.set("memory", "last-room", "living");
    a.sync();
    b.sync();

    expect(b.get("preferences", "assistantName")).toBe("Nova");
    expect(b.get("memory", "last-room")).toBe("living");
  });

  it("resolves conflicting edits by last-write-wins (higher version)", () => {
    const backend = new InMemorySyncBackend();
    // Shared clock so versions are globally comparable across devices.
    let t = 0;
    const clock = () => ++t;
    const a = new SyncEngine("acct-1", "a", backend, { clock });
    const b = new SyncEngine("acct-1", "b", backend, { clock });

    a.set("preferences", "tone", "formal"); // version 1
    b.set("preferences", "tone", "playful"); // version 2 (newer)
    a.sync();
    b.sync();
    a.sync();

    expect(a.get("preferences", "tone")).toBe("playful");
    expect(b.get("preferences", "tone")).toBe("playful");
  });
});

describe("mergeState (FAZ 22)", () => {
  it("keeps the incumbent on version ties (deterministic)", () => {
    const base = {
      preferences: { k: { key: "k", value: "old", version: 1, updatedBy: "a" } },
      skills: {},
      memory: {},
    };
    const incoming = {
      preferences: { k: { key: "k", value: "new", version: 1, updatedBy: "b" } },
      skills: {},
      memory: {},
    };
    expect(mergeState(base, incoming).preferences.k!.value).toBe("old");
  });
});

describe("@nexus/infra module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("infra");
    expect(implemented).toBe(true);
  });
});
