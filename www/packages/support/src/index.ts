/**
 * NEXUS AI — @nexus/support
 * Onboarding, support tickets, and opt-in analytics.
 */

export * from "./onboarding.js";
export * from "./telemetry.js";
export * from "./ticket.js";

export const moduleName = "support" as const;

/** Onboarding, telemetry, and ticket APIs are implemented. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function supportInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}
