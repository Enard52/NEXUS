import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const WORKER_INDEX = path.join(ROOT, "cloudflare-worker", "nexus-ai", "src", "index.js");
const ASSISTANT_JS = path.join(ROOT, "src", "app", "nexus-assistant.js");
const VOICE_JS = path.join(ROOT, "src", "app", "nexus-voice.js");
const PUSH_JS = path.join(ROOT, "src", "app", "push.js");
const CLOUD_SYNC_JS = path.join(ROOT, "src", "app", "cloud-sync.js");

describe("voice input & push notifications i18n (#193)", () => {
  describe("Cloudflare Worker Whisper language allowlist", () => {
    it("defines WHISPER_LANGS and normalizeWhisperLang supporting multi-language Whisper input", () => {
      const workerCode = fs.readFileSync(WORKER_INDEX, "utf8");
      expect(workerCode).toContain("WHISPER_LANGS");
      expect(workerCode).toContain("normalizeWhisperLang");

      // Extract normalizeWhisperLang logic
      const fnMatch = workerCode.match(/function normalizeWhisperLang[\s\S]*?\n\}/);
      expect(fnMatch).not.toBeNull();

      const sandbox = { WHISPER_LANGS: new Set() };
      const setMatch = workerCode.match(/const WHISPER_LANGS = new Set\(\[([\s\S]*?)\]\);/);
      expect(setMatch).not.toBeNull();

      const langs = eval(`[${setMatch![1]}]`) as string[];
      langs.forEach((l) => sandbox.WHISPER_LANGS.add(l));

      const normalize = new Function(
        "WHISPER_LANGS",
        `${fnMatch![0]}; return normalizeWhisperLang;`,
      )(sandbox.WHISPER_LANGS) as (input: unknown) => string;

      expect(normalize("tr")).toBe("tr");
      expect(normalize("en")).toBe("en");
      expect(normalize("de")).toBe("de");
      expect(normalize("es")).toBe("es");
      expect(normalize("fr")).toBe("fr");
      expect(normalize("pt-BR")).toBe("pt");
      expect(normalize("zh-CN")).toBe("zh");
      expect(normalize("ar-EG")).toBe("ar");
      expect(normalize("invalid-lang-code")).toBe("en");
      expect(normalize(null)).toBe("en");
    });
  });

  describe("nexus-voice and nexus-assistant transcription language handling", () => {
    it("nexus-voice uses nexusLocale for browser speech and nexusUiLang for Whisper transcription", () => {
      const voiceCode = fs.readFileSync(VOICE_JS, "utf8");
      expect(voiceCode).toContain("window.nexusLocale");
      expect(voiceCode).toContain("window.nexusUiLang");
    });

    it("nexus-assistant transcribe passes custom language code to Worker STT endpoint", () => {
      const assistantCode = fs.readFileSync(ASSISTANT_JS, "utf8");
      expect(assistantCode).toMatch(/function transcribe\s*\(blob,\s*lang\)/);
      expect(assistantCode).not.toContain('var lng = lang === "tr" ? "tr" : "en";');
    });
  });

  describe("push notification language subscription and translation", () => {
    it("push.js passes UI language during token registration and event sending", () => {
      const pushCode = fs.readFileSync(PUSH_JS, "utf8");
      expect(pushCode).toContain("window.nexusUiLang");
      expect(pushCode).toContain("pushRegisterToken(token, platformName(), lang)");
    });

    it("cloud-sync.js stores lang in nexus_push_tokens payload", () => {
      const syncCode = fs.readFileSync(CLOUD_SYNC_JS, "utf8");
      expect(syncCode).toContain("pushRegisterToken(token, platform, lang)");
      expect(syncCode).toContain("lang: String(chosenLang)");
    });
  });
});
