import { describe, expect, it } from "vitest";
import { supportInfo, moduleName } from "./index.js";

describe("@nexus/support", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("support");
    expect(supportInfo()).toEqual({ name: "support", implemented: true });
  });
});
