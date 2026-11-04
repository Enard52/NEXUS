import { describe, expect, it } from "vitest";
import { getLegalDoc, LEGAL_DOCS } from "../../../scripts/site-legal-content.mjs";
import { getDocFilename, getDocTitle, renderHtml } from "../../../scripts/legal-pdf.mjs";

const legalCjs = await import("../../../scripts/legal-content.cjs");
const { getLegalDoc: getCjsLegalDoc, UPDATED, OPERATOR, docs } = legalCjs.default || legalCjs;

describe("legal pages and PDFs language-agnostic generation (Issue #191)", () => {
  it("provides privacy, terms and refund docs in English and Turkish via legal-content.cjs", () => {
    const privEn = getCjsLegalDoc("privacy", "en");
    const privTr = getCjsLegalDoc("privacy", "tr");
    expect(privEn.title).toBe("Privacy Policy");
    expect(privTr.title).toBe("Gizlilik Politikası");

    const termsEn = getCjsLegalDoc("terms", "en");
    const termsTr = getCjsLegalDoc("terms", "tr");
    expect(termsEn.title).toBe("Terms of Service");
    expect(termsTr.title).toBe("Kullanım Şartları");

    const refundEn = getCjsLegalDoc("refund", "en");
    const refundTr = getCjsLegalDoc("refund", "tr");
    expect(refundEn.title).toBe("Refund and Cancellation Policy");
    expect(refundTr.title).toBe("İade ve İptal Politikası");
  });

  it("falls back to English for any unsupported language in legal-content.cjs", () => {
    const privXx = getCjsLegalDoc("privacy", "xx");
    expect(privXx).toBeDefined();
    expect(privXx.title).toBe("Privacy Policy");
    expect(privXx.sections.length).toBeGreaterThan(0);

    // Direct proxy access on docs
    expect(docs.privacy.xx.title).toBe("Privacy Policy");
    expect(docs.terms.xx.title).toBe("Terms of Service");
    expect(docs.refund.xx.title).toBe("Refund and Cancellation Policy");

    // UPDATED and OPERATOR fallback
    expect(UPDATED.xx).toBe(UPDATED.en);
    expect(OPERATOR.xx).toBe("NEXUS");
  });

  it("provides getLegalDoc in site-legal-content.mjs with English fallback", () => {
    const privTr = getLegalDoc("privacy", "tr");
    expect(privTr.title).toBe("Gizlilik Politikası");

    const privEn = getLegalDoc("privacy", "en");
    expect(privEn.title).toBe("Privacy Policy");

    const privXx = getLegalDoc("privacy", "de");
    expect(privXx.title).toBe("Privacy Policy");

    const termsDe = getLegalDoc("terms", "de");
    expect(termsDe.title).toBe("Terms of Service");

    const codeSigningDe = getLegalDoc("codeSigning", "de");
    expect(codeSigningDe.title).toBe("Code Signing Policy");

    // Proxy access on LEGAL_DOCS
    expect(LEGAL_DOCS.privacyDe.title).toBe("Privacy Policy");
    expect(LEGAL_DOCS.termsJa.title).toBe("Terms of Service");
  });

  it("determines filename and titles dynamically in legal-pdf.mjs", () => {
    expect(getDocFilename("privacy", "tr")).toBe("NEXUS-Gizlilik-Politikasi");
    expect(getDocFilename("privacy", "en")).toBe("NEXUS-Privacy-Policy");
    expect(getDocFilename("privacy", "de")).toBe("NEXUS-Privacy-Policy-DE");

    expect(getDocFilename("terms", "tr")).toBe("NEXUS-Hizmet-Sartlari");
    expect(getDocFilename("terms", "en")).toBe("NEXUS-Terms-of-Service");
    expect(getDocFilename("terms", "fr")).toBe("NEXUS-Terms-of-Service-FR");

    expect(getDocTitle("privacy", "tr")).toBe("Gizlilik Politikası");
    expect(getDocTitle("privacy", "en")).toBe("Privacy Policy");
    expect(getDocTitle("privacy", "xx")).toBe("Privacy Policy");
    expect(getDocTitle("privacy", "de")).toBe("Datenschutzerklärung");
  });

  it("renders valid HTML document for any language in legal-pdf.mjs", () => {
    const htmlDe = renderHtml("privacy", "xx");
    expect(htmlDe).toContain('<html lang="xx">');
    expect(htmlDe).toContain("<title>Privacy Policy — NEXUS</title>");
    expect(htmlDe).toContain("Operated by: NEXUS");
    expect(htmlDe).toContain("This document is read together with the current text");

    const htmlTr = renderHtml("privacy", "tr");
    expect(htmlTr).toContain('<html lang="tr">');
    expect(htmlTr).toContain("<title>Gizlilik Politikası — NEXUS</title>");
    expect(htmlTr).toContain("İşleten: NEXUS");
    expect(htmlTr).toContain("Bu belge nexus-smarthome.pages.dev");
  });

  it("uses a translation file when one exists and keeps the convenience-translation notice", () => {
    const htmlDe = renderHtml("terms", "de");
    expect(htmlDe).toContain("<title>Nutzungsbedingungen — NEXUS</title>");
    expect(htmlDe).toContain("Betrieben von: NEXUS");
    expect(htmlDe).toContain("Bei Abweichungen gelten die türkische und die englische Fassung");
    expect(docs.terms.de.sections.length).toBe(docs.terms.en.sections.length);
    expect(UPDATED.de).toContain("2026");
  });

  it("renders right-to-left languages with dir=rtl once their file exists", async () => {
    const { existsSync } = await import("node:fs");
    if (!existsSync(new URL("../../../scripts/legal-translations/ar.json", import.meta.url))) return;
    expect(renderHtml("privacy", "ar")).toContain('<html lang="ar" dir="rtl">');
  });
});
