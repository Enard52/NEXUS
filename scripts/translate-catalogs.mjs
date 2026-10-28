/**
 * NEXUS — Incremental DeepL Translation Tool
 *
 * Run with: npx tsx scripts/translate-catalogs.mjs [--dry-run]
 *
 * - Single source of truth: the EN catalog inside @nexus/i18n (no local copy).
 * - Delta-only: sends a key to DeepL only when it is missing in the target
 *   locale or its English source hash changed since the last run.
 * - Tracks every translation in scripts/translation-manifest.json with
 *   sourceHash, provider, timestamp and QA status.
 * - Validates target languages against the DeepL supported-languages endpoint.
 * - Requests are capped at 40 texts / 120 KiB with exponential backoff+jitter
 *   on 429/5xx responses.
 * - Placeholders like {name} are wrapped as XML tags so DeepL preserves them.
 * - Brand and protocol terms (NEXUS, Matter, Zigbee, …) are protected.
 *
 * The auth key is read exclusively from DEEPL_AUTH_KEY and masked in output.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { CATALOGS, SUPPORTED_LOCALES } from "../packages/i18n/src/index.ts";

const DEEPL_KEY = process.env.DEEPL_AUTH_KEY;
if (!DEEPL_KEY) {
  console.error("Missing DEEPL_AUTH_KEY environment variable. Set it before running this tool.");
  process.exit(1);
}
const API_BASE = DEEPL_KEY.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
const DRY_RUN = process.argv.includes("--dry-run");

/** Masks the auth key anywhere it could appear in logs or error output. */
function maskSecret(text) {
  return String(text).split(DEEPL_KEY).join("[REDACTED]");
}
process.on("uncaughtException", (err) => {
  console.error("Fatal:", maskSecret(err && err.stack ? err.stack : err));
  process.exit(1);
});

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(root, "scripts", "translation-manifest.json");
const OUTPUT_PATH = path.join(root, "scripts", "translated-catalogs.json");

/** NEXUS locale → DeepL target language. */
const DEEPL_LANG_MAP = {
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  pt: "PT-BR",
  nl: "NL",
  pl: "PL",
  cs: "CS",
  ru: "RU",
  uk: "UK",
  ar: "AR",
  he: "HE",
  hi: "HI",
  ja: "JA",
  ko: "KO",
  "zh-Hans": "ZH-HANS",
  "zh-Hant": "ZH-HANT",
  vi: "VI",
};

/** Terms that must survive translation unchanged. */
const PROTECTED_TERMS = [
  "NEXUS AI",
  "NEXUS",
  "Matter",
  "Zigbee",
  "Z-Wave",
  "HomeKit",
  "macOS",
  "Windows",
  "Linux",
  "Android",
  "iOS",
];

/** Product context sent with every request (DeepL `context` parameter). */
const PRODUCT_CONTEXT =
  "NEXUS is a privacy-first smart home operating system for desktop, mobile and web. " +
  "Tone: friendly, clear and professional. 'Premium', 'Family' and 'Free' are plan names.";

const REQUEST_TEXT_LIMIT = 40;
const REQUEST_BYTE_LIMIT = 120 * 1024;
const MAX_RETRIES = 5;

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

/** Wrap {placeholders} and protected terms in XML tags DeepL will not touch. */
function protect(text) {
  let out = text.replace(/\{(\w+)\}/g, '<ph id="$1"/>');
  for (const term of PROTECTED_TERMS) {
    out = out.split(term).join(`<t>${term}</t>`);
  }
  return out;
}

/** Restore placeholders and protected terms after translation. */
function unprotect(text) {
  return text
    .replace(/<ph id="(\w+)"\s*\/>/g, "{$1}")
    .replace(/<t>(.*?)<\/t>/g, "$1")
    .replace(/<\/?ph[^>]*>/g, "");
}

async function deeplFetch(endpoint, params) {
  let attempt = 0;
  for (;;) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (res.ok) return res.json();
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt >= MAX_RETRIES) {
      const body = await res.text();
      throw new Error(`DeepL ${endpoint} failed (${res.status}): ${maskSecret(body)}`);
    }
    // Bounded exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s (+0–500ms)
    const delay = 1000 * 2 ** attempt + Math.random() * 500;
    console.warn(`  ${res.status} from DeepL — retrying in ${Math.round(delay)}ms`);
    await new Promise((r) => setTimeout(r, delay));
    attempt++;
  }
}

/** Verify every mapped target language is actually supported by the API. */
async function validateTargetLanguages() {
  const langs = await deeplFetch("/v2/languages", new URLSearchParams({ type: "target" }));
  const supported = new Set(langs.map((l) => String(l.language).toUpperCase()));
  const unsupported = Object.values(DEEPL_LANG_MAP).filter(
    (code) => !supported.has(code.toUpperCase()),
  );
  if (unsupported.length) {
    throw new Error(`DeepL does not support target language(s): ${unsupported.join(", ")}`);
  }
}

/** Split texts into chunks respecting the text-count and byte-size caps. */
function chunk(texts) {
  const chunks = [];
  let current = [];
  let bytes = 0;
  for (const t of texts) {
    const size = Buffer.byteLength(t, "utf8");
    if (current.length >= REQUEST_TEXT_LIMIT || bytes + size > REQUEST_BYTE_LIMIT) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(t);
    bytes += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

async function translateTexts(texts, targetLang) {
  const results = [];
  for (const batch of chunk(texts)) {
    const params = new URLSearchParams();
    for (const t of batch) params.append("text", t);
    params.set("source_lang", "EN");
    params.set("target_lang", targetLang);
    params.set("tag_handling", "xml");
    params.set("ignore_tags", "ph,t");
    params.set("preserve_formatting", "1");
    params.set("context", PRODUCT_CONTEXT);
    const json = await deeplFetch("/v2/translate", params);
    results.push(...json.translations.map((t) => t.text));
  }
  return results;
}

async function main() {
  const en = CATALOGS.en;
  const allKeys = Object.keys(en);
  const manifest = loadJson(MANIFEST_PATH, {});
  const output = loadJson(OUTPUT_PATH, {});
  const targetLocales = SUPPORTED_LOCALES.filter((l) => l !== "en" && l !== "tr");

  console.log(`EN catalog: ${allKeys.length} keys · targets: ${targetLocales.length} locales`);
  if (!DRY_RUN) await validateTargetLanguages();

  for (const locale of targetLocales) {
    const deeplLang = DEEPL_LANG_MAP[locale];
    if (!deeplLang) {
      console.warn(`No DeepL mapping for ${locale} — skipping`);
      continue;
    }
    manifest[locale] ??= {};
    output[locale] ??= {};

    // Delta selection: missing in catalog/output, or EN source hash changed.
    const pending = allKeys.filter((key) => {
      const entry = manifest[locale][key];
      const existing = CATALOGS[locale]?.[key] ?? output[locale][key];
      return !existing || !entry || entry.sourceHash !== sha256(en[key]);
    });

    if (!pending.length) {
      console.log(`${locale}: up to date`);
      continue;
    }
    console.log(`${locale}: translating ${pending.length} key(s)…`);
    if (DRY_RUN) continue;

    const translated = await translateTexts(
      pending.map((k) => protect(en[k])),
      deeplLang,
    );
    const now = new Date().toISOString();
    pending.forEach((key, i) => {
      output[locale][key] = unprotect(translated[i]);
      manifest[locale][key] = {
        sourceHash: sha256(en[key]),
        provider: "deepl",
        translatedAt: now,
        qa: "machine", // becomes "approved" after native-speaker review
      };
    });

    // Persist after each language so progress survives interruption.
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(`${locale}: done (${pending.length} keys)`);
  }

  console.log("\nAll locales processed.");
  console.log(`Catalog data:      ${OUTPUT_PATH}`);
  console.log(`Manifest:          ${MANIFEST_PATH}`);
  console.log("Apply new entries with: node scripts/inject-missing-keys.mjs (after review)");
}

main().catch((err) => {
  console.error("Fatal:", maskSecret(err && err.stack ? err.stack : err));
  process.exit(1);
});
