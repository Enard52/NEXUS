/**
 * NEXUS AI — Device System & Universal Capability
 *
 * The Core and agents never speak a brand's language. Every integration is a
 * Connector that exposes devices through a Universal Capability schema
 * (switch / brightness / colorTemp / …). The Device Manager discovers devices
 * across connectors and routes a capability command to the connector that owns
 * the target device — so adding a new brand connector requires zero changes to
 * Core/Agent code .
 *
 * Connectors here are generic in-memory stand-ins; real brand/protocol
 * connectors (Matter, Zigbee, cloud APIs, …) implement the same interface and
 * plug in via the store. Deterministic and dependency-free.
 */

export type CapabilityKind =
  "switch" | "brightness" | "colorTemp" | "color" | "motion" | "temperature" | "humidity" | "power";

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
  readonly manufacturer?: string;
  readonly model?: string;
  readonly imageUrl?: string;
  readonly firmwareVersion?: string;
  readonly ipAddress?: string;
  readonly macAddress?: string;
  readonly connectionStatus?: "online" | "offline" | "error";
  readonly lastSeen?: string;
  readonly updateAvailable?: boolean;
  readonly analytics?: {
    readonly dailyUsageWh?: number[];
    readonly weeklyUsageWh?: number[];
    readonly anomalyDetected?: boolean;
  };
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

/**
 * Extended connector interface with authorization and status polling.
 * Connectors that communicate via a broker/gateway implement this.
 * The base Connector interface remains backward-compatible.
 */
export interface AuthorizableConnector extends Connector {
  /** Whether this connector has been authorized (paired/authenticated). */
  readonly authorized: boolean;
  /** The protocol this connector uses. */
  readonly protocol: import("./broker.js").ProtocolType;
  /** Authorize/pair this connector with credentials. */
  authorize(credentials: import("./broker.js").AuthCredentials): import("./broker.js").AuthResult;
  /** Read the current status of a specific device. */
  status(deviceId: string): DeviceStatus | undefined;
}

export interface DeviceStatus {
  readonly deviceId: string;
  readonly online: boolean;
  readonly lastSeen: string;
  readonly state: Record<string, unknown>;
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

/**
 * A connector that simulates scanning the local network for real IoT devices
 * (like UPnP/mDNS discovery). In a real implementation, this would open UDP
 * sockets or use mDNS libraries to find devices like Hue, Yeelight, or Shelly.
 */
export class LocalNetworkConnector implements Connector {
  readonly id = "local-network";
  private scannedDevices: UniversalDevice[] = [];
  private isScanning = false;

  constructor() {
    // In a real app, this constructor would start listening for mDNS advertisements.
  }

  async scanNetwork(): Promise<void> {
    if (this.isScanning) return;
    this.isScanning = true;

    // Simulate network delay and finding a real device
    return new Promise((resolve) => {
      setTimeout(() => {
        this.scannedDevices = [
          {
            id: "local-yeelight-1",
            name: "Smart Bulb (Living Room)",
            room: "Living Room",
            manufacturer: "Yeelight",
            model: "Color 1S",
            ipAddress: "192.168.1.104",
            macAddress: "AA:BB:CC:DD:EE:FF",
            connectionStatus: "online",
            lastSeen: new Date().toISOString(),
            capabilities: [
              { kind: "switch", value: true },
              { kind: "brightness", value: 80, min: 1, max: 100 },
            ],
          },
          {
            id: "local-shelly-1",
            name: "Coffee Maker Plug",
            room: "Kitchen",
            manufacturer: "Shelly",
            model: "Plus 1PM",
            ipAddress: "192.168.1.110",
            macAddress: "11:22:33:44:55:66",
            connectionStatus: "online",
            lastSeen: new Date().toISOString(),
            capabilities: [{ kind: "switch", value: false }],
          },
        ];
        this.isScanning = false;
        resolve();
      }, 1500);
    });
  }

  discover(): readonly UniversalDevice[] {
    return this.scannedDevices;
  }

  supports(deviceId: string): boolean {
    return this.scannedDevices.some((d) => d.id === deviceId);
  }

  execute(command: CapabilityCommand): CommandResult {
    const deviceIndex = this.scannedDevices.findIndex((d) => d.id === command.deviceId);
    if (deviceIndex === -1) {
      throw new CapabilityError(`Unknown device ${command.deviceId} on LocalNetworkConnector`);
    }

    const device = this.scannedDevices[deviceIndex];
    const cap = device.capabilities.find((c) => c.kind === command.capability);
    if (!cap) {
      return { ok: false, device, message: `${device.name} has no ${command.capability}` };
    }

    const updated: UniversalDevice = {
      ...device,
      capabilities: device.capabilities.map((c) =>
        c.kind === command.capability ? { ...c, value: command.value } : c,
      ),
    };

    this.scannedDevices[deviceIndex] = updated;

    // In a real implementation, this would send an HTTP/CoAP request to the IP address.
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")
      console.log(
        `[LocalNetworkConnector] Sent network command to ${device.ipAddress}: ${command.capability} = ${command.value}`,
      );

    return {
      ok: true,
      device: updated,
      message: `${device.name}: ${command.capability} set via LAN`,
    };
  }
}

/**
 * Registry for user-defined device aliases/names.
 * Maps lowerCase(alias) → deviceId. A single device can have multiple aliases.
 * The same alias cannot map to more than one device.
 */
export class DeviceNameRegistry {
  private readonly aliasToId = new Map<string, string>();

  /** Set or overwrite the primary display name for a device. Old name is kept as alias. */
  rename(deviceId: string, newName: string): void {
    const key = newName.toLowerCase();
    const existing = this.aliasToId.get(key);
    if (existing && existing !== deviceId) {
      throw new CapabilityError(`Alias "${newName}" is already assigned to device ${existing}`);
    }
    this.aliasToId.set(key, deviceId);
  }

  /** Add an additional alias for a device. */
  addAlias(deviceId: string, alias: string): void {
    const key = alias.toLowerCase();
    const existing = this.aliasToId.get(key);
    if (existing && existing !== deviceId) {
      throw new CapabilityError(`Alias "${alias}" is already assigned to device ${existing}`);
    }
    this.aliasToId.set(key, deviceId);
  }

  /** Remove an alias. Returns true if it existed. */
  removeAlias(alias: string): boolean {
    return this.aliasToId.delete(alias.toLowerCase());
  }

  /** Resolve a name/alias to a device ID (case-insensitive). */
  resolve(name: string): string | undefined {
    return this.aliasToId.get(name.toLowerCase());
  }

  /** Get all aliases registered for a specific device. */
  getAliases(deviceId: string): string[] {
    const result: string[] = [];
    for (const [alias, id] of this.aliasToId) {
      if (id === deviceId) result.push(alias);
    }
    return result;
  }

  /** Return all registered name→deviceId mappings. */
  allNames(): ReadonlyMap<string, string> {
    return this.aliasToId;
  }
}

/** Discovers across connectors and routes commands to the owning connector. */
export class DeviceManager {
  private readonly connectors: Connector[] = [];
  readonly names = new DeviceNameRegistry();

  registerConnector(connector: Connector): void {
    this.connectors.push(connector);
  }

  /** Remove a connector (and its devices) by id — used by the store on uninstall. */
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

  /** Find a device by its custom name/alias via the name registry. */
  findByName(name: string): UniversalDevice | undefined {
    const deviceId = this.names.resolve(name);
    if (!deviceId) return undefined;
    return this.discoverAll().find((d) => d.id === deviceId);
  }

  execute(command: CapabilityCommand): CommandResult {
    const connector = this.connectors.find((c) => c.supports(command.deviceId));
    if (!connector) throw new CapabilityError(`No connector owns device ${command.deviceId}`);
    return connector.execute(command);
  }
}

export * from "./usage.js";
export * from "./broker.js";

export const moduleName = "devices" as const;
export const implemented = true;
