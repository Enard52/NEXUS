#!/usr/bin/env node
/**
 * winget manifest üretici (microsoft/winget-pkgs için). Sürüm ve SHA-256, yayımlanmış
 * SHA256SUMS-Windows.txt dosyasından okunur; değer uydurulmaz. Başvuru/PR sahibin işidir (docs/PACKAGING.md).
 *
 *   node scripts/gen-winget-manifest.mjs 1.0.39   → manifests/e/Enard52/NEXUS/1.0.39/*.yaml
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || "")) {
  console.error("Kullanım: node scripts/gen-winget-manifest.mjs <sürüm>");
  process.exit(1);
}
const base = `https://github.com/Enard52/nexus-releases/releases/download/v${version}`;
const res = await fetch(`${base}/SHA256SUMS-Windows.txt`);
if (!res.ok) {
  console.error(`SHA256SUMS-Windows.txt alınamadı (${res.status}); sürüm yayımlanmış mı?`);
  process.exit(1);
}
const line = (await res.text()).split(/\r?\n/).find((l) => /NEXUS-Setup\.exe\s*$/.test(l));
const sha = line && line.trim().split(/\s+/)[0].toUpperCase();
if (!sha || !/^[0-9A-F]{64}$/.test(sha)) {
  console.error("NEXUS-Setup.exe için SHA-256 bulunamadı.");
  process.exit(1);
}

const id = "Enard52.NEXUS";
const dir = join("manifests", "e", "Enard52", "NEXUS", version);
mkdirSync(dir, { recursive: true });
const head = (type) =>
  `PackageIdentifier: ${id}\nPackageVersion: ${version}\n` +
  (type === "version" ? "DefaultLocale: en-US\n" : "PackageLocale: en-US\n");
const schema = (n) =>
  `# yaml-language-server: $schema=https://aka.ms/winget-manifest.${n}.1.6.0.schema.json\n`;

writeFileSync(
  join(dir, `${id}.yaml`),
  schema("version") + head("version") + "ManifestType: version\nManifestVersion: 1.6.0\n",
);
writeFileSync(
  join(dir, `${id}.locale.en-US.yaml`),
  schema("defaultLocale") +
    head("locale") +
    "Publisher: Enard52\nPublisherUrl: https://github.com/Enard52\nPackageName: NEXUS\n" +
    "PackageUrl: https://github.com/Enard52/NEXUS\nLicense: See repository\n" +
    "ShortDescription: Local-first smart home control with no hub and no vendor cloud.\n" +
    "ManifestType: defaultLocale\nManifestVersion: 1.6.0\n",
);
writeFileSync(
  join(dir, `${id}.installer.yaml`),
  schema("installer") +
    `PackageIdentifier: ${id}\nPackageVersion: ${version}\nInstallerType: nullsoft\n` +
    `Installers:\n  - Architecture: x64\n    InstallerUrl: ${base}/NEXUS-Setup.exe\n    InstallerSha256: ${sha}\n` +
    "ManifestType: installer\nManifestVersion: 1.6.0\n",
);
console.log(`yazıldı: ${dir}  (SHA-256 ${sha.slice(0, 12)}…)`);
