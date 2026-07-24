import { describe, expect, it } from "vitest";
import {
  Analytics,
  implemented,
  moduleName,
  OnboardingError,
  OnboardingWizard,
  SupportSystem,
} from "./index.js";

const clock = () => new Date("2026-01-01T00:00:00.000Z");

describe("OnboardingWizard (FAZ 20)", () => {
  it("walks the first-run steps in order to completion", () => {
    const wiz = new OnboardingWizard();
    expect(wiz.current()).toBe("create-account");
    expect(wiz.progress()).toBe(0);

    wiz.complete("create-account");
    wiz.complete("language-address");
    wiz.complete("connect-device");
    expect(wiz.progress()).toBe(0.75);
    expect(wiz.isComplete()).toBe(false);

    wiz.complete("first-skill");
    expect(wiz.isComplete()).toBe(true);
    expect(wiz.current()).toBeUndefined();
  });

  it("does not allow skipping a step", () => {
    const wiz = new OnboardingWizard();
    expect(() => wiz.complete("connect-device")).toThrow(OnboardingError);
  });
});

describe("SupportSystem (FAZ 20)", () => {
  it("searches the FAQ case-insensitively", () => {
    const support = new SupportSystem({
      faq: [
        { question: "How do I reset my password?", answer: "Use the reset link." },
        { question: "How do I add a device?", answer: "Open the connector store." },
      ],
    });
    expect(support.searchFaq("PASSWORD")).toHaveLength(1);
    expect(support.searchFaq("device")[0]!.answer).toContain("connector store");
  });

  it("tracks a ticket through its lifecycle", () => {
    const support = new SupportSystem({ now: clock });
    const ticket = support.createTicket("Cannot pair device", "It times out.");
    expect(ticket.status).toBe("open");

    support.reply(ticket.id, "support", "Try restarting the hub.");
    expect(support.listTickets("in_progress")).toHaveLength(1);

    support.setStatus(ticket.id, "resolved");
    expect(support.listTickets("resolved")).toHaveLength(1);
    expect(ticket.replies).toHaveLength(2);
    expect(ticket.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("Analytics opt-in (FAZ 20)", () => {
  it("records nothing until the user opts in", () => {
    const analytics = new Analytics();
    analytics.track("skill.created");
    expect(analytics.count("skill.created")).toBe(0);

    analytics.optIn();
    analytics.track("skill.created");
    analytics.track("skill.created");
    expect(analytics.count("skill.created")).toBe(2);
    expect(analytics.summary()).toEqual({ "skill.created": 2 });
  });

  it("stops recording again after opting out", () => {
    const analytics = new Analytics();
    analytics.optIn();
    analytics.track("app.open");
    analytics.optOut();
    analytics.track("app.open");
    expect(analytics.count("app.open")).toBe(1);
  });
});

describe("@nexus/support module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("support");
    expect(implemented).toBe(true);
  });
});
