import { describe, expect, it } from "vitest";
import {
  BackupScheduler,
  DeepLinkManager,
  HealthMonitor,
  InMemoryBackupStorage,
  OtaUpdateChecker,
} from "./index.js";

// ── Health Monitoring ─────────────────────────────────────────────────────────

describe("HealthMonitor (FAZ 18)", () => {
  it("starts healthy with zero metrics", () => {
    const monitor = new HealthMonitor({ now: () => 1000 });
    const m = monitor.getMetrics();
    expect(m.status).toBe("healthy");
    expect(m.totalRequests).toBe(0);
    expect(m.errorRate).toBe(0);
  });

  it("tracks request count and latency", () => {
    const monitor = new HealthMonitor();
    monitor.recordSuccess(50);
    monitor.recordSuccess(100);
    const m = monitor.getMetrics();
    expect(m.totalRequests).toBe(2);
    expect(m.avgLatencyMs).toBe(75);
  });

  it("degrades when error rate exceeds threshold", () => {
    const monitor = new HealthMonitor({ degradedThreshold: 0.1, downThreshold: 0.5 });
    // 1 error out of 5 requests = 20% > 10% threshold
    monitor.recordSuccess(10);
    monitor.recordSuccess(10);
    monitor.recordSuccess(10);
    monitor.recordSuccess(10);
    monitor.recordError(10);
    expect(monitor.getMetrics().status).toBe("degraded");
  });

  it("goes down when error rate exceeds down threshold", () => {
    const monitor = new HealthMonitor({ degradedThreshold: 0.1, downThreshold: 0.5 });
    monitor.recordError(10);
    monitor.recordError(10);
    expect(monitor.getMetrics().status).toBe("down");
  });

  it("fires alert rules when conditions are met", () => {
    const monitor = new HealthMonitor({ degradedThreshold: 0.1 });
    monitor.addRule({
      name: "high-error-rate",
      condition: (m) => m.errorRate > 0.5,
    });
    monitor.recordError(10);
    expect(monitor.getAlerts()).toHaveLength(1);
    expect(monitor.getAlerts()[0].rule).toBe("high-error-rate");
  });

  it("tracks uptime from start", () => {
    let now = 1000;
    const monitor = new HealthMonitor({ now: () => now });
    now = 5000;
    expect(monitor.getMetrics().uptime).toBe(4000);
  });
});

// ── Backup & Disaster Recovery ────────────────────────────────────────────────

describe("BackupScheduler (FAZ 18)", () => {
  it("creates a backup when interval has passed", () => {
    let now = 0;
    const storage = new InMemoryBackupStorage();
    const scheduler = new BackupScheduler({ storage, intervalMs: 1000, now: () => now });

    const result = scheduler.backupIfDue("memory-data");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("complete");
    expect(result!.sizeBytes).toBeGreaterThan(0);
  });

  it("skips backup if interval not yet reached", () => {
    let now = 0;
    const storage = new InMemoryBackupStorage();
    const scheduler = new BackupScheduler({ storage, intervalMs: 1000, now: () => now });

    scheduler.backupIfDue("data-1");
    now = 500; // only 500ms passed
    const result = scheduler.backupIfDue("data-2");
    expect(result).toBeNull();
  });

  it("force backup ignores interval", () => {
    let now = 0;
    const storage = new InMemoryBackupStorage();
    const scheduler = new BackupScheduler({ storage, intervalMs: 100_000, now: () => now });

    scheduler.forceBackup("initial");
    now = 1; // way before interval
    const result = scheduler.forceBackup("forced");
    expect(result.status).toBe("complete");
    expect(scheduler.listBackups()).toHaveLength(2);
  });

  it("restores data from a backup", () => {
    const storage = new InMemoryBackupStorage();
    const scheduler = new BackupScheduler({ storage, intervalMs: 0, now: () => 0 });

    scheduler.forceBackup(JSON.stringify({ assistantName: "Nova", memory: [1, 2, 3] }));
    const restored = scheduler.restore("backup-1");
    expect(restored).toBeDefined();
    expect(JSON.parse(restored!).assistantName).toBe("Nova");
  });

  it("returns undefined for non-existent backup", () => {
    const storage = new InMemoryBackupStorage();
    const scheduler = new BackupScheduler({ storage, intervalMs: 0, now: () => 0 });
    expect(scheduler.restore("ghost")).toBeUndefined();
  });
});

// ── OTA Update Checker ────────────────────────────────────────────────────────

describe("OtaUpdateChecker (FAZ 18)", () => {
  it("detects when an update is available", () => {
    const checker = new OtaUpdateChecker();
    checker.publishVersion("windows-stable", "2.1.0");
    const result = checker.check("windows-stable", "2.0.0");
    expect(result.updateAvailable).toBe(true);
    expect(result.latest).toBe("2.1.0");
    expect(result.mandatory).toBe(false);
  });

  it("marks major version bumps as mandatory", () => {
    const checker = new OtaUpdateChecker();
    checker.publishVersion("desktop", "3.0.0");
    const result = checker.check("desktop", "2.5.1");
    expect(result.updateAvailable).toBe(true);
    expect(result.mandatory).toBe(true);
  });

  it("reports no update when already on latest", () => {
    const checker = new OtaUpdateChecker();
    checker.publishVersion("mobile", "1.2.3");
    const result = checker.check("mobile", "1.2.3");
    expect(result.updateAvailable).toBe(false);
  });

  it("reports no update for unknown channel", () => {
    const checker = new OtaUpdateChecker();
    const result = checker.check("nonexistent", "1.0.0");
    expect(result.updateAvailable).toBe(false);
    expect(result.latest).toBe("1.0.0");
  });

  it("detects patch updates as non-mandatory", () => {
    const checker = new OtaUpdateChecker();
    checker.publishVersion("android", "1.0.5");
    const result = checker.check("android", "1.0.3");
    expect(result.updateAvailable).toBe(true);
    expect(result.mandatory).toBe(false);
  });
});

// ── Deep Link Configuration ──────────────────────────────────────────────────

describe("DeepLinkManager (FAZ 18)", () => {
  it("generates apple-app-site-association for iOS", () => {
    const manager = new DeepLinkManager();
    manager.register({
      platform: "ios",
      domain: "nexus.ai",
      appIdentifier: "TEAM123.ai.nexus.app",
      paths: ["/download", "/invite/*"],
    });
    const aasa = manager.generateAppleAppSiteAssociation() as any;
    expect(aasa.applinks.details).toHaveLength(1);
    expect(aasa.applinks.details[0].appID).toBe("TEAM123.ai.nexus.app");
    expect(aasa.applinks.details[0].paths).toContain("/download");
  });

  it("generates assetlinks.json for Android", () => {
    const manager = new DeepLinkManager();
    manager.register({
      platform: "android",
      domain: "nexus.ai",
      appIdentifier: "ai.nexus.app",
      paths: ["/download", "/store"],
    });
    const links = manager.generateAssetLinks();
    expect(links).toHaveLength(1);
    expect(links[0].target.package_name).toBe("ai.nexus.app");
    expect(links[0].relation).toContain("delegate_permission/common.handle_all_urls");
  });

  it("validates configs and reports missing fields", () => {
    const manager = new DeepLinkManager();
    manager.register({ platform: "ios", domain: "", appIdentifier: "TEAM.id", paths: ["/x"] });
    const result = manager.validate();
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("missing domain");
  });

  it("passes validation with complete config", () => {
    const manager = new DeepLinkManager();
    manager.register({
      platform: "ios",
      domain: "nexus.ai",
      appIdentifier: "TEAM123.ai.nexus",
      paths: ["/download"],
    });
    manager.register({
      platform: "android",
      domain: "nexus.ai",
      appIdentifier: "ai.nexus.app",
      paths: ["/store"],
    });
    expect(manager.validate().valid).toBe(true);
  });
});
