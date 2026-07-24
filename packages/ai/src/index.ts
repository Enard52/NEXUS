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

  async complete(_request: CompletionRequest): Promise<CompletionResult> {
    void this.#apiKey;
    throw new Error(
      "OpenAiProvider.complete is not wired yet (FAZ 1 dev mode). " +
        "Implement the API call before using a real provider.",
    );
  }
}

export interface SelectProviderInput {
  readonly provider: "openai" | "anthropic" | "local";
  readonly openaiApiKey?: string;
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
  return new MockProvider();
}

export const moduleName = "ai" as const;
export const implemented = true;
