/**
 * NEXUS AI — @nexus/agents
 *
 * Multi-Agent System with:
 *  - Agent Protocol: scope-based permissions, capability declaration, confidence scoring
 *  - Agent Router: multi-agent routing, delegation handling, result consolidation
 *  - Specialized Agents: Home, Life, Knowledge, Security, Finance
 *  - Inter-Agent Messaging: agents can delegate sub-tasks to each other
 */

export const moduleName = "agents" as const;
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
export * from "./protocol.js";
export * from "./specialized.js";
