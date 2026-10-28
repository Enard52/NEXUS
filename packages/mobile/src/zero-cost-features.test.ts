/**
 * NEXUS AI — Zero-Cost Mobile Features Test Suite
 *
 * Tests the zero-cloud-fee, local-first mobile enhancements:
 * - SensorsManager (Battery, Wi-Fi SSID, Alarm, Conditions)
 * - NfcManager (Local tag scanning, tag action mapping)
 * - QuickTilesManager (Android Quick Settings & iOS Shortcuts tiles)
 * - Actionable Local Notifications
 * - MobileService zero-cost subsystems orchestration
 */

import { describe, expect, it, beforeEach } from "vitest";
import { MockBridge } from "./bridge.js";
import { SensorsManager, DEFAULT_SENSORS_SNAPSHOT, type SensorCondition } from "./sensors.js";
import { NfcManager } from "./nfc.js";
import { QuickTilesManager } from "./quick-tiles.js";
import { PushManager } from "./notifications.js";
import { MobileService } from "./mobile-service.js";

describe("Zero-Cost Mobile Features", () => {
  let bridge: MockBridge;

  beforeEach(() => {
    bridge = new MockBridge("android");
  });

  // ─── SensorsManager Tests ──────────────────────────────────────────────────

  describe("SensorsManager (Zero-cost telemetry)", () => {
    it("returns detailed sensor snapshot from bridge", async () => {
      const sensors = new SensorsManager(bridge);
      const snapshot = await sensors.getSnapshot();

      expect(snapshot.battery.level).toBe(0.85);
      expect(snapshot.network.connected).toBe(true);
      expect(snapshot.network.ssid).toBe("Home-WiFi-5G");
      expect(snapshot.device.audioOutput).toBe("speaker");
    });

    it("evaluates sensor conditions accurately", async () => {
      const sensors = new SensorsManager(bridge);
      const snapshot = await sensors.getSnapshot();

      const wifiCondition: SensorCondition = {
        sensor: "network.ssid",
        operator: "equals",
        value: "Home-WiFi-5G",
      };
      expect(sensors.matchesCondition(wifiCondition, snapshot)).toBe(true);

      const batteryCondition: SensorCondition = {
        sensor: "battery.level",
        operator: "lessThan",
        value: 0.9,
      };
      expect(sensors.matchesCondition(batteryCondition, snapshot)).toBe(true);

      const chargingCondition: SensorCondition = {
        sensor: "battery.isCharging",
        operator: "equals",
        value: true,
      };
      expect(sensors.matchesCondition(chargingCondition, snapshot)).toBe(false);
    });

    it("notifies subscribers when snapshot updates", async () => {
      const sensors = new SensorsManager(bridge);
      let received = false;

      const unsubscribe = sensors.subscribe((s) => {
        if (s.battery.level === 0.42) {
          received = true;
        }
      });

      sensors.notifyListeners({
        ...DEFAULT_SENSORS_SNAPSHOT,
        battery: { level: 0.42, isCharging: true, chargingSource: "ac" },
      });

      expect(received).toBe(true);
      unsubscribe();
    });
  });

  // ─── NfcManager Tests ──────────────────────────────────────────────────────

  describe("NfcManager (Zero-cost tag scanning & writing)", () => {
    it("checks availability via bridge", async () => {
      const nfc = new NfcManager(bridge);
      expect(await nfc.isAvailable()).toBe(true);

      bridge.nfcAvailable = false;
      expect(await nfc.isAvailable()).toBe(false);
    });

    it("registers and maps tag IDs to local scene actions", () => {
      const nfc = new NfcManager(bridge);
      nfc.registerTagAction("tag_bedside_01", "Yatak Başı Uyku", "nexus://scene/sleep");

      const tags = nfc.getRegisteredTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].actionUri).toBe("nexus://scene/sleep");

      const result = nfc.handleTagScanned({ id: "tag_bedside_01" });
      expect(result.handled).toBe(true);
      expect(result.actionUri).toBe("nexus://scene/sleep");
    });

    it("handles direct nexus:// payload tags", () => {
      const nfc = new NfcManager(bridge);
      const result = nfc.handleTagScanned({
        id: "any_unknown_tag",
        payload: "nexus://device/toggle/living_room",
      });

      expect(result.handled).toBe(true);
      expect(result.actionUri).toBe("nexus://device/toggle/living_room");
    });

    it("writes action URI to tag via bridge", async () => {
      const nfc = new NfcManager(bridge);
      const success = await nfc.writeTag("nexus://scene/away");

      expect(success).toBe(true);
      expect(bridge.nfcWrites).toContain("nexus://scene/away");
    });
  });

  // ─── QuickTilesManager Tests ───────────────────────────────────────────────

  describe("QuickTilesManager (Android Quick Settings & iOS Shortcuts)", () => {
    it("initializes with default smart home tiles", () => {
      const manager = new QuickTilesManager(bridge);
      const tiles = manager.getTiles();

      expect(tiles.length).toBeGreaterThanOrEqual(3);
      expect(manager.getTile("all_lights_toggle")).toBeDefined();
    });

    it("updates tile state and synchronizes with native layer", async () => {
      const manager = new QuickTilesManager(bridge);
      await manager.updateTileState("all_lights_toggle", "active", "3 Işık Açık");

      const tile = manager.getTile("all_lights_toggle");
      expect(tile?.state).toBe("active");
      expect(tile?.subtitle).toBe("3 Işık Açık");
      expect(bridge.quickTiles.get("all_lights_toggle")?.state).toBe("active");
    });

    it("handles tile taps and toggles state", () => {
      const manager = new QuickTilesManager(bridge);
      let triggered = false;

      manager.onTrigger((t) => {
        if (t.id === "all_lights_toggle") {
          triggered = true;
        }
      });

      const result = manager.handleTileTapped("all_lights_toggle");
      expect(result?.actionUri).toBe("nexus://device/toggle/all-lights");
      expect(triggered).toBe(true);
    });
  });

  // ─── Actionable Local Notifications ────────────────────────────────────────

  describe("Actionable Local Notifications", () => {
    it("schedules local notification with action buttons without cloud cost", () => {
      const push = new PushManager(bridge);
      let receivedAction: string | undefined;

      push.onAction((p) => {
        receivedAction = p.actionId;
      });

      const notif = push.scheduleLocalNotification({
        title: "Düşük Pil Uyarısı",
        body: "Telefon pili %15 altına düştü. Gece moduna geçilsin mi?",
        actions: [
          { id: "enable_night_mode", title: "Gece Moduna Geç", actionUri: "nexus://scene/sleep" },
          { id: "dismiss", title: "Kapat" },
        ],
      });

      expect(notif.title).toBe("Düşük Pil Uyarısı");
      expect(notif.actions).toHaveLength(2);

      // Simulate user tapping action button
      push.dispatchNotification({ ...notif, actionId: "enable_night_mode" });
      expect(receivedAction).toBe("enable_night_mode");
    });
  });

  // ─── MobileService Orchestration ───────────────────────────────────────────

  describe("MobileService Orchestration with Zero-Cost Features", () => {
    it("wires sensors, nfc, and quick tiles seamlessly", async () => {
      const service = new MobileService(bridge);
      expect(service.sensors).toBeDefined();
      expect(service.nfc).toBeDefined();
      expect(service.quickTiles).toBeDefined();

      let emittedSensorEvent = false;
      let emittedTileEvent = false;

      service.on((event) => {
        if (event.type === "sensor-change") {
          emittedSensorEvent = true;
        } else if (event.type === "quick-tile") {
          emittedTileEvent = true;
        }
      });

      service.sensors.notifyListeners(DEFAULT_SENSORS_SNAPSHOT);
      expect(emittedSensorEvent).toBe(true);

      service.quickTiles.handleTileTapped("all_lights_toggle");
      expect(emittedTileEvent).toBe(true);

      await service.shutdown();
      expect(service.state).toBe("terminated");
    });
  });
});
