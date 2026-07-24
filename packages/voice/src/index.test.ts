import { describe, expect, it } from "vitest";
import {
  editDistance,
  implemented,
  MockSttProvider,
  MockTtsProvider,
  moduleName,
  UnconfiguredSttProvider,
  VoiceSession,
  WakeWordDetector,
} from "./index.js";

describe("editDistance (FAZ 2)", () => {
  it("is zero for identical strings and symmetric for edits", () => {
    expect(editDistance("nexus", "nexus")).toBe(0);
    expect(editDistance("nexus", "nexuss")).toBe(1);
    expect(editDistance("nexus", "neksus")).toBe(2);
    expect(editDistance("", "abc")).toBe(3);
  });
});

describe("WakeWordDetector (FAZ 2)", () => {
  it("detects the chosen wake name inside an utterance", () => {
    const detector = new WakeWordDetector("Nexus");
    expect(detector.detect("Nexus turn on the lights")).toBe(true);
    expect(detector.detect("please turn on the lights")).toBe(false);
  });

  it("tolerates small transcription errors and accents", () => {
    const detector = new WakeWordDetector("Nexus");
    // One-character slip (u->i) is within the default tolerance.
    expect(detector.detect("Nexis play music")).toBe(true);
    expect(detector.detect("néxus play music")).toBe(true);
  });

  it("strips the wake word so only the command remains", () => {
    const detector = new WakeWordDetector("Nexus");
    expect(detector.strip("Nexus turn on the lights")).toBe("turn on the lights");
  });

  it("honors an explicit tolerance of zero for exact matching", () => {
    const detector = new WakeWordDetector("Nexus", { tolerance: 0 });
    expect(detector.detect("Neksus hello")).toBe(false);
    expect(detector.detect("nexus hello")).toBe(true);
  });
});

describe("VoiceSession (FAZ 2)", () => {
  it("only transcribes after the wake word is heard", () => {
    const session = new VoiceSession(
      new WakeWordDetector("Nexus"),
      new MockSttProvider(),
      new MockTtsProvider(),
    );

    const idle = session.listen("turn on the lights");
    expect(idle.woke).toBe(false);
    expect(idle.transcript).toBeUndefined();

    const woken = session.listen("Nexus turn on the lights");
    expect(woken.woke).toBe(true);
    expect(woken.transcript?.text).toBe("turn on the lights");
  });

  it("carries a speaker id so family members can be told apart (FAZ 12)", () => {
    const session = new VoiceSession(
      new WakeWordDetector("Nexus"),
      new MockSttProvider("member-ayse"),
      new MockTtsProvider(),
    );
    const result = session.listen("Nexus what is on my calendar");
    expect(result.transcript?.speakerId).toBe("member-ayse");
  });

  it("synthesizes a tagged response per language", () => {
    const session = new VoiceSession(
      new WakeWordDetector("Nexus"),
      new MockSttProvider(),
      new MockTtsProvider(),
    );
    expect(session.respond("Merhaba", "tr")).toBe("tts:tr:Merhaba");
    expect(session.respond("Hello", "en")).toBe("tts:en:Hello");
  });
});

describe("never-fake-success stub (FAZ 2)", () => {
  it("throws instead of fabricating a transcript without a real engine", () => {
    expect(() => new UnconfiguredSttProvider().transcribe()).toThrow(/not wired/);
  });
});

describe("@nexus/voice module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("voice");
    expect(implemented).toBe(true);
  });
});
