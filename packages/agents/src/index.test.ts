/**
 * NEXUS AI — Multi-Agent System Tests
 *
 * Tests for: Agent Protocol, Router, Specialized Agents, Delegation,
 * Scoring, Scope permissions, and multi-agent consolidation.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { agentsInfo, moduleName } from "./index.js";
import { AgentRouter, type MultiAgentContext, __resetMessageSeq } from "./protocol.js";
import {
  MultiHomeAgent,
  LifeAgent,
  KnowledgeAgent,
  SecurityAgent,
  FinanceAgent,
} from "./specialized.js";

// ── Module Identity ───────────────────────────────────────────────────────────

describe("@nexus/agents module identity", () => {
  it("exposes correct module name", () => {
    expect(moduleName).toBe("agents");
  });

  it("reports itself as implemented", () => {
    expect(agentsInfo()).toEqual({ name: "agents", implemented: true });
  });
});

// ── Agent Scoring ─────────────────────────────────────────────────────────────

describe("Agent scoring", () => {
  const home = new MultiHomeAgent();
  const life = new LifeAgent();
  const knowledge = new KnowledgeAgent();
  const security = new SecurityAgent();
  const finance = new FinanceAgent();

  it("HomeAgent scores high for home intents", () => {
    expect(home.score("home.control", {})).toBeGreaterThan(0.9);
    expect(home.score("device.brightness", {})).toBeGreaterThan(0.9);
    expect(home.score("scene.movie", {})).toBeGreaterThan(0.9);
  });

  it("HomeAgent scores for keyword matches", () => {
    expect(home.score("chitchat", { text: "turn on the light" })).toBeGreaterThan(0.5);
    expect(home.score("chitchat", { text: "what time is it" })).toBe(0);
  });

  it("LifeAgent scores high for life intents", () => {
    expect(life.score("life.morning_briefing", {})).toBeGreaterThan(0.8);
    expect(life.score("reminder.set", {})).toBeGreaterThan(0.8);
  });

  it("LifeAgent scores for wellness keywords", () => {
    expect(life.score("chitchat", { text: "remind me to drink water" })).toBeGreaterThan(0.5);
    expect(life.score("chitchat", { text: "I need a break" })).toBeGreaterThan(0.5);
  });

  it("KnowledgeAgent scores high for knowledge intents", () => {
    expect(knowledge.score("knowledge.query", {})).toBeGreaterThan(0.8);
    expect(knowledge.score("calculate.math", {})).toBeGreaterThan(0.8);
  });

  it("KnowledgeAgent scores for math expressions", () => {
    expect(knowledge.score("chitchat", { text: "what is 5 + 3" })).toBeGreaterThan(0.7);
    expect(knowledge.score("chitchat", { text: "25 * 4" })).toBeGreaterThan(0.7);
  });

  it("SecurityAgent scores high for security intents", () => {
    expect(security.score("security.arm", {})).toBeGreaterThan(0.9);
    expect(security.score("lock.door", {})).toBeGreaterThan(0.9);
  });

  it("SecurityAgent scores for security keywords", () => {
    expect(security.score("chitchat", { text: "lock the front door" })).toBeGreaterThan(0.6);
  });

  it("FinanceAgent scores high for finance intents", () => {
    expect(finance.score("finance.add_expense", {})).toBeGreaterThan(0.8);
    expect(finance.score("budget.set", {})).toBeGreaterThan(0.8);
  });

  it("FinanceAgent scores for money keywords", () => {
    expect(finance.score("chitchat", { text: "I spent $50 on groceries" })).toBeGreaterThan(0.3);
  });

  it("agents score 0 for unrelated intents", () => {
    expect(home.score("finance.summary", {})).toBe(0);
    expect(finance.score("security.arm", {})).toBe(0);
    expect(security.score("life.hydration", {})).toBe(0);
  });
});

// ── Agent Router ──────────────────────────────────────────────────────────────

describe("AgentRouter", () => {
  let router: AgentRouter;
  const mockCtx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "day",
    sendMessage: async () => undefined,
  };

  beforeEach(() => {
    __resetMessageSeq();
    router = new AgentRouter();
    router.register(new MultiHomeAgent());
    router.register(new LifeAgent());
    router.register(new KnowledgeAgent());
    router.register(new SecurityAgent());
    router.register(new FinanceAgent());
  });

  it("registers and lists agents", () => {
    expect(router.list()).toHaveLength(5);
    expect(router.listActive()).toHaveLength(5);
  });

  it("routes home intent to HomeAgent", async () => {
    const result = await router.route("home.control", { room: "living", state: "on" }, mockCtx);
    expect(result.agents).toContain("home");
    expect(result.text).toContain("living");
  });

  it("routes security intent to SecurityAgent", async () => {
    const result = await router.route("security.arm", {}, mockCtx);
    expect(result.agents).toContain("security");
    expect(result.text).toContain("armed");
  });

  it("routes knowledge/math to KnowledgeAgent", async () => {
    const result = await router.route("calculate.math", { text: "15 + 27" }, mockCtx);
    expect(result.agents).toContain("knowledge");
    expect(result.text).toContain("42");
  });

  it("routes finance intent to FinanceAgent", async () => {
    const result = await router.route(
      "finance.add_expense",
      { amount: 50, category: "food", description: "lunch" },
      mockCtx,
    );
    expect(result.agents).toContain("finance");
    expect(result.text).toContain("50");
  });

  it("routes life intent to LifeAgent", async () => {
    const result = await router.route("life.hydration", {}, mockCtx);
    expect(result.agents).toContain("life");
    expect(result.text).toContain("Hydration");
  });

  it("returns no-agent message for unknown intents", async () => {
    const result = await router.route("completely.unknown.intent", {}, mockCtx);
    expect(result.agents).toHaveLength(0);
    expect(result.text).toContain("No agent");
  });

  it("unregister removes an agent", async () => {
    router.unregister("finance");
    expect(router.list()).toHaveLength(4);
    const result = await router.route("finance.summary", {}, mockCtx);
    expect(result.agents).not.toContain("finance");
  });

  it("get retrieves a specific agent", () => {
    expect(router.get("home")?.id).toBe("home");
    expect(router.get("nonexistent")).toBeUndefined();
  });
});

// ── Inter-Agent Delegation ────────────────────────────────────────────────────

describe("Inter-agent delegation", () => {
  let router: AgentRouter;
  const mockCtx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "morning",
    sendMessage: async () => undefined,
  };

  beforeEach(() => {
    router = new AgentRouter();
    router.register(new MultiHomeAgent());
    router.register(new LifeAgent());
    router.register(new KnowledgeAgent());
    router.register(new SecurityAgent());
    router.register(new FinanceAgent());
  });

  it("LifeAgent delegates morning scene to HomeAgent", async () => {
    const result = await router.route("life.morning_briefing", {}, mockCtx);
    expect(result.agents).toContain("life");
    expect(result.delegations.length).toBeGreaterThan(0);
    expect(result.delegations[0]!.from).toBe("life");
    expect(result.delegations[0]!.to).toBe("home");
    expect(result.delegations[0]!.result).toBeDefined();
  });

  it("LifeAgent sleep mode delegates to HomeAgent for lights", async () => {
    const result = await router.route("life.sleep", { text: "time to sleep" }, mockCtx);
    expect(result.agents).toContain("life");
    expect(result.delegations.some((d) => d.to === "home")).toBe(true);
  });
});

// ── Specialized Agent Functionality ───────────────────────────────────────────

describe("KnowledgeAgent calculations", () => {
  const knowledge = new KnowledgeAgent();
  const ctx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "day",
    sendMessage: async () => undefined,
  };

  it("evaluates addition", async () => {
    const r = await knowledge.handle("calculate.math", { text: "100 + 200" }, ctx);
    expect(r.text).toContain("300");
    expect(r.confidence).toBeGreaterThan(0.9);
  });

  it("evaluates multiplication", async () => {
    const r = await knowledge.handle("calculate.math", { text: "7 * 8" }, ctx);
    expect(r.text).toContain("56");
  });

  it("evaluates division", async () => {
    const r = await knowledge.handle("calculate.math", { text: "100 / 4" }, ctx);
    expect(r.text).toContain("25");
  });

  it("handles temperature conversion", async () => {
    const r = await knowledge.handle(
      "knowledge.convert",
      { text: "100 celsius to fahrenheit" },
      ctx,
    );
    expect(r.text).toContain("212");
  });

  it("handles distance conversion", async () => {
    const r = await knowledge.handle("knowledge.convert", { text: "10 km to mile" }, ctx);
    expect(r.text).toContain("6.21");
  });
});

describe("SecurityAgent state management", () => {
  const security = new SecurityAgent();
  const ctx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "day",
    sendMessage: async () => undefined,
  };

  it("arms and disarms the system", async () => {
    expect(security.isArmed()).toBe(false);

    await security.handle("security.arm", {}, ctx);
    expect(security.isArmed()).toBe(true);

    const status = await security.handle("security.status", {}, ctx);
    expect(status.text).toContain("ARMED");

    await security.handle("security.disarm", {}, ctx);
    expect(security.isArmed()).toBe(false);
  });

  it("locks doors with confirmation action", async () => {
    const r = await security.handle("security.lock", { target: "garage door" }, ctx);
    expect(r.text).toContain("garage door");
    expect(r.actions).toHaveLength(1);
    expect(r.actions[0]!.kind).toBe("lock.set");
  });
});

describe("FinanceAgent expense tracking", () => {
  const ctx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "day",
    sendMessage: async () => undefined,
  };

  it("records expenses and tracks total", async () => {
    const finance = new FinanceAgent();
    await finance.handle(
      "finance.add_expense",
      { amount: 50, category: "food", description: "lunch" },
      ctx,
    );
    await finance.handle(
      "finance.add_expense",
      { amount: 30, category: "transport", description: "taxi" },
      ctx,
    );

    const summary = await finance.handle("finance.summary", {}, ctx);
    expect(summary.text).toContain("80");
    expect(summary.metadata?.total).toBe(80);
  });

  it("sets budget and shows remaining", async () => {
    const finance = new FinanceAgent();
    await finance.handle("finance.set_budget", { amount: 1000 }, ctx);
    await finance.handle(
      "finance.add_expense",
      { amount: 200, category: "shopping", description: "clothes" },
      ctx,
    );

    const summary = await finance.handle("finance.summary", {}, ctx);
    expect(summary.text).toContain("1000");
    expect(summary.metadata?.remaining).toBe(800);
  });
});

describe("LifeAgent wellness features", () => {
  const life = new LifeAgent();
  const ctx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "morning",
    sendMessage: async () => undefined,
  };

  it("provides morning briefing", async () => {
    const r = await life.handle("life.morning_briefing", {}, ctx);
    expect(r.text).toContain("morning");
    expect(r.confidence).toBeGreaterThan(0.8);
    expect(r.delegations).toHaveLength(1);
  });

  it("sets hydration reminder", async () => {
    const r = await life.handle("life.hydration", {}, ctx);
    expect(r.text).toContain("Hydration");
    expect(r.actions).toHaveLength(1);
    expect(r.actions[0]!.params.intervalMinutes).toBe(120);
  });

  it("sets break reminder", async () => {
    const r = await life.handle("life.break", {}, ctx);
    expect(r.text).toContain("Break");
    expect(r.actions[0]!.params.intervalMinutes).toBe(50);
  });
});

// ── FAZ 7 Bitiş Kriteri: 4+ agents, correct routing, consolidation ───────────

describe("FAZ 7 Bitiş Kriteri", () => {
  let router: AgentRouter;
  const ctx: MultiAgentContext = {
    userId: "u1",
    language: "en",
    timeOfDay: "day",
    sendMessage: async () => undefined,
  };

  beforeEach(() => {
    router = new AgentRouter();
    router.register(new MultiHomeAgent());
    router.register(new LifeAgent());
    router.register(new KnowledgeAgent());
    router.register(new SecurityAgent());
    router.register(new FinanceAgent());
  });

  it("has at least 4 active agents with real functionality", () => {
    const active = router.listActive();
    expect(active.length).toBeGreaterThanOrEqual(4);
    // All have proper protocol fields
    for (const agent of active) {
      expect(agent.id).toBeDefined();
      expect(agent.permissions.scopes.length).toBeGreaterThan(0);
      expect(agent.capabilities.length).toBeGreaterThan(0);
    }
  });

  it("routes different intents to correct agents", async () => {
    const homeResult = await router.route("home.control", { room: "bedroom" }, ctx);
    expect(homeResult.agents[0]).toBe("home");

    const secResult = await router.route("security.arm", {}, ctx);
    expect(secResult.agents[0]).toBe("security");

    const finResult = await router.route("finance.summary", {}, ctx);
    expect(finResult.agents[0]).toBe("finance");

    const lifeResult = await router.route("life.hydration", {}, ctx);
    expect(lifeResult.agents[0]).toBe("life");

    const mathResult = await router.route("calculate.math", { text: "2 + 2" }, ctx);
    expect(mathResult.agents[0]).toBe("knowledge");
  });

  it("consolidates results with delegation across agents", async () => {
    const result = await router.route("life.sleep", { text: "time to sleep" }, ctx);
    // LifeAgent is primary, delegates to HomeAgent
    expect(result.agents).toContain("life");
    expect(result.delegations.length).toBeGreaterThan(0);
    // Primary text comes from LifeAgent
    expect(result.text).toContain("Sleep");
  });
});
