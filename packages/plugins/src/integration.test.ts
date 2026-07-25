/**
 * NEXUS AI — FAZ 4 Integration Test
 *
 * Bitiş Kriteri: "Sahte broker'a bağlanan üç farklı markanın adaptörü,
 * keşif–yetki–durum–komut döngüsünü tamamlıyor."
 *
 * This test verifies the full discover–authorize–status–command lifecycle
 * for IKEA (Zigbee), Xiaomi (Wi-Fi), and Sonoff (MQTT) connectors,
 * all communicating through the same FakeBroker.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { FakeBroker, DeviceManager } from "@nexus/devices";
import { IkeaConnector } from "./ikea.js";
import { XiaomiConnector } from "./xiaomi.js";
import { SonoffConnector } from "./sonoff.js";

describe("FAZ 4 Bitiş Kriteri — 3 brand discover–authorize–status–command cycle", () => {
  let broker: FakeBroker;
  let manager: DeviceManager;
  let ikea: IkeaConnector;
  let xiaomi: XiaomiConnector;
  let sonoff: SonoffConnector;

  beforeEach(() => {
    broker = new FakeBroker();
    manager = new DeviceManager();

    // Create connectors connected to the shared broker
    ikea = new IkeaConnector(broker);
    xiaomi = new XiaomiConnector(broker);
    sonoff = new SonoffConnector(broker);

    // Register all connectors with the device manager
    manager.registerConnector(ikea);
    manager.registerConnector(xiaomi);
    manager.registerConnector(sonoff);
  });

  // ── STEP 1: Discovery ────────────────────────────────────────────────────

  describe("Step 1: Device Discovery", () => {
    it("IKEA discovers 3 Zigbee devices via broker", () => {
      const devices = ikea.discover();
      expect(devices.length).toBe(3);
      expect(devices.map((d) => d.manufacturer)).toContain("IKEA");
      // Broker also knows about them
      expect(broker.getDevicesByBrand("ikea").length).toBe(3);
    });

    it("Xiaomi discovers 3 Wi-Fi/BLE devices via broker", () => {
      const devices = xiaomi.discover();
      expect(devices.length).toBe(3);
      expect(devices.some((d) => d.manufacturer === "Aqara")).toBe(true);
      expect(broker.getDevicesByBrand("xiaomi").length).toBe(3);
    });

    it("Sonoff discovers 3 MQTT devices via broker", () => {
      const devices = sonoff.discover();
      expect(devices.length).toBe(3);
      expect(devices.every((d) => d.manufacturer === "Sonoff")).toBe(true);
      expect(broker.getDevicesByBrand("sonoff").length).toBe(3);
    });

    it("DeviceManager aggregates all 9 devices across 3 brands", () => {
      const all = manager.discoverAll();
      expect(all.length).toBe(9);
      const brands = new Set(all.map((d) => d.manufacturer));
      expect(brands.size).toBeGreaterThanOrEqual(3); // IKEA, Xiaomi/Aqara, Sonoff
    });
  });

  // ── STEP 2: Authorization ────────────────────────────────────────────────

  describe("Step 2: Authorization (Pairing)", () => {
    it("IKEA rejects invalid credentials", () => {
      const result = ikea.authorize({ type: "pin", value: "ab" });
      expect(result.success).toBe(false);
      expect(ikea.authorized).toBe(false);
    });

    it("IKEA authorizes with valid DIRIGERA hub code", () => {
      const result = ikea.authorize({ type: "pin", value: "DIRIGERA-ABC123" });
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(ikea.authorized).toBe(true);
    });

    it("Xiaomi authorizes with valid Mi Home token", () => {
      const result = xiaomi.authorize({ type: "token", value: "mi-cloud-token-xyz" });
      expect(result.success).toBe(true);
      expect(xiaomi.authorized).toBe(true);
    });

    it("Sonoff authorizes with valid eWeLink API key", () => {
      const result = sonoff.authorize({ type: "api_key", value: "ewelink-api-key-123" });
      expect(result.success).toBe(true);
      expect(sonoff.authorized).toBe(true);
    });

    it("broker tracks authorization for each brand", () => {
      ikea.authorize({ type: "pin", value: "DIRIGERA-ABC123" });
      xiaomi.authorize({ type: "token", value: "mi-cloud-token-xyz" });
      sonoff.authorize({ type: "api_key", value: "ewelink-api-key-123" });

      // All brand devices are now authorized on the broker
      const ikeaDevices = broker.getDevicesByBrand("ikea");
      expect(ikeaDevices.every((d) => d.authorized)).toBe(true);
      const xiaomiDevices = broker.getDevicesByBrand("xiaomi");
      expect(xiaomiDevices.every((d) => d.authorized)).toBe(true);
      const sonoffDevices = broker.getDevicesByBrand("sonoff");
      expect(sonoffDevices.every((d) => d.authorized)).toBe(true);
    });
  });

  // ── STEP 3: Status Reading ───────────────────────────────────────────────

  describe("Step 3: Status Reading", () => {
    beforeEach(() => {
      ikea.authorize({ type: "pin", value: "DIRIGERA-ABC123" });
      xiaomi.authorize({ type: "token", value: "mi-cloud-token-xyz" });
      sonoff.authorize({ type: "api_key", value: "ewelink-api-key-123" });
    });

    it("IKEA reads device status with current state", () => {
      const status = ikea.status("ikea-bulb-1");
      expect(status).toBeDefined();
      expect(status!.online).toBe(true);
      expect(status!.state.switch).toBe(false);
      expect(status!.state.brightness).toBe(100);
    });

    it("Xiaomi reads sensor status", () => {
      const status = xiaomi.status("xiaomi-sensor-1");
      expect(status).toBeDefined();
      expect(status!.online).toBe(true);
      expect(status!.state.temperature).toBe(22.5);
      expect(status!.state.humidity).toBe(55);
    });

    it("Sonoff reads power monitoring status", () => {
      const status = sonoff.status("sonoff-pow-1");
      expect(status).toBeDefined();
      expect(status!.online).toBe(true);
      expect(status!.state.switch).toBe(true);
      expect(status!.state.power).toBe(1250);
    });

    it("returns undefined for unknown device", () => {
      expect(ikea.status("nonexistent")).toBeUndefined();
      expect(xiaomi.status("nonexistent")).toBeUndefined();
      expect(sonoff.status("nonexistent")).toBeUndefined();
    });
  });

  // ── STEP 4: Command Execution ────────────────────────────────────────────

  describe("Step 4: Command Execution", () => {
    beforeEach(() => {
      ikea.authorize({ type: "pin", value: "DIRIGERA-ABC123" });
      xiaomi.authorize({ type: "token", value: "mi-cloud-token-xyz" });
      sonoff.authorize({ type: "api_key", value: "ewelink-api-key-123" });
    });

    it("commands fail without authorization", () => {
      const unauth = new IkeaConnector(broker);
      // Note: This is a NEW unauth connector — the previously authorized broker
      // state doesn't apply to this connector instance
      const result = unauth.execute({ deviceId: "ikea-bulb-1", capability: "switch", value: true });
      expect(result.ok).toBe(false);
      expect(result.message).toContain("Not authorized");
    });

    it("IKEA: turn on a light", () => {
      const result = manager.execute({ deviceId: "ikea-bulb-1", capability: "switch", value: true });
      expect(result.ok).toBe(true);
      expect(result.device.capabilities.find((c) => c.kind === "switch")!.value).toBe(true);
      // Broker state is also updated
      expect(broker.getDeviceState("ikea-bulb-1")!.switch).toBe(true);
    });

    it("IKEA: set brightness", () => {
      const result = manager.execute({ deviceId: "ikea-bulb-1", capability: "brightness", value: 150 });
      expect(result.ok).toBe(true);
      expect(broker.getDeviceState("ikea-bulb-1")!.brightness).toBe(150);
    });

    it("Xiaomi: turn on smart plug", () => {
      const result = manager.execute({ deviceId: "xiaomi-plug-1", capability: "switch", value: true });
      expect(result.ok).toBe(true);
      expect(broker.getDeviceState("xiaomi-plug-1")!.switch).toBe(true);
    });

    it("Xiaomi: adjust light brightness", () => {
      const result = manager.execute({ deviceId: "xiaomi-bulb-1", capability: "brightness", value: 50 });
      expect(result.ok).toBe(true);
      expect(broker.getDeviceState("xiaomi-bulb-1")!.brightness).toBe(50);
    });

    it("Sonoff: toggle switch", () => {
      const result = manager.execute({ deviceId: "sonoff-basic-1", capability: "switch", value: true });
      expect(result.ok).toBe(true);
      expect(broker.getDeviceState("sonoff-basic-1")!.switch).toBe(true);
    });

    it("Sonoff: turn off power monitoring device", () => {
      const result = manager.execute({ deviceId: "sonoff-pow-1", capability: "switch", value: false });
      expect(result.ok).toBe(true);
      expect(broker.getDeviceState("sonoff-pow-1")!.switch).toBe(false);
    });
  });

  // ── FULL LIFECYCLE ───────────────────────────────────────────────────────

  describe("Full lifecycle: discover → authorize → status → command", () => {
    it("IKEA completes full cycle", () => {
      // 1. Discover
      const devices = ikea.discover();
      expect(devices.length).toBeGreaterThan(0);

      // 2. Authorize
      const auth = ikea.authorize({ type: "pin", value: "DIRIGERA-HUB-PIN" });
      expect(auth.success).toBe(true);

      // 3. Status
      const status = ikea.status(devices[0]!.id);
      expect(status).toBeDefined();
      expect(status!.online).toBe(true);

      // 4. Command
      const cmd = ikea.execute({ deviceId: devices[0]!.id, capability: "switch", value: true });
      expect(cmd.ok).toBe(true);

      // Verify state changed
      const newStatus = ikea.status(devices[0]!.id);
      expect(newStatus!.state.switch).toBe(true);
    });

    it("Xiaomi completes full cycle", () => {
      const devices = xiaomi.discover();
      expect(devices.length).toBeGreaterThan(0);

      const auth = xiaomi.authorize({ type: "token", value: "mi-home-valid-token" });
      expect(auth.success).toBe(true);

      const status = xiaomi.status(devices[0]!.id);
      expect(status).toBeDefined();

      const cmd = xiaomi.execute({ deviceId: devices[0]!.id, capability: "switch", value: false });
      expect(cmd.ok).toBe(true);

      const newStatus = xiaomi.status(devices[0]!.id);
      expect(newStatus!.state.switch).toBe(false);
    });

    it("Sonoff completes full cycle", () => {
      const devices = sonoff.discover();
      expect(devices.length).toBeGreaterThan(0);

      const auth = sonoff.authorize({ type: "api_key", value: "ewelink-secret-key" });
      expect(auth.success).toBe(true);

      const status = sonoff.status(devices[0]!.id);
      expect(status).toBeDefined();

      const cmd = sonoff.execute({ deviceId: devices[0]!.id, capability: "switch", value: true });
      expect(cmd.ok).toBe(true);

      const newStatus = sonoff.status(devices[0]!.id);
      expect(newStatus!.state.switch).toBe(true);
    });
  });

  // ── BROKER PUB/SUB ───────────────────────────────────────────────────────

  describe("Broker message flow", () => {
    it("tracks device online messages during registration", () => {
      const history = broker.getHistory("devices/");
      // Each connector registers its devices → online messages
      expect(history.length).toBeGreaterThanOrEqual(9);
      expect(history.some((m) => m.topic.includes("ikea"))).toBe(true);
      expect(history.some((m) => m.topic.includes("xiaomi"))).toBe(true);
      expect(history.some((m) => m.topic.includes("sonoff"))).toBe(true);
    });

    it("publishes state updates on command execution", () => {
      ikea.authorize({ type: "pin", value: "valid-pin-code" });
      ikea.execute({ deviceId: "ikea-bulb-1", capability: "switch", value: true });

      const stateMessages = broker.getHistory("devices/ikea/ikea-bulb-1/state");
      expect(stateMessages.length).toBeGreaterThan(0);
      const lastMsg = stateMessages[stateMessages.length - 1]!;
      expect((lastMsg.payload as Record<string, unknown>).switch).toBe(true);
    });

    it("subscribers receive state change notifications", () => {
      const received: unknown[] = [];
      broker.subscribe("devices/sonoff/#", (msg) => {
        received.push(msg.payload);
      });

      sonoff.authorize({ type: "api_key", value: "valid-api-key" });
      sonoff.execute({ deviceId: "sonoff-basic-1", capability: "switch", value: true });

      // Should have received the state update
      expect(received.length).toBeGreaterThan(0);
    });
  });
});
