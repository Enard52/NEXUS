import { describe, expect, it } from "vitest";
import { skillsInfo, moduleName } from "./index.js";

describe("@nexus/skills", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("skills");
    expect(skillsInfo()).toEqual({ name: "skills", implemented: true });
  });
});
