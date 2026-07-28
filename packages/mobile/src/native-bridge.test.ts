/**
 * NEXUS AI — FAZ 9 Mobile Native Bridge Tests
 *
 * Comprehensive test suite covering all mobile-native subsystems:
 * - MobileBridge (MockBridge)
 * - PushManager (notifications)
 * - PermissionsManager
 * - MobileVoiceBridge
 * - RemoteConnection
 * - DeepLinkRouter
 * - MobileService (orchestrator)
 */
import { describe, expect, it, beforeEach } from "vitest";
import { MockBridge, NexusNativeBridge } from "./bridge.js";
import { PushManager, DEFAULT_CHANNELS, type NotificationPayload } from "./notifications.js";
import {
  PermissionsManager,
  getDefaultPermissions,
  FEATURE_PERMISSION_MAP,
} from "./permissions.js";
import { MobileVoiceBridge, DEFAULT_VOICE_CONFIG, type VoiceBridgeEvent } from "./voice-bridge.js";
import { RemoteConnection, DEFAULT_CONNECTION_OPTIONS } from "./remote-access.js";
import { DeepLinkRouter } from "./deep-links.js";
import { MobileService } from "./mobile-service.js";

// ─── MobileBridge ────────────────────────────────────────────────────────────

describe("MobileBridge", () => {
  it("MockBridge returns deterministic app info", async () => {
    const bridge = new MockBridge("android");
    const info = await bridge.getAppInfo();
    expect(info.id).toBe("ai.nexus.app");
    expect(info.platform).toBe("android");
    expect(info.version).toBe("3.14.2");
  });

  it("MockBridge tracks haptic calls", async () => {
    const bridge = new MockBridge();
    await bridge.hapticFeedback("light");
    await bridge.hapticFeedback("success");
    expect(bridge.hapticCalls).toEqual(["light", "success"]);
  });

  it("MockBridge secure storage CRUD", async () => {
    const bridge = new MockBridge();
    expect(await bridge.secureGet("token")).toBeNull();
    await bridge.secureSet("token", "abc123");
    expect(await bridge.secureGet("token")).toBe("abc123");
    await bridge.secureRemove("token");
    expect(await bridge.secureGet("token")).toBeNull();
  });

  it("MockBridge clipboard", async () => {
    const bridge = new MockBridge();
    await bridge.setClipboard("nexus://test");
    const clip = await bridge.getClipboard();
    expect(clip.text).toBe("nexus://test");
  });

  it("MockBridge share tracking", async () => {
    const bridge = new MockBridge();
    await bridge.share({ title: "NEXUS", text: "Check this out", url: "https://nexus.ai" });
    expect(bridge.shareCalls).toHaveLength(1);
    expect(bridge.shareCalls[0].title).toBe("NEXUS");
  });

  it("MockBridge lifecycle callbacks", () => {
    const bridge = new MockBridge();
    let resumed = false;
    let paused = false;
    bridge.onResume(() => {
      resumed = true;
    });
    bridge.onPause(() => {
      paused = true;
    });
    bridge.emitResume();
    expect(resumed).toBe(true);
    bridge.emitPause();
    expect(paused).toBe(true);
  });

  it("MockBridge biometric simulation", async () => {
    const bridge = new MockBridge();
    expect(await bridge.isBiometricAvailable()).toBe(true);
    expect(await bridge.authenticateWithBiometric("Confirm")).toBe(true);
    bridge.biometricResult = false;
    expect(await bridge.authenticateWithBiometric("Confirm")).toBe(false);
  });

  it("Nexus native bridge targets correct platform", async () => {
    const bridge = new NexusNativeBridge("ios");
    expect(bridge.platform).toBe("ios");
    const info = await bridge.getAppInfo();
    expect(info.platform).toBe("ios");
  });

  it("MockBridge reset clears all state", async () => {
    const bridge = new MockBridge();
    await bridge.hapticFeedback("heavy");
    await bridge.secureSet("key", "val");
    bridge.reset();
    expect(bridge.hapticCalls).toHaveLength(0);
    expect(bridge.storage.size).toBe(0);
  });
});

// ─── Push Notifications ──────────────────────────────────────────────────────

describe("PushManager", () => {
  let bridge: MockBridge;
  let push: PushManager;

  beforeEach(() => {
    bridge = new MockBridge("android");
    push = new PushManager(bridge);
  });

  it("starts unregistered", () => {
    expect(push.isRegistered).toBe(false);
    expect(push.currentToken).toBeNull();
  });

  it("registers and obtains a token", async () => {
    const token = await push.register();
    expect(push.isRegistered).toBe(true);
    expect(token.platform).toBe("android");
    expect(token.value).toContain("android_token_");
  });

  it("unregisters correctly", async () => {
    await push.register();
    await push.unregister();
    expect(push.isRegistered).toBe(false);
    expect(push.currentToken).toBeNull();
  });

  it("dispatches foreground notifications to handlers", () => {
    const received: NotificationPayload[] = [];
    push.onNotification((p) => received.push(p));

    push.dispatchNotification({
      id: "n1",
      title: "Door Unlocked",
      body: "Front door was unlocked",
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
    expect(received[0].title).toBe("Door Unlocked");
  });

  it("dispatches action notifications (tapped) to action handlers", () => {
    const actions: NotificationPayload[] = [];
    push.onAction((p) => actions.push(p));

    push.dispatchNotification({
      id: "n2",
      title: "Scene Ready",
      body: "Tap to activate",
      actionId: "activate",
      data: { scene: "Movie Night" },
      timestamp: Date.now(),
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].actionId).toBe("activate");
  });

  it("maps notification data to NEXUS intents", () => {
    expect(push.mapToIntent({ id: "1", title: "", body: "", timestamp: 0 })).toBeNull();
    expect(
      push.mapToIntent({
        id: "2",
        title: "",
        body: "",
        data: { intent: "turn off lights" },
        timestamp: 0,
      }),
    ).toBe("turn off lights");
    expect(
      push.mapToIntent({ id: "3", title: "", body: "", data: { device: "lamp-1" }, timestamp: 0 }),
    ).toBe("control device lamp-1");
    expect(
      push.mapToIntent({ id: "4", title: "", body: "", data: { scene: "Relax" }, timestamp: 0 }),
    ).toBe("activate scene Relax");
  });

  it("has default notification channels", () => {
    expect(DEFAULT_CHANNELS.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_CHANNELS.find((c) => c.id === "nexus_home")).toBeDefined();
    expect(DEFAULT_CHANNELS.find((c) => c.id === "nexus_system")).toBeDefined();
  });

  it("handles token refresh", async () => {
    await push.register();
    const refreshed: string[] = [];
    push.onTokenRefresh((t) => refreshed.push(t.value));
    push.refreshToken("new_token_xyz");
    expect(refreshed).toEqual(["new_token_xyz"]);
    expect(push.currentToken?.value).toBe("new_token_xyz");
  });

  it("supports unsubscribe from handlers", () => {
    const received: string[] = [];
    const unsub = push.onNotification((p) => received.push(p.id));
    push.dispatchNotification({ id: "a", title: "", body: "", timestamp: 0 });
    unsub();
    push.dispatchNotification({ id: "b", title: "", body: "", timestamp: 0 });
    expect(received).toEqual(["a"]);
  });
});

// ─── Permissions ─────────────────────────────────────────────────────────────

describe("PermissionsManager", () => {
  it("initializes with default permissions for iOS", () => {
    const mgr = new PermissionsManager("ios");
    const entries = mgr.getAllEntries();
    expect(entries.length).toBeGreaterThanOrEqual(7);
    // iOS-specific: local_network
    expect(mgr.getEntry("local_network")).toBeDefined();
    expect(mgr.getEntry("local_network")?.critical).toBe(true);
  });

  it("initializes with default permissions for Android", () => {
    const mgr = new PermissionsManager("android");
    // Android doesn't have local_network or motion
    expect(mgr.getEntry("local_network")).toBeUndefined();
    expect(mgr.getEntry("motion")).toBeUndefined();
  });

  it("all permissions start as 'prompt'", () => {
    const mgr = new PermissionsManager("ios");
    for (const entry of mgr.getAllEntries()) {
      expect(entry.status).toBe("prompt");
    }
  });

  it("request grants a permission", async () => {
    const mgr = new PermissionsManager("ios");
    const result = await mgr.request("microphone");
    expect(result.granted).toBe(true);
    expect(result.previousStatus).toBe("prompt");
    expect(result.newStatus).toBe("granted");
    expect(mgr.isGranted("microphone")).toBe(true);
  });

  it("checks feature readiness", async () => {
    const mgr = new PermissionsManager("ios");
    expect(mgr.isFeatureReady("voice-interaction")).toBe(false);
    await mgr.request("microphone");
    expect(mgr.isFeatureReady("voice-interaction")).toBe(true);
  });

  it("returns missing permissions for a feature", () => {
    const mgr = new PermissionsManager("ios");
    const missing = mgr.getMissingForFeature("home-automation");
    expect(missing).toContain("bluetooth");
    expect(missing).toContain("local_network");
    expect(missing).toContain("location");
  });

  it("requestForFeature grants all needed permissions", async () => {
    const mgr = new PermissionsManager("ios");
    const results = await mgr.requestForFeature("voice-interaction");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("microphone");
    expect(mgr.isFeatureReady("voice-interaction")).toBe(true);
  });

  it("getCriticalMissing reports iOS local_network", () => {
    const mgr = new PermissionsManager("ios");
    const critical = mgr.getCriticalMissing();
    expect(critical.length).toBeGreaterThanOrEqual(1);
    expect(critical[0].name).toBe("local_network");
  });

  it("setStatus manually updates a permission", () => {
    const mgr = new PermissionsManager("ios");
    mgr.setStatus("microphone", "denied");
    expect(mgr.getStatus("microphone")).toBe("denied");
    expect(mgr.isGranted("microphone")).toBe(false);
  });

  it("FEATURE_PERMISSION_MAP covers all core features", () => {
    const features = FEATURE_PERMISSION_MAP.map((f) => f.feature);
    expect(features).toContain("voice-interaction");
    expect(features).toContain("home-automation");
    expect(features).toContain("geofencing");
    expect(features).toContain("notifications");
    expect(features).toContain("secure-auth");
  });

  it("getDefaultPermissions returns entries with rationales", () => {
    const perms = getDefaultPermissions("ios");
    for (const p of perms) {
      expect(p.rationale.length).toBeGreaterThan(10);
      expect(p.requiredBy.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─── Voice Bridge ────────────────────────────────────────────────────────────

describe("MobileVoiceBridge", () => {
  let bridge: MockBridge;
  let voice: MobileVoiceBridge;

  beforeEach(() => {
    bridge = new MockBridge("ios");
    voice = new MobileVoiceBridge(bridge);
  });

  it("starts inactive", () => {
    expect(voice.state).toBe("inactive");
    expect(voice.activeSession).toBeNull();
    expect(voice.history).toHaveLength(0);
  });

  it("has default config", () => {
    expect(voice.currentConfig.sampleRate).toBe(DEFAULT_VOICE_CONFIG.sampleRate);
    expect(voice.currentConfig.wakeWordEnabled).toBe(true);
  });

  it("activates audio session", async () => {
    await voice.activateAudioSession();
    expect(voice.state).toBe("active");
  });

  it("starts listening and creates session", async () => {
    const session = await voice.startListening("manual");
    expect(session.state).toBe("listening");
    expect(session.trigger).toBe("manual");
    expect(voice.activeSession).toBe(session);
    // Haptic feedback is triggered
    expect(bridge.hapticCalls).toContain("light");
  });

  it("full voice session lifecycle", async () => {
    const events: VoiceBridgeEvent[] = [];
    voice.on((e) => events.push(e));

    const session = await voice.startListening();
    expect(session.state).toBe("listening");

    await voice.processAudio("turn on kitchen lights");
    expect(voice.activeSession?.transcript).toBe("turn on kitchen lights");
    expect(voice.activeSession?.state).toBe("processing");

    await voice.speak("Turning on kitchen lights");
    expect(voice.activeSession?.response).toBe("Turning on kitchen lights");
    expect(voice.activeSession?.state).toBe("speaking");

    const completed = await voice.endSession();
    expect(completed?.state).toBe("complete");
    expect(completed?.endedAt).not.toBeNull();
    expect(voice.activeSession).toBeNull();
    expect(voice.history).toHaveLength(1);

    expect(events.some((e) => e.type === "session-start")).toBe(true);
    expect(events.some((e) => e.type === "session-end")).toBe(true);
  });

  it("cancels session on interrupt", async () => {
    await voice.startListening();
    voice.handleInterrupt("phone-call");
    expect(voice.state).toBe("interrupted");
    expect(voice.activeSession).toBeNull();
    expect(voice.history[0].state).toBe("cancelled");
  });

  it("wake word triggers listening", async () => {
    const events: VoiceBridgeEvent[] = [];
    voice.on((e) => events.push(e));

    const session = await voice.onWakeWordDetected();
    expect(session.trigger).toBe("wake-word");
    expect(events.some((e) => e.type === "wake-word-detected")).toBe(true);
  });

  it("updateConfig changes settings", () => {
    voice.updateConfig({ sampleRate: 44100, continuousListening: true });
    expect(voice.currentConfig.sampleRate).toBe(44100);
    expect(voice.currentConfig.continuousListening).toBe(true);
  });

  it("deactivates audio after session end (non-continuous)", async () => {
    await voice.startListening();
    await voice.endSession();
    expect(voice.state).toBe("inactive");
  });
});

// ─── Remote Access ───────────────────────────────────────────────────────────

describe("RemoteConnection", () => {
  let bridge: MockBridge;
  let remote: RemoteConnection;

  beforeEach(() => {
    bridge = new MockBridge("ios");
    remote = new RemoteConnection(bridge);
  });

  it("starts disconnected", () => {
    expect(remote.state).toBe("disconnected");
    expect(remote.isConnected).toBe(false);
  });

  it("fails to connect without endpoint", async () => {
    const result = await remote.connect();
    expect(result).toBe(false);
    expect(remote.state).toBe("error");
  });

  it("fails to connect without auth token", async () => {
    remote.configure({
      localAddress: "192.168.1.100:8443",
      relayAddress: "relay.nexus.ai",
      serverId: "srv-1",
    });
    const result = await remote.connect();
    expect(result).toBe(false);
    expect(remote.state).toBe("error");
  });

  it("connects locally on Wi-Fi with auth token", async () => {
    remote.configure({
      localAddress: "192.168.1.100:8443",
      relayAddress: "relay.nexus.ai",
      serverId: "srv-1",
    });
    await bridge.secureSet("nexus_auth_token", "valid_token");

    const events: string[] = [];
    remote.on((e) => events.push(e.type));

    const result = await remote.connect();
    expect(result).toBe(true);
    expect(remote.state).toBe("connected_local");
    expect(remote.isConnected).toBe(true);
    expect(events).toContain("connected");
  });

  it("falls back to remote when not on Wi-Fi", async () => {
    bridge.networkStatus = { connected: true, type: "cellular" };
    remote.configure({
      localAddress: "192.168.1.100:8443",
      relayAddress: "relay.nexus.ai",
      serverId: "srv-1",
    });
    remote.setAuthToken("token_abc");

    const result = await remote.connect();
    expect(result).toBe(true);
    expect(remote.state).toBe("connected_remote");
  });

  it("sends requests when connected", async () => {
    bridge.networkStatus = { connected: true, type: "wifi" };
    remote.configure({
      localAddress: "192.168.1.100:8443",
      relayAddress: "relay.nexus.ai",
      serverId: "srv-1",
    });
    remote.setAuthToken("token");
    await remote.connect();

    const response = await remote.sendRequest("intent", { text: "turn on lights" });
    expect(response.success).toBe(true);
    expect(response.latency).toBeGreaterThan(0);
    expect(remote.requestCount).toBe(1);
  });

  it("heartbeat works when connected", async () => {
    remote.configure({
      localAddress: "192.168.1.100:8443",
      relayAddress: "relay.nexus.ai",
      serverId: "srv-1",
    });
    remote.setAuthToken("token");
    await remote.connect();

    const alive = await remote.heartbeat();
    expect(alive).toBe(true);
    expect(remote.lastPing).toBeGreaterThan(0);
  });

  it("disconnects cleanly", async () => {
    remote.configure({
      localAddress: "192.168.1.100:8443",
      relayAddress: "relay.nexus.ai",
      serverId: "srv-1",
    });
    remote.setAuthToken("token");
    await remote.connect();
    await remote.disconnect();
    expect(remote.state).toBe("disconnected");
    expect(remote.isConnected).toBe(false);
  });

  it("DEFAULT_CONNECTION_OPTIONS has sensible defaults", () => {
    expect(DEFAULT_CONNECTION_OPTIONS.timeout).toBe(5000);
    expect(DEFAULT_CONNECTION_OPTIONS.heartbeatInterval).toBe(30000);
    expect(DEFAULT_CONNECTION_OPTIONS.maxReconnectAttempts).toBe(10);
  });
});

// ─── Deep Links ──────────────────────────────────────────────────────────────

describe("DeepLinkRouter", () => {
  let router: DeepLinkRouter;

  beforeEach(() => {
    router = new DeepLinkRouter();
  });

  it("parses intent deep links", () => {
    const result = router.parse("nexus://intent/turn%20on%20lights");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("intent");
    expect(result.intent).toBe("turn on lights");
  });

  it("parses device command deep links", () => {
    const result = router.parse("nexus://device/lamp-1/toggle");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("device-command");
    expect(result.params.deviceId).toBe("lamp-1");
    expect(result.params.command).toBe("toggle");
    expect(result.intent).toBe("toggle device lamp-1");
    expect(result.screen).toBe("devices");
  });

  it("parses scene deep links", () => {
    const result = router.parse("nexus://scene/Movie%20Night");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("scene");
    expect(result.intent).toBe("activate scene Movie Night");
  });

  it("parses screen navigation deep links", () => {
    const result = router.parse("nexus://screen/devices");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("screen");
    expect(result.screen).toBe("devices");
    expect(result.intent).toBeNull();
  });

  it("parses routine deep links", () => {
    const result = router.parse("nexus://routine/morning-routine/run");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("routine");
    expect(result.params.routineId).toBe("morning-routine");
    expect(result.intent).toBe("run routine morning-routine");
  });

  it("parses auth callback deep links", () => {
    const result = router.parse("nexus://auth/callback?code=abc123&state=xyz");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("auth-callback");
    expect(result.params.code).toBe("abc123");
    expect(result.params.state).toBe("xyz");
  });

  it("parses pair deep links", () => {
    const result = router.parse("nexus://pair/QR123456");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("pair");
    expect(result.params.code).toBe("QR123456");
  });

  it("parses Universal Links", () => {
    const result = router.parse("https://nexus.ai/open/check%20weather");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("intent");
    expect(result.intent).toBe("check weather");
  });

  it("returns invalid for unknown URLs", () => {
    const result = router.parse("https://example.com/something");
    expect(result.valid).toBe(false);
    expect(result.action).toBe("unknown");
  });

  it("handle dispatches to handlers and records history", () => {
    const received: string[] = [];
    router.onDeepLink((r) => received.push(r.action));

    router.handle("nexus://intent/hello");
    router.handle("nexus://scene/Relax");

    expect(received).toEqual(["intent", "scene"]);
    expect(router.getHistory()).toHaveLength(2);
    expect(router.lastLink?.action).toBe("scene");
  });

  it("generateUrl creates correct URLs", () => {
    expect(DeepLinkRouter.generateUrl("intent", { text: "hello world" })).toBe(
      "nexus://intent/hello%20world",
    );
    expect(DeepLinkRouter.generateUrl("device-command", { deviceId: "tv-1", command: "off" })).toBe(
      "nexus://device/tv-1/off",
    );
    expect(DeepLinkRouter.generateUrl("scene", { name: "Movie Night" })).toBe(
      "nexus://scene/Movie%20Night",
    );
    expect(DeepLinkRouter.generateUrl("screen", { screenId: "today" })).toBe(
      "nexus://screen/today",
    );
    expect(DeepLinkRouter.generateUrl("routine", { routineId: "bedtime" })).toBe(
      "nexus://routine/bedtime/run",
    );
  });

  it("clearHistory resets", () => {
    router.handle("nexus://intent/test");
    router.clearHistory();
    expect(router.getHistory()).toHaveLength(0);
    expect(router.lastLink).toBeNull();
  });
});

// ─── MobileService (Orchestrator) ───────────────────────────────────────────

describe("MobileService", () => {
  let bridge: MockBridge;
  let service: MobileService;

  beforeEach(() => {
    bridge = new MockBridge("ios");
    service = new MobileService(bridge, {
      server: {
        localAddress: "192.168.1.100:8443",
        relayAddress: "relay.nexus.ai",
        serverId: "srv-1",
      },
      autoRegisterPush: true,
      initialPermissions: ["notifications", "microphone"],
    });
  });

  it("starts in initializing state", () => {
    expect(service.state).toBe("initializing");
    expect(service.platform).toBe("ios");
  });

  it("init bootstraps all subsystems", async () => {
    await bridge.secureSet("nexus_auth_token", "valid");
    await service.init();

    expect(service.state).toBe("ready");
    expect(service.isReady).toBe(true);
    // Permissions were requested
    expect(service.permissions.isGranted("notifications")).toBe(true);
    expect(service.permissions.isGranted("microphone")).toBe(true);
    // Push was registered (since autoRegisterPush = true and notifications granted)
    expect(service.push.isRegistered).toBe(true);
    // Remote connected (Wi-Fi + token available)
    expect(service.remote.isConnected).toBe(true);
  });

  it("processIntent emits intent event and forwards to remote", async () => {
    await bridge.secureSet("nexus_auth_token", "valid");
    await service.init();

    const events: string[] = [];
    service.on((e) => {
      if (e.type === "intent") events.push(e.text);
    });

    await service.processIntent("turn on lights", "voice");
    expect(events).toEqual(["turn on lights"]);
    expect(service.remote.requestCount).toBeGreaterThan(0);
  });

  it("handleDeepLink processes URL and triggers intent", async () => {
    await bridge.secureSet("nexus_auth_token", "valid");
    await service.init();

    const intents: string[] = [];
    service.on((e) => {
      if (e.type === "intent") intents.push(e.text);
    });

    const result = service.handleDeepLink("nexus://scene/Relax");
    expect(result.valid).toBe(true);
    expect(result.action).toBe("scene");

    // Allow async intent processing
    await new Promise((r) => setTimeout(r, 10));
    expect(intents).toContain("activate scene Relax");
  });

  it("handleNotification dispatches and maps to intent on action", async () => {
    await bridge.secureSet("nexus_auth_token", "valid");
    await service.init();

    const intents: string[] = [];
    service.on((e) => {
      if (e.type === "intent") intents.push(e.text);
    });

    service.handleNotification({
      id: "n1",
      title: "Scene Ready",
      body: "Tap to activate",
      actionId: "tap",
      data: { scene: "Bedtime" },
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(intents).toContain("activate scene Bedtime");
  });

  it("lifecycle: resume and pause", async () => {
    await bridge.secureSet("nexus_auth_token", "valid");
    await service.init();

    const states: string[] = [];
    service.on((e) => {
      if (e.type === "lifecycle") states.push(e.state);
    });

    bridge.emitResume();
    expect(service.state).toBe("active");
    bridge.emitPause();
    expect(service.state).toBe("background");
    expect(states).toEqual(["active", "background"]);
  });

  it("shutdown terminates cleanly", async () => {
    await bridge.secureSet("nexus_auth_token", "valid");
    await service.init();
    await service.shutdown();
    expect(service.state).toBe("terminated");
    expect(service.remote.isConnected).toBe(false);
  });

  it("exposes all subsystem references", () => {
    expect(service.push).toBeInstanceOf(PushManager);
    expect(service.permissions).toBeInstanceOf(PermissionsManager);
    expect(service.voice).toBeInstanceOf(MobileVoiceBridge);
    expect(service.remote).toBeInstanceOf(RemoteConnection);
    expect(service.deepLinks).toBeInstanceOf(DeepLinkRouter);
  });
});

// ─── FAZ 9 Bitiş Kriteri ────────────────────────────────────────────────────

describe("FAZ 9 — Bitiş Kriteri", () => {
  it("mobile UI renderer exports are intact (packages/mobile)", async () => {
    const mod = await import("./index.js");
    expect(mod.moduleName).toBe("mobile");
    expect(mod.implemented).toBe(true);
    expect(typeof mod.renderMobileDocument).toBe("function");
    expect(typeof mod.renderTabBar).toBe("function");
  });

  it("native bridge layer is fully exported", async () => {
    const mod = await import("./index.js");
    // All FAZ 9 classes exist
    expect(mod.MockBridge).toBeDefined();
    expect(mod.NexusNativeBridge).toBeDefined(); // Nexus native bridge class
    expect(mod.PushManager).toBeDefined();
    expect(mod.PermissionsManager).toBeDefined();
    expect(mod.MobileVoiceBridge).toBeDefined();
    expect(mod.RemoteConnection).toBeDefined();
    expect(mod.DeepLinkRouter).toBeDefined();
    expect(mod.MobileService).toBeDefined();
  });

  it("supports both iOS and Android platforms", () => {
    const iosBridge = new MockBridge("ios");
    const androidBridge = new MockBridge("android");
    expect(iosBridge.platform).toBe("ios");
    expect(androidBridge.platform).toBe("android");

    const iosPerms = new PermissionsManager("ios");
    const androidPerms = new PermissionsManager("android");
    // iOS has more permissions (local_network, motion)
    expect(iosPerms.getAllEntries().length).toBeGreaterThan(androidPerms.getAllEntries().length);
  });

  it("full end-to-end scenario: wake word → intent → device command", async () => {
    const bridge = new MockBridge("ios");
    await bridge.secureSet("nexus_auth_token", "token");

    const service = new MobileService(bridge, {
      server: {
        localAddress: "192.168.1.100:8443",
        relayAddress: "relay.nexus.ai",
        serverId: "srv-1",
      },
    });
    await service.init();

    // Simulate wake word detection → voice session → intent
    const session = await service.voice.onWakeWordDetected();
    expect(session.trigger).toBe("wake-word");

    await service.voice.processAudio("turn on living room lights");
    await service.voice.speak("Turning on living room lights");
    await service.voice.endSession();

    // The voice session transcript is captured
    expect(service.voice.history[0].transcript).toBe("turn on living room lights");
    expect(service.voice.history[0].response).toBe("Turning on living room lights");
  });

  it("full end-to-end scenario: deep link → remote command", async () => {
    const bridge = new MockBridge("android");
    await bridge.secureSet("nexus_auth_token", "token");

    const service = new MobileService(bridge, {
      server: {
        localAddress: "192.168.1.100:8443",
        relayAddress: "relay.nexus.ai",
        serverId: "srv-1",
      },
    });
    await service.init();

    const intents: string[] = [];
    service.on((e) => {
      if (e.type === "intent") intents.push(e.text);
    });

    service.handleDeepLink("nexus://device/thermostat-1/set-temp-22");
    await new Promise((r) => setTimeout(r, 10));

    expect(intents).toContain("set-temp-22 device thermostat-1");
    expect(service.remote.requestCount).toBeGreaterThan(0);
  });

  it("full end-to-end scenario: push notification → intent processing", async () => {
    const bridge = new MockBridge("ios");
    await bridge.secureSet("nexus_auth_token", "token");

    const service = new MobileService(bridge, {
      server: {
        localAddress: "192.168.1.100:8443",
        relayAddress: "relay.nexus.ai",
        serverId: "srv-1",
      },
    });
    await service.init();

    const intents: string[] = [];
    service.on((e) => {
      if (e.type === "intent") intents.push(e.text);
    });

    service.handleNotification({
      id: "alert-1",
      title: "Security Alert",
      body: "Motion detected at front door",
      actionId: "view",
      data: { intent: "show security camera front-door" },
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(intents).toContain("show security camera front-door");
  });
});
