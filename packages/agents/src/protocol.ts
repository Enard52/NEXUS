/**
 * NEXUS AI — Multi-Agent Protocol (FAZ 7)
 *
 * Defines the contract every NEXUS agent must fulfill. Unlike the FAZ 1 inline
 * agents (which only have canHandle/plan), the FAZ 7 protocol adds:
 *  - Scoped permissions (what resources an agent can access)
 *  - Structured capabilities (what domains the agent covers)
 *  - Inter-agent messaging (agents can request help from each other)
 *  - Confidence scoring (router picks best agent(s) by score)
 *
 * The Agent Protocol is the foundation for multi-agent routing and consolidation.
 */

// ── Scope & Permissions ───────────────────────────────────────────────────────

/** Resource categories an agent can request access to. */
export type AgentScope =
  | "devices"        // Smart home device control
  | "memory"         // User memory read/write
  | "platform"       // OS-level operations (PC Agent)
  | "network"        // External API calls
  | "personalization"// User preferences
  | "security"       // Security system access
  | "finance"        // Financial data access
  | "knowledge"      // Knowledge base queries
  | "routines";      // Routines & scenes

/** Permissions granted to an agent based on its declared scopes. */
export interface AgentPermissions {
  readonly scopes: readonly AgentScope[];
  /** Whether the agent can delegate to other agents. */
  readonly canDelegate: boolean;
  /** Maximum risk level this agent can execute without escalation. */
  readonly maxRiskLevel: "low" | "medium" | "high" | "critical";
}

// ── Agent Capabilities ────────────────────────────────────────────────────────

/** Describes what an agent is good at — used by the router for selection. */
export interface AgentCapability {
  /** Domain this capability belongs to (e.g. "home", "finance", "knowledge"). */
  readonly domain: string;
  /** Specific intents this capability covers (supports prefix wildcards). */
  readonly intents: readonly string[];
  /** Keywords that help the router match natural language to this agent. */
  readonly keywords: readonly string[];
}

// ── Agent Messages ────────────────────────────────────────────────────────────

/** Message sent between agents or from the router to an agent. */
export interface AgentMessage {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly type: "request" | "response" | "delegate" | "notify";
  readonly intent: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: string;
}

/** Result of an agent processing a message. */
export interface AgentResult {
  /** Text response for the user. */
  readonly text: string;
  /** Structured actions the agent wants to execute. */
  readonly actions: readonly AgentAction[];
  /** Confidence score (0-1) for this result. */
  readonly confidence: number;
  /** If the agent wants to delegate part of the work. */
  readonly delegations?: readonly AgentDelegation[];
  /** Metadata for audit/debugging. */
  readonly metadata?: Record<string, unknown>;
}

/** An action the agent wants to perform. */
export interface AgentAction {
  readonly kind: string;
  readonly params: Record<string, unknown>;
  readonly risk: "low" | "medium" | "high" | "critical";
  readonly description: string;
}

/** Request to delegate a sub-task to another agent. */
export interface AgentDelegation {
  readonly targetAgent: string;
  readonly intent: string;
  readonly payload: Record<string, unknown>;
  readonly reason: string;
}

// ── Agent Interface ───────────────────────────────────────────────────────────

/** Context provided to an agent when processing a request. */
export interface MultiAgentContext {
  readonly userId: string;
  readonly language: string;
  readonly timeOfDay: string;
  /** Send a message to another agent (inter-agent communication). */
  readonly sendMessage: (to: string, intent: string, payload: Record<string, unknown>) => Promise<AgentResult | undefined>;
}

/**
 * The multi-agent protocol. Every FAZ 7+ agent implements this interface.
 * It extends beyond the simple FAZ 1 canHandle/plan with scoring, scoping,
 * and structured messaging.
 */
export interface NexusAgent {
  /** Unique identifier for this agent. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Description of what this agent does. */
  readonly description: string;
  /** Icon identifier for UI. */
  readonly icon: string;
  /** Status indicator. */
  readonly status: "active" | "sleeping" | "learning";
  /** Declared permissions/scopes. */
  readonly permissions: AgentPermissions;
  /** What this agent can handle. */
  readonly capabilities: readonly AgentCapability[];

  /**
   * Score how well this agent can handle the given intent (0-1).
   * 0 = cannot handle, 1 = perfect match.
   * The router uses this for multi-agent selection.
   */
  score(intent: string, slots: Record<string, unknown>): number;

  /**
   * Process a request and return a result.
   * The agent should only use resources within its declared scopes.
   */
  handle(intent: string, slots: Record<string, unknown>, ctx: MultiAgentContext): Promise<AgentResult>;
}

// ── Agent Router ──────────────────────────────────────────────────────────────

/** Configuration for the multi-agent router. */
export interface RouterConfig {
  /** Minimum score for an agent to be considered (default 0.1). */
  readonly minScore?: number;
  /** Maximum agents to invoke for a single request (default 3). */
  readonly maxAgents?: number;
  /** Whether to merge results from multiple agents (default true). */
  readonly mergeResults?: boolean;
}

/** Result of multi-agent routing — may combine outputs from multiple agents. */
export interface RoutedResult {
  /** Combined text response. */
  readonly text: string;
  /** All actions from all participating agents. */
  readonly actions: readonly AgentAction[];
  /** Which agents participated. */
  readonly agents: readonly string[];
  /** Per-agent results for detailed inspection. */
  readonly results: ReadonlyMap<string, AgentResult>;
  /** Any delegations that were processed. */
  readonly delegations: readonly { from: string; to: string; result?: AgentResult }[];
}

/**
 * The multi-agent router: scores all registered agents, selects the best,
 * processes their results, handles delegations, and consolidates.
 */
export class AgentRouter {
  private readonly agents = new Map<string, NexusAgent>();
  private readonly config: Required<RouterConfig>;

  constructor(config: RouterConfig = {}) {
    this.config = {
      minScore: config.minScore ?? 0.1,
      maxAgents: config.maxAgents ?? 3,
      mergeResults: config.mergeResults ?? true,
    };
  }

  /** Register an agent with the router. */
  register(agent: NexusAgent): void {
    this.agents.set(agent.id, agent);
  }

  /** Unregister an agent. */
  unregister(id: string): boolean {
    return this.agents.delete(id);
  }

  /** Get a registered agent by ID. */
  get(id: string): NexusAgent | undefined {
    return this.agents.get(id);
  }

  /** List all registered agents. */
  list(): readonly NexusAgent[] {
    return [...this.agents.values()];
  }

  /** List agents that are currently active. */
  listActive(): readonly NexusAgent[] {
    return [...this.agents.values()].filter((a) => a.status === "active");
  }

  /**
   * Route an intent to the appropriate agent(s), execute, handle delegations,
   * and consolidate results.
   */
  async route(
    intent: string,
    slots: Record<string, unknown>,
    ctx: MultiAgentContext,
  ): Promise<RoutedResult> {
    // Score all active agents
    const scored = this.listActive()
      .map((agent) => ({ agent, score: agent.score(intent, slots) }))
      .filter((s) => s.score >= this.config.minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxAgents);

    if (scored.length === 0) {
      return {
        text: "No agent available to handle this request.",
        actions: [],
        agents: [],
        results: new Map(),
        delegations: [],
      };
    }

    // Build inter-agent messaging context
    const sendMessage = async (to: string, msgIntent: string, payload: Record<string, unknown>) => {
      const target = this.agents.get(to);
      if (!target || target.status !== "active") return undefined;
      return target.handle(msgIntent, payload, { ...ctx, sendMessage });
    };
    const routingCtx: MultiAgentContext = { ...ctx, sendMessage };

    // Execute top agent(s)
    const results = new Map<string, AgentResult>();
    const delegations: { from: string; to: string; result?: AgentResult }[] = [];

    // Primary agent always runs
    const primary = scored[0]!;
    const primaryResult = await primary.agent.handle(intent, slots, routingCtx);
    results.set(primary.agent.id, primaryResult);

    // Handle delegations from primary
    if (primaryResult.delegations) {
      for (const del of primaryResult.delegations) {
        const targetAgent = this.agents.get(del.targetAgent);
        if (targetAgent && targetAgent.status === "active") {
          const delResult = await targetAgent.handle(del.intent, del.payload, routingCtx);
          results.set(targetAgent.id, delResult);
          delegations.push({ from: primary.agent.id, to: del.targetAgent, result: delResult });
        } else {
          delegations.push({ from: primary.agent.id, to: del.targetAgent });
        }
      }
    }

    // If merging enabled and secondary agents scored high enough, run them too
    if (this.config.mergeResults && scored.length > 1) {
      for (const { agent } of scored.slice(1)) {
        // Only run secondary if score is within 30% of primary
        if (scored[0]!.score - agent.score(intent, slots) <= 0.3) {
          const result = await agent.handle(intent, slots, routingCtx);
          if (result.confidence > 0.5) {
            results.set(agent.id, result);
          }
        }
      }
    }

    // Consolidate
    return this.consolidate(results, delegations);
  }

  /** Merge results from multiple agents into a single response. */
  private consolidate(
    results: Map<string, AgentResult>,
    delegations: { from: string; to: string; result?: AgentResult }[],
  ): RoutedResult {
    const entries = [...results.entries()].sort(
      (a, b) => b[1].confidence - a[1].confidence,
    );

    if (entries.length === 0) {
      return { text: "", actions: [], agents: [], results, delegations };
    }

    // Primary response text comes from highest-confidence agent
    const primaryText = entries[0]![1].text;

    // Collect supplementary notes from other agents
    const supplements = entries
      .slice(1)
      .filter(([, r]) => r.text && r.confidence > 0.5)
      .map(([id, r]) => `[${id}] ${r.text}`);

    const text = supplements.length > 0
      ? `${primaryText}\n\n${supplements.join("\n")}`
      : primaryText;

    // Merge all actions
    const actions = entries.flatMap(([, r]) => r.actions);

    return {
      text,
      actions,
      agents: entries.map(([id]) => id),
      results,
      delegations,
    };
  }
}

// ── Utility: generate unique message IDs ──────────────────────────────────────

let msgSeq = 0;
export function createMessageId(): string {
  return `msg_${Date.now()}_${++msgSeq}`;
}

/** Reset message sequence (for testing). */
export function __resetMessageSeq(): void {
  msgSeq = 0;
}
