/**
 * NEXUS AI — Push Notifications Manager
 *
 * Handles push notification registration, token management, and incoming
 * notification dispatch. Maps notification payloads to NEXUS intents
 * so the Core pipeline can process them.
 */

import type { MobileBridge } from "./bridge.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Push notification registration token. */
export interface PushToken {
  value: string;
  platform: "ios" | "android";
  registeredAt: number;
}

/** Actionable button definition on a notification */
export interface NotificationActionButton {
  id: string;
  title: string;
  destructive?: boolean;
  requiresAuth?: boolean;
  actionUri?: string;
}

/** Incoming notification payload. */
export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  /** If set, the notification was tapped (vs received in foreground). */
  actionId?: string;
  /** Action buttons displayed in the notification tray (actionable notifications) */
  actions?: NotificationActionButton[];
  /** Critical alerts (bypasses silent mode if allowed) */
  isCritical?: boolean;
  timestamp: number;
}

/** Notification channel (Android) or category (iOS). */
export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: "low" | "default" | "high" | "urgent";
  sound?: boolean;
  vibration?: boolean;
}

/** Callback when a notification arrives while app is in foreground. */
export type NotificationHandler = (payload: NotificationPayload) => void;

/** Callback when user taps a notification. */
export type NotificationActionHandler = (payload: NotificationPayload) => void;

/** Token refresh callback. */
export type TokenRefreshHandler = (token: PushToken) => void;

// ─── Default Channels ────────────────────────────────────────────────────────

/** Built-in notification channels for NEXUS. */
export const DEFAULT_CHANNELS: readonly NotificationChannel[] = [
  {
    id: "nexus_home",
    name: "Home Alerts",
    description: "Security alerts, device status changes, and automations",
    importance: "high",
    sound: true,
    vibration: true,
  },
  {
    id: "nexus_reminders",
    name: "Reminders",
    description: "Scheduled reminders and routine notifications",
    importance: "default",
    sound: true,
    vibration: false,
  },
  {
    id: "nexus_agents",
    name: "Agent Updates",
    description: "Notifications from NEXUS AI agents",
    importance: "default",
    sound: false,
    vibration: false,
  },
  {
    id: "nexus_system",
    name: "System",
    description: "App updates, connection status, and system messages",
    importance: "low",
    sound: false,
    vibration: false,
  },
];

// ─── Push Manager ────────────────────────────────────────────────────────────

/**
 * PushManager — manages the full lifecycle of push notifications:
 * - Registration & token acquisition
 * - Channel/category setup
 * - Incoming notification dispatch
 * - Action (tap) routing to NEXUS intents
 */
export class PushManager {
  private bridge: MobileBridge;
  private token: PushToken | null = null;
  private channels: NotificationChannel[] = [...DEFAULT_CHANNELS];
  private handlers: NotificationHandler[] = [];
  private actionHandlers: NotificationActionHandler[] = [];
  private tokenRefreshHandlers: TokenRefreshHandler[] = [];
  private _registered = false;

  constructor(bridge: MobileBridge) {
    this.bridge = bridge;
  }

  /** Whether push notifications are registered. */
  get isRegistered(): boolean {
    return this._registered;
  }

  /** Current push token, or null if not yet registered. */
  get currentToken(): PushToken | null {
    return this.token;
  }

  /** All configured channels. */
  get configuredChannels(): readonly NotificationChannel[] {
    return this.channels;
  }

  /**
   * Register for push notifications.
   * Requests permission if not already granted, then obtains the device token.
   */
  async register(): Promise<PushToken> {
    // In production, this calls Nexus native notifications API.
    // Here we model the flow and store state.
    const token: PushToken = {
      value: `${this.bridge.platform}_token_${Date.now()}`,
      platform: this.bridge.platform,
      registeredAt: Date.now(),
    };

    this.token = token;
    this._registered = true;

    // Ensure channels are created on Android.
    if (this.bridge.platform === "android") {
      await this.createChannels(this.channels);
    }

    return token;
  }

  /** Unregister push notifications. */
  async unregister(): Promise<void> {
    this.token = null;
    this._registered = false;
  }

  /** Create notification channels (Android; no-op on iOS). */
  async createChannels(channels: NotificationChannel[]): Promise<void> {
    this.channels = channels;
    // In production: PushNotifications.createChannel() for each
  }

  /** Add a custom channel. */
  addChannel(channel: NotificationChannel): void {
    const existing = this.channels.findIndex((c) => c.id === channel.id);
    if (existing >= 0) {
      this.channels[existing] = channel;
    } else {
      this.channels.push(channel);
    }
  }

  /** Subscribe to incoming foreground notifications. */
  onNotification(handler: NotificationHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /** Subscribe to notification tap actions. */
  onAction(handler: NotificationActionHandler): () => void {
    this.actionHandlers.push(handler);
    return () => {
      this.actionHandlers = this.actionHandlers.filter((h) => h !== handler);
    };
  }

  /** Subscribe to token refresh events. */
  onTokenRefresh(handler: TokenRefreshHandler): () => void {
    this.tokenRefreshHandlers.push(handler);
    return () => {
      this.tokenRefreshHandlers = this.tokenRefreshHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Dispatch an incoming notification.
   * Called by the native layer when a notification arrives.
   */
  dispatchNotification(payload: NotificationPayload): void {
    if (payload.actionId) {
      // User tapped the notification
      this.actionHandlers.forEach((h) => h(payload));
    } else {
      // Foreground notification
      this.handlers.forEach((h) => h(payload));
    }
  }

  /**
   * Simulate a token refresh (native layer provides a new token).
   */
  refreshToken(newValue: string): void {
    const token: PushToken = {
      value: newValue,
      platform: this.bridge.platform,
      registeredAt: Date.now(),
    };
    this.token = token;
    this.tokenRefreshHandlers.forEach((h) => h(token));
  }

  /**
   * Map a notification payload to a NEXUS intent string.
   * This allows the Core pipeline to process notification actions.
   */
  mapToIntent(payload: NotificationPayload): string | null {
    if (!payload.data) return null;

    const { intent, device, scene, agent } = payload.data;

    if (intent) return intent;
    if (device) return `control device ${device}`;
    if (scene) return `activate scene ${scene}`;
    if (agent) return `ask ${agent}`;

    return null;
  }

  /**
   * Schedules or displays a local notification directly on the device.
   * 100% free, zero cloud fees, zero FCM relay servers needed.
   */
  scheduleLocalNotification(options: {
    id?: string;
    title: string;
    body: string;
    channelId?: string;
    actions?: NotificationActionButton[];
    isCritical?: boolean;
    data?: Record<string, string>;
  }): NotificationPayload {
    const payload: NotificationPayload = {
      id: options.id || `local_notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: options.title,
      body: options.body,
      actions: options.actions,
      isCritical: options.isCritical,
      data: options.data,
      timestamp: Date.now(),
    };
    this.dispatchNotification(payload);
    return payload;
  }
}
