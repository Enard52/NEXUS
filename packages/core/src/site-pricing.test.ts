import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRICES } from "../../../scripts/site-content.mjs";

// CLAUDE.md kural 4: fiyatlar tek kaynaktan gelir. cloud-sync.js (uygulama)
// ve scripts/site-content.mjs (site) aynı fiyatları göstermek zorundadır.
//
// Neden ham metin aramıyoruz: biçimlendirici (prettier) nesne anahtarlarındaki
// tırnakları kaldırıyor ve satırları kırıyor — `toContain('"Aylık": "₺499,99"')`
// ürün doğruyken bile kırmızıya düşüyordu. Sözleşme "bu planda bu fiyat yazıyor"
// olmalı, tırnak/boşluk stiliyle değil.
describe("site fiyatları tek kaynakla uyumlu (kural 4)", () => {
  const root = process.cwd();
  const cloudSync = readFileSync(join(root, "src", "app", "cloud-sync.js"), "utf8");
  const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // site-content.mjs İngilizce anahtar taşıyor (monthly/yearly), uygulama Türkçe
  // (Aylık/Yıllık): ikisini birbirine karıştırınca test "undefined" aratıyordu.
  const PLANS = [
    { key: "monthly", label: "Aylık" },
    { key: "yearly", label: "Yıllık" },
  ] as const;

  function fiyatEşleşmesi(cur: "TRY" | "USD", plan: (typeof PLANS)[number]) {
    const value = String(PRICES[cur][plan.key]);
    return new RegExp(`['"]?${rx(plan.label)}['"]?\\s*:\\s*['"]${rx(value)}['"]`);
  }

  for (const cur of ["TRY", "USD"] as const) {
    for (const plan of PLANS) {
      it(`cloud-sync ${cur} ${plan.label.toLowerCase()} fiyatı site ile aynı`, () => {
        expect(
          cloudSync,
          `cloud-sync.js içinde ${cur}/${plan.label} = ${PRICES[cur][plan.key]} bulunamadı`,
        ).toMatch(fiyatEşleşmesi(cur, plan));
      });
    }
  }
});
