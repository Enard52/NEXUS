import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Yasal sayfalarda kişisel isim koruması (kullanıcı kuralı):
// Operatör her yerde yalnız "NEXUS" olarak görünür. Gizlilik/şartlar/iade
// metinlerinin kaynağı (scripts/legal-content.cjs) ve ürünleri (legal-pdf/,
// www/public yasal sayfaları) sahibin adını ASLA içermez.
const NAME_PATTERNS = /ensar|harmanc[ıi]/gi;

const LEGAL_NAME_RE = /legal|privacy|terms|refund|gizlilik|şart|sar\b|iade|politik/i;

function collectLegalFiles(root: string): string[] {
  const out: string[] = [];
  const dirs = [
    { dir: "legal-pdf", all: true },
    { dir: join("www", "public"), all: false },
    { dir: "www", all: false },
  ];
  for (const { dir, all } of dirs) {
    const base = join(root, dir);
    if (!existsSync(base)) continue;
    for (const f of readdirSync(base)) {
      if (!/\.(html?|pdf|txt|md)$/i.test(f)) continue;
      if (all || LEGAL_NAME_RE.test(f)) out.push(join(base, f));
    }
  }
  const src = join(root, "scripts", "legal-content.cjs");
  if (existsSync(src)) out.push(src);
  return out;
}

describe("yasal metinlerde kişisel isim geçmez (operatör = NEXUS)", () => {
  const root = process.cwd();
  const files = collectLegalFiles(root);

  it("taranacak yasal dosya bulunur", () => {
    expect(files.length).toBeGreaterThanOrEqual(6); // 3 politika × (html+pdf) en az
  });

  for (const f of files) {
    it(f.slice(root.length + 1), () => {
      const content = readFileSync(f).toString("utf8");
      const hits = content.match(NAME_PATTERNS);
      expect(
        hits,
        `${f} içinde kişisel isim bulundu: ${hits?.join(", ")} — operatör yalnız "NEXUS" olmalı`,
      ).toBeNull();
    });
  }
});
