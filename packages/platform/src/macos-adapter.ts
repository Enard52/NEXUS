/**
 * NEXUS AI — macOS Platform Adapter (FAZ 3)
 *
 * Primary platform adapter using osascript (AppleScript/JXA) and native
 * macOS CLI tools for application control, file operations, and system management.
 *
 * NOTE: All exec calls are async and wrapped in try/catch. On non-macOS systems
 * these will gracefully fail with an error result rather than crashing.
 */

import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { stat, readdir } from "node:fs/promises";
import { join } from "node:path";
import type {
  AppInfo,
  FileInfo,
  PlatformAdapter,
  PlatformId,
  PlatformResult,
  ProcessInfo,
  SystemState,
} from "./adapter.js";

const exec = promisify(execCb);

/** Safely execute a shell command and return stdout or an error. */
async function run(command: string): Promise<PlatformResult<string>> {
  try {
    const { stdout } = await exec(command, { timeout: 15_000 });
    return { success: true, data: stdout.trim(), command };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command };
  }
}

/** Execute AppleScript via osascript. */
async function applescript(script: string): Promise<PlatformResult<string>> {
  return run(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}

export class MacosPlatformAdapter implements PlatformAdapter {
  readonly id: PlatformId = "darwin";
  readonly name = "macOS";

  // ── Application Control ──────────────────────────────────────────────────

  async launchApp(appName: string): Promise<PlatformResult<AppInfo>> {
    const cmd = `open -a "${appName}"`;
    const result = await run(cmd);
    if (!result.success) return { success: false, error: result.error, command: cmd };
    return {
      success: true,
      data: { name: appName, running: true },
      command: cmd,
    };
  }

  async closeApp(appName: string): Promise<PlatformResult> {
    const script = `tell application "${appName}" to quit`;
    return applescript(script);
  }

  async focusApp(appName: string): Promise<PlatformResult> {
    const script = `tell application "${appName}" to activate`;
    return applescript(script);
  }

  async listRunningApps(): Promise<PlatformResult<AppInfo[]>> {
    const script =
      'tell application "System Events" to get name of every process whose background only is false';
    const result = await applescript(script);
    if (!result.success) return { success: false, error: result.error };
    const names = (result.data ?? "").split(", ").filter(Boolean);
    const apps: AppInfo[] = names.map((name) => ({ name, running: true }));
    return { success: true, data: apps };
  }

  // ── File/Folder Operations ───────────────────────────────────────────────

  async listFiles(dirPath: string): Promise<PlatformResult<FileInfo[]>> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      const files: FileInfo[] = [];
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        try {
          const s = await stat(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: s.size,
            modifiedAt: s.mtime.toISOString(),
            createdAt: s.birthtime.toISOString(),
          });
        } catch {
          // Skip inaccessible files
        }
      }
      return { success: true, data: files, command: `ls -la "${dirPath}"` };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async createFile(filePath: string, isDirectory = false): Promise<PlatformResult> {
    const cmd = isDirectory ? `mkdir -p "${filePath}"` : `touch "${filePath}"`;
    return run(cmd);
  }

  async deleteFile(filePath: string): Promise<PlatformResult> {
    // Use trash instead of rm for safety (macOS Trash)
    const cmd = `osascript -e 'tell application "Finder" to delete POSIX file "${filePath}"'`;
    return run(cmd);
  }

  async moveFile(source: string, destination: string): Promise<PlatformResult> {
    return run(`mv "${source}" "${destination}"`);
  }

  async copyFile(source: string, destination: string): Promise<PlatformResult> {
    return run(`cp -R "${source}" "${destination}"`);
  }

  async openFile(filePath: string): Promise<PlatformResult> {
    return run(`open "${filePath}"`);
  }

  // ── System Control ───────────────────────────────────────────────────────

  async getSystemState(): Promise<PlatformResult<SystemState>> {
    try {
      const [volResult, dndResult, battResult] = await Promise.all([
        applescript("output volume of (get volume settings)"),
        run("defaults -currentHost read com.apple.notificationcenterui doNotDisturb 2>/dev/null || echo 0"),
        run("pmset -g batt"),
      ]);

      const volume = parseInt(volResult.data ?? "50", 10);
      const dnd = (dndResult.data ?? "0").trim() === "1";

      // Parse battery from pmset output
      const battMatch = (battResult.data ?? "").match(/(\d+)%/);
      const batteryLevel = battMatch ? parseInt(battMatch[1]!, 10) : undefined;
      const isCharging = (battResult.data ?? "").includes("charging");

      return {
        success: true,
        data: {
          volume: isNaN(volume) ? 50 : volume,
          muted: volume === 0,
          brightness: 80, // brightness API requires private frameworks
          doNotDisturb: dnd,
          batteryLevel,
          isCharging,
          screenLocked: false,
        },
      };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async setVolume(level: number): Promise<PlatformResult> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return applescript(`set volume output volume ${clamped}`);
  }

  async setBrightness(level: number): Promise<PlatformResult> {
    // brightness command must be installed: brew install brightness
    const val = (Math.max(0, Math.min(100, level)) / 100).toFixed(2);
    return run(`brightness ${val}`);
  }

  async setDoNotDisturb(enabled: boolean): Promise<PlatformResult> {
    // macOS Monterey+ uses Focus; older uses Notification Center plist
    const script = enabled
      ? 'do shell script "defaults -currentHost write com.apple.notificationcenterui doNotDisturb -bool true && killall NotificationCenter 2>/dev/null || true"'
      : 'do shell script "defaults -currentHost write com.apple.notificationcenterui doNotDisturb -bool false && killall NotificationCenter 2>/dev/null || true"';
    return applescript(script);
  }

  async sleep(): Promise<PlatformResult> {
    return run("pmset sleepnow");
  }

  async lockScreen(): Promise<PlatformResult> {
    return run(
      '/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend',
    );
  }

  async showNotification(title: string, body: string): Promise<PlatformResult> {
    const script = `display notification "${body}" with title "${title}"`;
    return applescript(script);
  }

  // ── Clipboard ────────────────────────────────────────────────────────────

  async readClipboard(): Promise<PlatformResult<string>> {
    return run("pbpaste");
  }

  async writeClipboard(text: string): Promise<PlatformResult> {
    // Pipe text to pbcopy via echo
    return run(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
  }

  // ── Process Management ───────────────────────────────────────────────────

  async listProcesses(): Promise<PlatformResult<ProcessInfo[]>> {
    const result = await run("ps aux --sort=-%cpu | head -20");
    if (!result.success) return { success: false, error: result.error };
    const lines = (result.data ?? "").split("\n").slice(1); // skip header
    const procs: ProcessInfo[] = lines
      .filter(Boolean)
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: parseInt(parts[1] ?? "0", 10),
          name: parts.slice(10).join(" ") || parts[10] || "unknown",
          cpu: parseFloat(parts[2] ?? "0"),
          memory: parseFloat(parts[3] ?? "0"),
        };
      });
    return { success: true, data: procs };
  }

  async killProcess(pid: number): Promise<PlatformResult> {
    return run(`kill -9 ${pid}`);
  }
}
