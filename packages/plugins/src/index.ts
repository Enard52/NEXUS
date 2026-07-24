/**
 * NEXUS AI — Plugin Runtime for the Connector Store (FAZ 16)
 *
 * A connector plugin is a self-describing, installable unit that produces a
 * Universal-Capability {@link Connector} (FAZ 4). The plugin runtime keeps a
 * registry of available plugins and instantiates them on demand; the store
 * (@nexus/connectors) layers the marketplace, entitlement gating and lifecycle
 * on top. Keeping the runtime brand-agnostic means new brands/protocols are
 * added purely as plugins — Core/Agent code never changes.
 *
 * Deterministic and dependency-free beyond the devices contract.
 */

import type { CapabilityKind, Connector, UniversalDevice } from "@nexus/devices";
import { InMemoryConnector } from "@nexus/devices";

/** Self-describing metadata a plugin publishes to the store catalog. */
export interface ConnectorManifest {
  readonly id: string;
  readonly name: string;
  /** Brand/protocol family, e.g. "matter", "zigbee" — never leaks to Core/Agent. */
  readonly vendor: string;
  readonly version: string;
  /** Capabilities the plugin's devices expose, for catalog filtering. */
  readonly capabilities: readonly CapabilityKind[];
  /** When true, installation requires a paid plan (gated by the store, FAZ 15). */
  readonly premium: boolean;
}

/** An installable connector plugin: metadata plus a factory for its Connector. */
export interface ConnectorPlugin {
  readonly manifest: ConnectorManifest;
  create(): Connector;
}

export class PluginError extends Error {}

/** Holds the set of plugins that can be installed from the store. */
export class PluginRegistry {
  private readonly plugins = new Map<string, ConnectorPlugin>();

  register(plugin: ConnectorPlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new PluginError(`Plugin ${plugin.manifest.id} is already registered.`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
  }

  get(id: string): ConnectorPlugin | undefined {
    return this.plugins.get(id);
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  list(): readonly ConnectorManifest[] {
    return [...this.plugins.values()].map((p) => p.manifest);
  }
}

/**
 * Helper to build a plugin whose devices are static seeds — the common shape
 * for in-memory/dev connectors and a template real plugins follow.
 */
export function definePlugin(
  manifest: ConnectorManifest,
  seed: readonly UniversalDevice[] = [],
): ConnectorPlugin {
  return {
    manifest,
    create: () => new InMemoryConnector(manifest.id, seed),
  };
}

export * from "./hue.js";
export * from "./tuya.js";
export const moduleName = "plugins" as const;
export const implemented = true;
