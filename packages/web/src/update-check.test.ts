import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/update-check.js"), "utf8");

// Tarayıcı olmayan ortamda (document yok) yalnızca saf yardımcılar dışa açılır.
const win: Record<string, any> = {};
new Function("window", SOURCE)(win);
const { parse, compare, newerVersion } = win.nexusUpdateCheck;

describe("update check", () => {
  it("parses tags with and without the v prefix", () => {
    expect(parse("v1.0.35")).toEqual([1, 0, 35]);
    expect(parse("1.2.3")).toEqual([1, 2, 3]);
    expect(parse("nightly")).toBeNull();
    expect(parse(undefined)).toBeNull();
  });

  it("compares numerically, not as strings", () => {
    expect(compare("1.0.10", "1.0.9")).toBe(1);
    expect(compare("1.0.35", "1.0.35")).toBe(0);
    expect(compare("1.0.2", "1.1.0")).toBe(-1);
    expect(compare("bogus", "1.0.0")).toBeNull();
  });

  it("reports a version only when the latest tag is strictly newer", () => {
    expect(newerVersion("1.0.35", "v1.0.36")).toBe("1.0.36");
    expect(newerVersion("1.0.35", "v1.0.35")).toBeNull();
    expect(newerVersion("1.0.36", "v1.0.35")).toBeNull();
    expect(newerVersion("1.0.35", "garbage")).toBeNull();
  });

  it("app-version.js carries the version constant the bump script rewrites", () => {
    const v = readFileSync(resolve(REPO_ROOT, "src/app/app-version.js"), "utf8");
    expect(v).toMatch(/NEXUS_APP_VERSION = "\d+\.\d+\.\d+"/);
  });
});
