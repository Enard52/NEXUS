/**
 * NEXUS AI — Device System & Universal Capability (FAZ 4)
 *
 * The Core and agents never speak a brand's language. Every integration is a
 * Connector that exposes devices through a Universal Capability schema
 * (switch / brightness / colorTemp / …). The Device Manager discovers devices
 * across connectors and routes a capability command to the connector that owns
 * the target device — so adding a new brand connector requires zero changes to
 * Core/Agent code (FAZ 4 Bitiş Kriteri).
 *
 * Connectors here are generic in-memory stand-ins; real brand/protocol
 * connectors (Matter, Zigbee, cloud APIs, …) implement the same interface and
 * plug in via the FAZ 16 store. Deterministic and dependency-free.
 */

export type CapabilityKind = "switch" | "brightness" | "colorTemp";

export interface Capability {
  readonly kind: CapabilityKind;
  /** Current value: boolean for switch, number for the rest. */
  readonly value: boolean | number;
  /** Inclusive numeric range for numeric capabilities. */
  readonly min?: number;
  readonly max?: number;
}

export interface UniversalDevice {
  readonly id: string;
  readonly name: string;
  readonly room: string;
  readonly capabilities: readonly Capability[];
}

export interface CapabilityCommand {
  readonly deviceId: string;
  readonly capability: CapabilityKind;
  readonly value: boolean | number;
}

export interface CommandResult {
  readonly ok: boolean;
  readonly device: UniversalDevice;
  readonly message: string;
}

/** A source of devices. Brand/protocol specifics live entirely behind this. */
export interface Connector {
  readonly id: string;
  discover(): readonly UniversalDevice[];
  supports(deviceId: string): boolean;
  execute(command: CapabilityCommand): CommandResult;
}

export class CapabilityError extends Error {}

/**
 * A minimal in-memory connector. Real connectors translate brand APIs to this
 * exact universal shape; the name here is intentionally generic (no brand).
 */
export class InMemoryConnector implements Connector {
  private readonly devices = new Map<string, UniversalDevice>();

  constructor(
    readonly id: string,
    seed: readonly UniversalDevice[] = [],
  ) {
    for (const d of seed) this.devices.set(d.id, d);
  }

  discover(): readonly UniversalDevice[] {
    return [...this.devices.values()];
  }

  supports(deviceId: string): boolean {
    return this.devices.has(deviceId);
  }

  execute(command: CapabilityCommand): CommandResult {
    const device = this.devices.get(command.deviceId);
    if (!device) throw new CapabilityError(`Unknown device ${command.deviceId}`);

    const cap = device.capabilities.find((c) => c.kind === command.capability);
    if (!cap) {
      return {
        ok: false,
        device,
        message: `${device.name} has no ${command.capability} capability`,
      };
    }
    if (typeof cap.value !== typeof command.value) {
      return { ok: false, device, message: `Invalid value type for ${command.capability}` };
    }
    if (typeof command.value === "number" && cap.min !== undefined && cap.max !== undefined) {
      if (command.value < cap.min || command.value > cap.max) {
        return { ok: false, device, message: `Value out of range for ${command.capability}` };
      }
    }

    const updated: UniversalDevice = {
      ...device,
      capabilities: device.capabilities.map((c) =>
        c.kind === command.capability ? { ...c, value: command.value } : c,
      ),
    };
    this.devices.set(device.id, updated);
    return { ok: true, device: updated, message: `${device.name}: ${command.capability} set` };
  }
}

/** Discovers across connectors and routes commands to the owning connector. */
export class DeviceManager {
  private readonly connectors: Connector[] = [];

  registerConnector(connector: Connector): void {
    this.connectors.push(connector);
  }

  /** Remove a connector (and its devices) by id — used by the store on uninstall (FAZ 16). */
  unregisterConnector(id: string): boolean {
    const index = this.connectors.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.connectors.splice(index, 1);
    return true;
  }

  discoverAll(): readonly UniversalDevice[] {
    return this.connectors.flatMap((c) => c.discover());
  }

  findByRoomCapability(room: string, capability: CapabilityKind): UniversalDevice | undefined {
    return this.discoverAll().find(
      (d) => d.room === room && d.capabilities.some((c) => c.kind === capability),
    );
  }

  execute(command: CapabilityCommand): CommandResult {
    const connector = this.connectors.find((c) => c.supports(command.deviceId));
    if (!connector) throw new CapabilityError(`No connector owns device ${command.deviceId}`);
    return connector.execute(command);
  }
}

export * from "./usage.js";

export const moduleName = "devices" as const;
export const implemented = true;
