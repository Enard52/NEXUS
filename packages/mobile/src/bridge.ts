/**
 * NEXUS AI — Mobile Native Bridge (FAZ 9)
 *
 * Defines the contract between the WebView-hosted UI and the native platform
 * layer (Capacitor plugins on iOS/Android). Two implementations:
 *
 * - CapacitorBridge: real device communication via Capacitor plugin APIs.
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
}

// ─── Capacitor Bridge (real implementation) ──────────────────────────────────

/**
 * CapacitorBridge — communicates with actual Capacitor plugins.
 *
 * In a production build this would import from @capacitor/core, etc.
 * We model the calls here as the *specification* of what the native layer
 * must provide; actual plugin wiring happens in the mobile-app shell.
 */
export class CapacitorBridge implements MobileBridge {
  readonly platform: MobilePlatform;

  private resumeCallbacks: Array<() => void> = [];
  private pauseCallbacks: Array<() => void> = [];

  constructor(platform: MobilePlatform) {
    this.platform = platform;
  }

  async getAppInfo(): Promise<AppInfo> {
    // In production: import { App } from '@capacitor/app'; return App.getInfo();
    return {
      id: "ai.nexus.app",
      name: "NEXUS",
      version: "3.14.2",
      build: "1",
      platform: this.platform,
    };
  }

  async getBatteryInfo(): Promise<BatteryInfo> {
    // In production: import { Device } from '@capacitor/device';
    return { level: 1, isCharging: false };
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    // In production: import { Network } from '@capacitor/network';
    return { connected: true, type: "wifi" };
  }

  async getCurrentPosition(): Promise<GeoPosition> {
    // In production: import { Geolocation } from '@capacitor/geolocation';
    return { latitude: 0, longitude: 0, accuracy: 0, timestamp: Date.now() };
  }

  async hapticFeedback(_style: HapticStyle): Promise<void> {
    // In production: import { Haptics } from '@capacitor/haptics';
  }

  async getClipboard(): Promise<ClipboardContent> {
    // In production: import { Clipboard } from '@capacitor/clipboard';
    return { text: "" };
  }

  async setClipboard(_text: string): Promise<void> {
    // In production: Clipboard.write({ string: text });
  }

  async share(payload: SharePayload): Promise<void> {
    // In production: import { Share } from '@capacitor/share';
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
    // In production: import { StatusBar } from '@capacitor/status-bar';
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
    // In production: import { Browser } from '@capacitor/browser';
    void url;
  }

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
    this.storage.clear();
    this.resumeCallbacks = [];
    this.pauseCallbacks = [];
  }
}
