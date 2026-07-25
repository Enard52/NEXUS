/**
 * NEXUS AI — @nexus/support
 * Onboarding, support & analytics (FAZ 20).
 *
 * FAZ 0 placeholder: the module is wired into the monorepo but not yet
 * implemented. Real behavior is added in the phase noted above.
 */

export const moduleName = "support" as const;

/** Flipped to true once this module ships real behavior. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function supportInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}

export * from "./telemetry.js";
export * from "./ticket.js";
export * from "./onboarding.js";
