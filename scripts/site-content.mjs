// NEXUS tanıtım sitesi — çok dilli içerik kaynağı (issue #190)
// ------------------------------------------------------------
// scripts/site-build.mjs bu modülden index + about + yasal sayfaları üretir.
// Fiyatlar cloud-sync.js PRICES ile birebir aynı olmak zorundadır
// (packages/core/src/site-pricing.test.ts denetler).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CHECKOUT_URLS,
  PRICES,
  APP_URL,
  RELEASES_URL,
  MANAGE_URL,
  BILLING_URL,
  SUPPORT_EMAIL,
  CONNECTOR_REQUEST_URL,
  brand,
} from "./site-constants.mjs";

import { en } from "./site-content.en.mjs";
import { tr } from "./site-content.tr.mjs";

export {
  CHECKOUT_URLS,
  PRICES,
  APP_URL,
  RELEASES_URL,
  MANAGE_URL,
  BILLING_URL,
  SUPPORT_EMAIL,
  CONNECTOR_REQUEST_URL,
  brand,
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

export function deepMergeWithFallback(target, fallback) {
  if (target === undefined || target === null) return fallback;
  if (typeof fallback !== "object" || fallback === null || Array.isArray(fallback)) {
    return target !== undefined && target !== "" ? target : fallback;
  }
  const result = Array.isArray(fallback) ? [...fallback] : { ...fallback };
  for (const key of Object.keys(fallback)) {
    if (target[key] !== undefined && target[key] !== "") {
      if (typeof fallback[key] === "object" && fallback[key] !== null && !Array.isArray(fallback[key])) {
        result[key] = deepMergeWithFallback(target[key], fallback[key]);
      } else {
        result[key] = target[key];
      }
    }
  }
  for (const key of Object.keys(target)) {
    if (result[key] === undefined && target[key] !== undefined && target[key] !== "") {
      result[key] = target[key];
    }
  }
  return result;
}

export function getSiteLanguages() {
  const langs = new Set(["en", "tr"]);

  // Test ortamı için ek diller
  if (process.env.TEST_SITE_LANGS) {
    process.env.TEST_SITE_LANGS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((l) => langs.add(l));
  }

  // theme.js'teki COMMUNITY_LANGS
  try {
    const themeSrc = fs.readFileSync(path.join(ROOT, "src", "app", "theme.js"), "utf8");
    const m = themeSrc.match(/var COMMUNITY_LANGS\s*=\s*\{([\s\S]*?)\};/);
    if (m) {
      const keys = m[1].match(/^\s*['"]?([a-zA-Z0-9_-]+)['"]?\s*:/gm);
      if (keys) {
        keys.forEach((k) => langs.add(k.replace(/['":\s]/g, "")));
      }
    }
  } catch {}

  // scripts/site-content.<lang>.mjs dosyaları
  try {
    const files = fs.readdirSync(HERE);
    for (const f of files) {
      const m = f.match(/^site-content\.([a-zA-Z0-9_-]+)\.mjs$/);
      if (m && m[1] !== "en" && m[1] !== "tr") {
        langs.add(m[1]);
      }
    }
  } catch {}

  return Array.from(langs);
}

const loadedCache = new Map();
loadedCache.set("en", en);
loadedCache.set("tr", tr);

export function getContent(lang) {
  if (loadedCache.has(lang)) return loadedCache.get(lang);

  const langFile = path.join(HERE, `site-content.${lang}.mjs`);
  let specific = null;
  if (fs.existsSync(langFile)) {
    try {
      // Dinamik senkron require veya okuma
      const code = fs.readFileSync(langFile, "utf8").replace(/^﻿/, "").replace(/^import[^\n]*\n/gm, "");
      // JSON veya export edilen nesneyi al
      const fn = new Function("RELEASES_URL", `${code.replace(/export\s+const\s+\w+\s*=/, "return ")};`);
      specific = fn(RELEASES_URL);
    } catch (err) {
      console.error(`[site-content] Error loading ${langFile}:`, err.message);
      specific = null;
    }
  }

  const baseEn = JSON.parse(JSON.stringify(en));
  baseEn.lang = lang;
  baseEn.htmlLang = lang;
  baseEn.canonical = `/${lang}/`;

  const merged = specific ? deepMergeWithFallback(specific, baseEn) : baseEn;
  merged.lang = lang;
  merged.htmlLang = lang;
  merged.canonical = `/${lang}/`;

  loadedCache.set(lang, merged);
  return merged;
}

export const content = new Proxy(
  { en, tr },
  {
    get(target, prop) {
      if (typeof prop !== "string") return target[prop];
      if (prop in target) return target[prop];
      return getContent(prop);
    },
    has(target, prop) {
      if (typeof prop !== "string") return false;
      return getSiteLanguages().includes(prop);
    },
    ownKeys() {
      return getSiteLanguages();
    },
    getOwnPropertyDescriptor(target, prop) {
      return {
        configurable: true,
        enumerable: true,
        value: this.get(target, prop),
      };
    },
  },
);

export function priceFor(lang) {
  // Türkçe arayüz TL, diğer diller USD (cloud-sync.js ile aynı kural)
  return lang === "tr" ? PRICES.TRY : PRICES.USD;
}
