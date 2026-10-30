import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SPEAKER_CONFIG,
  EnergyVoiceEmbedder,
  MockVoiceEmbedder,
  SpeakerStore,
  cosineSimilarity,
  type VoiceEmbedder,
  type VoiceEmbedding,
} from "./voice-profile.js";

const bytes = (...values: number[]): ArrayBuffer => new Uint8Array(values).buffer;
const floats = (...values: number[]): ArrayBuffer => new Float32Array(values).buffer;
const magnitude = (v: readonly number[]): number => Math.sqrt(v.reduce((s, x) => s + x * x, 0));

/** Embedder that returns a queued embedding per call, so scores are exact. */
function scriptedEmbedder(vectors: number[][]): VoiceEmbedder {
  let i = 0;
  return {
    name: "scripted",
    async embed(): Promise<VoiceEmbedding> {
      const vector = vectors[i++]!;
      return { vector, dimensions: vector.length };
    },
  };
}

describe("cosineSimilarity", () => {
  it("is 1 for identical direction regardless of magnitude", () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });

  it("is 0 for orthogonal and -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1, 10);
  });

  it("returns 0 for length mismatch, empty input and zero vectors", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("matches a hand-computed value", () => {
    // dot=1*4+1*0=4, |a|=sqrt(2), |b|=4 -> 4/(4*sqrt2)=1/sqrt2
    expect(cosineSimilarity([1, 1], [4, 0])).toBeCloseTo(Math.SQRT1_2, 10);
  });
});

describe("MockVoiceEmbedder", () => {
  it("produces a unit vector with the configured dimensions", async () => {
    const e = await new MockVoiceEmbedder(8).embed(bytes(10, 20, 30, 40, 50));
    expect(e.dimensions).toBe(8);
    expect(e.vector).toHaveLength(8);
    expect(magnitude(e.vector)).toBeCloseTo(1, 10);
  });

  it("defaults to 64 dimensions", async () => {
    expect((await new MockVoiceEmbedder().embed(bytes(1))).dimensions).toBe(64);
  });

  it("is deterministic and distinguishes different input", async () => {
    const m = new MockVoiceEmbedder(4);
    const a1 = await m.embed(bytes(255, 0, 0, 0));
    const a2 = await m.embed(bytes(255, 0, 0, 0));
    const b = await m.embed(bytes(0, 255, 0, 0));
    expect(a1.vector).toEqual(a2.vector);
    expect(cosineSimilarity(a1.vector, b.vector)).toBeCloseTo(0, 10);
  });

  it("folds bytes into dimensions by index modulo", async () => {
    // 4 dims: bytes 0 and 4 land in dim 0
    const e = await new MockVoiceEmbedder(4).embed(bytes(255, 0, 0, 0, 255));
    expect(e.vector[0]).toBeCloseTo(1, 10);
    expect(e.vector[1]).toBe(0);
  });

  it("returns an all-zero vector (no NaN) for empty or silent audio", async () => {
    for (const audio of [new ArrayBuffer(0), bytes(0, 0, 0)]) {
      const e = await new MockVoiceEmbedder(4).embed(audio);
      expect(e.vector).toEqual([0, 0, 0, 0]);
    }
  });
});

describe("EnergyVoiceEmbedder", () => {
  it("computes per-band RMS then normalizes", async () => {
    // 2 bands over 4 samples: band0 = [3,3] rms 3, band1 = [4,4] rms 4 -> [0.6, 0.8]
    const e = await new EnergyVoiceEmbedder(2).embed(floats(3, 3, 4, 4));
    expect(e.dimensions).toBe(2);
    expect(e.vector[0]).toBeCloseTo(0.6, 6);
    expect(e.vector[1]).toBeCloseTo(0.8, 6);
  });

  it("ignores sample sign (energy only)", async () => {
    const pos = await new EnergyVoiceEmbedder(2).embed(floats(1, 2, 3, 4));
    const neg = await new EnergyVoiceEmbedder(2).embed(floats(-1, -2, -3, -4));
    expect(neg.vector).toEqual(pos.vector);
  });

  it("returns a zero vector for silence and empty audio", async () => {
    for (const audio of [floats(0, 0, 0, 0), new ArrayBuffer(0)]) {
      const e = await new EnergyVoiceEmbedder(4).embed(audio);
      expect(e.dimensions).toBe(4);
      expect(e.vector.every((v) => v === 0)).toBe(true);
    }
  });

  it("copes with fewer samples than bands without NaN", async () => {
    const e = await new EnergyVoiceEmbedder(8).embed(floats(1, 1));
    expect(e.vector).toHaveLength(8);
    expect(e.vector.every(Number.isFinite)).toBe(true);
    expect(magnitude(e.vector)).toBeCloseTo(1, 6);
  });

  it("rejects a buffer whose length is not a multiple of 4 bytes", async () => {
    await expect(new EnergyVoiceEmbedder().embed(bytes(1, 2, 3))).rejects.toThrow(RangeError);
  });
});

describe("DEFAULT_SPEAKER_CONFIG", () => {
  it("has the documented defaults", () => {
    expect(DEFAULT_SPEAKER_CONFIG).toEqual({
      identificationThreshold: 0.75,
      minEnrollmentSamples: 3,
    });
  });
});

describe("SpeakerStore enrollment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("creates a profile with sampleCount 1 and a timestamp", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4));
    const p = await store.enroll("u1", "Ayşe", bytes(10, 20, 30, 40));
    expect(p).toMatchObject({ userId: "u1", displayName: "Ayşe", sampleCount: 1 });
    expect(p.updatedAt).toBe("2026-01-02T03:04:05.000Z");
    expect(store.getProfile("u1")).toBe(p);
    expect(store.listProfiles()).toEqual([p]);
  });

  it("averages and re-normalizes embeddings across samples", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([
        [1, 0],
        [0, 1],
      ]),
    );
    await store.enroll("u1", "A", bytes(1));
    vi.setSystemTime(new Date("2026-02-02T00:00:00.000Z"));
    const p = await store.enroll("u1", "A", bytes(2));
    expect(p.sampleCount).toBe(2);
    expect(p.embedding.vector[0]).toBeCloseTo(Math.SQRT1_2, 10);
    expect(p.embedding.vector[1]).toBeCloseTo(Math.SQRT1_2, 10);
    expect(magnitude(p.embedding.vector)).toBeCloseTo(1, 10);
    expect(p.updatedAt).toBe("2026-02-02T00:00:00.000Z");
    expect(store.listProfiles()).toHaveLength(1);
  });

  it("uses the latest display name on re-enrollment", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4));
    await store.enroll("u1", "Old", bytes(1, 2));
    await store.enroll("u1", "New", bytes(1, 2));
    expect(store.getProfile("u1")?.displayName).toBe("New");
  });

  it("keeps opposite samples from producing NaN (zero average)", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([
        [1, 0],
        [-1, 0],
      ]),
    );
    await store.enroll("u1", "A", bytes(1));
    const p = await store.enroll("u1", "A", bytes(2));
    expect(p.embedding.vector.every((v) => v === 0)).toBe(true);
  });

  it("keeps users' enrollments independent", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4));
    await store.enroll("a", "A", bytes(1));
    await store.enroll("b", "B", bytes(2));
    await store.enroll("a", "A", bytes(1));
    expect(store.getProfile("a")?.sampleCount).toBe(2);
    expect(store.getProfile("b")?.sampleCount).toBe(1);
  });

  it("propagates embedder failures without creating a profile", async () => {
    const failing: VoiceEmbedder = {
      name: "failing",
      embed: () => Promise.reject(new Error("model unavailable")),
    };
    const store = new SpeakerStore(failing);
    await expect(store.enroll("u1", "A", bytes(1))).rejects.toThrow("model unavailable");
    expect(store.getProfile("u1")).toBeUndefined();
    expect(store.listProfiles()).toEqual([]);
  });
});

describe("SpeakerStore isEnrolled / unenroll", () => {
  it("requires minEnrollmentSamples before a user counts as enrolled", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4));
    expect(store.isEnrolled("u1")).toBe(false);
    await store.enroll("u1", "A", bytes(1));
    await store.enroll("u1", "A", bytes(1));
    expect(store.isEnrolled("u1")).toBe(false);
    await store.enroll("u1", "A", bytes(1));
    expect(store.isEnrolled("u1")).toBe(true);
  });

  it("honours a custom minEnrollmentSamples", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4), { minEnrollmentSamples: 1 });
    await store.enroll("u1", "A", bytes(1));
    expect(store.isEnrolled("u1")).toBe(true);
  });

  it("unenroll removes the profile and resets the sample buffer", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4), { minEnrollmentSamples: 1 });
    await store.enroll("u1", "A", bytes(1));
    await store.enroll("u1", "A", bytes(1));
    expect(store.unenroll("u1")).toBe(true);
    expect(store.unenroll("u1")).toBe(false);
    expect(store.getProfile("u1")).toBeUndefined();
    const again = await store.enroll("u1", "A", bytes(1));
    expect(again.sampleCount).toBe(1);
  });
});

describe("SpeakerStore identify", () => {
  const enrollThree = async (store: SpeakerStore, id: string, name: string) => {
    for (let i = 0; i < 3; i++) await store.enroll(id, name, bytes(1));
  };

  it("reports not identified with no candidates when nobody is enrolled", async () => {
    const embed = vi.fn();
    const store = new SpeakerStore({ name: "x", embed });
    expect(await store.identify(bytes(1))).toEqual({
      identified: false,
      confidence: 0,
      candidates: [],
    });
    expect(embed).not.toHaveBeenCalled();
  });

  it("identifies the best match above the threshold, with sorted candidates", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([
        ...Array.from({ length: 3 }, () => [1, 0]),
        ...Array.from({ length: 3 }, () => [0, 1]),
        [0.9, 0.1], // query
      ]),
    );
    await enrollThree(store, "a", "Anne");
    await enrollThree(store, "b", "Baba");
    const r = await store.identify(bytes(9));
    expect(r.identified).toBe(true);
    expect(r.userId).toBe("a");
    expect(r.displayName).toBe("Anne");
    expect(r.confidence).toBeGreaterThan(0.99);
    expect(r.candidates.map((c) => c.userId)).toEqual(["a", "b"]);
    expect(r.candidates[0]!.score).toBeGreaterThan(r.candidates[1]!.score);
  });

  it("does not identify when the best score is below the threshold", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([...Array.from({ length: 3 }, () => [1, 0]), [1, 1]]), // cos = 0.707 < 0.75
    );
    await enrollThree(store, "a", "Anne");
    const r = await store.identify(bytes(9));
    expect(r.identified).toBe(false);
    expect(r.userId).toBeUndefined();
    expect(r.displayName).toBeUndefined();
    expect(r.confidence).toBeCloseTo(Math.SQRT1_2, 10);
    expect(r.candidates).toHaveLength(1);
  });

  it("accepts a score exactly equal to the threshold", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([...Array.from({ length: 3 }, () => [1, 0]), [1, 0]]),
      { identificationThreshold: 1 },
    );
    await enrollThree(store, "a", "Anne");
    expect((await store.identify(bytes(9))).identified).toBe(true);
  });

  it("ignores profiles that have too few samples", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([
        [1, 0],
        [1, 0],
      ]),
    );
    await store.enroll("a", "Anne", bytes(1)); // only 1 of 3 samples
    const r = await store.identify(bytes(9));
    expect(r).toEqual({ identified: false, confidence: 0, candidates: [] });
  });

  it("honours a custom identification threshold", async () => {
    const store = new SpeakerStore(
      scriptedEmbedder([...Array.from({ length: 3 }, () => [1, 0]), [1, 1]]),
      { identificationThreshold: 0.5 },
    );
    await enrollThree(store, "a", "Anne");
    expect((await store.identify(bytes(9))).identified).toBe(true);
  });

  it("no longer matches a user after unenroll", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(8));
    await enrollThree(store, "a", "Anne");
    store.unenroll("a");
    expect((await store.identify(bytes(1))).identified).toBe(false);
  });

  it("round-trips real embedder output: same audio matches, different audio does not", async () => {
    const store = new SpeakerStore(new MockVoiceEmbedder(4));
    const voiceA = bytes(200, 10, 10, 10);
    const voiceB = bytes(10, 10, 10, 200);
    for (let i = 0; i < 3; i++) {
      await store.enroll("a", "A", voiceA);
      await store.enroll("b", "B", voiceB);
    }
    expect((await store.identify(voiceA)).userId).toBe("a");
    expect((await store.identify(voiceB)).userId).toBe("b");
    const other = await store.identify(bytes(10, 200, 10, 10));
    expect(other.identified).toBe(false);
  });
});
