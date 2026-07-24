import { describe, expect, it } from "vitest";
import {
  ConsentManager,
  DataRightsRegistry,
  draftCookiePolicy,
  draftPrivacyPolicy,
  draftTermsOfService,
  implemented,
  moduleName,
} from "./index.js";

const clock = () => new Date("2026-01-01T00:00:00.000Z");

describe("legal document drafts (FAZ 19)", () => {
  it("drafts ToS / Privacy / Cookie with a mandatory review disclaimer", () => {
    for (const doc of [
      draftTermsOfService("NEXUS"),
      draftPrivacyPolicy("NEXUS"),
      draftCookiePolicy("NEXUS"),
    ]) {
      expect(doc.title).toContain("NEXUS");
      expect(doc.sections.length).toBeGreaterThan(0);
      // Never presented as final legal advice.
      expect(doc.disclaimer.toLowerCase()).toContain("not legal advice");
    }
  });

  it("privacy draft covers data rights and PCI-DSS payment handling", () => {
    const privacy = draftPrivacyPolicy("NEXUS");
    const headings = privacy.sections.map((s) => s.heading);
    expect(headings).toContain("Your Rights");
    expect(privacy.sections.find((s) => s.heading === "Payment Data")!.body).toContain("PCI-DSS");
  });
});

describe("ConsentManager (FAZ 19)", () => {
  it("defaults to no consent and records explicit opt-in/out", () => {
    const consent = new ConsentManager(clock);
    expect(consent.hasConsent("u1", "voice-recording")).toBe(false);

    consent.set("u1", "voice-recording", true);
    expect(consent.hasConsent("u1", "voice-recording")).toBe(true);

    const record = consent.set("u1", "voice-recording", false);
    expect(consent.hasConsent("u1", "voice-recording")).toBe(false);
    expect(record.at).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("DataRightsRegistry (FAZ 19 x 14)", () => {
  it("tracks export/delete requests from received to fulfilled", () => {
    const registry = new DataRightsRegistry(clock);
    const req = registry.submit("u1", "delete");
    expect(req.status).toBe("received");
    expect(registry.pending()).toHaveLength(1);

    const done = registry.markFulfilled(req.id);
    expect(done.status).toBe("fulfilled");
    expect(done.fulfilledAt).toBe("2026-01-01T00:00:00.000Z");
    expect(registry.pending()).toHaveLength(0);
  });
});

describe("@nexus/legal module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("legal");
    expect(implemented).toBe(true);
  });
});
