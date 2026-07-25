/**
 * NEXUS AI — Xiaomi Mi Home Connector (FAZ 4)
 *
 * Mock adapter for Xiaomi/Aqara smart home devices. Uses Wi-Fi/BLE
 * communication via the Xiaomi cloud or local miIO protocol.
 */

import type { ConnectorManifest, ConnectorPlugin } from "./index.js";
import {
  type AuthorizableConnector,
  type AuthCredentials,
  type AuthResult,
  type CapabilityCommand,
  type CommandResult,
  type DeviceStatus,
  type ProtocolType,
  type UniversalDevice,
  type FakeBroker,
} from "@nexus/devices";

export const xiaomiManifest: ConnectorManifest = {
  id: "xiaomi",
  name: "Xiaomi Mi Home",
  vendor: "Xiaomi",
  version: "1.0.0",
  protocol: "wifi",
  capabilities: ["switch", "brightness", "temperature", "humidity"],
  premium: false,
};

export class XiaomiConnector implements AuthorizableConnector {
  readonly id = "xiaomi";
  readonly protocol: ProtocolType = "wifi";
  private _authorized = false;
  private authToken?: string;
  private readonly broker?: FakeBroker;

  private devices: UniversalDevice[] = [
    {
      id: "xiaomi-bulb-1",
      name: "Yeelight Color Bulb",
      room: "Living Room",
      manufacturer: "Xiaomi",
      model: "YLDP06YL",
      firmwareVersion: "2.0.6_0073",
      ipAddress: "192.168.1.120",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [
        { kind: "switch", value: true },
        { kind: "brightness", value: 80, min: 1, max: 100 },
        { kind: "colorTemp", value: 4000, min: 1700, max: 6500 },
      ],
    },
    {
      id: "xiaomi-sensor-1",
      name: "Aqara Temperature Sensor",
      room: "Bedroom",
      manufacturer: "Aqara",
      model: "WSDCGQ11LM",
      firmwareVersion: "1.0.0_0001",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [
        { kind: "temperature", value: 22.5, min: -20, max: 60 },
        { kind: "humidity", value: 55, min: 0, max: 100 },
      ],
    },
    {
      id: "xiaomi-plug-1",
      name: "Mi Smart Plug",
      room: "Office",
      manufacturer: "Xiaomi",
      model: "ZNCZ05CM",
      firmwareVersion: "3.5.8",
      ipAddress: "192.168.1.121",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [
        { kind: "switch", value: false },
        { kind: "power", value: 0, min: 0, max: 3500 },
      ],
    },
  ];

  constructor(broker?: FakeBroker) {
    this.broker = broker;
    if (broker) {
      for (const d of this.devices) {
        broker.registerDevice({
          id: d.id,
          brand: "xiaomi",
          model: d.model ?? "unknown",
          protocol: "wifi",
          state: Object.fromEntries(d.capabilities.map((c) => [c.kind, c.value])),
          authorized: false,
        });
      }
    }
  }

  get authorized(): boolean {
    return this._authorized;
  }

  authorize(credentials: AuthCredentials): AuthResult {
    if (this.broker) {
      const result = this.broker.authorize("xiaomi", credentials);
      if (result.success) {
        this._authorized = true;
        this.authToken = result.token;
      }
      return result;
    }
    if (!credentials.value || credentials.value.length < 3) {
      return { success: false, error: "Invalid Mi Home token" };
    }
    this._authorized = true;
    this.authToken = `xiaomi_local_${Date.now()}`;
    return { success: true, token: this.authToken };
  }

  status(deviceId: string): DeviceStatus | undefined {
    const device = this.devices.find((d) => d.id === deviceId);
    if (!device) return undefined;
    if (this.broker) {
      const brokerState = this.broker.getDeviceState(deviceId);
      return {
        deviceId,
        online: device.connectionStatus === "online",
        lastSeen: device.lastSeen ?? new Date().toISOString(),
        state: brokerState ?? Object.fromEntries(device.capabilities.map((c) => [c.kind, c.value])),
      };
    }
    return {
      deviceId,
      online: device.connectionStatus === "online",
      lastSeen: device.lastSeen ?? new Date().toISOString(),
      state: Object.fromEntries(device.capabilities.map((c) => [c.kind, c.value])),
    };
  }

  discover(): readonly UniversalDevice[] {
    return this.devices;
  }

  supports(deviceId: string): boolean {
    return deviceId.startsWith("xiaomi-");
  }

  execute(command: CapabilityCommand): CommandResult {
    if (!this._authorized) {
      return { ok: false, device: this.devices[0]!, message: "Not authorized — link Mi Home account first" };
    }
    const d = this.devices.find((x) => x.id === command.deviceId);
    if (!d) throw new Error(`Device not found: ${command.deviceId}`);
    const cap = d.capabilities.find((x) => x.kind === command.capability);
    if (!cap) return { ok: false, device: d, message: `No ${command.capability} capability` };

    const updated = {
      ...d,
      capabilities: d.capabilities.map((c) =>
        c.kind === command.capability ? { ...c, value: command.value } : c,
      ),
    };
    this.devices = this.devices.map((x) => (x.id === command.deviceId ? updated : x));

    if (this.broker) {
      this.broker.updateDeviceState(command.deviceId, { [command.capability]: command.value });
    }

    return { ok: true, device: updated, message: `Set ${command.capability} to ${command.value}` };
  }
}

export function createXiaomiPlugin(broker?: FakeBroker): ConnectorPlugin {
  return {
    manifest: xiaomiManifest,
    create: () => new XiaomiConnector(broker),
  };
}
