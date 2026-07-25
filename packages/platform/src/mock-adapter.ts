/**
 * NEXUS AI — Mock Platform Adapter (FAZ 3)
 *
 * Deterministic in-memory adapter used for testing and development.
 * Records all calls and returns predictable results without touching the OS.
 */

import type {
  AppInfo,
  FileInfo,
  PlatformAdapter,
  PlatformId,
  PlatformResult,
  ProcessInfo,
  SystemState,
} from "./adapter.js";

export interface MockCall {
  readonly method: string;
  readonly args: unknown[];
  readonly at: number;
}

export class MockPlatformAdapter implements PlatformAdapter {
  readonly id: PlatformId = "mock";
  readonly name = "Mock Platform (Test)";
  readonly calls: MockCall[] = [];

  private state: SystemState = {
    volume: 50,
    muted: false,
    brightness: 80,
    doNotDisturb: false,
    batteryLevel: 85,
    isCharging: true,
    activeApp: "Finder",
    screenLocked: false,
  };

  private runningApps: AppInfo[] = [
    { name: "Finder", pid: 1, running: true, bundleId: "com.apple.finder" },
    { name: "Safari", pid: 200, running: true, bundleId: "com.apple.Safari" },
  ];

  private files: FileInfo[] = [
    {
      name: "Documents",
      path: "/Users/user/Documents",
      isDirectory: true,
      size: 0,
      modifiedAt: "2025-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      name: "notes.txt",
      path: "/Users/user/Documents/notes.txt",
      isDirectory: false,
      size: 1024,
      modifiedAt: "2025-06-01T00:00:00Z",
      createdAt: "2025-06-01T00:00:00Z",
    },
  ];

  private clipboard = "";

  private record(method: string, args: unknown[]): void {
    this.calls.push({ method, args, at: Date.now() });
  }

  reset(): void {
    this.calls.length = 0;
  }

  // ── Application Control ──────────────────────────────────────────────────

  async launchApp(appName: string): Promise<PlatformResult<AppInfo>> {
    this.record("launchApp", [appName]);
    const app: AppInfo = {
      name: appName,
      pid: 100 + this.runningApps.length,
      running: true,
    };
    this.runningApps.push(app);
    return { success: true, data: app, command: `open -a "${appName}"` };
  }

  async closeApp(appName: string): Promise<PlatformResult> {
    this.record("closeApp", [appName]);
    const idx = this.runningApps.findIndex(
      (a) => a.name.toLowerCase() === appName.toLowerCase(),
    );
    if (idx === -1) {
      return { success: false, error: `App "${appName}" not running` };
    }
    this.runningApps.splice(idx, 1);
    return { success: true, command: `osascript -e 'quit app "${appName}"'` };
  }

  async focusApp(appName: string): Promise<PlatformResult> {
    this.record("focusApp", [appName]);
    this.state = { ...this.state, activeApp: appName };
    return { success: true, command: `osascript -e 'activate app "${appName}"'` };
  }

  async listRunningApps(): Promise<PlatformResult<AppInfo[]>> {
    this.record("listRunningApps", []);
    return { success: true, data: [...this.runningApps] };
  }

  // ── File/Folder Operations ───────────────────────────────────────────────

  async listFiles(dirPath: string): Promise<PlatformResult<FileInfo[]>> {
    this.record("listFiles", [dirPath]);
    const matching = this.files.filter((f) => f.path.startsWith(dirPath));
    return { success: true, data: matching };
  }

  async createFile(filePath: string, isDirectory = false): Promise<PlatformResult> {
    this.record("createFile", [filePath, isDirectory]);
    const name = filePath.split("/").pop() ?? filePath;
    const now = new Date().toISOString();
    this.files.push({
      name,
      path: filePath,
      isDirectory,
      size: 0,
      modifiedAt: now,
      createdAt: now,
    });
    return { success: true, command: isDirectory ? `mkdir -p "${filePath}"` : `touch "${filePath}"` };
  }

  async deleteFile(filePath: string): Promise<PlatformResult> {
    this.record("deleteFile", [filePath]);
    const idx = this.files.findIndex((f) => f.path === filePath);
    if (idx === -1) return { success: false, error: `File not found: ${filePath}` };
    this.files.splice(idx, 1);
    return { success: true, command: `rm -rf "${filePath}"` };
  }

  async moveFile(source: string, destination: string): Promise<PlatformResult> {
    this.record("moveFile", [source, destination]);
    const file = this.files.find((f) => f.path === source);
    if (!file) return { success: false, error: `Source not found: ${source}` };
    const idx = this.files.indexOf(file);
    const name = destination.split("/").pop() ?? file.name;
    this.files[idx] = { ...file, path: destination, name };
    return { success: true, command: `mv "${source}" "${destination}"` };
  }

  async copyFile(source: string, destination: string): Promise<PlatformResult> {
    this.record("copyFile", [source, destination]);
    const file = this.files.find((f) => f.path === source);
    if (!file) return { success: false, error: `Source not found: ${source}` };
    const name = destination.split("/").pop() ?? file.name;
    this.files.push({ ...file, path: destination, name });
    return { success: true, command: `cp -r "${source}" "${destination}"` };
  }

  async openFile(filePath: string): Promise<PlatformResult> {
    this.record("openFile", [filePath]);
    return { success: true, command: `open "${filePath}"` };
  }

  // ── System Control ───────────────────────────────────────────────────────

  async getSystemState(): Promise<PlatformResult<SystemState>> {
    this.record("getSystemState", []);
    return { success: true, data: { ...this.state } };
  }

  async setVolume(level: number): Promise<PlatformResult> {
    this.record("setVolume", [level]);
    this.state = { ...this.state, volume: Math.max(0, Math.min(100, level)), muted: level === 0 };
    return { success: true, command: `osascript -e 'set volume output volume ${level}'` };
  }

  async setBrightness(level: number): Promise<PlatformResult> {
    this.record("setBrightness", [level]);
    this.state = { ...this.state, brightness: Math.max(0, Math.min(100, level)) };
    return { success: true, command: `brightness ${level / 100}` };
  }

  async setDoNotDisturb(enabled: boolean): Promise<PlatformResult> {
    this.record("setDoNotDisturb", [enabled]);
    this.state = { ...this.state, doNotDisturb: enabled };
    return { success: true, command: `shortcuts run "Toggle DnD"` };
  }

  async sleep(): Promise<PlatformResult> {
    this.record("sleep", []);
    return { success: true, command: `pmset sleepnow` };
  }

  async lockScreen(): Promise<PlatformResult> {
    this.record("lockScreen", []);
    this.state = { ...this.state, screenLocked: true };
    return { success: true, command: `pmset displaysleepnow` };
  }

  async showNotification(title: string, body: string): Promise<PlatformResult> {
    this.record("showNotification", [title, body]);
    return {
      success: true,
      command: `osascript -e 'display notification "${body}" with title "${title}"'`,
    };
  }

  // ── Clipboard ────────────────────────────────────────────────────────────

  async readClipboard(): Promise<PlatformResult<string>> {
    this.record("readClipboard", []);
    return { success: true, data: this.clipboard };
  }

  async writeClipboard(text: string): Promise<PlatformResult> {
    this.record("writeClipboard", [text]);
    this.clipboard = text;
    return { success: true, command: `echo "${text}" | pbcopy` };
  }

  // ── Process Management ───────────────────────────────────────────────────

  async listProcesses(): Promise<PlatformResult<ProcessInfo[]>> {
    this.record("listProcesses", []);
    const procs: ProcessInfo[] = this.runningApps.map((a) => ({
      pid: a.pid ?? 1,
      name: a.name,
      cpu: Math.random() * 10,
      memory: Math.random() * 500,
    }));
    return { success: true, data: procs };
  }

  async killProcess(pid: number): Promise<PlatformResult> {
    this.record("killProcess", [pid]);
    const idx = this.runningApps.findIndex((a) => a.pid === pid);
    if (idx !== -1) this.runningApps.splice(idx, 1);
    return { success: true, command: `kill -9 ${pid}` };
  }
}
