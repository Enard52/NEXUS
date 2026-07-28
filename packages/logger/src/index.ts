/**
 * NEXUS AI — Structured logging
 *
 * A dependency-free structured logger. It emits machine-readable JSON in
 * production and a compact human-readable line in development, and it redacts
 * known-sensitive fields so secrets never reach the logs.
 *
 * Later phases can swap the sink (e.g. to a hosted log pipeline)
 * without changing call sites, because everything goes through `Logger`.
 */

export const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

/** Field names that must never be printed in clear text. */
const SENSITIVE_KEYS = new Set(
  [
    "password",
    "pass",
    "secret",
    "token",
    "apikey",
    "api_key",
    "accesstoken",
    "access_token",
    "refreshtoken",
    "refresh_token",
    "authorization",
    "cookie",
    "creditcard",
    "card",
    "cvv",
  ].map((k) => k.toLowerCase()),
);

const REDACTED = "[REDACTED]";

export type LogFields = Record<string, unknown>;

export interface LoggerOptions {
  /** Service/component name attached to every record. */
  name: string;
  /** Minimum level to emit. Defaults to "info". */
  level?: LogLevel;
  /** Pretty single-line output for humans. Defaults to true unless NODE_ENV=production. */
  pretty?: boolean;
  /** Base fields merged into every record (e.g. environment, version). */
  base?: LogFields;
  /** Sink for the serialized record. Defaults to console. */
  sink?: (level: LogLevel, line: string) => void;
}

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value as object)) return "[Circular]";
  seen.add(value as object);

  if (Array.isArray(value)) return value.map((v) => redact(v, seen));
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  const out: LogFields = {};
  for (const [key, val] of Object.entries(value as LogFields)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(val, seen);
  }
  return out;
}

function defaultSink(level: LogLevel, line: string): void {
  if (level === "error" || level === "fatal") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") console.log(line);
  }
}

export class Logger {
  private readonly name: string;
  private readonly minWeight: number;
  private readonly pretty: boolean;
  private readonly base: LogFields;
  private readonly sink: (level: LogLevel, line: string) => void;

  constructor(options: LoggerOptions) {
    this.name = options.name;
    this.minWeight = LEVEL_WEIGHT[options.level ?? "info"];
    this.pretty = options.pretty ?? process.env.NODE_ENV !== "production";
    this.base = options.base ?? {};
    this.sink = options.sink ?? defaultSink;
  }

  /** Create a sub-logger that inherits config and adds bound fields. */
  child(name: string, fields: LogFields = {}): Logger {
    return new Logger({
      name: `${this.name}:${name}`,
      level: (Object.keys(LEVEL_WEIGHT) as LogLevel[]).find(
        (l) => LEVEL_WEIGHT[l] === this.minWeight,
      ),
      pretty: this.pretty,
      base: { ...this.base, ...fields },
      sink: this.sink,
    });
  }

  private write(level: LogLevel, msg: string, fields?: LogFields): void {
    if (LEVEL_WEIGHT[level] < this.minWeight) return;

    const record = {
      time: new Date().toISOString(),
      level,
      name: this.name,
      msg,
      ...(redact(this.base) as LogFields),
      ...((fields ? (redact(fields) as LogFields) : {}) as LogFields),
    };

    if (this.pretty) {
      const { time, ...rest } = record;
      const extras = Object.entries(rest)
        .filter(([k]) => !["level", "name", "msg"].includes(k))
        .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join(" ");
      this.sink(
        level,
        `${time} ${level.toUpperCase().padEnd(5)} [${record.name}] ${msg}${
          extras ? ` ${extras}` : ""
        }`,
      );
    } else {
      this.sink(level, JSON.stringify(record));
    }
  }

  trace(msg: string, fields?: LogFields): void {
    this.write("trace", msg, fields);
  }
  debug(msg: string, fields?: LogFields): void {
    this.write("debug", msg, fields);
  }
  info(msg: string, fields?: LogFields): void {
    this.write("info", msg, fields);
  }
  warn(msg: string, fields?: LogFields): void {
    this.write("warn", msg, fields);
  }
  error(msg: string, fields?: LogFields): void {
    this.write("error", msg, fields);
  }
  fatal(msg: string, fields?: LogFields): void {
    this.write("fatal", msg, fields);
  }
}

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}
