// scripts/configure-mac-sign.cjs — macOS imza/notarization toggle (desktop-release.yml)
//
// Varsayılan (MACOS_SIGN tanımsız/≠ "true"): hiçbir şey yapmaz; electron-builder
// mevcut "identity": "-" + hardenedRuntime:false ayarıyla İMZASIZ derler — tasarım
// gereği, Apple Developer hesabı sahne arkasında private runner dakikası yakmasın.
//
// MACOS_SIGN = "true" iken: package.json'daki mac bloğunu imzalı + sertleştirilmiş
// + notarize edilmiş hale çevirir. Gerekli girdiler:
//   secrets.MACOS_IDENTITY                 → Developer ID Application imza kimliği
//   secrets.APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID → notarization
// Eksik MACOS_IDENTITY → açık hata (sessizce imzasız rapor yapıştırma!)
const { readFileSync, writeFileSync } = require("node:fs");
const { resolve, dirname } = require("node:path");

const HERE = __dirname;
const PKG = resolve(HERE, "..", "package.json");

if (process.env.MACOS_SIGN !== "true") {
  console.log("configure-mac-sign: MACOS_SIGN kapalı — imzasız macOS derlemesi (mevcut davranış).");
  process.exit(0);
}
const identity = (process.env.MACOS_IDENTITY || "").trim();
if (!identity || identity === "-") {
  console.error(
    "configure-mac-sign: MACOS_SIGN=true ama MACOS_IDENTITY gizli değişkeni yok.\n" +
      "GitHub → Settings → Secrets → MACOS_IDENTITY (örn. 'Developer ID Application: ...') ekleyin.",
  );
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG, "utf8"));
pkg.build.mac.identity = identity;
pkg.build.mac.hardenedRuntime = true;
// electron-builder 26 yerleşik notarization: APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD
// (+ APPLE_TEAM_ID) env varsa App Store sunucularında onaylar, yoksa yerel hata verir.
pkg.build.mac.notarize = true;
writeFileSync(PKG, JSON.stringify(pkg, null, 2) + "\n");
console.log(`configure-mac-sign: mac bloğu imzalı moda çevrildi (identity: ${identity}).`);
