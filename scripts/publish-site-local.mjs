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
import { cpSync, existsSync, rmSync, readdirSync } from "node:fs";
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
