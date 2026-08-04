export interface DiscoverableSkill {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly icon: string;
  readonly tags: readonly string[];
}

export class SkillDiscoveryService {
  /**
   * Returns a list of skills that the user can discover and enable.
   * Since there are no real third-party integrations (like Spotify),
   * only local and realistically implementable skills are returned.
   */
  getDiscoverableSkills(): readonly DiscoverableSkill[] {
    return [
      {
        id: "skill_security",
        nameKey: "skill.security.name",
        descriptionKey: "skill.security.desc",
        icon: "shield",
        tags: ["security", "local"],
      },
      {
        id: "skill_energy",
        nameKey: "skill.energy.name",
        descriptionKey: "skill.energy.desc",
        icon: "leaf",
        tags: ["energy", "automation"],
      },
      {
        id: "skill_movie",
        nameKey: "skill.movie.name",
        descriptionKey: "skill.movie.desc",
        icon: "film",
        tags: ["entertainment", "lighting"],
      },
      {
        id: "skill_morning",
        nameKey: "skill.morning.name",
        descriptionKey: "skill.morning.desc",
        icon: "sun",
        tags: ["routine", "morning"],
      },
    ];
  }
}
