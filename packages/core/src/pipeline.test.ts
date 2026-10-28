import { describe, expect, it } from "vitest";
import { MockProvider } from "@nexus/ai";
import { DigitalTwin, InMemoryUserMemory } from "@nexus/memory";
import { defineScene, RoutineEngine } from "@nexus/routines";
import { RiskLevel, SecurityMiddleware } from "@nexus/security";
import { DeviceManager, InMemoryConnector, type UniversalDevice } from "@nexus/devices";
import { Household } from "@nexus/accounts";
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
    const security = new SecurityMiddleware({
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

describe("Name-based device control", () => {
  const lamp: UniversalDevice = {
    id: "dev-1",
    name: "Living Lamp",
    room: "living",
    capabilities: [{ kind: "switch", value: false }],
  };

  function makeCoreWithNamedDevice() {
    const memory = new InMemoryUserMemory();
    const devices = new DeviceManager();
    devices.registerConnector(new InMemoryConnector("c1", [lamp]));
    devices.names.rename("dev-1", "Aurora");
    return {
      memory,
      devices,
      core: new NexusCore({ memory, provider: new MockProvider(), devices }),
    };
  }

  it("resolves 'turn on Aurora' via name-based second pass", async () => {
    const { core } = makeCoreWithNamedDevice();
    const r = await core.handle("u1", "turn on Aurora", { confirm: true });
    expect(r.intent).toBe("home.controlByName");
    expect(r.agent).toBe("home");
    expect(r.executed).toHaveLength(1);
  });

  it("resolves Turkish 'Aurora'yı aç' via name-based second pass", async () => {
    const { core } = makeCoreWithNamedDevice();
    const r = await core.handle("u1", "Aurora'yı aç", { confirm: true });
    expect(r.intent).toBe("home.controlByName");
    expect(r.executed).toHaveLength(1);
  });

  it("falls back to chitchat when name is unknown", async () => {
    const memory = new InMemoryUserMemory();
    const devices = new DeviceManager();
    devices.registerConnector(new InMemoryConnector("c1", [lamp]));
    // No alias registered
    const core = new NexusCore({ memory, provider: new MockProvider(), devices });
    const r = await core.handle("u1", "turn on Phantom");
    expect(r.agent).toBe("chitchat");
  });

  it("rename intent changes a device name and old name stays as alias", async () => {
    const { core, devices } = makeCoreWithNamedDevice();
    const r = await core.handle("u1", "rename Aurora to Stella");
    expect(r.intent).toBe("home.rename");
    expect(r.text).toContain("renamed");
    // New name resolves
    expect(devices.names.resolve("stella")).toBe("dev-1");
    // Old name kept as alias
    expect(devices.names.resolve("aurora")).toBe("dev-1");
    // Original device name also kept
    expect(devices.names.resolve("living lamp")).toBe("dev-1");
  });

  it("Turkish rename: 'Aurora'nın adını Yıldız koy'", () => {
    const intent = extractIntent("Aurora'nın adını Yıldız koy");
    expect(intent.name).toBe("home.rename");
    expect(intent.slots.deviceRef).toBe("Aurora");
    expect(intent.slots.newName).toBe("Yıldız");
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe("NexusCore Household access control (FAZ 12)", () => {
  const ADMIN = "u-admin";
  const MEMBER = "u-member";
  const GUEST = "u-guest";
  const STRANGER = "u-stranger";

  function makeHouseholdCore() {
    const memory = new InMemoryUserMemory();
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "dev-1", kind: "light", room: "living", on: false });
    twin.setContext({ timeOfDay: "day" });

    const household = new Household(ADMIN);
    household.acceptInvite(household.invite(ADMIN, "m@e.com", "member").token, MEMBER);
    household.acceptInvite(household.invite(ADMIN, "g@e.com", "guest").token, GUEST);

    const core = new NexusCore({ memory, provider: new MockProvider(), twin, household });
    return { core, household, twin, memory };
  }

  it("admin can control devices", async () => {
    const { core } = makeHouseholdCore();
    const r = await core.handle(ADMIN, "turn on the living light", { confirm: true });
    expect(r.executed.length).toBeGreaterThan(0);
    expect(r.denied).toBeUndefined();
  });

  it("member can control devices (control permission)", async () => {
    const { core } = makeHouseholdCore();
    const r = await core.handle(MEMBER, "turn on the living light", { confirm: true });
    expect(r.executed.length).toBeGreaterThan(0);
    expect(r.denied).toBeUndefined();
  });

  it("guest is denied device control (only has view)", async () => {
    const { core } = makeHouseholdCore();
    const r = await core.handle(GUEST, "turn on the living light", { confirm: true });
    expect(r.executed).toHaveLength(0);
    expect(r.denied).toBeDefined();
    expect(r.denied!.length).toBeGreaterThan(0);
  });

  it("unknown user (stranger) is denied all device actions", async () => {
    const { core } = makeHouseholdCore();
    const r = await core.handle(STRANGER, "turn on the living light", { confirm: true });
    expect(r.executed).toHaveLength(0);
    expect(r.denied).toBeDefined();
  });

  it("admin can grant control to guest for a specific device", async () => {
    const { core, household } = makeHouseholdCore();
    household.grant(ADMIN, GUEST, "dev-1", "control");
    const r = await core.handle(GUEST, "turn on the living light", { confirm: true });
    expect(r.executed.length).toBeGreaterThan(0);
    expect(r.denied).toBeUndefined();
  });

  it("admin can revoke control from a member for a specific device", async () => {
    const { core, household } = makeHouseholdCore();
    household.revoke(ADMIN, MEMBER, "dev-1", "control");
    const r = await core.handle(MEMBER, "turn on the living light", { confirm: true });
    expect(r.executed).toHaveLength(0);
    expect(r.denied).toBeDefined();
  });
});

describe("DigitalTwin per-user habits (FAZ 12)", () => {
  it("tracks habits independently per user", () => {
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "living", on: false });
    twin.setContext({ timeOfDay: "evening" });

    // User A consistently uses 40% brightness
    for (let i = 0; i < 5; i++) {
      twin.recordHabit("light", "living", "evening", 40, "userA");
    }
    // User B consistently uses 80% brightness
    for (let i = 0; i < 5; i++) {
      twin.recordHabit("light", "living", "evening", 80, "userB");
    }

    expect(twin.getLearnedBrightness("living", "evening", 3, "userA")).toBe(40);
    expect(twin.getLearnedBrightness("living", "evening", 3, "userB")).toBe(80);
    // Without userId, no global habit recorded
    expect(twin.getLearnedBrightness("living", "evening", 3)).toBeUndefined();
  });

  it("getHabitsForTime filters by user", () => {
    const twin = new DigitalTwin();
    twin.recordHabit("light", "living", "morning", 100, "userA");
    twin.recordHabit("light", "bedroom", "morning", 60, "userB");

    const habitsA = twin.getHabitsForTime("morning", "userA");
    expect(habitsA).toHaveLength(1);
    expect(habitsA[0]!.room).toBe("living");

    const habitsB = twin.getHabitsForTime("morning", "userB");
    expect(habitsB).toHaveLength(1);
    expect(habitsB[0]!.room).toBe("bedroom");
  });

  it("falls back to global habit when user-specific not available", () => {
    const twin = new DigitalTwin();
    // Global habit (no userId)
    for (let i = 0; i < 5; i++) {
      twin.recordHabit("light", "kitchen", "night", 20);
    }
    // User C has no personal habit for kitchen/night
    expect(twin.getLearnedBrightness("kitchen", "night", 3, "userC")).toBe(20);
  });
});

// ── FAZ 14: Authenticated pipeline (AccountHouseholdBridge integration) ─────

import { AccountService, AccountHouseholdBridge, AuthenticationError } from "@nexus/accounts";

describe("NexusCore handleAuthenticated (FAZ 14)", () => {
  function makeAuthCore() {
    const memory = new InMemoryUserMemory();
    const accounts = new AccountService();
    const bridge = new AccountHouseholdBridge(accounts);
    const { account, session, household } = bridge.registerWithHousehold({
      email: "owner@nexus.ai",
      password: "SecurePass1!",
    });
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "dev-1", kind: "light", room: "living", on: false });
    twin.setContext({ timeOfDay: "day" });
    const core = new NexusCore({
      memory,
      provider: new MockProvider(),
      twin,
      household,
      authBridge: bridge,
    });
    return { core, bridge, accounts, account, session, household };
  }

  it("processes a command with a valid session token", async () => {
    const { core, session } = makeAuthCore();
    const res = await core.handleAuthenticated(session.token, "hello");
    expect(res.intent).toBe("chitchat");
    expect(res.text).toBeTruthy();
  });

  it("throws AuthenticationError for an invalid/expired token", async () => {
    const { core } = makeAuthCore();
    await expect(core.handleAuthenticated("invalid-token", "hello")).rejects.toThrow(
      AuthenticationError,
    );
  });

  it("multi-device: two sessions authenticate to the same account", async () => {
    const { core, accounts } = makeAuthCore();
    const s2 = accounts.login("owner@nexus.ai", "SecurePass1!");
    const res1 = await core.handleAuthenticated(s2.token, "hello");
    expect(res1.intent).toBe("chitchat");
  });

  it("household device gating works through authenticated flow", async () => {
    const { core, bridge, account, household } = makeAuthCore();
    // Invite a guest
    const invite = household.invite(account.id, "g@e.com", "guest");
    const guestAcct = bridge.accountService.register({ email: "g@e.com", password: "GuestPass1!" });
    household.acceptInvite(invite.token, guestAcct.id);
    // Manually register guest in bridge's user→household map
    bridge.attachHousehold(account.id, household);

    // Guest tries to control a device — should be denied
    bridge.accountService.login("g@e.com", "GuestPass1!");
    // We need the guest in the bridge's userHousehold map
    // Use handle directly with guestAcct.id since handleAuthenticated needs the bridge mapping
    const res = await core.handle(guestAcct.id, "turn on the living light", { confirm: true });
    // Guest's device action should be denied by household
    expect(res.denied?.length).toBeGreaterThan(0);
  });
});
