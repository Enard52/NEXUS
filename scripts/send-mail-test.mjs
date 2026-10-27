// Tek seferlik: kullanıcının istediği test maillerini mevcut canlı şablonlarla gönderir.
// cloud-config.js'teki anon anahtarı yalnızca burada kullanılır, asla yazdırılmaz.
import { readFileSync } from "node:fs";

const src = readFileSync("cloud-config.js", "utf8");
const url = (src.match(/url\s*[:=]\s*['"]([^'"]+)['"]/i) || [])[1];
const key = (src.match(/anonKey\s*[:=]\s*['"]([^'"]+)['"]/i) || [])[1];
if (!url || !key) { console.log("cloud-config okunamadı"); process.exit(1); }

const base = url.replace(/\/+$/, "");
const headers = { apikey: key, "Content-Type": "application/json" };

async function post(path, body) {
  const r = await fetch(base + path, { method: "POST", headers, body: JSON.stringify(body) });
  let text = "";
  try { text = await r.text(); } catch {}
  // Yanıt gövdesinde anahtar benzeri bir şey yoktur; sadece hata kodu ve mesaj özeti yazdırılır.
  const err = text ? text.slice(0, 120) : "";
  console.log(path, "->", r.status, err);
}

// 1) Parola sıfırlama maili: hesap varsa "Reset Password" şablonu gider.
await post("/auth/v1/recover", { email: "ensarharmanci52@gmail.com" });

// 2) Kayıt onay maili: yeni +mailtest adresine "Confirm signup" şablonu gider
//    (Gmail + takma adları ana gelen kutusuna düşürür). Adres zaten kayıtlıysa mail gitmez.
await post("/auth/v1/signup", {
  email: "ensarharmanci52+mailtest@gmail.com",
  password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase(),
});
