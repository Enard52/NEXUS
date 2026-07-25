/**
 * NEXUS AI — VoiceEngine orchestrator (FAZ 2)
 *
 * The central voice interaction engine that composes wake word detection, STT,
 * TTS, and speaker identification into a unified pipeline:
 *
 *   Audio Input → STT → Wake Word Detection → Speaker ID → Command Output
 *   Text Response → TTS → Audio Output
 *
 * Configurable for different deployment scenarios:
 *  - Full cloud: Whisper STT + OpenAI TTS (best quality)
 *  - Hybrid: Local wake word + cloud STT/TTS (reduced latency for wake)
 *  - Full mock: All components mocked (testing/dev)
 */

import { WakeWordDetector, type WakeWordConfig, type WakeWordResult } from "./wake-word.js";
import {
  type SttProvider,
  type SttResult,
  type SttOptions,
  MockSttProvider,
  selectSttProvider,
} from "./stt.js";
import {
  type TtsProvider,
  type TtsOptions,
  type TtsVoice,
  MockTtsProvider,
  selectTtsProvider,
  voiceForTone,
} from "./tts.js";
import {
  SpeakerStore,
  MockVoiceEmbedder,
  type VoiceEmbedder,
  type IdentificationResult,
  type SpeakerProfile,
  type SpeakerStoreConfig,
} from "./voice-profile.js";
import type { Tone } from "@nexus/memory";

// ── Configuration ──────────────────────────────────────────────────────────────

export interface VoiceEngineConfig {
  /** API key for cloud providers (OpenAI Whisper + TTS). */
  readonly apiKey?: string;
  /** STT provider selection. Defaults to "mock". */
  readonly sttProvider?: "whisper" | "mock";
  /** TTS provider selection. Defaults to "mock". */
  readonly ttsProvider?: "openai" | "mock";
  /** Initial wake phrase (from Personalization.assistantName). */
  readonly wakePhrase?: string;
  /** Wake word detection config overrides. */
  readonly wakeConfig?: Partial<WakeWordConfig>;
  /** Speaker identification config overrides. */
  readonly speakerConfig?: Partial<SpeakerStoreConfig>;
  /** Voice embedder implementation. Defaults to MockVoiceEmbedder. */
  readonly embedder?: VoiceEmbedder;
  /** API base URL override (for proxies/enterprise). */
  readonly baseUrl?: string;
}

// ── Voice Interaction Result ───────────────────────────────────────────────────

export interface VoiceInteractionResult {
  /** Whether the wake word was detected in the audio. */
  readonly wakeDetected: boolean;
  /** The transcribed text from the audio. */
  readonly transcript: string;
  /** The command portion after the wake word (if detected). */
  readonly command?: string;
  /** Speaker identification result. */
  readonly speaker: IdentificationResult;
  /** STT performance metrics. */
  readonly sttResult: SttResult;
  /** Wake word detection details. */
  readonly wakeResult: WakeWordResult;
  /** Total processing time in ms. */
  readonly totalMs: number;
}

export interface SpeakResult {
  /** Synthesized audio buffer. */
  readonly audio: ArrayBuffer;
  /** Audio format. */
  readonly format: string;
  /** Voice used. */
  readonly voice: TtsVoice;
  /** Processing time in ms. */
  readonly durationMs: number;
}

// ── VoiceEngine ────────────────────────────────────────────────────────────────

/**
 * Main voice engine that orchestrates the full voice interaction pipeline.
 * Thread-safe for concurrent listen/speak calls.
 */
export class VoiceEngine {
  private readonly stt: SttProvider;
  private readonly tts: TtsProvider;
  private readonly wakeDetector: WakeWordDetector;
  private readonly speakers: SpeakerStore;
  private language: string = "en";
  private tone: Tone = "friendly";

  constructor(config: VoiceEngineConfig = {}) {
    // Initialize STT
    this.stt = config.sttProvider
      ? selectSttProvider({
          provider: config.sttProvider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        })
      : new MockSttProvider();

    // Initialize TTS
    this.tts = config.ttsProvider
      ? selectTtsProvider({
          provider: config.ttsProvider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        })
      : new MockTtsProvider();

    // Initialize wake word detector
    this.wakeDetector = new WakeWordDetector(
      config.wakePhrase ?? "NEXUS",
      config.wakeConfig,
    );

    // Initialize speaker identification
    const embedder = config.embedder ?? new MockVoiceEmbedder();
    this.speakers = new SpeakerStore(embedder, config.speakerConfig);
  }

  // ── Configuration Updates ──────────────────────────────────────────────────

  /** Update the wake phrase (called when user renames the assistant). */
  setWakePhrase(phrase: string): void {
    this.wakeDetector.setWakePhrase(phrase);
  }

  /** Update language preference (affects STT language hint). */
  setLanguage(language: string): void {
    this.language = language;
  }

  /** Update tone preference (affects TTS voice selection). */
  setTone(tone: Tone): void {
    this.tone = tone;
  }

  /** Get the current wake phrase. */
  getWakePhrase(): string {
    return this.wakeDetector.getWakePhrase();
  }

  // ── Core Pipeline ──────────────────────────────────────────────────────────

  /**
   * Process incoming audio through the full voice pipeline:
   * Audio → STT → Wake Word Check → Speaker ID → Result
   */
  async listen(audio: ArrayBuffer, options?: SttOptions): Promise<VoiceInteractionResult> {
    const start = Date.now();

    // Step 1: Transcribe audio to text
    const sttOpts: SttOptions = {
      languageHint: options?.languageHint ?? this.language,
      format: options?.format,
      ...options,
    };
    const sttResult = await this.stt.transcribe(audio, sttOpts);

    // Step 2: Check for wake word in transcript
    const wakeResult = this.wakeDetector.detect(sttResult.text);

    // Step 3: Identify the speaker
    const speaker = await this.speakers.identify(audio);

    return {
      wakeDetected: wakeResult.detected,
      transcript: sttResult.text,
      command: wakeResult.command,
      speaker,
      sttResult,
      wakeResult,
      totalMs: Date.now() - start,
    };
  }

  /**
   * Convert text to speech audio using the configured TTS provider.
   * Automatically selects voice based on user's tone preference.
   */
  async speak(text: string, options?: TtsOptions): Promise<SpeakResult> {
    const voice = options?.voice ?? voiceForTone(this.tone);
    const ttsResult = await this.tts.synthesize(text, {
      voice,
      language: this.language,
      ...options,
    });

    return {
      audio: ttsResult.audio,
      format: ttsResult.format,
      voice: ttsResult.voice,
      durationMs: ttsResult.durationMs,
    };
  }

  // ── Speaker Enrollment ─────────────────────────────────────────────────────

  /**
   * Enroll a voice sample for a family member. Call multiple times with
   * different samples for the same user to improve accuracy.
   */
  async enrollSpeaker(
    userId: string,
    displayName: string,
    audio: ArrayBuffer,
  ): Promise<SpeakerProfile> {
    return this.speakers.enroll(userId, displayName, audio);
  }

  /** Remove a speaker's voice profile. */
  unenrollSpeaker(userId: string): boolean {
    return this.speakers.unenroll(userId);
  }

  /** Check if a speaker has enough enrollment samples. */
  isSpeakerEnrolled(userId: string): boolean {
    return this.speakers.isEnrolled(userId);
  }

  /** List all enrolled speaker profiles. */
  listSpeakers(): readonly SpeakerProfile[] {
    return this.speakers.listProfiles();
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  /** Whether the STT provider is available. */
  isSttAvailable(): boolean {
    return this.stt.isAvailable();
  }

  /** Whether the TTS provider is available. */
  isTtsAvailable(): boolean {
    return this.tts.isAvailable();
  }

  /** Whether the full voice pipeline is operational. */
  isEnabled(): boolean {
    return this.stt.isAvailable() && this.tts.isAvailable();
  }

  /** Get available TTS voices. */
  availableVoices(): readonly TtsVoice[] {
    return this.tts.voices();
  }
}
