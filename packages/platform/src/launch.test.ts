import { describe, expect, it } from "vitest";
import {
  BetaManager,
  LaunchChecklist,
  StoreSubmissionTracker,
} from "./launch.js";
import { InMemorySyncBackend, SyncEngine } from "@nexus/infra";

const clock = () => new Date("2026-07-01T12:00:00.000Z");

// ═══════════════════════════════════════════════════════════════════════════════
// FAZ 21 — Beta Test ve Yayına Alma
// ═══════════════════════════════════════════════════════════════════════════════

describe("BetaManager (FAZ 21)", () => {
  it("registers testers in cohorts", () => {
    const beta = new BetaManager({ now: clock });
    beta.addTester({ userId: "u1", email: "a@t.com", cohort: "early", deviceBrands: ["ikea", "xiaomi"], locale: "tr" });
    beta.addTester({ userId: "u2", email: "b@t.com", cohort: "early", deviceBrands: ["sonoff"], locale: "en" });
    expect(beta.testerCount).toBe(2);
    expect(beta.getCohort("early")).toHaveLength(2);
  });

  it("collects feedback from testers", () => {
    const beta = new BetaManager({ now: clock });
    beta.addTester({ userId: "u1", email: "a@t.com", cohort: "c1", deviceBrands: [], locale: "tr" });
    const fb = beta.submitFeedback("u1", "bug", "Light doesn't turn off", "high");
    expect(fb.category).toBe("bug");
    expect(fb.severity).toBe("high");
    expect(fb.resolved).toBe(false);
  });

  it("resolves feedback", () => {
    const beta = new BetaManager({ now: clock });
    beta.addTester({ userId: "u1", email: "a@t.com", cohort: "c1", deviceBrands: [], locale: "en" });
    const fb = beta.submitFeedback("u1", "usability", "Confusing settings", "medium");
    beta.resolveFeedback("u1", fb.id);
    expect(beta.getBlockingFeedback()).toHaveLength(0);
  });

  it("identifies blocking feedback (critical/high unresolved)", () => {
    const beta = new BetaManager({ now: clock });
    beta.addTester({ userId: "u1", email: "a@t.com", cohort: "c1", deviceBrands: [], locale: "tr" });
    beta.submitFeedback("u1", "bug", "App crashes on start", "critical");
    beta.submitFeedback("u1", "feature", "Dark mode", "low");
    const blockers = beta.getBlockingFeedback();
    expect(blockers).toHaveLength(1);
    expect(blockers[0].severity).toBe("critical");
  });

  it("manages feature flags per cohort", () => {
    const beta = new BetaManager({ now: clock });
    beta.addTester({ userId: "u1", email: "a@t.com", cohort: "alpha", deviceBrands: [], locale: "en" });
    beta.addTester({ userId: "u2", email: "b@t.com", cohort: "beta", deviceBrands: [], locale: "tr" });
    beta.setFlag("new-ui", true, ["alpha"]);
    expect(beta.isEnabled("new-ui", "u1")).toBe(true);
    expect(beta.isEnabled("new-ui", "u2")).toBe(false);
  });

  it("feature flag with empty cohorts is available to all", () => {
    const beta = new BetaManager({ now: clock });
    beta.addTester({ userId: "u1", email: "a@t.com", cohort: "any", deviceBrands: [], locale: "en" });
    beta.setFlag("global-flag", true);
    expect(beta.isEnabled("global-flag", "u1")).toBe(true);
  });

  it("throws when non-tester submits feedback", () => {
    const beta = new BetaManager();
    expect(() => beta.submitFeedback("ghost", "bug", "msg")).toThrow();
  });
});

describe("LaunchChecklist (FAZ 21)", () => {
  it("starts with all items pending", () => {
    const checklist = new LaunchChecklist();
    expect(checklist.isReady()).toBe(false);
    expect(checklist.getBlockers().length).toBeGreaterThan(0);
  });

  it("marks items as pass and checks readiness", () => {
    const checklist = new LaunchChecklist();
    const all = checklist.getAll();
    for (const item of all) {
      checklist.setStatus(item.id, "pass");
    }
    expect(checklist.isReady()).toBe(true);
    expect(checklist.getBlockers()).toHaveLength(0);
  });

  it("identifies blocking items", () => {
    const checklist = new LaunchChecklist();
    checklist.setStatus("core-tests", "pass");
    checklist.setStatus("security-audit", "fail");
    const blockers = checklist.getBlockers();
    expect(blockers.find((b) => b.id === "security-audit")?.status).toBe("fail");
  });
});

describe("StoreSubmissionTracker (FAZ 21)", () => {
  it("tracks App Store and Google Play submissions", () => {
    const tracker = new StoreSubmissionTracker();
    tracker.submit("app_store", "1.0.0");
    tracker.submit("google_play", "1.0.0");
    expect(tracker.get("app_store")?.status).toBe("submitted");
    expect(tracker.get("google_play")?.status).toBe("submitted");
  });

  it("updates submission status", () => {
    const tracker = new StoreSubmissionTracker();
    tracker.submit("app_store", "1.0.0");
    tracker.updateStatus("app_store", "approved");
    expect(tracker.get("app_store")?.status).toBe("approved");
  });

  it("reports allApproved only when both stores approve", () => {
    const tracker = new StoreSubmissionTracker();
    tracker.submit("app_store", "1.0.0");
    tracker.submit("google_play", "1.0.0");
    tracker.updateStatus("app_store", "approved");
    expect(tracker.allApproved()).toBe(false);
    tracker.updateStatus("google_play", "approved");
    expect(tracker.allApproved()).toBe(true);
  });

  it("handles rejection with notes", () => {
    const tracker = new StoreSubmissionTracker();
    tracker.submit("google_play", "1.0.0");
    tracker.updateStatus("google_play", "rejected", "Missing privacy policy link");
    expect(tracker.get("google_play")?.notes).toContain("privacy");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FAZ 22 — Cross-Platform Sync
// ═══════════════════════════════════════════════════════════════════════════════

describe("Cross-Platform Sync (FAZ 22)", () => {
  it("syncs a skill taught on desktop to mobile", () => {
    const backend = new InMemorySyncBackend();
    const desktop = new SyncEngine("user-1", "desktop-win", backend);
    const mobile = new SyncEngine("user-1", "mobile-android", backend);

    desktop.set("skills", "movie-night", { steps: ["dim", "tv-on", "blinds-close"] });
    desktop.sync();

    mobile.sync();
    const skill = mobile.get<{ steps: string[] }>("skills", "movie-night");
    expect(skill?.steps).toEqual(["dim", "tv-on", "blinds-close"]);
  });

  it("syncs preferences set on mobile to desktop", () => {
    const backend = new InMemorySyncBackend();
    const desktop = new SyncEngine("user-1", "desktop", backend);
    const mobile = new SyncEngine("user-1", "mobile", backend);

    mobile.set("preferences", "assistantName", "Nova");
    mobile.set("preferences", "language", "tr");
    mobile.sync();

    desktop.sync();
    expect(desktop.get("preferences", "assistantName")).toBe("Nova");
    expect(desktop.get("preferences", "language")).toBe("tr");
  });

  it("syncs memory across three devices", () => {
    const backend = new InMemorySyncBackend();
    const d1 = new SyncEngine("user-1", "win-desktop", backend);
    const d2 = new SyncEngine("user-1", "mac-laptop", backend);
    const d3 = new SyncEngine("user-1", "android-phone", backend);

    d1.set("memory", "last-room", "kitchen");
    d1.sync();

    d2.sync();
    d3.sync();
    expect(d2.get("memory", "last-room")).toBe("kitchen");
    expect(d3.get("memory", "last-room")).toBe("kitchen");
  });

  it("resolves conflicts with last-write-wins across platforms", () => {
    const backend = new InMemorySyncBackend();
    let t = 0;
    const clock = () => ++t;
    const desktop = new SyncEngine("user-1", "desktop", backend, { clock });
    const mobile = new SyncEngine("user-1", "mobile", backend, { clock });

    desktop.set("preferences", "tone", "formal"); // v1
    mobile.set("preferences", "tone", "friendly"); // v2 (newer)

    desktop.sync();
    mobile.sync();
    desktop.sync();

    expect(desktop.get("preferences", "tone")).toBe("friendly");
    expect(mobile.get("preferences", "tone")).toBe("friendly");
  });
});
