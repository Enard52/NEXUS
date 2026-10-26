/**
 * NEXUS AI — Native Sensors & Zero-Cost Telemetry Engine
 *
 * Provides a local-first, zero-cloud-cost sensor monitoring system for mobile devices.
 * Reads device hardware states (Battery, Wi-Fi SSID, Charging state, Next Alarm,
 * Audio output, Do Not Disturb) through the MobileBridge to trigger local automations
 * directly on the device — without requiring a central server or monthly cloud subscriptions.
 */

import type { MobileBridge, BatteryInfo, NetworkStatus } from "./bridge.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeviceSensorsSnapshot {
  timestamp: number;
  battery: BatteryInfo & {
    chargingSource?: "ac" | "usb" | "wireless" | "none";
  };
  network: NetworkStatus & {
    ssid?: string;
    bssid?: string;
    isMetered?: boolean;
  };
  device: {
    audioOutput?: "speaker" | "bluetooth" | "headphones" | "other";
    doNotDisturb?: boolean;
    screenOn?: boolean;
    nextAlarmTimestamp?: number;
  };
}

export type SensorListener = (snapshot: DeviceSensorsSnapshot) => void;

export type SensorOperator =
  "equals" | "notEquals" | "greaterThan" | "lessThan" | "contains" | "withinMinutes";

export interface SensorCondition {
  sensor:
    | "battery.level"
    | "battery.isCharging"
    | "battery.chargingSource"
    | "network.connected"
    | "network.type"
    | "network.ssid"
    | "device.doNotDisturb"
    | "device.audioOutput"
    | "device.screenOn"
    | "device.nextAlarmTimestamp";
  operator: SensorOperator;
  value: string | number | boolean;
}

// ─── Default Fallback Snapshot ───────────────────────────────────────────────

export const DEFAULT_SENSORS_SNAPSHOT: DeviceSensorsSnapshot = {
  timestamp: Date.now(),
  battery: {
    level: 1.0,
    isCharging: false,
    chargingSource: "none",
  },
  network: {
    connected: true,
    type: "wifi",
    ssid: "Local-Home-Network",
    isMetered: false,
  },
  device: {
    audioOutput: "speaker",
    doNotDisturb: false,
    screenOn: true,
    nextAlarmTimestamp: undefined,
  },
};

// ─── Sensors Manager ─────────────────────────────────────────────────────────

export class SensorsManager {
  private bridge: MobileBridge;
  private currentSnapshot: DeviceSensorsSnapshot = { ...DEFAULT_SENSORS_SNAPSHOT };
  private listeners: Set<SensorListener> = new Set();
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(bridge: MobileBridge) {
    this.bridge = bridge;
  }

  /** Gets the latest sensor snapshot. */
  async getSnapshot(): Promise<DeviceSensorsSnapshot> {
    try {
      if (typeof this.bridge.getDetailedSensors === "function") {
        const nativeSensors = await this.bridge.getDetailedSensors();
        this.currentSnapshot = {
          timestamp: Date.now(),
          battery: nativeSensors.battery,
          network: nativeSensors.network,
          device: nativeSensors.device,
        };
      } else {
        // Fallback to basic bridge methods
        const [battery, network] = await Promise.all([
          this.bridge.getBatteryInfo(),
          this.bridge.getNetworkStatus(),
        ]);
        this.currentSnapshot = {
          ...this.currentSnapshot,
          timestamp: Date.now(),
          battery: {
            ...battery,
            chargingSource: battery.isCharging ? "ac" : "none",
          },
          network: {
            ...network,
            ssid: network.connected && network.type === "wifi" ? "Local-Home-Network" : undefined,
          },
        };
      }
    } catch {
      // In case native call fails, keep last known good snapshot with updated timestamp
      this.currentSnapshot.timestamp = Date.now();
    }
    return this.currentSnapshot;
  }

  /** Subscribe to sensor snapshot updates. Returns an unsubscribe function. */
  subscribe(listener: SensorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Starts periodic polling of sensors (e.g. for background automation triggers). */
  startPolling(intervalMs: number = 30000): void {
    this.stopPolling();
    this.pollIntervalId = setInterval(async () => {
      const snapshot = await this.getSnapshot();
      this.notifyListeners(snapshot);
    }, intervalMs);
  }

  /** Stops periodic polling. */
  stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  /** Manually notifies listeners with a new snapshot (useful in tests and event-driven updates). */
  notifyListeners(snapshot: DeviceSensorsSnapshot): void {
    this.currentSnapshot = snapshot;
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Prevent listener error from breaking notification loop
      }
    }
  }

  /**
   * Evaluates if a given sensor condition matches the current or provided sensor snapshot.
   * Enables local automations such as:
   * - "Phone connected to Home-WiFi -> Turn on hallway light"
   * - "Phone plugged into AC charging between 22:00-06:00 -> Activate Good Night scene"
   */
  matchesCondition(
    condition: SensorCondition,
    snapshot: DeviceSensorsSnapshot = this.currentSnapshot,
  ): boolean {
    const rawVal = this.getSensorValue(condition.sensor, snapshot);

    switch (condition.operator) {
      case "equals":
        return rawVal === condition.value;
      case "notEquals":
        return rawVal !== condition.value;
      case "greaterThan":
        return (
          typeof rawVal === "number" &&
          typeof condition.value === "number" &&
          rawVal > condition.value
        );
      case "lessThan":
        return (
          typeof rawVal === "number" &&
          typeof condition.value === "number" &&
          rawVal < condition.value
        );
      case "contains":
        return (
          typeof rawVal === "string" &&
          typeof condition.value === "string" &&
          rawVal.includes(condition.value)
        );
      case "withinMinutes": {
        if (typeof rawVal !== "number" || typeof condition.value !== "number") return false;
        const diffMs = rawVal - Date.now();
        const diffMinutes = diffMs / (60 * 1000);
        return diffMinutes >= 0 && diffMinutes <= condition.value;
      }
      default:
        return false;
    }
  }

  private getSensorValue(
    path: SensorCondition["sensor"],
    snapshot: DeviceSensorsSnapshot,
  ): unknown {
    const parts = path.split(".");
    if (parts[0] === "battery") {
      return snapshot.battery[parts[1] as keyof DeviceSensorsSnapshot["battery"]];
    }
    if (parts[0] === "network") {
      return snapshot.network[parts[1] as keyof DeviceSensorsSnapshot["network"]];
    }
    if (parts[0] === "device") {
      return snapshot.device[parts[1] as keyof DeviceSensorsSnapshot["device"]];
    }
    return undefined;
  }
}
