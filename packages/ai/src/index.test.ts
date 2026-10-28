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

  it("makes a real network request using the provided API key", async () => {
    const p = new OpenAiProvider({ apiKey: "sk-test" });

    // Mock fetch for this test
    const originalFetch = globalThis.fetch;
    let fetchCallCount = 0;
    globalThis.fetch = (async (url: any, options: any) => {
      fetchCallCount++;
      expect(url).toBe("https://api.openai.com/v1/chat/completions");
      expect(options.headers.Authorization).toBe("Bearer sk-test");
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "mock response from openai" } }],
        }),
      };
    }) as any;

    try {
      const res = await p.complete({ messages: [{ role: "user", content: "hi" }] });
      expect(res.text).toBe("mock response from openai");
      expect(fetchCallCount).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("selectProvider", () => {
  it("returns OpenAiProvider when a key is present", () => {
    expect(selectProvider({ provider: "openai", openaiApiKey: "sk-x" }).name).toBe("openai");
  });

  it("falls back to the mock provider without credentials", () => {
    expect(selectProvider({ provider: "openai" }).name).toBe("mock");
  });

  it("returns LocalOllamaProvider for local provider since it uses localhost", () => {
    expect(selectProvider({ provider: "local" }).name).toBe("local-ollama");
  });
});
