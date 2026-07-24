import { describe, expect, it } from "vitest";
import { legalInfo, moduleName } from "./index.js";

describe("@nexus/legal", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("legal");
    expect(legalInfo()).toEqual({ name: "legal", implemented: true });
  });
});
