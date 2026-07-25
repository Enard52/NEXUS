/**
 * NEXUS AI — Mobile Voice Bridge (FAZ 9)
 *
 * Connects the FAZ 2 VoiceEngine (wake word → STT → NLU → TTS) to the
 * mobile platform's audio hardware via native microphone/speaker access.
 *
 * Responsibilities:
 * - Audio session management (activate/deactivate native audio)
 * - Microphone stream capture → feed to STT
 * - TTS audio output → native speaker
 * - Wake word detection state on mobile
 * - Interrupt handling (phone calls, other audio)
 */

import type { MobileBridge, MobilePlatform } from "./bridge.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Audio session category (maps to AVAudioSession on iOS, AudioManager on Android). */
export type AudioSessionCategory =
  | "playAndRecord" // Voice interaction (mic + speaker)
  | "playback" // TTS only
  | "ambient"; // Background/low-priority

/** Audio session state. */
export type AudioSessionState = "inactive" | "active" | "interrupted";

/** Microphone input level (0–1 normalized). */
export interface AudioLevel {
  peak: number;
  average: number;
  timestamp: number;
}

/** Voice bridge configuration. */
export interface VoiceBridgeConfig {
  /** Enable wake word detection on mobile. */
  wakeWordEnabled: boolean;
  /** Audio sample rate (default 16000 Hz for STT). */
  sampleRate: number;
  /** Use speaker for TTS (vs earpiece). */
  useSpeaker: boolean;
  /** Automatically pause music apps during voice interaction. */
  duckOtherAudio: boolean;
  /** Keep audio session active for continuous listening. */
  continuousListening: boolean;
}

/** Voice interaction session — one complete turn of listen → process → respond. */
export interface VoiceSession {
  id: string;
  startedAt: number;
  endedAt: number | null;
  /** Raw transcript from STT. */
  transcript: string | null;
  /** NEXUS response text (to be spoken by TTS). */
  response: string | null;
  /** Whether the session was triggered by wake word vs manual tap. */
  trigger: "wake-word" | "manual" | "notification";
  state: VoiceSessionState;
}

export type VoiceSessionState =
  | "listening"
  | "processing"
  | "speaking"
  | "complete"
  | "cancelled"
  | "error";

/** Event emitted by the voice bridge. */
export type VoiceBridgeEvent =
  | { type: "session-start"; session: VoiceSession }
  | { type: "session-end"; session: VoiceSession }
  | { type: "audio-level"; level: AudioLevel }
  | { type: "wake-word-detected" }
  | { type: "interrupt"; reason: "phone-call" | "other-audio" | "system" }
  | { type: "resume" }
  | { type: "error"; message: string };

export type VoiceBridgeEventHandler = (event: VoiceBridgeEvent) => void;

// ─── Default Config ──────────────────────────────────────────────────────────

export const DEFAULT_VOICE_CONFIG: VoiceBridgeConfig = {
  wakeWordEnabled: true,
  sampleRate: 16000,
  useSpeaker: true,
  duckOtherAudio: true,
  continuousListening: false,
};

// ─── Mobile Voice Bridge ─────────────────────────────────────────────────────

/**
 * MobileVoiceBridge — orchestrates voice interactions on mobile.
 *
 * Manages the audio session lifecycle, forwards microphone data to the
 * VoiceEngine (STT), and plays back TTS responses through the speaker.
 */
export class MobileVoiceBridge {
  private bridge: MobileBridge;
  private config: VoiceBridgeConfig;
  private audioState: AudioSessionState = "inactive";
  private currentSession: VoiceSession | null = null;
  private sessions: VoiceSession[] = [];
  private eventHandlers: VoiceBridgeEventHandler[] = [];
  private sessionCounter = 0;

  constructor(bridge: MobileBridge, config: Partial<VoiceBridgeConfig> = {}) {
    this.bridge = bridge;
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  /** Current audio session state. */
  get state(): AudioSessionState {
    return this.audioState;
  }

  /** Active voice session, if any. */
  get activeSession(): VoiceSession | null {
    return this.currentSession;
  }

  /** All completed sessions. */
  get history(): readonly VoiceSession[] {
    return this.sessions;
  }

  /** Current configuration. */
  get currentConfig(): VoiceBridgeConfig {
    return { ...this.config };
  }

  /** The platform this bridge runs on. */
  get platform(): MobilePlatform {
    return this.bridge.platform;
  }

  /** Update configuration. */
  updateConfig(partial: Partial<VoiceBridgeConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  /** Subscribe to voice bridge events. */
  on(handler: VoiceBridgeEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Activate the audio session (claim audio hardware).
   * Must be called before starting voice interaction.
   */
  async activateAudioSession(category: AudioSessionCategory = "playAndRecord"): Promise<void> {
    // In production: configure AVAudioSession / AudioManager
    void category;
    this.audioState = "active";
  }

  /** Deactivate the audio session (release audio hardware). */
  async deactivateAudioSession(): Promise<void> {
    this.audioState = "inactive";
  }

  /**
   * Start a new voice interaction session.
   * Activates audio, begins microphone capture, and listens for speech.
   */
  async startListening(trigger: VoiceSession["trigger"] = "manual"): Promise<VoiceSession> {
    if (this.audioState !== "active") {
      await this.activateAudioSession();
    }

    // Haptic feedback on session start
    await this.bridge.hapticFeedback("light");

    const session: VoiceSession = {
      id: `vs_${++this.sessionCounter}_${Date.now()}`,
      startedAt: Date.now(),
      endedAt: null,
      transcript: null,
      response: null,
      trigger,
      state: "listening",
    };

    this.currentSession = session;
    this.emit({ type: "session-start", session });

    return session;
  }

  /**
   * Process the captured audio — called when silence is detected or user
   * manually stops. Transitions session to "processing" state.
   */
  async processAudio(transcript: string): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.transcript = transcript;
    this.currentSession.state = "processing";
  }

  /**
   * Provide the TTS response — transitions session to "speaking" state.
   */
  async speak(response: string): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.response = response;
    this.currentSession.state = "speaking";

    // Haptic on response start
    await this.bridge.hapticFeedback("success");
  }

  /**
   * Complete the current session. Transitions to "complete" and archives.
   */
  async endSession(): Promise<VoiceSession | null> {
    if (!this.currentSession) return null;

    this.currentSession.state = "complete";
    this.currentSession.endedAt = Date.now();

    const completed = this.currentSession;
    this.sessions.push(completed);
    this.currentSession = null;

    this.emit({ type: "session-end", session: completed });

    if (!this.config.continuousListening) {
      await this.deactivateAudioSession();
    }

    return completed;
  }

  /**
   * Cancel the current session (user dismissed, error, or interrupt).
   */
  async cancelSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.state = "cancelled";
    this.currentSession.endedAt = Date.now();
    this.sessions.push(this.currentSession);
    this.currentSession = null;

    await this.deactivateAudioSession();
  }

  /**
   * Handle an audio interrupt (incoming phone call, etc.).
   */
  handleInterrupt(reason: Extract<VoiceBridgeEvent, { type: "interrupt" }>["reason"]): void {
    this.audioState = "interrupted";
    this.emit({ type: "interrupt", reason });

    if (this.currentSession) {
      this.currentSession.state = "cancelled";
      this.currentSession.endedAt = Date.now();
      this.sessions.push(this.currentSession);
      this.currentSession = null;
    }
  }

  /**
   * Resume after an interrupt.
   */
  handleResume(): void {
    this.audioState = "active";
    this.emit({ type: "resume" });
  }

  /**
   * Simulate wake word detection (native wake-word engine detected "Hey NEXUS").
   */
  async onWakeWordDetected(): Promise<VoiceSession> {
    this.emit({ type: "wake-word-detected" });
    return this.startListening("wake-word");
  }

  private emit(event: VoiceBridgeEvent): void {
    this.eventHandlers.forEach((h) => h(event));
  }
}
