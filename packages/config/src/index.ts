/**
 * NEXUS AI — Configuration & secrets
 *
 * Loads configuration from `.env` (if present) and `process.env`, validates it,
 * and exposes a typed, immutable config object. Secrets are wrapped so they are
 * never accidentally serialized into logs or error output.
 *
 * Zero runtime dependencies on purpose: must boot with a single install.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type NodeEnv = "development" | "test" | "production";
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export type AiProvider = "openai" | "anthropic" | "local";

/**
 * A value that must not leak. `toString`/`toJSON` are masked; call `.reveal()`
 * only at the trust boundary that actually needs the raw secret.
 */
export class Secret {
  #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  reveal(): string {
    return this.#value;
  }
  get isSet(): boolean {
    return this.#value.length > 0;
  }
  toString(): string {
    return "[secret]";
  }
  toJSON(): string {
    return "[secret]";
  }
}

export interface AppConfig {
  readonly env: NodeEnv;
  readonly logLevel: LogLevel;
  readonly serviceName: string;
  readonly heartbeatMs: number;
  readonly ai: {
    readonly provider: AiProvider;
    readonly openaiApiKey: Secret;
  };
}

export class ConfigError extends Error {
  constructor(issues: string[]) {
    super(`Invalid configuration:\n- ${issues.join("\n- ")}`);
    this.name = "ConfigError";
  }
}

/** Minimal `.env` parser (KEY=VALUE, `#` comments, optional quotes). */
export function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadDotEnvFile(cwd: string): Record<string, string> {
  try {
    return parseDotEnv(readFileSync(resolve(cwd, ".env"), "utf8"));
  } catch {
    // No .env file — rely on process.env only.
    return {};
  }
}

function oneOf<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
  key: string,
  issues: string[],
): T {
  if (raw === undefined || raw === "") return fallback;
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  issues.push(`${key} must be one of ${allowed.join(", ")} (got "${raw}")`);
  return fallback;
}

function intInRange(
  raw: string | undefined,
  fallback: number,
  min: number,
  key: string,
  issues: string[],
): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) {
    issues.push(`${key} must be an integer >= ${min} (got "${raw}")`);
    return fallback;
  }
  return n;
}

export interface LoadConfigOptions {
  /** Directory to look for `.env` in. Defaults to process.cwd(). */
  cwd?: string;
  /** Explicit source overrides (used in tests). Defaults to process.env. */
  source?: Record<string, string | undefined>;
}

/**
 * Load, validate and freeze the application configuration.
 * Throws {@link ConfigError} listing every problem at once.
 */
export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
  const cwd = options.cwd ?? process.cwd();
  const fileEnv = options.source ? {} : loadDotEnvFile(cwd);
  const env = { ...fileEnv, ...(options.source ?? process.env) };

  const issues: string[] = [];

  const nodeEnv = oneOf<NodeEnv>(
    env.NODE_ENV,
    ["development", "test", "production"],
    "development",
    "NODE_ENV",
    issues,
  );
  const logLevel = oneOf<LogLevel>(
    env.LOG_LEVEL,
    ["trace", "debug", "info", "warn", "error", "fatal"],
    "info",
    "LOG_LEVEL",
    issues,
  );
  const provider = oneOf<AiProvider>(
    env.AI_PROVIDER,
    ["openai", "anthropic", "local"],
    "openai",
    "AI_PROVIDER",
    issues,
  );

  const config: AppConfig = {
    env: nodeEnv,
    logLevel,
    serviceName: env.NEXUS_SERVICE_NAME?.trim() || "nexus-core",
    heartbeatMs: intInRange(env.NEXUS_HEARTBEAT_MS, 15000, 0, "NEXUS_HEARTBEAT_MS", issues),
    ai: {
      provider,
      openaiApiKey: new Secret(env.OPENAI_API_KEY ?? ""),
    },
  };

  if (issues.length > 0) throw new ConfigError(issues);
  return Object.freeze(config);
}
