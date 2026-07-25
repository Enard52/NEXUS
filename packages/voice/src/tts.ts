/**
 * NEXUS AI — Text-to-Speech providers (FAZ 2)
 *
 * Provider-agnostic TTS interface with implementations:
 *  - OpenAI TTS API (primary, cloud-based, multiple voices)
 *  - Mock provider (deterministic, for tests)
 *
 * Language-aware: reads the user's language preference from Personalization
 * (FAZ 1) and selects appropriate voice/model. Connected to i18n (FAZ 13).
 */

export type TtsVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type TtsModel = "tts-1" | "tts-1-hd";
export type TtsFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

export interface TtsResult {
  /** Synthesized audio as raw bytes. */
  readonly audio: ArrayBuffer;
  /** Audio format of the output. */
  readonly format: TtsFormat;
  /** Voice used for synthesis. */
  readonly voice: TtsVoice;
  /** Duration of synthesis in ms. */
  readonly durationMs: number;
  /** Provider that performed the synthesis. */
  readonly provider: string;
}

export interface TtsOptions {
  /** Voice to use. Defaults based on tone preference. */
  readonly voice?: TtsVoice;
  /** Audio format. Defaults to "mp3". */
  readonly format?: TtsFormat;
  /** Playback speed (0.25–4.0). Defaults to 1.0. */
  readonly speed?: number;
  /** Model quality. "tts-1" is faster; "tts-1-hd" is higher quality. */
  readonly model?: TtsModel;
  /** BCP-47 language hint. OpenAI TTS auto-detects but hints improve accuracy. */
  readonly language?: string;
}

export interface TtsProvider {
  readonly name: string;
  /** Convert text to speech audio. */
  synthesize(text: string, options?: TtsOptions): Promise<TtsResult>;
  /** Whether this provider is available. */
  isAvailable(): boolean;
  /** List of supported voices. */
  voices(): readonly TtsVoice[];
}

// ── Voice selection by tone ────────────────────────────────────────────────────

import type { Tone } from "@nexus/memory";

/** Map user's tone preference to a fitting TTS voice. */
export function voiceForTone(tone: Tone): TtsVoice {
  switch (tone) {
    case "formal":
      return "onyx"; // deep, authoritative
    case "friendly":
      return "nova"; // warm, approachable
    case "playful":
      return "shimmer"; // bright, energetic
    case "concise":
      return "echo"; // clear, direct
    default:
      return "nova";
  }
}

// ── Mock Provider ──────────────────────────────────────────────────────────────

export interface MockTtsConfig {
  /** Simulated latency in ms. */
  readonly latencyMs?: number;
}

/**
 * Deterministic TTS provider for testing. Returns a small buffer containing
 * the text encoded as UTF-8 (not real audio, but verifiable in tests).
 */
export class MockTtsProvider implements TtsProvider {
  readonly name = "mock-tts";
  private readonly config: MockTtsConfig;

  constructor(config: MockTtsConfig = {}) {
    this.config = config;
  }

  isAvailable(): boolean {
    return true;
  }

  voices(): readonly TtsVoice[] {
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  }

  async synthesize(text: string, options?: TtsOptions): Promise<TtsResult> {
    const start = Date.now();

    if (this.config.latencyMs) {
      await new Promise((r) => setTimeout(r, this.config.latencyMs));
    }

    const encoder = new TextEncoder();
    const audio = encoder.encode(`[TTS:${options?.voice ?? "nova"}] ${text}`).buffer;

    return {
      audio,
      format: options?.format ?? "mp3",
      voice: options?.voice ?? "nova",
      durationMs: Date.now() - start,
      provider: this.name,
    };
  }
}

// ── OpenAI TTS Provider ────────────────────────────────────────────────────────

export interface OpenAiTtsConfig {
  readonly apiKey: string;
  /** Base URL. Defaults to OpenAI. */
  readonly baseUrl?: string;
  /** Default model. Defaults to "tts-1". */
  readonly defaultModel?: TtsModel;
  /** Default voice. Defaults to "nova". */
  readonly defaultVoice?: TtsVoice;
  /** Request timeout in ms. Defaults to 30000. */
  readonly timeoutMs?: number;
}

/**
 * OpenAI TTS provider. Supports multiple voices, HD quality mode, and
 * various output formats. Language is auto-detected from the input text.
 */
export class OpenAiTtsProvider implements TtsProvider {
  readonly name = "openai-tts";
  private readonly config: OpenAiTtsConfig;

  constructor(config: OpenAiTtsConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAiTtsProvider requires a non-empty apiKey");
    }
    this.config = config;
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  voices(): readonly TtsVoice[] {
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  }

  async synthesize(text: string, options?: TtsOptions): Promise<TtsResult> {
    const start = Date.now();
    const baseUrl = this.config.baseUrl ?? "https://api.openai.com/v1";
    const model = options?.model ?? this.config.defaultModel ?? "tts-1";
    const voice = options?.voice ?? this.config.defaultVoice ?? "nova";
    const format = options?.format ?? "mp3";
    const speed = options?.speed ?? 1.0;
    const timeoutMs = this.config.timeoutMs ?? 30_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format: format,
          speed,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI TTS failed: ${response.status} ${errorBody}`);
      }

      const audio = await response.arrayBuffer();

      return {
        audio,
        format,
        voice,
        durationMs: Date.now() - start,
        provider: this.name,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ── Provider Selection ─────────────────────────────────────────────────────────

export interface SelectTtsInput {
  readonly provider: "openai" | "mock";
  readonly apiKey?: string;
  readonly baseUrl?: string;
}

/**
 * Factory for TTS providers. Falls back to mock when credentials are unavailable.
 */
export function selectTtsProvider(input: SelectTtsInput): TtsProvider {
  if (input.provider === "openai" && input.apiKey) {
    return new OpenAiTtsProvider({ apiKey: input.apiKey, baseUrl: input.baseUrl });
  }
  return new MockTtsProvider();
}
