/**
 * NEXUS AI — @nexus/agents
 * Multi-agent system & messaging (FAZ 7).
 *
 * FAZ 0 placeholder: the module is wired into the monorepo but not yet
 * implemented. Real behavior is added in the phase noted above.
 */

export const moduleName = "agents" as const;

/** Flipped to true once this module ships real behavior. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function agentsInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}

export { AgentRegistry } from "./registry.js";
export type { AgentSpec } from "./registry.js";
