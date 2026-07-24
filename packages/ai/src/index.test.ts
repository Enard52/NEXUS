import { describe, expect, it } from "vitest";
import { MockProvider, OpenAiProvider, selectProvider } from "./index.js";

describe("MockProvider", () => {
  it("echoes the last user message deterministically", async () => {
    const p = new MockProvider();
    const res = await p.complete({
      messages: [
        { role: "system", content: "be nice" },
        { role: "user", content: "hello" },
      ],
    });
    expect(res).toEqual({ text: "mock: hello", provider: "mock", model: "mock-1" });
  });
});

describe("OpenAiProvider", () => {
  it("requires a non-empty api key", () => {
    expect(() => new OpenAiProvider({ apiKey: "" })).toThrow(/non-empty apiKey/);
  });

  it("does not fake a completion in FAZ 1 dev mode", async () => {
    const p = new OpenAiProvider({ apiKey: "sk-test" });
    await expect(p.complete({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(
      /not wired yet/,
    );
  });
});

describe("selectProvider", () => {
  it("returns OpenAiProvider when a key is present", () => {
    expect(selectProvider({ provider: "openai", openaiApiKey: "sk-x" }).name).toBe("openai");
  });

  it("falls back to the mock provider without credentials", () => {
    expect(selectProvider({ provider: "openai" }).name).toBe("mock");
    expect(selectProvider({ provider: "local" }).name).toBe("mock");
  });
});
