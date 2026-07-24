import { describe, expect, it } from "vitest";
import {
  CloudMemory,
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
