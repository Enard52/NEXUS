/**
 * nexusT dinamik birleştirme bekçisi (#194).
 * nexusT("tr", "en") çağrılarının içine dinamik dize birleştirmesi ('+' operatörüyle)
 * girilmesini engeller; böylece scripts/lang-tool.mjs her metni sözlüğe çıkarabilir
 * ve topluluk dilleri eksiksiz çevrilebilir.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function repoRoot(): string {
  let dir = resolve(process.cwd());
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = resolve(dir, "..");
  }
  return resolve(process.cwd());
}

const ROOT = repoRoot();
const APP = join(ROOT, "src", "app");

function findNexusTCalls(src: string): { args: string; call: string }[] {
  const calls: { args: string; call: string }[] = [];
  const target = "nexusT(";
  let idx = 0;
  while ((idx = src.indexOf(target, idx)) !== -1) {
    const start = idx;
    idx += target.length;
    let depth = 1;
    let inQuote: string | null = null;
    const argsStart = idx;
    while (idx < src.length && depth > 0) {
      const ch = src[idx];
      if (inQuote) {
        if (ch === "\\") {
          idx += 2;
          continue;
        }
        if (ch === inQuote) {
          inQuote = null;
        }
      } else {
        if (ch === '"' || ch === "'") {
          inQuote = ch;
        } else if (ch === "(") {
          depth++;
        } else if (ch === ")") {
          depth--;
        }
      }
      idx++;
    }
    const args = src.slice(argsStart, idx - 1);
    calls.push({ args, call: src.slice(start, idx) });
  }
  return calls;
}

describe("nexusT dinamik birleştirme koruması (#194)", () => {
  it("src/app içindeki hiçbir nexusT çağrısı dinamik dize birleştirmesi ('+' operatörü) içermez", () => {
    const bad: string[] = [];
    const files = readdirSync(APP).filter((n) => /\.(js|html)$/.test(n) && !n.startsWith("lang-"));

    for (const f of files) {
      const src = readFileSync(join(APP, f), "utf8");
      for (const { args, call } of findNexusTCalls(src)) {
        // Fonksiyon tanımlarını yoksay
        if (args.includes("trText") || args.includes("tr, en") || args.includes("a, b")) continue;
        // Tırnak içindeki metinleri çıkar (dize içinde geçen meşru karakterler hariç)
        const nonString = args.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, "");
        if (nonString.includes("+")) {
          bad.push(`${f}: ${call}`);
        }
      }
    }

    expect(
      bad,
      "nexusT çağrılarında dinamik dize birleştirme tespit edildi — şablon {0} kullanın",
    ).toEqual([]);
  });
});
