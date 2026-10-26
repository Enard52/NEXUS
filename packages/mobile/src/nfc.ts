/**
 * NEXUS AI — Zero-Cost NFC Tag Manager
 *
 * Enables local-first NFC tag reading, writing, and action triggering.
 * Allows users to place standard, inexpensive NFC stickers around their home
 * (e.g. bedside table, entrance door, desk) to trigger local NEXUS scenes
 * or toggle devices instantly with zero cloud dependency and zero hardware cost.
 */

import type { MobileBridge, NfcTagData } from "./bridge.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NfcScanCallback = (tag: NfcTagData) => void;

export interface NfcActionMapping {
  tagId: string;
  name: string;
  actionUri: string;
  createdAt: number;
}

// ─── NFC Manager ─────────────────────────────────────────────────────────────

export class NfcManager {
  private bridge: MobileBridge;
  private scanning = false;
  private activeScanCallback: NfcScanCallback | null = null;
  private tagMappings: Map<string, NfcActionMapping> = new Map();

  constructor(bridge: MobileBridge) {
    this.bridge = bridge;
  }

  /** Checks if NFC is supported and enabled on the current device. */
  async isAvailable(): Promise<boolean> {
    if (typeof this.bridge.isNfcAvailable === "function") {
      return this.bridge.isNfcAvailable();
    }
    return false;
  }

  /**
   * Associates an NFC tag ID with a local NEXUS action URI.
   * E.g. tagId "04:a2:b3:c4" -> "nexus://scene/sleep" or "nexus://device/toggle/living-room"
   */
  registerTagAction(tagId: string, name: string, actionUri: string): void {
    this.tagMappings.set(tagId, {
      tagId,
      name,
      actionUri,
      createdAt: Date.now(),
    });
  }

  /** Removes a registered NFC tag action. */
  unregisterTagAction(tagId: string): boolean {
    return this.tagMappings.delete(tagId);
  }

  /** Gets all registered NFC tag actions. */
  getRegisteredTags(): NfcActionMapping[] {
    return Array.from(this.tagMappings.values());
  }

  /** Writes a NEXUS action URI or payload to an NFC tag. */
  async writeTag(actionUri: string): Promise<boolean> {
    if (typeof this.bridge.writeNfcTag === "function") {
      return this.bridge.writeNfcTag(actionUri);
    }
    return false;
  }

  /** Starts listening for NFC tags. */
  async startScan(callback: NfcScanCallback): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) return false;

    this.scanning = true;
    this.activeScanCallback = callback;
    return true;
  }

  /** Stops NFC tag listening. */
  stopScan(): void {
    this.scanning = false;
    this.activeScanCallback = null;
  }

  /** Whether NFC scanner is actively listening. */
  get isScanning(): boolean {
    return this.scanning;
  }

  /**
   * Handles an incoming NFC scan event. Resolves whether it matches a mapped action
   * or contains a direct nexus:// payload.
   */
  handleTagScanned(tag: NfcTagData): { actionUri?: string; handled: boolean } {
    if (this.activeScanCallback) {
      this.activeScanCallback(tag);
    }

    // Check if payload is a direct URI
    if (tag.payload && tag.payload.startsWith("nexus://")) {
      return { actionUri: tag.payload, handled: true };
    }

    // Check if tagId is in our mapping
    const mapping = this.tagMappings.get(tag.id);
    if (mapping) {
      return { actionUri: mapping.actionUri, handled: true };
    }

    return { handled: false };
  }
}
