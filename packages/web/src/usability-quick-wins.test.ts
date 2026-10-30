import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Issue #60 kullanılabilirlik maddeleri: kaynak düzeyinde doğrulama (sayfalar tarayıcıda çalışır).
const APP = join(resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", ".."), "src", "app");
const read = (f: string) => readFileSync(join(APP, f), "utf8");

describe("login error → reset link", () => {
  const login = read("nexus-login.html");

  it("links to the forgot-password page carrying the typed email", () => {
    expect(login).toContain("nexus-forgot-password.html?email=' + encodeURIComponent(email)");
  });

  it("offers it only for wrong-credentials errors (not network errors) and never for local accounts", () => {
    const calls =
      login.match(/[;)] showResetHint\(err, email\)|^\s+showResetHint\(err, email\)/gm) ?? [];
    expect(calls).toHaveLength(1);
    expect(login).toContain("/invalid login credentials|E-posta veya şifre hatalı/i.test(");
    expect(login).toContain(") showResetHint(err, email);");
  });

  it("forgot-password page prefills the email from the query", () => {
    const forgot = read("nexus-forgot-password.html");
    expect(forgot).toContain("get('email')");
    expect(forgot).toContain("recovery-input");
  });
});

describe("settings search", () => {
  const settings = read("nexus-settings.html");
  const en = read("lang-en.js");

  it("has a search input and an honest no-match state", () => {
    expect(settings).toContain('id="settings-search"');
    expect(settings).toContain('id="settings-search-empty"');
  });

  it("filters only settings cards and has EN strings", () => {
    expect(settings).toContain('[data-purpose="settings-card"]');
    expect(en).toContain('"Ayarlarda ara": "Search settings"');
    expect(en).toContain('"Bu aramayla eşleşen ayar yok."');
  });
});

describe("pair screen: LAN errors offer retry + help", () => {
  const pair = read("nexus-pair.html");
  const en = read("lang-en.js");

  it("setScanStatus renders a retry button and a help link only for errors with a retry handler", () => {
    expect(pair).toContain('if (tone === "error" && typeof retry === "function")');
    expect(pair).toContain('help.href = "nexus-feedback.html"');
  });

  it("host-identify timeout and auto-scan failures pass a retry handler", () => {
    expect(pair).toContain('emin ol.", "error", scanLanHost);');
    expect(pair).toContain('emin ol.", "error", function () { startAutoScan(); });');
    expect(pair).toContain(
      'QR / kurulum kodunu kullan.", autoScanStop ? "" : "error", function () { startAutoScan(); });',
    );
  });

  it("has EN strings for the new labels", () => {
    expect(en).toContain('"Tekrar dene": "Try again"');
    expect(en).toContain('"Yardım al": "Get help"');
  });
});
