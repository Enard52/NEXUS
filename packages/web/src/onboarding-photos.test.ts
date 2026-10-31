import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Karşılama (onboarding) görselleri yalnız karşılama ekranında kullanılır; içerik ekranlarındaki fotoğraflar
 * ayrı tutulur ki kullanıcı görsel çeşitlilik görsün. Burada dosya adı düzeyinde ayrım sınanır.
 */
const APP = resolve(__dirname, "../../../src/app");
const ROOT = resolve(__dirname, "../../..");
const ONBOARDING = readFileSync(resolve(APP, "nexus-onboarding.html"), "utf8");

const photos = [
  ...new Set([...ONBOARDING.matchAll(/assets\/photos\/([\w.-]+\.jpg)/g)].map((m) => m[1])),
];

describe("karşılama görselleri", () => {
  it("üç ayrı görsel kullanır ve dosyaları vardır", () => {
    expect(photos.length).toBe(3);
    for (const p of photos) expect(existsSync(resolve(ROOT, "assets/photos", p))).toBe(true);
  });

  it("hiçbir başka ekranda ya da betikte kullanılmaz", () => {
    const users: string[] = [];
    for (const f of readdirSync(APP)) {
      if (!/\.(html|js|css)$/.test(f) || f === "nexus-onboarding.html") continue;
      const src = readFileSync(resolve(APP, f), "utf8");
      for (const p of photos) if (src.includes(p)) users.push(`${f}: ${p}`);
    }
    expect(users).toEqual([]);
  });
});
