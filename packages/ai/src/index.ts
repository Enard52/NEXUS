/**
 * NEXUS AI — AI Adapter (FAZ 1)
 *
 * A provider-agnostic interface so the rest of NEXUS never depends on a specific
 * vendor. FAZ 1 develops against a single provider (OpenAI was chosen), but all
 * calls go through `AiProvider`, so adding Anthropic/local models later is a new
 * implementation, not a rewrite.
 *
 * The `MockProvider` gives deterministic, offline behavior for dev mode and
 * tests (no API key required). The `OpenAiProvider` is a thin stub whose network
 * wiring is deferred until a real key is supplied — it must never fake success.
 */

export interface AiMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface CompletionRequest {
  readonly messages: readonly AiMessage[];
  /** 0..1 sampling temperature (advisory; mock ignores it). */
  readonly temperature?: number;
}

export interface CompletionResult {
  readonly text: string;
  readonly provider: string;
  readonly model: string;
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

/**
 * Deterministic offline provider. Echoes a compact, testable response derived
 * from the last user message. Used whenever no real credentials are configured.
 */
export class MockProvider implements AiProvider {
  readonly name = "mock";
  readonly model = "mock-1";

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const text = lastUser ? `mock: ${lastUser.content}` : "mock: (no input)";
    return { text, provider: this.name, model: this.model };
  }
}

export interface OpenAiProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
}

/**
 * OpenAI-backed provider. FAZ 1 keeps the network call unimplemented on purpose:
 * per roadmap rule #8 we do not simulate a real provider. Once wired, replace the
 * throw with an SDK/fetch call. Construction still requires a non-empty key.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  readonly model: string;
  readonly #apiKey: string;

  constructor(options: OpenAiProviderOptions) {
    if (!options.apiKey) {
      throw new Error("OpenAiProvider requires a non-empty apiKey");
    }
    this.#apiKey = options.apiKey;
    this.model = options.model ?? "gpt-4o-mini";
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API failed: ${response.status} ${errorBody}`);
    }

    const data = (await response.json()) as any;
    const text = data.choices?.[0]?.message?.content || "";

    return { text, provider: this.name, model: this.model };
  }
}

export interface LocalOllamaProviderOptions {
  readonly baseUrl?: string;
  readonly model?: string;
}

/**
 * Local Ollama-backed provider. Enables 100% on-device, offline NLP.
 * Connects to a local Ollama instance (default: http://127.0.0.1:11434).
 */
export class LocalOllamaProvider implements AiProvider {
  readonly name = "local-ollama";
  readonly model: string;
  readonly #baseUrl: string;

  constructor(options?: LocalOllamaProviderOptions) {
    this.#baseUrl = options?.baseUrl ?? "http://127.0.0.1:11434";
    this.model = options?.model ?? "llama3";
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const response = await fetch(`${this.#baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.7,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API failed: ${response.status} ${errorBody}`);
    }

    const data = (await response.json()) as any;
    const text = data.message?.content || "";

    return { text, provider: this.name, model: this.model };
  }
}

export interface SelectProviderInput {
  readonly provider: "openai" | "anthropic" | "local";
  readonly openaiApiKey?: string;
  readonly localBaseUrl?: string;
}

/**
 * Choose a provider for dev mode. Falls back to the deterministic MockProvider
 * whenever the selected provider lacks the credentials it needs, so the system
 * always boots — but it never pretends the real provider ran.
 */
export function selectProvider(input: SelectProviderInput): AiProvider {
  if (input.provider === "openai" && input.openaiApiKey) {
    return new OpenAiProvider({ apiKey: input.openaiApiKey });
  }
  if (input.provider === "local") {
    return new LocalOllamaProvider({ baseUrl: input.localBaseUrl });
  }
  return new MockProvider();
}

export const moduleName = "ai" as const;
export const implemented = true;
