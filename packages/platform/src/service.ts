import * as os from "node:os";

export interface SystemInfo {
  platform: string;
  release: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
}

export class PlatformService {
  getSystemInfo(): SystemInfo {
    return {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };
  }

  showNotification(title: string, message: string): void {
    // Basic mock for desktop notification (MARKA 8 / FAZ 16 prep)
    console.log(`[Notification] ${title}: ${message}`);
  }
}
