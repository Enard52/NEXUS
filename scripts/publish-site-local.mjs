#!/usr/bin/env node
/**
 * Geçici çözüm: siteyi GitHub Actions KAPALIYKEN yerelden yayınlar (kart kilidi).
 * ---------------------------------------------------------------
 * web-deploy.yml'nin "site" adımını locally tekrarlar:
 *   Enard52/Enard52.github.io deposunu klonlar/pull eder → www/public içeriğini
 *   kopyalar (`.git` hariç) → commit → push. Cloudflare Pages siteyi otomatik
 *   derleyip nexus-smarthome.pages.dev'e taşır (site depo bağlantısı zaten kurulu).
 *
 * Gereksinim: `gh auth login` yapılmış olmalı (gh git credential'ı devreder).
 * Kullanım:  node scripts/publish-site-local.mjs
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "www", "public");
const TMP = join(ROOT, "_site-publish");
const REPO = "https://github.com/Enard52/Enard52.github.io.git";

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", ...opts }).trim();
}

// 1) ön koşul kontrolü
if (!existsSync(SRC)) { console.error("www/public yok — önce node scripts/sync-www.mjs çalıştırın."); process.exit(1); }
try { sh("gh auth status"); } catch { console.error("`gh auth login` gerekli (kart kilidi döneminde yerel yayının tek yolu)."); process.exit(1); }

// 1b) ÇIKTI ASLA BAYAT OLMASIN: site üreteci (scripts/site-build.mjs) tek kaynak.
// Eskiden bu betik yalnızca www/public kopyasını gönderiyordu; üreteç değiştiyse
// canlıya bayat kopya çıkıyordu (ölçüldü: bozuk site.js canlıya yayınlanmıştı).
console.log("→ site üretiliyor (scripts/site-build.mjs)…");
sh("node scripts/site-build.mjs");
console.log("→ yapısal denetim (verify-site --smoke)…");
sh("node scripts/verify-site.mjs --smoke");

// 1c) Site girişi (kayıt / şifre sıfırlama) assets/cloud-config.js olmadan çalışmaz.
const ccFile = join(SRC, "assets", "cloud-config.js");
const cc = existsSync(ccFile) ? readFileSync(ccFile, "utf8") : "";
const ccUrl = (cc.match(/url:\s*"([^"]*)"/) || [])[1] || "";
const ccKey = (cc.match(/anonKey:\s*"([^"]*)"/) || [])[1] || "";
if (!ccUrl || !ccKey) {
  console.warn("!! cloud-config.js boş: giriş/kayıt 'kullanımda değil' mesajı verir (uygulama yine çalışır).");
  console.warn("   Bulmak için: NEXUS_SUPABASE_URL / NEXUS_SUPABASE_ANON_KEY tanımla ve yeniden çalıştır.");
} else {
  let role = "?";
  try { role = JSON.parse(Buffer.from(ccKey.split(".")[1], "base64").toString("utf8")).role; } catch {}
  // service_role asla istemciye gitmez; bu yayın hattı yalnız kamu (anon) anahtarını taşır.
  if (role !== "anon") { console.error(`!! cloud-config.js anahtarı anon değil (rol: ${role}) — yayın reddedildi.`); process.exit(1); }
  console.log("✓ cloud-config hazır (rol: anon)");
}

// 2) site deposunu tazele
rmSync(TMP, { recursive: true, force: true });
console.log("→ site deposu klonlanıyor…");
sh(`gh repo clone Enard52/Enard52.github.io "${TMP}" -- --depth 1`);

// 3) içerik kopyala (.git hariç)
console.log("→ www/public kopyalanıyor…");
for (const entry of readdirSync(TMP)) {
  if (entry === ".git" || entry === ".nojekyll") continue;
  rmSync(join(TMP, entry), { recursive: true, force: true });
}
cpSync(SRC, TMP, { recursive: true });

// 4) değişiklik var mı?
const status = sh("git status --porcelain", { cwd: TMP });
if (!status) { console.log("Değişiklik yok — site zaten güncel."); rmSync(TMP, { recursive: true, force: true }); process.exit(0); }

// 5) commit + push
sh('git add -A', { cwd: TMP });
const short = sh("git rev-parse --short HEAD").slice(0, 7);
sh(`git commit -m "site: yerel yayin (Actions kapali; kaynak ${short})"`, { cwd: TMP });
sh("git push", { cwd: TMP });
rmSync(TMP, { recursive: true, force: true });
console.log("✓ Site deposuna gönderildi. Cloudflare Pages 1-2 dk içinde nexus-smarthome.pages.dev'i günceller.");
console.log("  (Actions açılınca web-deploy.yml aynen çalışmaya devam eder — bu betik yalnız geçici.)");
