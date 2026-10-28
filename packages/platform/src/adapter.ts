/**
 * NEXUS AI — Platform Abstraction Layer
 *
 * Defines the abstract interface that every OS adapter must implement.
 * The PlatformAdapter is the boundary between NEXUS's intent system and
 * real operating system commands. Each action carries a SecurityAction
 * so the pipeline can gate risky operations through the Security Engine.
 *
 * Supported capability categories:
 *  - Application control (launch, close, focus, list running)
 *  - File/folder operations (list, create, delete, move, copy, read info)
 *  - System control (volume, brightness, DnD, sleep, lock, notifications)
 *  - Clipboard operations (read, write)
 *  - Process management (list, kill)
 */

import { RiskLevel, type SecurityAction } from "@nexus/security";

// ── Result Types ───────────────────────────────────────────────────────────────

export interface PlatformResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  /** The OS-level command that was executed (for audit trail). */
  readonly command?: string;
}

export interface AppInfo {
  readonly name: string;
  readonly pid?: number;
  readonly bundleId?: string;
  readonly path?: string;
  readonly running: boolean;
}

export interface FileInfo {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly size: number;
  readonly modifiedAt: string;
  readonly createdAt: string;
}

export interface ProcessInfo {
  readonly pid: number;
  readonly name: string;
  readonly cpu: number;
  readonly memory: number;
}

export interface SystemState {
  readonly volume: number; // 0-100
  readonly muted: boolean;
  readonly brightness: number; // 0-100
  readonly doNotDisturb: boolean;
  readonly batteryLevel?: number;
  readonly isCharging?: boolean;
  readonly activeApp?: string;
  readonly screenLocked: boolean;
}

// ── Platform Adapter Interface ─────────────────────────────────────────────────

export type PlatformId = "darwin" | "win32" | "linux" | "mock";

export interface PlatformAdapter {
  readonly id: PlatformId;
  readonly name: string;

  // ── Application Control ──────────────────────────────────────────────────

  /** Launch an application by name or path. */
  launchApp(appName: string): Promise<PlatformResult<AppInfo>>;
  /** Close/quit an application. */
  closeApp(appName: string): Promise<PlatformResult>;
  /** Bring an application to focus. */
  focusApp(appName: string): Promise<PlatformResult>;
  /** List currently running applications. */
  listRunningApps(): Promise<PlatformResult<AppInfo[]>>;

  // ── File/Folder Operations ───────────────────────────────────────────────

  /** List files in a directory. */
  listFiles(dirPath: string): Promise<PlatformResult<FileInfo[]>>;
  /** Create a file or directory. */
  createFile(filePath: string, isDirectory?: boolean): Promise<PlatformResult>;
  /** Delete a file or directory. */
  deleteFile(filePath: string): Promise<PlatformResult>;
  /** Move/rename a file or directory. */
  moveFile(source: string, destination: string): Promise<PlatformResult>;
  /** Copy a file or directory. */
  copyFile(source: string, destination: string): Promise<PlatformResult>;
  /** Open a file with the default application. */
  openFile(filePath: string): Promise<PlatformResult>;

  // ── System Control ───────────────────────────────────────────────────────

  /** Get current system state. */
  getSystemState(): Promise<PlatformResult<SystemState>>;
  /** Set system volume (0-100). */
  setVolume(level: number): Promise<PlatformResult>;
  /** Set screen brightness (0-100). */
  setBrightness(level: number): Promise<PlatformResult>;
  /** Toggle Do Not Disturb mode. */
  setDoNotDisturb(enabled: boolean): Promise<PlatformResult>;
  /** Put the system to sleep. */
  sleep(): Promise<PlatformResult>;
  /** Lock the screen. */
  lockScreen(): Promise<PlatformResult>;
  /** Show a system notification. */
  showNotification(title: string, body: string): Promise<PlatformResult>;

  // ── Clipboard ────────────────────────────────────────────────────────────

  /** Read clipboard content. */
  readClipboard(): Promise<PlatformResult<string>>;
  /** Write to clipboard. */
  writeClipboard(text: string): Promise<PlatformResult>;

  // ── Process Management ───────────────────────────────────────────────────

  /** List running processes with resource usage. */
  listProcesses(): Promise<PlatformResult<ProcessInfo[]>>;
  /** Terminate a process by PID. */
  killProcess(pid: number): Promise<PlatformResult>;
}

// ── Risk Classification ────────────────────────────────────────────────────────

/**
 * Maps platform action kinds to their risk level. This ensures that all
 * PC operations go through the Security Engine with appropriate gates.
 *
 * Risk guidelines:
 *  - None/Low: Read-only, non-destructive (list files, get state, read clipboard)
 *  - Medium: State-changing but reversible (launch app, set volume, create file)
 *  - High: Potentially disruptive (close app, kill process, move/delete file)
 *  - Critical: System-level irreversible (sleep, format, wipe)
 */
export const PC_ACTION_RISKS: Record<string, RiskLevel> = {
  // Application
  "pc.app.launch": RiskLevel.Medium,
  "pc.app.close": RiskLevel.High,
  "pc.app.focus": RiskLevel.Low,
  "pc.app.list": RiskLevel.None,

  // File operations
  "pc.file.list": RiskLevel.None,
  "pc.file.create": RiskLevel.Medium,
  "pc.file.delete": RiskLevel.High,
  "pc.file.move": RiskLevel.High,
  "pc.file.copy": RiskLevel.Medium,
  "pc.file.open": RiskLevel.Low,

  // System
  "pc.system.state": RiskLevel.None,
  "pc.system.volume": RiskLevel.Low,
  "pc.system.brightness": RiskLevel.Low,
  "pc.system.dnd": RiskLevel.Medium,
  "pc.system.sleep": RiskLevel.Critical,
  "pc.system.lock": RiskLevel.High,
  "pc.system.notify": RiskLevel.Low,

  // Clipboard
  "pc.clipboard.read": RiskLevel.Low,
  "pc.clipboard.write": RiskLevel.Low,

  // Process
  "pc.process.list": RiskLevel.None,
  "pc.process.kill": RiskLevel.High,
};

/** Create a SecurityAction for a platform operation. */
export function pcAction(kind: string, description?: string): SecurityAction {
  const risk = PC_ACTION_RISKS[kind] ?? RiskLevel.Medium;
  return { kind, risk, description };
}

// ── Work Mode ──────────────────────────────────────────────────────────────────

export interface WorkModeConfig {
  /** Apps to launch when entering work mode. */
  readonly launchApps: readonly string[];
  /** Whether to enable Do Not Disturb. */
  readonly enableDnD: boolean;
  /** Volume level (0 = mute). */
  readonly volume: number;
  /** Optional: close these "distraction" apps. */
  readonly closeApps?: readonly string[];
}

export const DEFAULT_WORK_MODE: WorkModeConfig = {
  launchApps: ["Visual Studio Code", "Terminal", "Safari"],
  enableDnD: true,
  volume: 20,
  closeApps: ["Music", "Messages", "Slack"],
};

export interface WorkModeStep {
  readonly action: SecurityAction;
  readonly description: string;
  readonly execute: (adapter: PlatformAdapter) => Promise<PlatformResult>;
}

/**
 * Generate the sequence of steps for entering "Work Mode".
 * Each step carries a SecurityAction so the pipeline gates them appropriately.
 */
export function planWorkMode(config: WorkModeConfig = DEFAULT_WORK_MODE): WorkModeStep[] {
  const steps: WorkModeStep[] = [];

  // Set DnD
  if (config.enableDnD) {
    steps.push({
      action: pcAction("pc.system.dnd", "Enable Do Not Disturb for work mode"),
      description: "Enable Do Not Disturb",
      execute: (a) => a.setDoNotDisturb(true) as Promise<PlatformResult>,
    });
  }

  // Set volume
  steps.push({
    action: pcAction("pc.system.volume", `Set volume to ${config.volume}%`),
    description: `Set volume to ${config.volume}%`,
    execute: (a) => a.setVolume(config.volume) as Promise<PlatformResult>,
  });

  // Close distracting apps
  if (config.closeApps) {
    for (const app of config.closeApps) {
      steps.push({
        action: pcAction("pc.app.close", `Close ${app}`),
        description: `Close ${app}`,
        execute: (a) => a.closeApp(app) as Promise<PlatformResult>,
      });
    }
  }

  // Launch work apps
  for (const app of config.launchApps) {
    steps.push({
      action: pcAction("pc.app.launch", `Launch ${app}`),
      description: `Launch ${app}`,
      execute: (a) => a.launchApp(app) as Promise<PlatformResult>,
    });
  }

  return steps;
}
