/**
 * NEXUS AI — Mobile Service Orchestrator (FAZ 9)
 *
 * The top-level coordinator that wires all mobile-native subsystems together:
 * - MobileBridge (native platform access)
 * - PushManager (notifications)
 * - PermissionsManager (native permissions)
 * - MobileVoiceBridge (voice interaction)
 * - RemoteConnection (server connectivity)
 * - DeepLinkRouter (URL handling)
 *
 * MobileService is the single entry point the Capacitor shell instantiates
 * at app launch. It manages the full mobile lifecycle: init → ready → active
 * → background → terminated.
 */

import type { MobileBridge, MobilePlatform } from "./bridge.js";
import { PushManager, type NotificationPayload } from "./notifications.js";
import { PermissionsManager, type PermissionName } from "./permissions.js";
import { MobileVoiceBridge, type VoiceBridgeConfig } from "./voice-bridge.js";
import {
  RemoteConnection,
  type ConnectionOptions,
  type ServerEndpoint,
} from "./remote-access.js";
import { DeepLinkRouter, type DeepLinkResult } from "./deep-links.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Mobile app lifecycle state. */
export type AppLifecycleState = "initializing" | "ready" | "active" | "background" | "terminated";

/** MobileService configuration. */
export interface MobileServiceConfig {
  /** Server endpoint for remote access. */
  server?: ServerEndpoint;
  /** Voice bridge options. */
  voice?: Partial<VoiceBridgeConfig>;
  /** Connection options. */
  connection?: Partial<ConnectionOptions>;
  /** Auto-register for push on init. */
  autoRegisterPush?: boolean;
  /** Permissions to request on first launch. */
  initialPermissions?: PermissionName[];
}

/** Service event. */
export type ServiceEvent =
  | { type: "lifecycle"; state: AppLifecycleState }
  | { type: "deep-link"; result: DeepLinkResult }
  | { type: "notification"; payload: NotificationPayload }
  | { type: "connection-change"; connected: boolean; mode: "local" | "remote" | "none" }
  | { type: "intent"; text: string; source: "voice" | "deep-link" | "notification" }
  | { type: "error"; subsystem: string; message: string };

export type ServiceEventHandler = (event: ServiceEvent) => void;

// ─── Mobile Service ──────────────────────────────────────────────────────────

/**
 * MobileService — the orchestrator of all mobile-native subsystems.
 *
 * Lifecycle:
 * 1. Construct with bridge + config
 * 2. Call init() to bootstrap all subsystems
 * 3. Service emits events as things happen (notifications, deep links, etc.)
 * 4. Call shutdown() on app terminate
 */
export class MobileService {
  readonly bridge: MobileBridge;
  readonly push: PushManager;
  readonly permissions: PermissionsManager;
  readonly voice: MobileVoiceBridge;
  readonly remote: RemoteConnection;
  readonly deepLinks: DeepLinkRouter;

  private _state: AppLifecycleState = "initializing";
  private eventHandlers: ServiceEventHandler[] = [];
  private config: MobileServiceConfig;

  constructor(bridge: MobileBridge, config: MobileServiceConfig = {}) {
    this.bridge = bridge;
    this.config = config;

    // Initialize subsystems
    this.push = new PushManager(bridge);
    this.permissions = new PermissionsManager(bridge.platform);
    this.voice = new MobileVoiceBridge(bridge, config.voice);
    this.remote = new RemoteConnection(bridge, config.connection);
    this.deepLinks = new DeepLinkRouter();

    // Wire internal event routing
    this.wireSubsystems();
  }

  /** Current lifecycle state. */
  get state(): AppLifecycleState {
    return this._state;
  }

  /** The mobile platform. */
  get platform(): MobilePlatform {
    return this.bridge.platform;
  }

  /** Whether fully initialized and ready. */
  get isReady(): boolean {
    return this._state === "ready" || this._state === "active";
  }

  /** Subscribe to service events. */
  on(handler: ServiceEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Initialize the mobile service.
   * Bootstraps all subsystems, requests initial permissions, connects to server.
   */
  async init(): Promise<void> {
    // 1. Request initial permissions if configured
    if (this.config.initialPermissions) {
      for (const perm of this.config.initialPermissions) {
        await this.permissions.request(perm);
      }
    }

    // 2. Register for push notifications if configured
    if (this.config.autoRegisterPush) {
      const notifGranted = this.permissions.isGranted("notifications");
      if (notifGranted) {
        await this.push.register();
      }
    }

    // 3. Configure remote connection
    if (this.config.server) {
      this.remote.configure(this.config.server);
      // Attempt connection (non-blocking — will retry)
      await this.remote.connect();
    }

    // 4. Set up lifecycle listeners on the bridge
    this.bridge.onResume(() => this.handleResume());
    this.bridge.onPause(() => this.handlePause());

    // 5. Mark ready
    this._state = "ready";
    this.emit({ type: "lifecycle", state: "ready" });
  }

  /**
   * Process an intent from any source (voice, deep link, notification).
   * This is the central dispatch point that would forward to NexusCore.
   */
  async processIntent(text: string, source: Extract<ServiceEvent, { type: "intent" }>["source"]): Promise<void> {
    this.emit({ type: "intent", text, source });

    // Forward to remote server if connected
    if (this.remote.isConnected) {
      await this.remote.sendRequest("intent", { text, source });
    }
  }

  /**
   * Handle an incoming deep link URL.
   */
  handleDeepLink(url: string): DeepLinkResult {
    const result = this.deepLinks.handle(url);
    this.emit({ type: "deep-link", result });

    // If the deep link maps to an intent, process it
    if (result.intent) {
      void this.processIntent(result.intent, "deep-link");
    }

    return result;
  }

  /**
   * Handle an incoming notification (forwarded from native layer).
   */
  handleNotification(payload: NotificationPayload): void {
    this.push.dispatchNotification(payload);
    this.emit({ type: "notification", payload });

    // Map notification to intent if possible
    const intent = this.push.mapToIntent(payload);
    if (intent && payload.actionId) {
      void this.processIntent(intent, "notification");
    }
  }

  /**
   * Start a voice interaction session.
   */
  async startVoiceSession(): Promise<void> {
    // Ensure microphone permission
    if (!this.permissions.isGranted("microphone")) {
      await this.permissions.request("microphone");
    }

    await this.voice.startListening("manual");
  }

  /** Shutdown the service (app terminating). */
  async shutdown(): Promise<void> {
    this._state = "terminated";
    await this.remote.disconnect();
    await this.voice.deactivateAudioSession();
    this.emit({ type: "lifecycle", state: "terminated" });
  }

  // ── Private ──

  private handleResume(): void {
    this._state = "active";
    this.emit({ type: "lifecycle", state: "active" });

    // Reconnect if disconnected
    if (!this.remote.isConnected && this.config.server) {
      void this.remote.connect();
    }
  }

  private handlePause(): void {
    this._state = "background";
    this.emit({ type: "lifecycle", state: "background" });
  }

  private wireSubsystems(): void {
    // Deep link → intent processing
    this.deepLinks.onDeepLink((result) => {
      if (result.intent) {
        void this.processIntent(result.intent, "deep-link");
      }
    });

    // Push notification action → intent processing
    this.push.onAction((payload) => {
      const intent = this.push.mapToIntent(payload);
      if (intent) {
        void this.processIntent(intent, "notification");
      }
    });

    // Voice session completion → intent processing
    this.voice.on((event) => {
      if (event.type === "session-end" && event.session.transcript) {
        void this.processIntent(event.session.transcript, "voice");
      }
    });

    // Remote connection state changes
    this.remote.on((event) => {
      if (event.type === "connected") {
        this.emit({ type: "connection-change", connected: true, mode: event.mode });
      } else if (event.type === "disconnected") {
        this.emit({ type: "connection-change", connected: false, mode: "none" });
      }
    });
  }

  private emit(event: ServiceEvent): void {
    this.eventHandlers.forEach((h) => h(event));
  }
}
