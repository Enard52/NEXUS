// Sitenin koda gömülü arayüz metinleri (menü, giriş/iletişim formu, uyarılar…).
// Kodda `isTr ? 'Türkçe' : tx('English')` (sunucu) ya da `nxU('English')` (tarayıcı) biçiminde yazılır;
// diğer diller için scripts/site-ui/<kod>.json dosyası { "English": "çeviri" } sözlüğüdür.
// Sözlükte bulunmayan metin İngilizce görünür. TR/EN için dosya gerekmez (TR kodun içinde).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const UI_DIR = path.join(HERE, "site-ui");

const LIT = String.raw`(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\]|\\.)*\x60)`;

/** site-build.mjs içindeki tx(...) / nxU(...) çağrılarının İngilizce anahtarları. */
export function extractKeys(file = path.join(HERE, "site-build.mjs")) {
  const src = fs.readFileSync(file, "utf8");
  const out = { server: new Set(), client: new Set() };
  for (const [fn, bucket] of [
    ["tx", "server"],
    ["nxU", "client"],
  ]) {
    for (const m of src.matchAll(new RegExp(String.raw`(?<![\w$.])${fn}\((${LIT})\)`, "g"))) {
      try {
        out[bucket].add(Function(`return ${m[1]}`)());
      } catch {
        /* sabit metin değil */
      }
    }
  }
  return out;
}

const cache = new Map();
/** Dil için { English: çeviri } sözlüğü ({} = çeviri yok, İngilizce görünür). */
export function uiFor(lang) {
  if (lang === "en" || lang === "tr") return {};
  if (cache.has(lang)) return cache.get(lang);
  const f = path.join(UI_DIR, `${lang}.json`);
  let d = {};
  try {
    d = JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));
  } catch {
    d = {};
  }
  cache.set(lang, d);
  return d;
}
