import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * CLAUDE.md kural 3: sırlar depoya girmez. Tuya yerel anahtarı ve Tapo/TP-Link hesap bilgisi kullanıcıya aittir;
 * uygulama bunları yalnızca kullanıcının kendi cihazında saklar. Bu koruma, kaynak dosyalara "anahtar = 'değer'"
 * biçiminde gömülmüş, gerçek görünümlü bir değer girmesini engeller (testlerdeki belgelenmiş örnek değerler hariç).
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SKIP_DIRS = new Set(["node_modules", "www", "android", "ios", "dist", ".git", ".claude", "app"]);
const SCAN_ROOTS = ["src/app", "desktop", "scripts", "js"];

function files(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) files(p, out);
    else if (/\.(js|cjs|mjs|html|json)$/.test(name) && st.size < 2_000_000) out.push(p);
  }
  return out;
}

const PATTERNS: [string, RegExp][] = [
  ["Tuya yerel anahtarı / cihaz sırrı", /(local_?key|localKey|tuyaKey|access_?secret|client_?secret)["']?\s*[:=]\s*["'][A-Za-z0-9]{12,}["']/i],
  ["JWT benzeri belirteç", /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  ["AWS erişim kimliği", /AKIA[0-9A-Z]{16}/],
];

describe("cihaz sırları depoya girmez (kural 3)", () => {
  it("kaynak dosyalarda gömülü anahtar/parola/belirteç yok", () => {
    const hits: string[] = [];
    for (const rootDir of SCAN_ROOTS) {
      for (const file of files(join(ROOT, rootDir))) {
        const text = readFileSync(file, "utf8");
        for (const [label, re] of PATTERNS) {
          const m = re.exec(text);
          if (m) hits.push(`${file.replace(ROOT, "")}: ${label}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("yerel sır dosyaları .gitignore'da", () => {
    const ignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    for (const entry of [".secrets/", "*.local-keys.json", "tuya-*.local.json", "tapo-*.local.json", "cloud-config.js"]) {
      expect(ignore.split(/\r?\n/)).toContain(entry);
    }
  });
});
