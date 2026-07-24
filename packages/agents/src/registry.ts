export interface AgentSpec {
  readonly id: string;
  readonly nameKey: string;
  readonly icon: string;
  readonly status: "active" | "sleeping" | "learning";
}

export class AgentRegistry {
  public listAvailableAgents(): AgentSpec[] {
    return [
      { id: "home", nameKey: "agent.home", icon: "home", status: "active" },
      { id: "security", nameKey: "agent.security", icon: "shield", status: "active" },
      { id: "knowledge", nameKey: "agent.knowledge", icon: "book", status: "sleeping" },
      { id: "life", nameKey: "agent.life", icon: "heart", status: "learning" },
    ];
  }
}
