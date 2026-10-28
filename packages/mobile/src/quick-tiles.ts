/**
 * NEXUS AI — Quick Settings & Action Tiles Manager
 *
 * Enables fast access to frequently used smart home devices and scenes
 * directly from the Android Quick Settings drawer (notification pull-down)
 * or iOS Shortcuts, without requiring the user to open the full app.
 *
 * 100% local, runs instantly on the device with zero cloud latency.
 */

import type { MobileBridge, QuickTileData } from "./bridge.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuickTile extends QuickTileData {
  icon: string;
}

export type QuickTileTriggerHandler = (tile: QuickTile) => void;

// ─── Quick Tiles Manager ─────────────────────────────────────────────────────

export class QuickTilesManager {
  private bridge: MobileBridge;
  private tiles: Map<string, QuickTile> = new Map();
  private triggerHandlers: Set<QuickTileTriggerHandler> = new Set();

  constructor(bridge: MobileBridge) {
    this.bridge = bridge;

    // Register default quick tiles for common actions
    this.registerTile({
      id: "all_lights_toggle",
      label: "Tüm Işıklar",
      subtitle: "Tek dokunuşla aç/kapat",
      state: "inactive",
      icon: "lightbulb",
      actionUri: "nexus://device/toggle/all-lights",
    });

    this.registerTile({
      id: "away_mode",
      label: "Dışarıdayım",
      subtitle: "Güvenlik modunu aç",
      state: "inactive",
      icon: "shield",
      actionUri: "nexus://scene/away",
    });

    this.registerTile({
      id: "night_mode",
      label: "İyi Geceler",
      subtitle: "Uyku modunu etkinleştir",
      state: "inactive",
      icon: "moon",
      actionUri: "nexus://scene/sleep",
    });
  }

  /** Gets all registered tiles. */
  getTiles(): QuickTile[] {
    return Array.from(this.tiles.values());
  }

  /** Gets a single tile by id. */
  getTile(id: string): QuickTile | undefined {
    return this.tiles.get(id);
  }

  /** Registers a new quick tile or updates an existing one. */
  async registerTile(tile: QuickTile): Promise<void> {
    this.tiles.set(tile.id, tile);
    if (typeof this.bridge.updateQuickTile === "function") {
      await this.bridge.updateQuickTile(tile);
    }
  }

  /** Updates the visual state of a quick tile (active / inactive / unavailable). */
  async updateTileState(
    id: string,
    state: "active" | "inactive" | "unavailable",
    subtitle?: string,
  ): Promise<boolean> {
    const tile = this.tiles.get(id);
    if (!tile) return false;

    tile.state = state;
    if (subtitle !== undefined) {
      tile.subtitle = subtitle;
    }

    if (typeof this.bridge.updateQuickTile === "function") {
      await this.bridge.updateQuickTile(tile);
    }
    return true;
  }

  /** Subscribes to tile trigger events. */
  onTrigger(handler: QuickTileTriggerHandler): () => void {
    this.triggerHandlers.add(handler);
    return () => {
      this.triggerHandlers.delete(handler);
    };
  }

  /** Handles a tile tap from native OS (Quick Settings or Lock Screen). */
  handleTileTapped(id: string): { tile: QuickTile; actionUri: string } | null {
    const tile = this.tiles.get(id);
    if (!tile) return null;

    // Toggle local visual state
    tile.state = tile.state === "active" ? "inactive" : "active";

    // Notify listeners
    for (const handler of this.triggerHandlers) {
      try {
        handler(tile);
      } catch {
        // Prevent callback error from crashing loop
      }
    }

    return { tile, actionUri: tile.actionUri };
  }
}
