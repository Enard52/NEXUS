import { InMemoryKeyValueStore } from "@nexus/database";
import { describe, expect, it } from "vitest";

import { UserDataStore, defaultUserData, displayNameFromEmail } from "./userdata.js";

describe("displayNameFromEmail", () => {
  it("title-cases the local part and splits on . _ -", () => {
    expect(displayNameFromEmail("ada.lovelace@example.com")).toBe("Ada Lovelace");
    expect(displayNameFromEmail("grace_m-hopper@example.com")).toBe("Grace M Hopper");
  });

  it("collapses repeated separators and ignores leading/trailing ones", () => {
    expect(displayNameFromEmail("..a__b--c..@x.io")).toBe("A B C");
  });

  it("falls back to the whole input when nothing usable remains", () => {
    expect(displayNameFromEmail("...@x.io")).toBe("...@x.io");
    expect(displayNameFromEmail("")).toBe("");
  });

  it("handles input without an @ by treating it as the local part", () => {
    expect(displayNameFromEmail("bob.smith")).toBe("Bob Smith");
  });
});

describe("defaultUserData", () => {
  it("is an honest empty home on the free plan", () => {
    const d = defaultUserData("ada@example.com", "tr");
    expect(d).toEqual({
      plan: "free",
      assistantName: "NEXUS",
      displayName: "Ada",
      language: "tr",
      energyWhToday: 0,
      devices: [],
      routines: [],
      suggestions: [],
      family: [],
    });
  });

  it("prefers an explicit display name (trimmed) over the email-derived one", () => {
    expect(defaultUserData("ada@example.com", "en", "  Countess  ").displayName).toBe("Countess");
  });

  it("ignores a blank display name and derives it from the email", () => {
    expect(defaultUserData("ada.l@example.com", "en", "   ").displayName).toBe("Ada L");
  });

  it("returns fresh arrays on every call", () => {
    const a = defaultUserData("a@x.io", "en");
    const b = defaultUserData("a@x.io", "en");
    expect(a.devices).not.toBe(b.devices);
  });
});

describe("UserDataStore", () => {
  const setup = () => {
    const kv = new InMemoryKeyValueStore();
    return { kv, store: new UserDataStore(kv) };
  };

  it("returns undefined for a user that was never initialized", () => {
    expect(setup().store.get("u1")).toBeUndefined();
  });

  it("ensure creates and persists the default under the udata: key", () => {
    const { kv, store } = setup();
    const d = store.ensure("u1", "ada@example.com", "en", "Ada L");
    expect(d.displayName).toBe("Ada L");
    expect(kv.keys()).toEqual(["udata:u1"]);
    expect(JSON.parse(kv.get("udata:u1") as string)).toEqual(d);
    expect(store.get("u1")).toEqual(d);
  });

  it("ensure does not overwrite existing data or apply new arguments", () => {
    const { store } = setup();
    const first = store.ensure("u1", "ada@example.com", "en");
    store.set("u1", { ...first, energyWhToday: 42 });
    const again = store.ensure("u1", "other@example.com", "tr", "Someone");
    expect(again.energyWhToday).toBe(42);
    expect(again.language).toBe("en");
    expect(again.displayName).toBe("Ada");
  });

  it("set replaces the whole record", () => {
    const { store } = setup();
    const base = defaultUserData("a@x.io", "en");
    store.set("u1", { ...base, devices: [{ id: "d1", name: "Lamp", room: "Den", online: true }] });
    store.set("u1", base);
    expect(store.get("u1")?.devices).toEqual([]);
  });

  it("patch merges shallowly onto existing data and persists it", () => {
    const { store } = setup();
    store.ensure("u1", "ada@example.com", "en");
    const routines = [{ id: "r1", name: "Goodnight", usageCount: 3 }];
    const next = store.patch("u1", "ada@example.com", "en", { routines, plan: "premium" });
    expect(next.routines).toEqual(routines);
    expect(next.plan).toBe("premium");
    expect(next.displayName).toBe("Ada");
    expect(store.get("u1")).toEqual(next);
  });

  it("patch replaces arrays instead of concatenating them", () => {
    const { store } = setup();
    const dev = (id: string) => ({ id, name: id, room: "r", online: false });
    store.patch("u1", "a@x.io", "en", { devices: [dev("a"), dev("b")] });
    const next = store.patch("u1", "a@x.io", "en", { devices: [dev("c")] });
    expect(next.devices.map((d) => d.id)).toEqual(["c"]);
  });

  it("patch on an unknown user seeds the default first", () => {
    const { store } = setup();
    const next = store.patch("new", "bob.smith@x.io", "tr", { energyWhToday: 5 });
    expect(next).toMatchObject({
      displayName: "Bob Smith",
      language: "tr",
      energyWhToday: 5,
      plan: "free",
    });
    expect(store.get("new")).toEqual(next);
  });

  it("keeps users isolated from one another", () => {
    const { store } = setup();
    store.ensure("u1", "a@x.io", "en");
    store.ensure("u2", "b@x.io", "en");
    store.patch("u1", "a@x.io", "en", { energyWhToday: 10 });
    expect(store.get("u2")?.energyWhToday).toBe(0);
    store.delete("u1");
    expect(store.get("u1")).toBeUndefined();
    expect(store.get("u2")).toBeDefined();
  });

  it("delete removes the record so ensure re-seeds an empty home", () => {
    const { kv, store } = setup();
    store.patch("u1", "a@x.io", "en", { energyWhToday: 9 });
    store.delete("u1");
    expect(kv.has("udata:u1")).toBe(false);
    expect(store.ensure("u1", "a@x.io", "en").energyWhToday).toBe(0);
  });

  it("delete of an unknown user is a no-op", () => {
    const { store } = setup();
    expect(() => store.delete("ghost")).not.toThrow();
  });

  it("does not read other key families (e.g. accounts) as user data", () => {
    const { kv, store } = setup();
    kv.set("user:u1", JSON.stringify({ email: "a@x.io" }));
    expect(store.get("u1")).toBeUndefined();
  });

  it("surfaces corrupt stored JSON as an error rather than inventing data", () => {
    const { kv, store } = setup();
    kv.set("udata:u1", "{not json");
    expect(() => store.get("u1")).toThrow(SyntaxError);
    expect(() => store.ensure("u1", "a@x.io", "en")).toThrow(SyntaxError);
  });
});
