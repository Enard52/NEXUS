import { describe, expect, it } from "vitest";
import { agentsInfo, moduleName } from "./index.js";

describe("@nexus/agents", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("agents");
    expect(agentsInfo()).toEqual({ name: "agents", implemented: true });
  });
});
