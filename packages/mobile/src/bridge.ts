/**
 * NEXUS AI — Mobile Native Bridge
 *
 * Defines the contract between the WebView-hosted UI and the native platform
 * layer (Nexus native APIs on iOS/Android). Two implementations:
 *
 * - NexusNativeBridge: real device communication via Nexus native APIs.
 * - MockBridge: deterministic in-memory stub for tests and SSR pre-render.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Platforms the bridge can target. */
export type MobilePlatform = "ios" | "android";

/** Battery status reported by the native layer. */
export interface BatteryInfo {
  level: number; // 0–1
  isCharging: boolean;
}

/** Network connectivity status. */
export interface NetworkStatus {
  connected: boolean;
  type: "wifi" | "cellular" | "none" | "unknown";
}

/** Geolocation coordinate. */
export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number;
}

/** Haptic feedback intensity. */
export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/** Clipboard content. */
export interface ClipboardContent {
  text: string;
}

/** Native share payload. */
export interface SharePayload {
  title?: string;
  text?: string;
  url?: string;
}

/** App info from native layer. */
export interface AppInfo {
  id: string;
  name: string;
  version: string;
  build: string;
  platform: MobilePlatform;
}

/** A key-value item for native secure storage. */
export interface SecureStorageItem {
  key: string;
  value: string;
}

/** Extended sensor telemetry for local-first zero-cost automations. */
export interface DetailedSensors {
  battery: BatteryInfo & {
    chargingSource?: "ac" | "usb" | "wireless" | "none";
  };
  network: NetworkStatus & {
    ssid?: string;
    bssid?: string;
    isMetered?: boolean;
  };
  device: {
    audioOutput?: "speaker" | "bluetooth" | "headphones" | "other";
    doNotDisturb?: boolean;
    screenOn?: boolean;
    nextAlarmTimestamp?: number;
  };
  position?: GeoPosition;
}

/** NFC Tag payload */
export interface NfcTagData {
  id: string;
  payload?: string;
  tech?: string[];
}

/** Quick Settings Tile state */
export interface QuickTileData {
  id: string;
  label: string;
  subtitle?: string;
  state: "active" | "inactive" | "unavailable";
  actionUri: string;
}

// ─── Bridge Interface ────────────────────────────────────────────────────────

/**
 * MobileBridge — the contract that native adapters must fulfil.
 *
 * Every method returns a Promise; the WebView calls these asynchronously
 * and the native side resolves when the operation completes.
 */
export interface MobileBridge {
  /** The platform this bridge targets. */
  readonly platform: MobilePlatform;

  // ── Device Info ──
  getAppInfo(): Promise<AppInfo>;
  getBatteryInfo(): Promise<BatteryInfo>;
  getNetworkStatus(): Promise<NetworkStatus>;

  // ── Geolocation ──
  getCurrentPosition(): Promise<GeoPosition>;

  // ── Haptics ──
  hapticFeedback(style: HapticStyle): Promise<void>;

  // ── Clipboard ──
  getClipboard(): Promise<ClipboardContent>;
  setClipboard(text: string): Promise<void>;

  // ── Share Sheet ──
  share(payload: SharePayload): Promise<void>;

  // ── Secure Storage (Keychain / Keystore) ──
  secureGet(key: string): Promise<string | null>;
  secureSet(key: string, value: string): Promise<void>;
  secureRemove(key: string): Promise<void>;

  // ── Biometrics ──
  isBiometricAvailable(): Promise<boolean>;
  authenticateWithBiometric(reason: string): Promise<boolean>;

  // ── Status Bar ──
  setStatusBarStyle(style: "light" | "dark"): Promise<void>;
  setStatusBarHidden(hidden: boolean): Promise<void>;

  // ── App Lifecycle ──
  onResume(cb: () => void): void;
  onPause(cb: () => void): void;

  // ── Open External URL ──
  openExternal(url: string): Promise<void>;

  // ── Native Sensors Telemetry (Zero-cost local sensing) ──
  getDetailedSensors?(): Promise<DetailedSensors>;

  // ── NFC Tag Scanning & Writing ──
  isNfcAvailable?(): Promise<boolean>;
  writeNfcTag?(data: string): Promise<boolean>;

  // ── Quick Settings Tiles / Controls ──
  updateQuickTile?(tile: QuickTileData): Promise<void>;
}

// ─── Nexus Native Bridge (real implementation) ──────────────────────────────────

/**
 * NexusNativeBridge — communicates with the actual Nexus native APIs.
 *
 * In a production build this would use the Nexus native platform APIs.
 * We model the calls here as the *specification* of what the native layer
 * must provide; actual implementation happens in the mobile-app shell.
 */
export class NexusNativeBridge implements MobileBridge {
  readonly platform: MobilePlatform;

  private resumeCallbacks: Array<() => void> = [];
  private pauseCallbacks: Array<() => void> = [];

  constructor(platform: MobilePlatform) {
    this.platform = platform;
  }

  async getAppInfo(): Promise<AppInfo> {
    // In production: Nexus native App.getInfo() plugin.
    return {
      id: "ai.nexus.app",
      name: "NEXUS",
      version: "3.14.2",
      build: "1",
      platform: this.platform,
    };
  }

  async getBatteryInfo(): Promise<BatteryInfo> {
    // In production: Nexus native Device plugin.
    return { level: 1, isCharging: false };
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    // In production: Nexus native Network plugin.
    return { connected: true, type: "wifi" };
  }

  async getCurrentPosition(): Promise<GeoPosition> {
    // In production: Nexus native Geolocation plugin.
    return { latitude: 0, longitude: 0, accuracy: 0, timestamp: Date.now() };
  }

  async hapticFeedback(_style: HapticStyle): Promise<void> {
    // In production: Nexus native Haptics plugin.
  }

  async getClipboard(): Promise<ClipboardContent> {
    // In production: Nexus native Clipboard plugin.
    return { text: "" };
  }

  async setClipboard(_text: string): Promise<void> {
    // In production: Nexus native Clipboard.write({ string: text });
  }

  async share(payload: SharePayload): Promise<void> {
    // In production: Nexus native Share plugin.
    void payload;
  }

  async secureGet(_key: string): Promise<string | null> {
    // In production: Keychain/Keystore plugin
    return null;
  }

  async secureSet(_key: string, _value: string): Promise<void> {
    // In production: Keychain/Keystore plugin
  }

  async secureRemove(_key: string): Promise<void> {
    // In production: Keychain/Keystore plugin
  }

  async isBiometricAvailable(): Promise<boolean> {
    // In production: BiometricAuth plugin
    return true;
  }

  async authenticateWithBiometric(_reason: string): Promise<boolean> {
    // In production: BiometricAuth.authenticate()
    return true;
  }

  async setStatusBarStyle(_style: "light" | "dark"): Promise<void> {
    // In production: Nexus native StatusBar plugin.
  }

  async setStatusBarHidden(_hidden: boolean): Promise<void> {
    // In production: StatusBar.hide() / StatusBar.show()
  }

  onResume(cb: () => void): void {
    this.resumeCallbacks.push(cb);
  }

  onPause(cb: () => void): void {
    this.pauseCallbacks.push(cb);
  }

  async openExternal(url: string): Promise<void> {
    // In production: Nexus native Browser plugin.
    void url;
  }

  async getDetailedSensors(): Promise<DetailedSensors> {
    return {
      battery: { level: 1, isCharging: false, chargingSource: "none" },
      network: { connected: true, type: "wifi", ssid: "Local-Home-Network" },
      device: { audioOutput: "speaker", doNotDisturb: false, screenOn: true },
    };
  }

  async isNfcAvailable(): Promise<boolean> {
    return false;
  }

  async writeNfcTag(_data: string): Promise<boolean> {
    return false;
  }

  async updateQuickTile(_tile: QuickTileData): Promise<void> {}

  /** Simulate lifecycle event (for native → JS bridge callbacks). */
  _emitResume(): void {
    this.resumeCallbacks.forEach((cb) => cb());
  }

  _emitPause(): void {
    this.pauseCallbacks.forEach((cb) => cb());
  }
}

// ─── Mock Bridge (tests & SSR) ───────────────────────────────────────────────

/**
 * MockBridge — deterministic in-memory implementation for testing.
 *
 * Stores secure-storage items in a Map, records haptic/share calls,
 * and provides helpers to inspect invocations.
 */
export class MockBridge implements MobileBridge {
  readonly platform: MobilePlatform;

  /** Recorded haptic calls. */
  hapticCalls: HapticStyle[] = [];
  /** Recorded share calls. */
  shareCalls: SharePayload[] = [];
  /** Secure storage. */
  storage = new Map<string, string>();
  /** Simulated biometric availability. */
  biometricAvailable = true;
  /** Simulated biometric auth result. */
  biometricResult = true;
  /** Simulated network status. */
  networkStatus: NetworkStatus = { connected: true, type: "wifi" };
  /** Simulated battery info. */
  batteryInfo: BatteryInfo = { level: 0.85, isCharging: false };
  /** Simulated position. */
  position: GeoPosition = { latitude: 41.0082, longitude: 28.9784, accuracy: 10, timestamp: 0 };
  /** Simulated NFC availability. */
  nfcAvailable = true;
  /** Recorded NFC writes. */
  nfcWrites: string[] = [];
  /** Recorded Quick Tiles. */
  quickTiles: Map<string, QuickTileData> = new Map();
  /** Simulated detailed sensors. */
  detailedSensors: DetailedSensors = {
    battery: { level: 0.85, isCharging: false, chargingSource: "none" },
    network: { connected: true, type: "wifi", ssid: "Home-WiFi-5G" },
    device: { audioOutput: "speaker", doNotDisturb: false, screenOn: true },
  };

  private resumeCallbacks: Array<() => void> = [];
  private pauseCallbacks: Array<() => void> = [];

  constructor(platform: MobilePlatform = "ios") {
    this.platform = platform;
  }

  async getAppInfo(): Promise<AppInfo> {
    return {
      id: "ai.nexus.app",
      name: "NEXUS",
      version: "3.14.2",
      build: "1",
      platform: this.platform,
    };
  }

  async getBatteryInfo(): Promise<BatteryInfo> {
    return this.batteryInfo;
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    return this.networkStatus;
  }

  async getCurrentPosition(): Promise<GeoPosition> {
    return this.position;
  }

  async hapticFeedback(style: HapticStyle): Promise<void> {
    this.hapticCalls.push(style);
  }

  async getClipboard(): Promise<ClipboardContent> {
    return { text: this.storage.get("__clipboard") ?? "" };
  }

  async setClipboard(text: string): Promise<void> {
    this.storage.set("__clipboard", text);
  }

  async share(payload: SharePayload): Promise<void> {
    this.shareCalls.push(payload);
  }

  async secureGet(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async secureSet(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async secureRemove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async isBiometricAvailable(): Promise<boolean> {
    return this.biometricAvailable;
  }

  async authenticateWithBiometric(_reason: string): Promise<boolean> {
    return this.biometricResult;
  }

  async setStatusBarStyle(_style: "light" | "dark"): Promise<void> {
    // no-op in mock
  }

  async setStatusBarHidden(_hidden: boolean): Promise<void> {
    // no-op in mock
  }

  onResume(cb: () => void): void {
    this.resumeCallbacks.push(cb);
  }

  onPause(cb: () => void): void {
    this.pauseCallbacks.push(cb);
  }

  async openExternal(_url: string): Promise<void> {
    // no-op in mock
  }

  async getDetailedSensors(): Promise<DetailedSensors> {
    return this.detailedSensors;
  }

  async isNfcAvailable(): Promise<boolean> {
    return this.nfcAvailable;
  }

  async writeNfcTag(data: string): Promise<boolean> {
    this.nfcWrites.push(data);
    return true;
  }

  async updateQuickTile(tile: QuickTileData): Promise<void> {
    this.quickTiles.set(tile.id, tile);
  }

  // ── Test Helpers ──

  emitResume(): void {
    this.resumeCallbacks.forEach((cb) => cb());
  }

  emitPause(): void {
    this.pauseCallbacks.forEach((cb) => cb());
  }

  reset(): void {
    this.hapticCalls = [];
    this.shareCalls = [];
    this.nfcWrites = [];
    this.quickTiles.clear();
    this.storage.clear();
    this.resumeCallbacks = [];
    this.pauseCallbacks = [];
  }
}
