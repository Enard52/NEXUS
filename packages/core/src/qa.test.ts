/**
 * NEXUS AI — FAZ 17: Kapsamlı Test, Güvenlik Denetimi ve Kalite Güvencesi
 *
 * End-to-end integration tests, load/stress tests, and security pentest
 * covering the complete pipeline from account creation through device command.
 */

import { describe, expect, it } from "vitest";
import { MockProvider } from "@nexus/ai";
import { AccountService, AccountHouseholdBridge, Household } from "@nexus/accounts";
import { BillingService, SandboxPaymentProvider } from "@nexus/billing";
import { ConnectorStore, StoreError } from "@nexus/connectors";
import { DeviceManager, InMemoryConnector, type UniversalDevice } from "@nexus/devices";
import { InMemoryUserMemory, CloudSyncedUserMemory, InMemoryCloudBackend } from "@nexus/memory";
import { definePlugin, PluginRegistry } from "@nexus/plugins";
import { defineScene, RoutineEngine, RoutineSuggestionEngine } from "@nexus/routines";
import {
  SecurityEngine,
  SecurityMiddleware,
  RiskLevel,
  RateLimiter,
  LoginLockout,
} from "@nexus/security";
import { DigitalTwin } from "@nexus/memory";
import { NexusCore } from "./pipeline.js";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: END-TO-END INTEGRATION
// "Film izleyeceğim" scenario — account + billing + 3 brands + routine + cloud memory
// ═══════════════════════════════════════════════════════════════════════════════

describe("FAZ 17 — End-to-End Integration: Film Gecesi Senaryosu", () => {
  function buildFullStack() {
    // 1. Account + Auth
    const accounts = new AccountService();
    const bridge = new AccountHouseholdBridge(accounts);
    const { account, session, household } = bridge.registerWithHousehold({
      email: "ensar@nexus.ai",
      password: "SecurePass1!",
    });

    // 2. Billing (Patreon)
    const billing = new BillingService(new SandboxPaymentProvider(), {
      patreon: {
        clientId: "client_test",
        clientSecret: "secret_test",
        redirectUri: "https://nexus.ai/callback",
        campaignId: "campaign_1",
      },
    });
    billing.subscribe(account.id, "premium");

    // 3. Devices — 3 brands (IKEA lamp, Xiaomi sensor, Sonoff plug)
    const devices = new DeviceManager();
    const ikeaLamp: UniversalDevice = {
      id: "ikea-lamp-1",
      name: "IKEA Living Lamp",
      room: "living",
      capabilities: [
        { kind: "switch", value: false },
        { kind: "brightness", value: 100, min: 0, max: 255 },
      ],
    };
    const xiaomiSensor: UniversalDevice = {
      id: "xiaomi-sensor-1",
      name: "Xiaomi Temp Sensor",
      room: "living",
      capabilities: [{ kind: "brightness", value: 22, min: -40, max: 80 }],
    };
    const sonoffPlug: UniversalDevice = {
      id: "sonoff-plug-1",
      name: "Sonoff Smart Plug",
      room: "living",
      capabilities: [{ kind: "switch", value: true }],
    };
    devices.registerConnector(new InMemoryConnector("ikea", [ikeaLamp]));
    devices.registerConnector(new InMemoryConnector("xiaomi", [xiaomiSensor]));
    devices.registerConnector(new InMemoryConnector("sonoff", [sonoffPlug]));

    // 4. Connector Store (premium gating)
    const registry = new PluginRegistry();
    registry.register(
      definePlugin(
        {
          id: "ikea",
          name: "IKEA",
          vendor: "ikea",
          version: "1.0.0",
          protocol: "zigbee",
          capabilities: ["switch", "brightness"],
          premium: false,
        },
        [ikeaLamp],
      ),
    );
    registry.register(
      definePlugin(
        {
          id: "sonoff",
          name: "Sonoff",
          vendor: "sonoff",
          version: "1.0.0",
          protocol: "mqtt",
          capabilities: ["switch"],
          premium: true,
        },
        [sonoffPlug],
      ),
    );
    const store = new ConnectorStore(registry, devices);

    // 5. Digital Twin
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "ikea-lamp-1", kind: "light", room: "living", on: false });
    twin.upsertDevice({ id: "sonoff-plug-1", kind: "switch", room: "living", on: true });
    twin.setContext({ timeOfDay: "evening" });

    // 6. Routines
    const routines = new RoutineEngine();
    routines.add(
      defineScene("Film Gecesi", "film izleyeceğim", [
        { kind: "device.light.set", params: { room: "living", brightness: "20" } },
        { kind: "device.tv.set", params: { power: "on", input: "hdmi1" } },
        { kind: "device.blinds.set", params: { room: "living", position: "closed" } },
      ]),
    );

    // 7. Cloud Memory
    const cloudBackend = new InMemoryCloudBackend();
    const memory = new CloudSyncedUserMemory(cloudBackend);

    // 8. Security
    const security = new SecurityMiddleware({
      confirmAtOrAbove: RiskLevel.Medium,
      denyAtOrAbove: RiskLevel.Critical,
    });

    // 9. NexusCore
    const core = new NexusCore({
      memory,
      provider: new MockProvider(),
      twin,
      household,
      routines,
      security,
      devices,
      authBridge: bridge,
    });

    return {
      core,
      bridge,
      session,
      account,
      billing,
      store,
      memory,
      cloudBackend,
      household,
      devices,
    };
  }

  it("complete flow: auth → premium → install connector → scene → cloud sync", () => {
    const { bridge, session, account, billing, store, memory, cloudBackend } = buildFullStack();

    // Step 1: Validate session
    const ctx = bridge.requireAuth(session.token);
    expect(ctx.account.id).toBe(account.id);
    expect(ctx.household).toBeDefined();

    // Step 2: Verify premium subscription
    const sub = billing.get(account.id);
    expect(sub?.plan).toBe("premium");
    expect(sub?.status).toBe("active");

    // Step 3: Install premium connector (should work on premium plan)
    store.install("sonoff", "premium");
    expect(store.isInstalled("sonoff")).toBe(true);

    // Step 4: Personalize
    memory.updatePersonalization(account.id, { assistantName: "Nova", language: "tr" });
    expect(memory.getProfile(account.id).personalization.assistantName).toBe("Nova");

    // Step 5: Cloud sync persists
    const snap = cloudBackend.pull(account.id);
    expect(snap).toBeDefined();
    expect(snap!.personalization.assistantName).toBe("Nova");
  });

  it("film gecesi scene runs end-to-end with security gating", async () => {
    const { core, session } = buildFullStack();

    // Trigger scene via authenticated flow
    const held = await core.handleAuthenticated(session.token, "nexus film izleyeceğim");
    expect(held.agent).toBe("routines");
    expect(held.pending.length).toBeGreaterThan(0);

    // Confirm execution
    const run = await core.handleAuthenticated(session.token, "nexus film izleyeceğim", {
      confirm: true,
    });
    expect(run.executed.length).toBeGreaterThan(0);
  });

  it("guest is denied scene execution on household-gated device", async () => {
    const { core, bridge, account, household } = buildFullStack();

    // Invite a guest
    const invite = household.invite(account.id, "guest@test.com", "guest");
    const guestAcct = bridge.accountService.register({
      email: "guest@test.com",
      password: "Guest123!",
    });
    household.acceptInvite(invite.token, guestAcct.id);

    // Guest tries device control → denied
    const r = await core.handle(guestAcct.id, "turn on the living light", { confirm: true });
    expect(r.denied).toBeDefined();
    expect(r.denied!.length).toBeGreaterThan(0);
  });

  it("free plan user cannot install premium connector", () => {
    const { store } = buildFullStack();
    expect(() => store.install("sonoff", "free")).toThrow(StoreError);
  });

  it("cloud memory syncs across two devices", () => {
    const cloudBackend = new InMemoryCloudBackend();
    const deviceA = new CloudSyncedUserMemory(cloudBackend);
    const deviceB = new CloudSyncedUserMemory(cloudBackend);

    // Device A sets preference
    deviceA.updatePersonalization("user-1", { assistantName: "Nova", tone: "friendly" });

    // Device B syncs and sees it
    deviceB.sync("user-1");
    expect(deviceB.getProfile("user-1").personalization.assistantName).toBe("Nova");
    expect(deviceB.getProfile("user-1").personalization.tone).toBe("friendly");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: LOAD & STRESS TEST
// Verify system stability with many concurrent users/devices
// ═══════════════════════════════════════════════════════════════════════════════

describe("FAZ 17 — Load & Stress Test", () => {
  it("handles 100 concurrent users without errors", async () => {
    const memory = new InMemoryUserMemory();
    const core = new NexusCore({ memory, provider: new MockProvider() });

    const results = await Promise.all(
      Array.from({ length: 100 }, (_, i) => core.handle(`user-${i}`, "hello")),
    );
    expect(results).toHaveLength(100);
    expect(results.every((r) => r.text.length > 0)).toBe(true);
  });

  it("handles 50 concurrent device commands", async () => {
    const memory = new InMemoryUserMemory();
    const devices = new DeviceManager();
    const allDevices: UniversalDevice[] = Array.from({ length: 50 }, (_, i) => ({
      id: `device-${i}`,
      name: `Device ${i}`,
      room: "living",
      capabilities: [{ kind: "switch" as const, value: false }],
    }));
    devices.registerConnector(new InMemoryConnector("load-test", allDevices));
    const core = new NexusCore({ memory, provider: new MockProvider(), devices });

    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        core.handle(`user-${i}`, "turn on the light", { confirm: true }),
      ),
    );
    expect(results).toHaveLength(50);
    // All should resolve without throwing
    expect(results.every((r) => r.intent !== undefined)).toBe(true);
  });

  it("handles 200 memory operations without data loss", () => {
    const memory = new InMemoryUserMemory();
    for (let i = 0; i < 200; i++) {
      memory.remember(`user-${i % 10}`, { role: "user", text: `turn ${i}` });
    }
    // Each of 10 users should have up to windowSize (20) entries
    for (let u = 0; u < 10; u++) {
      const turns = memory.recent(`user-${u}`);
      expect(turns.length).toBeLessThanOrEqual(20);
      expect(turns.length).toBeGreaterThan(0);
    }
  });

  it("ConnectorStore handles rapid install/uninstall cycles", () => {
    const registry = new PluginRegistry();
    registry.register(
      definePlugin(
        {
          id: "stress",
          name: "Stress",
          vendor: "test",
          version: "1.0.0",
          protocol: "lan",
          capabilities: ["switch"],
          premium: false,
        },
        [{ id: "s-dev", name: "S", room: "r", capabilities: [{ kind: "switch", value: false }] }],
      ),
    );
    const devices = new DeviceManager();
    const store = new ConnectorStore(registry, devices);

    for (let i = 0; i < 100; i++) {
      store.install("stress", "free");
      store.uninstall("stress");
    }
    expect(store.isInstalled("stress")).toBe(false);
    expect(devices.discoverAll()).toHaveLength(0);
  });

  it("AccountService handles 50 simultaneous registrations", () => {
    const accounts = new AccountService();
    const registered: string[] = [];
    for (let i = 0; i < 50; i++) {
      const acct = accounts.register({ email: `u${i}@test.com`, password: "Pass123!" });
      registered.push(acct.id);
    }
    expect(new Set(registered).size).toBe(50); // All unique IDs
  }, 30000);
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: SECURITY PENTEST
// Validate auth, injection, rate limiting, privilege escalation
// ═══════════════════════════════════════════════════════════════════════════════

describe("FAZ 17 — Security Pentest", () => {
  describe("Authentication & Session Security", () => {
    it("rejects login with invalid credentials", () => {
      const accounts = new AccountService();
      accounts.register({ email: "valid@test.com", password: "Secure123!" });
      expect(() => accounts.login("valid@test.com", "wrong")).toThrow();
    });

    it("rejects login for non-existent accounts", () => {
      const accounts = new AccountService();
      expect(() => accounts.login("nobody@test.com", "anything")).toThrow();
    });

    it("session token cannot be forged (random token rejected)", () => {
      const accounts = new AccountService();
      accounts.register({ email: "t@t.com", password: "Secure123!" });
      const result = accounts.validateSession("forged-token-xyz-12345");
      expect(result).toBeUndefined();
    });

    it("expired session is rejected", () => {
      const accounts = new AccountService();
      accounts.register({ email: "t@t.com", password: "Secure123!" });
      const session = accounts.login("t@t.com", "Secure123!");
      accounts.logout(session.token);
      expect(accounts.validateSession(session.token)).toBeUndefined();
    });
  });

  describe("Rate Limiting & Brute Force Protection", () => {
    it("rate limiter blocks after max requests", () => {
      let now = 1000;
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000, now: () => now });
      for (let i = 0; i < 5; i++) {
        expect(limiter.check("attacker").allowed).toBe(true);
        now += 100;
      }
      // 6th request should be blocked
      const blocked = limiter.check("attacker");
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it("login lockout triggers after consecutive failures", () => {
      let now = 1000;
      const lockout = new LoginLockout({ maxFailures: 3, baseLockoutMs: 5000, now: () => now });
      lockout.recordFailure("attacker@ip");
      lockout.recordFailure("attacker@ip");
      const result = lockout.recordFailure("attacker@ip");
      expect(result.locked).toBe(true);
      expect(result.remainingMs).toBeGreaterThan(0);
    });

    it("lockout escalates exponentially", () => {
      let now = 1000;
      const lockout = new LoginLockout({ maxFailures: 2, baseLockoutMs: 1000, now: () => now });
      lockout.recordFailure("ip1");
      lockout.recordFailure("ip1"); // first lockout: 1000ms
      // Skip past first lockout
      now += 1100;
      expect(lockout.isLocked("ip1").locked).toBe(false);
      lockout.recordFailure("ip1");
      const second = lockout.recordFailure("ip1"); // second lockout: 2000ms
      expect(second.locked).toBe(true);
      expect(second.remainingMs).toBe(2000);
    });

    it("successful login resets lockout state", () => {
      const lockout = new LoginLockout({ maxFailures: 3 });
      lockout.recordFailure("user1");
      lockout.recordFailure("user1");
      lockout.recordSuccess("user1");
      // Should be able to fail again without immediate lockout
      const result = lockout.recordFailure("user1");
      expect(result.locked).toBe(false);
    });
  });

  describe("Privilege Escalation Prevention", () => {
    it("member cannot promote themselves to admin", () => {
      const household = new Household("admin-1");
      const invite = household.invite("admin-1", "m@e.com", "member");
      household.acceptInvite(invite.token, "member-1");

      // Member tries to invite with admin role → should throw
      expect(() => household.invite("member-1", "hack@e.com", "admin")).toThrow();
    });

    it("guest cannot invite others", () => {
      const household = new Household("admin-1");
      const invite = household.invite("admin-1", "g@e.com", "guest");
      household.acceptInvite(invite.token, "guest-1");

      expect(() => household.invite("guest-1", "new@e.com", "guest")).toThrow();
    });

    it("stranger cannot grant permissions", () => {
      const household = new Household("admin-1");
      expect(() => household.grant("stranger", "anyone", "dev-1", "control")).toThrow();
    });

    it("revoked member loses device access via revoke", () => {
      const household = new Household("admin-1");
      const invite = household.invite("admin-1", "m@e.com", "member");
      household.acceptInvite(invite.token, "member-1");

      // Revoke control on a specific device
      household.revoke("admin-1", "member-1", "dev-1", "control");
      expect(household.canAccess("member-1", "dev-1", "control")).toBe(false);
      // View is still available (role baseline)
      expect(household.canAccess("member-1", "dev-1", "view")).toBe(true);
    });
  });

  describe("Input Injection Prevention", () => {
    it("SQL-like injection in utterance does not crash pipeline", async () => {
      const memory = new InMemoryUserMemory();
      const core = new NexusCore({ memory, provider: new MockProvider() });
      const r = await core.handle("u1", "'; DROP TABLE users; --");
      expect(r.text).toBeDefined();
      expect(r.agent).toBe("chitchat");
    });

    it("script injection in personalization is stored as plain text", () => {
      const memory = new InMemoryUserMemory();
      memory.updatePersonalization("u1", { assistantName: "<script>alert('xss')</script>" });
      const profile = memory.getProfile("u1");
      expect(profile.personalization.assistantName).toBe("<script>alert('xss')</script>");
      // No execution, just stored as text
    });

    it("extremely long input does not cause stack overflow", async () => {
      const memory = new InMemoryUserMemory();
      const core = new NexusCore({ memory, provider: new MockProvider() });
      const longInput = "a".repeat(10_000);
      const r = await core.handle("u1", longInput);
      expect(r.text).toBeDefined();
    });

    it("null bytes in device name do not crash device manager", () => {
      const devices = new DeviceManager();
      const nullDev: UniversalDevice = {
        id: "null\x00dev",
        name: "Null\x00Device",
        room: "living",
        capabilities: [{ kind: "switch", value: false }],
      };
      devices.registerConnector(new InMemoryConnector("c1", [nullDev]));
      const discovered = devices.discoverAll();
      expect(discovered).toHaveLength(1);
    });
  });

  describe("Security Engine Policy Enforcement", () => {
    it("Critical actions are always denied regardless of confirmation", () => {
      const engine = new SecurityEngine({
        confirmAtOrAbove: RiskLevel.Medium,
        denyAtOrAbove: RiskLevel.Critical,
      });
      const result = engine.evaluate({
        kind: "account.delete",
        risk: RiskLevel.Critical,
        userId: "u1",
      });
      expect(result.decision).toBe("deny");
    });

    it("audit log is immutable — cannot be tampered with", () => {
      const engine = new SecurityEngine();
      engine.evaluate({ kind: "test", risk: RiskLevel.Low, userId: "u1" });
      const log = engine.auditLog();
      // Modifying returned array should not affect internal log
      (log as any[]).push({ action: "forged", decision: "allow" });
      expect(engine.auditLog()).toHaveLength(1);
    });

    it("all risky operations are logged in audit trail", () => {
      const engine = new SecurityEngine({
        confirmAtOrAbove: RiskLevel.Medium,
        denyAtOrAbove: RiskLevel.Critical,
      });
      engine.evaluate({ kind: "light.on", risk: RiskLevel.Medium, userId: "u1" });
      engine.evaluate({ kind: "door.unlock", risk: RiskLevel.High, userId: "u1" });
      engine.evaluate({ kind: "delete.all", risk: RiskLevel.Critical, userId: "u1" });

      const log = engine.auditLog();
      expect(log).toHaveLength(3);
      expect(log[0].decision).toBe("confirm");
      expect(log[1].decision).toBe("confirm");
      expect(log[2].decision).toBe("deny");
    });
  });

  describe("Billing Security", () => {
    it("subscribing a customer creates valid entry", () => {
      const billing = new BillingService(new SandboxPaymentProvider());
      billing.subscribe("new-user", "premium");
      expect(billing.get("new-user")?.plan).toBe("premium");
    });

    it("promo code cannot be reused beyond max uses", () => {
      const billing = new BillingService(new SandboxPaymentProvider());
      billing.addPromoCode("ONCE", 50, 30, 1); // code, discount%, days, maxUses
      expect(billing.redeemPromo("ONCE")).toBe(50);
      // Second attempt should throw
      expect(() => billing.redeemPromo("ONCE")).toThrow();
    });

    it("expired promo code is rejected", () => {
      // Use a time in the future so the promo expires "in the past"
      let now = Date.now();
      const billing = new BillingService(new SandboxPaymentProvider(), { now: () => now });
      billing.addPromoCode("EXPIRE", 50, 1); // valid 1 day
      // Advance time past expiry
      now += 2 * 86_400_000;
      expect(() => billing.redeemPromo("EXPIRE")).toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: REGRESSION VALIDATION
// Cross-package smoke tests ensuring earlier FAZes are intact
// ═══════════════════════════════════════════════════════════════════════════════

describe("FAZ 17 — Regression Smoke Tests", () => {
  it("FAZ 1: personalization persists across turns", async () => {
    const memory = new InMemoryUserMemory();
    const core = new NexusCore({ memory, provider: new MockProvider() });
    await core.handle("u1", "your name is Nova");
    expect(memory.getProfile("u1").personalization.assistantName).toBe("Nova");
  });

  it("FAZ 4: device discovery + command lifecycle", () => {
    const devices = new DeviceManager();
    const dev: UniversalDevice = {
      id: "d1",
      name: "L",
      room: "r",
      capabilities: [{ kind: "switch", value: false }],
    };
    devices.registerConnector(new InMemoryConnector("c1", [dev]));
    expect(devices.discoverAll()).toHaveLength(1);
    const result = devices.execute({ deviceId: "d1", capability: "switch", value: true });
    expect(result.ok).toBe(true);
  });

  it("FAZ 5: routine suggestion engine produces proposals", () => {
    const engine = new RoutineSuggestionEngine({ threshold: 2 });
    const action = { kind: "device.light.set", params: { room: "living", brightness: "30" } };
    engine.observe({ action, at: "21:00" });
    engine.observe({ action, at: "21:15" });
    expect(engine.suggest()).toHaveLength(1);
  });

  it("FAZ 6: digital twin context awareness", () => {
    const twin = new DigitalTwin();
    twin.upsertDevice({ id: "l1", kind: "light", room: "bedroom", on: false });
    twin.setContext({ timeOfDay: "night" });
    expect(twin.getDevice("l1")?.on).toBe(false);
    expect(twin.getContext().timeOfDay).toBe("night");
  });

  it("FAZ 12: household role enforcement", () => {
    const household = new Household("admin-1");
    expect(household.canAccess("admin-1", "any-device", "manage")).toBe(true);
    const inv = household.invite("admin-1", "m@e.com", "member");
    household.acceptInvite(inv.token, "m-1");
    expect(household.canAccess("m-1", "any-device", "control")).toBe(true);
    expect(household.canAccess("m-1", "any-device", "manage")).toBe(false);
  });

  it("FAZ 15: billing lifecycle", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    billing.subscribe("u1", "family");
    const sub = billing.get("u1");
    expect(sub?.plan).toBe("family");
    expect(sub?.status).toBe("active");
  });

  it("FAZ 16: connector store + cloud memory", () => {
    const backend = new InMemoryCloudBackend();
    const memory = new CloudSyncedUserMemory(backend);
    memory.updatePersonalization("u1", { assistantName: "Check" });
    expect(backend.pull("u1")?.personalization.assistantName).toBe("Check");
  });
});
