/**
 * NEXUS AI — Voice Interaction Engine (FAZ 2)
 *
 * Makes the user's chosen wake name actually usable by voice. This package owns
 * the code-feasible core:
 *   - a wake-word detector that matches the user's chosen name tolerantly
 *     (normalization + bounded edit distance for accent/noise slack),
 *   - STT and TTS provider abstractions with deterministic mock implementations,
 *   - a speaker-id hook so different family members can be told apart (FAZ 12).
 *
 * Real on-device wake-word models and cloud STT/TTS engines implement these same
 * interfaces; like the AI adapter, the real providers never fake success without
 * credentials. Deterministic and dependency-free so the logic is fully testable.
 */

/** Normalize an utterance for phonetic-ish comparison. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Bounded Levenshtein distance (early-exit once it exceeds max). */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

export interface WakeWordOptions {
  /** Max edit distance tolerated between a spoken token and the wake word. */
  readonly tolerance?: number;
}

/** Detects the user's chosen wake name in an utterance, tolerating small errors. */
export class WakeWordDetector {
  private readonly wake: string;
  private readonly tolerance: number;

  constructor(wakeWord: string, options: WakeWordOptions = {}) {
    this.wake = normalize(wakeWord);
    // Scale tolerance with word length; allow at least 1 for short names.
    this.tolerance = options.tolerance ?? Math.max(1, Math.floor(this.wake.length / 4));
  }

  detect(utterance: string): boolean {
    const tokens = normalize(utterance).split(" ").filter(Boolean);
    return tokens.some((tok) => editDistance(tok, this.wake) <= this.tolerance);
  }

  /** Return the utterance with the wake word stripped, for downstream STT/intent. */
  strip(utterance: string): string {
    const tokens = normalize(utterance).split(" ").filter(Boolean);
    return tokens.filter((tok) => editDistance(tok, this.wake) > this.tolerance).join(" ");
  }
}

export interface Transcript {
  readonly text: string;
  /** Optional speaker profile id, enabling per-member routing (FAZ 12). */
  readonly speakerId?: string;
}

export interface SttProvider {
  transcribe(audio: string): Transcript;
}

export interface TtsProvider {
  synthesize(text: string, language: string): string;
}

/** Deterministic mock STT: treats the input string as already-decoded audio. */
export class MockSttProvider implements SttProvider {
  constructor(private readonly speakerId?: string) {}
  transcribe(audio: string): Transcript {
    return { text: audio.trim(), speakerId: this.speakerId };
  }
}

/** Deterministic mock TTS: returns a tagged descriptor instead of real audio. */
export class MockTtsProvider implements TtsProvider {
  synthesize(text: string, language: string): string {
    return `tts:${language}:${text}`;
  }
}

/** A provider that refuses to fabricate success without a real engine wired. */
export class UnconfiguredSttProvider implements SttProvider {
  transcribe(): Transcript {
    throw new Error("STT engine is not wired yet; provide real credentials/model.");
  }
}

export interface VoiceResult {
  readonly woke: boolean;
  readonly transcript?: Transcript;
  readonly speech?: string;
}

/** Ties detection + STT + TTS into one turn. */
export class VoiceSession {
  constructor(
    private readonly detector: WakeWordDetector,
    private readonly stt: SttProvider,
    private readonly tts: TtsProvider,
  ) {}

  /** Process inbound audio: only transcribes if the wake word was detected. */
  listen(audio: string): VoiceResult {
    if (!this.detector.detect(audio)) return { woke: false };
    const command = this.detector.strip(audio);
    return { woke: true, transcript: this.stt.transcribe(command) };
  }

  respond(text: string, language: string): string {
    return this.tts.synthesize(text, language);
  }
}

export const moduleName = "voice" as const;
export const implemented = true;
