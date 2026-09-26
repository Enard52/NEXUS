/**
 * Mobil derleme çıktısını site indirme merkezine taşır.
 *
 * Neden ayri bir adim: gradle ciktilari `build/` altinda kayboluyor ve site
 * `public/downloads/NEXUS-<surum>.apk` adresini vaat ediyor. Ayni dosya farkli
 * adlarla dolasin, surum numarasi package.json'dan sapmasin diye tek kapidan
 * geciriliyor.
 *
 * Debug APK'si asla "surum" adini almaz: -debug ekiyle kopyalanir, boylece
 * imzasiz/test derlemesi magazada yayinlanacak paket gibi sunulmaz.
 *
 * Kullanim:
 *   node scripts/publish-mobile-artifact.mjs            # release APK aranir
 *   node scripts/publish-mobile-artifact.mjs --debug    # debug APK'si + etiket
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const ANDROID_OUT = join(ROOT, "mobile-app", "android", "app", "build", "outputs", "apk");
const DOWNLOADS = join(ROOT, "public", "downloads");
const wantDebug = process.argv.includes("--debug");

const version = JSON.parse(readFileSync(join(ROOT, "mobile-app", "package.json"), "utf8")).version;
const variant = wantDebug ? "debug" : "release";
const sourceDir = join(ANDROID_OUT, variant);

if (!existsSync(sourceDir)) {
  console.error(
    `APK bulunamadi: ${sourceDir}\n` +
      `Once derle: cd mobile-app/android && ./gradlew assemble${wantDebug ? "Debug" : "Release"}`,
  );
  process.exit(1);
}

const apk = readdirSync(sourceDir).find((f) => f.endsWith(".apk"));
if (!apk) {
  console.error(`Bu klasörde APK yok: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(DOWNLOADS, { recursive: true });
const targetName = wantDebug ? `NEXUS-${version}-debug.apk` : `NEXUS-${version}.apk`;
const target = join(DOWNLOADS, targetName);
copyFileSync(join(sourceDir, apk), target);
console.log(`kopyalandi: ${apk} -> public/downloads/${targetName}`);

// Saglama toplamlari, site ile ayni klasorden okundugu icin hemen ardindan uretilir.
const manifest = spawnSync(process.execPath, [join(ROOT, "scripts", "release-manifest.mjs")], {
  stdio: "inherit",
});
if (manifest.status !== 0) {
  console.error("SHA-256 manifesti uretilemedi.");
  process.exit(1);
}

console.log(`\nHazir. Site indirme linki: /downloads/${targetName}`);
if (wantDebug) {
  console.log("DIKKAT: bu debug paketidir - telefonda test icin, magazaya/Yayin linkine konmaz.");
}
