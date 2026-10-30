# Free OpenAI-compatible AI providers

A community-maintained list of providers that offer a free tier on an OpenAI-compatible chat endpoint.
The machine-readable copy is [`ai-providers.json`](ai-providers.json) (validated by `packages/web/src/ai-providers.test.ts`).

**Last verified: 2026-10-30**, against each provider's own documentation (links below). Free tiers change often; if something here is stale, open a PR.
Never put API keys in this repo. Entries only link to where a user creates their own key.

## How the NEXUS assistant uses providers

The chat worker ([`cloudflare-worker/nexus-ai`](../cloudflare-worker/nexus-ai/src/index.js)) tries Cloudflare Workers AI first, then a fixed fallback chain: **Groq → Gemini → OpenRouter**.
A provider is skipped silently when its key is not set; if none answers, the worker returns 503 and the app says the assistant is unavailable.

For the three chain providers you can, as the operator of your own worker:

```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GROQ_MODEL    # optional: override the default model
```

The same pattern applies to `GEMINI_API_KEY` / `GEMINI_MODEL` and `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`.

**What is not supported yet:** the app and worker have no user-configurable base URL. Providers outside the chain need a code change (add an entry to `FALLBACKS` in the worker). The registry is therefore a reference, not something the settings UI reads.

## Providers

| Provider | Base URL | Get a key | Default model in worker |
| --- | --- | --- | --- |
| Groq | `https://api.groq.com/openai/v1` | <https://console.groq.com/keys> | `openai/gpt-oss-120b` |
| Google Gemini API | `https://generativelanguage.googleapis.com/v1beta/openai/` | <https://aistudio.google.com/apikey> | `gemini-3.5-flash` |
| OpenRouter | `https://openrouter.ai/api/v1` | <https://openrouter.ai/keys> | `meta-llama/llama-3.3-70b-instruct:free` |

### Free-tier terms as published

- **Groq**: has a "Free Plan"; the exact limits are only shown in your console (Settings > Limits), so none are quoted here. Source: <https://console.groq.com/docs/rate-limits>.
- **Gemini**: the pricing page lists models such as Gemini 2.5 Flash / Flash-Lite as "Free of charge" on the Free Tier. It states that on the Free Tier content is used to improve Google's products, and not on the paid tier. Request limits are shown in AI Studio. Sources: <https://ai.google.dev/gemini-api/docs/pricing>, <https://ai.google.dev/gemini-api/docs/rate-limits>.
- **OpenRouter**: `:free` models are limited to 20 requests/minute and 50 requests/day (1000/day once you have purchased enough credits). Source: <https://openrouter.ai/docs/api-reference/limits>.

### Caveats

- Free tiers can be withdrawn or changed without notice.
- Do not route private data through free tiers that train on or log prompts (Gemini free tier, free OpenRouter models).
- Reasoning models use part of `max_tokens` for thinking; the worker sets 600 for this reason.

## Considered but not listed

- **Cerebras**: its limits page describes a Free Trial of $5 in credits that expire after 30 days and says there is no permanently free tier.
- **Mistral**: the free-tier terms could not be verified from its public docs on the verification date.

## Adding a provider

1. Verify the free tier on the provider's own documentation; link it. Drop anything you cannot verify.
2. Add an entry to `ai-providers.json` (https URLs only, no keys), update the table here and the verification date.
3. Run `npx vitest run packages/web/src/ai-providers.test.ts`.
