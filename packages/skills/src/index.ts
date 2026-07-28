/**
 * NEXUS AI — @nexus/skills
 *
 * Experience memory + auto-learned Skills. The system observes repeated
 * fine-tuning patterns, proposes saving them as Skills (with user consent),
 * and auto-applies them on subsequent matching requests.
 *
 * Key components:
 *  - SkillStore: CRUD + lifecycle for Skill definitions
 *  - SkillLearningEngine: Detects repetitive patterns → proposes Skills
 *  - SkillExecutor: Pattern-matches incoming intents → auto-applies active Skills
 *  - SkillConsentManager: User approval flow for proposed Skills
 *  - SkillDiscoveryService: Static catalog of discoverable system skills
 */

export const moduleName = "skills" as const;
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function skillsInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}

export * from "./discovery.js";
export * from "./skill-store.js";
export * from "./learning-engine.js";
