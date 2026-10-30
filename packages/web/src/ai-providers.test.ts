import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");
const registry = JSON.parse(readFileSync(resolve(root, "docs/ai-providers.json"), "utf8"));
const worker = readFileSync(resolve(root, "cloudflare-worker/nexus-ai/src/index.js"), "utf8");
const docs = readFileSync(resolve(root, "docs/AI-PROVIDERS.md"), "utf8");

const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Common API-key shapes; the registry must only ever link to where keys are created.
const KEY_LIKE = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /gsk_[A-Za-z0-9]{16,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /Bearer\s+\S{12,}/,
  /[A-Za-z0-9_-]{40,}/,
];

describe("docs/ai-providers.json", () => {
  it("has a version, verification date and providers", () => {
    expect(registry.schemaVersion).toBe(1);
    expect(registry.verifiedOn).toMatch(DATE);
    expect(registry.providers.length).toBeGreaterThan(0);
  });

  it("has unique ids and all required fields", () => {
    const ids = registry.providers.map((p: { id: string }) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of registry.providers) {
      for (const k of [
        "id",
        "name",
        "baseUrl",
        "chatCompletionsUrl",
        "getKeyUrl",
        "docsUrl",
        "freeTier",
        "defaultModel",
      ]) {
        expect(typeof p[k], `${p.id}.${k}`).toBe("string");
        expect(p[k].length, `${p.id}.${k}`).toBeGreaterThan(0);
      }
      expect(p.verifiedOn).toMatch(DATE);
      expect(Array.isArray(p.caveats) && p.caveats.length > 0, `${p.id} caveats`).toBe(true);
    }
  });

  it("uses https URLs only", () => {
    for (const p of registry.providers) {
      for (const k of ["baseUrl", "chatCompletionsUrl", "getKeyUrl", "docsUrl"]) {
        const u = new URL(p[k]);
        expect(u.protocol, `${p.id}.${k}`).toBe("https:");
        expect(u.search, `${p.id}.${k} has no query`).toBe("");
      }
      expect(p.chatCompletionsUrl.startsWith(p.baseUrl.replace(/\/$/, "")), p.id).toBe(true);
      expect(p.chatCompletionsUrl.endsWith("/chat/completions"), p.id).toBe(true);
    }
  });

  it("contains no key-like strings", () => {
    const text = JSON.stringify(registry) + docs;
    for (const re of KEY_LIKE) {
      // long URLs are legitimate; strip them before scanning for key shapes
      expect(text.replace(/https?:\/\/\S+/g, "").match(re), String(re)).toBeNull();
    }
  });

  it("matches the worker fallback chain for providers it lists", () => {
    for (const p of registry.providers.filter((x: { workerEnv?: string }) => x.workerEnv)) {
      expect(worker).toContain(`env: "${p.workerEnv}"`);
      expect(worker).toContain(p.chatCompletionsUrl);
      expect(worker).toContain(`model: "${p.defaultModel}"`);
    }
  });

  it("is referenced in the human-readable doc", () => {
    for (const p of registry.providers) expect(docs).toContain(p.baseUrl);
  });
});
