import { describe, expect, it } from "vitest";
import { legalInfo, moduleName, LegalService } from "./index.js";

const clock = () => new Date("2026-06-01T12:00:00.000Z");

describe("@nexus/legal module identity", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("legal");
    expect(legalInfo()).toEqual({ name: "legal", implemented: true });
  });
});

describe("LegalService documents (FAZ 19)", () => {
  it("provides Terms of Service in English", () => {
    const legal = new LegalService();
    const tos = legal.getTermsOfService("en");
    expect(tos).toContain("Terms of Service");
    expect(tos).toContain("Acceptance");
  });

  it("provides Terms of Service in Turkish", () => {
    const legal = new LegalService();
    const tos = legal.getTermsOfService("tr");
    expect(tos).toContain("Kullanım Şartları");
    expect(tos).toContain("Kabul");
  });

  it("provides Privacy Policy with KVKK reference in Turkish", () => {
    const legal = new LegalService();
    const pp = legal.getPrivacyPolicy("tr");
    expect(pp).toContain("Gizlilik Politikası");
    expect(pp).toContain("KVKK");
  });

  it("provides Cookie Policy", () => {
    const legal = new LegalService();
    expect(legal.getCookiePolicy("en")).toContain("Cookie Policy");
    expect(legal.getCookiePolicy("tr")).toContain("Çerez Politikası");
  });

  it("falls back to English for unsupported locale", () => {
    const legal = new LegalService();
    const doc = legal.getDocument("terms", "jp");
    expect(doc?.locale).toBe("en");
  });

  it("returns structured document with version and date", () => {
    const legal = new LegalService();
    const doc = legal.getDocument("privacy", "en");
    expect(doc?.version).toBe("1.0.0");
    expect(doc?.effectiveDate).toBe("2026-01-01");
  });
});

describe("Consent Management (FAZ 19 — GDPR Art 7)", () => {
  it("grants and checks consent for voice recording", () => {
    const legal = new LegalService({ now: clock });
    legal.grantConsent("u1", "voice_recording");
    expect(legal.hasConsent("u1", "voice_recording")).toBe(true);
    expect(legal.canProcessVoice("u1")).toBe(true);
  });

  it("denies voice processing without consent", () => {
    const legal = new LegalService();
    expect(legal.canProcessVoice("u1")).toBe(false);
  });

  it("revokes consent and records timestamp", () => {
    const legal = new LegalService({ now: clock });
    legal.grantConsent("u1", "analytics");
    const revoked = legal.revokeConsent("u1", "analytics");
    expect(revoked.granted).toBe(false);
    expect(revoked.revokedAt).toBe("2026-06-01T12:00:00.000Z");
    expect(legal.hasConsent("u1", "analytics")).toBe(false);
  });

  it("throws when revoking non-existent consent", () => {
    const legal = new LegalService();
    expect(() => legal.revokeConsent("u1", "cookies")).toThrow();
  });

  it("lists all consent records for a user", () => {
    const legal = new LegalService({ now: clock });
    legal.grantConsent("u1", "voice_recording");
    legal.grantConsent("u1", "analytics");
    legal.grantConsent("u1", "cookies");
    expect(legal.getConsents("u1")).toHaveLength(3);
  });

  it("replaces existing consent on re-grant", () => {
    const legal = new LegalService({ now: clock });
    legal.grantConsent("u1", "analytics");
    legal.revokeConsent("u1", "analytics");
    legal.grantConsent("u1", "analytics");
    expect(legal.hasConsent("u1", "analytics")).toBe(true);
    expect(legal.getConsents("u1")).toHaveLength(1);
  });
});

describe("Data Subject Requests (FAZ 19 — GDPR/KVKK)", () => {
  it("creates a data export request with user data", () => {
    const legal = new LegalService({ now: clock });
    const req = legal.requestDataExport("u1", JSON.stringify({ name: "Ensar", devices: 3 }));
    expect(req.status).toBe("completed");
    expect(req.type).toBe("export");
    expect(JSON.parse(req.data!).name).toBe("Ensar");
  });

  it("creates a pending export request when data not yet gathered", () => {
    const legal = new LegalService({ now: clock });
    const req = legal.requestDataExport("u1");
    expect(req.status).toBe("pending");
    expect(req.data).toBeUndefined();
  });

  it("deletes all user data and clears consents", () => {
    const legal = new LegalService({ now: clock });
    legal.grantConsent("u1", "voice_recording");
    legal.grantConsent("u1", "analytics");
    const req = legal.requestDataDeletion("u1");
    expect(req.status).toBe("completed");
    expect(req.type).toBe("delete");
    // Consents are gone
    expect(legal.getConsents("u1")).toHaveLength(0);
    expect(legal.canProcessVoice("u1")).toBe(false);
  });

  it("tracks request history per user", () => {
    const legal = new LegalService({ now: clock });
    legal.requestDataExport("u1", "data");
    legal.requestDataDeletion("u1");
    const requests = legal.getRequests("u1");
    expect(requests).toHaveLength(2);
    expect(requests[0].type).toBe("export");
    expect(requests[1].type).toBe("delete");
  });

  it("retrieves request by ID", () => {
    const legal = new LegalService({ now: clock });
    const req = legal.requestDataExport("u1", "my-data");
    expect(legal.getRequest(req.id)).toBeDefined();
    expect(legal.getRequest(req.id)?.userId).toBe("u1");
  });
});
