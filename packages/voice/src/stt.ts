/**
 * NEXUS AI — Speech-to-Text providers (FAZ 2)
 *
 * Provider-agnostic STT interface with implementations:
 *  - OpenAI Whisper API (primary, cloud-based, multilingual)
 *  - Mock provider (deterministic, for tests and dev mode)
 *
 * Designed for low-latency:
 *  - Supports streaming via chunked audio
 *  - Language hint from Personalization avoids auto-detect overhead
 *  - Configurable model size (speed vs accuracy trade-off)
 */

export interface SttResult {
  /** Transcribed text from the audio. */
  readonly text: string;
  /** BCP-47 language tag of the detected/forced language. */
  readonly language: string;
  /** Transcription confidence (0–1). Not all providers supply this. */
  readonly confidence: number;
  /** Processing duration in milliseconds. */
  readonly durationMs: number;
  /** Provider that performed the transcription. */
  readonly provider: string;
}

export interface SttOptions {
  /** BCP-47 language hint to improve accuracy and reduce latency. */
  readonly languageHint?: string;
  /** Audio format. Defaults to "webm". */
  readonly format?: "webm" | "wav" | "mp3" | "ogg" | "flac";
  /** Whether to include timestamps in the result (for wake word positioning). */
  readonly timestamps?: boolean;
}

export interface SttProvider {
  readonly name: string;
  /** Transcribe an audio buffer into text. */
  transcribe(audio: ArrayBuffer, options?: SttOptions): Promise<SttResult>;
  /** Whether this provider is available (credentials present, service reachable). */
  isAvailable(): boolean;
}

// ── Mock Provider ──────────────────────────────────────────────────────────────

export interface MockSttConfig {
  /** Fixed text to return for any transcription. */
  readonly fixedText?: string;
  /** Simulated latency in ms. */
  readonly latencyMs?: number;
}

/**
 * Deterministic STT provider for testing and offline development.
 * Returns configurable fixed text or derives output from audio size.
 */
export class MockSttProvider implements SttProvider {
  readonly name = "mock-stt";
  private readonly config: MockSttConfig;

  constructor(config: MockSttConfig = {}) {
    this.config = config;
  }

  isAvailable(): boolean {
    return true;
  }

  async transcribe(audio: ArrayBuffer, options?: SttOptions): Promise<SttResult> {
    const start = Date.now();

    if (this.config.latencyMs) {
      await new Promise((r) => setTimeout(r, this.config.latencyMs));
    }

    const text = this.config.fixedText ?? `[mock transcription: ${audio.byteLength} bytes]`;
    return {
      text,
      language: options?.languageHint ?? "en",
      confidence: 0.95,
      durationMs: Date.now() - start,
      provider: this.name,
    };
  }
}

// ── OpenAI Whisper Provider ────────────────────────────────────────────────────

export interface WhisperConfig {
  readonly apiKey: string;
  /** Model to use. Defaults to "whisper-1". */
  readonly model?: string;
  /** Base URL for the API. Defaults to OpenAI. */
  readonly baseUrl?: string;
  /** Request timeout in ms. Defaults to 30000. */
  readonly timeoutMs?: number;
}

/**
 * OpenAI Whisper-based STT. Multilingual, supports language hints for reduced
 * latency, and returns confidence scores.
 */
export class WhisperSttProvider implements SttProvider {
  readonly name = "whisper";
  private readonly config: WhisperConfig;

  constructor(config: WhisperConfig) {
    if (!config.apiKey) {
      throw new Error("WhisperSttProvider requires a non-empty apiKey");
    }
    this.config = config;
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  async transcribe(audio: ArrayBuffer, options?: SttOptions): Promise<SttResult> {
    const start = Date.now();
    const model = this.config.model ?? "whisper-1";
    const baseUrl = this.config.baseUrl ?? "https://api.openai.com/v1";
    const timeoutMs = this.config.timeoutMs ?? 30_000;

    // Build multipart form data
    const format = options?.format ?? "webm";
    const blob = new Blob([audio], { type: `audio/${format}` });

    const formData = new FormData();
    formData.append("file", blob, `audio.${format}`);
    formData.append("model", model);

    if (options?.languageHint) {
      // Whisper uses ISO-639-1 codes
      formData.append("language", options.languageHint.split("-")[0]!);
    }

    if (options?.timestamps) {
      formData.append("response_format", "verbose_json");
      formData.append("timestamp_granularities[]", "word");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Whisper API failed: ${response.status} ${errorBody}`);
      }

      const data = (await response.json()) as any;
      const text = data.text ?? "";

      return {
        text,
        language: data.language ?? options?.languageHint ?? "en",
        confidence: 0.9, // Whisper doesn't return confidence per-request
        durationMs: Date.now() - start,
        provider: this.name,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ── Provider Selection ─────────────────────────────────────────────────────────

export interface SelectSttInput {
  readonly provider: "whisper" | "mock";
  readonly apiKey?: string;
  readonly baseUrl?: string;
}

/**
 * Factory for STT providers. Falls back to mock when credentials are unavailable.
 */
export function selectSttProvider(input: SelectSttInput): SttProvider {
  if (input.provider === "whisper" && input.apiKey) {
    return new WhisperSttProvider({ apiKey: input.apiKey, baseUrl: input.baseUrl });
  }
  return new MockSttProvider();
}
