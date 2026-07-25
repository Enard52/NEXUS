/**
 * NEXUS AI — Sonoff eWeLink Connector (FAZ 4)
 *
 * Mock adapter for Sonoff/eWeLink smart home devices. Uses MQTT protocol
 * for real-time communication. In a real implementation, this would connect
 * to the eWeLink cloud or a local MQTT broker via Sonoff DIY mode.
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

export const sonoffManifest: ConnectorManifest = {
  id: "sonoff",
  name: "Sonoff eWeLink",
  vendor: "Sonoff",
  version: "1.0.0",
  protocol: "mqtt",
  capabilities: ["switch", "power", "temperature", "humidity"],
  premium: false,
};

export class SonoffConnector implements AuthorizableConnector {
  readonly id = "sonoff";
  readonly protocol: ProtocolType = "mqtt";
  private _authorized = false;
  private authToken?: string;
  private readonly broker?: FakeBroker;

  private devices: UniversalDevice[] = [
    {
      id: "sonoff-basic-1",
      name: "Sonoff Basic R3",
      room: "Garage",
      manufacturer: "Sonoff",
      model: "BASICR3",
      firmwareVersion: "3.5.0",
      ipAddress: "192.168.1.130",
      macAddress: "CC:50:E3:AA:BB:01",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [{ kind: "switch", value: false }],
    },
    {
      id: "sonoff-pow-1",
      name: "Sonoff POW Elite",
      room: "Kitchen",
      manufacturer: "Sonoff",
      model: "POWR320D",
      firmwareVersion: "3.6.0",
      ipAddress: "192.168.1.131",
      macAddress: "CC:50:E3:AA:BB:02",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [
        { kind: "switch", value: true },
        { kind: "power", value: 1250, min: 0, max: 5000 },
      ],
    },
    {
      id: "sonoff-th-1",
      name: "Sonoff TH Elite",
      room: "Living Room",
      manufacturer: "Sonoff",
      model: "THR320D",
      firmwareVersion: "3.6.0",
      ipAddress: "192.168.1.132",
      macAddress: "CC:50:E3:AA:BB:03",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      capabilities: [
        { kind: "switch", value: false },
        { kind: "temperature", value: 23.2, min: -20, max: 60 },
        { kind: "humidity", value: 48, min: 0, max: 100 },
      ],
    },
  ];

  constructor(broker?: FakeBroker) {
    this.broker = broker;
    if (broker) {
      for (const d of this.devices) {
        broker.registerDevice({
          id: d.id,
          brand: "sonoff",
          model: d.model ?? "unknown",
          protocol: "mqtt",
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
      const result = this.broker.authorize("sonoff", credentials);
      if (result.success) {
        this._authorized = true;
        this.authToken = result.token;
      }
      return result;
    }
    if (!credentials.value || credentials.value.length < 3) {
      return { success: false, error: "Invalid eWeLink API key" };
    }
    this._authorized = true;
    this.authToken = `sonoff_local_${Date.now()}`;
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
    return deviceId.startsWith("sonoff-");
  }

  execute(command: CapabilityCommand): CommandResult {
    if (!this._authorized) {
      return { ok: false, device: this.devices[0]!, message: "Not authorized — connect eWeLink account first" };
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

export function createSonoffPlugin(broker?: FakeBroker): ConnectorPlugin {
  return {
    manifest: sonoffManifest,
    create: () => new SonoffConnector(broker),
  };
}
