/**
 * NEXUS AI — Voice Profile / Speaker Identification
 *
 * Enrollment-based speaker identification for the multi-user family scenario
 * (connected to ). Each family member enrolls their voice with a short
 * sample; subsequent utterances are compared against enrolled profiles to
 * determine "who is speaking."
 *
 * Approach: Extract a simplified voice feature vector (embedding) from audio
 * and compare using cosine similarity. In a real deployment this would use a
 * neural speaker embedding model (e.g. ECAPA-TDNN); here we provide the
 * interface and a mock implementation for dev/test, plus a simple energy-based
 * feature extractor that demonstrates the pipeline.
 *
 * The system is designed to be swappable: replace the VoiceEmbedder with a
 * real model when hardware/cloud support is available.
 */

export interface VoiceEmbedding {
  /** Normalized feature vector representing the speaker's voice characteristics. */
  readonly vector: readonly number[];
  /** Dimensionality of the embedding. */
  readonly dimensions: number;
}

export interface SpeakerProfile {
  /** User ID from the accounts/family system. */
  readonly userId: string;
  /** Display name for the speaker. */
  readonly displayName: string;
  /** Averaged embedding from enrollment samples. */
  readonly embedding: VoiceEmbedding;
  /** Number of samples used to build this profile. */
  readonly sampleCount: number;
  /** When the profile was last updated. */
  readonly updatedAt: string;
}

export interface IdentificationResult {
  /** Whether a speaker was confidently identified. */
  readonly identified: boolean;
  /** The matched user ID, if identified. */
  readonly userId?: string;
  /** The matched display name, if identified. */
  readonly displayName?: string;
  /** Confidence score (0–1). */
  readonly confidence: number;
  /** All candidate scores for transparency. */
  readonly candidates: readonly { userId: string; score: number }[];
}

export interface VoiceEmbedder {
  readonly name: string;
  /** Extract a voice embedding from an audio sample. */
  embed(audio: ArrayBuffer): Promise<VoiceEmbedding>;
}

// ── Cosine Similarity ──────────────────────────────────────────────────────────

/** Compute cosine similarity between two vectors. Returns value in [-1, 1]. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Mock Embedder ──────────────────────────────────────────────────────────────

/**
 * Mock voice embedder for testing. Generates a deterministic embedding based
 * on the audio content (byte patterns), so identical inputs produce identical
 * embeddings and different inputs produce different ones.
 */
export class MockVoiceEmbedder implements VoiceEmbedder {
  readonly name = "mock-embedder";
  private readonly dimensions: number;

  constructor(dimensions = 64) {
    this.dimensions = dimensions;
  }

  async embed(audio: ArrayBuffer): Promise<VoiceEmbedding> {
    const bytes = new Uint8Array(audio);
    const vector: number[] = new Array(this.dimensions).fill(0);

    // Derive features from audio bytes (deterministic pseudo-extraction)
    for (let i = 0; i < bytes.length; i++) {
      vector[i % this.dimensions] += bytes[i]! / 255;
    }

    // Normalize to unit vector
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? vector.map((v) => v / norm) : vector;

    return { vector: normalized, dimensions: this.dimensions };
  }
}

// ── Energy-Based Embedder (simple real implementation) ─────────────────────────

/**
 * Simple energy-based voice feature extractor. Computes spectral energy
 * distribution across frequency bands from raw PCM-like data. This is a
 * lightweight energy-based embedder for offline/dev; swap for a neural model when deploying speaker ID.
 */
export class EnergyVoiceEmbedder implements VoiceEmbedder {
  readonly name = "energy-embedder";
  private readonly bands: number;

  constructor(bands = 32) {
    this.bands = bands;
  }

  async embed(audio: ArrayBuffer): Promise<VoiceEmbedding> {
    const samples = new Float32Array(audio);
    const bandSize = Math.max(1, Math.floor(samples.length / this.bands));
    const vector: number[] = [];

    for (let b = 0; b < this.bands; b++) {
      let energy = 0;
      const start = b * bandSize;
      const end = Math.min(start + bandSize, samples.length);
      for (let i = start; i < end; i++) {
        energy += samples[i]! * samples[i]!;
      }
      vector.push(Math.sqrt(energy / (end - start || 1)));
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? vector.map((v) => v / norm) : vector;

    return { vector: normalized, dimensions: this.bands };
  }
}

// ── Speaker Store ──────────────────────────────────────────────────────────────

export interface SpeakerStoreConfig {
  /** Minimum confidence threshold to consider a match (0–1). */
  readonly identificationThreshold: number;
  /** Minimum number of enrollment samples for a profile to be active. */
  readonly minEnrollmentSamples: number;
}

export const DEFAULT_SPEAKER_CONFIG: SpeakerStoreConfig = {
  identificationThreshold: 0.75,
  minEnrollmentSamples: 3,
};

/**
 * In-memory speaker profile store. Manages enrollment and identification.
 */
export class SpeakerStore {
  private readonly profiles = new Map<string, SpeakerProfile>();
  private readonly embedder: VoiceEmbedder;
  private readonly config: SpeakerStoreConfig;
  // Accumulated raw embeddings for averaging during enrollment
  private readonly enrollmentBuffers = new Map<string, VoiceEmbedding[]>();

  constructor(embedder: VoiceEmbedder, config: Partial<SpeakerStoreConfig> = {}) {
    this.embedder = embedder;
    this.config = { ...DEFAULT_SPEAKER_CONFIG, ...config };
  }

  /** Enroll a voice sample for a user. Multiple samples improve accuracy. */
  async enroll(userId: string, displayName: string, audio: ArrayBuffer): Promise<SpeakerProfile> {
    const embedding = await this.embedder.embed(audio);

    const buffer = this.enrollmentBuffers.get(userId) ?? [];
    buffer.push(embedding);
    this.enrollmentBuffers.set(userId, buffer);

    // Average all enrollment embeddings for the profile
    const averaged = this.averageEmbeddings(buffer);
    const profile: SpeakerProfile = {
      userId,
      displayName,
      embedding: averaged,
      sampleCount: buffer.length,
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  /** Identify which enrolled speaker produced the given audio. */
  async identify(audio: ArrayBuffer): Promise<IdentificationResult> {
    if (this.profiles.size === 0) {
      return { identified: false, confidence: 0, candidates: [] };
    }

    const embedding = await this.embedder.embed(audio);
    const candidates: { userId: string; score: number }[] = [];

    for (const [userId, profile] of this.profiles) {
      if (profile.sampleCount < this.config.minEnrollmentSamples) continue;
      const score = cosineSimilarity(embedding.vector, profile.embedding.vector);
      candidates.push({ userId, score });
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (best && best.score >= this.config.identificationThreshold) {
      const profile = this.profiles.get(best.userId)!;
      return {
        identified: true,
        userId: best.userId,
        displayName: profile.displayName,
        confidence: best.score,
        candidates,
      };
    }

    return {
      identified: false,
      confidence: best?.score ?? 0,
      candidates,
    };
  }

  /** Remove a speaker profile. */
  unenroll(userId: string): boolean {
    this.enrollmentBuffers.delete(userId);
    return this.profiles.delete(userId);
  }

  /** Get all enrolled profiles. */
  listProfiles(): readonly SpeakerProfile[] {
    return [...this.profiles.values()];
  }

  /** Get a specific profile. */
  getProfile(userId: string): SpeakerProfile | undefined {
    return this.profiles.get(userId);
  }

  /** Check if a user has enough enrollment samples for identification. */
  isEnrolled(userId: string): boolean {
    const profile = this.profiles.get(userId);
    return !!profile && profile.sampleCount >= this.config.minEnrollmentSamples;
  }

  private averageEmbeddings(embeddings: VoiceEmbedding[]): VoiceEmbedding {
    if (embeddings.length === 0) {
      return { vector: [], dimensions: 0 };
    }

    const dims = embeddings[0]!.dimensions;
    const sum = new Array<number>(dims).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dims; i++) {
        sum[i]! += emb.vector[i]!;
      }
    }

    const averaged = sum.map((v) => v / embeddings.length);
    // Re-normalize
    const norm = Math.sqrt(averaged.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? averaged.map((v) => v / norm) : averaged;

    return { vector: normalized, dimensions: dims };
  }
}
