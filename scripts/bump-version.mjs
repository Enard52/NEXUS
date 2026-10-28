#!/usr/bin/env node
/**
 * Sürüm tek kaynağı (issue #28).
 *
 * Sürüm numarası ÜÇ yerde tutuluyordu ve elle değiştiriliyordu (bir kez hata
 * bile oldu). Bu betik üçünü birlikte günceller ve tutarlılığını test
 * (packages/core/src/version-consistency.test.ts) denetler:
 *   1. desktop/package.json          → version (Electron/otomatik güncelleme)
 *   2. android/app/build.gradle      → versionName + versionCode (otomatik artar)
 *   3. stitch-settings.html          → window.NEXUS_APP_VERSION ("Hakkında" satırı)
 *
 * Kullanım:
 *   node scripts/bump-version.mjs 1.0.14          # üç dosyayı güncelle
 *   node scripts/bump-version.mjs 1.0.14 --commit # + git commit + v* etiketi (push YOK)
 *   node scripts/bump-version.mjs --changelog     # CHANGELOG.md'yi git geçmişinden üret
 *   node scripts/bump-version.mjs --notes 1.0.14  # GitHub sürüm notu taslağını yazdır
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();

// ---- argümanlar ----
const args = process.argv.slice(2);
const DO_COMMIT = args.includes("--commit");
const DO_CHANGELOG = args.includes("--changelog");
const versionArg = args.find((a) => /^\d+\.\d+\.\d+$/.test(a));
const notesFor = args.includes("--notes") ? versionArg : null;

const parse = (v) => v.split(".").map(Number);
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

// ---- mevcut durum ----
const pkgPath = resolve(ROOT, "desktop/package.json");
const gradlePath = resolve(ROOT, "android/app/build.gradle");
const settingsPath = resolve(ROOT, "src/app/stitch-settings.html");

const current = JSON.parse(readFileSync(pkgPath, "utf8")).version;
const gradle = readFileSync(gradlePath, "utf8");
const currentName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const currentCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);

function applyVersion(next) {
  if (next === current) {
    console.error(`Hata: ${next} zaten geçerli sürüm.`);
    process.exit(1);
  }
  if (cmp(parse(next), parse(current)) < 0) {
    console.warn(`Uyarı: ${current} → ${next} geri gidiş (downgrade).`);
  }
  const [M, m, p] = parse(next);

  // 1) desktop/package.json
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // 2) android/app/build.gradle — versionCode: M*10000 + m*100 + p ile
  //    öncekinden büyük olacak şekilde (monoton artış Android gereği)
  const nextCode = Math.max(currentCode + 1, M * 10000 + m * 100 + p);
  const g = readFileSync(gradlePath, "utf8")
    .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${next}"`);
  writeFileSync(gradlePath, g);

  // 3) stitch-settings.html — NEXUS_APP_VERSION sabiti
  const s = readFileSync(settingsPath, "utf8");
  if (!/NEXUS_APP_VERSION = "/.test(s)) {
    console.error("Hata: stitch-settings.html içinde NEXUS_APP_VERSION sabiti bulunamadı.");
    process.exit(1);
  }
  writeFileSync(
    settingsPath,
    s.replace(/NEXUS_APP_VERSION = "[^"]+"/, `NEXUS_APP_VERSION = "${next}"`),
  );

  console.log(`✓ desktop/package.json        ${current} → ${next}`);
  console.log(`✓ android versionName         ${currentName} → ${next}`);
  console.log(`✓ android versionCode         ${currentCode} → ${nextCode}`);
  console.log(`✓ stitch-settings NEXUS_APP_VERSION → ${next}`);

  if (DO_COMMIT) {
    sh(`git add desktop/package.json android/app/build.gradle src/app/stitch-settings.html`);
    sh(`git commit -m "release: v${next}"`);
    sh(`git tag -a v${next} -m "NEXUS v${next}"`);
    console.log(`✓ commit + etiket v${next} (push yapılmadı — elle: git push && git push --tags)`);
  } else {
    console.log(
      "\nSonraki adım: derleme/yayın akışı (desktop-release / android-release) veya --commit ile commit+etiket.",
    );
  }
}

// ---- CHANGELOG (Conventional Commits → iki dilli bölümler) ----
const SECTIONS = [
  ["feat", "✨ Added"],
  ["fix", "🐛 Fixed"],
  ["perf", "⚡ Performans / Performance"],
  ["security", "🔒 Security"],
  ["docs", "📚 Docs"],
  ["refactor", "🧹 Refactoring"],
  ["build|ci|chore|test", "🛠 Maintenance"],
];

function commitsSince(range) {
  return sh(`git log --no-merges ${range} --pretty=format:%s`).split("\n").filter(Boolean);
}

function changelog() {
  const tags = sh("git tag -l v* --sort=-v:refname").split("\n").filter(Boolean);
  const ranges = [];
  if (tags.length >= 1) ranges.push([tags[0], "HEAD", null]);
  for (let i = 0; i < tags.length - 1; i++) ranges.push([tags[i + 1], tags[i], tags[i]]);

  let out = [
    "# Changelog / Değişim Günlüğü",
    "",
    "_Bu dosya `node scripts/bump-version.mjs --changelog` ile Conventional Commits'ten üretilir; elle düzenlenmez._",
    "",
  ];
  let pending;
  if (!tags.length) {
    pending = commitsSince("HEAD~200");
  }
  const blocks = [];
  if (pending && pending.length) {
    blocks.push(["Unreleased", pending]);
  }
  for (const [from, to, label] of ranges) {
    let list;
    try {
      list = commitsSince(`${from}..${to}`);
    } catch {
      continue;
    }
    if (!list.length) continue;
    blocks.push([label ? `v${label.replace(/^v/, "")}` : "Unreleased", list]);
  }
  for (const [title, list] of blocks) {
    out.push(`## ${title}`, "");
    const grouped = new Map(SECTIONS.map(([k]) => [k, []]));
    const etc = [];
    for (const c of list) {
      const m = c.match(/^(\w+)(\([^)]*\))?!?:\s*(.+)$/);
      if (!m) {
        etc.push(c);
        continue;
      }
      const type = m[1];
      const scope = m[2] ? m[2].replace(/[()]/g, "") + ": " : "";
      const bucket = SECTIONS.find(([k]) => new RegExp(`^(?:${k})$`).test(type));
      (bucket ? grouped.get(bucket[0]) : etc).push(scope + m[3]);
    }
    for (const [key, heading] of SECTIONS) {
      const items = grouped.get(key);
      if (!items || !items.length) continue;
      out.push(`### ${heading}`, ...items.map((i) => `- ${i}`), "");
    }
    if (etc.length) out.push("### 🧩 Other", ...etc.map((i) => `- ${i}`), "");
  }
  writeFileSync(resolve(ROOT, "CHANGELOG.md"), out.join("\n") + "\n");
  console.log(`✓ CHANGELOG.md güncellendi (${blocks.length} sürüm bloğu).`);
}

// ---- GitHub sürüm notu taslağı ----
function notes(v) {
  const tags = sh("git tag -l v* --sort=-v:refname").split("\n").filter(Boolean);
  const range = tags.length ? `${tags[0]}..HEAD` : "HEAD~100";
  const list = commitsSince(range);
  const feats = list.filter((c) => /^feat/i.test(c));
  const fixes = list.filter((c) => /^fix/i.test(c));
  const sec = list.filter((c) => /^security|fix.*güvenlik|fix.*security/i.test(c));
  const body = [
    `# NEXUS v${v}`,
    "",
    "**Yeni / New**",
    ...(feats.length ? feats.map((c) => `- ${c.replace(/^feat(\([^)]*\))?!?:\s*/, "")}`) : ["- -"]),
    "",
    "**Düzeltmeler / Fixes**",
    ...(fixes.length ? fixes.map((c) => `- ${c.replace(/^fix(\([^)]*\))?!?:\s*/, "")}`) : ["- -"]),
    "",
    sec.length ? `**Güvenlik / Security**\n${sec.map((c) => `- ${c}`).join("\n")}\n` : "",
    "---",
    "İndirmeler / Downloads: https://github.com/Enard52/nexus-releases",
  ];
  console.log(body.filter((l) => l !== "").join("\n"));
}

// ---- çalıştır ----
if (DO_CHANGELOG) {
  changelog();
} else if (notesFor) {
  notes(notesFor);
} else if (versionArg) {
  applyVersion(versionArg);
} else {
  console.log(
    "Kullanım:\n" +
      "  node scripts/bump-version.mjs <x.y.z> [--commit]\n" +
      "  node scripts/bump-version.mjs --changelog\n" +
      "  node scripts/bump-version.mjs --notes <x.y.z>\n" +
      `Mevcut sürüm: ${current} (android code ${currentCode})`,
  );
}
