/**
 * NEXUS AI — @nexus/legal
 * Legal documents & compliance flows (FAZ 19).
 *
 * FAZ 0 placeholder: the module is wired into the monorepo but not yet
 * implemented. Real behavior is added in the phase noted above.
 */

export * from "./service.js";

export const moduleName = "legal" as const;

/** Flipped to true once this module ships real behavior. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function legalInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}
