#!/usr/bin/env node
/**
 * NEXUS — bulut yapılandırmasını dağıtılacak paketlere koyar (hesap senkronunun anahtarı).
 * ------------------------------------------------------------------
 * cloud-config.js gitignore'dadır (Supabase anahtarları repoya girmez). Bu yüzden CI
 * derlemelerinde dosya YOKTU ve uygulama sessizce "tamamen yerel" moda düşüyordu:
 * masaüstü ve mobil paketlerde gerçek hesap / cihaz senkronu çalışmıyordu.
 * Masaüstü derlemesi bunu kendi adimında üretiyordu; tek yere topladık.
 *
 * Değerler yalnızca ortamdan gelir (workflow: vars.NEXUS_SUPABASE_URL / _ANON_KEY).
 * Betik hiçbir zaman anahtarı yazdırmaz — yalnızca hangisinin kullanıldığını bildirir.
 *
 * Kullanım:  node scripts/ensure-cloud-config.mjs [ek-hedef-dizin ...]
 *   ör. CI:   node scripts/ensure-cloud-config.mjs www
 * Yerel geliştirme: gerçek cloud-config.js zaten varsa O kullanılır, üzerine yazılmaz.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = process.argv.slice(2).map((a) => resolve(ROOT, a));

function parse(file) {
  if (!existsSync(file)) return null;
  let text;
  try {
    text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  } catch {
    return null;
  }
  const url = (text.match(/url:\s*"([^"]*)"/) || [])[1] || "";
  const anonKey = (text.match(/anonKey:\s*"([^"]*)"/) || [])[1] || "";
  const firebase = {
    apiKey: (text.match(/NEXUS_FIREBASE\s*=\s*\{[\s\S]*?apiKey:\s*"([^"]*)"/) || [])[1] || "",
    projectId: (text.match(/projectId:\s*"([^"]*)"/) || [])[1] || "",
    messagingSenderId: (text.match(/messagingSenderId:\s*"([^"]*)"/) || [])[1] || "",
    appId: (text.match(/appId:\s*"([^"]*)"/) || [])[1] || "",
    vapidKey: (text.match(/vapidKey:\s*"([^"]*)"/) || [])[1] || "",
  };
  return { url, anonKey, firebase };
}

function render(url, anonKey, firebase) {
  const fb = firebase && firebase.apiKey && firebase.projectId && firebase.appId && firebase.messagingSenderId
    ? `
// Firebase Cloud Messaging (push): uygulama kapaliyken bildirim. Degerler
// Firebase konsolundan gelir; yoksa push modulu kendini kapatir (no-op).
window.NEXUS_FIREBASE = {
  apiKey: "${firebase.apiKey}",
  authDomain: "${firebase.projectId}.firebaseapp.com",
  projectId: "${firebase.projectId}",
  messagingSenderId: "${firebase.messagingSenderId}",
  appId: "${firebase.appId}",
  vapidKey: "${firebase.vapidKey || ""}",
};
`
    : "";
  return `// NEXUS bulut yapilandirmasi — derleme adiminda uretildi (scripts/ensure-cloud-config.mjs).
// Bu dosya gitignore'dadir; degerler GitHub Actions degiskenlerinden gelir.
window.NEXUS_CLOUD = {
  url: "${url}",
  anonKey: "${anonKey}",
};
${fb}`;
}

function writeAll(content) {
  const files = [join(ROOT, "cloud-config.js"), ...TARGETS.map((d) => join(d, "cloud-config.js"))];
  for (const file of files) {
    mkdirSync(dirname(file), { recursive: true });
    // BOM yok: tarayıcı ve testler düz UTF-8 bekliyor.
    writeFileSync(file, content, { encoding: "utf8" });
  }
  return files;
}

const envUrl = (process.env.NEXUS_SUPABASE_URL || "").trim();
const envKey = (process.env.NEXUS_SUPABASE_ANON_KEY || "").trim();
const envFb = {
  apiKey: (process.env.NEXUS_FIREBASE_API_KEY || "").trim(),
  projectId: (process.env.NEXUS_FIREBASE_PROJECT_ID || "").trim(),
  messagingSenderId: (process.env.NEXUS_FIREBASE_SENDER_ID || "").trim(),
  appId: (process.env.NEXUS_FIREBASE_APP_ID || "").trim(),
  vapidKey: (process.env.NEXUS_FIREBASE_VAPID_KEY || "").trim(),
};
const local = parse(join(ROOT, "cloud-config.js"));

let source = "";
let files = [];
if (local && local.url && local.anonKey) {
  source = "yerel cloud-config.js";
  // Yalnızca www/ gibi hedeflere kopyalanır; kaynak dosyaya dokunulmaz.
  const fb = local.firebase && local.firebase.apiKey ? local.firebase : envFb;
  for (const dir of TARGETS) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "cloud-config.js"), render(local.url, local.anonKey, fb), "utf8");
  }
  files = TARGETS.map((d) => join(d, "cloud-config.js"));
} else if (envUrl && envKey) {
  source = "GitHub Actions değişkenleri";
  files = writeAll(render(envUrl, envKey, envFb));
} else {
  // Bulut yok: boş şablon yazılır ki <script src="cloud-config.js"> 404 olmasın ve
  // uygulamanın yerel modda olduğu BİLİNÇLİ bir durum olsun (sessiz hata değil).
  source = "yapılandırma yok (uygulama yerel modda çalışacak)";
  files = writeAll(render("", "", null));
  console.warn("::warning title=Bulut senkronu kapalı::NEXUS_SUPABASE_URL / NEXUS_SUPABASE_ANON_KEY tanımlı değil; hesap ve cihaz senkronu devre dışı yayınlanır.");
}

console.log(`cloud-config hazır — kaynak: ${source}`);
for (const f of files) console.log("  " + f.replace(ROOT, "."));
