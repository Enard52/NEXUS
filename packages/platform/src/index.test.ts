import { describe, expect, it } from "vitest";
import { platformInfo, moduleName } from "./index.js";

describe("@nexus/platform", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("platform");
    expect(platformInfo()).toEqual({ name: "platform", implemented: true });
  });
});
