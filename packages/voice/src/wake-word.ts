/**
 * NEXUS AI — Wake Word Detection
 *
 * On-device wake word detection using phonetic matching. Instead of training a
 * specific model for each wake name (which would not support instant renaming
 * from ), we use a two-stage approach:
 *
 *  1. Phonetic encoding (Double Metaphone variant) — reduces the transcript and
 *     wake phrase to pronunciation codes, tolerating spelling differences.
 *  2. Fuzzy Levenshtein distance — allows partial matches and accent-induced
 *     transcription errors (e.g. "Nöwa" vs "Nova").
 *
 * This approach satisfies:
 *  - Instant custom name support (no retraining on rename)
 *  - Language-agnostic tolerance (works for Turkish and English names)
 *  - Configurable sensitivity (threshold tuning for noise tolerance)
 */

export interface WakeWordConfig {
  /** Maximum normalized Levenshtein distance (0–1) to consider a match. Lower = stricter. */
  readonly threshold: number;
  /** Minimum number of characters in the candidate to attempt matching. */
  readonly minLength: number;
  /** Whether to apply phonetic encoding before distance comparison. */
  readonly usePhonetic: boolean;
}

export const DEFAULT_WAKE_CONFIG: WakeWordConfig = {
  threshold: 0.35,
  minLength: 2,
  usePhonetic: true,
};

export interface WakeWordResult {
  readonly detected: boolean;
  /** The portion of the transcript that matched the wake word. */
  readonly matchedSegment?: string;
  /** Normalized distance score (0 = perfect match, 1 = no match). */
  readonly score: number;
  /** The remainder of the transcript after the wake word. */
  readonly command?: string;
}

/**
 * Simplified Metaphone-style phonetic encoder. Reduces words to their
 * consonant skeleton, merging similar-sounding letters. This is intentionally
 * simpler than full Double Metaphone — optimized for short proper names
 * (wake words) across Latin-script languages including Turkish.
 */
export function phoneticEncode(input: string): string {
  if (!input) return "";
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z]/g, ""); // keep only latin letters

  if (!normalized) return "";

  // Phonetic reduction rules (order matters)
  let encoded = normalized
    // Turkish-specific: ş→s, ç→c, ğ→g, ı→i (already handled by NFD+strip for most)
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/gh/g, "g")
    .replace(/wh/g, "w")
    .replace(/th/g, "t")
    .replace(/sh/g, "s")
    .replace(/ch/g, "k")
    .replace(/qu/g, "k")
    .replace(/x/g, "ks")
    // Vowel normalization (collapse to single representative)
    .replace(/[aeiou]+/g, "a")
    // Merge similar consonants
    .replace(/[sz]/g, "s")
    .replace(/[dt]/g, "t")
    .replace(/[bp]/g, "b")
    .replace(/[fv]/g, "f")
    .replace(/[gkq]/g, "k")
    .replace(/[mn]/g, "n")
    .replace(/[wy]/g, "w");

  // Remove consecutive duplicates
  encoded = encoded.replace(/(.)\1+/g, "$1");

  return encoded;
}

/**
 * Compute the Levenshtein edit distance between two strings.
 * Returns the raw edit count.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost, // substitution
      );
    }
  }

  return matrix[a.length]![b.length]!;
}

/**
 * Normalized Levenshtein distance: 0 = identical, 1 = completely different.
 */
export function normalizedDistance(a: string, b: string): number {
  if (a === b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return levenshtein(a, b) / maxLen;
}

/**
 * Detect whether the given transcript contains the wake word.
 *
 * Strategy: slide a window of ±2 tokens around each position in the transcript
 * and compare against the wake phrase using phonetic + fuzzy matching.
 */
export function detectWakeWord(
  transcript: string,
  wakePhrase: string,
  config: WakeWordConfig = DEFAULT_WAKE_CONFIG,
): WakeWordResult {
  const NO_MATCH: WakeWordResult = { detected: false, score: 1 };

  if (!transcript || !wakePhrase) return NO_MATCH;

  const cleanTranscript = transcript.trim().toLowerCase();
  const cleanWake = wakePhrase.trim().toLowerCase();

  if (cleanWake.length < config.minLength) return NO_MATCH;

  // Direct substring match (fast path)
  const directIdx = cleanTranscript.indexOf(cleanWake);
  if (directIdx !== -1) {
    const command = cleanTranscript.slice(directIdx + cleanWake.length).trim();
    return {
      detected: true,
      matchedSegment: cleanWake,
      score: 0,
      command: command || undefined,
    };
  }

  // Tokenize the transcript and try n-gram windows matching wake phrase length
  const tokens = cleanTranscript.split(/\s+/);
  const wakeTokens = cleanWake.split(/\s+/);
  const windowSize = wakeTokens.length;

  let bestScore = 1;
  let bestIdx = -1;
  let bestEnd = -1;

  for (let i = 0; i <= tokens.length - windowSize; i++) {
    const window = tokens.slice(i, i + windowSize).join(" ");
    let score: number;

    if (config.usePhonetic) {
      const encodedWindow = phoneticEncode(window);
      const encodedWake = phoneticEncode(cleanWake);
      score = normalizedDistance(encodedWindow, encodedWake);
    } else {
      score = normalizedDistance(window, cleanWake);
    }

    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
      bestEnd = i + windowSize;
    }
  }

  // Also try ±1 token windows for multi-word tolerance
  for (let extra = -1; extra <= 1; extra++) {
    const ws = windowSize + extra;
    if (ws < 1 || ws > tokens.length) continue;
    for (let i = 0; i <= tokens.length - ws; i++) {
      const window = tokens.slice(i, i + ws).join(" ");
      let score: number;

      if (config.usePhonetic) {
        score = normalizedDistance(phoneticEncode(window), phoneticEncode(cleanWake));
      } else {
        score = normalizedDistance(window, cleanWake);
      }

      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
        bestEnd = i + ws;
      }
    }
  }

  if (bestScore <= config.threshold && bestIdx !== -1) {
    const matchedSegment = tokens.slice(bestIdx, bestEnd).join(" ");
    const command = tokens.slice(bestEnd).join(" ").trim();
    return {
      detected: true,
      matchedSegment,
      score: bestScore,
      command: command || undefined,
    };
  }

  return { detected: false, score: bestScore };
}

/**
 * A stateful wake word detector that maintains configuration and provides a
 * simplified API for the VoiceEngine to call.
 */
export class WakeWordDetector {
  private wakePhrase: string;
  private readonly config: WakeWordConfig;

  constructor(wakePhrase: string, config: Partial<WakeWordConfig> = {}) {
    this.wakePhrase = wakePhrase;
    this.config = { ...DEFAULT_WAKE_CONFIG, ...config };
  }

  /** Update the wake phrase (when user renames the assistant). */
  setWakePhrase(phrase: string): void {
    this.wakePhrase = phrase;
  }

  getWakePhrase(): string {
    return this.wakePhrase;
  }

  /** Check whether the given transcript starts with / contains the wake word. */
  detect(transcript: string): WakeWordResult {
    return detectWakeWord(transcript, this.wakePhrase, this.config);
  }
}
