/**
 * NEXUS AI — Native Permissions Manager (FAZ 9)
 *
 * Declarative permission system that:
 * 1. Defines all permissions NEXUS can request.
 * 2. Tracks granted/denied state per permission.
 * 3. Provides a request flow with rationale strings for the OS prompt.
 * 4. Maps NEXUS features to required permissions.
 */

import type { MobilePlatform } from "./bridge.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** All native permissions NEXUS may request. */
export type PermissionName =
  | "microphone"
  | "location"
  | "location_always"
  | "notifications"
  | "camera"
  | "bluetooth"
  | "local_network"
  | "motion"
  | "biometric";

/** Permission status as reported by the OS. */
export type PermissionStatus = "granted" | "denied" | "prompt" | "limited";

/** A single permission entry with metadata. */
export interface PermissionEntry {
  name: PermissionName;
  status: PermissionStatus;
  /** Human-readable reason shown in the OS prompt (Info.plist / manifest). */
  rationale: string;
  /** Which NEXUS feature requires this. */
  requiredBy: string[];
  /** Is this permission mandatory for the app to function? */
  critical: boolean;
}

/** Result of a permission request attempt. */
export interface PermissionRequestResult {
  name: PermissionName;
  granted: boolean;
  previousStatus: PermissionStatus;
  newStatus: PermissionStatus;
}

/** Feature-to-permissions mapping. */
export interface FeaturePermissionMap {
  feature: string;
  permissions: PermissionName[];
  description: string;
}

// ─── Permission Definitions ──────────────────────────────────────────────────

/** Default permission entries with rationales. */
export function getDefaultPermissions(platform: MobilePlatform): PermissionEntry[] {
  const base: PermissionEntry[] = [
    {
      name: "microphone",
      status: "prompt",
      rationale: "NEXUS needs microphone access for voice commands and hands-free interaction.",
      requiredBy: ["voice-engine", "wake-word"],
      critical: false,
    },
    {
      name: "notifications",
      status: "prompt",
      rationale: "Receive alerts about your home, reminders, and agent updates.",
      requiredBy: ["push-notifications", "reminders"],
      critical: false,
    },
    {
      name: "location",
      status: "prompt",
      rationale: "NEXUS uses your location for geofencing automations (e.g. turn on lights when you arrive home).",
      requiredBy: ["geofencing", "routines"],
      critical: false,
    },
    {
      name: "location_always",
      status: "prompt",
      rationale: "Background location enables automations to trigger even when the app is closed.",
      requiredBy: ["geofencing"],
      critical: false,
    },
    {
      name: "bluetooth",
      status: "prompt",
      rationale: "Bluetooth is used to discover and control nearby smart devices.",
      requiredBy: ["device-discovery", "ble-devices"],
      critical: false,
    },
    {
      name: "camera",
      status: "prompt",
      rationale: "Camera access is used to scan QR codes for device pairing.",
      requiredBy: ["device-pairing"],
      critical: false,
    },
    {
      name: "biometric",
      status: "prompt",
      rationale: "Use Face ID or fingerprint for quick, secure authentication.",
      requiredBy: ["secure-auth", "sensitive-actions"],
      critical: false,
    },
  ];

  if (platform === "ios") {
    base.push({
      name: "local_network",
      status: "prompt",
      rationale: "Local network access is required to communicate with smart home devices on your Wi-Fi.",
      requiredBy: ["device-control", "discovery"],
      critical: true,
    });
  }

  if (platform === "ios") {
    base.push({
      name: "motion",
      status: "prompt",
      rationale: "Motion data helps NEXUS understand your activity for wellness features.",
      requiredBy: ["wellness", "digital-twin"],
      critical: false,
    });
  }

  return base;
}

/** Feature-to-permission mappings. */
export const FEATURE_PERMISSION_MAP: readonly FeaturePermissionMap[] = [
  {
    feature: "voice-interaction",
    permissions: ["microphone"],
    description: "Voice commands, wake word detection, and hands-free control",
  },
  {
    feature: "home-automation",
    permissions: ["bluetooth", "local_network", "location"],
    description: "Device discovery, control, and location-based automations",
  },
  {
    feature: "geofencing",
    permissions: ["location", "location_always"],
    description: "Automatic routines triggered by your location",
  },
  {
    feature: "notifications",
    permissions: ["notifications"],
    description: "Home alerts, reminders, and agent messages",
  },
  {
    feature: "secure-auth",
    permissions: ["biometric"],
    description: "Quick login and sensitive action confirmation",
  },
  {
    feature: "device-pairing",
    permissions: ["camera", "bluetooth"],
    description: "QR code scanning and Bluetooth device setup",
  },
  {
    feature: "wellness",
    permissions: ["motion", "location"],
    description: "Activity tracking and personalized health suggestions",
  },
];

// ─── Permissions Manager ─────────────────────────────────────────────────────

/**
 * PermissionsManager — tracks and requests native permissions.
 *
 * Provides a clean API for:
 * - Checking current status of any permission
 * - Requesting a single permission with proper rationale
 * - Bulk-requesting all permissions needed for a feature
 * - Determining if a feature has all required permissions
 */
export class PermissionsManager {
  private entries: Map<PermissionName, PermissionEntry>;
  private readonly platform: MobilePlatform;

  constructor(platform: MobilePlatform) {
    this.platform = platform;
    const defaults = getDefaultPermissions(platform);
    this.entries = new Map(defaults.map((e) => [e.name, e]));
  }

  /** Get the status of a specific permission. */
  getStatus(name: PermissionName): PermissionStatus {
    return this.entries.get(name)?.status ?? "prompt";
  }

  /** Get full entry for a permission. */
  getEntry(name: PermissionName): PermissionEntry | undefined {
    return this.entries.get(name);
  }

  /** Get all permission entries. */
  getAllEntries(): PermissionEntry[] {
    return Array.from(this.entries.values());
  }

  /** Check if a permission is granted. */
  isGranted(name: PermissionName): boolean {
    const status = this.getStatus(name);
    return status === "granted" || status === "limited";
  }

  /** Check if all permissions for a feature are granted. */
  isFeatureReady(feature: string): boolean {
    const map = FEATURE_PERMISSION_MAP.find((f) => f.feature === feature);
    if (!map) return true;
    return map.permissions
      .filter((p) => this.entries.has(p))
      .every((p) => this.isGranted(p));
  }

  /** Get missing permissions for a feature. */
  getMissingForFeature(feature: string): PermissionName[] {
    const map = FEATURE_PERMISSION_MAP.find((f) => f.feature === feature);
    if (!map) return [];
    return map.permissions.filter((p) => this.entries.has(p) && !this.isGranted(p));
  }

  /**
   * Request a single permission.
   * In production this triggers the native OS prompt.
   */
  async request(name: PermissionName): Promise<PermissionRequestResult> {
    const entry = this.entries.get(name);
    const previousStatus: PermissionStatus = entry?.status ?? "prompt";

    // In production: call native permission API.
    // Here we simulate a grant (tests can override via setStatus).
    const newStatus: PermissionStatus = "granted";

    if (entry) {
      entry.status = newStatus;
    }

    return { name, granted: true, previousStatus, newStatus };
  }

  /**
   * Request all permissions needed for a given feature.
   * Returns results for each permission requested.
   */
  async requestForFeature(feature: string): Promise<PermissionRequestResult[]> {
    const missing = this.getMissingForFeature(feature);
    const results: PermissionRequestResult[] = [];

    for (const perm of missing) {
      const result = await this.request(perm);
      results.push(result);
    }

    return results;
  }

  /**
   * Manually set a permission status (for testing or when native reports back).
   */
  setStatus(name: PermissionName, status: PermissionStatus): void {
    const entry = this.entries.get(name);
    if (entry) {
      entry.status = status;
    }
  }

  /** Get all critical permissions that are not yet granted. */
  getCriticalMissing(): PermissionEntry[] {
    return Array.from(this.entries.values()).filter(
      (e) => e.critical && e.status !== "granted" && e.status !== "limited",
    );
  }

  /** Get the platform this manager targets. */
  getPlatform(): MobilePlatform {
    return this.platform;
  }
}
