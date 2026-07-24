/**
 * NEXUS AI — @nexus/skills
 * Skill system & experience memory (FAZ 5).
 *
 * FAZ 0 placeholder: the module is wired into the monorepo but not yet
 * implemented. Real behavior is added in the phase noted above.
 */

export const moduleName = "skills" as const;

/** Flipped to true since we now ship Skill Discovery. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function skillsInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}

export * from "./discovery.js";
