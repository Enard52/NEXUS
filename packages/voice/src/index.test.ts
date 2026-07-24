import { describe, expect, it } from "vitest";
import { voiceInfo, moduleName } from "./index.js";

describe("@nexus/voice", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("voice");
    expect(voiceInfo()).toEqual({ name: "voice", implemented: true });
  });
});
