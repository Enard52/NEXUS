import { describe, expect, it } from "vitest";
import {
  CloudMemory,
  CloudSyncedUserMemory,
  DEFAULT_PERSONALIZATION,
  InMemoryCloudBackend,
  type Personalization,
  type UserProfile,
} from "./index.js";

const clock = () => new Date("2026-01-01T00:00:00.000Z");

const custom: Personalization = {
  assistantName: "Nova",
  userAddress: "Ensar",
  tone: "friendly",
  language: "tr",
};

describe("CloudMemory push/pull (FAZ 16)", () => {
  it("stores a versioned snapshot and serves it back", () => {
    const cloud = new CloudMemory(new InMemoryCloudBackend(), { now: clock });
    cloud.push("u1", custom, [], 1);
    const pulled = cloud.pull("u1");
    expect(pulled?.version).toBe(1);
    expect(pulled?.personalization.assistantName).toBe("Nova");
    expect(pulled?.updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("never lets a stale push overwrite a newer snapshot", () => {
    const cloud = new CloudMemory(new InMemoryCloudBackend(), { now: clock });
    cloud.push("u1", custom, [], 5);
    cloud.push("u1", { ...custom, assistantName: "Stale" }, [], 3);
    expect(cloud.pull("u1")?.personalization.assistantName).toBe("Nova");
  });
});

describe("CloudMemory conflict resolution (FAZ 16)", () => {
  const local: UserProfile = {
    userId: "u1",
    personalization: { ...DEFAULT_PERSONALIZATION, assistantName: "Local" },
  };

  it("prefers the cloud when its version is newer", () => {
    const cloud = new CloudMemory(new InMemoryCloudBackend(), { now: clock });
    cloud.push("u1", custom, [], 10);
    expect(cloud.resolve(local, 2).assistantName).toBe("Nova");
  });

  it("keeps local on ties and when cloud is older or absent", () => {
    const cloud = new CloudMemory(new InMemoryCloudBackend(), { now: clock });
    expect(cloud.resolve(local, 2).assistantName).toBe("Local"); // absent
    cloud.push("u1", custom, [], 2);
    expect(cloud.resolve(local, 2).assistantName).toBe("Local"); // tie
  });
});

describe("CloudSyncedUserMemory (FAZ 16)", () => {
  it("auto-pushes personalization changes to cloud", () => {
    const backend = new InMemoryCloudBackend();
    const store = new CloudSyncedUserMemory(backend, { now: clock });
    store.updatePersonalization("u1", { assistantName: "Nova", tone: "friendly" });
    const snapshot = backend.pull("u1");
    expect(snapshot).toBeDefined();
    expect(snapshot!.personalization.assistantName).toBe("Nova");
    expect(snapshot!.version).toBe(1);
  });

  it("syncDown pulls remote changes into local memory", () => {
    const backend = new InMemoryCloudBackend();
    // Simulate another device having pushed
    backend.push({
      userId: "u1",
      version: 5,
      updatedAt: "2026-01-01T00:00:00.000Z",
      personalization: custom,
      turns: [{ role: "user", text: "hello", at: "2026-01-01T00:00:00.000Z" }],
    });
    const store = new CloudSyncedUserMemory(backend);
    store.syncDown("u1");
    expect(store.getProfile("u1").personalization.assistantName).toBe("Nova");
    expect(store.recent("u1")).toHaveLength(1);
  });

  it("sync() performs full bidirectional reconciliation", () => {
    const backend = new InMemoryCloudBackend();
    const deviceA = new CloudSyncedUserMemory(backend, { now: clock });
    const deviceB = new CloudSyncedUserMemory(backend, { now: clock });

    // Device A makes a change
    deviceA.updatePersonalization("u1", { assistantName: "FromA" });
    // Device B syncs and should see it
    deviceB.sync("u1");
    expect(deviceB.getProfile("u1").personalization.assistantName).toBe("FromA");
  });

  it("does not overwrite local with stale cloud data", () => {
    const backend = new InMemoryCloudBackend();
    const store = new CloudSyncedUserMemory(backend, { now: clock });
    // Make two updates (version 1, 2)
    store.updatePersonalization("u1", { assistantName: "v1" });
    store.updatePersonalization("u1", { assistantName: "v2" });
    // Manually push a stale snapshot
    backend.push({
      userId: "u1",
      version: 1,
      updatedAt: "2025-01-01T00:00:00.000Z",
      personalization: { ...DEFAULT_PERSONALIZATION, assistantName: "Stale" },
      turns: [],
    });
    store.syncDown("u1");
    // Should remain v2 since stale (version 1 < current 2)
    expect(store.getProfile("u1").personalization.assistantName).toBe("v2");
  });

  it("remember() stores turns locally without immediate push", () => {
    const backend = new InMemoryCloudBackend();
    const store = new CloudSyncedUserMemory(backend, { now: clock });
    store.remember("u1", { role: "user", text: "turn 1" });
    store.remember("u1", { role: "assistant", text: "reply 1" });
    // Not pushed yet (batched)
    expect(backend.pull("u1")).toBeUndefined();
    // Explicit syncUp pushes everything
    store.syncUp("u1");
    const snap = backend.pull("u1");
    expect(snap!.turns).toHaveLength(2);
  });
});
