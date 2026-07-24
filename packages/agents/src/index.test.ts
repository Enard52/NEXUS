import { describe, expect, it } from "vitest";
import {
  AgentOrchestrator,
  createDefaultOrchestrator,
  HomeAgent,
  implemented,
  moduleName,
  type AgentIntent,
  type Scope,
} from "./index.js";

const ALL_SCOPES: Scope[] = ["home.control", "knowledge.read", "finance.read", "comm.send"];

describe("@nexus/agents module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("agents");
    expect(implemented).toBe(true);
  });
});

describe("AgentOrchestrator routing (FAZ 7)", () => {
  it("routes each intent to the correct agent and combines the replies", () => {
    const orch = createDefaultOrchestrator();
    const intents: AgentIntent[] = [
      { name: "home.control", slots: { device: "light", state: "off" } },
      { name: "finance.read", slots: { metric: "savings" } },
    ];
    const result = orch.dispatch(intents, ALL_SCOPES);

    expect(result.replies.map((r) => r.agent)).toEqual(["home", "finance"]);
    expect(result.text).toContain("light turned off");
    expect(result.text).toContain("savings");
    expect(result.unhandled).toHaveLength(0);
    expect(result.denied).toHaveLength(0);
  });

  it("denies an intent when the required scope is not granted", () => {
    const orch = createDefaultOrchestrator();
    const result = orch.dispatch([{ name: "finance.read" }], ["home.control"]);

    expect(result.replies).toHaveLength(0);
    expect(result.denied).toHaveLength(1);
    expect(result.denied[0]!.to).toBe("finance");
  });

  it("reports intents that no agent can handle", () => {
    const orch = createDefaultOrchestrator();
    const result = orch.dispatch([{ name: "weather.forecast" }], ALL_SCOPES);
    expect(result.replies).toHaveLength(0);
    expect(result.unhandled).toHaveLength(1);
  });

  it("supports registering additional agents at runtime", () => {
    const orch = new AgentOrchestrator();
    orch.register(new HomeAgent());
    const result = orch.dispatch([{ name: "home.control" }], ["home.control"]);
    expect(result.replies).toHaveLength(1);
    expect(result.replies[0]!.usedScopes).toContain("home.control");
  });
});
