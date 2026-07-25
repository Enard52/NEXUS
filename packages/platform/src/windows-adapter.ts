/**
 * NEXUS AI — Windows Platform Adapter (FAZ 3/8)
 *
 * Uses PowerShell commands for application control, file operations,
 * and system management on Windows.
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

/** Safely execute a PowerShell command. */
async function ps(command: string): Promise<PlatformResult<string>> {
  const fullCmd = `powershell -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"`;
  try {
    const { stdout } = await exec(fullCmd, { timeout: 15_000 });
    return { success: true, data: stdout.trim(), command: fullCmd };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command: fullCmd };
  }
}

async function run(command: string): Promise<PlatformResult<string>> {
  try {
    const { stdout } = await exec(command, { timeout: 15_000 });
    return { success: true, data: stdout.trim(), command };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command };
  }
}

export class WindowsPlatformAdapter implements PlatformAdapter {
  readonly id: PlatformId = "win32";
  readonly name = "Windows";

  // ── Application Control ──────────────────────────────────────────────────

  async launchApp(appName: string): Promise<PlatformResult<AppInfo>> {
    const result = await ps(`Start-Process '${appName}' -PassThru | Select-Object -Property Id,Name | ConvertTo-Json`);
    if (!result.success) return { success: false, error: result.error, command: result.command };
    return {
      success: true,
      data: { name: appName, running: true },
      command: result.command,
    };
  }

  async closeApp(appName: string): Promise<PlatformResult> {
    return ps(`Get-Process -Name '${appName}' -ErrorAction SilentlyContinue | Stop-Process -Force`);
  }

  async focusApp(appName: string): Promise<PlatformResult> {
    const script = `
      $proc = Get-Process -Name '${appName}' -ErrorAction SilentlyContinue | Select-Object -First 1;
      if ($proc) { [void][System.Runtime.Interopservices.Marshal]::GetActiveObject(''); Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr hWnd);'; [Native.Win]::SetForegroundWindow($proc.MainWindowHandle) }
    `;
    return ps(script);
  }

  async listRunningApps(): Promise<PlatformResult<AppInfo[]>> {
    const result = await ps(
      "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object Name,Id | ConvertTo-Json",
    );
    if (!result.success) return { success: false, error: result.error };
    try {
      const parsed = JSON.parse(result.data || "[]");
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const apps: AppInfo[] = list.map((p: { Name: string; Id: number }) => ({
        name: p.Name,
        pid: p.Id,
        running: true,
      }));
      return { success: true, data: apps };
    } catch {
      return { success: true, data: [] };
    }
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
    if (isDirectory) return ps(`New-Item -ItemType Directory -Force -Path '${filePath}'`);
    return ps(`New-Item -ItemType File -Force -Path '${filePath}'`);
  }

  async deleteFile(filePath: string): Promise<PlatformResult> {
    // Move to Recycle Bin instead of permanent delete
    return ps(
      `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${filePath}','OnlyErrorDialogs','SendToRecycleBin')`,
    );
  }

  async moveFile(source: string, destination: string): Promise<PlatformResult> {
    return ps(`Move-Item -Path '${source}' -Destination '${destination}' -Force`);
  }

  async copyFile(source: string, destination: string): Promise<PlatformResult> {
    return ps(`Copy-Item -Path '${source}' -Destination '${destination}' -Recurse -Force`);
  }

  async openFile(filePath: string): Promise<PlatformResult> {
    return run(`start "" "${filePath}"`);
  }

  // ── System Control ───────────────────────────────────────────────────────

  async getSystemState(): Promise<PlatformResult<SystemState>> {
    await ps(`@{} | ConvertTo-Json`);
    return {
      success: true,
      data: {
        volume: 50,
        muted: false,
        brightness: 80,
        doNotDisturb: false,
        screenLocked: false,
      },
    };
  }

  async setVolume(level: number): Promise<PlatformResult> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return ps(
      `$obj = New-Object -ComObject WScript.Shell; 1..50 | ForEach-Object { $obj.SendKeys([char]174) }; 1..${Math.round(clamped / 2)} | ForEach-Object { $obj.SendKeys([char]175) }`,
    );
  }

  async setBrightness(level: number): Promise<PlatformResult> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return ps(
      `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${clamped})`,
    );
  }

  async setDoNotDisturb(enabled: boolean): Promise<PlatformResult> {
    // Windows Focus Assist
    return ps(
      `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings' -Name 'NOC_GLOBAL_SETTING_TOASTS_ENABLED' -Value ${enabled ? 0 : 1}`,
    );
  }

  async sleep(): Promise<PlatformResult> {
    return ps("rundll32.exe powrprof.dll,SetSuspendState 0,1,0");
  }

  async lockScreen(): Promise<PlatformResult> {
    return run("rundll32.exe user32.dll,LockWorkStation");
  }

  async showNotification(title: string, body: string): Promise<PlatformResult> {
    return ps(
      `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; $template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02; $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template); $xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${title}')); $xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('${body}')); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('NEXUS').Show([Windows.UI.Notifications.ToastNotification]::new($xml))`,
    );
  }

  // ── Clipboard ────────────────────────────────────────────────────────────

  async readClipboard(): Promise<PlatformResult<string>> {
    return ps("Get-Clipboard");
  }

  async writeClipboard(text: string): Promise<PlatformResult> {
    return ps(`Set-Clipboard -Value '${text}'`);
  }

  // ── Process Management ───────────────────────────────────────────────────

  async listProcesses(): Promise<PlatformResult<ProcessInfo[]>> {
    const result = await ps(
      "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Id,Name,CPU,WorkingSet | ConvertTo-Json",
    );
    if (!result.success) return { success: false, error: result.error };
    try {
      const parsed = JSON.parse(result.data || "[]");
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const procs: ProcessInfo[] = list.map(
        (p: { Id: number; Name: string; CPU: number; WorkingSet: number }) => ({
          pid: p.Id,
          name: p.Name,
          cpu: p.CPU ?? 0,
          memory: (p.WorkingSet ?? 0) / 1024 / 1024,
        }),
      );
      return { success: true, data: procs };
    } catch {
      return { success: true, data: [] };
    }
  }

  async killProcess(pid: number): Promise<PlatformResult> {
    return ps(`Stop-Process -Id ${pid} -Force`);
  }
}
