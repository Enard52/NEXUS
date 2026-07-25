/**
 * NEXUS AI — @nexus/voice (FAZ 2)
 *
 * Complete voice interaction engine:
 *  - Wake word detection (phonetic matching, instant rename support)
 *  - Speech-to-Text (OpenAI Whisper + mock)
 *  - Text-to-Speech (OpenAI TTS + mock, tone-aware voice selection)
 *  - Speaker identification (enrollment-based, cosine similarity)
 *
 * Bitiş Kriteri: User speaks the custom wake name → system responds with voice;
 * different family members are distinguished by their voice profile.
 */

export * from "./engine.js";
export * from "./wake-word.js";
export * from "./stt.js";
export * from "./tts.js";
export * from "./voice-profile.js";

export const moduleName = "voice" as const;
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function voiceInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}
