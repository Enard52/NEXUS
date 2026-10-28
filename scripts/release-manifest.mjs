/**
 * Release manifest generator.
 *
 * Produces two artifacts that ship with every release:
 *   1. public/downloads/SHA256SUMS.txt — integrity checksums for every
 *      installer binary, so users and the auto-updater can verify downloads.
 *   2. sbom.json — a CycloneDX software bill of materials covering every
 *      production dependency actually installed in the workspace.
 *
 * Usage: node scripts/release-manifest.mjs
 */

import { createHash, randomUUID } from "node:crypto";
import { createReadStream, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DOWNLOADS = join(ROOT, "public", "downloads");

// ── 1. SHA-256 checksums for installer binaries ────────────────────────────

async function sha256(file) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    createReadStream(file)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolvePromise(hash.digest("hex")));
  });
}

async function writeChecksums() {
  if (!existsSync(DOWNLOADS)) {
    console.log("no public/downloads directory — skipping checksums");
    return;
  }
  const files = readdirSync(DOWNLOADS).filter(
    (f) => /\.(exe|dmg|AppImage|deb|rpm|apk|zip)$/i.test(f) && f !== "SHA256SUMS.txt",
  );
  if (files.length === 0) {
    console.log("no installer binaries in public/downloads — skipping checksums");
    return;
  }
  const lines = [];
  for (const file of files) {
    const digest = await sha256(join(DOWNLOADS, file));
    lines.push(`${digest}  ${file}`);
    console.log(`sha256(${file}) = ${digest.slice(0, 16)}…`);
  }
  writeFileSync(join(DOWNLOADS, "SHA256SUMS.txt"), lines.join("\n") + "\n");
  console.log(`wrote public/downloads/SHA256SUMS.txt (${files.length} entries)`);
}

// ── 2. CycloneDX SBOM from the installed production dependencies ───────────

function collectWorkspacePackages() {
  const pkgs = [];
  const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  pkgs.push({ dir: ROOT, pkg: rootPkg });
  const packagesDir = join(ROOT, "packages");
  for (const name of readdirSync(packagesDir)) {
    const file = join(packagesDir, name, "package.json");
    if (existsSync(file))
      pkgs.push({ dir: join(packagesDir, name), pkg: JSON.parse(readFileSync(file, "utf8")) });
  }
  return pkgs;
}

/** Resolve the installed version of a dependency by reading its package.json. */
function installedVersion(fromDir, depName) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, "node_modules", ...depName.split("/"), "package.json");
    if (existsSync(candidate)) {
      try {
        return JSON.parse(readFileSync(candidate, "utf8")).version;
      } catch {
        return undefined;
      }
    }
    const parent = resolve(dir, "..");
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function writeSbom() {
  const components = new Map();
  for (const { dir, pkg } of collectWorkspacePackages()) {
    for (const [dep, range] of Object.entries(pkg.dependencies ?? {})) {
      if (String(range).startsWith("workspace:")) continue;
      const version = installedVersion(dir, dep) ?? String(range);
      components.set(`${dep}@${version}`, {
        type: "library",
        name: dep,
        version,
        purl: `pkg:npm/${dep.replace("@", "%40").replace("/", "%2F")}@${version}`,
      });
    }
  }

  const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const sbom = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: { type: "application", name: rootPkg.name, version: rootPkg.version },
    },
    components: [...components.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
  writeFileSync(join(ROOT, "sbom.json"), JSON.stringify(sbom, null, 2) + "\n");
  console.log(`wrote sbom.json (${components.size} production components)`);
}

await writeChecksums();
writeSbom();
