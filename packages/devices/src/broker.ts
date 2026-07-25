/**
 * NEXUS AI — Fake Broker (FAZ 4)
 *
 * A lightweight in-memory pub/sub message broker that simulates IoT protocols
 * (MQTT, Zigbee gateway messages, etc.) for testing and development. Real
 * adapters talk to real brokers/gateways; this allows the full
 * discover–authorize–status–command cycle to work without network dependencies.
 *
 * Features:
 *  - Topic-based pub/sub (MQTT-style with wildcard support)
 *  - Device registration and state management
 *  - Simulated authorization flow (API key / token)
 *  - Message history for auditing
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BrokerMessage {
  readonly topic: string;
  readonly payload: unknown;
  readonly timestamp: number;
  readonly source: string;
}

export interface BrokerDevice {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly protocol: ProtocolType;
  readonly state: Record<string, unknown>;
  readonly authorized: boolean;
}

export type ProtocolType = "mqtt" | "zigbee" | "zwave" | "thread" | "matter" | "bluetooth" | "wifi" | "lan";

export type MessageHandler = (message: BrokerMessage) => void;

// ── Authorization ──────────────────────────────────────────────────────────────

export interface AuthCredentials {
  readonly type: "api_key" | "token" | "pin" | "oauth";
  readonly value: string;
}

export interface AuthResult {
  readonly success: boolean;
  readonly token?: string;
  readonly error?: string;
  readonly expiresAt?: number;
}

// ── Fake Broker ────────────────────────────────────────────────────────────────

/**
 * Simulates an IoT message broker. Connectors publish commands and subscribe
 * to state updates — exactly as they would with a real MQTT broker or Zigbee
 * gateway. The broker maintains device state so the full lifecycle is testable.
 */
export class FakeBroker {
  private readonly devices = new Map<string, BrokerDevice>();
  private readonly subscriptions = new Map<string, MessageHandler[]>();
  private readonly history: BrokerMessage[] = [];
  private readonly authTokens = new Map<string, { brand: string; expiresAt: number }>();
  private tokenSeq = 0;

  // ── Device Management ──────────────────────────────────────────────────────

  /** Register a device on the broker (simulates a device coming online). */
  registerDevice(device: BrokerDevice): void {
    this.devices.set(device.id, device);
    this.publish({
      topic: `devices/${device.brand}/${device.id}/online`,
      payload: { id: device.id, model: device.model, state: device.state },
      timestamp: Date.now(),
      source: "broker",
    });
  }

  /** Remove a device from the broker. */
  removeDevice(id: string): boolean {
    const device = this.devices.get(id);
    if (!device) return false;
    this.devices.delete(id);
    this.publish({
      topic: `devices/${device.brand}/${id}/offline`,
      payload: { id },
      timestamp: Date.now(),
      source: "broker",
    });
    return true;
  }

  /** Get all devices registered for a specific brand. */
  getDevicesByBrand(brand: string): BrokerDevice[] {
    return [...this.devices.values()].filter((d) => d.brand === brand);
  }

  /** Get a specific device by ID. */
  getDevice(id: string): BrokerDevice | undefined {
    return this.devices.get(id);
  }

  // ── Authorization ──────────────────────────────────────────────────────────

  /**
   * Simulate the authorization flow for a brand connector.
   * In real systems this would be OAuth, API key validation, or bridge pairing.
   */
  authorize(brand: string, credentials: AuthCredentials): AuthResult {
    // Simulate: accept any non-empty credential
    if (!credentials.value || credentials.value.length < 3) {
      return { success: false, error: "Invalid credentials: too short" };
    }

    const token = `brk_${brand}_${++this.tokenSeq}`;
    const expiresAt = Date.now() + 3600_000; // 1 hour
    this.authTokens.set(token, { brand, expiresAt });

    // Mark all devices of this brand as authorized
    for (const [id, device] of this.devices) {
      if (device.brand === brand) {
        this.devices.set(id, { ...device, authorized: true });
      }
    }

    this.publish({
      topic: `auth/${brand}/success`,
      payload: { token, expiresAt },
      timestamp: Date.now(),
      source: "broker",
    });

    return { success: true, token, expiresAt };
  }

  /** Validate a previously issued auth token. */
  validateToken(token: string): boolean {
    const entry = this.authTokens.get(token);
    if (!entry) return false;
    return entry.expiresAt > Date.now();
  }

  // ── State Management ───────────────────────────────────────────────────────

  /** Update a device's state (simulates a command reaching the device). */
  updateDeviceState(deviceId: string, patch: Record<string, unknown>): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    if (!device.authorized) return false;

    const updated: BrokerDevice = {
      ...device,
      state: { ...device.state, ...patch },
    };
    this.devices.set(deviceId, updated);

    this.publish({
      topic: `devices/${device.brand}/${deviceId}/state`,
      payload: updated.state,
      timestamp: Date.now(),
      source: deviceId,
    });

    return true;
  }

  /** Read current device state. */
  getDeviceState(deviceId: string): Record<string, unknown> | undefined {
    return this.devices.get(deviceId)?.state;
  }

  // ── Pub/Sub ────────────────────────────────────────────────────────────────

  /** Subscribe to a topic pattern (supports trailing # wildcard). */
  subscribe(topic: string, handler: MessageHandler): void {
    const handlers = this.subscriptions.get(topic) ?? [];
    handlers.push(handler);
    this.subscriptions.set(topic, handlers);
  }

  /** Unsubscribe all handlers for a topic. */
  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
  }

  /** Publish a message to the broker. Delivers to all matching subscribers. */
  publish(message: BrokerMessage): void {
    this.history.push(message);

    for (const [pattern, handlers] of this.subscriptions) {
      if (this.topicMatches(pattern, message.topic)) {
        for (const handler of handlers) {
          handler(message);
        }
      }
    }
  }

  /** Get message history (optionally filtered by topic prefix). */
  getHistory(topicPrefix?: string): readonly BrokerMessage[] {
    if (!topicPrefix) return [...this.history];
    return this.history.filter((m) => m.topic.startsWith(topicPrefix));
  }

  /** Clear all state (devices, subscriptions, history). */
  reset(): void {
    this.devices.clear();
    this.subscriptions.clear();
    this.history.length = 0;
    this.authTokens.clear();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private topicMatches(pattern: string, topic: string): boolean {
    if (pattern === topic) return true;
    if (pattern.endsWith("#")) {
      const prefix = pattern.slice(0, -1);
      return topic.startsWith(prefix);
    }
    // Single-level wildcard (+)
    const patternParts = pattern.split("/");
    const topicParts = topic.split("/");
    if (patternParts.length !== topicParts.length) return false;
    return patternParts.every((p, i) => p === "+" || p === topicParts[i]);
  }
}
