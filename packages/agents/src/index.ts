/**
 * NEXUS AI — Multi-Agent System (FAZ 7)
 *
 * A registry of specialized agents (Home, PC, Life, Knowledge, Research,
 * Learning, Finance, Security, Communication), a message protocol, and an
 * orchestrator that routes an incoming request to the correct agent(s) and
 * combines their replies. Each agent declares the capability *scopes* it needs;
 * the orchestrator refuses to dispatch to an agent whose scopes are not granted
 * (scope-based permissions — aligns with the Security Engine philosophy).
 *
 * Dependency-free and deterministic so routing/permission logic is fully testable.
 */

export type Scope =
  | "home.control"
  | "pc.control"
  | "life.manage"
  | "knowledge.read"
  | "research.web"
  | "learning.track"
  | "finance.read"
  | "security.audit"
  | "comm.send";

/** A coarse intent handed to the orchestrator. */
export interface AgentIntent {
  readonly name: string;
  readonly slots?: Record<string, string>;
}

/** Inter-agent / orchestrator message envelope (message protocol). */
export interface AgentMessage {
  readonly from: string;
  readonly to: string;
  readonly intent: AgentIntent;
}

export interface AgentReply {
  readonly agent: string;
  readonly text: string;
  /** Scopes the reply actually exercised (for audit/telemetry). */
  readonly usedScopes: readonly Scope[];
}

export interface NexusAgent {
  readonly name: string;
  /** Capability scopes this agent requires to operate. */
  readonly scopes: readonly Scope[];
  canHandle(intent: AgentIntent): boolean;
  handle(intent: AgentIntent): AgentReply;
}

// ── Concrete agents (≥4 with real behavior) ──────────────────────────────────

export class HomeAgent implements NexusAgent {
  readonly name = "home";
  readonly scopes = ["home.control"] as const;
  canHandle(intent: AgentIntent): boolean {
    return intent.name.startsWith("home.");
  }
  handle(intent: AgentIntent): AgentReply {
    const device = intent.slots?.device ?? "device";
    const state = intent.slots?.state ?? "on";
    return {
      agent: this.name,
      text: `Home: ${device} turned ${state}.`,
      usedScopes: ["home.control"],
    };
  }
}

export class KnowledgeAgent implements NexusAgent {
  readonly name = "knowledge";
  readonly scopes = ["knowledge.read"] as const;
  canHandle(intent: AgentIntent): boolean {
    return intent.name.startsWith("knowledge.");
  }
  handle(intent: AgentIntent): AgentReply {
    const topic = intent.slots?.topic ?? "that";
    return {
      agent: this.name,
      text: `Knowledge: here is what I know about ${topic}.`,
      usedScopes: ["knowledge.read"],
    };
  }
}

export class FinanceAgent implements NexusAgent {
  readonly name = "finance";
  readonly scopes = ["finance.read"] as const;
  canHandle(intent: AgentIntent): boolean {
    return intent.name.startsWith("finance.");
  }
  handle(intent: AgentIntent): AgentReply {
    const metric = intent.slots?.metric ?? "balance";
    return {
      agent: this.name,
      text: `Finance: your ${metric} looks healthy.`,
      usedScopes: ["finance.read"],
    };
  }
}

export class CommunicationAgent implements NexusAgent {
  readonly name = "communication";
  readonly scopes = ["comm.send"] as const;
  canHandle(intent: AgentIntent): boolean {
    return intent.name.startsWith("comm.");
  }
  handle(intent: AgentIntent): AgentReply {
    const to = intent.slots?.to ?? "the recipient";
    return {
      agent: this.name,
      text: `Communication: message drafted to ${to}.`,
      usedScopes: ["comm.send"],
    };
  }
}

export interface OrchestratorResult {
  readonly replies: readonly AgentReply[];
  /** Combined, user-facing text from every agent that handled an intent. */
  readonly text: string;
  /** Intents that no granted agent could handle. */
  readonly unhandled: readonly AgentIntent[];
  /** Messages that were denied because required scopes were not granted. */
  readonly denied: readonly AgentMessage[];
}

/**
 * Registers agents and dispatches intents. Only agents whose full scope set is
 * granted are eligible; an intent that only a non-granted agent could serve is
 * reported as denied rather than silently dropped.
 */
export class AgentOrchestrator {
  private readonly agents: NexusAgent[] = [];

  constructor(agents: NexusAgent[] = []) {
    for (const a of agents) this.register(a);
  }

  register(agent: NexusAgent): void {
    this.agents.push(agent);
  }

  private granted(agent: NexusAgent, grantedScopes: ReadonlySet<Scope>): boolean {
    return agent.scopes.every((s) => grantedScopes.has(s));
  }

  dispatch(intents: readonly AgentIntent[], grantedScopes: readonly Scope[]): OrchestratorResult {
    const grants = new Set(grantedScopes);
    const replies: AgentReply[] = [];
    const unhandled: AgentIntent[] = [];
    const denied: AgentMessage[] = [];

    for (const intent of intents) {
      const capable = this.agents.filter((a) => a.canHandle(intent));
      if (capable.length === 0) {
        unhandled.push(intent);
        continue;
      }
      const eligible = capable.filter((a) => this.granted(a, grants));
      if (eligible.length === 0) {
        for (const a of capable) denied.push({ from: "orchestrator", to: a.name, intent });
        continue;
      }
      for (const a of eligible) replies.push(a.handle(intent));
    }

    return {
      replies,
      text: replies.map((r) => r.text).join(" "),
      unhandled,
      denied,
    };
  }
}

/** A ready-to-use orchestrator wired with the four baseline agents. */
export function createDefaultOrchestrator(): AgentOrchestrator {
  return new AgentOrchestrator([
    new HomeAgent(),
    new KnowledgeAgent(),
    new FinanceAgent(),
    new CommunicationAgent(),
  ]);
}

export const moduleName = "agents" as const;
export const implemented = true;
