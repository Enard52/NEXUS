import { describe, expect, it } from "vitest";
import {
  VoiceEngine,
  WakeWordDetector,
  detectWakeWord,
  phoneticEncode,
  levenshtein,
  normalizedDistance,
  MockSttProvider,
  MockTtsProvider,
  WhisperSttProvider,
  OpenAiTtsProvider,
  selectSttProvider,
  selectTtsProvider,
  voiceForTone,
  SpeakerStore,
  MockVoiceEmbedder,
  cosineSimilarity,
  voiceInfo,
  moduleName,
} from "./index.js";

// ── Module Identity ────────────────────────────────────────────────────────────

describe("@nexus/voice module identity", () => {
  it("exposes correct module info", () => {
    expect(moduleName).toBe("voice");
    expect(voiceInfo()).toEqual({ name: "voice", implemented: true });
  });
});

// ── Phonetic Encoding ──────────────────────────────────────────────────────────

describe("phoneticEncode", () => {
  it("reduces words to phonetic skeleton", () => {
    expect(phoneticEncode("Nova")).toBe(phoneticEncode("nova"));
    expect(phoneticEncode("")).toBe("");
  });

  it("strips diacritics (Turkish tolerance)", () => {
    // ş, ç, ö, ü should be normalized
    const encoded = phoneticEncode("Növa");
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("merges similar sounds", () => {
    // "f" and "ph" should encode the same
    expect(phoneticEncode("phone")).toBe(phoneticEncode("fone"));
  });

  it("handles non-latin input gracefully", () => {
    expect(phoneticEncode("日本語")).toBe("");
    expect(phoneticEncode("123")).toBe("");
  });
});

// ── Levenshtein Distance ───────────────────────────────────────────────────────

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("hello", "hello")).toBe(0);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("computes correct edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("nova", "noba")).toBe(1);
  });
});

describe("normalizedDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(normalizedDistance("test", "test")).toBe(0);
  });

  it("returns value between 0 and 1", () => {
    const d = normalizedDistance("hello", "world");
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThanOrEqual(1);
  });
});

// ── Wake Word Detection ────────────────────────────────────────────────────────

describe("WakeWordDetector", () => {
  it("detects exact wake word match", () => {
    const detector = new WakeWordDetector("nexus");
    const result = detector.detect("nexus turn on the lights");
    expect(result.detected).toBe(true);
    expect(result.command).toBe("turn on the lights");
    expect(result.score).toBe(0);
  });

  it("detects wake word case-insensitively", () => {
    const detector = new WakeWordDetector("Nova");
    const result = detector.detect("NOVA what time is it");
    expect(result.detected).toBe(true);
    expect(result.command).toBe("what time is it");
  });

  it("detects phonetically similar wake word", () => {
    const detector = new WakeWordDetector("Nova");
    // Simulates an accent-induced transcription: "Noba" instead of "Nova"
    const result = detector.detect("noba turn on lights");
    expect(result.detected).toBe(true);
    expect(result.score).toBeLessThan(0.35);
  });

  it("rejects non-matching transcript", () => {
    const detector = new WakeWordDetector("nexus");
    const result = detector.detect("please turn on the lights");
    expect(result.detected).toBe(false);
  });

  it("supports dynamic wake phrase change", () => {
    const detector = new WakeWordDetector("nexus");
    detector.setWakePhrase("aurora");
    const result = detector.detect("aurora play some music");
    expect(result.detected).toBe(true);
    expect(result.command).toBe("play some music");
  });

  it("handles multi-word wake phrases", () => {
    const detector = new WakeWordDetector("hey nexus");
    const result = detector.detect("hey nexus dim the lights");
    expect(result.detected).toBe(true);
    expect(result.command).toBe("dim the lights");
  });

  it("respects minimum length constraint", () => {
    const result = detectWakeWord("a b c", "a", {
      threshold: 0.5,
      minLength: 3,
      usePhonetic: true,
    });
    expect(result.detected).toBe(false);
  });
});

// ── STT Providers ──────────────────────────────────────────────────────────────

describe("MockSttProvider", () => {
  it("returns configurable fixed text", async () => {
    const stt = new MockSttProvider({ fixedText: "hello world" });
    const result = await stt.transcribe(new ArrayBuffer(100));
    expect(result.text).toBe("hello world");
    expect(result.provider).toBe("mock-stt");
    expect(result.confidence).toBe(0.95);
  });

  it("derives text from audio size when no fixed text", async () => {
    const stt = new MockSttProvider();
    const result = await stt.transcribe(new ArrayBuffer(256));
    expect(result.text).toContain("256 bytes");
  });

  it("respects language hint", async () => {
    const stt = new MockSttProvider({ fixedText: "merhaba" });
    const result = await stt.transcribe(new ArrayBuffer(10), { languageHint: "tr" });
    expect(result.language).toBe("tr");
  });

  it("is always available", () => {
    expect(new MockSttProvider().isAvailable()).toBe(true);
  });
});

describe("WhisperSttProvider", () => {
  it("requires a non-empty API key", () => {
    expect(() => new WhisperSttProvider({ apiKey: "" })).toThrow(/non-empty apiKey/);
  });

  it("reports availability based on key", () => {
    expect(new WhisperSttProvider({ apiKey: "sk-test" }).isAvailable()).toBe(true);
  });
});

describe("selectSttProvider", () => {
  it("returns Whisper when key is provided", () => {
    expect(selectSttProvider({ provider: "whisper", apiKey: "sk-x" }).name).toBe("whisper");
  });

  it("falls back to mock without credentials", () => {
    expect(selectSttProvider({ provider: "whisper" }).name).toBe("mock-stt");
  });
});

// ── TTS Providers ──────────────────────────────────────────────────────────────

describe("MockTtsProvider", () => {
  it("returns audio containing the input text", async () => {
    const tts = new MockTtsProvider();
    const result = await tts.synthesize("Hello world");
    expect(result.provider).toBe("mock-tts");
    expect(result.format).toBe("mp3");
    // Verify the audio contains the text
    const decoder = new TextDecoder();
    const content = decoder.decode(result.audio);
    expect(content).toContain("Hello world");
  });

  it("uses requested voice", async () => {
    const tts = new MockTtsProvider();
    const result = await tts.synthesize("test", { voice: "onyx" });
    expect(result.voice).toBe("onyx");
  });

  it("lists all available voices", () => {
    const tts = new MockTtsProvider();
    expect(tts.voices()).toContain("nova");
    expect(tts.voices()).toContain("onyx");
    expect(tts.voices().length).toBe(6);
  });
});

describe("OpenAiTtsProvider", () => {
  it("requires a non-empty API key", () => {
    expect(() => new OpenAiTtsProvider({ apiKey: "" })).toThrow(/non-empty apiKey/);
  });
});

describe("voiceForTone", () => {
  it("maps tone preferences to appropriate voices", () => {
    expect(voiceForTone("formal")).toBe("onyx");
    expect(voiceForTone("friendly")).toBe("nova");
    expect(voiceForTone("playful")).toBe("shimmer");
    expect(voiceForTone("concise")).toBe("echo");
  });
});

describe("selectTtsProvider", () => {
  it("returns OpenAI TTS when key is provided", () => {
    expect(selectTtsProvider({ provider: "openai", apiKey: "sk-x" }).name).toBe("openai-tts");
  });

  it("falls back to mock without credentials", () => {
    expect(selectTtsProvider({ provider: "openai" }).name).toBe("mock-tts");
  });
});

// ── Voice Profile / Speaker Identification ─────────────────────────────────────

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("handles empty/mismatched vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });
});

describe("MockVoiceEmbedder", () => {
  it("produces deterministic embeddings for same input", async () => {
    const embedder = new MockVoiceEmbedder(16);
    const audio = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const e1 = await embedder.embed(audio);
    const e2 = await embedder.embed(audio);
    expect(e1.vector).toEqual(e2.vector);
    expect(e1.dimensions).toBe(16);
  });

  it("produces different embeddings for different input", async () => {
    const embedder = new MockVoiceEmbedder(16);
    const e1 = await embedder.embed(new Uint8Array([1, 2, 3]).buffer);
    const e2 = await embedder.embed(new Uint8Array([10, 20, 30]).buffer);
    expect(e1.vector).not.toEqual(e2.vector);
  });
});

describe("SpeakerStore", () => {
  it("enrolls a speaker and identifies them after enough samples", async () => {
    const embedder = new MockVoiceEmbedder(32);
    const store = new SpeakerStore(embedder, {
      identificationThreshold: 0.7,
      minEnrollmentSamples: 2,
    });

    const audio = new Uint8Array([100, 150, 200, 50, 75]).buffer;

    // First enrollment
    await store.enroll("user-1", "Alice", audio);
    expect(store.isEnrolled("user-1")).toBe(false); // Only 1 sample

    // Second enrollment
    await store.enroll("user-1", "Alice", audio);
    expect(store.isEnrolled("user-1")).toBe(true); // 2 samples = enough

    // Identification with same audio should match
    const result = await store.identify(audio);
    expect(result.identified).toBe(true);
    expect(result.userId).toBe("user-1");
    expect(result.displayName).toBe("Alice");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("distinguishes between different speakers", async () => {
    const embedder = new MockVoiceEmbedder(32);
    const store = new SpeakerStore(embedder, {
      identificationThreshold: 0.7,
      minEnrollmentSamples: 2,
    });

    const aliceAudio = new Uint8Array([100, 150, 200, 50, 75, 120, 80, 90]).buffer;
    const bobAudio = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]).buffer;

    await store.enroll("alice", "Alice", aliceAudio);
    await store.enroll("alice", "Alice", aliceAudio);
    await store.enroll("bob", "Bob", bobAudio);
    await store.enroll("bob", "Bob", bobAudio);

    // Alice's voice identifies as Alice
    const aliceResult = await store.identify(aliceAudio);
    expect(aliceResult.identified).toBe(true);
    expect(aliceResult.userId).toBe("alice");

    // Bob's voice identifies as Bob
    const bobResult = await store.identify(bobAudio);
    expect(bobResult.identified).toBe(true);
    expect(bobResult.userId).toBe("bob");
  });

  it("returns not-identified for unknown speakers", async () => {
    const embedder = new MockVoiceEmbedder(32);
    const store = new SpeakerStore(embedder, {
      identificationThreshold: 0.99, // Very strict
      minEnrollmentSamples: 2,
    });

    const knownAudio = new Uint8Array([100, 150, 200, 50, 75]).buffer;
    await store.enroll("user-1", "Known", knownAudio);
    await store.enroll("user-1", "Known", knownAudio);

    // Completely different audio
    const unknownAudio = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).buffer;
    const result = await store.identify(unknownAudio);
    expect(result.identified).toBe(false);
  });

  it("unenrolls a speaker", async () => {
    const embedder = new MockVoiceEmbedder();
    const store = new SpeakerStore(embedder, { minEnrollmentSamples: 1 });

    await store.enroll("u1", "User", new Uint8Array([1, 2, 3]).buffer);
    expect(store.listProfiles().length).toBe(1);

    store.unenroll("u1");
    expect(store.listProfiles().length).toBe(0);
  });
});

// ── VoiceEngine (Full Pipeline) ────────────────────────────────────────────────

describe("VoiceEngine", () => {
  it("creates with default mock configuration", () => {
    const engine = new VoiceEngine();
    expect(engine.isEnabled()).toBe(true);
    expect(engine.isSttAvailable()).toBe(true);
    expect(engine.isTtsAvailable()).toBe(true);
  });

  it("listens to audio and detects wake word", async () => {
    const engine = new VoiceEngine({ wakePhrase: "nexus" });

    // Mock STT will return text derived from audio size
    const audio = new ArrayBuffer(100);
    const result = await engine.listen(audio);

    expect(result.transcript).toBeDefined();
    expect(result.sttResult.provider).toBe("mock-stt");
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
  });

  it("speaks text and returns audio", async () => {
    const engine = new VoiceEngine();
    const result = await engine.speak("Hello, how can I help?");

    expect(result.audio.byteLength).toBeGreaterThan(0);
    expect(result.format).toBe("mp3");
    expect(result.voice).toBe("nova"); // default for "friendly" tone
  });

  it("selects voice based on tone", async () => {
    const engine = new VoiceEngine();
    engine.setTone("formal");
    const result = await engine.speak("Good morning.");
    expect(result.voice).toBe("onyx");
  });

  it("updates wake phrase dynamically", () => {
    const engine = new VoiceEngine({ wakePhrase: "nexus" });
    expect(engine.getWakePhrase()).toBe("nexus");
    engine.setWakePhrase("aurora");
    expect(engine.getWakePhrase()).toBe("aurora");
  });

  it("enrolls and identifies speakers", async () => {
    const engine = new VoiceEngine({
      speakerConfig: { identificationThreshold: 0.7, minEnrollmentSamples: 2 },
    });

    const audio = new Uint8Array([100, 150, 200, 50, 75]).buffer;
    await engine.enrollSpeaker("u1", "Alice", audio);
    await engine.enrollSpeaker("u1", "Alice", audio);

    expect(engine.isSpeakerEnrolled("u1")).toBe(true);
    expect(engine.listSpeakers().length).toBe(1);
  });

  it("provides available voices list", () => {
    const engine = new VoiceEngine();
    const voices = engine.availableVoices();
    expect(voices).toContain("nova");
    expect(voices).toContain("alloy");
    expect(voices.length).toBe(6);
  });
});
