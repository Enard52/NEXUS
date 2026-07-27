import { describe, expect, it } from "vitest";
import {
  localizePremiumBodyTr,
  localizePremiumScriptTr,
  renderDesktopPremiumDocument,
  TR_ATTR,
  TR_SCRIPT,
  TR_SCRIPT_RAW,
  TR_TEXT,
} from "./premium.js";
import { desktopPremiumBody } from "./premium-body.js";
import { desktopPremiumScript } from "./premium-script.js";

describe("@nexus/desktop premium shell", () => {
  it("renders the approved premium design deterministically", () => {
    const first = renderDesktopPremiumDocument({ theme: "dark", locale: "en" });
    const second = renderDesktopPremiumDocument({ theme: "dark", locale: "en" });
    expect(first).toBe(second);
    // Core structure of the approved page.
    expect(first).toContain('<html lang="en" data-theme="dark">');
    expect(first).toContain("NEXUS AI — Windows · Home Studio");
    expect(first).toContain('data-current-view="home"');
    // Single style + single script, no inline handlers.
    expect(first.match(/<style>/g)?.length).toBe(1);
    expect(first.match(/<script>/g)?.length).toBe(1);
    expect(first).not.toMatch(/ on(click|error|load|input)=/);
  });

  it("keeps the light theme variant on the same markup", () => {
    const light = renderDesktopPremiumDocument({ theme: "light", locale: "en" });
    expect(light).toContain('data-theme="light"');
    // Same body content, only the theme flag differs.
    expect(light).toContain('data-current-view="home"');
  });

  it("localizes the Turkish body without leaving English UI text nodes", () => {
    const tr = localizePremiumBodyTr(desktopPremiumBody());
    expect(tr).toContain(">Cihazlar<");
    expect(tr).toContain("İyi akşamlar, Ensar");
    expect(tr).toContain('aria-label="Kapat"');
    expect(tr).toContain('data-options="Kısa|Dengeli|Ayrıntılı"');
    expect(tr).not.toContain(">Good evening, Ensar<");
    expect(tr).not.toContain('aria-label="Close"');
    // Brand and product names stay untranslated.
    expect(tr).toContain("Philips Hue");
    expect(tr).toContain("NEXUS");
  });

  it("localizes user-visible script strings while preserving identifiers", () => {
    const tr = localizePremiumScriptTr(desktopPremiumScript());
    expect(tr).toContain('"İyi akşamlar, Ensar"');
    expect(tr).toContain('"Dengeli"');
    expect(tr).not.toContain('"Balanced"');
    // Identifiers, ids and event names must be untouched.
    expect(tr).toContain("window.NEXUS_UI");
    expect(tr).toContain("nexus-theme");
    expect(tr).toContain("assistant-command");
    expect(tr).toContain("#device-range");
  });

  it("ships the same premium shell for mac and linux with adapted OS copy", () => {
    const mac = renderDesktopPremiumDocument({ theme: "dark", locale: "en", os: "mac" });
    const linux = renderDesktopPremiumDocument({ theme: "dark", locale: "en", os: "linux" });
    const windows = renderDesktopPremiumDocument({ theme: "dark", locale: "en", os: "windows" });
    // Same premium markup everywhere — only the OS mentions differ.
    expect(mac).toContain("NEXUS AI — macOS · Home Studio");
    expect(mac).toContain("macOS · Local");
    expect(mac).toContain("macOS 15");
    expect(linux).toContain("NEXUS AI — Linux · Home Studio");
    expect(linux).toContain("Ubuntu 24.04");
    // No user-visible Windows copy leaks into the other OS builds
    // (CSS keeps its internal comments, so we assert on the visible phrases).
    for (const doc of [mac, linux]) {
      expect(doc).not.toContain("Windows · Local");
      expect(doc).not.toContain("Windows 11");
      expect(doc).not.toContain("this Windows PC");
      expect(doc).not.toContain("Windows distribution");
    }
    // Linux is a pure token swap of the Windows document — reversing it
    // restores the Windows build byte for byte.
    expect(linux.split("Ubuntu 24.04").join("Windows 11").split("Linux").join("Windows")).toBe(
      windows,
    );
  });

  it("emits a fully localized Turkish document", () => {
    const tr = renderDesktopPremiumDocument({ theme: "dark", locale: "tr" });
    expect(tr).toContain('<html lang="tr" data-theme="dark">');
    expect(tr).toContain("Ev Stüdyosu");
    expect(tr).not.toContain("NEXUS AI is listening");
  });

  it("has no dead dictionary entries — every needle matches its source", () => {
    const body = desktopPremiumBody();
    const script = desktopPremiumScript();
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dead: string[] = [];
    // TR_TEXT is applied per whole text node (`>  needle  <`) — mirror that.
    for (const [en] of TR_TEXT) {
      const pattern = new RegExp(`>(\\s*)${escapeRegExp(en)}(\\s*)<`);
      if (!pattern.test(body)) dead.push(`TR_TEXT: ${en}`);
    }
    // TR_ATTR entries are literal attribute substrings.
    for (const [en] of TR_ATTR) {
      if (!body.includes(en)) dead.push(`TR_ATTR: ${en}`);
    }
    // TR_SCRIPT entries replace whole `"…"`-quoted literals.
    for (const [en] of TR_SCRIPT) {
      if (!script.includes(`"${en}"`)) dead.push(`TR_SCRIPT: ${en}`);
    }
    // TR_SCRIPT_RAW entries are raw template-literal fragments.
    for (const [en] of TR_SCRIPT_RAW) {
      if (!script.includes(en)) dead.push(`TR_SCRIPT_RAW: ${en}`);
    }
    expect(dead).toEqual([]);
  });
});
