import { describe, expect, it } from "vitest";
import {
  supportInfo,
  moduleName,
  OnboardingWizard,
  FaqService,
  SupportService,
  TelemetryService,
} from "./index.js";

const clock = () => new Date("2026-06-15T10:00:00.000Z");

describe("@nexus/support module identity", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("support");
    expect(supportInfo()).toEqual({ name: "support", implemented: true });
  });
});

describe("OnboardingWizard (FAZ 20)", () => {
  it("starts onboarding at account_created step", () => {
    const wizard = new OnboardingWizard({ now: clock });
    const state = wizard.start("u1");
    expect(state.currentStep).toBe("account_created");
    expect(state.completedSteps).toContain("account_created");
  });

  it("advances through steps in order", () => {
    const wizard = new OnboardingWizard({ now: clock });
    wizard.start("u1");
    wizard.completeStep("u1", "language_set");
    expect(wizard.getState("u1")?.currentStep).toBe("address_set");
    wizard.completeStep("u1", "address_set");
    expect(wizard.getState("u1")?.currentStep).toBe("first_device_connected");
  });

  it("completes onboarding after all steps done", () => {
    const wizard = new OnboardingWizard({ now: clock });
    wizard.start("u1");
    wizard.completeStep("u1", "language_set");
    wizard.completeStep("u1", "address_set");
    wizard.completeStep("u1", "first_device_connected");
    wizard.completeStep("u1", "first_skill_suggested");
    expect(wizard.isComplete("u1")).toBe(true);
    expect(wizard.getState("u1")?.completedAt).toBe("2026-06-15T10:00:00.000Z");
  });

  it("provides next action guidance", () => {
    const wizard = new OnboardingWizard({ now: clock });
    expect(wizard.nextAction("u1")).toContain("Create your account");
    wizard.start("u1");
    expect(wizard.nextAction("u1")).toContain("language");
  });

  it("throws for unknown user", () => {
    const wizard = new OnboardingWizard();
    expect(() => wizard.completeStep("ghost", "language_set")).toThrow();
  });
});

describe("FaqService (FAZ 20)", () => {
  it("provides FAQs in English by default", () => {
    const faq = new FaqService();
    const all = faq.getAll("en");
    expect(all.length).toBeGreaterThanOrEqual(7);
    expect(all[0].locale).toBe("en");
  });

  it("provides FAQs in Turkish", () => {
    const faq = new FaqService();
    const all = faq.getAll("tr");
    expect(all.length).toBeGreaterThanOrEqual(7);
    expect(all[0].locale).toBe("tr");
  });

  it("falls back to English for unsupported locale", () => {
    const faq = new FaqService();
    const all = faq.getAll("jp");
    expect(all[0].locale).toBe("en");
  });

  it("searches FAQs by keyword", () => {
    const faq = new FaqService();
    const results = faq.search("password");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].question.toLowerCase()).toContain("password");
  });

  it("filters FAQs by category", () => {
    const faq = new FaqService();
    const billing = faq.getByCategory("billing");
    expect(billing.length).toBeGreaterThanOrEqual(2);
    expect(billing.every((e) => e.category === "billing")).toBe(true);
  });
});

describe("SupportService tickets (FAZ 20)", () => {
  it("creates and retrieves support tickets", () => {
    const svc = new SupportService();
    const ticket = svc.createTicket("user@test.com", "Help", "Device won't connect");
    expect(ticket.status).toBe("open");
    expect(ticket.subject).toBe("Help");
    const tickets = svc.getTickets("user@test.com");
    expect(tickets).toHaveLength(1);
  });

  it("tracks multiple tickets per user", () => {
    const svc = new SupportService();
    svc.createTicket("u@t.com", "Issue 1", "msg1");
    svc.createTicket("u@t.com", "Issue 2", "msg2");
    expect(svc.getTickets("u@t.com")).toHaveLength(2);
  });
});

describe("TelemetryService (FAZ 20)", () => {
  it("tracks events when opted in", () => {
    const events: unknown[] = [];
    const telemetry = new TelemetryService({ optIn: true, sink: (e) => events.push(e) });
    telemetry.track("app_start");
    telemetry.track("device_added", { brand: "ikea" });
    expect(events).toHaveLength(2);
  });

  it("drops events when opted out", () => {
    const events: unknown[] = [];
    const telemetry = new TelemetryService({ optIn: false, sink: (e) => events.push(e) });
    telemetry.track("app_start");
    expect(events).toHaveLength(0);
  });

  it("records crashes with context", () => {
    const events: unknown[] = [];
    const telemetry = new TelemetryService({ optIn: true, sink: (e) => events.push(e) });
    telemetry.recordCrash(new Error("OOM"), "device-manager");
    expect(events).toHaveLength(1);
  });

  it("respects opt-in toggle at runtime", () => {
    const events: unknown[] = [];
    const telemetry = new TelemetryService({ optIn: false, sink: (e) => events.push(e) });
    telemetry.track("page_view");
    expect(events).toHaveLength(0);
    telemetry.setOptIn(true);
    telemetry.track("page_view");
    expect(events).toHaveLength(1);
  });
});
