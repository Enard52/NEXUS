/**
 * NEXUS AI — Linux Platform Adapter
 *
 * Uses xdg-open, gio, pactl, xdotool, and other standard Linux tools
 * for application control, file operations, and system management.
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

async function run(command: string): Promise<PlatformResult<string>> {
  try {
    const { stdout } = await exec(command, { timeout: 15_000 });
    return { success: true, data: stdout.trim(), command };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command };
  }
}

export class LinuxPlatformAdapter implements PlatformAdapter {
  readonly id: PlatformId = "linux";
  readonly name = "Linux";

  // ── Application Control ──────────────────────────────────────────────────

  async launchApp(appName: string): Promise<PlatformResult<AppInfo>> {
    // Try xdg-open first, fallback to direct launch
    const result = await run(`nohup ${appName} > /dev/null 2>&1 & echo $!`);
    if (!result.success) return { success: false, error: result.error };
    const pid = parseInt(result.data ?? "0", 10);
    return {
      success: true,
      data: { name: appName, pid, running: true },
      command: result.command,
    };
  }

  async closeApp(appName: string): Promise<PlatformResult> {
    return run(`pkill -f "${appName}"`);
  }

  async focusApp(appName: string): Promise<PlatformResult> {
    return run(`xdotool search --name "${appName}" windowactivate`);
  }

  async listRunningApps(): Promise<PlatformResult<AppInfo[]>> {
    const result = await run(
      "wmctrl -l -p 2>/dev/null || xdotool search --name '' getwindowname %@ 2>/dev/null || echo ''",
    );
    if (!result.success) return { success: true, data: [] };
    const lines = (result.data ?? "").split("\n").filter(Boolean);
    const apps: AppInfo[] = lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      const name = parts.slice(4).join(" ") || parts[0] || "unknown";
      return { name, running: true };
    });
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
          // Skip inaccessible
        }
      }
      return { success: true, data: files };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async createFile(filePath: string, isDirectory = false): Promise<PlatformResult> {
    return run(isDirectory ? `mkdir -p "${filePath}"` : `touch "${filePath}"`);
  }

  async deleteFile(filePath: string): Promise<PlatformResult> {
    // Use gio trash for safe deletion (sends to trash)
    return run(`gio trash "${filePath}"`);
  }

  async moveFile(source: string, destination: string): Promise<PlatformResult> {
    return run(`mv "${source}" "${destination}"`);
  }

  async copyFile(source: string, destination: string): Promise<PlatformResult> {
    return run(`cp -r "${source}" "${destination}"`);
  }

  async openFile(filePath: string): Promise<PlatformResult> {
    return run(`xdg-open "${filePath}"`);
  }

  // ── System Control ───────────────────────────────────────────────────────

  async getSystemState(): Promise<PlatformResult<SystemState>> {
    const [volResult, battResult] = await Promise.all([
      run(
        "pactl get-sink-volume @DEFAULT_SINK@ 2>/dev/null || amixer get Master 2>/dev/null || echo '50'",
      ),
      run("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo ''"),
    ]);

    // Parse volume
    let volume = 50;
    const volMatch = (volResult.data ?? "").match(/(\d+)%/);
    if (volMatch) volume = parseInt(volMatch[1]!, 10);

    const batteryLevel = battResult.data ? parseInt(battResult.data, 10) : undefined;

    return {
      success: true,
      data: {
        volume,
        muted: volume === 0,
        brightness: 80,
        doNotDisturb: false,
        batteryLevel: isNaN(batteryLevel ?? NaN) ? undefined : batteryLevel,
        isCharging: false,
        screenLocked: false,
      },
    };
  }

  async setVolume(level: number): Promise<PlatformResult> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return run(
      `pactl set-sink-volume @DEFAULT_SINK@ ${clamped}% 2>/dev/null || amixer set Master ${clamped}%`,
    );
  }

  async setBrightness(level: number): Promise<PlatformResult> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return run(`brightnessctl set ${clamped}%`);
  }

  async setDoNotDisturb(enabled: boolean): Promise<PlatformResult> {
    // GNOME notifications
    return run(
      `dbus-send --session --type=method_call --dest=org.freedesktop.Notifications /org/freedesktop/Notifications org.freedesktop.DBus.Properties.Set string:"org.freedesktop.Notifications" string:"Inhibited" variant:boolean:${enabled}`,
    );
  }

  async sleep(): Promise<PlatformResult> {
    return run("systemctl suspend");
  }

  async lockScreen(): Promise<PlatformResult> {
    return run("loginctl lock-session 2>/dev/null || xdg-screensaver lock");
  }

  async showNotification(title: string, body: string): Promise<PlatformResult> {
    return run(`notify-send "${title}" "${body}"`);
  }

  // ── Clipboard ────────────────────────────────────────────────────────────

  async readClipboard(): Promise<PlatformResult<string>> {
    return run("xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output");
  }

  async writeClipboard(text: string): Promise<PlatformResult> {
    return run(
      `echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard 2>/dev/null || echo "${text.replace(/"/g, '\\"')}" | xsel --clipboard --input`,
    );
  }

  // ── Process Management ───────────────────────────────────────────────────

  async listProcesses(): Promise<PlatformResult<ProcessInfo[]>> {
    const result = await run("ps aux --sort=-%cpu | head -20");
    if (!result.success) return { success: false, error: result.error };
    const lines = (result.data ?? "").split("\n").slice(1);
    const procs: ProcessInfo[] = lines.filter(Boolean).map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[1] ?? "0", 10),
        name: parts.slice(10).join(" ") || "unknown",
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
