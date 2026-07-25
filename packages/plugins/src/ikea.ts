/**
 * NEXUS AI — IKEA DIRIGERA Connector (FAZ 4)
 *
 * Mock adapter for IKEA smart home products (TRÅDFRI / DIRIGERA hub).
 * Uses Zigbee protocol via the DIRIGERA gateway. In a real implementation,
 * this would communicate with the DIRIGERA hub's local REST API.
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

export const ikeaManifest: ConnectorManifest = {
  id: "ikea",
  name: "IKEA DIRIGERA",
  vendor: "IKEA",
  version: "1.0.0",
  protocol: "zigbee",
  capabilities: ["switch", "brightness", "colorTemp"],
  premium: false,
};

export class IkeaConnector implements AuthorizableConnector {
  readonly id = "ikea";
  readonly protocol: ProtocolType = "zigbee";
  private _authorized = false;
  private authToken?: string;
  private readonly broker?: FakeBroker;

  private devices: UniversalDevice[] = [
    {
      id: "ikea-bulb-1",
      name: "TRÅDFRI Bulb E27",
      room: "Living Room",
      manufacturer: "IKEA",
      model: "LED2003G10",
      firmwareVersion: "2.3.093",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [
        { kind: "switch", value: false },
        { kind: "brightness", value: 100, min: 1, max: 254 },
        { kind: "colorTemp", value: 370, min: 250, max: 454 },
      ],
    },
    {
      id: "ikea-plug-1",
      name: "TRÅDFRI Smart Plug",
      room: "Kitchen",
      manufacturer: "IKEA",
      model: "E2206",
      firmwareVersion: "1.0.35",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [{ kind: "switch", value: false }],
    },
    {
      id: "ikea-blind-1",
      name: "FYRTUR Roller Blind",
      room: "Bedroom",
      manufacturer: "IKEA",
      model: "E1757",
      firmwareVersion: "2.3.086",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [{ kind: "brightness", value: 0, min: 0, max: 100 }],
    },
  ];

  constructor(broker?: FakeBroker) {
    this.broker = broker;
    if (broker) {
      for (const d of this.devices) {
        broker.registerDevice({
          id: d.id,
          brand: "ikea",
          model: d.model ?? "unknown",
          protocol: "zigbee",
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
      const result = this.broker.authorize("ikea", credentials);
      if (result.success) {
        this._authorized = true;
        this.authToken = result.token;
      }
      return result;
    }
    // Standalone mode: accept any valid credential
    if (!credentials.value || credentials.value.length < 3) {
      return { success: false, error: "Invalid DIRIGERA hub code" };
    }
    this._authorized = true;
    this.authToken = `ikea_local_${Date.now()}`;
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
    return deviceId.startsWith("ikea-");
  }

  execute(command: CapabilityCommand): CommandResult {
    if (!this._authorized) {
      return { ok: false, device: this.devices[0]!, message: "Not authorized — pair with DIRIGERA hub first" };
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

export function createIkeaPlugin(broker?: FakeBroker): ConnectorPlugin {
  return {
    manifest: ikeaManifest,
    create: () => new IkeaConnector(broker),
  };
}
