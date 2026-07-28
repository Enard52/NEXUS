/**
 * NEXUS AI — @nexus/legal
 * Legal documents & compliance flows (ToS, Privacy, GDPR/KVKK data requests).
 */

export * from "./service.js";

export const moduleName = "legal" as const;

/** True — LegalService ships real document, consent, and data-subject APIs. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function legalInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}
