import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// "Doğrulandı / Henüz doğrulanmadı" rozeti: supported-devices.js `verified` alanı ile
// docs/HARDWARE-VERIFICATION.md tablosu birlikte yürür. Kanıtsız "Doğrulandı" çıkamaz.
const REPO_ROOT = resolve(__dirname, "../../..");
const SRC = readFileSync(resolve(REPO_ROOT, "src/app/supported-devices.js"), "utf8");
const DOC = readFileSync(resolve(REPO_ROOT, "docs/HARDWARE-VERIFICATION.md"), "utf8");

function load() {
  const win: any = {};
  new Function("window", SRC)(win);
  return win as {
    NEXUS_SUPPORTED_DEVICES: Array<{ protocol: string; verified?: boolean }>;
    nexusIsVerified: (p: string) => boolean;
  };
}

function docRow(protocol: string): string | undefined {
  return DOC.split("\n").find((l) => l.startsWith("| `" + protocol + "` |"));
}

describe("doğrulama rozeti", () => {
  it("alanı olmayan ya da bilinmeyen bağlayıcı doğrulanmış sayılmaz", () => {
    const w = load();
    expect(w.nexusIsVerified("shelly")).toBe(false);
    expect(w.nexusIsVerified("yok-boyle-bir-sey")).toBe(false);
    expect(w.nexusIsVerified("")).toBe(false);
  });

  it("matristeki her bağlayıcının belgede satırı var", () => {
    const missing = load()
      .NEXUS_SUPPORTED_DEVICES.map((g) => g.protocol)
      .filter((p) => !docRow(p));
    expect(missing).toEqual([]);
  });

  it("verified: true yalnız belgede Doğrulandı kaydı olan bağlayıcıda olabilir", () => {
    for (const g of load().NEXUS_SUPPORTED_DEVICES) {
      if (g.verified !== true) continue;
      expect(docRow(g.protocol), g.protocol).toMatch(/\| Doğrulandı \|/);
    }
  });
});
