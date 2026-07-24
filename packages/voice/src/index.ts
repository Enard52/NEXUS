/**
 * NEXUS AI — @nexus/voice
 * Wake-word, STT and TTS engine (FAZ 2).
 *
 * FAZ 0 placeholder: the module is wired into the monorepo but not yet
 * implemented. Real behavior is added in the phase noted above.
 */

export * from "./engine.js";

export const moduleName = "voice" as const;

/** Flipped to true once this module ships real behavior. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function voiceInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}
