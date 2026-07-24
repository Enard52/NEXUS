import type { ConnectorManifest, ConnectorPlugin } from "./index.js";
import {
  type CapabilityCommand,
  type CommandResult,
  type Connector,
  type UniversalDevice,
} from "@nexus/devices";

export const tuyaManifest: ConnectorManifest = {
  id: "tuya",
  name: "Tuya Smart",
  vendor: "Tuya",
  version: "1.0.0",
  capabilities: ["switch", "brightness", "colorTemp"],
  premium: true, // Requires paid plan
};

/**
 * A mock representation of the real Tuya Smart connector.
 * In a real implementation, this would talk to the Tuya Cloud API via fetch/SDK.
 */
export class TuyaConnector implements Connector {
  readonly id = "tuya";
  private devices: UniversalDevice[] = [
    {
      id: "tuya-switch-1",
      name: "Kitchen Switch",
      room: "Kitchen",
      capabilities: [{ kind: "switch", value: false }],
    },
    {
      id: "tuya-bulb-1",
      name: "Office Light",
      room: "Office",
      capabilities: [
        { kind: "switch", value: false },
        { kind: "brightness", value: 80, min: 0, max: 100 },
      ],
    },
  ];

  discover(): readonly UniversalDevice[] {
    return this.devices;
  }

  supports(deviceId: string): boolean {
    return deviceId.startsWith("tuya-");
  }

  execute(command: CapabilityCommand): CommandResult {
    const d = this.devices.find((x) => x.id === command.deviceId);
    if (!d) throw new Error("Device not found");
    const cap = d.capabilities.find((x) => x.kind === command.capability);
    if (!cap) throw new Error("Capability not found");
    // In a real connector, we would send a network request to Tuya Cloud here.
    const updated = {
      ...d,
      capabilities: d.capabilities.map((c) =>
        c.kind === command.capability ? { ...c, value: command.value } : c,
      ),
    };
    this.devices = this.devices.map((x) => (x.id === command.deviceId ? updated : x));
    return { ok: true, device: updated, message: `Set ${command.capability} to ${command.value}` };
  }
}

export function createTuyaPlugin(): ConnectorPlugin {
  return {
    manifest: tuyaManifest,
    create: () => new TuyaConnector(),
  };
}
