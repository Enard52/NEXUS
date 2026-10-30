import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRow,
  CORS,
  createRateLimiter,
  MAX_MESSAGE,
  MAX_PAGE,
  MAX_PLATFORM,
  MAX_VERSION,
  RATE_MAX,
  RATE_WINDOW_MS,
} from "../../../supabase/functions/client-error/logic";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INDEX_SRC = readFileSync(
  join(REPO_ROOT, "supabase", "functions", "client-error", "index.ts"),
  "utf8",
);

describe("client-error — hız sınırı", () => {
  it("aynı IP'den pencere içinde en çok 5 kayıt kabul eder, 6.'yı reddeder", () => {
    const allowed = createRateLimiter();
    for (let i = 0; i < RATE_MAX; i++) expect(allowed("1.1.1.1", 1000 + i)).toBe(true);
    expect(allowed("1.1.1.1", 2000)).toBe(false);
    expect(allowed("1.1.1.1", 3000)).toBe(false);
  });

  it("IP'ler birbirinden bağımsız sayılır", () => {
    const allowed = createRateLimiter();
    for (let i = 0; i < RATE_MAX; i++) allowed("1.1.1.1", 1000);
    expect(allowed("1.1.1.1", 1001)).toBe(false);
    expect(allowed("2.2.2.2", 1001)).toBe(true);
  });

  it("pencere dolunca (10 dk) eski kayıtlar düşer ve yeniden izin verilir", () => {
    const allowed = createRateLimiter();
    for (let i = 0; i < RATE_MAX; i++) allowed("ip", 0);
    expect(allowed("ip", RATE_WINDOW_MS - 1)).toBe(false);
    expect(allowed("ip", RATE_WINDOW_MS)).toBe(true);
  });

  it("reddedilen istekler pencereyi uzatmaz", () => {
    const allowed = createRateLimiter();
    for (let i = 0; i < RATE_MAX; i++) allowed("ip", 0);
    for (let t = 1; t < 50; t++) expect(allowed("ip", t * 1000)).toBe(false);
    expect(allowed("ip", RATE_WINDOW_MS)).toBe(true);
  });

  it("pencere 10 dakika, sınır 5", () => {
    expect(RATE_WINDOW_MS).toBe(600_000);
    expect(RATE_MAX).toBe(5);
  });
});

describe("client-error — kayıt satırı", () => {
  it("geçerli gövdeyi olduğu gibi satıra çevirir", () => {
    expect(
      buildRow({ page: "home", version: "1.2.3", platform: "android", message: "boom" }),
    ).toEqual({
      page: "home",
      version: "1.2.3",
      platform: "android",
      message: "boom",
    });
  });

  it("alanları sınırlara kırpar", () => {
    const row = buildRow({
      page: "p".repeat(500),
      version: "v".repeat(500),
      platform: "x".repeat(500),
      message: "m".repeat(5000),
    })!;
    expect(row.page).toHaveLength(MAX_PAGE);
    expect(row.version).toHaveLength(MAX_VERSION);
    expect(row.platform).toHaveLength(MAX_PLATFORM);
    expect(row.message).toHaveLength(MAX_MESSAGE);
  });

  it("boş / eksik / falsy mesaj reddedilir", () => {
    expect(buildRow({})).toBeNull();
    expect(buildRow({ message: "" })).toBeNull();
    expect(buildRow({ message: null })).toBeNull();
    expect(buildRow({ message: 0 })).toBeNull();
    expect(buildRow({ page: "home", version: "1", platform: "web" })).toBeNull();
  });

  it("eksik alanlar boş string olur (null/undefined yazılmaz)", () => {
    expect(buildRow({ message: "x" })).toEqual({
      page: "",
      version: "",
      platform: "",
      message: "x",
    });
  });

  it("string olmayan değerler stringe çevrilir", () => {
    const row = buildRow({ message: 42, page: ["a", "b"], version: 1.5 })!;
    expect(row.message).toBe("42");
    expect(row.page).toBe("a,b");
    expect(row.version).toBe("1.5");
  });

  it("yalnızca beş izinli alan satıra girer (fazladan kişi verisi atılır)", () => {
    const row = buildRow({
      message: "x",
      email: "a@b.c",
      user: "ali",
      ip: "9.9.9.9",
      stack: "s",
    })!;
    expect(Object.keys(row).sort()).toEqual(["message", "page", "platform", "version"]);
  });

  it("JSON `null` / sayı / string gövde çökmez, reddedilir (500 yerine 400 'empty')", () => {
    expect(buildRow(null)).toBeNull();
    expect(buildRow(undefined)).toBeNull();
    expect(buildRow(42)).toBeNull();
    expect(buildRow("text")).toBeNull();
  });

  it("sadece boşluktan oluşan mesaj kabul edilir (mevcut davranış korunur)", () => {
    expect(buildRow({ message: "   " })?.message).toBe("   ");
  });
});

describe("client-error — index.ts bağlantısı", () => {
  it("mantığı logic.ts'ten alır ve kendi kopyasını tutmaz", () => {
    expect(INDEX_SRC).toContain('from "./logic.ts"');
    expect(INDEX_SRC).toContain("buildRow(body)");
    expect(INDEX_SRC).toContain("createRateLimiter()");
    expect(INDEX_SRC).not.toContain(".slice(0, 500)");
  });

  it("logic.ts Deno'ya özgü içe aktarma içermez", () => {
    const src = readFileSync(
      join(REPO_ROOT, "supabase", "functions", "client-error", "logic.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/^import\s/m);
    expect(src).not.toContain("Deno.");
  });

  it("CORS başlıkları değişmedi", () => {
    expect(CORS).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
    });
  });
});
