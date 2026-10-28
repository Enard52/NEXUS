/**
 * NEXUS AI — DevOps & Operations Layer
 *
 * Production readiness: monitoring, backup/disaster-recovery, OTA updates,
 * and mobile deep-link configuration. All classes are deterministic with
 * injected clocks and storage backends for testability.
 */

// ── Health Monitoring & Alerting ──────────────────────────────────────────────

export type ServiceStatus = "healthy" | "degraded" | "down";

export interface HealthMetrics {
  readonly uptime: number; // ms since start
  readonly totalRequests: number;
  readonly totalErrors: number;
  readonly errorRate: number; // errors / requests (0–1)
  readonly avgLatencyMs: number;
  readonly status: ServiceStatus;
}

export interface AlertRule {
  readonly name: string;
  readonly condition: (metrics: HealthMetrics) => boolean;
}

export interface Alert {
  readonly rule: string;
  readonly at: string;
  readonly metrics: HealthMetrics;
}

export interface MonitorOptions {
  readonly now?: () => number;
  /** Error rate threshold above which status becomes "degraded". Default 0.05. */
  readonly degradedThreshold?: number;
  /** Error rate threshold above which status becomes "down". Default 0.25. */
  readonly downThreshold?: number;
}

export class HealthMonitor {
  private readonly startedAt: number;
  private readonly now: () => number;
  private totalRequests = 0;
  private totalErrors = 0;
  private totalLatencyMs = 0;
  private readonly alerts: Alert[] = [];
  private readonly rules: AlertRule[] = [];
  private readonly degradedThreshold: number;
  private readonly downThreshold: number;

  constructor(options: MonitorOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.startedAt = this.now();
    this.degradedThreshold = options.degradedThreshold ?? 0.05;
    this.downThreshold = options.downThreshold ?? 0.25;
  }

  /** Record a successful request with its latency. */
  recordSuccess(latencyMs: number): void {
    this.totalRequests++;
    this.totalLatencyMs += latencyMs;
    this.checkRules();
  }

  /** Record a failed request with its latency. */
  recordError(latencyMs: number): void {
    this.totalRequests++;
    this.totalErrors++;
    this.totalLatencyMs += latencyMs;
    this.checkRules();
  }

  /** Register an alert rule that fires when its condition is met. */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /** Current health snapshot. */
  getMetrics(): HealthMetrics {
    const errorRate = this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0;
    const avgLatencyMs = this.totalRequests > 0 ? this.totalLatencyMs / this.totalRequests : 0;
    let status: ServiceStatus = "healthy";
    if (errorRate >= this.downThreshold) status = "down";
    else if (errorRate >= this.degradedThreshold) status = "degraded";

    return {
      uptime: this.now() - this.startedAt,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate,
      avgLatencyMs,
      status,
    };
  }

  /** All alerts triggered so far. */
  getAlerts(): readonly Alert[] {
    return [...this.alerts];
  }

  private checkRules(): void {
    const metrics = this.getMetrics();
    for (const rule of this.rules) {
      if (rule.condition(metrics)) {
        this.alerts.push({ rule: rule.name, at: new Date(this.now()).toISOString(), metrics });
      }
    }
  }
}

// ── Backup & Disaster Recovery ────────────────────────────────────────────────

export interface BackupRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly sizeBytes: number;
  readonly status: "complete" | "failed";
}

export interface BackupStorage {
  store(id: string, data: string): void;
  retrieve(id: string): string | undefined;
  list(): readonly BackupRecord[];
}

/** In-memory backup storage for dev/tests. */
export class InMemoryBackupStorage implements BackupStorage {
  private readonly backups = new Map<string, { data: string; record: BackupRecord }>();

  store(id: string, data: string): void {
    this.backups.set(id, {
      data,
      record: {
        id,
        createdAt: new Date().toISOString(),
        sizeBytes: new TextEncoder().encode(data).length,
        status: "complete",
      },
    });
  }

  retrieve(id: string): string | undefined {
    return this.backups.get(id)?.data;
  }

  list(): readonly BackupRecord[] {
    return [...this.backups.values()].map((b) => b.record);
  }
}

export interface BackupSchedulerOptions {
  readonly now?: () => number;
  readonly storage: BackupStorage;
  /** Minimum interval between backups in ms. Default 24h. */
  readonly intervalMs?: number;
}

/**
 * Manages periodic snapshots of cloud memory for disaster recovery.
 * "Kullanıcı hafızası kaybolmayacak şekilde" yedeklenir.
 */
export class BackupScheduler {
  private readonly storage: BackupStorage;
  private readonly intervalMs: number;
  private readonly now: () => number;
  private lastBackupAt = -Infinity;
  private seq = 0;

  constructor(options: BackupSchedulerOptions) {
    this.storage = options.storage;
    this.intervalMs = options.intervalMs ?? 86_400_000;
    this.now = options.now ?? (() => Date.now());
  }

  /** Create a backup if enough time has passed since the last one. */
  backupIfDue(data: string): BackupRecord | null {
    const currentTime = this.now();
    if (currentTime - this.lastBackupAt < this.intervalMs) return null;
    const id = `backup-${++this.seq}`;
    this.storage.store(id, data);
    this.lastBackupAt = currentTime;
    return this.storage.list().find((r) => r.id === id) ?? null;
  }

  /** Force an immediate backup regardless of interval. */
  forceBackup(data: string): BackupRecord {
    const id = `backup-${++this.seq}`;
    this.storage.store(id, data);
    this.lastBackupAt = this.now();
    return this.storage.list().find((r) => r.id === id)!;
  }

  /** Restore from a specific backup. */
  restore(backupId: string): string | undefined {
    return this.storage.retrieve(backupId);
  }

  /** List all available backups for disaster recovery. */
  listBackups(): readonly BackupRecord[] {
    return this.storage.list();
  }
}

// ── OTA Update Checker ────────────────────────────────────────────────────────

export interface VersionComparison {
  readonly current: string;
  readonly latest: string;
  readonly updateAvailable: boolean;
  readonly mandatory: boolean;
}

/**
 * Checks whether an installed version needs updating. Follows semver (major.minor.patch).
 * Major version bumps are mandatory; minor/patch are optional.
 */
export class OtaUpdateChecker {
  private latestVersions = new Map<string, { version: string; mandatory: boolean }>();

  /** Publish the latest version for a platform channel. */
  publishVersion(channel: string, version: string, mandatory = false): void {
    this.latestVersions.set(channel, { version, mandatory });
  }

  /** Compare installed version against latest for the channel. */
  check(channel: string, currentVersion: string): VersionComparison {
    const latest = this.latestVersions.get(channel);
    if (!latest) {
      return {
        current: currentVersion,
        latest: currentVersion,
        updateAvailable: false,
        mandatory: false,
      };
    }
    const updateAvailable = this.isNewer(latest.version, currentVersion);
    const mandatory =
      updateAvailable && (latest.mandatory || this.isMajorBump(currentVersion, latest.version));
    return { current: currentVersion, latest: latest.version, updateAvailable, mandatory };
  }

  private isNewer(latest: string, current: string): boolean {
    const [lMaj, lMin, lPat] = latest.split(".").map(Number);
    const [cMaj, cMin, cPat] = current.split(".").map(Number);
    if (lMaj! > cMaj!) return true;
    if (lMaj === cMaj && lMin! > cMin!) return true;
    if (lMaj === cMaj && lMin === cMin && lPat! > cPat!) return true;
    return false;
  }

  private isMajorBump(current: string, latest: string): boolean {
    return Number(latest.split(".")[0]) > Number(current.split(".")[0]);
  }
}

// ── Deep Link Configuration ──────────────────────────────────────────────────

export interface DeepLinkConfig {
  readonly platform: "ios" | "android";
  readonly domain: string;
  /** iOS: apple-app-site-association team/bundle ID. Android: package name. */
  readonly appIdentifier: string;
  /** Paths that should open in the app. */
  readonly paths: readonly string[];
}

/**
 * Generates the configuration files needed for Universal Links (iOS)
 * and App Links (Android) so mobile download buttons deep-link to stores.
 */
export class DeepLinkManager {
  private readonly configs: DeepLinkConfig[] = [];

  register(config: DeepLinkConfig): void {
    this.configs.push(config);
  }

  /** Generate apple-app-site-association JSON for iOS Universal Links. */
  generateAppleAppSiteAssociation(): object {
    const ios = this.configs.filter((c) => c.platform === "ios");
    return {
      applinks: {
        apps: [],
        details: ios.map((c) => ({
          appID: c.appIdentifier,
          paths: [...c.paths],
        })),
      },
    };
  }

  /** Generate assetlinks.json for Android App Links. */
  generateAssetLinks(): Array<{
    relation: readonly string[];
    target: {
      namespace: string;
      package_name: string;
      sha256_cert_fingerprints: readonly string[];
    };
  }> {
    const android = this.configs.filter((c) => c.platform === "android");
    return android.map((c) => ({
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: c.appIdentifier,
        sha256_cert_fingerprints: [],
      },
    }));
  }

  /** Validate that all registered configs have required fields. */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const config of this.configs) {
      if (!config.domain) errors.push(`${config.platform}: missing domain`);
      if (!config.appIdentifier) errors.push(`${config.platform}: missing appIdentifier`);
      if (config.paths.length === 0) errors.push(`${config.platform}: no paths configured`);
    }
    return { valid: errors.length === 0, errors };
  }
}
