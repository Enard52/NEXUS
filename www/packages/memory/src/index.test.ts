import { describe, expect, it } from "vitest";
import { DEFAULT_PERSONALIZATION, InMemoryUserMemory } from "./index.js";

describe("InMemoryUserMemory", () => {
  it("returns default personalization for a new user", () => {
    const mem = new InMemoryUserMemory();
    expect(mem.getProfile("u1").personalization).toEqual(DEFAULT_PERSONALIZATION);
  });

  it("merges personalization patches and persists them", () => {
    const mem = new InMemoryUserMemory();
    mem.updatePersonalization("u1", { assistantName: "Nova", language: "tr" });
    const p = mem.getProfile("u1").personalization;
    expect(p.assistantName).toBe("Nova");
    expect(p.language).toBe("tr");
    // Untouched fields keep their defaults.
    expect(p.tone).toBe(DEFAULT_PERSONALIZATION.tone);
  });

  it("keeps short-term memory bounded to the window size", () => {
    const mem = new InMemoryUserMemory(2);
    mem.remember("u1", { role: "user", text: "one" });
    mem.remember("u1", { role: "user", text: "two" });
    mem.remember("u1", { role: "user", text: "three" });
    const recent = mem.recent("u1");
    expect(recent.map((t) => t.text)).toEqual(["two", "three"]);
  });

  it("isolates memory per user", () => {
    const mem = new InMemoryUserMemory();
    mem.remember("a", { role: "user", text: "hi" });
    expect(mem.recent("b")).toHaveLength(0);
  });
});
