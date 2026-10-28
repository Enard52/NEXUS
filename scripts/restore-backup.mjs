#!/usr/bin/env node
/**
 * Yedekten geri yükleme (issue #13).
 * ---------------------------------------------------------------
 * weekly-backup Edge Function'ının özel `backups` kovasına yazdığı
 * JSON yedeklerini listeler ve seçilenini nexus_* tablolarına upsert eder.
 * Yalnızca YERELDE çalışır; service role anahtarı ister (asla depoya yazma).
 *
 * Kullanım:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/restore-backup.mjs list
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/restore-backup.mjs restore <dosya-adı> [--dry]
 *
 * Not: storage listesi için anon + service ikisi de gerekir (anon yeterliyse
 * de olur; en az biri ortamda olmalı).
 */
import { createClient } from "@supabase/supabase-js";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [cmd, file, ...rest] = process.argv.slice(2);
const DRY = rest.includes("--dry");

if (!URL_ || !KEY) {
  console.error(
    "Ortam değişkenleri gerekli: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (yerel çalıştırma; anahtarı depoya yazmayın).",
  );
  process.exit(1);
}
const db = createClient(URL_, KEY, { auth: { persistSession: false } });

async function list() {
  const { data, error } = await db.storage
    .from("backups")
    .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
  if (error) {
    console.error("Liste alınamadı:", error.message);
    process.exit(1);
  }
  if (!data.length) {
    console.log("Kovada yedek yok.");
    return;
  }
  console.log("Kovadaki yedekler (en yeni en altta):");
  for (const f of data) console.log(`  ${f.name}  ${(f.metadata?.size / 1024).toFixed(1)} KB`);
}

async function restore(name) {
  if (!name) {
    console.error("Dosya adı verin: restore <dosya-adı>");
    process.exit(1);
  }
  const { data: blob, error: dl } = await db.storage.from("backups").download(name);
  if (dl) {
    console.error("İndirilemedi:", dl.message);
    process.exit(1);
  }
  const backup = JSON.parse(await blob.text());
  console.log(
    `Yedek içeriği: ${Object.keys(backup)
      .map((k) => `${k}: ${(backup[k] || []).length} satır`)
      .join(", ")}`,
  );

  for (const table of ["nexus_user_state", "nexus_devices", "nexus_entitlements"]) {
    const rows = backup[table];
    if (!Array.isArray(rows) || !rows.length) {
      console.log(`- ${table}: yedekte satır yok, atlandı`);
      continue;
    }
    if (DRY) {
      console.log(`- ${table}: ${rows.length} satır (DRY — yazılmadı)`);
      continue;
    }
    const { error } = await db.from(table).upsert(rows, { onConflict: "user_id" });
    console.log(
      `- ${table}: ${rows.length} satır ${error ? "HATA: " + error.message : "yazıldı ✓"}`,
    );
  }
  if (!DRY)
    console.log("Geri yükleme tamam. Satır sayılarını kontrol edin ve kullanıcıya haber verin.");
}

if (cmd === "list") await list();
else if (cmd === "restore") await restore(file);
else {
  console.log(
    "Kullanım:\n  node scripts/restore-backup.mjs list\n  node scripts/restore-backup.mjs restore <dosya> [--dry]",
  );
}
