// @ts-check
/**
 * NEXUS AI — Module scaffolder (FAZ 0)
 *
 * Generates the domain module placeholder packages listed in ROADMAP.md
 * (usage rule #3). Each is a real pnpm workspace package so later phases can
 * `import` it without rewiring. Idempotent: existing files are left untouched.
 *
 * Run: `pnpm scaffold:modules`
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packagesDir = resolve(here, "..", "packages");

/** Domain modules from ROADMAP.md. `core`, `config` and `logger` are hand-built. */
const MODULES = [
  { name: "ai", desc: "AI Adapter & provider abstraction (FAZ 1)." },
  { name: "voice", desc: "Wake-word, STT and TTS engine (FAZ 2)." },
  { name: "memory", desc: "Short-term & user memory schema (FAZ 1, 6)." },
  { name: "agents", desc: "Multi-agent system & messaging (FAZ 7)." },
  { name: "devices", desc: "Universal Capability schema & Device Manager (FAZ 4)." },
  { name: "connectors", desc: "Brand/protocol connectors & store (FAZ 4, 16)." },
  { name: "skills", desc: "Skill system & experience memory (FAZ 5)." },
  { name: "security", desc: "Security Engine risk levels & middleware (FAZ 1, 11)." },
  { name: "database", desc: "Persistence layer & migrations." },
  { name: "interface", desc: "App shells & screens (FAZ 10)." },
  { name: "platform", desc: "Platform Abstraction Layer (FAZ 3, 8)." },
  { name: "i18n", desc: "Internationalization & localization (FAZ 13)." },
  { name: "design-system", desc: "Brand identity & design tokens (FAZ 10)." },
  { name: "billing", desc: "Subscriptions, payments & metrics (FAZ 15)." },
  { name: "accounts", desc: "Accounts & authentication (FAZ 14)." },
  { name: "infra", desc: "DevOps, deployment & distribution backend (FAZ 18)." },
  { name: "legal", desc: "Legal documents & compliance flows (FAZ 19)." },
  { name: "support", desc: "Onboarding, support & analytics (FAZ 20)." },
  { name: "plugins", desc: "Plugin runtime for connector store (FAZ 16)." },
];

/** @param {string} p @param {string} content */
function writeIfAbsent(p, content) {
  if (existsSync(p)) return false;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content.endsWith("\n") ? content : content + "\n", "utf8");
  return true;
}

let created = 0;
for (const { name, desc } of MODULES) {
  const dir = resolve(packagesDir, name);
  const pkgName = `@nexus/${name}`;
  const camel = name.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());

  const pkgJson = {
    name: pkgName,
    version: "0.0.0",
    private: true,
    type: "module",
    description: `NEXUS AI — ${desc}`,
    main: "./src/index.ts",
    types: "./src/index.ts",
    exports: { ".": "./src/index.ts" },
    scripts: { test: "vitest run" },
  };

  const indexTs = `/**
 * NEXUS AI — ${pkgName}
 * ${desc}
 *
 * FAZ 0 placeholder: the module is wired into the monorepo but not yet
 * implemented. Real behavior is added in the phase noted above.
 */

export const moduleName = "${name}" as const;

/** Flipped to true once this module ships real behavior. */
export const implemented = false;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function ${camel}Info(): ModuleInfo {
  return { name: moduleName, implemented };
}
`;

  const testTs = `import { describe, expect, it } from "vitest";
import { ${camel}Info, moduleName } from "./index.js";

describe("${pkgName}", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("${name}");
    expect(${camel}Info()).toEqual({ name: "${name}", implemented: false });
  });
});
`;

  const tsconfig = `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
`;

  let touched = false;
  touched =
    writeIfAbsent(resolve(dir, "package.json"), JSON.stringify(pkgJson, null, 2)) || touched;
  touched = writeIfAbsent(resolve(dir, "tsconfig.json"), tsconfig) || touched;
  touched = writeIfAbsent(resolve(dir, "src", "index.ts"), indexTs) || touched;
  touched = writeIfAbsent(resolve(dir, "src", "index.test.ts"), testTs) || touched;
  if (touched) {
    created += 1;
    console.log(`scaffolded ${pkgName}`);
  }
}

console.log(
  created ? `\nDone. ${created} module(s) scaffolded.` : "\nAll modules already present.",
);
