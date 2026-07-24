/**
 * NEXUS AI — Connector Store (FAZ 16)
 *
 * A marketplace on top of the plugin runtime (@nexus/plugins): the user browses
 * a catalog of connectors, installs the ones they want, and the store wires the
 * resulting Connector into the Device Manager (FAZ 4) — with zero changes to
 * Core/Agent code. Some connectors are gated behind a paid plan (FAZ 15): the
 * store refuses to install a premium connector on the Free plan.
 *
 * This is the continuous-expansion path (new brands/protocols keep arriving)
 * and the on-ramp for cross-device memory (FAZ 22). Deterministic; time-free.
 */

import type { PlanId } from "@nexus/billing";
import type { DeviceManager } from "@nexus/devices";
import type { ConnectorManifest, PluginRegistry } from "@nexus/plugins";

export class StoreError extends Error {}

/** Plans that unlock premium connectors. Free is explicitly excluded. */
const PAID_PLANS: ReadonlySet<PlanId> = new Set<PlanId>(["premium", "family"]);

export interface CatalogEntry {
  readonly manifest: ConnectorManifest;
  readonly installed: boolean;
  /** True when the current plan is not entitled to install this connector. */
  readonly locked: boolean;
}

/**
 * The store binds a plugin registry (what's available) to a device manager
 * (where installed connectors run). Installation is entitlement-checked.
 */
export class ConnectorStore {
  private readonly installed = new Set<string>();

  constructor(
    private readonly registry: PluginRegistry,
    private readonly devices: DeviceManager,
  ) {}

  /** The catalog as seen by a user on a given plan (installed + lock state). */
  catalog(plan: PlanId): readonly CatalogEntry[] {
    return this.registry.list().map((manifest) => ({
      manifest,
      installed: this.installed.has(manifest.id),
      locked: this.isLocked(manifest, plan),
    }));
  }

  /** Whether a connector requires a plan the user does not have. */
  isLocked(manifest: ConnectorManifest, plan: PlanId): boolean {
    return manifest.premium && !PAID_PLANS.has(plan);
  }

  isInstalled(id: string): boolean {
    return this.installed.has(id);
  }

  listInstalled(): readonly string[] {
    return [...this.installed];
  }

  /**
   * Install a connector from the catalog onto the given plan. Throws if the
   * plugin is unknown or the plan is not entitled to a premium connector.
   */
  install(id: string, plan: PlanId): void {
    const plugin = this.registry.get(id);
    if (!plugin) throw new StoreError(`No connector named ${id} in the catalog.`);
    if (this.installed.has(id)) return;
    if (this.isLocked(plugin.manifest, plan)) {
      throw new StoreError(
        `Connector ${id} requires a paid plan; current plan "${plan}" is not entitled.`,
      );
    }
    this.devices.registerConnector(plugin.create());
    this.installed.add(id);
  }

  /** Uninstall a connector, removing its devices from the manager. */
  uninstall(id: string): boolean {
    if (!this.installed.has(id)) return false;
    this.devices.unregisterConnector(id);
    this.installed.delete(id);
    return true;
  }
}

export const moduleName = "connectors" as const;
export const implemented = true;
