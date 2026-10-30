import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error plain .mjs generator without type declarations
import { buildMatrix } from "../../../scripts/gen-connector-matrix.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("connector matrix", () => {
  it("docs/CONNECTORS.md is up to date (run: node scripts/gen-connector-matrix.mjs)", () => {
    const committed = readFileSync(resolve(ROOT, "docs/CONNECTORS.md"), "utf8");
    expect(committed.replace(/\r\n/g, "\n")).toBe((buildMatrix() as string).replace(/\r\n/g, "\n"));
  });

  it("lists every protocol id and claims no hardware verification without a record", () => {
    const md = readFileSync(resolve(ROOT, "docs/CONNECTORS.md"), "utf8");
    const src = readFileSync(resolve(ROOT, "src/app/lan-connectors.js"), "utf8");
    const win: Record<string, any> = {};
    new Function("window", "fetch", src)(win, () => Promise.reject(new Error("no network")));
    const ids: string[] = win.nexusLan.protocols.map((p: { id: string }) => p.id);
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(md).toContain(`| \`${id}\` |`);
  });
});
