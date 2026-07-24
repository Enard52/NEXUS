/**
 * NEXUS AI — Platform Abstraction Layer (FAZ 3, 8)
 *
 * The PC Agent speaks to a desktop through a platform-agnostic contract: open /
 * close apps, read / write / delete files, and system controls (volume, sleep).
 * Core/agents issue the same {@link PlatformCommand} regardless of OS; a concrete
 * PlatformAgent (macOS first — FAZ 3; Windows/Linux — FAZ 8) translates it.
 *
 * Every command carries an intrinsic risk (via {@link riskOf}) so risky actions
 * (delete a file, put the machine to sleep) are routed through the Security
 * Engine's confirmation flow (FAZ 11) exactly like device actions. The bundled
 * MockPlatformAgent is a deterministic virtual desktop for dev/tests; a real OS
 * agent implements the same interface and never fabricates success unwired.
 */

import { RiskLevel, type SecurityAction } from "@nexus/security";

export type OsFamily = "macos" | "windows" | "linux";

export type PlatformActionKind =
  | "app.open"
  | "app.close"
  | "file.read"
  | "file.write"
  | "file.delete"
  | "system.volume"
  | "system.sleep";

export interface PlatformCommand {
  readonly action: PlatformActionKind;
  /** App name or file path, depending on the action. */
  readonly target?: string;
  /** Payload: file contents for file.write, 0–100 for system.volume. */
  readonly value?: string | number;
}

export interface PlatformResult {
  readonly ok: boolean;
  readonly message: string;
  readonly data?: string;
}

/** Intrinsic risk of a platform action — reads are cheap, deletes are dangerous. */
export function riskOf(action: PlatformActionKind): RiskLevel {
  switch (action) {
    case "file.read":
    case "app.open":
    case "system.volume":
      return RiskLevel.Low;
    case "app.close":
    case "file.write":
      return RiskLevel.Medium;
    case "system.sleep":
      return RiskLevel.High;
    case "file.delete":
      return RiskLevel.Critical;
  }
}

/** Wrap a command as a SecurityAction so it can pass through the middleware. */
export function toSecurityAction(command: PlatformCommand): SecurityAction {
  return {
    kind: `platform.${command.action}`,
    risk: riskOf(command.action),
    description: command.target,
  };
}

export class PlatformError extends Error {}

/** The OS-agnostic contract Core/agents depend on. */
export interface PlatformAgent {
  readonly os: OsFamily;
  run(command: PlatformCommand): PlatformResult;
}

/**
 * Deterministic virtual desktop: tracks running apps, an in-memory file system
 * and system state. Real OS agents (FAZ 3 macOS, FAZ 8 Windows/Linux) implement
 * the same contract against AppleScript / Win32-UIAutomation / shell.
 */
export class MockPlatformAgent implements PlatformAgent {
  private readonly runningApps = new Set<string>();
  private readonly files = new Map<string, string>();
  private volume = 50;
  private asleep = false;

  constructor(
    readonly os: OsFamily = "macos",
    seedFiles: Readonly<Record<string, string>> = {},
  ) {
    for (const [path, content] of Object.entries(seedFiles)) this.files.set(path, content);
  }

  run(command: PlatformCommand): PlatformResult {
    switch (command.action) {
      case "app.open":
        return this.requireTarget(command, (app) => {
          this.runningApps.add(app);
          return { ok: true, message: `Opened ${app}` };
        });
      case "app.close":
        return this.requireTarget(command, (app) => {
          const wasRunning = this.runningApps.delete(app);
          return {
            ok: wasRunning,
            message: wasRunning ? `Closed ${app}` : `${app} was not running`,
          };
        });
      case "file.read":
        return this.requireTarget(command, (path) => {
          if (!this.files.has(path)) return { ok: false, message: `No such file: ${path}` };
          return { ok: true, message: `Read ${path}`, data: this.files.get(path) };
        });
      case "file.write":
        return this.requireTarget(command, (path) => {
          this.files.set(path, String(command.value ?? ""));
          return { ok: true, message: `Wrote ${path}` };
        });
      case "file.delete":
        return this.requireTarget(command, (path) => {
          const existed = this.files.delete(path);
          return { ok: existed, message: existed ? `Deleted ${path}` : `No such file: ${path}` };
        });
      case "system.volume": {
        const v = Number(command.value);
        if (!Number.isFinite(v) || v < 0 || v > 100) {
          return { ok: false, message: "Volume must be between 0 and 100" };
        }
        this.volume = v;
        return { ok: true, message: `Volume set to ${v}` };
      }
      case "system.sleep":
        this.asleep = true;
        return { ok: true, message: "System going to sleep" };
    }
  }

  // Introspection helpers for tests / higher layers.
  isRunning(app: string): boolean {
    return this.runningApps.has(app);
  }
  readVolume(): number {
    return this.volume;
  }
  isAsleep(): boolean {
    return this.asleep;
  }

  private requireTarget(
    command: PlatformCommand,
    fn: (target: string) => PlatformResult,
  ): PlatformResult {
    if (!command.target) throw new PlatformError(`${command.action} requires a target`);
    return fn(command.target);
  }
}

/** Refuses to fabricate success for a real OS that has not been wired (rule #8). */
export class UnconfiguredPlatformAgent implements PlatformAgent {
  constructor(readonly os: OsFamily) {}
  run(_command: PlatformCommand): PlatformResult {
    throw new PlatformError(
      `Platform agent for ${this.os} is not wired yet; connect the real OS backend.`,
    );
  }
}

export const moduleName = "platform" as const;
export const implemented = true;
