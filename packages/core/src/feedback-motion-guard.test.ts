/**
 * Ortak geri bildirim + hareket altyapısı koruması.
 *
 * Bir dış denetim iki yanlış iddia üretmişti: (1) "nexus-feedback.js yalnızca
 * nexus-chat.html'de yüklü, ~60 sayfada yok" ve (2) "theme.js html.nx-no-anim
 * ekliyor ama bu sınıfa karşılık gelen CSS kuralı hiçbir yerde tanımlı değil".
 * İkisi de bugün doğru değil — ama ikisi de SESSİZCE bozulabilir: enjeksiyon
 * theme.js'in içindeki bir satırdır, kural ise elle yazılmış bir CSS bloğu. Bu
 * test ikisini de kalıcı olarak bağlar; tarayıcı ölçümüyle doğrulandı (62 ekranın
 * 62'sinde nexusFeedback tanımlı, nx-no-anim hesaplanan geçiş süresini 0.01ms'ye
 * düşürüyor).
 */
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Monorepo kökü: pnpm-workspace.yaml görülecek kadar üste tırman. */
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
const CSS = join(ROOT, "css");
const read = (...p: string[]) => readFileSync(join(...p), "utf8");
const sha = (...p: string[]) =>
  createHash("sha256")
    .update(read(...p))
    .digest("hex");

/** UI'siz yönlendirme kalıntıları: ortak altyapıyı yüklemeleri gereksiz —
 *  gittikleri ekran zaten yüklüyor. Yeni giriş yaparken gerekçeyi yaz. */
const REDIRECT_STUBS = new Set(["nexus-panels.html"]);

const screens = (): string[] =>
  readdirSync(APP)
    .filter((n) => /^nexus-.*\.html$/.test(n))
    .sort();

describe("nexus-feedback.js tüm ekranlarda yüklü olmalı", () => {
  it("theme.js dosyayı her sayfaya enjekte ediyor (çift yüklemeyi de kilitleyerek)", () => {
    const theme = read(APP, "theme.js");
    expect(theme, "theme.js nexus-feedback.js'i enjekte etmeyi bırakmış").toMatch(
      /s\.src\s*=\s*["']nexus-feedback\.js["']/,
    );
    expect(theme, "çift yüklemeyi engelleyen kontrol düşmüş").toMatch(
      /script\[src="nexus-feedback\.js"\]/,
    );
  });

  it("modülün kendisi tek kaynakta ve aynasında bayt özdeş duruyor", () => {
    expect(existsSync(join(APP, "nexus-feedback.js")), "src/app/nexus-feedback.js yok").toBe(true);
    expect(sha(APP, "nexus-feedback.js"), "www aynası bayat — node scripts/sync-www.mjs").toBe(
      sha(join(ROOT, "www"), "nexus-feedback.js"),
    );
  });

  it("hiçbir ekran modülü kendisi yüklemek zorunda değil; ama yükleyen de bozulmaz", () => {
    // Beklenti: src/app'de elle <script src="nexus-feedback.js"> taşıyan ekran OLMAMALI
    // (tek enjeksiyon noktası theme.js; ekran başına tag = unutulabilen 62. kopya).
    const elle = screens().filter((n) => /<script[^>]+nexus-feedback\.js/.test(read(APP, n)));
    expect(elle, "theme.js enjeksiyonu varken elle eklenmiş script etiketleri").toEqual([]);
  });

  it("her ekran theme.js + css/nexus-ui.css ikilisini bağlıyor (istisna: yönlendirme kalıntıları)", () => {
    const eksik: string[] = [];
    for (const n of screens()) {
      if (REDIRECT_STUBS.has(n)) continue;
      const html = read(APP, n);
      if (!/theme\.js/.test(html) || !/css\/nexus-ui\.css/.test(html)) eksik.push(n);
    }
    expect(eksik, "ortak altyapısı eksik ekranlar").toEqual([]);
    // Kalıntılar yönlendirdiği ekrana gidiyor; o hedefin altyapısı olmalı.
    for (const n of REDIRECT_STUBS) {
      if (!existsSync(join(APP, n))) continue;
      expect(read(APP, n), `${n} yönlendirme kalıntısı değil mi oldu?`).toMatch(
        /location\.replace|http-equiv="refresh"/,
      );
    }
  });
});

describe("html.nx-no-anim kuralı tanımlı olmalı", () => {
  it("css/nexus-ui.css ortak kuralı taşıyor ve animasyon + geçişi kapatıyor", () => {
    const css = read(CSS, "nexus-ui.css");
    const match = css.match(/html\.nx-no-anim[^{]*\{([^}]*)\}/);
    expect(match, "nx-no-anim kuralı css/nexus-ui.css içinde bulunamadı").toBeTruthy();
    const govde = match![1];
    expect(govde).toContain("animation-duration");
    expect(govde).toContain("transition-duration");
    expect(govde).toMatch(/!important/);
  });

  it("theme.js applyMotion aynı sınıfı koyuyor (kural ile sınıfla ayrı düşmesin)", () => {
    expect(read(APP, "theme.js")).toMatch(/classList\.toggle\(\s*["']nx-no-anim["']/);
  });

  it("kural www aynasına da ulaşmış (dağıtılan paketler aynı CSS'i görmeli)", () => {
    expect(sha(CSS, "nexus-ui.css"), "css aynası bayat — node scripts/sync-www.mjs").toBe(
      sha(join(ROOT, "www"), "css", "nexus-ui.css"),
    );
  });
});
