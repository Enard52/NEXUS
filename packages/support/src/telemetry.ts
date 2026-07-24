/**
 * NEXUS AI — Telemetry & Analytics (FAZ 20 / FAZ 15)
 *
 * Opt-in product analytics and crash reporting. Designed to be completely
 * privacy-preserving (no PII, no specific device data sent unless opted in).
 * This service receives usage patterns to improve the app.
 */

export type TelemetryEventType =
  | "app_start"
  | "device_added"
  | "routine_executed"
  | "crash"
  | "page_view";

export interface TelemetryEvent {
  readonly type: TelemetryEventType;
  readonly timestamp: string;
  readonly payload?: Record<string, string | number | boolean>;
}

export interface TelemetryOptions {
  /** If false, the service silently drops all events. */
  optIn: boolean;
  /** Sink for recorded events. Defaults to console in dev, or a collector in prod. */
  sink?: (event: TelemetryEvent) => void;
}

export class TelemetryService {
  private optIn: boolean;
  private readonly sink: (event: TelemetryEvent) => void;

  constructor(options: TelemetryOptions) {
    this.optIn = options.optIn;
    this.sink = options.sink ?? ((e) => console.log("[Telemetry]", e));
  }

  setOptIn(enabled: boolean) {
    this.optIn = enabled;
  }

  isOptedIn(): boolean {
    return this.optIn;
  }

  track(type: TelemetryEventType, payload?: Record<string, string | number | boolean>) {
    if (!this.optIn) return;
    this.sink({
      type,
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  recordCrash(error: Error, context?: string) {
    if (!this.optIn) return;
    this.sink({
      type: "crash",
      timestamp: new Date().toISOString(),
      payload: {
        message: error.message,
        context: context ?? "unknown",
      },
    });
  }
}
