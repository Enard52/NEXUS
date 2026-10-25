#!/usr/bin/env node
/**
 * Geçici çözüm: web uygulamasını GitHub Actions KAPALIYKEN yerelden yayınlar (kart kilidi).
 * ---------------------------------------------------------------------
 * web-deploy.yml'nin "web" adımını yerelde tekrarlar:
 *   www/ → _web-publish/ (public hariç) → wrangler pages deploy.
 *
 * Proje adı ÖNEMLİ: Cloudflare'de proje adı "nexus-web", üretim alanı adı
 * "nexus-web-jre.pages.dev". Alan adını proje sanıp `--project-name nexus-web-jre`
 * vermek deploy'u düşürüyordu (o adta bir proje yok) — workflow da düzeltildi.
 *
 * Gereksinim: `npx wrangler login` yapılmış olmalı.
 * Kullanım:   node scripts/publish-web-local.mjs [--dry]
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "www");
const STAGE = join(ROOT, "_web-publish");
const PROJECT = process.env.PAGES_PROJECT || "nexus-web";
const DOMAIN = "nexus-web-jre.pages.dev";
const DRY = process.argv.includes("--dry");

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"], encoding: "utf8" });
}

if (!existsSync(SRC)) {
  console.error("www yok — önce: node scripts/sync-www.mjs");
  process.exit(1);
}

// 1) sahne klasörü: www içeriği, tanıtım sitesi (public) hariç
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });
let n = 0;
for (const entry of readdirSync(SRC)) {
  if (entry === "public") continue;
  cpSync(join(SRC, entry), join(STAGE, entry), { recursive: true });
  n++;
}
const bytes = readdirSync(STAGE).length;
console.log(`→ sahne hazır: ${n} kalem (${bytes} üst öğe) → ${STAGE.replace(ROOT + "\\", "")}`);

if (DRY) {
  console.log("→ --dry: hiçbir şey yayınlanmadı.");
  process.exit(0);
}

// 2) yayınla
console.log(`→ wrangler pages deploy → proje "${PROJECT}" (alan: ${DOMAIN})`);
sh(`npx --yes wrangler@4 pages deploy "${STAGE}" --project-name ${PROJECT} --branch main --commit-dirty=true`);

console.log(`✓ Yayınlandı. Kanıt için: https://${DOMAIN}/lang-en.js`);
console.log("  (Actions açılınca web-deploy.yml aynı işi otomatik yapacak.)");
