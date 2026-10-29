#!/usr/bin/env node
// Masaüstü YAYIN ön denetimi — bağımlılıksız, düz node ile çalışır.
//
// Neden var: v1.0.32 kurulumları şu hatayla açılmıyordu:
//   Uncaught Exception: Error: Cannot find module './kit/bridge.cjs'
//   Require stack: - ...\resources\app.asar\main.cjs
// HomeKit köprüsü main.cjs'e eklendi ama electron-builder'ın `files` listesi açık bir
// İZİN LİSTESİ: listelenmeyen klasör pakete hiç girmez. Kaynak ağaçta dosya durduğu için
// hiçbir test fark etmedi; CI yeşil, kurulum ölü. vitest tarafı packages/platform/src/
// desktop-package.test.ts'te kilitli — ama sürüm işi etiketten geldiği için o test
// yayın akışında hiç çalışmıyordu. Bu betik tam o boşluğu kapatır:
// desktop-release.yml derlemeyi/yayını GELİŞTİRMEK için bu betiği çağırır.
//
// İki mod:
//   node scripts/verify-desktop-payload.mjs            → kaynak ağaçtan ön denetim (yayın öncesi)
//   node scripts/verify-desktop-payload.mjs --asar P   → üretilen app.asar içini denetler (derleme sonrası)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESKTOP = path.join(ROOT, "desktop");
const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);

const pkg = JSON.parse(fs.readFileSync(path.join(DESKTOP, "package.json"), "utf8"));
const FILES = (pkg.build && pkg.build.files) || [];
const { isAppFile, EXCLUDE_JS } = require(path.join(DESKTOP, "scripts", "app-file-rules.cjs"));

// electron-builder `files` deseni → paket içine göreli yol girecek mi?
function covered(rel) {
  const norm = rel.split(path.sep).join("/");
  const negated = FILES.filter((p) => p.startsWith("!")).map((p) => p.slice(1));
  if (negated.some((p) => matchGlob(norm, p))) return false;
  return FILES.some((p) => !p.startsWith("!") && matchGlob(norm, p));
}

function matchGlob(rel, pattern) {
  if (pattern.endsWith("/**/*") || pattern.endsWith("/**")) {
    const base = pattern.replace(/\/\*\*(?:\/\*)?$/, "");
    return rel === base || rel.startsWith(base + "/");
  }
  if (!pattern.includes("*")) return rel === pattern;
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$");
  return re.test(rel);
}

// Bir .cjs içindeki göreceli require() hedeflerini çözülmüş mutlak yola çevirir.
function localRequires(file) {
  const src = fs.readFileSync(file, "utf8");
  const out = [];
  for (const m of src.matchAll(/require\(\s*["'`](\.[^"'`]+)["'`]\s*\)/g)) {
    const target = resolveLocal(path.resolve(path.dirname(file), m[1]));
    if (target) out.push(target);
  }
  return out;
}

function resolveLocal(base) {
  for (const t of [base, base + ".cjs", base + ".js", base + ".json", path.join(base, "index.cjs")]) {
    try {
      if (fs.statSync(t).isFile()) return t;
    } catch {
      /* yoksa sıradaki aday */
    }
  }
  return null;
}

/** Köprü modülünün dış paket bağımlılıkları (node: ve builtinler hariç). */
function externalDeps(file) {
  const BUILTINS = new Set(["fs", "path", "os", "http", "https", "crypto", "url", "net", "zlib", "util", "events"]);
  const src = fs.readFileSync(file, "utf8");
  const deps = new Set();
  for (const m of src.matchAll(/require\(\s*["']([a-z@][^"']*)["']/g)) {
    const d = m[1];
    if (d.startsWith("node:") || BUILTINS.has(d) || d === "electron") continue;
    deps.add(d.split("/")[0]);
  }
  return [...deps];
}

const problems = [];
const checked = { asarEntries: 0, modules: 0, appFiles: 0 };

// ---- 1) main sürecinin zincirleme yerel gereksinimleri listede olmalı ----
const seen = new Set();
const queue = ["main.cjs", "preload.cjs", "auth-preload.cjs"]
  .map((f) => path.join(DESKTOP, f))
  .filter((f) => fs.existsSync(f));
while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  const rel = path.relative(DESKTOP, file).split(path.sep).join("/");
  checked.modules++;
  if (!covered(rel)) problems.push(`build.files listesinde yok: ${rel} (main süreci bunu require ediyor)`);
  for (const dep of localRequires(file)) queue.push(dep);
}

// ---- 2) dış paket bağımlılıkları dependencies'te olmalı (devDependencies pakete girmez) ----
for (const file of [...seen].filter((f) => f.endsWith("bridge.cjs"))) {
  for (const dep of externalDeps(file)) {
    if (!pkg.dependencies || !pkg.dependencies[dep]) {
      problems.push(`${path.basename(file)} → ${dep} paketi dependencies içinde değil; kurulumda bulunamaz`);
    }
  }
}

// ---- 3) theme.js'in çalışırken enjekte ettiği modüller pakete girmeli ----
const SRC_APP = path.join(ROOT, "src", "app");
for (const f of fs.readdirSync(SRC_APP)) {
  if (!fs.statSync(path.join(SRC_APP, f)).isFile()) continue;
  if (!isAppFile(f) || EXCLUDE_JS.has(f)) continue;
  checked.appFiles++;
  if (!covered(path.join("app", f))) problems.push(`build.files app/${f} kapsamıyor; masaüstü uygulamasında eksik kalır`);
}

// ---- 4) --asar: gerçek üretilmiş paketin içine bak ----
const asarArg = argv[argv.indexOf("--asar") + 1];
if (argv.includes("--asar")) {
  if (!asarArg || !fs.existsSync(asarArg)) {
    problems.push(`app.asar bulunamadı: ${asarArg || "(yol verilmedi)"}`);
  } else {
    const fd = fs.openSync(asarArg, "r");
    try {
      const head = Buffer.alloc(16);
      fs.readSync(fd, head, 0, 16, 0);
      const headerSize = head.readUInt32LE(12);
      const buf = Buffer.alloc(headerSize);
      fs.readSync(fd, buf, 0, headerSize, 16);
      const tree = JSON.parse(buf.toString("utf8"));
      const paths = new Set();
      (function walk(node, prefix) {
        for (const [name, child] of Object.entries(node.files || {})) {
          const p = prefix + "/" + name;
          if (child.files) walk(child, p);
          else paths.add(p);
        }
      })(tree, "");
      checked.asarEntries = paths.size;
      const requiredInPackage = [
        "/main.cjs",
        "/preload.cjs",
        "/kit/bridge.cjs",
        "/app/theme.js",
        "/app/notify.js",
        "/app/push.js",
        "/app/firebase-messaging-sw.js",
        "/app/index.html",
        "/app/css/nexus-ui.css",
        "/node_modules/hap-nodejs/package.json",
      ];
      for (const need of requiredInPackage) {
        if (!paths.has(need)) problems.push(`paketlenmiş app.asar içinde yok: ${need}`);
      }
    } finally {
      fs.closeSync(fd);
    }
  }
}

if (problems.length) {
  console.error("✖ masaüstü paket denetimi BAŞARISIZ (" + problems.length + "):");
  for (const p of problems) console.error("  - " + p);
  console.error("Kurulum bu haliyle açılmaz ya da sessiz özellik kaybeder; derlemeyi yayınlamıyoruz.");
  process.exit(1);
}
console.log(
  "✓ masaüstü paket denetimi geçti — build.files " +
    JSON.stringify(FILES).slice(0, 72) +
    "… | main zinciri " +
    checked.modules +
    " modül | app dosyası " +
    checked.appFiles +
    (checked.asarEntries ? " | asar girdisi " + checked.asarEntries : ""),
);
