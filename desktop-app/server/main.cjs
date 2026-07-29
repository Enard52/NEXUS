"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var import_node_path8 = require("node:path");
var import_node_url = require("node:url");
var import_node_os = require("node:os");
var import_node_fs4 = require("node:fs");

// ../database/src/sqlite.ts
var import_node_module = require("node:module");
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var import_meta = {};
var require2 = (0, import_node_module.createRequire)(import_meta.url);
var SqliteKeyValueStore = class {
  db;
  /**
   * @param location Absolute file path for the database, or ":memory:" for a
   *   transient store. Parent directories are created automatically.
   */
  constructor(location) {
    if (location !== ":memory:") {
      (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(location), { recursive: true });
    }
    let DatabaseSync;
    try {
      ({ DatabaseSync } = require2("node:sqlite"));
    } catch (err) {
      throw new Error(
        "node:sqlite is unavailable \u2014 the durable store requires Node.js 22.5+ (this runtime lacks it). Original error: " + (err instanceof Error ? err.message : String(err))
      );
    }
    this.db = new DatabaseSync(location);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);");
  }
  get(key) {
    const row = this.db.prepare("SELECT value FROM kv WHERE key = ?").get(key);
    return row ? row.value : void 0;
  }
  set(key, value) {
    this.db.prepare(
      "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(key, value);
  }
  delete(key) {
    const before = this.has(key);
    this.db.prepare("DELETE FROM kv WHERE key = ?").run(key);
    return before;
  }
  has(key) {
    return this.db.prepare("SELECT 1 FROM kv WHERE key = ?").get(key) !== void 0;
  }
  keys(prefix) {
    if (!prefix) {
      const rows2 = this.db.prepare("SELECT key FROM kv ORDER BY key").all();
      return rows2.map((r) => r.key);
    }
    const upper = prefix + "\uFFFF";
    const rows = this.db.prepare("SELECT key FROM kv WHERE key >= ? AND key < ? ORDER BY key").all(prefix, upper);
    return rows.map((r) => r.key);
  }
  /** Release the underlying file handle. */
  close() {
    this.db.close();
  }
};

// ../database/src/index.ts
var InMemoryKeyValueStore = class {
  data = /* @__PURE__ */ new Map();
  get(key) {
    return this.data.get(key);
  }
  set(key, value) {
    this.data.set(key, value);
  }
  delete(key) {
    return this.data.delete(key);
  }
  has(key) {
    return this.data.has(key);
  }
  keys(prefix) {
    const all = [...this.data.keys()];
    const filtered = prefix ? all.filter((k) => k.startsWith(prefix)) : all;
    return filtered.sort();
  }
};

// ../config/src/index.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var Secret = class {
  #value;
  constructor(value) {
    this.#value = value;
  }
  reveal() {
    return this.#value;
  }
  get isSet() {
    return this.#value.length > 0;
  }
  toString() {
    return "[secret]";
  }
  toJSON() {
    return "[secret]";
  }
};
var ConfigError = class extends Error {
  constructor(issues) {
    super(`Invalid configuration:
- ${issues.join("\n- ")}`);
    this.name = "ConfigError";
  }
};
function parseDotEnv(content) {
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}
function loadDotEnvFile(cwd) {
  try {
    return parseDotEnv((0, import_node_fs2.readFileSync)((0, import_node_path2.resolve)(cwd, ".env"), "utf8"));
  } catch {
    return {};
  }
}
function oneOf(raw, allowed, fallback, key, issues) {
  if (raw === void 0 || raw === "") return fallback;
  if (allowed.includes(raw)) return raw;
  issues.push(`${key} must be one of ${allowed.join(", ")} (got "${raw}")`);
  return fallback;
}
function intInRange(raw, fallback, min, key, issues) {
  if (raw === void 0 || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) {
    issues.push(`${key} must be an integer >= ${min} (got "${raw}")`);
    return fallback;
  }
  return n;
}
function loadConfig(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const fileEnv = options.source ? {} : loadDotEnvFile(cwd);
  const env = { ...fileEnv, ...options.source ?? process.env };
  const issues = [];
  const nodeEnv = oneOf(
    env.NODE_ENV,
    ["development", "test", "production"],
    "development",
    "NODE_ENV",
    issues
  );
  const logLevel = oneOf(
    env.LOG_LEVEL,
    ["trace", "debug", "info", "warn", "error", "fatal"],
    "info",
    "LOG_LEVEL",
    issues
  );
  const provider = oneOf(
    env.AI_PROVIDER,
    ["openai", "anthropic", "local"],
    "openai",
    "AI_PROVIDER",
    issues
  );
  const config2 = {
    env: nodeEnv,
    logLevel,
    serviceName: env.NEXUS_SERVICE_NAME?.trim() || "nexus-core",
    heartbeatMs: intInRange(env.NEXUS_HEARTBEAT_MS, 15e3, 0, "NEXUS_HEARTBEAT_MS", issues),
    ai: {
      provider,
      openaiApiKey: new Secret(env.OPENAI_API_KEY ?? "")
    }
  };
  if (issues.length > 0) throw new ConfigError(issues);
  return Object.freeze(config2);
}

// ../memory/src/digital-twin.ts
function resolveLightPlan(twin, room, desiredOn, userId) {
  const device = twin.findByRoomKind(room, "light");
  const ctx = twin.getContext();
  if (!device) {
    return { steps: [], rationale: `No light known in ${room}; nothing to control.` };
  }
  if (!desiredOn) {
    if (!device.on) {
      return { steps: [], rationale: `The ${room} light is already off.` };
    }
    twin.recordHabit("light.off", room, ctx.timeOfDay, void 0, userId);
    return {
      steps: [
        {
          kind: "light.set",
          params: { id: device.id, on: "false" },
          summary: `Turn off ${room} light`
        }
      ],
      rationale: `Turning the ${room} light off.`
    };
  }
  if (device.on) {
    return { steps: [], rationale: `The ${room} light is already on.` };
  }
  const learned = twin.getLearnedBrightness(room, ctx.timeOfDay, 3, userId);
  const dim = ctx.timeOfDay === "evening" || ctx.timeOfDay === "night";
  const brightness = learned ?? (dim ? 30 : 100);
  const source = learned !== void 0 ? "learned" : "time-based";
  twin.recordHabit("light", room, ctx.timeOfDay, brightness, userId);
  return {
    steps: [
      {
        kind: "light.set",
        params: { id: device.id, on: "true", brightness: String(brightness) },
        summary: `Turn on ${room} light at ${brightness}%`
      }
    ],
    rationale: source === "learned" ? `Based on your habit, the ${room} light comes on at ${brightness}% (you usually prefer this at ${ctx.timeOfDay}).` : dim ? `It's ${ctx.timeOfDay}, so the ${room} light comes on gently at ${brightness}%.` : `It's ${ctx.timeOfDay}, so the ${room} light comes on at full ${brightness}%.`
  };
}

// ../memory/src/sqlite.ts
var import_node_module2 = require("node:module");
var import_node_fs3 = require("node:fs");
var import_node_path3 = require("node:path");
var import_meta2 = {};
var require3 = (0, import_node_module2.createRequire)(import_meta2.url);
var SqliteUserMemoryStore = class {
  db;
  windowSize;
  constructor(location, windowSize = 20) {
    if (location !== ":memory:") {
      (0, import_node_fs3.mkdirSync)((0, import_node_path3.dirname)(location), { recursive: true });
    }
    let DatabaseSync;
    try {
      ({ DatabaseSync } = require3("node:sqlite"));
    } catch (err) {
      throw new Error(
        "node:sqlite is unavailable \u2014 the durable store requires Node.js 22.5+ (this runtime lacks it). Original error: " + (err instanceof Error ? err.message : String(err))
      );
    }
    this.db = new DatabaseSync(location);
    this.windowSize = Math.max(1, windowSize);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        userId TEXT PRIMARY KEY,
        personalization TEXT NOT NULL
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        at TEXT NOT NULL
      );
    `);
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_turns_userid ON turns(userId);");
  }
  getProfile(userId) {
    const row = this.db.prepare("SELECT personalization FROM profiles WHERE userId = ?").get(userId);
    if (!row) {
      return { userId, personalization: { ...DEFAULT_PERSONALIZATION } };
    }
    return { userId, personalization: JSON.parse(row.personalization) };
  }
  updatePersonalization(userId, patch) {
    const current = this.getProfile(userId);
    const updated = {
      userId,
      personalization: { ...current.personalization, ...patch }
    };
    this.db.prepare(
      "INSERT INTO profiles (userId, personalization) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET personalization = excluded.personalization"
    ).run(userId, JSON.stringify(updated.personalization));
    return updated;
  }
  remember(userId, turn) {
    const at = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("INSERT INTO turns (userId, role, text, at) VALUES (?, ?, ?, ?)").run(userId, turn.role, turn.text, at);
    this.db.prepare(
      `
      DELETE FROM turns WHERE userId = ? AND id NOT IN (
        SELECT id FROM turns WHERE userId = ? ORDER BY id DESC LIMIT ?
      )
    `
    ).run(userId, userId, this.windowSize);
  }
  recent(userId) {
    const rows = this.db.prepare("SELECT role, text, at FROM turns WHERE userId = ? ORDER BY id ASC").all(userId);
    return rows.map((r) => ({
      role: r.role,
      text: r.text,
      at: r.at
    }));
  }
  close() {
    this.db.close();
  }
};

// ../memory/src/index.ts
var DEFAULT_PERSONALIZATION = {
  assistantName: "NEXUS",
  userAddress: "there",
  tone: "friendly",
  language: "en"
};
var InMemoryUserMemory = class {
  profiles = /* @__PURE__ */ new Map();
  turns = /* @__PURE__ */ new Map();
  windowSize;
  constructor(windowSize = 20) {
    this.windowSize = Math.max(1, windowSize);
  }
  getProfile(userId) {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = { userId, personalization: { ...DEFAULT_PERSONALIZATION } };
      this.profiles.set(userId, profile);
    }
    return profile;
  }
  updatePersonalization(userId, patch) {
    const current = this.getProfile(userId);
    const updated = {
      userId,
      personalization: { ...current.personalization, ...patch }
    };
    this.profiles.set(userId, updated);
    return updated;
  }
  remember(userId, turn) {
    const list = this.turns.get(userId) ?? [];
    list.push({ ...turn, at: (/* @__PURE__ */ new Date()).toISOString() });
    while (list.length > this.windowSize) list.shift();
    this.turns.set(userId, list);
  }
  recent(userId) {
    return [...this.turns.get(userId) ?? []];
  }
};

// src/index.ts
var import_node_http = require("node:http");

// ../accounts/src/index.ts
var import_node_crypto4 = require("node:crypto");

// ../security/src/policy.ts
var RiskLevel = /* @__PURE__ */ ((RiskLevel3) => {
  RiskLevel3[RiskLevel3["None"] = 0] = "None";
  RiskLevel3[RiskLevel3["Low"] = 1] = "Low";
  RiskLevel3[RiskLevel3["Medium"] = 2] = "Medium";
  RiskLevel3[RiskLevel3["High"] = 3] = "High";
  RiskLevel3[RiskLevel3["Critical"] = 4] = "Critical";
  return RiskLevel3;
})(RiskLevel || {});
var DEFAULT_POLICY = {
  confirmAtOrAbove: 2 /* Medium */,
  denyAtOrAbove: 4 /* Critical */ + 1
  // nothing auto-denied in v0
};

// ../security/src/middleware.ts
var import_node_crypto = require("node:crypto");
var DEFAULT_POLICY_CONFIG = {
  confirmAtOrAbove: DEFAULT_POLICY.confirmAtOrAbove,
  denyAtOrAbove: DEFAULT_POLICY.denyAtOrAbove,
  riskOverrides: {}
};
var AuditTrail = class {
  entries = [];
  append(kind, action, detail) {
    const seq = this.entries.length;
    const prevHash = seq === 0 ? "genesis" : this.entries[seq - 1].hash;
    const at = (/* @__PURE__ */ new Date()).toISOString();
    const hash = (0, import_node_crypto.createHash)("sha256").update(`${seq}|${kind}|${action}|${detail}|${at}|${prevHash}`).digest("hex");
    const entry = Object.freeze({ seq, kind, action, detail, at, hash, prevHash });
    this.entries.push(entry);
    return entry;
  }
  list() {
    return [...this.entries];
  }
  /** Recompute the chain and confirm no entry was altered or reordered. */
  verifyIntegrity() {
    let prevHash = "genesis";
    for (const e of this.entries) {
      const expected = (0, import_node_crypto.createHash)("sha256").update(`${e.seq}|${e.kind}|${e.action}|${e.detail}|${e.at}|${prevHash}`).digest("hex");
      if (expected !== e.hash || e.prevHash !== prevHash) return false;
      prevHash = e.hash;
    }
    return true;
  }
};
var SecurityMiddleware = class {
  engine;
  overrides;
  trail = new AuditTrail();
  pending = /* @__PURE__ */ new Map();
  tokenSeq = 0;
  constructor(config2 = DEFAULT_POLICY_CONFIG) {
    this.engine = new SecurityEngine({
      confirmAtOrAbove: config2.confirmAtOrAbove,
      denyAtOrAbove: config2.denyAtOrAbove
    });
    this.overrides = config2.riskOverrides ?? {};
  }
  effectiveAction(action) {
    const override = this.overrides[action.kind];
    return override === void 0 ? action : { ...action, risk: override };
  }
  /** The single entry point for performing any action. */
  guard(action, execute) {
    const effective = this.effectiveAction(action);
    const evalResult = this.engine.evaluate(effective);
    this.trail.append("decision", effective.kind, evalResult.reason);
    if (evalResult.decision === "deny") {
      this.trail.append("denied", effective.kind, "policy deny");
      return { status: "denied", reason: evalResult.reason };
    }
    if (evalResult.decision === "confirm") {
      const token = `apr_${++this.tokenSeq}`;
      this.pending.set(token, effective);
      return {
        status: "pending",
        approval: { token, action: effective },
        reason: evalResult.reason
      };
    }
    const value = execute();
    this.trail.append("executed", effective.kind, "auto-allowed");
    return { status: "executed", value, reason: evalResult.reason };
  }
  /** Approve a held action and run it. */
  approve(token, execute) {
    const action = this.pending.get(token);
    if (!action) throw new Error(`Unknown or already-resolved approval ${token}`);
    this.pending.delete(token);
    const value = execute();
    this.trail.append("approved", action.kind, `approved via ${token}`);
    return value;
  }
  reject(token) {
    const action = this.pending.get(token);
    if (!action) throw new Error(`Unknown or already-resolved approval ${token}`);
    this.pending.delete(token);
    this.trail.append("rejected", action.kind, `rejected via ${token}`);
  }
  pendingCount() {
    return this.pending.size;
  }
  auditLog() {
    return this.trail.list();
  }
  verifyAuditIntegrity() {
    return this.trail.verifyIntegrity();
  }
};

// ../security/src/rate-limit.ts
var RateLimiter = class {
  opts;
  // key → sorted array of hit timestamps
  hits = /* @__PURE__ */ new Map();
  constructor(opts) {
    this.opts = { now: Date.now, ...opts };
  }
  check(key) {
    const now = this.opts.now();
    const cutoff = now - this.opts.windowMs;
    const history = (this.hits.get(key) ?? []).filter((t2) => t2 > cutoff);
    history.push(now);
    this.hits.set(key, history);
    if (history.length > this.opts.maxRequests) {
      const oldest = history[0];
      const retryAfterMs = oldest + this.opts.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }
    return { allowed: true };
  }
  /** Remove all recorded hits for a key (e.g. after successful login). */
  reset(key) {
    this.hits.delete(key);
  }
};
var LoginLockout = class {
  maxFailures;
  baseLockoutMs;
  maxLockoutMs;
  now;
  state = /* @__PURE__ */ new Map();
  constructor(opts = {}) {
    this.maxFailures = opts.maxFailures ?? 5;
    this.baseLockoutMs = opts.baseLockoutMs ?? 3e4;
    this.maxLockoutMs = opts.maxLockoutMs ?? 36e5;
    this.now = opts.now ?? Date.now;
  }
  /** Call on every failed login attempt. Returns lockout info if now locked. */
  recordFailure(key) {
    const s = this.state.get(key) ?? { failures: 0, lockoutCount: 0 };
    s.failures += 1;
    if (s.failures >= this.maxFailures) {
      const duration = Math.min(
        this.baseLockoutMs * Math.pow(2, s.lockoutCount),
        this.maxLockoutMs
      );
      s.lockedUntil = this.now() + duration;
      s.lockoutCount += 1;
      s.failures = 0;
      this.state.set(key, s);
      return { locked: true, remainingMs: duration };
    }
    this.state.set(key, s);
    return { locked: false };
  }
  /** Call on successful login to clear failure history. */
  recordSuccess(key) {
    this.state.delete(key);
  }
  /** Check whether a key is currently locked without recording a hit. */
  isLocked(key) {
    const s = this.state.get(key);
    if (!s?.lockedUntil) return { locked: false };
    const remaining = s.lockedUntil - this.now();
    if (remaining <= 0) {
      s.lockedUntil = void 0;
      return { locked: false };
    }
    return { locked: true, remainingMs: remaining };
  }
};

// ../security/src/email-blocklist.ts
var DISPOSABLE_DOMAINS = /* @__PURE__ */ new Set([
  "10minutemail.com",
  "airmail.cc",
  "discard.email",
  "disposablemail.com",
  "fakeinbox.com",
  "filzmail.com",
  "getairmail.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "mailinator.com",
  "mailnull.com",
  "maildrop.cc",
  "mailnesia.com",
  "nada.email",
  "sharklasers.com",
  "spamgourmet.com",
  "tempinbox.com",
  "temp-mail.org",
  "throwam.com",
  "throwaway.email",
  "trashmail.at",
  "trashmail.com",
  "trashmail.me",
  "yopmail.com",
  "zwoho.com"
]);
function isDisposableEmail(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}
var DISPOSABLE_DOMAIN_COUNT = DISPOSABLE_DOMAINS.size;

// ../security/src/index.ts
var SecurityEngine = class _SecurityEngine {
  policy;
  store;
  audit = [];
  static AUDIT_KEY = "security:audit_log";
  constructor(policy = DEFAULT_POLICY, store2) {
    this.policy = policy;
    this.store = store2;
    if (this.store) {
      const saved = this.store.get(_SecurityEngine.AUDIT_KEY);
      if (saved) {
        try {
          this.audit = JSON.parse(saved);
        } catch (e) {
        }
      }
    }
  }
  /** Evaluate a single action against the policy and record the decision. */
  evaluate(action) {
    let decision;
    let reason;
    if (action.risk >= this.policy.denyAtOrAbove) {
      decision = "deny";
      reason = `risk ${RiskLevel[action.risk]} >= deny threshold`;
    } else if (action.risk >= this.policy.confirmAtOrAbove) {
      decision = "confirm";
      reason = `risk ${RiskLevel[action.risk]} >= confirm threshold`;
    } else {
      decision = "allow";
      reason = `risk ${RiskLevel[action.risk]} below confirm threshold`;
    }
    const evaluation = {
      action,
      decision,
      reason,
      at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.audit.push(evaluation);
    if (this.store) {
      this.store.set(_SecurityEngine.AUDIT_KEY, JSON.stringify(this.audit));
    }
    return evaluation;
  }
  /** Read-only view of every decision made so far (FAZ 11 makes this immutable/persistent). */
  auditLog() {
    return [...this.audit];
  }
};

// ../accounts/src/oauth.ts
var import_node_crypto2 = require("node:crypto");
function generatePkce() {
  const verifier = (0, import_node_crypto2.randomBytes)(48).toString("base64url");
  const challenge = (0, import_node_crypto2.createHash)("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
function generateState() {
  return (0, import_node_crypto2.randomBytes)(16).toString("hex");
}
function generateNonce() {
  return (0, import_node_crypto2.randomBytes)(16).toString("hex");
}

// ../accounts/src/providers.ts
var import_node_crypto3 = require("node:crypto");
function decodeJwtPayload(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("Malformed id_token");
  const json = Buffer.from(parts[1] ?? "", "base64url").toString("utf8");
  return JSON.parse(json);
}
function assertClaims(claims, opts) {
  const now = Math.floor(Date.now() / 1e3);
  if (!claims.sub) throw new Error("id_token missing sub");
  if (claims.iss === void 0 || !opts.issuers.includes(claims.iss)) {
    throw new Error("id_token issuer mismatch");
  }
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(opts.audience)) throw new Error("id_token audience mismatch");
  if (typeof claims.exp === "number" && claims.exp < now) throw new Error("id_token expired");
  if (opts.nonce !== void 0 && claims.nonce !== void 0 && claims.nonce !== opts.nonce) {
    throw new Error("id_token nonce mismatch");
  }
}
function toBool(v) {
  return v === true || v === "true";
}
async function postForm(url, form) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(form).toString()
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof json.error === "string" ? json.error : `HTTP ${res.status}`;
    throw new Error(`Token exchange failed: ${detail}`);
  }
  return json;
}
var GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
var GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];
var GoogleAuthProvider = class {
  constructor(creds) {
    this.creds = creds;
  }
  creds;
  id = "google";
  authorizeUrl(state, pkceChallenge, nonce) {
    const q = new URLSearchParams({
      client_id: this.creds.clientId,
      redirect_uri: this.creds.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: pkceChallenge,
      code_challenge_method: "S256",
      access_type: "online",
      prompt: "select_account"
    });
    return `${GOOGLE_AUTH}?${q.toString()}`;
  }
  async exchange(code, pkceVerifier, expectedNonce) {
    const tokens = await postForm(GOOGLE_TOKEN, {
      grant_type: "authorization_code",
      code,
      client_id: this.creds.clientId,
      client_secret: this.creds.clientSecret,
      redirect_uri: this.creds.redirectUri,
      code_verifier: pkceVerifier
    });
    const idToken = tokens.id_token;
    if (typeof idToken !== "string") throw new Error("Google response missing id_token");
    const claims = decodeJwtPayload(idToken);
    assertClaims(claims, {
      issuers: GOOGLE_ISSUERS,
      audience: this.creds.clientId,
      nonce: expectedNonce
    });
    return {
      provider: "google",
      sub: claims.sub,
      email: claims.email,
      emailVerified: toBool(claims.email_verified),
      name: claims.name,
      avatarUrl: claims.picture
    };
  }
};
var APPLE_AUTH = "https://appleid.apple.com/auth/authorize";
var APPLE_TOKEN = "https://appleid.apple.com/auth/token";
var APPLE_ISSUER = "https://appleid.apple.com";
var APPLE_AUD = "https://appleid.apple.com";
function createAppleClientSecret(creds, now = Math.floor(Date.now() / 1e3)) {
  const header = { alg: "ES256", kid: creds.keyId, typ: "JWT" };
  const payload = {
    iss: creds.teamId,
    iat: now,
    exp: now + 15777e3,
    // ~6 months — Apple's maximum client-secret lifetime.
    aud: APPLE_AUD,
    sub: creds.clientId
  };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${b64(header)}.${b64(payload)}`;
  const key = (0, import_node_crypto3.createPrivateKey)(creds.privateKey);
  const sig = (0, import_node_crypto3.sign)("sha256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
  return `${signingInput}.${sig.toString("base64url")}`;
}
var AppleAuthProvider = class {
  constructor(creds) {
    this.creds = creds;
  }
  creds;
  id = "apple";
  authorizeUrl(state, pkceChallenge, nonce) {
    const q = new URLSearchParams({
      client_id: this.creds.clientId,
      redirect_uri: this.creds.redirectUri,
      response_type: "code",
      response_mode: "form_post",
      // Apple returns the code via POST when scopes are requested.
      scope: "name email",
      state,
      nonce,
      code_challenge: pkceChallenge,
      code_challenge_method: "S256"
    });
    return `${APPLE_AUTH}?${q.toString()}`;
  }
  async exchange(code, pkceVerifier, expectedNonce) {
    const tokens = await postForm(APPLE_TOKEN, {
      grant_type: "authorization_code",
      code,
      client_id: this.creds.clientId,
      client_secret: createAppleClientSecret(this.creds),
      redirect_uri: this.creds.redirectUri,
      code_verifier: pkceVerifier
    });
    const idToken = tokens.id_token;
    if (typeof idToken !== "string") throw new Error("Apple response missing id_token");
    const claims = decodeJwtPayload(idToken);
    assertClaims(claims, {
      issuers: [APPLE_ISSUER],
      audience: this.creds.clientId,
      nonce: expectedNonce
    });
    return {
      provider: "apple",
      sub: claims.sub,
      email: claims.email,
      emailVerified: toBool(claims.email_verified),
      // Apple only sends the display name (via form_post) on the very first consent.
      name: void 0
    };
  }
};

// ../accounts/src/index.ts
var AuthError = class extends Error {
};
var SESSION_TTL_MS = 1e3 * 60 * 60 * 24;
var RESET_TTL_MS = 1e3 * 60 * 30;
var K_ACCOUNT = "acct:";
var K_EMAIL = "acctEmail:";
var K_SESSION = "sess:";
var K_RESET = "reset:";
var K_DEVICES = "dev:";
var K_OAUTH = "oauth:";
var K_SEQ = "meta:acctSeq";
function hashPassword(password, salt) {
  return (0, import_node_crypto4.scryptSync)(password, salt, 64).toString("hex");
}
function safeEqualHex(a, b) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && (0, import_node_crypto4.timingSafeEqual)(ab, bb);
}
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
var AccountService = class {
  store;
  now;
  rateLimiter;
  lockout;
  useEmailBlocklist;
  constructor(opts = {}) {
    if (typeof opts === "function") {
      this.now = opts;
      this.useEmailBlocklist = true;
      this.store = new InMemoryKeyValueStore();
    } else {
      this.now = opts.now ?? (() => Date.now());
      this.rateLimiter = opts.rateLimiter;
      this.lockout = opts.lockout;
      this.useEmailBlocklist = opts.emailBlocklist ?? true;
      this.store = opts.store ?? new InMemoryKeyValueStore();
    }
  }
  // ── Storage helpers ──────────────────────────────────────────────────────
  readJson(key) {
    const raw = this.store.get(key);
    return raw === void 0 ? void 0 : JSON.parse(raw);
  }
  accountById(id) {
    return this.readJson(K_ACCOUNT + id);
  }
  accountByEmail(email) {
    const id = this.store.get(K_EMAIL + email);
    return id === void 0 ? void 0 : this.accountById(id);
  }
  saveAccount(a) {
    this.store.set(K_ACCOUNT + a.id, JSON.stringify(a));
    this.store.set(K_EMAIL + a.email, a.id);
  }
  nextSeq() {
    const current = Number(this.store.get(K_SEQ) ?? "0");
    const next = current + 1;
    this.store.set(K_SEQ, String(next));
    return next;
  }
  register(input) {
    const email = normalizeEmail(input.email);
    if (!email.includes("@")) throw new AuthError("A valid email is required.");
    if (this.useEmailBlocklist && isDisposableEmail(email)) {
      throw new AuthError("This email domain is not accepted.");
    }
    if (input.password.length < 8) throw new AuthError("Password must be at least 8 characters.");
    if (this.accountByEmail(email))
      throw new AuthError("An account with this email already exists.");
    const salt = (0, import_node_crypto4.randomBytes)(16).toString("hex");
    const stored = {
      id: `acct_${this.nextSeq()}`,
      email,
      role: input.role ?? "member",
      createdAt: new Date(this.now()).toISOString(),
      salt,
      hash: hashPassword(input.password, salt),
      identities: []
    };
    this.saveAccount(stored);
    return this.publicView(stored);
  }
  /** Verify credentials and open a new session. */
  login(email, password) {
    const normalEmail = normalizeEmail(email);
    if (this.lockout) {
      const lock = this.lockout.isLocked(normalEmail);
      if (lock.locked) {
        throw new AuthError(
          `Account temporarily locked. Try again in ${Math.ceil((lock.remainingMs ?? 0) / 1e3)}s.`
        );
      }
    }
    if (this.rateLimiter) {
      const rl = this.rateLimiter.check(normalEmail);
      if (!rl.allowed) {
        throw new AuthError(
          `Too many login attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 1e3)}s.`
        );
      }
    }
    const stored = this.accountByEmail(normalEmail);
    const salt = stored?.salt ?? "00";
    const candidate = hashPassword(password, salt);
    if (!stored || !safeEqualHex(candidate, stored.hash)) {
      if (this.lockout) this.lockout.recordFailure(normalEmail);
      throw new AuthError("Invalid email or password.");
    }
    if (this.lockout) this.lockout.recordSuccess(normalEmail);
    if (this.rateLimiter) this.rateLimiter.reset(normalEmail);
    return this.createSession(stored.id);
  }
  /**
   * Open a session for a fresh anonymous guest. Creates a real account with the
   * `guest` role and a synthetic, unguessable password hash (so it can never be
   * signed into with a password) — this gives the visitor durable per-user data
   * through the exact same path as a full account, with no credentials required.
   */
  loginAsGuest() {
    const id = `acct_${this.nextSeq()}`;
    const salt = (0, import_node_crypto4.randomBytes)(16).toString("hex");
    const stored = {
      id,
      email: `guest.${id}@guest.nexus.internal`,
      role: "guest",
      createdAt: new Date(this.now()).toISOString(),
      salt,
      // Random unguessable hash — a guest account cannot be used with password login.
      hash: (0, import_node_crypto4.randomBytes)(64).toString("hex"),
      identities: []
    };
    this.saveAccount(stored);
    return this.createSession(id);
  }
  createSession(userId) {
    const session = {
      token: (0, import_node_crypto4.randomBytes)(24).toString("hex"),
      userId,
      expiresAt: this.now() + SESSION_TTL_MS
    };
    this.store.set(K_SESSION + session.token, JSON.stringify(session));
    return session;
  }
  /** Return the account for a live session, or undefined if invalid/expired. */
  validateSession(token) {
    const session = this.readJson(K_SESSION + token);
    if (!session) return void 0;
    if (session.expiresAt <= this.now()) {
      this.store.delete(K_SESSION + token);
      return void 0;
    }
    const stored = this.accountById(session.userId);
    return stored ? this.publicView(stored) : void 0;
  }
  logout(token) {
    this.store.delete(K_SESSION + token);
  }
  /** Issue a single-use reset token (delivered out-of-band in a real system). */
  requestPasswordReset(email) {
    const stored = this.accountByEmail(normalizeEmail(email));
    if (!stored) return void 0;
    const token = (0, import_node_crypto4.randomBytes)(24).toString("hex");
    this.store.set(
      K_RESET + token,
      JSON.stringify({ userId: stored.id, expiresAt: this.now() + RESET_TTL_MS })
    );
    return token;
  }
  confirmPasswordReset(token, newPassword) {
    const entry = this.readJson(K_RESET + token);
    if (!entry || entry.expiresAt <= this.now())
      throw new AuthError("Reset token is invalid or expired.");
    if (newPassword.length < 8) throw new AuthError("Password must be at least 8 characters.");
    const stored = this.accountById(entry.userId);
    const salt = (0, import_node_crypto4.randomBytes)(16).toString("hex");
    const updated = { ...stored, salt, hash: hashPassword(newPassword, salt) };
    this.saveAccount(updated);
    this.store.delete(K_RESET + token);
    this.deleteSessionsFor(stored.id);
  }
  deleteSessionsFor(userId) {
    for (const key of this.store.keys(K_SESSION)) {
      const s = this.readJson(key);
      if (s && s.userId === userId) this.store.delete(key);
    }
  }
  /** Pair an additional device to the account (multi-device login, FAZ 14). */
  pairDevice(userId, deviceId) {
    const list = this.readJson(K_DEVICES + userId) ?? [];
    if (!list.includes(deviceId)) list.push(deviceId);
    this.store.set(K_DEVICES + userId, JSON.stringify(list));
  }
  listDevices(userId) {
    return this.readJson(K_DEVICES + userId) ?? [];
  }
  /** GDPR/KVKK data export — the user's own data, minus secrets. */
  exportData(userId) {
    const stored = this.accountById(userId);
    if (!stored) return void 0;
    return { account: this.publicView(stored), devices: this.listDevices(userId) };
  }
  /** Right to erasure — remove the account and everything attached to it. */
  deleteAccount(userId) {
    const stored = this.accountById(userId);
    if (!stored) return false;
    this.store.delete(K_ACCOUNT + userId);
    this.store.delete(K_EMAIL + stored.email);
    this.store.delete(K_DEVICES + userId);
    this.deleteSessionsFor(userId);
    for (const key of this.store.keys(K_RESET)) {
      const r = this.readJson(key);
      if (r && r.userId === userId) this.store.delete(key);
    }
    for (const identity of stored.identities) {
      this.store.delete(K_OAUTH + `${identity.provider}:${identity.sub}`);
    }
    return true;
  }
  getAccount(id) {
    const stored = this.accountById(id);
    return stored ? this.publicView(stored) : void 0;
  }
  /**
   * Authenticates via an external OAuth provider and returns a session.
   *
   * Resolution order:
   *  1. Match by provider + sub (returning user).
   *  2. Match by verified email (link provider to existing account).
   *  3. Create a new account with a random unguessable password hash.
   */
  loginWithProvider(profile, _provider) {
    const key = `${profile.provider}:${profile.sub}`;
    const existingId = this.store.get(K_OAUTH + key);
    if (existingId) {
      const acct = this.accountById(existingId);
      if (acct) return this.createSession(acct.id);
    }
    if (profile.email && profile.emailVerified) {
      const norm = profile.email.trim().toLowerCase();
      const existing = this.accountByEmail(norm);
      if (existing) {
        existing.identities.push({ provider: profile.provider, sub: profile.sub });
        this.saveAccount(existing);
        this.store.set(K_OAUTH + key, existing.id);
        return this.createSession(existing.id);
      }
    }
    const email = profile.email?.trim().toLowerCase() ?? `${profile.provider}.${profile.sub}@oauth.nexus.internal`;
    const salt = (0, import_node_crypto4.randomBytes)(16).toString("hex");
    const hash = (0, import_node_crypto4.randomBytes)(64).toString("hex");
    const stored = {
      id: `acct_${this.nextSeq()}`,
      email,
      role: "member",
      createdAt: new Date(this.now()).toISOString(),
      salt,
      hash,
      identities: [{ provider: profile.provider, sub: profile.sub }]
    };
    this.saveAccount(stored);
    this.store.set(K_OAUTH + key, stored.id);
    return this.createSession(stored.id);
  }
  publicView(a) {
    return {
      id: a.id,
      email: a.email,
      role: a.role,
      createdAt: a.createdAt,
      identities: [...a.identities]
    };
  }
};

// src/userdata.ts
var K_USERDATA = "udata:";
function displayNameFromEmail(email) {
  const local = email.split("@")[0] ?? email;
  const words = local.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ") || email;
}
function defaultUserData(email, language) {
  return {
    plan: "free",
    assistantName: "NEXUS",
    displayName: displayNameFromEmail(email),
    language,
    energyWhToday: 0,
    devices: [],
    routines: [],
    suggestions: [],
    family: []
  };
}
var UserDataStore = class {
  constructor(store2) {
    this.store = store2;
  }
  store;
  /** Read a user's data, or `undefined` if they have never been initialized. */
  get(userId) {
    const raw = this.store.get(K_USERDATA + userId);
    return raw === void 0 ? void 0 : JSON.parse(raw);
  }
  /** Read a user's data, creating and persisting the empty default on first access. */
  ensure(userId, email, language) {
    const existing = this.get(userId);
    if (existing) return existing;
    const seeded = defaultUserData(email, language);
    this.set(userId, seeded);
    return seeded;
  }
  set(userId, data) {
    this.store.set(K_USERDATA + userId, JSON.stringify(data));
  }
  /** Apply a partial patch to the user's data and persist the result. */
  patch(userId, email, language, patch) {
    const current = this.ensure(userId, email, language);
    const next = { ...current, ...patch };
    this.set(userId, next);
    return next;
  }
  delete(userId) {
    this.store.delete(K_USERDATA + userId);
  }
};

// src/app.ts
var import_promises = require("node:fs/promises");
var import_node_path4 = require("node:path");

// ../devices/src/usage.ts
function energyWh(watts, onMinutes) {
  return Math.round(Math.max(0, watts) * Math.max(0, onMinutes) / 60);
}
function summarizeUsage(entries) {
  const devices = entries.map((e) => ({
    deviceId: e.deviceId,
    name: e.name,
    room: e.room,
    onMinutes: Math.max(0, e.onMinutes),
    energyWh: energyWh(e.watts, e.onMinutes)
  }));
  const totalOnMinutes = devices.reduce((sum, d) => sum + d.onMinutes, 0);
  const totalEnergyWh = devices.reduce((sum, d) => sum + d.energyWh, 0);
  let topConsumer;
  for (const d of devices) {
    if (d.energyWh > 0 && (!topConsumer || d.energyWh > topConsumer.energyWh)) {
      topConsumer = d;
    }
  }
  const sorted = [...devices].sort((a, b) => b.energyWh - a.energyWh);
  return { devices: sorted, totalOnMinutes, totalEnergyWh, topConsumer };
}

// ../devices/src/index.ts
var CapabilityError = class extends Error {
};
var InMemoryConnector = class {
  constructor(id, seed = []) {
    this.id = id;
    for (const d of seed) this.devices.set(d.id, d);
  }
  id;
  devices = /* @__PURE__ */ new Map();
  discover() {
    return [...this.devices.values()];
  }
  supports(deviceId) {
    return this.devices.has(deviceId);
  }
  execute(command) {
    const device = this.devices.get(command.deviceId);
    if (!device) throw new CapabilityError(`Unknown device ${command.deviceId}`);
    const cap = device.capabilities.find((c) => c.kind === command.capability);
    if (!cap) {
      return {
        ok: false,
        device,
        message: `${device.name} has no ${command.capability} capability`
      };
    }
    if (typeof cap.value !== typeof command.value) {
      return { ok: false, device, message: `Invalid value type for ${command.capability}` };
    }
    if (typeof command.value === "number" && cap.min !== void 0 && cap.max !== void 0) {
      if (command.value < cap.min || command.value > cap.max) {
        return { ok: false, device, message: `Value out of range for ${command.capability}` };
      }
    }
    const updated = {
      ...device,
      capabilities: device.capabilities.map(
        (c) => c.kind === command.capability ? { ...c, value: command.value } : c
      )
    };
    this.devices.set(device.id, updated);
    return { ok: true, device: updated, message: `${device.name}: ${command.capability} set` };
  }
};
var DeviceNameRegistry = class {
  aliasToId = /* @__PURE__ */ new Map();
  /** Set or overwrite the primary display name for a device. Old name is kept as alias. */
  rename(deviceId, newName) {
    const key = newName.toLowerCase();
    const existing = this.aliasToId.get(key);
    if (existing && existing !== deviceId) {
      throw new CapabilityError(`Alias "${newName}" is already assigned to device ${existing}`);
    }
    this.aliasToId.set(key, deviceId);
  }
  /** Add an additional alias for a device. */
  addAlias(deviceId, alias) {
    const key = alias.toLowerCase();
    const existing = this.aliasToId.get(key);
    if (existing && existing !== deviceId) {
      throw new CapabilityError(`Alias "${alias}" is already assigned to device ${existing}`);
    }
    this.aliasToId.set(key, deviceId);
  }
  /** Remove an alias. Returns true if it existed. */
  removeAlias(alias) {
    return this.aliasToId.delete(alias.toLowerCase());
  }
  /** Resolve a name/alias to a device ID (case-insensitive). */
  resolve(name) {
    return this.aliasToId.get(name.toLowerCase());
  }
  /** Get all aliases registered for a specific device. */
  getAliases(deviceId) {
    const result = [];
    for (const [alias, id] of this.aliasToId) {
      if (id === deviceId) result.push(alias);
    }
    return result;
  }
  /** Return all registered name→deviceId mappings. */
  allNames() {
    return this.aliasToId;
  }
};
var DeviceManager = class {
  connectors = [];
  names = new DeviceNameRegistry();
  registerConnector(connector) {
    this.connectors.push(connector);
  }
  /** Remove a connector (and its devices) by id — used by the store on uninstall (FAZ 16). */
  unregisterConnector(id) {
    const index = this.connectors.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.connectors.splice(index, 1);
    return true;
  }
  discoverAll() {
    return this.connectors.flatMap((c) => c.discover());
  }
  findByRoomCapability(room, capability) {
    return this.discoverAll().find(
      (d) => d.room === room && d.capabilities.some((c) => c.kind === capability)
    );
  }
  /** Find a device by its custom name/alias via the name registry. */
  findByName(name) {
    const deviceId = this.names.resolve(name);
    if (!deviceId) return void 0;
    return this.discoverAll().find((d) => d.id === deviceId);
  }
  execute(command) {
    const connector = this.connectors.find((c) => c.supports(command.deviceId));
    if (!connector) throw new CapabilityError(`No connector owns device ${command.deviceId}`);
    return connector.execute(command);
  }
};

// ../support/src/telemetry.ts
var TelemetryService = class {
  optIn;
  sink;
  constructor(options) {
    this.optIn = options.optIn;
    this.sink = options.sink ?? ((e) => console.log("[Telemetry]", e));
  }
  setOptIn(enabled) {
    this.optIn = enabled;
  }
  isOptedIn() {
    return this.optIn;
  }
  track(type, payload) {
    if (!this.optIn) return;
    this.sink({
      type,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload
    });
  }
  recordCrash(error, context) {
    if (!this.optIn) return;
    this.sink({
      type: "crash",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: {
        message: error.message,
        context: context ?? "unknown"
      }
    });
  }
};

// ../support/src/ticket.ts
var SupportService = class {
  tickets = [];
  createTicket(email, subject, message) {
    const ticket = {
      id: "ticket-" + Math.random().toString(36).slice(2, 9),
      email,
      subject,
      message,
      status: "open",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.tickets.push(ticket);
    return ticket;
  }
  getTickets(email) {
    return this.tickets.filter((t2) => t2.email === email);
  }
};

// ../routines/src/suggestions.ts
var HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
function actionSignature(action) {
  const params = Object.keys(action.params).sort().map((k) => `${k}=${action.params[k]}`).join(",");
  return params ? `${action.kind}(${params})` : action.kind;
}
var RoutineSuggestionEngine = class {
  observations = [];
  dismissed = /* @__PURE__ */ new Set();
  threshold;
  constructor(options = {}) {
    this.threshold = Math.max(2, options.threshold ?? 3);
  }
  /** Record something the user did (feeds the pattern detector). */
  observe(observation) {
    if (!HOUR_RE.test(observation.at)) {
      throw new Error(`Invalid observation time "${observation.at}" (expected HH:MM)`);
    }
    this.observations.push(observation);
  }
  /** Stop proposing a pattern the user has rejected. */
  dismiss(signature) {
    this.dismissed.add(signature);
  }
  /**
   * Patterns that have recurred at the same hour at least `threshold` times and
   * have not been dismissed. Each carries a ready-to-accept scheduled routine.
   */
  suggest() {
    const groups = /* @__PURE__ */ new Map();
    for (const obs of this.observations) {
      const hour = `${obs.at.slice(0, 2)}:00`;
      const sig = `${actionSignature(obs.action)}@${hour}`;
      const entry = groups.get(sig) ?? { count: 0, hour, action: obs.action };
      entry.count += 1;
      groups.set(sig, entry);
    }
    const out = [];
    for (const [sig, { count, hour, action }] of groups) {
      if (count < this.threshold || this.dismissed.has(sig)) continue;
      out.push({
        signature: sig,
        count,
        at: hour,
        proposal: {
          name: `${action.kind} @ ${hour}`,
          triggers: [{ type: "time", at: hour }],
          actions: [action]
        }
      });
    }
    return out.sort((a, b) => b.count - a.count);
  }
};

// ../routines/src/index.ts
var RoutineError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "RoutineError";
  }
};
var TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
function normalizePhrase(phrase) {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}
function validate(input) {
  if (!input.name.trim()) throw new RoutineError("Routine name is required");
  if (input.actions.length === 0) {
    throw new RoutineError(`Routine "${input.name}" must have at least one action`);
  }
  if (input.triggers.length === 0) {
    throw new RoutineError(`Routine "${input.name}" must have at least one trigger`);
  }
  for (const t2 of input.triggers) {
    if (t2.type === "time" && !TIME_RE.test(t2.at)) {
      throw new RoutineError(`Invalid time trigger "${t2.at}" (expected HH:MM, 24h)`);
    }
    if (t2.type === "voice" && !t2.phrase.trim()) {
      throw new RoutineError("Voice trigger phrase is required");
    }
    if (t2.type === "event" && !t2.event.trim()) {
      throw new RoutineError("Event trigger name is required");
    }
  }
}
var RoutineEngine = class {
  routines = /* @__PURE__ */ new Map();
  seq = 0;
  /** Register a routine after validation. Returns the stored routine. */
  add(input) {
    validate(input);
    const routine = {
      id: `routine_${++this.seq}`,
      name: input.name.trim(),
      enabled: input.enabled ?? true,
      triggers: input.triggers,
      actions: input.actions
    };
    this.routines.set(routine.id, routine);
    return routine;
  }
  get(id) {
    return this.routines.get(id);
  }
  remove(id) {
    return this.routines.delete(id);
  }
  list() {
    return [...this.routines.values()];
  }
  /** Enable/disable without deleting. Disabled routines never match. */
  setEnabled(id, enabled) {
    const routine = this.routines.get(id);
    if (!routine) throw new RoutineError(`Unknown routine "${id}"`);
    const updated = { ...routine, enabled };
    this.routines.set(id, updated);
    return updated;
  }
  enabled() {
    return [...this.routines.values()].filter((r) => r.enabled);
  }
  /** Routines whose voice phrase is contained in the utterance (longest first). */
  matchVoice(utterance) {
    const norm = normalizePhrase(utterance);
    return this.enabled().filter(
      (r) => r.triggers.some((t2) => t2.type === "voice" && norm.includes(normalizePhrase(t2.phrase)))
    ).sort((a, b) => longestVoice(b) - longestVoice(a));
  }
  /** Routines triggered by the given event name. */
  matchEvent(event) {
    const key = event.trim().toLowerCase();
    return this.enabled().filter(
      (r) => r.triggers.some((t2) => t2.type === "event" && t2.event.trim().toLowerCase() === key)
    );
  }
  /** Routines scheduled for the given "HH:MM" local time. */
  due(time) {
    if (!TIME_RE.test(time)) throw new RoutineError(`Invalid time "${time}" (expected HH:MM)`);
    return this.enabled().filter((r) => r.triggers.some((t2) => t2.type === "time" && t2.at === time));
  }
  /** The ordered actions to execute for a routine (execution is the caller's job). */
  plan(routine) {
    if (!routine.enabled) return [];
    return routine.actions;
  }
};
function longestVoice(r) {
  return Math.max(
    0,
    ...r.triggers.filter((t2) => t2.type === "voice").map((t2) => t2.phrase.length)
  );
}

// ../i18n/src/index.ts
var SUPPORTED_LOCALES = ["en", "tr", "es", "fr", "de", "it", "pt", "nl", "pl", "cs", "ru", "uk", "ar", "he", "hi", "ja", "ko", "zh-Hans", "zh-Hant", "vi"];
var DEFAULT_LOCALE = "en";
var RTL_LOCALES = ["ar", "he"];
function isRtl(locale) {
  return RTL_LOCALES.includes(locale);
}
var CATALOGS = {
  en: {
    "app.greeting": "Hi {name}, how can I help?",
    "app.confirmNeeded": "{name}, that action needs your confirmation.",
    "download.title": "Download NEXUS",
    "download.primaryButton": "Download for {os}",
    "download.otherOs": "Using a different operating system?",
    "download.checksum": "SHA-256 checksum",
    "screen.today": "Today",
    "screen.homeState": "Home",
    "screen.suggestions": "Suggestions",
    "screen.skills": "Skills",
    "screen.family": "Family",
    "screen.devices": "Devices",
    "screen.platform": "Platforms",
    "screen.agents": "Agents",
    "screen.personalization": "Personalization",
    "screen.billing": "Subscription",
    "screen.downloadCenter": "Download",
    "screen.adminDashboard": "Admin Dashboard",
    "today.devicesOnline": "Devices online",
    "today.energy": "Energy today",
    "today.activeRoutines": "Active routines",
    "today.suggestions": "Suggestions",
    "screen.devices.empty": "No devices connected yet.",
    "screen.agents.empty": "No agents configured yet.",
    "screen.suggestions.empty": "No suggestions yet \u2014 NEXUS AI is still learning.",
    "screen.skills.empty": "No skills learned yet.",
    "screen.homeState.empty": "No rooms with devices yet.",
    "plan.free": "Free",
    "plan.premium": "Premium",
    "plan.family": "Family",
    "billing.manage": "Manage subscription",
    "auth.tagline": "Your personal operating system for home",
    "auth.signInTitle": "Sign in to NEXUS",
    "auth.signUpTitle": "Create your NEXUS account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signInButton": "Sign in",
    "auth.signUpButton": "Create account",
    "auth.switchToSignUp": "New here? Create an account",
    "auth.switchToSignIn": "Already have an account? Sign in",
    "auth.passwordHint": "At least 8 characters",
    "auth.genericError": "Something went wrong. Please try again.",
    "auth.locked": "Too many failed attempts. Try again in {time}.",
    "auth.rateLimited": "Too many requests. Please try again later.",
    "auth.logout": "Sign out",
    "auth.welcome": "Welcome, {name}",
    "auth.continue": "Continue",
    "auth.guest": "Continue as guest",
    "auth.guestHint": "Explore NEXUS without an account",
    "auth.social.divider": "or continue with email",
    "auth.social.google": "Continue with Google",
    "auth.social.apple": "Continue with Apple",
    "auth.social.unavailable": "This sign-in method isn't set up yet.",
    "auth.social.error": "Sign-in with that provider failed. Please try again.",
    "mkt.nav.features": "Features",
    "mkt.nav.pricing": "Pricing",
    "mkt.nav.testimonials": "Testimonials",
    "mkt.nav.integrations": "Integrations",
    "mkt.nav.about": "About Us",
    "mkt.nav.download": "Download",
    "mkt.nav.faq": "FAQ",
    "mkt.nav.signIn": "Sign In",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Download NEXUS for every device you own",
    "mkt.hero.desc": "NEXUS is a voice-first, privacy-focused personal operating system. Install the desktop app or the mobile companion and control every device from one place \u2014 100% on-device. You use it from the real app, not the browser.",
    "mkt.hero.actionPrimary": "Download for {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "See it in action",
    "mkt.hero.trust": "\u2605 500,000+ users \xB7 2000+ smart devices \xB7 100% local privacy",
    "mkt.stats.title": "NEXUS in numbers",
    "mkt.stats.users": "Active users",
    "mkt.stats.devices": "Supported devices",
    "mkt.stats.privacy": "On-device privacy",
    "mkt.stats.rating": "Average rating",
    "mkt.privacy.title": "Your data is yours",
    "mkt.privacy.processing": "100% on-device processing",
    "mkt.privacy.encryption": "End-to-end local encryption",
    "mkt.privacy.logging": "Zero cloud logging",
    "mkt.how.title": "How it works",
    "mkt.how.step1.title": "Download",
    "mkt.how.step1.desc": "Download the app for your platform.",
    "mkt.how.step2.title": "Install",
    "mkt.how.step2.desc": "Complete the local setup in seconds.",
    "mkt.how.step3.title": "Connect devices",
    "mkt.how.step3.desc": "Start managing your smart home securely.",
    "mkt.preview.title": "See NEXUS in action",
    "mkt.preview.desc": "A live look at the real dashboard you get the moment you install the app.",
    "mkt.preview.tab.today": "Today",
    "mkt.preview.tab.devices": "Devices",
    "mkt.preview.tab.skills": "Routines",
    "mkt.preview.tab.family": "Family",
    "mkt.download.mobile.title": "Mobile apps",
    "mkt.download.mobile.desc": "iOS and Android apps are on the way.",
    "mkt.download.mobile.apple": "Download on the",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Get it on",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Soon",
    "mkt.seo.title": "NEXUS \u2014 Download your personal operating system",
    "mkt.seo.desc": "Download NEXUS for Windows, macOS and Linux. iOS and Android coming soon.",
    "mkt.skipToContent": "Skip to content",
    "mkt.pricing.title": "Simple, transparent pricing",
    "mkt.pricing.free": "Free",
    "mkt.pricing.freeDesc": "Everything you need for a local smart home.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Advanced AI processing and remote access.",
    "mkt.pricing.family": "Family",
    "mkt.pricing.familyDesc": "Up to 5 accounts with full access control.",
    "mkt.pricing.cta": "Start for free",
    "mkt.testimonials.title": "Loved by smart home enthusiasts",
    "mkt.testimonials.quote1": "NEXUS completely changed how I interact with my home. Having everything local is just so much faster.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Early Adopter",
    "mkt.testimonials.quote2": "Finally, a smart home hub that respects my privacy. The local AI processing is incredibly responsive.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Software Engineer",
    "mkt.testimonials.quote3": "Setting up complex routines is a breeze. I love that it doesn't break when my internet goes down.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Smart Home Enthusiast",
    "mkt.integrations.title": "Works with your favorite devices",
    "mkt.changelog.title": "What's new in v3.14.2",
    "mkt.requirements.title": "System Requirements",
    "mkt.requirements.desc": "Requires a 64-bit OS and at least 2GB RAM.",
    "mkt.footer.desc": "Your voice-first personal home operating system. Completely local, entirely yours.",
    "mkt.footer.product": "Product",
    "mkt.footer.company": "Company & Legal",
    "mkt.footer.about": "About Us",
    "mkt.footer.privacy": "Privacy Policy",
    "mkt.footer.terms": "Terms of Service",
    "mkt.footer.noCookies": "We use zero cookies.",
    "mkt.cookie.title": "Privacy & Cookies",
    "mkt.cookie.desc": "We use essential cookies to provide our services. By continuing, you agree to our use of these necessary technologies.",
    "mkt.cookie.accept": "Got it",
    "mkt.cookie.decline": "Settings",
    "mkt.feat.why": "Why NEXUS",
    "mkt.feat.1.title": "Voice-first control",
    "mkt.feat.1.desc": "Interact with your home naturally.",
    "mkt.feat.2.title": "Private by design",
    "mkt.feat.2.desc": "No cloud, no logging. Local encryption only.",
    "mkt.feat.3.title": "Interoperable",
    "mkt.feat.3.desc": "500+ protocols including Matter, Zigbee, Z-Wave.",
    "mkt.feat.4.title": "Invisible AI",
    "mkt.feat.4.desc": "Runs in the background, learning your routines.",
    "mkt.faq.title": "Frequently asked questions",
    "mkt.faq.1.q": "Is NEXUS completely free?",
    "mkt.faq.1.a": "Yes. The core OS and local control features are entirely free.",
    "mkt.faq.2.q": "Which devices are supported?",
    "mkt.faq.2.a": "Matter, Zigbee, Z-Wave devices and over 500 API-based ecosystems.",
    "mkt.faq.3.q": "Does it work without cloud connection?",
    "mkt.faq.3.a": "Yes. It communicates with your devices over local network, working even if internet goes down.",
    "mkt.faq.4.q": "How is remote access provided?",
    "mkt.faq.4.a": "Through a secure end-to-end encrypted tunnel with Premium plan or your own VPN.",
    "mkt.desktop.eyebrow": "Desktop",
    "mkt.desktop.title": "One app for every desktop",
    "mkt.desktop.desc": "Native builds for Windows, macOS, and Linux \u2014 each tuned for its platform.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Optimized for Windows 10 & 11 with seamless background operation.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Built for Apple Silicon and Intel with deep system integration.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Lightweight, fast, and compatible with all major distributions.",
    "mkt.desktop.download": "Download",
    "mkt.mobile.eyebrow": "Mobile",
    "mkt.mobile.title": "Your home in your pocket",
    "mkt.mobile.desc": "The NEXUS companion app puts control at your fingertips \u2014 wherever you are.",
    "mkt.mobile.feat1.title": "Voice on the go",
    "mkt.mobile.feat1.desc": "Talk to your home from anywhere with on-device speech recognition.",
    "mkt.mobile.feat2.title": "Remote access",
    "mkt.mobile.feat2.desc": "Securely reach your home network over an encrypted tunnel.",
    "mkt.mobile.feat3.title": "Push notifications",
    "mkt.mobile.feat3.desc": "Get instant alerts for events that matter to you.",
    "mkt.mobile.feat4.title": "Biometric lock",
    "mkt.mobile.feat4.desc": "Face ID and fingerprint keep your home controls private.",
    "mkt.cta.title": "Your home, your rules.",
    "mkt.cta.desc": "Download NEXUS and take control of every device from one place.",
    "mkt.cta.button": "Download Free",
    "mkt.footer.platforms": "Platforms",
    "Dim living room lights": "Dim living room lights",
    "Start morning news briefing": "Start morning news briefing",
    "Movie night": "Movie night",
    "Good morning": "Good morning",
    "Leaving home": "Leaving home",
    "status.pctOnline": "{pct}% online",
    "status.offlineCount": "{count} offline",
    "status.allOnline": "All devices online",
    "status.suggestionReady": "{count} suggestion ready for you.",
    "status.suggestionsReady": "{count} suggestions ready for you.",
    "status.caughtUp": "You're all caught up.",
    "status.onlineOfTotal": "{online}/{total} online",
    // Mobile/Desktop UI
    "mobile.menu": "Menu",
    "mobile.more": "More",
    "mobile.systemStatus": "NEXUS System Status",
    "mobile.localNetwork": "Local Network Connection",
    "mobile.offline": "100% Offline",
    "mobile.localAI": "Local AI Engine",
    "mobile.deviceNetwork": "Device Network",
    "mobile.online": "Online",
    "mobile.quickControls": "QUICK CONTROLS",
    "mobile.privacyShield": "Offline Privacy Shield",
    "mobile.active": "Active",
    "mobile.voiceWake": 'Voice Wake ("NEXUS")',
    "mobile.on": "On",
    "mobile.autoBackup": "Auto Home Backup",
    "mobile.backupTime": "Daily 03:00",
    "mobile.moreSub.suggestions": "3 scheduled smart automation suggestions",
    "mobile.moreSub.skills": "5 learned active voice skills & scenarios",
    "mobile.moreSub.personalization": "Assistant name, voice model & privacy settings",
    "mobile.moreSub.billing": "NEXUS Family Plan \xB7 Active Subscription",
    "mobile.moreSub.downloads": "3 OS platform releases & SHA-256 validation",
    "mobile.moreSub.platform": "Cross-platform device sync",
    "mobile.moreSub.agents": "Autonomous AI agents",
    "mobile.moreSub.admin": "System administration & metrics",
    "desktop.title": "Personal Operating System",
    // Installer/Setup
    "setup.welcome": "Welcome",
    "setup.license": "License",
    "setup.location": "Location",
    "setup.installing": "Installing",
    "setup.finish": "Finish",
    "setup.welcomeTitle": "Welcome to NEXUS Setup",
    "setup.welcomeDesc": "This wizard will guide you through the installation of NEXUS AI \u2014 your personal operating system for the home.",
    "setup.accept": "I accept the license agreement",
    "setup.chooseFolder": "Choose installation folder",
    "setup.installBtn": "Install",
    "setup.complete": "Setup Complete",
    "setup.launchNow": "Launch NEXUS now",
    "setup.continue": "Continue",
    "setup.back": "Back",
    "setup.cancel": "Cancel",
    "setup.windowTitle": "NEXUS Setup",
    "setup.titlebarText": "NEXUS AI Setup",
    "setup.browseHint": "Browse dialog \u2014 integrate with your native shell bridge.",
    "setup.cancelConfirm": "Cancel the installation?",
    "setup.completeAlert": "Setup complete. NEXUS AI is ready to launch.",
    "setup.bullet1": "Lightweight background service \u2014 under 50 MB RAM at idle",
    "setup.bullet2": "Fully local by default \u2014 your data never leaves your device",
    "setup.bullet3": "Works with 2,000+ smart home devices out of the box",
    "setup.continueHint": "Click <strong>Continue</strong> to proceed.",
    "setup.licenseTitle": "License Agreement",
    "setup.licenseHint": "Please read and accept the following license terms before continuing.",
    "setup.licenseText": 'NEXUS AI SOFTWARE LICENSE AGREEMENT\n\nCopyright \xA9 2024 NEXUS AI Technologies. All rights reserved.\n\nPLEASE READ THIS LICENSE AGREEMENT CAREFULLY BEFORE INSTALLING OR USING THE SOFTWARE.\n\n1. GRANT OF LICENSE. Subject to the terms of this Agreement, NEXUS AI Technologies grants you a non-exclusive, non-transferable license to install and use NEXUS AI solely for your personal, non-commercial purposes.\n\n2. RESTRICTIONS. You may not: (a) copy, modify, or distribute the Software; (b) reverse engineer, decompile, or disassemble the Software; (c) sublicense or sell the Software.\n\n3. PRIVACY. The Software operates primarily on-device. Any cloud features require explicit opt-in and are governed by the separate Privacy Policy.\n\n4. DISCLAIMER. THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.\n\n5. TERMINATION. This license terminates automatically upon breach of any term herein.',
    "setup.locationTitle": "Installation Location",
    "setup.locationDesc": "Choose where NEXUS AI will be installed. The default location is recommended for most users.",
    "setup.locationDescMac": "Choose where NEXUS AI will be installed. The /Applications folder is recommended on macOS.",
    "setup.browse": "Browse\u2026",
    "setup.spaceInfo": "Space required: <strong>240 MB</strong> &nbsp;\xB7&nbsp; Available: <strong>48.2 GB</strong>",
    "setup.installingTitle": "Installing NEXUS AI",
    "setup.installingDesc": "Please wait while NEXUS is installed on your computer. This may take a few minutes.",
    "setup.installingStatus": "Installing core services\u2026",
    "setup.finishTitle": "NEXUS is ready",
    "setup.finishDesc": "NEXUS AI has been successfully installed. Click <strong>Finish</strong> to exit the Setup wizard."
  },
  tr: {
    "app.greeting": "Merhaba {name}, nas\u0131l yard\u0131mc\u0131 olabilirim?",
    "app.confirmNeeded": "{name}, bu i\u015Flem i\xE7in onay\u0131n gerekiyor.",
    "download.title": "NEXUS'u \u0130ndir",
    "download.primaryButton": "{os} i\xE7in indir",
    "download.otherOs": "Farkl\u0131 bir i\u015Fletim sistemi mi kullan\u0131yorsun?",
    "download.checksum": "SHA-256 sa\u011Flama de\u011Feri",
    "screen.today": "Bug\xFCn",
    "screen.homeState": "Ev",
    "screen.suggestions": "\xD6neriler",
    "screen.skills": "Yetenekler",
    "screen.family": "Aile",
    "screen.devices": "Cihazlar",
    "screen.platform": "Platformlar",
    "screen.agents": "Ajanlar",
    "screen.personalization": "Ki\u015Fiselle\u015Ftirme",
    "screen.billing": "Abonelik",
    "screen.downloadCenter": "\u0130ndirme Merkezi",
    "screen.adminDashboard": "Y\xF6netici Paneli",
    "today.devicesOnline": "\xC7evrimi\xE7i cihazlar",
    "today.energy": "Bug\xFCnk\xFC enerji",
    "today.activeRoutines": "Aktif rutinler",
    "today.suggestions": "\xD6neriler",
    "screen.devices.empty": "Hen\xFCz ba\u011Flanan cihaz yok.",
    "screen.agents.empty": "Hen\xFCz yap\u0131land\u0131r\u0131lm\u0131\u015F bir ajan yok.",
    "screen.suggestions.empty": "Hen\xFCz \xF6neri yok \u2014 Nexus AI h\xE2l\xE2 \xF6\u011Freniyor.",
    "screen.skills.empty": "Hen\xFCz \xF6\u011Frenilen bir yetenek yok.",
    "screen.homeState.empty": "Hen\xFCz cihaz eklenmi\u015F bir oda yok.",
    "plan.free": "\xDCcretsiz",
    "plan.premium": "Premium",
    "plan.family": "Aile",
    "billing.manage": "Aboneli\u011Fi y\xF6net",
    "auth.tagline": "Evini tan\u0131yan ki\u015Fisel i\u015Fletim sistemin",
    "auth.signInTitle": "NEXUS'a giri\u015F yap",
    "auth.signUpTitle": "NEXUS hesab\u0131n\u0131 olu\u015Ftur",
    "auth.email": "E-posta",
    "auth.password": "Parola",
    "auth.signInButton": "Giri\u015F yap",
    "auth.signUpButton": "Hesap olu\u015Ftur",
    "auth.switchToSignUp": "Yeni misin? Hesap olu\u015Ftur",
    "auth.switchToSignIn": "Zaten hesab\u0131n var m\u0131? Giri\u015F yap",
    "auth.passwordHint": "En az 8 karakter",
    "auth.genericError": "Bir sorun olu\u015Ftu. L\xFCtfen tekrar deneyin.",
    "auth.locked": "\xC7ok fazla ba\u015Far\u0131s\u0131z deneme. {time} sonra tekrar deneyin.",
    "auth.rateLimited": "\xC7ok fazla istek. L\xFCtfen daha sonra tekrar deneyin.",
    "auth.logout": "\xC7\u0131k\u0131\u015F yap",
    "auth.welcome": "Ho\u015F geldin, {name}",
    "auth.continue": "Devam et",
    "auth.guest": "Misafir olarak devam et",
    "auth.guestHint": "Hesap a\xE7madan NEXUS'u ke\u015Ffet",
    "auth.social.divider": "veya e-posta ile devam et",
    "auth.social.google": "Google ile devam et",
    "auth.social.apple": "Apple ile devam et",
    "auth.social.unavailable": "Bu giri\u015F y\xF6ntemi hen\xFCz yap\u0131land\u0131r\u0131lmad\u0131.",
    "auth.social.error": "Sa\u011Flay\u0131c\u0131yla giri\u015F ba\u015Far\u0131s\u0131z oldu. L\xFCtfen tekrar dene.",
    "mkt.nav.features": "\xD6zellikler",
    "mkt.nav.pricing": "Fiyatland\u0131rma",
    "mkt.nav.testimonials": "M\xFC\u015Fteriler",
    "mkt.nav.integrations": "Entegrasyonlar",
    "mkt.nav.about": "Hakk\u0131m\u0131zda",
    "mkt.nav.download": "\u0130ndir",
    "mkt.nav.faq": "SSS",
    "mkt.nav.signIn": "Giri\u015F Yap",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Sahip oldu\u011Fun her cihaz i\xE7in NEXUS'u indir",
    "mkt.hero.desc": "NEXUS, sesle \xE7al\u0131\u015Fan ve gizlili\u011Fe odaklanan ki\u015Fisel i\u015Fletim sistemidir. Masa\xFCst\xFC uygulamas\u0131n\u0131 ya da mobil uygulamay\u0131 kur; t\xFCm cihazlar\u0131n\u0131 tek yerden, %100 cihaz \xFCzerinde y\xF6net. Web'den de\u011Fil, ger\xE7ek uygulamadan kullan\u0131l\u0131r.",
    "mkt.hero.actionPrimary": "\u0130ndir ({os}) \xB7 v{version}",
    "mkt.hero.actionSecondary": "\u0130\u015F ba\u015F\u0131nda g\xF6r",
    "mkt.hero.trust": "\u2605 500.000+ kullan\u0131c\u0131 \xB7 2000+ ak\u0131ll\u0131 cihaz \xB7 %100 yerel gizlilik",
    "mkt.stats.title": "Rakamlarla NEXUS",
    "mkt.stats.users": "Aktif kullan\u0131c\u0131",
    "mkt.stats.devices": "Desteklenen cihaz",
    "mkt.stats.privacy": "Cihaz \xFCzerinde gizlilik",
    "mkt.stats.rating": "Ortalama puan",
    "mkt.privacy.title": "Verileriniz size aittir",
    "mkt.privacy.processing": "%100 cihaz \xFCzerinde i\u015Fleme",
    "mkt.privacy.encryption": "U\xE7tan uca yerel \u015Fifreleme",
    "mkt.privacy.logging": "S\u0131f\u0131r bulut kayd\u0131",
    "mkt.how.title": "Nas\u0131l \xE7al\u0131\u015F\u0131r",
    "mkt.how.step1.title": "\u0130ndir",
    "mkt.how.step1.desc": "Uygulamay\u0131 platformunuz i\xE7in indirin.",
    "mkt.how.step2.title": "Kur",
    "mkt.how.step2.desc": "Saniyeler i\xE7inde yerel kurulumu tamamlay\u0131n.",
    "mkt.how.step3.title": "Cihazlar\u0131n\u0131 ba\u011Fla",
    "mkt.how.step3.desc": "Ak\u0131ll\u0131 cihazlar\u0131n\u0131z\u0131 g\xFCvenle y\xF6netmeye ba\u015Flay\u0131n.",
    "mkt.preview.title": "NEXUS'u i\u015F ba\u015F\u0131nda g\xF6r",
    "mkt.preview.desc": "Uygulamay\u0131 kurdu\u011Funda kar\u015F\u0131la\u015Faca\u011F\u0131n ger\xE7ek Bug\xFCn panelinin canl\u0131 bir g\xF6r\xFCn\xFCm\xFC.",
    "mkt.preview.tab.today": "Bug\xFCn",
    "mkt.preview.tab.devices": "Cihazlar",
    "mkt.preview.tab.skills": "Rutinler",
    "mkt.preview.tab.family": "Aile",
    "mkt.download.mobile.title": "Mobil uygulamalar",
    "mkt.download.mobile.desc": "iOS ve Android uygulamalar\u0131 \xE7ok yak\u0131nda.",
    "mkt.download.mobile.apple": "\u015Euradan indir:",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "\u015Euradan indir:",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Yak\u0131nda",
    "mkt.seo.title": "NEXUS \u2014 Ki\u015Fisel i\u015Fletim sistemini indir",
    "mkt.seo.desc": "NEXUS'u Windows, macOS ve Linux i\xE7in indir. iOS ve Android \xE7ok yak\u0131nda.",
    "mkt.skipToContent": "\u0130\xE7eri\u011Fe atla",
    "mkt.pricing.title": "Basit, \u015Feffaf fiyatland\u0131rma",
    "mkt.pricing.free": "\xDCcretsiz",
    "mkt.pricing.freeDesc": "Yerel bir ak\u0131ll\u0131 ev i\xE7in ihtiyac\u0131n\u0131z olan her \u015Fey.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Geli\u015Fmi\u015F yapay zeka i\u015Fleme ve uzaktan eri\u015Fim.",
    "mkt.pricing.family": "Aile",
    "mkt.pricing.familyDesc": "Tam eri\u015Fim kontrol\xFCne sahip 5 adede kadar hesap.",
    "mkt.pricing.cta": "\xDCcretsiz ba\u015Fla",
    "mkt.testimonials.title": "Ak\u0131ll\u0131 ev tutkunlar\u0131 taraf\u0131ndan seviliyor",
    "mkt.testimonials.quote1": "NEXUS evimle etkile\u015Fimimi tamamen de\u011Fi\u015Ftirdi. Her \u015Feyin yerel olmas\u0131 \xE7ok daha h\u0131zl\u0131.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Erken Kullan\u0131c\u0131",
    "mkt.testimonials.quote2": "Sonunda gizlili\u011Fime sayg\u0131 duyan bir ak\u0131ll\u0131 ev merkezi. Yerel yapay zeka i\u015Flemleri inan\u0131lmaz tepkisel.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Yaz\u0131l\u0131m M\xFChendisi",
    "mkt.testimonials.quote3": "Karma\u015F\u0131k rutinleri kurmak \xE7ocuk oyunca\u011F\u0131. \u0130nternetim kesildi\u011Finde bile sistemin \xE7\xF6kmemesine bay\u0131l\u0131yorum.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Ak\u0131ll\u0131 Ev Tutkunu",
    "mkt.integrations.title": "Favori cihazlar\u0131n\u0131zla \xE7al\u0131\u015F\u0131r",
    "mkt.changelog.title": "v3.14.2 s\xFCr\xFCm\xFCndeki yenilikler",
    "mkt.requirements.title": "Sistem Gereksinimleri",
    "mkt.requirements.desc": "64-bit i\u015Fletim sistemi ve en az 2GB RAM gerektirir.",
    "mkt.footer.desc": "Ses \xF6ncelikli ki\u015Fisel ev i\u015Fletim sisteminiz. Tamamen yerel, tamamen sizin.",
    "mkt.footer.product": "\xDCr\xFCn",
    "mkt.footer.company": "\u015Eirket & Yasal",
    "mkt.footer.about": "Hakk\u0131m\u0131zda",
    "mkt.footer.privacy": "Gizlilik Politikas\u0131",
    "mkt.footer.terms": "Kullan\u0131m \u015Eartlar\u0131",
    "mkt.footer.noCookies": "S\u0131f\u0131r \xE7erez kullan\u0131yoruz.",
    "mkt.cookie.title": "Gizlilik ve \xC7erezler",
    "mkt.cookie.desc": "Hizmetlerimizi sunabilmek i\xE7in gerekli \xE7erezleri kullan\u0131yoruz. Devam ederek bu temel teknolojilerin kullan\u0131m\u0131n\u0131 kabul etmi\u015F olursunuz.",
    "mkt.cookie.accept": "Anlad\u0131m",
    "mkt.cookie.decline": "Tercihler",
    "mkt.feat.why": "Neden NEXUS",
    "mkt.feat.1.title": "Ses \xF6ncelikli kontrol",
    "mkt.feat.1.desc": "Evinizle do\u011Fal bir \u015Fekilde konu\u015Fun.",
    "mkt.feat.2.title": "Tasar\u0131m gere\u011Fi gizlilik",
    "mkt.feat.2.desc": "Bulut yok, kay\u0131t yok. Sadece yerel \u015Fifreleme.",
    "mkt.feat.3.title": "Birlikte \xE7al\u0131\u015Fabilirlik",
    "mkt.feat.3.desc": "Matter, Zigbee, Z-Wave dahil 500+ protokol.",
    "mkt.feat.4.title": "G\xF6r\xFCnmez AI",
    "mkt.feat.4.desc": "Arka planda \xE7al\u0131\u015F\u0131r, al\u0131\u015Fkanl\u0131klar\u0131n\u0131z\u0131 \xF6\u011Frenir.",
    "mkt.faq.title": "S\u0131k\xE7a sorulan sorular",
    "mkt.faq.1.q": "NEXUS tamamen \xFCcretsiz mi?",
    "mkt.faq.1.a": "Evet. Temel i\u015Fletim sistemi ve yerel kontrol \xF6zellikleri tamamen \xFCcretsizdir.",
    "mkt.faq.2.q": "Hangi cihazlar\u0131 destekliyor?",
    "mkt.faq.2.a": "Matter, Zigbee, Z-Wave cihazlar\u0131 ve 500'den fazla API tabanl\u0131 ekosistem.",
    "mkt.faq.3.q": "Bulut ba\u011Flant\u0131s\u0131 olmadan \xE7al\u0131\u015F\u0131r m\u0131?",
    "mkt.faq.3.a": "Evet. Cihazlar\u0131n\u0131zla yerel a\u011F \xFCzerinden ileti\u015Fim kurar, internet kesilse bile \xE7al\u0131\u015F\u0131r.",
    "mkt.faq.4.q": "Uzaktan eri\u015Fim nas\u0131l sa\u011Flan\u0131yor?",
    "mkt.faq.4.a": "Premium plan ile g\xFCvenli bir u\xE7tan-uca \u015Fifrelenmi\u015F t\xFCnel veya kendi VPN'iniz ile.",
    "mkt.desktop.eyebrow": "Masa\xFCst\xFC",
    "mkt.desktop.title": "Her masa\xFCst\xFC i\xE7in tek uygulama",
    "mkt.desktop.desc": "Windows, macOS ve Linux i\xE7in yerel derlemeler \u2014 her biri platformuna g\xF6re \xF6zelle\u015Ftirilmi\u015F.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Windows 10 ve 11 i\xE7in optimize edilmi\u015F kusursuz arka plan performans\u0131.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Apple Silicon ve Intel i\u015Flemciler i\xE7in \xF6zel olarak derlendi.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "T\xFCm pop\xFCler da\u011F\u0131t\u0131mlarla uyumlu, hafif ve h\u0131zl\u0131.",
    "mkt.desktop.download": "\u0130ndir",
    "mkt.mobile.eyebrow": "Mobil",
    "mkt.mobile.title": "Evin cebinde",
    "mkt.mobile.desc": "NEXUS mobil uygulamas\u0131 kontrol\xFC parmak u\xE7lar\u0131na getirir \u2014 nerede olursan ol.",
    "mkt.mobile.feat1.title": "Yolda sesli kontrol",
    "mkt.mobile.feat1.desc": "Cihaz \xFCzerinde konu\u015Fma tan\u0131ma ile her yerden evinle konu\u015F.",
    "mkt.mobile.feat2.title": "Uzaktan eri\u015Fim",
    "mkt.mobile.feat2.desc": "\u015Eifrelenmi\u015F t\xFCnel \xFCzerinden ev a\u011F\u0131na g\xFCvenle eri\u015F.",
    "mkt.mobile.feat3.title": "Anl\u0131k bildirimler",
    "mkt.mobile.feat3.desc": "Senin i\xE7in \xF6nemli olaylar i\xE7in anl\u0131k uyar\u0131lar al.",
    "mkt.mobile.feat4.title": "Biyometrik kilit",
    "mkt.mobile.feat4.desc": "Face ID ve parmak izi ev kontrollerini gizli tutar.",
    "mkt.cta.title": "Senin evin, senin kurallar\u0131n.",
    "mkt.cta.desc": "NEXUS'u indir ve her cihaz\u0131 tek yerden kontrol et.",
    "mkt.cta.button": "\xDCcretsiz \u0130ndir",
    "mkt.footer.platforms": "Platformlar",
    "Dim living room lights": "Salon \u0131\u015F\u0131klar\u0131n\u0131 k\u0131s",
    "Start morning news briefing": "Sabah haber b\xFCltenini ba\u015Flat",
    "Movie night": "Film gecesi",
    "Good morning": "G\xFCnayd\u0131n",
    "Leaving home": "Evden ayr\u0131l\u0131\u015F",
    "status.pctOnline": "%{pct} \xE7evrimi\xE7i",
    "status.offlineCount": "{count} \xE7evrimd\u0131\u015F\u0131",
    "status.allOnline": "T\xFCm cihazlar \xE7evrimi\xE7i",
    "status.suggestionReady": "Senin i\xE7in {count} \xF6neri haz\u0131r.",
    "status.suggestionsReady": "Senin i\xE7in {count} \xF6neri haz\u0131r.",
    "status.caughtUp": "Her \u015Fey yolunda.",
    "status.onlineOfTotal": "{online}/{total} \xE7evrimi\xE7i",
    // Mobile/Desktop UI
    "mobile.menu": "Men\xFC",
    "mobile.more": "Daha Fazla",
    "mobile.systemStatus": "NEXUS Sistem Durumu",
    "mobile.localNetwork": "Yerel A\u011F Ba\u011Flant\u0131s\u0131",
    "mobile.offline": "%100 \xC7evrimd\u0131\u015F\u0131",
    "mobile.localAI": "Yerel Ses Motoru",
    "mobile.deviceNetwork": "Cihaz A\u011F\u0131",
    "mobile.online": "\xC7evrimi\xE7i",
    "mobile.quickControls": "HIZLI KONTROLLER",
    "mobile.privacyShield": "\xC7evrimd\u0131\u015F\u0131 Gizlilik Kalkan\u0131",
    "mobile.active": "Aktif",
    "mobile.voiceWake": 'Sesle Uyanma ("NEXUS")',
    "mobile.on": "A\xE7\u0131k",
    "mobile.autoBackup": "Otomatik Ev Yede\u011Fi",
    "mobile.backupTime": "Her G\xFCn 03:00",
    "mobile.moreSub.suggestions": "Zamanlanm\u0131\u015F 3 ak\u0131ll\u0131 otomasyon \xF6nerisi",
    "mobile.moreSub.skills": "\xD6\u011Frenilen 5 aktif ses yetene\u011Fi & senaryo",
    "mobile.moreSub.personalization": "Asistan ad\u0131, ses modeli & gizlilik ayarlar\u0131",
    "mobile.moreSub.billing": "NEXUS Aile Paketi \xB7 Aktif Abonelik",
    "mobile.moreSub.downloads": "3 OS platform s\xFCr\xFCmleri & SHA-256 do\u011Frulama",
    "mobile.moreSub.platform": "\xC7apraz platform senkronizasyonu",
    "mobile.moreSub.agents": "Otonom yapay zeka ajanlar\u0131",
    "mobile.moreSub.admin": "Sistem y\xF6netimi & canl\u0131 metrikler",
    "desktop.title": "Ki\u015Fisel \u0130\u015Fletim Sistemi",
    // Installer/Setup
    "setup.welcome": "Ho\u015F Geldiniz",
    "setup.license": "Lisans",
    "setup.location": "Konum",
    "setup.installing": "Y\xFCkleniyor",
    "setup.finish": "Tamamland\u0131",
    "setup.welcomeTitle": "NEXUS AI Kurulumuna Ho\u015F Geldiniz",
    "setup.welcomeDesc": "Bu sihirbaz eviniz i\xE7in ki\u015Fisel i\u015Fletim sisteminiz olan NEXUS AI kurulumunda size rehberlik edecektir.",
    "setup.accept": "Lisans s\xF6zle\u015Fmesini kabul ediyorum",
    "setup.chooseFolder": "Kurulum klas\xF6r\xFCn\xFC se\xE7in",
    "setup.installBtn": "Y\xFCkle",
    "setup.complete": "Kurulum Tamamland\u0131",
    "setup.launchNow": "NEXUS'\u0131 \u015Fimdi ba\u015Flat",
    "setup.continue": "Devam Et",
    "setup.back": "Geri",
    "setup.cancel": "\u0130ptal",
    "setup.windowTitle": "NEXUS Kurulumu",
    "setup.titlebarText": "NEXUS AI Kurulumu",
    "setup.browseHint": "G\xF6zat ileti\u015Fim kutusu \u2014 yerel kabuk k\xF6pr\xFCs\xFC ile entegre edin.",
    "setup.cancelConfirm": "Kurulumu iptal etmek istiyor musunuz?",
    "setup.completeAlert": "Kurulum tamamland\u0131. NEXUS AI ba\u015Flat\u0131lmaya haz\u0131r.",
    "setup.bullet1": "Hafif arka plan servisi \u2014 bo\u015Fta 50 MB RAM alt\u0131nda",
    "setup.bullet2": "Varsay\u0131lan olarak tamamen yerel \u2014 verileriniz cihaz\u0131n\u0131zdan asla ayr\u0131lmaz",
    "setup.bullet3": "Kutudan \xE7\u0131kt\u0131\u011F\u0131 gibi 2.000+ ak\u0131ll\u0131 ev cihaz\u0131yla \xE7al\u0131\u015F\u0131r",
    "setup.continueHint": "Devam etmek i\xE7in <strong>Devam Et</strong> d\xFC\u011Fmesine t\u0131klay\u0131n.",
    "setup.licenseTitle": "Lisans S\xF6zle\u015Fmesi",
    "setup.licenseHint": "L\xFCtfen devam etmeden \xF6nce a\u015Fa\u011F\u0131daki lisans ko\u015Fullar\u0131n\u0131 okuyun ve kabul edin.",
    "setup.licenseText": "NEXUS AI YAZILIM L\u0130SANS S\xD6ZLE\u015EMES\u0130\n\nTelif Hakk\u0131 \xA9 2024 NEXUS AI Teknolojileri. T\xFCm haklar\u0131 sakl\u0131d\u0131r.\n\nL\xDCTFEN YAZILIMI Y\xDCKLEMEDEN VEYA KULLANMADAN \xD6NCE BU L\u0130SANS S\xD6ZLE\u015EMES\u0130N\u0130 D\u0130KKATLE OKUYUN.\n\n1. L\u0130SANS VER\u0130LMES\u0130. Bu S\xF6zle\u015Fmenin ko\u015Fullar\u0131na tabi olarak size m\xFCnhas\u0131r olmayan, devredilemez bir lisans verir.\n\n2. KISITLAMALAR. Yaz\u0131l\u0131m\u0131 kopyalayamaz, de\u011Fi\u015Ftiremez veya da\u011F\u0131tamazs\u0131n\u0131z.\n\n3. G\u0130ZL\u0130L\u0130K. Yaz\u0131l\u0131m \xF6ncelikle cihaz \xFCzerinde \xE7al\u0131\u015F\u0131r.\n\n4. FERAGAT. YAZILIM GARANT\u0130S\u0130Z SUNULUR.\n\n5. FESHETME. Bu lisans ihlal durumunda otomatik sona erer.",
    "setup.locationTitle": "Kurulum Konumu",
    "setup.locationDesc": "NEXUS AI uygulamas\u0131n\u0131n nereye y\xFCklenece\u011Fini se\xE7in. \xC7o\u011Fu kullan\u0131c\u0131 i\xE7in varsay\u0131lan konum \xF6nerilir.",
    "setup.locationDescMac": "NEXUS AI uygulamas\u0131n\u0131n nereye y\xFCklenece\u011Fini se\xE7in. macOS i\xE7in /Applications klas\xF6r\xFC \xF6nerilir.",
    "setup.browse": "G\xF6zat\u2026",
    "setup.spaceInfo": "Gerekli alan: <strong>240 MB</strong> &nbsp;\xB7&nbsp; Kullan\u0131labilir: <strong>48.2 GB</strong>",
    "setup.installingTitle": "NEXUS AI Y\xFCkleniyor",
    "setup.installingDesc": "NEXUS bilgisayar\u0131n\u0131za y\xFCklenirken l\xFCtfen bekleyin.",
    "setup.installingStatus": "\xC7ekirdek servisler y\xFCkleniyor\u2026",
    "setup.finishTitle": "NEXUS Haz\u0131r",
    "setup.finishDesc": "NEXUS AI ba\u015Far\u0131yla kuruldu. <strong>Tamamla</strong> d\xFC\u011Fmesine t\u0131klay\u0131n."
  },
  // ── Spanish ──
  es: {
    "app.greeting": "Hola, {name}, \xBFen qu\xE9 puedo ayudarte?",
    "app.confirmNeeded": "{name}, esa acci\xF3n requiere tu confirmaci\xF3n.",
    "download.title": "Descargar NEXUS",
    "download.primaryButton": "Descargar para {os}",
    "download.otherOs": "\xBFUtilizas otro sistema operativo?",
    "download.checksum": "Suma de comprobaci\xF3n SHA-256",
    "screen.today": "Hoy",
    "screen.homeState": "Inicio",
    "screen.suggestions": "Sugerencias",
    "screen.skills": "Competencias",
    "screen.family": "Familia",
    "screen.devices": "Dispositivos",
    "screen.platform": "Plataformas",
    "screen.agents": "Agentes",
    "screen.personalization": "Personalizaci\xF3n",
    "screen.billing": "Suscripci\xF3n",
    "screen.downloadCenter": "Descargar",
    "screen.adminDashboard": "Panel de control de administraci\xF3n",
    "today.devicesOnline": "Dispositivos conectados",
    "today.energy": "La energ\xEDa hoy",
    "today.activeRoutines": "Rutinas activas",
    "today.suggestions": "Sugerencias",
    "screen.devices.empty": "A\xFAn no hay ning\xFAn dispositivo conectado.",
    "screen.agents.empty": "A\xFAn no hay ning\xFAn agente configurado.",
    "screen.suggestions.empty": "A\xFAn no hay sugerencias: NEXUS AI todav\xEDa est\xE1 aprendiendo.",
    "screen.skills.empty": "A\xFAn no he aprendido ninguna habilidad.",
    "screen.homeState.empty": "Todav\xEDa no hay habitaciones con dispositivos.",
    "plan.free": "Gratis",
    "plan.premium": "Premium",
    "plan.family": "Familia",
    "billing.manage": "Gestionar la suscripci\xF3n",
    "auth.tagline": "Tu sistema operativo personal para el hogar",
    "auth.signInTitle": "Inicia sesi\xF3n en NEXUS",
    "auth.signUpTitle": "Crea tu cuenta de NEXUS",
    "auth.email": "Correo electr\xF3nico",
    "auth.password": "Contrase\xF1a",
    "auth.signInButton": "Iniciar sesi\xF3n",
    "auth.signUpButton": "Crear cuenta",
    "auth.switchToSignUp": "\xBFEres nuevo aqu\xED? Crea una cuenta",
    "auth.switchToSignIn": "\xBFYa tienes una cuenta? Inicia sesi\xF3n",
    "auth.passwordHint": "Al menos 8 caracteres",
    "auth.genericError": "Ha habido un error. Int\xE9ntalo de nuevo.",
    "auth.locked": "Demasiados intentos fallidos. Vuelve a intentarlo en {time}.",
    "auth.rateLimited": "Demasiadas solicitudes. Int\xE9ntalo de nuevo m\xE1s tarde.",
    "auth.logout": "Cerrar sesi\xF3n",
    "auth.welcome": "Bienvenido, {name}",
    "auth.continue": "Continuar",
    "auth.guest": "Continuar como invitado",
    "auth.guestHint": "Explora NEXUS sin necesidad de crear una cuenta",
    "auth.social.divider": "o continuar con el correo electr\xF3nico",
    "auth.social.google": "Continuar con Google",
    "auth.social.apple": "Continuar con Apple",
    "auth.social.unavailable": "Este m\xE9todo de inicio de sesi\xF3n a\xFAn no est\xE1 configurado.",
    "auth.social.error": "No se ha podido iniciar sesi\xF3n con ese proveedor. Int\xE9ntalo de nuevo.",
    "mkt.nav.features": "Caracter\xEDsticas",
    "mkt.nav.pricing": "Precios",
    "mkt.nav.testimonials": "Testimonios",
    "mkt.nav.integrations": "Integraciones",
    "mkt.nav.about": "Qui\xE9nes somos",
    "mkt.nav.download": "Descargar",
    "mkt.nav.faq": "Preguntas frecuentes",
    "mkt.nav.signIn": "Iniciar sesi\xF3n",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Descarga NEXUS en todos los dispositivos que tengas",
    "mkt.hero.desc": "NEXUS es un sistema operativo personal que da prioridad a la voz y se centra en la privacidad. Instala la aplicaci\xF3n de escritorio o la aplicaci\xF3n complementaria para m\xF3viles y controla todos tus dispositivos desde un solo lugar, 100 % en el propio dispositivo. Se utiliza desde la aplicaci\xF3n propiamente dicha, no desde el navegador.",
    "mkt.hero.actionPrimary": "Descargar para {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "M\xEDralo en acci\xF3n",
    "mkt.hero.trust": "\u2605 M\xE1s de 500 000 usuarios \xB7 M\xE1s de 2 000 dispositivos inteligentes \xB7 Privacidad 100 % local",
    "mkt.stats.title": "NEXUS en cifras",
    "mkt.stats.users": "Usuarios activos",
    "mkt.stats.devices": "Dispositivos compatibles",
    "mkt.stats.privacy": "Privacidad en el propio dispositivo",
    "mkt.stats.rating": "Valoraci\xF3n media",
    "mkt.privacy.title": "Tus datos te pertenecen",
    "mkt.privacy.processing": "Procesamiento 100 % en el propio dispositivo",
    "mkt.privacy.encryption": "Cifrado local de extremo a extremo",
    "mkt.privacy.logging": "Sin registro en la nube",
    "mkt.how.title": "C\xF3mo funciona",
    "mkt.how.step1.title": "Descargar",
    "mkt.how.step1.desc": "Descarga la aplicaci\xF3n para tu plataforma.",
    "mkt.how.step2.title": "Instalar",
    "mkt.how.step2.desc": "Realiza la configuraci\xF3n local en cuesti\xF3n de segundos.",
    "mkt.how.step3.title": "Conectar dispositivos",
    "mkt.how.step3.desc": "Empieza a gestionar tu hogar inteligente de forma segura.",
    "mkt.preview.title": "Descubre NEXUS en acci\xF3n",
    "mkt.preview.desc": "Una vista en directo del panel de control real que aparece nada m\xE1s instalar la aplicaci\xF3n.",
    "mkt.preview.tab.today": "Hoy",
    "mkt.preview.tab.devices": "Dispositivos",
    "mkt.preview.tab.skills": "Rutinas",
    "mkt.preview.tab.family": "Familia",
    "mkt.download.mobile.title": "Aplicaciones m\xF3viles",
    "mkt.download.mobile.desc": "Las aplicaciones para iOS y Android est\xE1n en camino.",
    "mkt.download.mobile.apple": "Descargar en el",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "P\xF3ntelo",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Pronto",
    "mkt.seo.title": "NEXUS \u2014 Descarga tu sistema operativo personal",
    "mkt.seo.desc": "Descarga NEXUS para Windows, macOS y Linux. Pr\xF3ximamente estar\xE1 disponible para iOS y Android.",
    "mkt.skipToContent": "Ir al contenido",
    "mkt.pricing.title": "Precios sencillos y transparentes",
    "mkt.pricing.free": "Gratis",
    "mkt.pricing.freeDesc": "Todo lo que necesitas para una casa inteligente local.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Procesamiento avanzado con IA y acceso remoto.",
    "mkt.pricing.family": "Familia",
    "mkt.pricing.familyDesc": "Hasta 5 cuentas con control total de acceso.",
    "mkt.pricing.cta": "Empieza gratis",
    "mkt.testimonials.title": "Apreciado por los aficionados a los hogares inteligentes",
    "mkt.testimonials.quote1": "NEXUS ha cambiado por completo la forma en que me relaciono con mi hogar. Tenerlo todo a mano es mucho m\xE1s r\xE1pido.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Usuario pionero",
    "mkt.testimonials.quote2": "Por fin, un centro de control para el hogar inteligente que respeta mi privacidad. El procesamiento local de la IA es incre\xEDblemente \xE1gil.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Ingeniero de software",
    "mkt.testimonials.quote3": "Configurar rutinas complejas es pan comido. Me encanta que siga funcionando aunque se caiga mi conexi\xF3n a Internet.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Aficionado a la dom\xF3tica",
    "mkt.integrations.title": "Funciona con tus dispositivos favoritos",
    "mkt.changelog.title": "Novedades de la versi\xF3n 3.14.2",
    "mkt.requirements.title": "Requisitos del sistema",
    "mkt.requirements.desc": "Requiere un sistema operativo de 64 bits y al menos 2 GB de RAM.",
    "mkt.footer.desc": "Tu sistema operativo dom\xE9stico personal, dise\xF1ado para el control por voz. Totalmente local, exclusivamente tuyo.",
    "mkt.footer.product": "Producto",
    "mkt.footer.company": "Empresa y aspectos legales",
    "mkt.footer.about": "Qui\xE9nes somos",
    "mkt.footer.privacy": "Pol\xEDtica de privacidad",
    "mkt.footer.terms": "Condiciones de uso",
    "mkt.footer.noCookies": "No utilizamos ninguna cookie.",
    "mkt.cookie.title": "Privacidad y cookies",
    "mkt.cookie.desc": "Utilizamos cookies esenciales para prestar nuestros servicios. Al continuar, aceptas que utilicemos estas tecnolog\xEDas necesarias.",
    "mkt.cookie.accept": "Entendido",
    "mkt.cookie.decline": "Configuraci\xF3n",
    "mkt.feat.why": "\xBFPor qu\xE9 NEXUS?",
    "mkt.feat.1.title": "Control por voz prioritario",
    "mkt.feat.1.desc": "Interact\xFAa con tu hogar de forma natural.",
    "mkt.feat.2.title": "Privacidad por dise\xF1o",
    "mkt.feat.2.desc": "Sin nube, sin registro de datos. Solo cifrado local.",
    "mkt.feat.3.title": "Interoperable",
    "mkt.feat.3.desc": "M\xE1s de 500 protocolos, entre ellos Matter, Zigbee y Z-Wave.",
    "mkt.feat.4.title": "IA invisible",
    "mkt.feat.4.desc": "Funciona en segundo plano y va aprendiendo tus rutinas.",
    "mkt.faq.title": "Preguntas frecuentes",
    "mkt.faq.1.q": "\xBFNEXUS es totalmente gratuito?",
    "mkt.faq.1.a": "S\xED. El sistema operativo b\xE1sico y las funciones de control local son totalmente gratuitos.",
    "mkt.faq.2.q": "\xBFQu\xE9 dispositivos son compatibles?",
    "mkt.faq.2.a": "Dispositivos Matter, Zigbee y Z-Wave, y m\xE1s de 500 ecosistemas basados en API.",
    "mkt.faq.3.q": "\xBFFunciona sin conexi\xF3n a la nube?",
    "mkt.faq.3.a": "S\xED. Se comunica con tus dispositivos a trav\xE9s de la red local, por lo que sigue funcionando incluso si se cae Internet.",
    "mkt.faq.4.q": "\xBFC\xF3mo se proporciona el acceso remoto?",
    "mkt.faq.4.a": "A trav\xE9s de un t\xFAnel seguro con cifrado de extremo a extremo con el plan Premium o tu propia VPN.",
    "mkt.desktop.eyebrow": "Escritorio",
    "mkt.desktop.title": "Una aplicaci\xF3n para cada ordenador de sobremesa",
    "mkt.desktop.desc": "Versiones nativas para Windows, macOS y Linux, cada una optimizada para su plataforma.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Optimizado para Windows 10 y 11, con un funcionamiento en segundo plano fluido.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Dise\xF1ado para Apple Silicon e Intel con una profunda integraci\xF3n en el sistema.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Ligero, r\xE1pido y compatible con todas las principales distribuciones.",
    "mkt.desktop.download": "Descargar",
    "mkt.mobile.eyebrow": "M\xF3vil",
    "mkt.mobile.title": "Tu hogar en el bolsillo",
    "mkt.mobile.desc": "La aplicaci\xF3n complementaria NEXUS te permite tener todo el control al alcance de la mano, est\xE9s donde est\xE9s.",
    "mkt.mobile.feat1.title": "Voz sobre la marcha",
    "mkt.mobile.feat1.desc": "Habla con tu casa desde cualquier lugar gracias al reconocimiento de voz integrado en el dispositivo.",
    "mkt.mobile.feat2.title": "Acceso remoto",
    "mkt.mobile.feat2.desc": "Con\xE9ctate de forma segura a tu red dom\xE9stica a trav\xE9s de un t\xFAnel cifrado.",
    "mkt.mobile.feat3.title": "Notificaciones push",
    "mkt.mobile.feat3.desc": "Recibe alertas inmediatas sobre los eventos que te interesan.",
    "mkt.mobile.feat4.title": "Cerradura biom\xE9trica",
    "mkt.mobile.feat4.desc": "Face ID y el lector de huellas dactilares garantizan la privacidad de los controles de tu hogar.",
    "mkt.cta.title": "Tu casa, tus normas.",
    "mkt.cta.desc": "Descarga NEXUS y controla todos tus dispositivos desde un solo lugar.",
    "mkt.cta.button": "Descargar gratis",
    "mkt.footer.platforms": "Plataformas",
    "Dim living room lights": "Baja la intensidad de las luces del sal\xF3n",
    "Start morning news briefing": "Comienza la sesi\xF3n informativa matutina",
    "Movie night": "Noche de cine",
    "Good morning": "Buenos d\xEDas",
    "Leaving home": "Salir de casa",
    "status.pctOnline": "{pct} % en l\xEDnea",
    "status.offlineCount": "{count} sin conexi\xF3n",
    "status.allOnline": "Todos los dispositivos conectados",
    "status.suggestionReady": "Ya tienes lista la sugerencia sobre el {count}.",
    "status.suggestionsReady": "Ya tenemos listas las sugerencias para el {count}.",
    "status.caughtUp": "Ya est\xE1s al d\xEDa.",
    "status.onlineOfTotal": "{online}/{total} en l\xEDnea",
    "mobile.menu": "Men\xFA",
    "mobile.more": "M\xE1s",
    "mobile.systemStatus": "Estado del sistema NEXUS",
    "mobile.localNetwork": "Conexi\xF3n a la red local",
    "mobile.offline": "100 % sin conexi\xF3n",
    "mobile.localAI": "Motor de IA local",
    "mobile.deviceNetwork": "Red de dispositivos",
    "mobile.online": "En l\xEDnea",
    "mobile.quickControls": "CONTROLES R\xC1PIDOS",
    "mobile.privacyShield": "Escudo de Privacidad fuera de l\xEDnea",
    "mobile.active": "Activo",
    "mobile.voiceWake": "Activaci\xF3n por voz (\xABNEXUS\xBB)",
    "mobile.on": "El",
    "mobile.autoBackup": "Copia de seguridad autom\xE1tica en el dispositivo local",
    "mobile.backupTime": "Todos los d\xEDas a las 03:00",
    "mobile.moreSub.suggestions": "3 sugerencias de automatizaci\xF3n inteligente programadas",
    "mobile.moreSub.skills": "5 habilidades y situaciones relacionadas con la voz activa",
    "mobile.moreSub.personalization": "Nombre del asistente, modelo de voz y ajustes de privacidad",
    "mobile.moreSub.billing": "Plan familiar NEXUS \xB7 Suscripci\xF3n activa",
    "mobile.moreSub.downloads": "3 versiones de la plataforma del sistema operativo y validaci\xF3n SHA-256",
    "mobile.moreSub.platform": "Sincronizaci\xF3n multiplataforma de dispositivos",
    "mobile.moreSub.agents": "Agentes aut\xF3nomos de IA",
    "mobile.moreSub.admin": "Administraci\xF3n del sistema y m\xE9tricas",
    "desktop.title": "Sistema operativo personal",
    "setup.welcome": "Bienvenidos",
    "setup.license": "Licencia",
    "setup.location": "Ubicaci\xF3n",
    "setup.installing": "Instalaci\xF3n",
    "setup.finish": "Finalizar",
    "setup.welcomeTitle": "Bienvenido a la configuraci\xF3n de NEXUS",
    "setup.welcomeDesc": "Este asistente te guiar\xE1 a lo largo del proceso de instalaci\xF3n de NEXUS AI, tu sistema operativo personal para el hogar.",
    "setup.accept": "Acepto el contrato de licencia",
    "setup.chooseFolder": "Elige la carpeta de instalaci\xF3n",
    "setup.installBtn": "Instalar",
    "setup.complete": "Configuraci\xF3n completada",
    "setup.launchNow": "Inicia NEXUS ahora"
  },
  // ── French ──
  fr: {
    "app.greeting": "Bonjour {name}, en quoi puis-je t'aider ?",
    "app.confirmNeeded": "{name}, cette action n\xE9cessite votre confirmation.",
    "download.title": "T\xE9l\xE9charger NEXUS",
    "download.primaryButton": "T\xE9l\xE9charger pour {os}",
    "download.otherOs": "Vous utilisez un autre syst\xE8me d'exploitation ?",
    "download.checksum": "Somme de contr\xF4le SHA-256",
    "screen.today": "Aujourd'hui",
    "screen.homeState": "Accueil",
    "screen.suggestions": "Suggestions",
    "screen.skills": "Comp\xE9tences",
    "screen.family": "Famille",
    "screen.devices": "Appareils",
    "screen.platform": "Plateformes",
    "screen.agents": "Agents",
    "screen.personalization": "Personnalisation",
    "screen.billing": "Abonnement",
    "screen.downloadCenter": "T\xE9l\xE9charger",
    "screen.adminDashboard": "Tableau de bord administrateur",
    "today.devicesOnline": "Appareils connect\xE9s",
    "today.energy": "L'\xE9nergie aujourd'hui",
    "today.activeRoutines": "Programmes d'entra\xEEnement",
    "today.suggestions": "Suggestions",
    "screen.devices.empty": "Aucun appareil n'est encore connect\xE9.",
    "screen.agents.empty": "Aucun agent n'a encore \xE9t\xE9 configur\xE9.",
    "screen.suggestions.empty": "Aucune suggestion pour l'instant \u2014 NEXUS AI est encore en phase d'apprentissage.",
    "screen.skills.empty": "Aucune comp\xE9tence acquise pour l'instant.",
    "screen.homeState.empty": "Il n'y a pour l'instant aucune chambre \xE9quip\xE9e d'appareils.",
    "plan.free": "Gratuit",
    "plan.premium": "Premium",
    "plan.family": "Famille",
    "billing.manage": "G\xE9rer l'abonnement",
    "auth.tagline": "Votre syst\xE8me d'exploitation personnel pour la maison",
    "auth.signInTitle": "Connectez-vous \xE0 NEXUS",
    "auth.signUpTitle": "Cr\xE9ez votre compte NEXUS",
    "auth.email": "E-mail",
    "auth.password": "Mot de passe",
    "auth.signInButton": "Se connecter",
    "auth.signUpButton": "Cr\xE9er un compte",
    "auth.switchToSignUp": "Vous \xEAtes nouveau ici ? Cr\xE9ez un compte",
    "auth.switchToSignIn": "Vous avez d\xE9j\xE0 un compte ? Connectez-vous",
    "auth.passwordHint": "Au moins 8 caract\xE8res",
    "auth.genericError": "Une erreur s'est produite. Veuillez r\xE9essayer.",
    "auth.locked": "Trop de tentatives infructueuses. R\xE9essayez dans {time}.",
    "auth.rateLimited": "Nombre de requ\xEAtes trop \xE9lev\xE9. Veuillez r\xE9essayer plus tard.",
    "auth.logout": "Se d\xE9connecter",
    "auth.welcome": "Bienvenue, {name}",
    "auth.continue": "Continuer",
    "auth.guest": "Continuer en tant qu'invit\xE9",
    "auth.guestHint": "D\xE9couvrez NEXUS sans cr\xE9er de compte",
    "auth.social.divider": "ou continuer par e-mail",
    "auth.social.google": "Continuer avec Google",
    "auth.social.apple": "Continuer avec Apple",
    "auth.social.unavailable": "Cette m\xE9thode de connexion n'est pas encore configur\xE9e.",
    "auth.social.error": "La connexion via ce fournisseur a \xE9chou\xE9. Veuillez r\xE9essayer.",
    "mkt.nav.features": "Caract\xE9ristiques",
    "mkt.nav.pricing": "Tarifs",
    "mkt.nav.testimonials": "T\xE9moignages",
    "mkt.nav.integrations": "Int\xE9grations",
    "mkt.nav.about": "\xC0 propos de nous",
    "mkt.nav.download": "T\xE9l\xE9charger",
    "mkt.nav.faq": "FAQ",
    "mkt.nav.signIn": "Se connecter",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "T\xE9l\xE9chargez NEXUS sur tous vos appareils",
    "mkt.hero.desc": "NEXUS est un syst\xE8me d'exploitation personnel ax\xE9 sur la commande vocale et respectueux de la vie priv\xE9e. Installez l'application de bureau ou l'application mobile associ\xE9e et contr\xF4lez tous vos appareils depuis un seul et m\xEAme endroit \u2014 le tout 100 % en local. Vous l'utilisez depuis l'application elle-m\xEAme, et non depuis un navigateur.",
    "mkt.hero.actionPrimary": "T\xE9l\xE9charger pour {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "D\xE9couvrez-le en action",
    "mkt.hero.trust": "\u2605 Plus de 500 000 utilisateurs \xB7 Plus de 2 000 appareils connect\xE9s \xB7 Confidentialit\xE9 garantie \xE0 100 % au niveau local",
    "mkt.stats.title": "NEXUS en chiffres",
    "mkt.stats.users": "Utilisateurs actifs",
    "mkt.stats.devices": "Appareils pris en charge",
    "mkt.stats.privacy": "Confidentialit\xE9 sur l'appareil",
    "mkt.stats.rating": "Note moyenne",
    "mkt.privacy.title": "Vos donn\xE9es vous appartiennent",
    "mkt.privacy.processing": "Traitement effectu\xE9 \xE0 100 % sur l'appareil",
    "mkt.privacy.encryption": "Chiffrement local de bout en bout",
    "mkt.privacy.logging": "Aucune journalisation dans le cloud",
    "mkt.how.title": "Comment \xE7a marche ?",
    "mkt.how.step1.title": "T\xE9l\xE9charger",
    "mkt.how.step1.desc": "T\xE9l\xE9chargez l'application pour votre syst\xE8me d'exploitation.",
    "mkt.how.step2.title": "Installer",
    "mkt.how.step2.desc": "Effectuez la configuration locale en quelques secondes.",
    "mkt.how.step3.title": "Connecter des appareils",
    "mkt.how.step3.desc": "Commencez \xE0 g\xE9rer votre maison connect\xE9e en toute s\xE9curit\xE9.",
    "mkt.preview.title": "D\xE9couvrez NEXUS en action",
    "mkt.preview.desc": "Un aper\xE7u en direct du v\xE9ritable tableau de bord qui s'affiche d\xE8s que vous installez l'application.",
    "mkt.preview.tab.today": "Aujourd'hui",
    "mkt.preview.tab.devices": "Appareils",
    "mkt.preview.tab.skills": "Routines",
    "mkt.preview.tab.family": "Famille",
    "mkt.download.mobile.title": "Applications mobiles",
    "mkt.download.mobile.desc": "Des applications iOS et Android sont en pr\xE9paration.",
    "mkt.download.mobile.apple": "T\xE9l\xE9charger sur le",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "C'est parti !",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Bient\xF4t",
    "mkt.seo.title": "NEXUS \u2014 T\xE9l\xE9chargez votre syst\xE8me d'exploitation personnel",
    "mkt.seo.desc": "T\xE9l\xE9chargez NEXUS pour Windows, macOS et Linux. Versions iOS et Android disponibles prochainement.",
    "mkt.skipToContent": "Aller directement au contenu",
    "mkt.pricing.title": "Une tarification simple et transparente",
    "mkt.pricing.free": "Gratuit",
    "mkt.pricing.freeDesc": "Tout ce dont vous avez besoin pour une maison connect\xE9e locale.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Traitement avanc\xE9 par IA et acc\xE8s \xE0 distance.",
    "mkt.pricing.family": "Famille",
    "mkt.pricing.familyDesc": "Jusqu'\xE0 5 comptes avec un contr\xF4le d'acc\xE8s complet.",
    "mkt.pricing.cta": "Commencez gratuitement",
    "mkt.testimonials.title": "Tr\xE8s appr\xE9ci\xE9 des passionn\xE9s de domotique",
    "mkt.testimonials.quote1": "NEXUS a compl\xE8tement transform\xE9 ma fa\xE7on d'interagir avec ma maison. Le fait que tout soit g\xE9r\xE9 localement rend les choses tellement plus rapides.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Pionnier",
    "mkt.testimonials.quote2": "Enfin un hub domotique qui respecte ma vie priv\xE9e. Le traitement local par IA est incroyablement r\xE9actif.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Ing\xE9nieur logiciel",
    "mkt.testimonials.quote3": "La configuration de routines complexes est un jeu d'enfant. J'appr\xE9cie particuli\xE8rement le fait que le syst\xE8me continue de fonctionner m\xEAme en cas de coupure d'Internet.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Passionn\xE9 de domotique",
    "mkt.integrations.title": "Compatible avec vos appareils pr\xE9f\xE9r\xE9s",
    "mkt.changelog.title": "Nouveaut\xE9s de la version 3.14.2",
    "mkt.requirements.title": "Configuration requise",
    "mkt.requirements.desc": "N\xE9cessite un syst\xE8me d'exploitation 64 bits et au moins 2 Go de m\xE9moire vive.",
    "mkt.footer.desc": "Votre syst\xE8me d'exploitation domestique personnel, ax\xE9 sur la commande vocale. Enti\xE8rement local, qui n'appartient qu'\xE0 vous.",
    "mkt.footer.product": "Produit",
    "mkt.footer.company": "Entreprise et informations juridiques",
    "mkt.footer.about": "\xC0 propos de nous",
    "mkt.footer.privacy": "Politique de confidentialit\xE9",
    "mkt.footer.terms": "Conditions g\xE9n\xE9rales d'utilisation",
    "mkt.footer.noCookies": "Nous n'utilisons aucun cookie.",
    "mkt.cookie.title": "Confidentialit\xE9 et cookies",
    "mkt.cookie.desc": "Nous utilisons des cookies indispensables au fonctionnement de nos services. En poursuivant votre navigation, vous acceptez que nous utilisions ces technologies indispensables.",
    "mkt.cookie.accept": "D'accord",
    "mkt.cookie.decline": "Param\xE8tres",
    "mkt.feat.why": "Pourquoi NEXUS ?",
    "mkt.feat.1.title": "Commande vocale prioritaire",
    "mkt.feat.1.desc": "Interagissez naturellement avec votre int\xE9rieur.",
    "mkt.feat.2.title": "Con\xE7u pour pr\xE9server la confidentialit\xE9",
    "mkt.feat.2.desc": "Pas de cloud, pas d'enregistrement. Chiffrement local uniquement.",
    "mkt.feat.3.title": "Interop\xE9rable",
    "mkt.feat.3.desc": "Plus de 500 protocoles, dont Matter, Zigbee et Z-Wave.",
    "mkt.feat.4.title": "IA invisible",
    "mkt.feat.4.desc": "Fonctionne en arri\xE8re-plan et apprend \xE0 conna\xEEtre vos habitudes.",
    "mkt.faq.title": "Foire aux questions",
    "mkt.faq.1.q": "NEXUS est-il enti\xE8rement gratuit ?",
    "mkt.faq.1.a": "Oui. Le syst\xE8me d'exploitation de base et les fonctionnalit\xE9s de contr\xF4le local sont enti\xE8rement gratuits.",
    "mkt.faq.2.q": "Quels sont les appareils pris en charge ?",
    "mkt.faq.2.a": "Les appareils Matter, Zigbee et Z-Wave, ainsi que plus de 500 \xE9cosyst\xE8mes bas\xE9s sur des API.",
    "mkt.faq.3.q": "Est-ce que \xE7a fonctionne sans connexion au cloud ?",
    "mkt.faq.3.a": "Oui. Il communique avec vos appareils via le r\xE9seau local et fonctionne m\xEAme en cas de coupure d'Internet.",
    "mkt.faq.4.q": "Comment l'acc\xE8s \xE0 distance est-il assur\xE9 ?",
    "mkt.faq.4.a": "Via un tunnel s\xE9curis\xE9 et chiffr\xE9 de bout en bout avec la formule Premium ou votre propre VPN.",
    "mkt.desktop.eyebrow": "Bureau",
    "mkt.desktop.title": "Une application pour chaque bureau",
    "mkt.desktop.desc": "Versions natives pour Windows, macOS et Linux \u2014 chacune optimis\xE9e pour sa plateforme.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Optimis\xE9 pour Windows 10 et 11, avec un fonctionnement en arri\xE8re-plan fluide.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Con\xE7u pour Apple Silicon et Intel, avec une int\xE9gration syst\xE8me pouss\xE9e.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "L\xE9ger, rapide et compatible avec toutes les principales distributions.",
    "mkt.desktop.download": "T\xE9l\xE9charger",
    "mkt.mobile.eyebrow": "Mobile",
    "mkt.mobile.title": "Votre maison dans votre poche",
    "mkt.mobile.desc": "L'application compagnon NEXUS vous permet de tout contr\xF4ler du bout des doigts, o\xF9 que vous soyez.",
    "mkt.mobile.feat1.title": "La voix en d\xE9placement",
    "mkt.mobile.feat1.desc": "Communiquez avec votre maison o\xF9 que vous soyez gr\xE2ce \xE0 la reconnaissance vocale int\xE9gr\xE9e \xE0 l'appareil.",
    "mkt.mobile.feat2.title": "Acc\xE8s \xE0 distance",
    "mkt.mobile.feat2.desc": "Acc\xE9dez en toute s\xE9curit\xE9 \xE0 votre r\xE9seau domestique via un tunnel crypt\xE9.",
    "mkt.mobile.feat3.title": "Notifications push",
    "mkt.mobile.feat3.desc": "Recevez des alertes en temps r\xE9el pour les \xE9v\xE9nements qui vous int\xE9ressent.",
    "mkt.mobile.feat4.title": "Serrure biom\xE9trique",
    "mkt.mobile.feat4.desc": "Face ID et la reconnaissance d'empreintes digitales garantissent la confidentialit\xE9 de vos commandes domotiques.",
    "mkt.cta.title": "Chez vous, c'est vous qui d\xE9cidez.",
    "mkt.cta.desc": "T\xE9l\xE9chargez NEXUS et g\xE9rez tous vos appareils depuis un seul et m\xEAme endroit.",
    "mkt.cta.button": "T\xE9l\xE9charger gratuitement",
    "mkt.footer.platforms": "Plateformes",
    "Dim living room lights": "\xC9clairage tamis\xE9 du salon",
    "Start morning news briefing": "D\xE9but du point presse matinal",
    "Movie night": "Soir\xE9e cin\xE9ma",
    "Good morning": "Bonjour",
    "Leaving home": "Quitter la maison",
    "status.pctOnline": "{pct} % en ligne",
    "status.offlineCount": "{count} hors ligne",
    "status.allOnline": "Tous les appareils connect\xE9s",
    "status.suggestionReady": "Voici la suggestion concernant le {count}.",
    "status.suggestionsReady": "Les suggestions pour le {count} sont pr\xEAtes.",
    "status.caughtUp": "Tu es \xE0 jour.",
    "status.onlineOfTotal": "{online}/{total} en ligne",
    "mobile.menu": "Menu",
    "mobile.more": "En savoir plus",
    "mobile.systemStatus": "\xC9tat du syst\xE8me NEXUS",
    "mobile.localNetwork": "Connexion au r\xE9seau local",
    "mobile.offline": "100 % hors ligne",
    "mobile.localAI": "Moteur d'IA local",
    "mobile.deviceNetwork": "R\xE9seau de p\xE9riph\xE9riques",
    "mobile.online": "En ligne",
    "mobile.quickControls": "COMMANDES RAPIDES",
    "mobile.privacyShield": "Bouclier de protection de la vie priv\xE9e hors ligne",
    "mobile.active": "Actif",
    "mobile.voiceWake": "R\xE9veil vocal (\xAB NEXUS \xBB)",
    "mobile.on": "Le",
    "mobile.autoBackup": "Sauvegarde automatique de la page d'accueil",
    "mobile.backupTime": "Tous les jours \xE0 3 h",
    "mobile.moreSub.suggestions": "3 suggestions d'automatisation intelligente programm\xE9es",
    "mobile.moreSub.skills": "5 comp\xE9tences et situations pratiques en voix active",
    "mobile.moreSub.personalization": "Nom de l'assistant, mod\xE8le vocal et param\xE8tres de confidentialit\xE9",
    "mobile.moreSub.billing": "Forfait familial NEXUS \xB7 Abonnement actif",
    "mobile.moreSub.downloads": "3 versions de la plateforme OS et validation SHA-256",
    "mobile.moreSub.platform": "Synchronisation multiplateforme des appareils",
    "mobile.moreSub.agents": "Agents IA autonomes",
    "mobile.moreSub.admin": "Administration syst\xE8me et indicateurs de performance",
    "desktop.title": "Syst\xE8me d'exploitation personnel",
    "setup.welcome": "Bienvenue",
    "setup.license": "Licence",
    "setup.location": "Lieu",
    "setup.installing": "Installation",
    "setup.finish": "Terminer",
    "setup.welcomeTitle": "Bienvenue dans le programme d'installation de NEXUS",
    "setup.welcomeDesc": "Cet assistant vous guidera tout au long de l'installation de NEXUS AI, votre syst\xE8me d'exploitation personnel pour la maison.",
    "setup.accept": "J'accepte le contrat de licence",
    "setup.chooseFolder": "Choisissez le dossier d'installation",
    "setup.installBtn": "Installer",
    "setup.complete": "Installation termin\xE9e",
    "setup.launchNow": "Lancez NEXUS d\xE8s maintenant"
  },
  // ── German ──
  de: {
    "app.greeting": "Hallo {name}, wie kann ich dir helfen?",
    "app.confirmNeeded": "{name}, diese Aktion muss von Ihnen best\xE4tigt werden.",
    "download.title": "NEXUS herunterladen",
    "download.primaryButton": "Download f\xFCr {os}",
    "download.otherOs": "Verwenden Sie ein anderes Betriebssystem?",
    "download.checksum": "SHA-256-Pr\xFCfsumme",
    "screen.today": "Heute",
    "screen.homeState": "Startseite",
    "screen.suggestions": "Vorschl\xE4ge",
    "screen.skills": "F\xE4higkeiten",
    "screen.family": "Familie",
    "screen.devices": "Ger\xE4te",
    "screen.platform": "Plattformen",
    "screen.agents": "Vertreter",
    "screen.personalization": "Personalisierung",
    "screen.billing": "Abonnement",
    "screen.downloadCenter": "Herunterladen",
    "screen.adminDashboard": "Admin-Dashboard",
    "today.devicesOnline": "Ger\xE4te online",
    "today.energy": "Energie heute",
    "today.activeRoutines": "Aktive Routinen",
    "today.suggestions": "Vorschl\xE4ge",
    "screen.devices.empty": "Es sind noch keine Ger\xE4te verbunden.",
    "screen.agents.empty": "Es sind noch keine Agenten konfiguriert.",
    "screen.suggestions.empty": "Noch keine Vorschl\xE4ge \u2013 NEXUS AI lernt noch.",
    "screen.skills.empty": "Es wurden noch keine F\xE4higkeiten erlernt.",
    "screen.homeState.empty": "Es gibt noch keine R\xE4ume mit Ger\xE4ten.",
    "plan.free": "Kostenlos",
    "plan.premium": "Premium",
    "plan.family": "Familie",
    "billing.manage": "Abonnement verwalten",
    "auth.tagline": "Dein pers\xF6nliches Betriebssystem f\xFCr zu Hause",
    "auth.signInTitle": "Bei NEXUS anmelden",
    "auth.signUpTitle": "Erstellen Sie Ihr NEXUS-Konto",
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "auth.signInButton": "Anmelden",
    "auth.signUpButton": "Konto erstellen",
    "auth.switchToSignUp": "Neu hier? Erstelle ein Konto",
    "auth.switchToSignIn": "Haben Sie bereits ein Konto? Anmelden",
    "auth.passwordHint": "Mindestens 8 Zeichen",
    "auth.genericError": "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    "auth.locked": "Zu viele fehlgeschlagene Versuche. Versuche es erneut in {time}.",
    "auth.rateLimited": "Zu viele Anfragen. Bitte versuchen Sie es sp\xE4ter erneut.",
    "auth.logout": "Abmelden",
    "auth.welcome": "Willkommen, {name}",
    "auth.continue": "Weiter",
    "auth.guest": "Als Gast weitermachen",
    "auth.guestHint": "NEXUS ohne Konto erkunden",
    "auth.social.divider": "oder mit E-Mail fortfahren",
    "auth.social.google": "Mit Google fortfahren",
    "auth.social.apple": "Weiter mit Apple",
    "auth.social.unavailable": "Diese Anmeldemethode ist noch nicht eingerichtet.",
    "auth.social.error": "Die Anmeldung bei diesem Anbieter ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
    "mkt.nav.features": "Funktionen",
    "mkt.nav.pricing": "Preise",
    "mkt.nav.testimonials": "Kundenstimmen",
    "mkt.nav.integrations": "Integrationen",
    "mkt.nav.about": "\xDCber uns",
    "mkt.nav.download": "Herunterladen",
    "mkt.nav.faq": "H\xE4ufig gestellte Fragen",
    "mkt.nav.signIn": "Anmelden",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Laden Sie NEXUS f\xFCr jedes Ihrer Ger\xE4te herunter",
    "mkt.hero.desc": "NEXUS ist ein sprachgesteuertes, datenschutzorientiertes pers\xF6nliches Betriebssystem. Installieren Sie die Desktop-App oder die mobile Begleit-App und steuern Sie alle Ger\xE4te von einem Ort aus \u2013 zu 100 % direkt auf dem Ger\xE4t. Sie nutzen es \xFCber die eigentliche App, nicht \xFCber den Browser.",
    "mkt.hero.actionPrimary": "Download f\xFCr {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "Sehen Sie es in Aktion",
    "mkt.hero.trust": "\u2605 \xDCber 500.000 Nutzer \xB7 \xDCber 2.000 Smart-Ger\xE4te \xB7 100 % lokaler Datenschutz",
    "mkt.stats.title": "NEXUS in Zahlen",
    "mkt.stats.users": "Aktive Nutzer",
    "mkt.stats.devices": "Unterst\xFCtzte Ger\xE4te",
    "mkt.stats.privacy": "Datenschutz auf dem Ger\xE4t",
    "mkt.stats.rating": "Durchschnittliche Bewertung",
    "mkt.privacy.title": "Ihre Daten geh\xF6ren Ihnen",
    "mkt.privacy.processing": "100 % Verarbeitung auf dem Ger\xE4t",
    "mkt.privacy.encryption": "End-to-End-Verschl\xFCsselung auf lokaler Ebene",
    "mkt.privacy.logging": "Keine Protokollierung in der Cloud",
    "mkt.how.title": "So funktioniert es",
    "mkt.how.step1.title": "Herunterladen",
    "mkt.how.step1.desc": "Laden Sie die App f\xFCr Ihre Plattform herunter.",
    "mkt.how.step2.title": "Installieren",
    "mkt.how.step2.desc": "Schlie\xDFen Sie die lokale Einrichtung in wenigen Sekunden ab.",
    "mkt.how.step3.title": "Ger\xE4te verbinden",
    "mkt.how.step3.desc": "Beginnen Sie damit, Ihr Smart Home sicher zu steuern.",
    "mkt.preview.title": "Sehen Sie NEXUS in Aktion",
    "mkt.preview.desc": "Ein Live-Einblick in das tats\xE4chliche Dashboard, das Ihnen sofort nach der Installation der App angezeigt wird.",
    "mkt.preview.tab.today": "Heute",
    "mkt.preview.tab.devices": "Ger\xE4te",
    "mkt.preview.tab.skills": "Routinen",
    "mkt.preview.tab.family": "Familie",
    "mkt.download.mobile.title": "Mobile Apps",
    "mkt.download.mobile.desc": "iOS- und Android-Apps sind in Vorbereitung.",
    "mkt.download.mobile.apple": "Download auf der",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Los geht\u2019s!",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Bald",
    "mkt.seo.title": "NEXUS \u2013 Laden Sie Ihr pers\xF6nliches Betriebssystem herunter",
    "mkt.seo.desc": "Laden Sie NEXUS f\xFCr Windows, macOS und Linux herunter. Die Versionen f\xFCr iOS und Android folgen in K\xFCrze.",
    "mkt.skipToContent": "Zum Inhalt springen",
    "mkt.pricing.title": "Einfache, transparente Preisgestaltung",
    "mkt.pricing.free": "Kostenlos",
    "mkt.pricing.freeDesc": "Alles, was Sie f\xFCr ein lokales Smart Home ben\xF6tigen.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Fortschrittliche KI-Verarbeitung und Fernzugriff.",
    "mkt.pricing.family": "Familie",
    "mkt.pricing.familyDesc": "Bis zu 5 Konten mit umfassender Zugriffskontrolle.",
    "mkt.pricing.cta": "Kostenlos starten",
    "mkt.testimonials.title": "Beliebt bei Smart-Home-Fans",
    "mkt.testimonials.quote1": "NEXUS hat die Art und Weise, wie ich mit meinem Zuhause interagiere, komplett ver\xE4ndert. Dass alles lokal l\xE4uft, ist einfach so viel schneller.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Fr\xFChanwender",
    "mkt.testimonials.quote2": "Endlich ein Smart-Home-Hub, der meine Privatsph\xE4re respektiert. Die lokale KI-Verarbeitung reagiert unglaublich schnell.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Softwareentwickler",
    "mkt.testimonials.quote3": "Das Einrichten komplexer Abl\xE4ufe ist ein Kinderspiel. Ich finde es toll, dass es auch dann weiterl\xE4uft, wenn mein Internet ausf\xE4llt.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Smart-Home-Begeisterter",
    "mkt.integrations.title": "Funktioniert mit Ihren Lieblingsger\xE4ten",
    "mkt.changelog.title": "Neuerungen in Version 3.14.2",
    "mkt.requirements.title": "Systemanforderungen",
    "mkt.requirements.desc": "Erfordert ein 64-Bit-Betriebssystem und mindestens 2 GB RAM.",
    "mkt.footer.desc": "Ihr sprachgesteuertes pers\xF6nliches Betriebssystem f\xFCr zu Hause. Vollst\xE4ndig lokal, ganz Ihnen allein.",
    "mkt.footer.product": "Produkt",
    "mkt.footer.company": "Unternehmen & Rechtliches",
    "mkt.footer.about": "\xDCber uns",
    "mkt.footer.privacy": "Datenschutzerkl\xE4rung",
    "mkt.footer.terms": "Nutzungsbedingungen",
    "mkt.footer.noCookies": "Wir verwenden keinerlei Cookies.",
    "mkt.cookie.title": "Datenschutz & Cookies",
    "mkt.cookie.desc": "Wir verwenden unverzichtbare Cookies, um unsere Dienste bereitzustellen. Wenn Sie fortfahren, stimmen Sie der Verwendung dieser notwendigen Technologien zu.",
    "mkt.cookie.accept": "Verstanden",
    "mkt.cookie.decline": "Einstellungen",
    "mkt.feat.why": "Warum NEXUS?",
    "mkt.feat.1.title": "Sprachgesteuerte Steuerung",
    "mkt.feat.1.desc": "Gehen Sie ganz nat\xFCrlich mit Ihrem Zuhause um.",
    "mkt.feat.2.title": "Von Grund auf auf Privatsph\xE4re ausgelegt",
    "mkt.feat.2.desc": "Keine Cloud, keine Protokollierung. Ausschlie\xDFlich lokale Verschl\xFCsselung.",
    "mkt.feat.3.title": "Interoperabel",
    "mkt.feat.3.desc": "\xDCber 500 Protokolle, darunter Matter, Zigbee und Z-Wave.",
    "mkt.feat.4.title": "Unsichtbare KI",
    "mkt.feat.4.desc": "L\xE4uft im Hintergrund und lernt Ihre Gewohnheiten kennen.",
    "mkt.faq.title": "H\xE4ufig gestellte Fragen",
    "mkt.faq.1.q": "Ist NEXUS komplett kostenlos?",
    "mkt.faq.1.a": "Ja. Das Kernbetriebssystem und die lokalen Steuerungsfunktionen sind komplett kostenlos.",
    "mkt.faq.2.q": "Welche Ger\xE4te werden unterst\xFCtzt?",
    "mkt.faq.2.a": "Matter-, Zigbee- und Z-Wave-Ger\xE4te sowie \xFCber 500 API-basierte \xD6kosysteme.",
    "mkt.faq.3.q": "Funktioniert es auch ohne Cloud-Verbindung?",
    "mkt.faq.3.a": "Ja. Es kommuniziert \xFCber das lokale Netzwerk mit Ihren Ger\xE4ten und funktioniert auch dann, wenn die Internetverbindung ausf\xE4llt.",
    "mkt.faq.4.q": "Wie wird der Fernzugriff bereitgestellt?",
    "mkt.faq.4.a": "\xDCber einen sicheren, durchgehend verschl\xFCsselten Tunnel mit dem Premium-Tarif oder Ihrem eigenen VPN.",
    "mkt.desktop.eyebrow": "Desktop",
    "mkt.desktop.title": "Eine App f\xFCr jeden Desktop",
    "mkt.desktop.desc": "Native Versionen f\xFCr Windows, macOS und Linux \u2013 jeweils speziell auf die jeweilige Plattform optimiert.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Optimiert f\xFCr Windows 10 und 11 mit nahtlosem Hintergrundbetrieb.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Entwickelt f\xFCr Apple Silicon und Intel mit umfassender Systemintegration.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Leicht, schnell und mit allen g\xE4ngigen Distributionen kompatibel.",
    "mkt.desktop.download": "Herunterladen",
    "mkt.mobile.eyebrow": "Mobil",
    "mkt.mobile.title": "Dein Zuhause in der Hosentasche",
    "mkt.mobile.desc": "Mit der NEXUS-Begleit-App haben Sie alles im Griff \u2013 egal, wo Sie gerade sind.",
    "mkt.mobile.feat1.title": "Sprachausgabe f\xFCr unterwegs",
    "mkt.mobile.feat1.desc": "Mit der ger\xE4teinternen Spracherkennung k\xF6nnen Sie von \xFCberall aus mit Ihrem Smart Home kommunizieren.",
    "mkt.mobile.feat2.title": "Fernzugriff",
    "mkt.mobile.feat2.desc": "Stellen Sie \xFCber einen verschl\xFCsselten Tunnel eine sichere Verbindung zu Ihrem Heimnetzwerk her.",
    "mkt.mobile.feat3.title": "Push-Benachrichtigungen",
    "mkt.mobile.feat3.desc": "Erhalten Sie sofort Benachrichtigungen zu Ereignissen, die f\xFCr Sie wichtig sind.",
    "mkt.mobile.feat4.title": "Biometrisches Schloss",
    "mkt.mobile.feat4.desc": "Face ID und Fingerabdruck sorgen daf\xFCr, dass Ihre Haussteuerung privat bleibt.",
    "mkt.cta.title": "Dein Zuhause, deine Regeln.",
    "mkt.cta.desc": "Laden Sie NEXUS herunter und steuern Sie alle Ger\xE4te von einem Ort aus.",
    "mkt.cta.button": "Kostenlos herunterladen",
    "mkt.footer.platforms": "Plattformen",
    "Dim living room lights": "Die Beleuchtung im Wohnzimmer dimmen",
    "Start morning news briefing": "Beginn der morgendlichen Pressekonferenz",
    "Movie night": "Filmabend",
    "Good morning": "Guten Morgen",
    "Leaving home": "Das Elternhaus verlassen",
    "status.pctOnline": "{pct} % online",
    "status.offlineCount": "{count} offline",
    "status.allOnline": "Alle Ger\xE4te sind online",
    "status.suggestionReady": "Der Vorschlag f\xFCr {count} steht f\xFCr Sie bereit.",
    "status.suggestionsReady": "Die Vorschl\xE4ge f\xFCr {count} stehen f\xFCr Sie bereit.",
    "status.caughtUp": "Jetzt bist du auf dem neuesten Stand.",
    "status.onlineOfTotal": "{online}/{total} online",
    "mobile.menu": "Men\xFC",
    "mobile.more": "Mehr",
    "mobile.systemStatus": "NEXUS-Systemstatus",
    "mobile.localNetwork": "Lokale Netzwerkverbindung",
    "mobile.offline": "100 % offline",
    "mobile.localAI": "Lokale KI-Engine",
    "mobile.deviceNetwork": "Ger\xE4tenetzwerk",
    "mobile.online": "Online",
    "mobile.quickControls": "SCHNELLSTEUERUNGEN",
    "mobile.privacyShield": "Offline-Datenschutzschild",
    "mobile.active": "Aktiv",
    "mobile.voiceWake": "Sprachaktivierung (\u201ENEXUS\u201C)",
    "mobile.on": "Am",
    "mobile.autoBackup": "Automatische Sicherung auf dem Heimcomputer",
    "mobile.backupTime": "T\xE4glich um 03:00 Uhr",
    "mobile.moreSub.suggestions": "3 geplante Vorschl\xE4ge zur intelligenten Automatisierung",
    "mobile.moreSub.skills": "5 erlernte F\xE4higkeiten und Anwendungsszenarien im Bereich der aktiven Sprachverwendung",
    "mobile.moreSub.personalization": "Name des Assistenten, Sprachmodell und Datenschutzeinstellungen",
    "mobile.moreSub.billing": "NEXUS-Familienabo \xB7 Aktives Abonnement",
    "mobile.moreSub.downloads": "3 Betriebssystem-Versionen und SHA-256-Validierung",
    "mobile.moreSub.platform": "Plattform\xFCbergreifende Ger\xE4tesynchronisierung",
    "mobile.moreSub.agents": "Autonome KI-Agenten",
    "mobile.moreSub.admin": "Systemadministration und Kennzahlen",
    "desktop.title": "Pers\xF6nliches Betriebssystem",
    "setup.welcome": "Willkommen",
    "setup.license": "Lizenz",
    "setup.location": "Standort",
    "setup.installing": "Installation",
    "setup.finish": "Fertig",
    "setup.welcomeTitle": "Willkommen bei der NEXUS-Einrichtung",
    "setup.welcomeDesc": "Dieser Assistent f\xFChrt Sie durch die Installation von NEXUS AI \u2013 Ihrem pers\xF6nlichen Betriebssystem f\xFCr zu Hause.",
    "setup.accept": "Ich akzeptiere die Lizenzvereinbarung",
    "setup.chooseFolder": "Installationsordner ausw\xE4hlen",
    "setup.installBtn": "Installieren",
    "setup.complete": "Einrichtung abgeschlossen",
    "setup.launchNow": "NEXUS jetzt starten"
  },
  // ── Italian ──
  it: {
    "app.greeting": "Ciao {name}, come posso aiutarti?",
    "app.confirmNeeded": "{name}, quell'azione richiede la tua conferma.",
    "download.title": "Scarica NEXUS",
    "download.primaryButton": "Scarica per {os}",
    "download.otherOs": "Utilizzi un sistema operativo diverso?",
    "download.checksum": "Checksum SHA-256",
    "screen.today": "Oggi",
    "screen.homeState": "Home",
    "screen.suggestions": "Suggerimenti",
    "screen.skills": "Competenze",
    "screen.family": "Famiglia",
    "screen.devices": "Dispositivi",
    "screen.platform": "Piattaforme",
    "screen.agents": "Agenti",
    "screen.personalization": "Personalizzazione",
    "screen.billing": "Abbonamento",
    "screen.downloadCenter": "Scarica",
    "screen.adminDashboard": "Pannello di controllo amministrativo",
    "today.devicesOnline": "Dispositivi connessi",
    "today.energy": "L'energia oggi",
    "today.activeRoutines": "Esercizi dinamici",
    "today.suggestions": "Suggerimenti",
    "screen.devices.empty": "Non ci sono ancora dispositivi collegati.",
    "screen.agents.empty": "Non sono stati ancora configurati agenti.",
    "screen.suggestions.empty": "Ancora nessun suggerimento \u2014 NEXUS AI sta ancora imparando.",
    "screen.skills.empty": "Non ho ancora acquisito alcuna competenza.",
    "screen.homeState.empty": "Non ci sono ancora stanze dotate di dispositivi.",
    "plan.free": "Gratis",
    "plan.premium": "Premium",
    "plan.family": "Famiglia",
    "billing.manage": "Gestisci l'abbonamento",
    "auth.tagline": "Il tuo sistema operativo personale per la casa",
    "auth.signInTitle": "Accedi a NEXUS",
    "auth.signUpTitle": "Crea il tuo account NEXUS",
    "auth.email": "E-mail",
    "auth.password": "Password",
    "auth.signInButton": "Accedi",
    "auth.signUpButton": "Crea un account",
    "auth.switchToSignUp": "Sei nuovo qui? Crea un account",
    "auth.switchToSignIn": "Hai gi\xE0 un account? Accedi",
    "auth.passwordHint": "Almeno 8 caratteri",
    "auth.genericError": "Si \xE8 verificato un errore. Riprova.",
    "auth.locked": "Troppi tentativi falliti. Riprova in {time}.",
    "auth.rateLimited": "Troppe richieste. Riprova pi\xF9 tardi.",
    "auth.logout": "Esci",
    "auth.welcome": "Benvenuto, {name}",
    "auth.continue": "Continua",
    "auth.guest": "Continua come ospite",
    "auth.guestHint": "Esplora NEXUS senza un account",
    "auth.social.divider": "oppure continua con l'e-mail",
    "auth.social.google": "Continua con Google",
    "auth.social.apple": "Continua con Apple",
    "auth.social.unavailable": "Questo metodo di accesso non \xE8 ancora stato configurato.",
    "auth.social.error": "L'accesso tramite quel provider non \xE8 andato a buon fine. Riprova.",
    "mkt.nav.features": "Caratteristiche",
    "mkt.nav.pricing": "Prezzi",
    "mkt.nav.testimonials": "Testimonianze",
    "mkt.nav.integrations": "Integrazioni",
    "mkt.nav.about": "Chi siamo",
    "mkt.nav.download": "Scarica",
    "mkt.nav.faq": "Domande frequenti",
    "mkt.nav.signIn": "Accedi",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Scarica NEXUS su tutti i tuoi dispositivi",
    "mkt.hero.desc": "NEXUS \xE8 un sistema operativo personale incentrato sulla voce e sulla privacy. Installa l'app desktop o l'app mobile associata e controlla tutti i tuoi dispositivi da un'unica piattaforma \u2014 il tutto al 100% sul dispositivo stesso. Si utilizza tramite l'app vera e propria, non dal browser.",
    "mkt.hero.actionPrimary": "Scarica per {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "Guardalo in azione",
    "mkt.hero.trust": "\u2605 Oltre 500.000 utenti \xB7 Oltre 2.000 dispositivi intelligenti \xB7 Privacy garantita al 100% a livello locale",
    "mkt.stats.title": "NEXUS in cifre",
    "mkt.stats.users": "Utenti attivi",
    "mkt.stats.devices": "Dispositivi supportati",
    "mkt.stats.privacy": "Privacy sul dispositivo",
    "mkt.stats.rating": "Valutazione media",
    "mkt.privacy.title": "I tuoi dati appartengono a te",
    "mkt.privacy.processing": "Elaborazione al 100% sul dispositivo",
    "mkt.privacy.encryption": "Crittografia locale end-to-end",
    "mkt.privacy.logging": "Registrazione zero cloud",
    "mkt.how.title": "Come funziona",
    "mkt.how.step1.title": "Scarica",
    "mkt.how.step1.desc": "Scarica l'app per la tua piattaforma.",
    "mkt.how.step2.title": "Installa",
    "mkt.how.step2.desc": "Completa la configurazione locale in pochi secondi.",
    "mkt.how.step3.title": "Collega i dispositivi",
    "mkt.how.step3.desc": "Inizia a gestire la tua casa intelligente in tutta sicurezza.",
    "mkt.preview.title": "Guarda NEXUS in azione",
    "mkt.preview.desc": "Un'anteprima in tempo reale della vera schermata principale che vedrai non appena installerai l'app.",
    "mkt.preview.tab.today": "Oggi",
    "mkt.preview.tab.devices": "Dispositivi",
    "mkt.preview.tab.skills": "Routine",
    "mkt.preview.tab.family": "Famiglia",
    "mkt.download.mobile.title": "App per dispositivi mobili",
    "mkt.download.mobile.desc": "Le app per iOS e Android sono in arrivo.",
    "mkt.download.mobile.apple": "Scarica dal",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Scaricalo",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "A breve",
    "mkt.seo.title": "NEXUS \u2014 Scarica il tuo sistema operativo personale",
    "mkt.seo.desc": "Scarica NEXUS per Windows, macOS e Linux. Versioni per iOS e Android in arrivo.",
    "mkt.skipToContent": "Vai al contenuto",
    "mkt.pricing.title": "Prezzi semplici e trasparenti",
    "mkt.pricing.free": "Gratis",
    "mkt.pricing.freeDesc": "Tutto ci\xF2 che serve per una casa intelligente a livello locale.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Elaborazione avanzata basata sull'intelligenza artificiale e accesso remoto.",
    "mkt.pricing.family": "Famiglia",
    "mkt.pricing.familyDesc": "Fino a 5 account con controllo completo degli accessi.",
    "mkt.pricing.cta": "Inizia gratuitamente",
    "mkt.testimonials.title": "Apprezzato dagli appassionati di domotica",
    "mkt.testimonials.quote1": "NEXUS ha rivoluzionato il modo in cui interagisco con la mia casa. Avere tutto in locale \xE8 davvero molto pi\xF9 veloce.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Pioniere",
    "mkt.testimonials.quote2": "Finalmente un hub per la casa intelligente che rispetta la mia privacy. L'elaborazione locale tramite IA \xE8 incredibilmente reattiva.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Ingegnere informatico",
    "mkt.testimonials.quote3": "Configurare routine complesse \xE8 un gioco da ragazzi. Mi piace tantissimo il fatto che continui a funzionare anche quando mi si interrompe la connessione a Internet.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Appassionato di domotica",
    "mkt.integrations.title": "Funziona con i tuoi dispositivi preferiti",
    "mkt.changelog.title": "Novit\xE0 della versione 3.14.2",
    "mkt.requirements.title": "Requisiti di sistema",
    "mkt.requirements.desc": "Richiede un sistema operativo a 64 bit e almeno 2 GB di RAM.",
    "mkt.footer.desc": "Il tuo sistema operativo domestico personale incentrato sulla voce. Completamente locale, interamente tuo.",
    "mkt.footer.product": "Prodotto",
    "mkt.footer.company": "Azienda e note legali",
    "mkt.footer.about": "Chi siamo",
    "mkt.footer.privacy": "Informativa sulla privacy",
    "mkt.footer.terms": "Condizioni di servizio",
    "mkt.footer.noCookies": "Non utilizziamo alcun cookie.",
    "mkt.cookie.title": "Privacy e cookie",
    "mkt.cookie.desc": "Utilizziamo i cookie essenziali per fornire i nostri servizi. Proseguendo, acconsenti all'uso di queste tecnologie necessarie.",
    "mkt.cookie.accept": "Capito",
    "mkt.cookie.decline": "Impostazioni",
    "mkt.feat.why": "Perch\xE9 NEXUS",
    "mkt.feat.1.title": 'Controllo "Voice-first"',
    "mkt.feat.1.desc": "Interagisci con la tua casa in modo naturale.",
    "mkt.feat.2.title": "Progettato per garantire la privacy",
    "mkt.feat.2.desc": "Nessun cloud, nessuna registrazione. Solo crittografia locale.",
    "mkt.feat.3.title": "Interoperabile",
    "mkt.feat.3.desc": "Oltre 500 protocolli, tra cui Matter, Zigbee e Z-Wave.",
    "mkt.feat.4.title": "IA invisibile",
    "mkt.feat.4.desc": "Funziona in background, imparando le tue abitudini.",
    "mkt.faq.title": "Domande frequenti",
    "mkt.faq.1.q": "NEXUS \xE8 completamente gratuito?",
    "mkt.faq.1.a": "S\xEC. Il sistema operativo di base e le funzionalit\xE0 di controllo locale sono completamente gratuiti.",
    "mkt.faq.2.q": "Quali dispositivi sono supportati?",
    "mkt.faq.2.a": "Dispositivi Matter, Zigbee, Z-Wave e oltre 500 ecosistemi basati su API.",
    "mkt.faq.3.q": "Funziona senza connessione al cloud?",
    "mkt.faq.3.a": "S\xEC. Comunica con i tuoi dispositivi tramite la rete locale e funziona anche in caso di interruzione della connessione a Internet.",
    "mkt.faq.4.q": "Come viene garantito l'accesso remoto?",
    "mkt.faq.4.a": "Tramite un tunnel crittografato end-to-end sicuro con il piano Premium o la tua VPN.",
    "mkt.desktop.eyebrow": "Desktop",
    "mkt.desktop.title": "Un'app per ogni desktop",
    "mkt.desktop.desc": "Versioni native per Windows, macOS e Linux \u2014 ciascuna ottimizzata per la propria piattaforma.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Ottimizzato per Windows 10 e 11 con funzionamento in background senza interruzioni.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Progettato per Apple Silicon e Intel con una profonda integrazione di sistema.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Leggero, veloce e compatibile con tutte le principali distribuzioni.",
    "mkt.desktop.download": "Scarica",
    "mkt.mobile.eyebrow": "Cellulare",
    "mkt.mobile.title": "La tua casa in tasca",
    "mkt.mobile.desc": "L'app complementare NEXUS ti offre il controllo a portata di mano, ovunque ti trovi.",
    "mkt.mobile.feat1.title": "Voce in movimento",
    "mkt.mobile.feat1.desc": "Parla con la tua casa da qualsiasi luogo grazie al riconoscimento vocale integrato nel dispositivo.",
    "mkt.mobile.feat2.title": "Accesso remoto",
    "mkt.mobile.feat2.desc": "Accedi in tutta sicurezza alla tua rete domestica tramite un tunnel crittografato.",
    "mkt.mobile.feat3.title": "Notifiche push",
    "mkt.mobile.feat3.desc": "Ricevi notifiche immediate sugli eventi che ti interessano.",
    "mkt.mobile.feat4.title": "Serratura biometrica",
    "mkt.mobile.feat4.desc": "Face ID e il riconoscimento delle impronte digitali garantiscono la riservatezza dei comandi della tua casa.",
    "mkt.cta.title": "A casa tua, le regole le fai tu.",
    "mkt.cta.desc": "Scarica NEXUS e gestisci tutti i tuoi dispositivi da un'unica piattaforma.",
    "mkt.cta.button": "Scarica gratis",
    "mkt.footer.platforms": "Piattaforme",
    "Dim living room lights": "Luci soffuse in soggiorno",
    "Start morning news briefing": "Inizio del briefing mattutino",
    "Movie night": "Serata cinema",
    "Good morning": "Buongiorno",
    "Leaving home": "Andare via di casa",
    "status.pctOnline": "{pct}% online",
    "status.offlineCount": "{count} offline",
    "status.allOnline": "Tutti i dispositivi online",
    "status.suggestionReady": "Ecco pronto il suggerimento per {count}.",
    "status.suggestionsReady": "Ecco i suggerimenti per {count}.",
    "status.caughtUp": "Ora sei al passo con tutto.",
    "status.onlineOfTotal": "{online}/{total} online",
    "mobile.menu": "Menu",
    "mobile.more": "Altro",
    "mobile.systemStatus": "Stato del sistema NEXUS",
    "mobile.localNetwork": "Connessione alla rete locale",
    "mobile.offline": "100% offline",
    "mobile.localAI": "Motore di intelligenza artificiale locale",
    "mobile.deviceNetwork": "Rete dei dispositivi",
    "mobile.online": "Online",
    "mobile.quickControls": "COMANDI RAPIDI",
    "mobile.privacyShield": "Scudo per la privacy offline",
    "mobile.active": "Attivo",
    "mobile.voiceWake": 'Attivazione vocale ("NEXUS")',
    "mobile.on": "Il",
    "mobile.autoBackup": "Backup automatico del sistema operativo",
    "mobile.backupTime": "Ogni giorno alle 03:00",
    "mobile.moreSub.suggestions": "3 suggerimenti programmati per l'automazione intelligente",
    "mobile.moreSub.skills": "5 competenze e scenari relativi alla voce attiva",
    "mobile.moreSub.personalization": "Nome dell'assistente, modello vocale e impostazioni sulla privacy",
    "mobile.moreSub.billing": "Piano Famiglia NEXUS \xB7 Abbonamento attivo",
    "mobile.moreSub.downloads": "3 versioni della piattaforma del sistema operativo e convalida SHA-256",
    "mobile.moreSub.platform": "Sincronizzazione multipiattaforma dei dispositivi",
    "mobile.moreSub.agents": "Agenti autonomi basati sull'intelligenza artificiale",
    "mobile.moreSub.admin": "Amministrazione di sistema e metriche",
    "desktop.title": "Sistema operativo personale",
    "setup.welcome": "Benvenuti",
    "setup.license": "Licenza",
    "setup.location": "Ubicazione",
    "setup.installing": "Installazione",
    "setup.finish": "Fine",
    "setup.welcomeTitle": "Benvenuto nella configurazione di NEXUS",
    "setup.welcomeDesc": "Questa procedura guidata ti accompagner\xE0 nell'installazione di NEXUS AI, il tuo sistema operativo personale per la casa.",
    "setup.accept": "Accetto il contratto di licenza",
    "setup.chooseFolder": "Scegli la cartella di installazione",
    "setup.installBtn": "Installa",
    "setup.complete": "Configurazione completata",
    "setup.launchNow": "Avvia subito NEXUS"
  },
  // ── Portuguese (Brazil) ──
  pt: {
    "app.greeting": "Oi, {name}, em que posso ajudar?",
    "app.confirmNeeded": "{name}, essa a\xE7\xE3o precisa da sua confirma\xE7\xE3o.",
    "download.title": "Baixar o NEXUS",
    "download.primaryButton": "Baixar para o {os}",
    "download.otherOs": "Est\xE1 usando um sistema operacional diferente?",
    "download.checksum": "Soma de verifica\xE7\xE3o SHA-256",
    "screen.today": "Hoje",
    "screen.homeState": "P\xE1gina inicial",
    "screen.suggestions": "Sugest\xF5es",
    "screen.skills": "Habilidades",
    "screen.family": "Fam\xEDlia",
    "screen.devices": "Dispositivos",
    "screen.platform": "Plataformas",
    "screen.agents": "Agentes",
    "screen.personalization": "Personaliza\xE7\xE3o",
    "screen.billing": "Assinatura",
    "screen.downloadCenter": "Baixar",
    "screen.adminDashboard": "Painel de controle do administrador",
    "today.devicesOnline": "Dispositivos conectados",
    "today.energy": "Energia hoje",
    "today.activeRoutines": "Rotinas ativas",
    "today.suggestions": "Sugest\xF5es",
    "screen.devices.empty": "Ainda n\xE3o h\xE1 dispositivos conectados.",
    "screen.agents.empty": "Ainda n\xE3o h\xE1 agentes configurados.",
    "screen.suggestions.empty": "Ainda n\xE3o h\xE1 sugest\xF5es \u2014 o NEXUS AI ainda est\xE1 aprendendo.",
    "screen.skills.empty": "Ainda n\xE3o aprendi nenhuma habilidade.",
    "screen.homeState.empty": "Ainda n\xE3o h\xE1 quartos com aparelhos.",
    "plan.free": "Gr\xE1tis",
    "plan.premium": "Premium",
    "plan.family": "Fam\xEDlia",
    "billing.manage": "Gerenciar assinatura",
    "auth.tagline": "Seu sistema operacional pessoal para uso dom\xE9stico",
    "auth.signInTitle": "Fa\xE7a login no NEXUS",
    "auth.signUpTitle": "Crie sua conta no NEXUS",
    "auth.email": "E-mail",
    "auth.password": "Senha",
    "auth.signInButton": "Entrar",
    "auth.signUpButton": "Criar conta",
    "auth.switchToSignUp": "\xC9 novo aqui? Crie uma conta",
    "auth.switchToSignIn": "J\xE1 tem uma conta? Fa\xE7a login",
    "auth.passwordHint": "Pelo menos 8 caracteres",
    "auth.genericError": "Ocorreu um erro. Por favor, tente novamente.",
    "auth.locked": "Muitas tentativas malsucedidas. Tente novamente no {time}.",
    "auth.rateLimited": "Excesso de solicita\xE7\xF5es. Por favor, tente novamente mais tarde.",
    "auth.logout": "Sair",
    "auth.welcome": "Bem-vindo, {name}",
    "auth.continue": "Continuar",
    "auth.guest": "Continuar como visitante",
    "auth.guestHint": "Explore o NEXUS sem uma conta",
    "auth.social.divider": "ou continuar com o e-mail",
    "auth.social.google": "Continuar com o Google",
    "auth.social.apple": "Continuar com a Apple",
    "auth.social.unavailable": "Esse m\xE9todo de login ainda n\xE3o est\xE1 configurado.",
    "auth.social.error": "O login com esse provedor falhou. Por favor, tente novamente.",
    "mkt.nav.features": "Recursos",
    "mkt.nav.pricing": "Pre\xE7os",
    "mkt.nav.testimonials": "Depoimentos",
    "mkt.nav.integrations": "Integra\xE7\xF5es",
    "mkt.nav.about": "Sobre n\xF3s",
    "mkt.nav.download": "Baixar",
    "mkt.nav.faq": "Perguntas frequentes",
    "mkt.nav.signIn": "Entrar",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Baixe o NEXUS para todos os seus dispositivos",
    "mkt.hero.desc": "O NEXUS \xE9 um sistema operacional pessoal que prioriza o comando de voz e a privacidade. Instale o aplicativo para desktop ou o aplicativo complementar para celular e controle todos os seus dispositivos a partir de um \xFAnico lugar \u2014 100% no pr\xF3prio dispositivo. Voc\xEA o utiliza diretamente pelo aplicativo, e n\xE3o pelo navegador.",
    "mkt.hero.actionPrimary": "Baixar para {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "Veja como funciona",
    "mkt.hero.trust": "\u2605 Mais de 500.000 usu\xE1rios \xB7 Mais de 2.000 dispositivos inteligentes \xB7 Privacidade 100% local",
    "mkt.stats.title": "A NEXUS em n\xFAmeros",
    "mkt.stats.users": "Usu\xE1rios ativos",
    "mkt.stats.devices": "Dispositivos compat\xEDveis",
    "mkt.stats.privacy": "Privacidade no pr\xF3prio dispositivo",
    "mkt.stats.rating": "Avalia\xE7\xE3o m\xE9dia",
    "mkt.privacy.title": "Seus dados pertencem a voc\xEA",
    "mkt.privacy.processing": "Processamento 100% no pr\xF3prio dispositivo",
    "mkt.privacy.encryption": "Criptografia local de ponta a ponta",
    "mkt.privacy.logging": "Registro sem nuvem",
    "mkt.how.title": "Como funciona",
    "mkt.how.step1.title": "Baixar",
    "mkt.how.step1.desc": "Baixe o aplicativo para a sua plataforma.",
    "mkt.how.step2.title": "Instalar",
    "mkt.how.step2.desc": "Conclua a configura\xE7\xE3o local em segundos.",
    "mkt.how.step3.title": "Conectar dispositivos",
    "mkt.how.step3.desc": "Comece a gerenciar sua casa inteligente com seguran\xE7a.",
    "mkt.preview.title": "Veja o NEXUS em a\xE7\xE3o",
    "mkt.preview.desc": "Uma pr\xE9via ao vivo do painel de controle real que voc\xEA v\xEA assim que instala o aplicativo.",
    "mkt.preview.tab.today": "Hoje",
    "mkt.preview.tab.devices": "Dispositivos",
    "mkt.preview.tab.skills": "Rotinas",
    "mkt.preview.tab.family": "Fam\xEDlia",
    "mkt.download.mobile.title": "Aplicativos m\xF3veis",
    "mkt.download.mobile.desc": "Os aplicativos para iOS e Android est\xE3o a caminho.",
    "mkt.download.mobile.apple": "Baixe no",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "V\xE1 em frente!",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Em breve",
    "mkt.seo.title": "NEXUS \u2014 Baixe seu sistema operacional pessoal",
    "mkt.seo.desc": "Baixe o NEXUS para Windows, macOS e Linux. Vers\xF5es para iOS e Android em breve.",
    "mkt.skipToContent": "Ir direto para o conte\xFAdo",
    "mkt.pricing.title": "Pre\xE7os simples e transparentes",
    "mkt.pricing.free": "Gr\xE1tis",
    "mkt.pricing.freeDesc": "Tudo o que voc\xEA precisa para uma casa inteligente local.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Processamento avan\xE7ado de IA e acesso remoto.",
    "mkt.pricing.family": "Fam\xEDlia",
    "mkt.pricing.familyDesc": "At\xE9 5 contas com controle total de acesso.",
    "mkt.pricing.cta": "Comece de gra\xE7a",
    "mkt.testimonials.title": "Adorado pelos entusiastas de casas inteligentes",
    "mkt.testimonials.quote1": "O NEXUS mudou completamente a maneira como eu interajo com minha casa. Ter tudo armazenado localmente \xE9 muito mais r\xE1pido.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Adotante precoce",
    "mkt.testimonials.quote2": "Finalmente, um hub para casa inteligente que respeita minha privacidade. O processamento local de IA \xE9 incrivelmente \xE1gil.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Engenheiro de Software",
    "mkt.testimonials.quote3": "Configurar rotinas complexas \xE9 muito f\xE1cil. Adoro o fato de que o sistema continua funcionando mesmo quando minha internet cai.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Entusiasta de casas inteligentes",
    "mkt.integrations.title": "Funciona com seus dispositivos favoritos",
    "mkt.changelog.title": "Novidades da vers\xE3o 3.14.2",
    "mkt.requirements.title": "Requisitos do sistema",
    "mkt.requirements.desc": "Requer um sistema operacional de 64 bits e, no m\xEDnimo, 2 GB de RAM.",
    "mkt.footer.desc": "Seu sistema operacional dom\xE9stico pessoal que prioriza o comando de voz. Totalmente local, inteiramente seu.",
    "mkt.footer.product": "Produto",
    "mkt.footer.company": "Empresa e Aspectos Jur\xEDdicos",
    "mkt.footer.about": "Sobre n\xF3s",
    "mkt.footer.privacy": "Pol\xEDtica de Privacidade",
    "mkt.footer.terms": "Termos de Servi\xE7o",
    "mkt.footer.noCookies": "N\xE3o usamos nenhum cookie.",
    "mkt.cookie.title": "Privacidade e Cookies",
    "mkt.cookie.desc": "Utilizamos cookies essenciais para prestar nossos servi\xE7os. Ao continuar, voc\xEA concorda com o uso dessas tecnologias necess\xE1rias.",
    "mkt.cookie.accept": "Entendi",
    "mkt.cookie.decline": "Configura\xE7\xF5es",
    "mkt.feat.why": "Por que a NEXUS?",
    "mkt.feat.1.title": "Controle com prioridade \xE0 voz",
    "mkt.feat.1.desc": "Interaja com sua casa de forma natural.",
    "mkt.feat.2.title": "Concebido para ser privado",
    "mkt.feat.2.desc": "Sem nuvem, sem registro. Apenas criptografia local.",
    "mkt.feat.3.title": "Interoper\xE1vel",
    "mkt.feat.3.desc": "Mais de 500 protocolos, incluindo Matter, Zigbee e Z-Wave.",
    "mkt.feat.4.title": "IA invis\xEDvel",
    "mkt.feat.4.desc": "Funciona em segundo plano, aprendendo suas rotinas.",
    "mkt.faq.title": "Perguntas frequentes",
    "mkt.faq.1.q": "O NEXUS \xE9 totalmente gratuito?",
    "mkt.faq.1.a": "Sim. O sistema operacional b\xE1sico e os recursos de controle local s\xE3o totalmente gratuitos.",
    "mkt.faq.2.q": "Quais dispositivos s\xE3o compat\xEDveis?",
    "mkt.faq.2.a": "Dispositivos Matter, Zigbee e Z-Wave, al\xE9m de mais de 500 ecossistemas baseados em API.",
    "mkt.faq.3.q": "Isso funciona sem conex\xE3o com a nuvem?",
    "mkt.faq.3.a": "Sim. Ele se comunica com seus dispositivos pela rede local e funciona mesmo se a internet cair.",
    "mkt.faq.4.q": "Como \xE9 feito o acesso remoto?",
    "mkt.faq.4.a": "Por meio de um t\xFAnel seguro com criptografia de ponta a ponta, com o plano Premium ou sua pr\xF3pria VPN.",
    "mkt.desktop.eyebrow": "\xC1rea de trabalho",
    "mkt.desktop.title": "Um aplicativo para cada \xE1rea de trabalho",
    "mkt.desktop.desc": "Vers\xF5es nativas para Windows, macOS e Linux \u2014 cada uma otimizada para sua respectiva plataforma.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Otimizado para o Windows 10 e 11, com funcionamento em segundo plano sem interrup\xE7\xF5es.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Desenvolvido para Apple Silicon e Intel, com integra\xE7\xE3o profunda ao sistema.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Leve, r\xE1pido e compat\xEDvel com todas as principais distribui\xE7\xF5es.",
    "mkt.desktop.download": "Baixar",
    "mkt.mobile.eyebrow": "Celular",
    "mkt.mobile.title": "Sua casa no seu bolso",
    "mkt.mobile.desc": "O aplicativo complementar NEXUS coloca o controle na ponta dos seus dedos \u2014 onde quer que voc\xEA esteja.",
    "mkt.mobile.feat1.title": "Voz em qualquer lugar",
    "mkt.mobile.feat1.desc": "Converse com sua casa de qualquer lugar usando o reconhecimento de voz integrado ao aparelho.",
    "mkt.mobile.feat2.title": "Acesso remoto",
    "mkt.mobile.feat2.desc": "Acesse com seguran\xE7a sua rede dom\xE9stica por meio de um t\xFAnel criptografado.",
    "mkt.mobile.feat3.title": "Notifica\xE7\xF5es push",
    "mkt.mobile.feat3.desc": "Receba alertas instant\xE2neos sobre eventos que s\xE3o importantes para voc\xEA.",
    "mkt.mobile.feat4.title": "Fechadura biom\xE9trica",
    "mkt.mobile.feat4.desc": "O Face ID e a impress\xE3o digital garantem a privacidade dos controles da sua casa.",
    "mkt.cta.title": "Sua casa, suas regras.",
    "mkt.cta.desc": "Baixe o NEXUS e controle todos os dispositivos a partir de um \xFAnico lugar.",
    "mkt.cta.button": "Baixe gratuitamente",
    "mkt.footer.platforms": "Plataformas",
    "Dim living room lights": "Luzes fracas na sala de estar",
    "Start morning news briefing": "In\xEDcio da coletiva de imprensa matinal",
    "Movie night": "Noite de cinema",
    "Good morning": "Bom dia",
    "Leaving home": "Sair de casa",
    "status.pctOnline": "{pct}% online",
    "status.offlineCount": "{count} fora de linha",
    "status.allOnline": "Todos os dispositivos conectados",
    "status.suggestionReady": "A sugest\xE3o para o {count} j\xE1 est\xE1 pronta para voc\xEA.",
    "status.suggestionsReady": "As sugest\xF5es para o {count} j\xE1 est\xE3o \xE0 sua disposi\xE7\xE3o.",
    "status.caughtUp": "Voc\xEA j\xE1 est\xE1 em dia.",
    "status.onlineOfTotal": "{online}/{total} online",
    "mobile.menu": "Menu",
    "mobile.more": "Mais",
    "mobile.systemStatus": "Status do sistema NEXUS",
    "mobile.localNetwork": "Conex\xE3o de rede local",
    "mobile.offline": "100% offline",
    "mobile.localAI": "Motor de IA local",
    "mobile.deviceNetwork": "Rede de dispositivos",
    "mobile.online": "Online",
    "mobile.quickControls": "CONTROLES R\xC1PIDOS",
    "mobile.privacyShield": "Escudo de Privacidade Offline",
    "mobile.active": "Ativo",
    "mobile.voiceWake": "Ativa\xE7\xE3o por voz (\u201CNEXUS\u201D)",
    "mobile.on": "Em",
    "mobile.autoBackup": "Backup autom\xE1tico do sistema operacional",
    "mobile.backupTime": "Diariamente \xE0s 03:00",
    "mobile.moreSub.suggestions": "3 sugest\xF5es de automa\xE7\xE3o inteligente programadas",
    "mobile.moreSub.skills": "5 habilidades e situa\xE7\xF5es pr\xE1ticas relacionadas \xE0 voz ativa",
    "mobile.moreSub.personalization": "Nome do assistente, modelo de voz e configura\xE7\xF5es de privacidade",
    "mobile.moreSub.billing": "Plano Familiar NEXUS \xB7 Assinatura ativa",
    "mobile.moreSub.downloads": "3 vers\xF5es da plataforma do sistema operacional e valida\xE7\xE3o SHA-256",
    "mobile.moreSub.platform": "Sincroniza\xE7\xE3o entre dispositivos em v\xE1rias plataformas",
    "mobile.moreSub.agents": "Agentes aut\xF4nomos de IA",
    "mobile.moreSub.admin": "Administra\xE7\xE3o de sistemas e m\xE9tricas",
    "desktop.title": "Sistema Operacional Pessoal",
    "setup.welcome": "Bem-vindo",
    "setup.license": "Licen\xE7a",
    "setup.location": "Localiza\xE7\xE3o",
    "setup.installing": "Instalando",
    "setup.finish": "Concluir",
    "setup.welcomeTitle": "Bem-vindo \xE0 configura\xE7\xE3o do NEXUS",
    "setup.welcomeDesc": "Este assistente ir\xE1 gui\xE1-lo durante a instala\xE7\xE3o do NEXUS AI \u2014 seu sistema operacional pessoal para a casa.",
    "setup.accept": "Aceito o contrato de licen\xE7a",
    "setup.chooseFolder": "Escolha a pasta de instala\xE7\xE3o",
    "setup.installBtn": "Instalar",
    "setup.complete": "Configura\xE7\xE3o conclu\xEDda",
    "setup.launchNow": "Inicie o NEXUS agora"
  },
  // ── Dutch ──
  nl: {
    "app.greeting": "Hallo {name}, hoe kan ik je helpen?",
    "app.confirmNeeded": "{name}, voor die actie is jouw bevestiging nodig.",
    "download.title": "NEXUS downloaden",
    "download.primaryButton": "Download voor {os}",
    "download.otherOs": "Gebruik je een ander besturingssysteem?",
    "download.checksum": "SHA-256-controlesom",
    "screen.today": "Vandaag",
    "screen.homeState": "Home",
    "screen.suggestions": "Suggesties",
    "screen.skills": "Vaardigheden",
    "screen.family": "Familie",
    "screen.devices": "Apparaten",
    "screen.platform": "Platforms",
    "screen.agents": "Agenten",
    "screen.personalization": "Personalisatie",
    "screen.billing": "Abonnement",
    "screen.downloadCenter": "Downloaden",
    "screen.adminDashboard": "Beheerdersdashboard",
    "today.devicesOnline": "Apparaten online",
    "today.energy": "Energie vandaag",
    "today.activeRoutines": "Actieve routines",
    "today.suggestions": "Suggesties",
    "screen.devices.empty": "Er zijn nog geen apparaten aangesloten.",
    "screen.agents.empty": "Er zijn nog geen agents geconfigureerd.",
    "screen.suggestions.empty": "Nog geen suggesties \u2014 NEXUS AI is nog aan het leren.",
    "screen.skills.empty": "Er zijn nog geen vaardigheden aangeleerd.",
    "screen.homeState.empty": "Er zijn nog geen kamers met apparaten.",
    "plan.free": "Gratis",
    "plan.premium": "Premium",
    "plan.family": "Familie",
    "billing.manage": "Abonnement beheren",
    "auth.tagline": "Uw persoonlijke besturingssysteem voor thuis",
    "auth.signInTitle": "Log in bij NEXUS",
    "auth.signUpTitle": "Maak je NEXUS-account aan",
    "auth.email": "E-mail",
    "auth.password": "Wachtwoord",
    "auth.signInButton": "Inloggen",
    "auth.signUpButton": "Account aanmaken",
    "auth.switchToSignUp": "Nieuw hier? Maak een account aan",
    "auth.switchToSignIn": "Heb je al een account? Log in",
    "auth.passwordHint": "Ten minste 8 tekens",
    "auth.genericError": "Er is een fout opgetreden. Probeer het nog eens.",
    "auth.locked": "Te veel mislukte pogingen. Probeer het opnieuw in {time}.",
    "auth.rateLimited": "Er zijn te veel verzoeken. Probeer het later nog eens.",
    "auth.logout": "Uitloggen",
    "auth.welcome": "Welkom, {name}",
    "auth.continue": "Doorgaan",
    "auth.guest": "Doorgaan als gast",
    "auth.guestHint": "Ontdek NEXUS zonder account",
    "auth.social.divider": "of ga verder via e-mail",
    "auth.social.google": "Doorgaan met Google",
    "auth.social.apple": "Doorgaan met Apple",
    "auth.social.unavailable": "Deze aanmeldmethode is nog niet ingesteld.",
    "auth.social.error": "Het inloggen bij die provider is mislukt. Probeer het nog eens.",
    "mkt.nav.features": "Kenmerken",
    "mkt.nav.pricing": "Prijzen",
    "mkt.nav.testimonials": "Getuigenissen",
    "mkt.nav.integrations": "Integraties",
    "mkt.nav.about": "Over ons",
    "mkt.nav.download": "Downloaden",
    "mkt.nav.faq": "Veelgestelde vragen",
    "mkt.nav.signIn": "Inloggen",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Download NEXUS voor al je apparaten",
    "mkt.hero.desc": "NEXUS is een op spraak gebaseerd, privacygericht persoonlijk besturingssysteem. Installeer de desktop-app of de mobiele app en bedien al je apparaten vanaf \xE9\xE9n plek \u2014 100% op het apparaat zelf. Je gebruikt het via de app zelf, niet via de browser.",
    "mkt.hero.actionPrimary": "Downloaden voor {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "Bekijk het in actie",
    "mkt.hero.trust": "\u2605 Meer dan 500.000 gebruikers \xB7 Meer dan 2000 slimme apparaten \xB7 100% lokale privacy",
    "mkt.stats.title": "NEXUS in cijfers",
    "mkt.stats.users": "Actieve gebruikers",
    "mkt.stats.devices": "Ondersteunde apparaten",
    "mkt.stats.privacy": "Privacy op het apparaat zelf",
    "mkt.stats.rating": "Gemiddelde beoordeling",
    "mkt.privacy.title": "Jouw gegevens zijn van jou",
    "mkt.privacy.processing": "100% verwerking op het apparaat zelf",
    "mkt.privacy.encryption": "Lokale versleuteling van begin tot eind",
    "mkt.privacy.logging": "Geen logboekregistratie in de cloud",
    "mkt.how.title": "Hoe het werkt",
    "mkt.how.step1.title": "Downloaden",
    "mkt.how.step1.desc": "Download de app voor jouw platform.",
    "mkt.how.step2.title": "Installeren",
    "mkt.how.step2.desc": "De lokale installatie is binnen enkele seconden voltooid.",
    "mkt.how.step3.title": "Apparaten aansluiten",
    "mkt.how.step3.desc": "Ga veilig aan de slag met het beheren van je slimme huis.",
    "mkt.preview.title": "Bekijk NEXUS in actie",
    "mkt.preview.desc": "Een live-weergave van het echte dashboard dat je te zien krijgt zodra je de app installeert.",
    "mkt.preview.tab.today": "Vandaag",
    "mkt.preview.tab.devices": "Apparaten",
    "mkt.preview.tab.skills": "Routines",
    "mkt.preview.tab.family": "Familie",
    "mkt.download.mobile.title": "Mobiele apps",
    "mkt.download.mobile.desc": "Er komen binnenkort iOS- en Android-apps aan.",
    "mkt.download.mobile.apple": "Download op de",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Ga ervoor!",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Binnenkort",
    "mkt.seo.title": "NEXUS \u2014 Download je eigen besturingssysteem",
    "mkt.seo.desc": "Download NEXUS voor Windows, macOS en Linux. Binnenkort ook beschikbaar voor iOS en Android.",
    "mkt.skipToContent": "Ga naar de inhoud",
    "mkt.pricing.title": "Eenvoudige, transparante prijsstelling",
    "mkt.pricing.free": "Gratis",
    "mkt.pricing.freeDesc": "Alles wat je nodig hebt voor een slim huis bij jou in de buurt.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Geavanceerde AI-verwerking en toegang op afstand.",
    "mkt.pricing.family": "Familie",
    "mkt.pricing.familyDesc": "Maximaal 5 accounts met volledige toegangsbeheer.",
    "mkt.pricing.cta": "Begin gratis",
    "mkt.testimonials.title": "Populair bij liefhebbers van slimme huizen",
    "mkt.testimonials.quote1": "NEXUS heeft de manier waarop ik met mijn huis omga volledig veranderd. Het is gewoon zoveel sneller als alles lokaal is.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Pionier",
    "mkt.testimonials.quote2": "Eindelijk een smart home-hub die mijn privacy respecteert. De lokale AI-verwerking reageert ongelooflijk snel.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Software-engineer",
    "mkt.testimonials.quote3": "Het instellen van complexe routines is een fluitje van een cent. Ik vind het geweldig dat het gewoon blijft werken als mijn internetverbinding uitvalt.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Liefhebber van slimme huizen",
    "mkt.integrations.title": "Werkt met je favoriete apparaten",
    "mkt.changelog.title": "Wat is er nieuw in versie 3.14.2",
    "mkt.requirements.title": "Systeemvereisten",
    "mkt.requirements.desc": "Vereist een 64-bits besturingssysteem en minimaal 2 GB RAM.",
    "mkt.footer.desc": "Je persoonlijke besturingssysteem voor thuis, waarbij je stem centraal staat. Volledig lokaal, helemaal van jou.",
    "mkt.footer.product": "Product",
    "mkt.footer.company": "Bedrijf & Juridisch",
    "mkt.footer.about": "Over ons",
    "mkt.footer.privacy": "Privacybeleid",
    "mkt.footer.terms": "Gebruiksvoorwaarden",
    "mkt.footer.noCookies": "Wij gebruiken helemaal geen cookies.",
    "mkt.cookie.title": "Privacy en cookies",
    "mkt.cookie.desc": "We gebruiken essenti\xEBle cookies om onze diensten te kunnen aanbieden. Door verder te gaan, gaat u akkoord met ons gebruik van deze noodzakelijke technologie\xEBn.",
    "mkt.cookie.accept": "Ok\xE9, begrepen",
    "mkt.cookie.decline": "Instellingen",
    "mkt.feat.why": "Waarom NEXUS?",
    "mkt.feat.1.title": "Bediening via spraak",
    "mkt.feat.1.desc": "Ga op een natuurlijke manier om met je huis.",
    "mkt.feat.2.title": "Van nature priv\xE9",
    "mkt.feat.2.desc": "Geen cloud, geen logboekregistratie. Uitsluitend lokale versleuteling.",
    "mkt.feat.3.title": "Interoperabel",
    "mkt.feat.3.desc": "Meer dan 500 protocollen, waaronder Matter, Zigbee en Z-Wave.",
    "mkt.feat.4.title": "Onzichtbare AI",
    "mkt.feat.4.desc": "Draait op de achtergrond en leert je gewoontes kennen.",
    "mkt.faq.title": "Veelgestelde vragen",
    "mkt.faq.1.q": "Is NEXUS helemaal gratis?",
    "mkt.faq.1.a": "Ja. Het basisbesturingssysteem en de lokale bedieningsfuncties zijn volledig gratis.",
    "mkt.faq.2.q": "Welke apparaten worden ondersteund?",
    "mkt.faq.2.a": "Matter-, Zigbee- en Z-Wave-apparaten en meer dan 500 op API\u2019s gebaseerde ecosystemen.",
    "mkt.faq.3.q": "Werkt het ook zonder verbinding met de cloud?",
    "mkt.faq.3.a": "Ja. Het maakt via het lokale netwerk verbinding met je apparaten en werkt zelfs als de internetverbinding uitvalt.",
    "mkt.faq.4.q": "Hoe wordt toegang op afstand geregeld?",
    "mkt.faq.4.a": "Via een beveiligde, van begin tot eind versleutelde tunnel met het Premium-abonnement of je eigen VPN.",
    "mkt.desktop.eyebrow": "Bureaublad",
    "mkt.desktop.title": "E\xE9n app voor elke desktop",
    "mkt.desktop.desc": "Native-versies voor Windows, macOS en Linux \u2014 elk afgestemd op het betreffende platform.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Geoptimaliseerd voor Windows 10 en 11, met naadloze werking op de achtergrond.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Ontwikkeld voor Apple Silicon en Intel, met diepgaande systeemintegratie.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Lichtgewicht, snel en compatibel met alle gangbare distributies.",
    "mkt.desktop.download": "Downloaden",
    "mkt.mobile.eyebrow": "Mobiel",
    "mkt.mobile.title": "Je huis op zak",
    "mkt.mobile.desc": "Met de NEXUS-app heb je alles binnen handbereik \u2014 waar je ook bent.",
    "mkt.mobile.feat1.title": "Spraak onderweg",
    "mkt.mobile.feat1.desc": "Praat overal vandaan met je smarthome dankzij spraakherkenning op het apparaat zelf.",
    "mkt.mobile.feat2.title": "Toegang op afstand",
    "mkt.mobile.feat2.desc": "Maak via een versleutelde tunnel veilig verbinding met uw thuisnetwerk.",
    "mkt.mobile.feat3.title": "Pushmeldingen",
    "mkt.mobile.feat3.desc": "Ontvang direct meldingen over gebeurtenissen die voor jou belangrijk zijn.",
    "mkt.mobile.feat4.title": "Biometrisch slot",
    "mkt.mobile.feat4.desc": "Met Face ID en vingerafdruk blijven je bedieningsinstellingen voor je huis priv\xE9.",
    "mkt.cta.title": "Jouw huis, jouw regels.",
    "mkt.cta.desc": "Download NEXUS en bedien al je apparaten vanaf \xE9\xE9n plek.",
    "mkt.cta.button": "Gratis downloaden",
    "mkt.footer.platforms": "Platforms",
    "Dim living room lights": "Demp de verlichting in de woonkamer",
    "Start morning news briefing": "Start van de ochtendbriefing",
    "Movie night": "Filmavond",
    "Good morning": "Goedemorgen",
    "Leaving home": "Het ouderlijk huis verlaten",
    "status.pctOnline": "{pct}% online",
    "status.offlineCount": "{count} offline",
    "status.allOnline": "Alle apparaten zijn online",
    "status.suggestionReady": "Het voorstel voor {count} ligt voor je klaar.",
    "status.suggestionsReady": "De suggesties voor {count} staan voor je klaar.",
    "status.caughtUp": "Je bent weer helemaal bij.",
    "status.onlineOfTotal": "{online}/{total} online",
    "mobile.menu": "Menu",
    "mobile.more": "Meer",
    "mobile.systemStatus": "Status van het NEXUS-systeem",
    "mobile.localNetwork": "Verbinding met het lokale netwerk",
    "mobile.offline": "100% offline",
    "mobile.localAI": "Lokale AI-engine",
    "mobile.deviceNetwork": "Apparaatnetwerk",
    "mobile.online": "Online",
    "mobile.quickControls": "SNELLE BEDIENINGSKNOPPEN",
    "mobile.privacyShield": "Offline Privacy Shield",
    "mobile.active": "Actief",
    "mobile.voiceWake": 'Stemactivering ("NEXUS")',
    "mobile.on": "Op",
    "mobile.autoBackup": "Automatische back-up op het thuisnetwerk",
    "mobile.backupTime": "Dagelijks om 03:00 uur",
    "mobile.moreSub.suggestions": "3 geplande suggesties voor slimme automatisering",
    "mobile.moreSub.skills": "5 vaardigheden en scenario\u2019s voor de actieve vorm",
    "mobile.moreSub.personalization": "Naam van de assistent, spraakmodel en privacy-instellingen",
    "mobile.moreSub.billing": "NEXUS-gezinsabonnement \xB7 Actief abonnement",
    "mobile.moreSub.downloads": "3 releases van het besturingssysteem en SHA-256-validatie",
    "mobile.moreSub.platform": "Platformonafhankelijke synchronisatie van apparaten",
    "mobile.moreSub.agents": "Autonome AI-agenten",
    "mobile.moreSub.admin": "Systeembeheer en statistieken",
    "desktop.title": "Persoonlijk besturingssysteem",
    "setup.welcome": "Welkom",
    "setup.license": "Licentie",
    "setup.location": "Locatie",
    "setup.installing": "Installeren",
    "setup.finish": "Einde",
    "setup.welcomeTitle": "Welkom bij NEXUS Setup",
    "setup.welcomeDesc": "Deze wizard begeleidt u bij de installatie van NEXUS AI \u2014 uw persoonlijke besturingssysteem voor thuis.",
    "setup.accept": "Ik ga akkoord met de licentieovereenkomst",
    "setup.chooseFolder": "Kies de installatiemap",
    "setup.installBtn": "Installeren",
    "setup.complete": "Installatie voltooid",
    "setup.launchNow": "Start NEXUS nu"
  },
  // ── Polish ──
  pl: {
    "app.greeting": "Cze\u015B\u0107, {name}, w czym mog\u0119 pom\xF3c?",
    "app.confirmNeeded": "{name}, ta czynno\u015B\u0107 wymaga Twojego potwierdzenia.",
    "download.title": "Pobierz NEXUS",
    "download.primaryButton": "Pobierz dla {os}",
    "download.otherOs": "Korzystasz z innego systemu operacyjnego?",
    "download.checksum": "Suma kontrolna SHA-256",
    "screen.today": "Dzisiaj",
    "screen.homeState": "Strona g\u0142\xF3wna",
    "screen.suggestions": "Propozycje",
    "screen.skills": "Umiej\u0119tno\u015Bci",
    "screen.family": "Rodzina",
    "screen.devices": "Urz\u0105dzenia",
    "screen.platform": "Platformy",
    "screen.agents": "Agenci",
    "screen.personalization": "Personalizacja",
    "screen.billing": "Subskrypcja",
    "screen.downloadCenter": "Pobierz",
    "screen.adminDashboard": "Panel administracyjny",
    "today.devicesOnline": "Urz\u0105dzenia pod\u0142\u0105czone do sieci",
    "today.energy": "Energia dzisiaj",
    "today.activeRoutines": "Aktywne programy \u0107wicze\u0144",
    "today.suggestions": "Propozycje",
    "screen.devices.empty": "Nie pod\u0142\u0105czono jeszcze \u017Cadnych urz\u0105dze\u0144.",
    "screen.agents.empty": "Nie skonfigurowano jeszcze \u017Cadnych agent\xF3w.",
    "screen.suggestions.empty": "Na razie nie ma \u017Cadnych sugestii \u2014 NEXUS AI wci\u0105\u017C si\u0119 uczy.",
    "screen.skills.empty": "Nie nabyto jeszcze \u017Cadnych umiej\u0119tno\u015Bci.",
    "screen.homeState.empty": "Na razie nie ma \u017Cadnych pomieszcze\u0144 wyposa\u017Conych w urz\u0105dzenia.",
    "plan.free": "Bezp\u0142atny",
    "plan.premium": "Premium",
    "plan.family": "Rodzina",
    "billing.manage": "Zarz\u0105dzaj subskrypcj\u0105",
    "auth.tagline": "Tw\xF3j osobisty system operacyjny do u\u017Cytku domowego",
    "auth.signInTitle": "Zaloguj si\u0119 do serwisu NEXUS",
    "auth.signUpTitle": "Za\u0142\xF3\u017C konto NEXUS",
    "auth.email": "E-mail",
    "auth.password": "Has\u0142o",
    "auth.signInButton": "Zaloguj si\u0119",
    "auth.signUpButton": "Za\u0142\xF3\u017C konto",
    "auth.switchToSignUp": "Jeste\u015B tu nowy? Za\u0142\xF3\u017C konto",
    "auth.switchToSignIn": "Masz ju\u017C konto? Zaloguj si\u0119",
    "auth.passwordHint": "Co najmniej 8 znak\xF3w",
    "auth.genericError": "Wyst\u0105pi\u0142 b\u0142\u0105d. Spr\xF3buj ponownie.",
    "auth.locked": "Zbyt wiele nieudanych pr\xF3b. Spr\xF3buj ponownie w {time}.",
    "auth.rateLimited": "Zbyt wiele \u017C\u0105da\u0144. Spr\xF3buj ponownie p\xF3\u017Aniej.",
    "auth.logout": "Wyloguj si\u0119",
    "auth.welcome": "Witaj, {name}",
    "auth.continue": "Kontynuuj",
    "auth.guest": "Kontynuuj jako go\u015B\u0107",
    "auth.guestHint": "Poznaj NEXUS bez konta",
    "auth.social.divider": "lub kontynuuj za pomoc\u0105 poczty elektronicznej",
    "auth.social.google": "Kontynuuj za pomoc\u0105 Google",
    "auth.social.apple": "Kontynuuj z Apple",
    "auth.social.unavailable": "Ta metoda logowania nie zosta\u0142a jeszcze skonfigurowana.",
    "auth.social.error": "Logowanie za pomoc\u0105 tego dostawcy nie powiod\u0142o si\u0119. Spr\xF3buj ponownie.",
    "mkt.nav.features": "Funkcje",
    "mkt.nav.pricing": "Ceny",
    "mkt.nav.testimonials": "Opinie klient\xF3w",
    "mkt.nav.integrations": "Integracje",
    "mkt.nav.about": "O nas",
    "mkt.nav.download": "Pobierz",
    "mkt.nav.faq": "Najcz\u0119\u015Bciej zadawane pytania",
    "mkt.nav.signIn": "Zaloguj si\u0119",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "Pobierz aplikacj\u0119 NEXUS na ka\u017Cde urz\u0105dzenie, kt\xF3re posiadasz",
    "mkt.hero.desc": "NEXUS to osobisty system operacyjny, w kt\xF3rym priorytetem jest sterowanie g\u0142osowe i ochrona prywatno\u015Bci. Zainstaluj aplikacj\u0119 na komputer lub aplikacj\u0119 mobiln\u0105 i steruj wszystkimi urz\u0105dzeniami z jednego miejsca \u2014 w 100% bezpo\u015Brednio na urz\u0105dzeniu. Korzystasz z niego za pomoc\u0105 prawdziwej aplikacji, a nie przegl\u0105darki.",
    "mkt.hero.actionPrimary": "Pobierz dla {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "Zobacz, jak to dzia\u0142a",
    "mkt.hero.trust": "\u2605 Ponad 500 000 u\u017Cytkownik\xF3w \xB7 Ponad 2000 inteligentnych urz\u0105dze\u0144 \xB7 100% lokalnej prywatno\u015Bci",
    "mkt.stats.title": "NEXUS w liczbach",
    "mkt.stats.users": "Aktywni u\u017Cytkownicy",
    "mkt.stats.devices": "Obs\u0142ugiwane urz\u0105dzenia",
    "mkt.stats.privacy": "Ochrona prywatno\u015Bci w samym urz\u0105dzeniu",
    "mkt.stats.rating": "\u015Arednia ocena",
    "mkt.privacy.title": "Twoje dane nale\u017C\u0105 do Ciebie",
    "mkt.privacy.processing": "Przetwarzanie w 100% na urz\u0105dzeniu",
    "mkt.privacy.encryption": "Szyfrowanie lokalne od pocz\u0105tku do ko\u0144ca",
    "mkt.privacy.logging": "Brak rejestrowania danych w chmurze",
    "mkt.how.title": "Jak to dzia\u0142a",
    "mkt.how.step1.title": "Pobierz",
    "mkt.how.step1.desc": "Pobierz aplikacj\u0119 na swoj\u0105 platform\u0119.",
    "mkt.how.step2.title": "Zainstaluj",
    "mkt.how.step2.desc": "Skonfiguruj urz\u0105dzenie w kilka sekund.",
    "mkt.how.step3.title": "Pod\u0142\u0105cz urz\u0105dzenia",
    "mkt.how.step3.desc": "Zacznij bezpiecznie zarz\u0105dza\u0107 swoim inteligentnym domem.",
    "mkt.preview.title": "Zobacz, jak dzia\u0142a NEXUS",
    "mkt.preview.desc": "Rzeczywisty wygl\u0105d pulpitu nawigacyjnego, kt\xF3ry widzisz zaraz po zainstalowaniu aplikacji.",
    "mkt.preview.tab.today": "Dzisiaj",
    "mkt.preview.tab.devices": "Urz\u0105dzenia",
    "mkt.preview.tab.skills": "Procedury",
    "mkt.preview.tab.family": "Rodzina",
    "mkt.download.mobile.title": "Aplikacje mobilne",
    "mkt.download.mobile.desc": "Wkr\xF3tce pojawi\u0105 si\u0119 aplikacje na systemy iOS i Android.",
    "mkt.download.mobile.apple": "Pobierz na stronie",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Zacznij",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Wkr\xF3tce",
    "mkt.seo.title": "NEXUS \u2014 Pobierz sw\xF3j w\u0142asny system operacyjny",
    "mkt.seo.desc": "Pobierz aplikacj\u0119 NEXUS na systemy Windows, macOS i Linux. Wersje na iOS i Android b\u0119d\u0105 dost\u0119pne wkr\xF3tce.",
    "mkt.skipToContent": "Przejd\u017A do tre\u015Bci",
    "mkt.pricing.title": "Prosty i przejrzysty system cenowy",
    "mkt.pricing.free": "Bezp\u0142atny",
    "mkt.pricing.freeDesc": "Wszystko, czego potrzebujesz do stworzenia lokalnego inteligentnego domu.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Zaawansowane przetwarzanie oparte na sztucznej inteligencji oraz zdalny dost\u0119p.",
    "mkt.pricing.family": "Rodzina",
    "mkt.pricing.familyDesc": "Do 5 kont z pe\u0142n\u0105 kontrol\u0105 dost\u0119pu.",
    "mkt.pricing.cta": "Zacznij za darmo",
    "mkt.testimonials.title": "Ulubiony przez mi\u0142o\u015Bnik\xF3w inteligentnych dom\xF3w",
    "mkt.testimonials.quote1": "NEXUS ca\u0142kowicie zmieni\u0142 spos\xF3b, w jaki korzystam z mojego domu. Dzi\u0119ki temu, \u017Ce wszystko dzia\u0142a lokalnie, wszystko przebiega o wiele szybciej.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Pionier",
    "mkt.testimonials.quote2": "W ko\u0144cu centrum sterowania inteligentnym domem, kt\xF3re szanuje moj\u0105 prywatno\u015B\u0107. Lokalne przetwarzanie oparte na sztucznej inteligencji dzia\u0142a niezwykle sprawnie.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "In\u017Cynier oprogramowania",
    "mkt.testimonials.quote3": "Konfigurowanie skomplikowanych sekwencji czynno\u015Bci to pestka. Bardzo podoba mi si\u0119 to, \u017Ce system dzia\u0142a bez zarzutu, nawet gdy wypadnie mi internet.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Mi\u0142o\u015Bnik inteligentnego domu",
    "mkt.integrations.title": "Wsp\xF3\u0142pracuje z Twoimi ulubionymi urz\u0105dzeniami",
    "mkt.changelog.title": "Co nowego w wersji 3.14.2",
    "mkt.requirements.title": "Wymagania systemowe",
    "mkt.requirements.desc": "Wymaga 64-bitowego systemu operacyjnego i co najmniej 2 GB pami\u0119ci RAM.",
    "mkt.footer.desc": "Tw\xF3j osobisty domowy system operacyjny, w kt\xF3rym priorytetem jest g\u0142os. Ca\u0142kowicie lokalny, w pe\u0142ni nale\u017C\u0105cy do Ciebie.",
    "mkt.footer.product": "Produkt",
    "mkt.footer.company": "Informacje o firmie i kwestie prawne",
    "mkt.footer.about": "O nas",
    "mkt.footer.privacy": "Polityka prywatno\u015Bci",
    "mkt.footer.terms": "Warunki korzystania z serwisu",
    "mkt.footer.noCookies": "Nie u\u017Cywamy \u017Cadnych plik\xF3w cookie.",
    "mkt.cookie.title": "Polityka prywatno\u015Bci i pliki cookie",
    "mkt.cookie.desc": "Wykorzystujemy niezb\u0119dne pliki cookie do \u015Bwiadczenia naszych us\u0142ug. Kontynuuj\u0105c przegl\u0105danie strony, wyra\u017Casz zgod\u0119 na stosowanie przez nas tych niezb\u0119dnych technologii.",
    "mkt.cookie.accept": "Rozumiem",
    "mkt.cookie.decline": "Ustawienia",
    "mkt.feat.why": "Dlaczego NEXUS?",
    "mkt.feat.1.title": "Sterowanie g\u0142osowe",
    "mkt.feat.1.desc": "Wchod\u017A w naturaln\u0105 interakcj\u0119 ze swoim domem.",
    "mkt.feat.2.title": "Zaprojektowane z my\u015Bl\u0105 o prywatno\u015Bci",
    "mkt.feat.2.desc": "Bez chmury, bez rejestrowania danych. Wy\u0142\u0105cznie szyfrowanie lokalne.",
    "mkt.feat.3.title": "Kompatybilny",
    "mkt.feat.3.desc": "Ponad 500 protoko\u0142\xF3w, w tym Matter, Zigbee i Z-Wave.",
    "mkt.feat.4.title": "Niewidzialna sztuczna inteligencja",
    "mkt.feat.4.desc": "Dzia\u0142a w tle, analizuj\u0105c Twoje nawyki.",
    "mkt.faq.title": "Najcz\u0119\u015Bciej zadawane pytania",
    "mkt.faq.1.q": "Czy NEXUS jest ca\u0142kowicie bezp\u0142atny?",
    "mkt.faq.1.a": "Tak. Podstawowy system operacyjny oraz funkcje sterowania lokalnego s\u0105 ca\u0142kowicie bezp\u0142atne.",
    "mkt.faq.2.q": "Jakie urz\u0105dzenia s\u0105 obs\u0142ugiwane?",
    "mkt.faq.2.a": "Urz\u0105dzenia Matter, Zigbee, Z-Wave oraz ponad 500 ekosystem\xF3w opartych na interfejsach API.",
    "mkt.faq.3.q": "Czy to dzia\u0142a bez po\u0142\u0105czenia z chmur\u0105?",
    "mkt.faq.3.a": "Tak. Urz\u0105dzenie komunikuje si\u0119 z Twoimi urz\u0105dzeniami za po\u015Brednictwem sieci lokalnej i dzia\u0142a nawet w przypadku awarii internetu.",
    "mkt.faq.4.q": "W jaki spos\xF3b zapewniany jest dost\u0119p zdalny?",
    "mkt.faq.4.a": "Poprzez bezpieczny tunel z szyfrowaniem typu end-to-end w ramach planu Premium lub w\u0142asnej sieci VPN.",
    "mkt.desktop.eyebrow": "Komputer stacjonarny",
    "mkt.desktop.title": "Jedna aplikacja na ka\u017Cdy komputer stacjonarny",
    "mkt.desktop.desc": "Wersje natywne dla system\xF3w Windows, macOS i Linux \u2014 ka\u017Cda z nich dostosowana do danej platformy.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Zoptymalizowany pod k\u0105tem system\xF3w Windows 10 i 11, zapewniaj\u0105cy p\u0142ynne dzia\u0142anie w tle.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Stworzony z my\u015Bl\u0105 o procesorach Apple Silicon i Intel, z g\u0142\u0119bok\u0105 integracj\u0105 z systemem.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Lekki, szybki i kompatybilny ze wszystkimi g\u0142\xF3wnymi dystrybucjami.",
    "mkt.desktop.download": "Pobierz",
    "mkt.mobile.eyebrow": "Urz\u0105dzenia mobilne",
    "mkt.mobile.title": "Tw\xF3j dom w kieszeni",
    "mkt.mobile.desc": "Aplikacja towarzysz\u0105ca NEXUS zapewnia Ci pe\u0142n\u0105 kontrol\u0119 na wyci\u0105gni\u0119cie r\u0119ki \u2014 gdziekolwiek jeste\u015B.",
    "mkt.mobile.feat1.title": "G\u0142os w podr\xF3\u017Cy",
    "mkt.mobile.feat1.desc": "Rozmawiaj ze swoim domem z dowolnego miejsca dzi\u0119ki funkcji rozpoznawania mowy wbudowanej w urz\u0105dzenie.",
    "mkt.mobile.feat2.title": "Zdalny dost\u0119p",
    "mkt.mobile.feat2.desc": "Bezpiecznie po\u0142\u0105cz si\u0119 z sieci\u0105 domow\u0105 za po\u015Brednictwem zaszyfrowanego tunelu.",
    "mkt.mobile.feat3.title": "Powiadomienia push",
    "mkt.mobile.feat3.desc": "Otrzymuj natychmiastowe powiadomienia o wydarzeniach, kt\xF3re s\u0105 dla Ciebie wa\u017Cne.",
    "mkt.mobile.feat4.title": "Zamek biometryczny",
    "mkt.mobile.feat4.desc": "Funkcje Face ID i skaner linii papilarnych zapewniaj\u0105 prywatno\u015B\u0107 sterowania urz\u0105dzeniami w domu.",
    "mkt.cta.title": "Tw\xF3j dom, twoje zasady.",
    "mkt.cta.desc": "Pobierz aplikacj\u0119 NEXUS i steruj wszystkimi urz\u0105dzeniami z jednego miejsca.",
    "mkt.cta.button": "Pobierz za darmo",
    "mkt.footer.platforms": "Platformy",
    "Dim living room lights": "Przyciemnij \u015Bwiat\u0142a w salonie",
    "Start morning news briefing": "Rozpocz\u0119cie porannej odprawy informacyjnej",
    "Movie night": "Wiecz\xF3r filmowy",
    "Good morning": "Dzie\u0144 dobry",
    "Leaving home": "Wyjazd z domu",
    "status.pctOnline": "{pct}% online",
    "status.offlineCount": "{count} w trybie offline",
    "status.allOnline": "Wszystkie urz\u0105dzenia pod\u0142\u0105czone do sieci",
    "status.suggestionReady": "Mamy dla Ciebie propozycj\u0119 dotycz\u0105c\u0105 {count}.",
    "status.suggestionsReady": "Mamy dla Ciebie propozycje dotycz\u0105ce {count}.",
    "status.caughtUp": "Ju\u017C jeste\u015B na bie\u017C\u0105co.",
    "status.onlineOfTotal": "{online}/{total} online",
    "mobile.menu": "Menu",
    "mobile.more": "Wi\u0119cej",
    "mobile.systemStatus": "Stan systemu NEXUS",
    "mobile.localNetwork": "Po\u0142\u0105czenie z sieci\u0105 lokaln\u0105",
    "mobile.offline": "W 100% w trybie offline",
    "mobile.localAI": "Lokalny silnik sztucznej inteligencji",
    "mobile.deviceNetwork": "Sie\u0107 urz\u0105dze\u0144",
    "mobile.online": "Online",
    "mobile.quickControls": "SZYBKIE OPCCJE",
    "mobile.privacyShield": "Tarcza prywatno\u015Bci w trybie offline",
    "mobile.active": "Aktywne",
    "mobile.voiceWake": "Aktywacja g\u0142osowa (\u201ENEXUS\u201D)",
    "mobile.on": "W dniu",
    "mobile.autoBackup": "Automatyczna kopia zapasowa na dysku twardym",
    "mobile.backupTime": "Codziennie o godz. 03:00",
    "mobile.moreSub.suggestions": "3 zaplanowane propozycje inteligentnej automatyzacji",
    "mobile.moreSub.skills": "5 nabytych umiej\u0119tno\u015Bci w zakresie strony czynnej oraz scenariuszy jej zastosowania",
    "mobile.moreSub.personalization": "Nazwa asystenta, model g\u0142osu i ustawienia prywatno\u015Bci",
    "mobile.moreSub.billing": "Pakiet rodzinny NEXUS \xB7 Aktywna subskrypcja",
    "mobile.moreSub.downloads": "3 wersje platformy systemu operacyjnego i weryfikacja za pomoc\u0105 algorytmu SHA-256",
    "mobile.moreSub.platform": "Synchronizacja urz\u0105dze\u0144 mi\u0119dzy platformami",
    "mobile.moreSub.agents": "Autonomiczne agenty oparte na sztucznej inteligencji",
    "mobile.moreSub.admin": "Administracja systemem i wska\u017Aniki",
    "desktop.title": "Osobisty system operacyjny",
    "setup.welcome": "Witamy",
    "setup.license": "Licencja",
    "setup.location": "Lokalizacja",
    "setup.installing": "Instalacja",
    "setup.finish": "Zako\u0144czenie",
    "setup.welcomeTitle": "Witamy w konfiguracji NEXUS",
    "setup.welcomeDesc": "Ten kreator przeprowadzi Ci\u0119 przez proces instalacji NEXUS AI \u2014 Twojego osobistego systemu operacyjnego do u\u017Cytku domowego.",
    "setup.accept": "Akceptuj\u0119 umow\u0119 licencyjn\u0105",
    "setup.chooseFolder": "Wybierz folder instalacyjny",
    "setup.installBtn": "Zainstaluj",
    "setup.complete": "Konfiguracja zako\u0144czona",
    "setup.launchNow": "Uruchom NEXUS ju\u017C teraz"
  },
  // ── Czech ──
  cs: {
    "app.greeting": "Ahoj {name}, s \u010D\xEDm ti mohu pomoci?",
    "app.confirmNeeded": "{name}, tato akce vy\u017Eaduje tv\xE9 potvrzen\xED.",
    "download.title": "St\xE1hnout NEXUS",
    "download.primaryButton": "St\xE1hnout pro {os}",
    "download.otherOs": "Pou\u017E\xEDv\xE1te jin\xFD opera\u010Dn\xED syst\xE9m?",
    "download.checksum": "Kontroln\xED sou\u010Det SHA-256",
    "screen.today": "Dnes",
    "screen.homeState": "Dom\u016F",
    "screen.suggestions": "N\xE1vrhy",
    "screen.skills": "Dovednosti",
    "screen.family": "Rodina",
    "screen.devices": "Za\u0159\xEDzen\xED",
    "screen.platform": "Platformy",
    "screen.agents": "Z\xE1stupci",
    "screen.personalization": "Personalizace",
    "screen.billing": "P\u0159edplatn\xE9",
    "screen.downloadCenter": "St\xE1hnout",
    "screen.adminDashboard": "Administr\xE1torsk\xFD panel",
    "today.devicesOnline": "Za\u0159\xEDzen\xED p\u0159ipojen\xE1 k internetu",
    "today.energy": "Energie dnes",
    "today.activeRoutines": "Aktivn\xED cvi\u010Debn\xED programy",
    "today.suggestions": "N\xE1vrhy",
    "screen.devices.empty": "Zat\xEDm nen\xED p\u0159ipojeno \u017E\xE1dn\xE9 za\u0159\xEDzen\xED.",
    "screen.agents.empty": "Zat\xEDm nejsou nakonfigurov\xE1ny \u017E\xE1dn\xE9 agenty.",
    "screen.suggestions.empty": "Zat\xEDm \u017E\xE1dn\xE9 n\xE1vrhy \u2014 NEXUS AI se st\xE1le u\u010D\xED.",
    "screen.skills.empty": "Zat\xEDm se nenau\u010Dil \u017E\xE1dn\xE9 dovednosti.",
    "screen.homeState.empty": "Zat\xEDm nejsou k dispozici \u017E\xE1dn\xE9 pokoje s vybaven\xEDm.",
    "plan.free": "Zdarma",
    "plan.premium": "Pr\xE9miov\xE9",
    "plan.family": "Rodina",
    "billing.manage": "Spr\xE1va p\u0159edplatn\xE9ho",
    "auth.tagline": "V\xE1\u0161 osobn\xED opera\u010Dn\xED syst\xE9m pro dom\xE1cnost",
    "auth.signInTitle": "P\u0159ihlaste se do NEXUSu",
    "auth.signUpTitle": "Vytvo\u0159te si \xFA\u010Det NEXUS",
    "auth.email": "E-mail",
    "auth.password": "Heslo",
    "auth.signInButton": "P\u0159ihl\xE1sit se",
    "auth.signUpButton": "Vytvo\u0159it \xFA\u010Det",
    "auth.switchToSignUp": "Jste tu poprv\xE9? Vytvo\u0159te si \xFA\u010Det",
    "auth.switchToSignIn": "U\u017E m\xE1te \xFA\u010Det? P\u0159ihlaste se",
    "auth.passwordHint": "Minim\xE1ln\u011B 8 znak\u016F",
    "auth.genericError": "Do\u0161lo k chyb\u011B. Zkuste to pros\xEDm znovu.",
    "auth.locked": "P\u0159\xEDli\u0161 mnoho ne\xFAsp\u011B\u0161n\xFDch pokus\u016F. Zkuste to znovu v {time}.",
    "auth.rateLimited": "Bylo odesl\xE1no p\u0159\xEDli\u0161 mnoho po\u017Eadavk\u016F. Zkuste to pros\xEDm pozd\u011Bji.",
    "auth.logout": "Odhl\xE1sit se",
    "auth.welcome": "V\xEDtejte, {name}",
    "auth.continue": "Pokra\u010Dovat",
    "auth.guest": "Pokra\u010Dovat jako host",
    "auth.guestHint": "Prozkoumejte NEXUS bez \xFA\u010Dtu",
    "auth.social.divider": "nebo pokra\u010Dovat pomoc\xED e-mailu",
    "auth.social.google": "Pokra\u010Dovat p\u0159es Google",
    "auth.social.apple": "Pokra\u010Dovat s Apple",
    "auth.social.unavailable": "Tato metoda p\u0159ihl\xE1\u0161en\xED je\u0161t\u011B nen\xED nastavena.",
    "auth.social.error": "P\u0159ihl\xE1\u0161en\xED u tohoto poskytovatele se nezda\u0159ilo. Zkuste to pros\xEDm znovu.",
    "mkt.nav.features": "Funkce",
    "mkt.nav.pricing": "Ceny",
    "mkt.nav.testimonials": "Reference",
    "mkt.nav.integrations": "Integrace",
    "mkt.nav.about": "O n\xE1s",
    "mkt.nav.download": "St\xE1hnout",
    "mkt.nav.faq": "\u010Casto kladen\xE9 ot\xE1zky",
    "mkt.nav.signIn": "P\u0159ihl\xE1sit se",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "St\xE1hn\u011Bte si aplikaci NEXUS na v\u0161echna sv\xE1 za\u0159\xEDzen\xED",
    "mkt.hero.desc": "NEXUS je osobn\xED opera\u010Dn\xED syst\xE9m, kter\xFD klade d\u016Fraz na hlasov\xE9 ovl\xE1d\xE1n\xED a ochranu soukrom\xED. Nainstalujte si desktopovou aplikaci nebo mobiln\xED dopln\u011Bk a ovl\xE1dejte v\u0161echna za\u0159\xEDzen\xED z jednoho m\xEDsta \u2013 v\u0161e se odehr\xE1v\xE1 v\xFDhradn\u011B na samotn\xE9m za\u0159\xEDzen\xED. Pou\u017E\xEDv\xE1te jej p\u0159\xEDmo z aplikace, nikoli z prohl\xED\u017Ee\u010De.",
    "mkt.hero.actionPrimary": "St\xE1hnout pro {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "Pod\xEDvejte se, jak to funguje",
    "mkt.hero.trust": "\u2605 V\xEDce ne\u017E 500 000 u\u017Eivatel\u016F \xB7 V\xEDce ne\u017E 2 000 chytr\xFDch za\u0159\xEDzen\xED \xB7 100 % lok\xE1ln\xED ochrana soukrom\xED",
    "mkt.stats.title": "NEXUS v \u010D\xEDslech",
    "mkt.stats.users": "Aktivn\xED u\u017Eivatel\xE9",
    "mkt.stats.devices": "Podporovan\xE1 za\u0159\xEDzen\xED",
    "mkt.stats.privacy": "Ochrana soukrom\xED p\u0159\xEDmo v za\u0159\xEDzen\xED",
    "mkt.stats.rating": "Pr\u016Fm\u011Brn\xE9 hodnocen\xED",
    "mkt.privacy.title": "Va\u0161e data pat\u0159\xED v\xE1m",
    "mkt.privacy.processing": "100 % zpracov\xE1n\xED p\u0159\xEDmo v za\u0159\xEDzen\xED",
    "mkt.privacy.encryption": "\u0160ifrov\xE1n\xED na cel\xE9 trase na m\xEDstn\xED \xFArovni",
    "mkt.privacy.logging": "\u017D\xE1dn\xE9 ukl\xE1d\xE1n\xED do cloudu",
    "mkt.how.title": "Jak to funguje",
    "mkt.how.step1.title": "St\xE1hnout",
    "mkt.how.step1.desc": "St\xE1hn\u011Bte si aplikaci pro svou platformu.",
    "mkt.how.step2.title": "Nainstalovat",
    "mkt.how.step2.desc": "M\xEDstn\xED nastaven\xED dokon\u010D\xEDte b\u011Bhem n\u011Bkolika sekund.",
    "mkt.how.step3.title": "P\u0159ipojit za\u0159\xEDzen\xED",
    "mkt.how.step3.desc": "Za\u010Dn\u011Bte bezpe\u010Dn\u011B spravovat svou chytrou dom\xE1cnost.",
    "mkt.preview.title": "Pod\xEDvejte se, jak NEXUS funguje",
    "mkt.preview.desc": "Uk\xE1zka skute\u010Dn\xE9 ovl\xE1dac\xED obrazovky, kterou uvid\xEDte hned po instalaci aplikace.",
    "mkt.preview.tab.today": "Dnes",
    "mkt.preview.tab.devices": "Za\u0159\xEDzen\xED",
    "mkt.preview.tab.skills": "Rutiny",
    "mkt.preview.tab.family": "Rodina",
    "mkt.download.mobile.title": "Mobiln\xED aplikace",
    "mkt.download.mobile.desc": "Aplikace pro iOS a Android se ji\u017E p\u0159ipravuj\xED.",
    "mkt.download.mobile.apple": "St\xE1hnout na",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Pus\u0165te si to",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Brzy",
    "mkt.seo.title": "NEXUS \u2014 St\xE1hn\u011Bte si sv\u016Fj osobn\xED opera\u010Dn\xED syst\xE9m",
    "mkt.seo.desc": "St\xE1hn\u011Bte si aplikaci NEXUS pro Windows, macOS a Linux. Verze pro iOS a Android budou brzy k dispozici.",
    "mkt.skipToContent": "P\u0159ej\xEDt na obsah",
    "mkt.pricing.title": "Jednoduch\xE9 a transparentn\xED ceny",
    "mkt.pricing.free": "Zdarma",
    "mkt.pricing.freeDesc": "V\u0161e, co pot\u0159ebujete pro m\xEDstn\xED chytrou dom\xE1cnost.",
    "mkt.pricing.premium": "Pr\xE9miov\xE9",
    "mkt.pricing.premiumDesc": "Pokro\u010Dil\xE9 zpracov\xE1n\xED pomoc\xED um\u011Bl\xE9 inteligence a vzd\xE1len\xFD p\u0159\xEDstup.",
    "mkt.pricing.family": "Rodina",
    "mkt.pricing.familyDesc": "A\u017E 5 \xFA\u010Dt\u016F s plnou spr\xE1vou p\u0159\xEDstupov\xFDch pr\xE1v.",
    "mkt.pricing.cta": "Za\u010Dn\u011Bte zdarma",
    "mkt.testimonials.title": "Obl\xEDben\xE9 mezi nad\u0161enci do chytr\xFDch dom\xE1cnost\xED",
    "mkt.testimonials.quote1": "NEXUS zcela zm\u011Bnil zp\u016Fsob, jak\xFDm ovl\xE1d\xE1m svou dom\xE1cnost. Kdy\u017E je v\u0161echno v m\xEDstn\xEDm prost\u0159ed\xED, jde to prost\u011B mnohem rychleji.",
    "mkt.testimonials.author1": "Sarah Jenkinsov\xE1",
    "mkt.testimonials.role1": "Pr\u016Fkopn\xEDk",
    "mkt.testimonials.quote2": "Kone\u010Dn\u011B centrum pro chytrou dom\xE1cnost, kter\xE9 respektuje m\xE9 soukrom\xED. Lok\xE1ln\xED zpracov\xE1n\xED pomoc\xED um\u011Bl\xE9 inteligence je neuv\u011B\u0159iteln\u011B rychl\xE9.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "Softwarov\xFD in\u017Een\xFDr",
    "mkt.testimonials.quote3": "Nastaven\xED slo\u017Eit\xFDch rutin je hra\u010Dka. L\xEDb\xED se mi, \u017Ee to funguje i tehdy, kdy\u017E mi vypadne internet.",
    "mkt.testimonials.author3": "Emma Thompsonov\xE1",
    "mkt.testimonials.role3": "Nad\u0161enec do chytr\xE9 dom\xE1cnosti",
    "mkt.integrations.title": "Funguje s va\u0161imi obl\xEDben\xFDmi za\u0159\xEDzen\xEDmi",
    "mkt.changelog.title": "Co je nov\xE9ho ve verzi 3.14.2",
    "mkt.requirements.title": "Syst\xE9mov\xE9 po\u017Eadavky",
    "mkt.requirements.desc": "Vy\u017Eaduje 64bitov\xFD opera\u010Dn\xED syst\xE9m a alespo\u0148 2 GB pam\u011Bti RAM.",
    "mkt.footer.desc": "V\xE1\u0161 osobn\xED dom\xE1c\xED opera\u010Dn\xED syst\xE9m, kter\xFD up\u0159ednost\u0148uje hlasov\xE9 ovl\xE1d\xE1n\xED. Zcela lok\xE1ln\xED, v\xFDhradn\u011B v\xE1\u0161.",
    "mkt.footer.product": "Produkt",
    "mkt.footer.company": "Spole\u010Dnost a pr\xE1vn\xED informace",
    "mkt.footer.about": "O n\xE1s",
    "mkt.footer.privacy": "Z\xE1sady ochrany osobn\xEDch \xFAdaj\u016F",
    "mkt.footer.terms": "Podm\xEDnky pou\u017E\xEDv\xE1n\xED",
    "mkt.footer.noCookies": "Nepou\u017E\xEDv\xE1me \u017E\xE1dn\xE9 soubory cookie.",
    "mkt.cookie.title": "Ochrana osobn\xEDch \xFAdaj\u016F a soubory cookie",
    "mkt.cookie.desc": "K poskytov\xE1n\xED na\u0161ich slu\u017Eeb pou\u017E\xEDv\xE1me nezbytn\xE9 soubory cookie. Pokra\u010Dov\xE1n\xEDm v prohl\xED\u017Een\xED vyjad\u0159ujete souhlas s pou\u017E\xEDv\xE1n\xEDm t\u011Bchto nezbytn\xFDch technologi\xED.",
    "mkt.cookie.accept": "Jasn\u011B",
    "mkt.cookie.decline": "Nastaven\xED",
    "mkt.feat.why": "Pro\u010D NEXUS",
    "mkt.feat.1.title": "Ovl\xE1d\xE1n\xED pomoc\xED hlasu jako prim\xE1rn\xED zp\u016Fsob",
    "mkt.feat.1.desc": "Komunikujte se sv\xFDm domovem p\u0159irozen\u011B.",
    "mkt.feat.2.title": "Soukrom\xED je sou\u010D\xE1st\xED koncepce",
    "mkt.feat.2.desc": "\u017D\xE1dn\xFD cloud, \u017E\xE1dn\xE9 zaznamen\xE1v\xE1n\xED. Pouze lok\xE1ln\xED \u0161ifrov\xE1n\xED.",
    "mkt.feat.3.title": "Kompatibiln\xED",
    "mkt.feat.3.desc": "V\xEDce ne\u017E 500 protokol\u016F, v\u010Detn\u011B Matter, Zigbee a Z-Wave.",
    "mkt.feat.4.title": "Neviditeln\xE1 um\u011Bl\xE1 inteligence",
    "mkt.feat.4.desc": "B\u011B\u017E\xED na pozad\xED a u\u010D\xED se va\u0161e zvyky.",
    "mkt.faq.title": "\u010Casto kladen\xE9 ot\xE1zky",
    "mkt.faq.1.q": "Je NEXUS zcela zdarma?",
    "mkt.faq.1.a": "Ano. Z\xE1kladn\xED opera\u010Dn\xED syst\xE9m a funkce pro lok\xE1ln\xED ovl\xE1d\xE1n\xED jsou zcela zdarma.",
    "mkt.faq.2.q": "Kter\xE1 za\u0159\xEDzen\xED jsou podporov\xE1na?",
    "mkt.faq.2.a": "Za\u0159\xEDzen\xED Matter, Zigbee, Z-Wave a v\xEDce ne\u017E 500 ekosyst\xE9m\u016F zalo\u017Een\xFDch na API.",
    "mkt.faq.3.q": "Funguje to i bez p\u0159ipojen\xED k cloudu?",
    "mkt.faq.3.a": "Ano. Komunikuje s va\u0161imi za\u0159\xEDzen\xEDmi p\u0159es lok\xE1ln\xED s\xED\u0165 a funguje i v p\u0159\xEDpad\u011B v\xFDpadku internetu.",
    "mkt.faq.4.q": "Jak je zaji\u0161t\u011Bn vzd\xE1len\xFD p\u0159\xEDstup?",
    "mkt.faq.4.a": "Prost\u0159ednictv\xEDm zabezpe\u010Den\xE9ho tunelu s \u0161ifrov\xE1n\xEDm typu end-to-end v r\xE1mci tarifu Premium nebo prost\u0159ednictv\xEDm va\u0161\xED vlastn\xED VPN.",
    "mkt.desktop.eyebrow": "Plocha",
    "mkt.desktop.title": "Jedna aplikace pro ka\u017Edou pracovn\xED plochu",
    "mkt.desktop.desc": "Nativn\xED verze pro Windows, macOS a Linux \u2013 ka\u017Ed\xE1 z nich je optimalizov\xE1na pro danou platformu.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Optimalizov\xE1no pro Windows 10 a 11 s plynul\xFDm provozem na pozad\xED.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Vyvinuto pro Apple Silicon a Intel s hlubokou syst\xE9movou integrac\xED.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Lehk\xFD, rychl\xFD a kompatibiln\xED se v\u0161emi hlavn\xEDmi distribucemi.",
    "mkt.desktop.download": "St\xE1hnout",
    "mkt.mobile.eyebrow": "Mobiln\xED",
    "mkt.mobile.title": "V\xE1\u0161 domov v kapse",
    "mkt.mobile.desc": "D\xEDky doprovodn\xE9 aplikaci NEXUS m\xE1te v\u0161e pod kontrolou \u2013 a\u0165 u\u017E jste kdekoli.",
    "mkt.mobile.feat1.title": "Hlas na cest\xE1ch",
    "mkt.mobile.feat1.desc": "D\xEDky funkci rozpozn\xE1v\xE1n\xED \u0159e\u010Di p\u0159\xEDmo v za\u0159\xEDzen\xED m\u016F\u017Eete se sv\xFDm dom\xE1c\xEDm za\u0159\xEDzen\xEDm komunikovat odkudkoli.",
    "mkt.mobile.feat2.title": "Vzd\xE1len\xFD p\u0159\xEDstup",
    "mkt.mobile.feat2.desc": "P\u0159ipojte se bezpe\u010Dn\u011B k dom\xE1c\xED s\xEDti prost\u0159ednictv\xEDm \u0161ifrovan\xE9ho tunelu.",
    "mkt.mobile.feat3.title": "Push notifikace",
    "mkt.mobile.feat3.desc": "Nechte si zas\xEDlat okam\u017Eit\xE1 upozorn\u011Bn\xED na ud\xE1losti, kter\xE9 jsou pro v\xE1s d\u016Fle\u017Eit\xE9.",
    "mkt.mobile.feat4.title": "Biometrick\xFD z\xE1mek",
    "mkt.mobile.feat4.desc": "D\xEDky funkc\xEDm Face ID a sn\xEDma\u010Di otisk\u016F prst\u016F z\u016Fst\xE1v\xE1 ovl\xE1d\xE1n\xED va\u0161\xED dom\xE1cnosti soukrom\xE9.",
    "mkt.cta.title": "Tv\u016Fj d\u016Fm, tvoje pravidla.",
    "mkt.cta.desc": "St\xE1hn\u011Bte si aplikaci NEXUS a ovl\xE1dejte v\u0161echna za\u0159\xEDzen\xED z jednoho m\xEDsta.",
    "mkt.cta.button": "St\xE1hnout zdarma",
    "mkt.footer.platforms": "Platformy",
    "Dim living room lights": "Ztlumit sv\u011Btla v ob\xFDvac\xEDm pokoji",
    "Start morning news briefing": "Zah\xE1jen\xED rann\xEDho informa\u010Dn\xEDho briefingu",
    "Movie night": "Filmov\xFD ve\u010Der",
    "Good morning": "Dobr\xE9 r\xE1no",
    "Leaving home": "Odchod z domova",
    "status.pctOnline": "{pct} % online",
    "status.offlineCount": "{count} offline",
    "status.allOnline": "V\u0161echna za\u0159\xEDzen\xED jsou p\u0159ipojena k internetu",
    "status.suggestionReady": "N\xE1vrh {count} je pro v\xE1s p\u0159ipraven.",
    "status.suggestionsReady": "M\xE1me pro v\xE1s p\u0159ipraven\xE9 n\xE1vrhy k {count}.",
    "status.caughtUp": "Te\u010F u\u017E jsi v obraze.",
    "status.onlineOfTotal": "{online}/{total} online",
    "mobile.menu": "Nab\xEDdka",
    "mobile.more": "V\xEDce",
    "mobile.systemStatus": "Stav syst\xE9mu NEXUS",
    "mobile.localNetwork": "P\u0159ipojen\xED k m\xEDstn\xED s\xEDti",
    "mobile.offline": "100 % offline",
    "mobile.localAI": "Lok\xE1ln\xED AI engine",
    "mobile.deviceNetwork": "S\xED\u0165 za\u0159\xEDzen\xED",
    "mobile.online": "Online",
    "mobile.quickControls": "RYCHL\xC9 OVL\xC1DAC\xCD PRVKY",
    "mobile.privacyShield": "Offline program \u201EPrivacy Shield\u201C",
    "mobile.active": "Aktivn\xED",
    "mobile.voiceWake": "Probuzen\xED hlasem (\u201ENEXUS\u201C)",
    "mobile.on": "Dne",
    "mobile.autoBackup": "Automatick\xE9 z\xE1lohov\xE1n\xED domovsk\xE9 str\xE1nky",
    "mobile.backupTime": "Denn\u011B v 03:00",
    "mobile.moreSub.suggestions": "3 napl\xE1novan\xE9 n\xE1vrhy inteligentn\xED automatizace",
    "mobile.moreSub.skills": "5 osvojen\xFDch dovednost\xED v aktivn\xEDm hlasu a sc\xE9n\xE1\u0159\u016F",
    "mobile.moreSub.personalization": "Jm\xE9no asistenta, hlasov\xFD model a nastaven\xED ochrany osobn\xEDch \xFAdaj\u016F",
    "mobile.moreSub.billing": "Rodinn\xFD tarif NEXUS \xB7 Aktivn\xED p\u0159edplatn\xE9",
    "mobile.moreSub.downloads": "3 verze opera\u010Dn\xEDch syst\xE9m\u016F a ov\u011B\u0159en\xED pomoc\xED SHA-256",
    "mobile.moreSub.platform": "Synchronizace za\u0159\xEDzen\xED nap\u0159\xED\u010D platformami",
    "mobile.moreSub.agents": "Autonomn\xED agenti um\u011Bl\xE9 inteligence",
    "mobile.moreSub.admin": "Spr\xE1va syst\xE9mu a metriky",
    "desktop.title": "Osobn\xED opera\u010Dn\xED syst\xE9m",
    "setup.welcome": "V\xEDtejte",
    "setup.license": "Licence",
    "setup.location": "Um\xEDst\u011Bn\xED",
    "setup.installing": "Instalace",
    "setup.finish": "Dokon\u010Dit",
    "setup.welcomeTitle": "V\xEDtejte v nastaven\xED NEXUS",
    "setup.welcomeDesc": "Tento pr\u016Fvodce v\xE1s provede instalac\xED NEXUS AI \u2013 va\u0161eho osobn\xEDho opera\u010Dn\xEDho syst\xE9mu pro dom\xE1cnost.",
    "setup.accept": "Souhlas\xEDm s licen\u010Dn\xED smlouvou",
    "setup.chooseFolder": "Vyberte instala\u010Dn\xED slo\u017Eku",
    "setup.installBtn": "Nainstalovat",
    "setup.complete": "Nastaven\xED dokon\u010Deno",
    "setup.launchNow": "Spus\u0165te NEXUS hned te\u010F"
  },
  // ── Russian ──
  ru: {
    "app.greeting": "\u041F\u0440\u0438\u0432\u0435\u0442, {name}, \u0447\u0435\u043C \u043C\u043E\u0433\u0443 \u043F\u043E\u043C\u043E\u0447\u044C?",
    "app.confirmNeeded": "{name}, \u0434\u043B\u044F \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u044D\u0442\u043E\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0432\u0430\u0448\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435.",
    "download.title": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C NEXUS",
    "download.primaryButton": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0434\u043B\u044F {os}",
    "download.otherOs": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435 \u0434\u0440\u0443\u0433\u0443\u044E \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0443\u044E \u0441\u0438\u0441\u0442\u0435\u043C\u0443?",
    "download.checksum": "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u0430\u044F \u0441\u0443\u043C\u043C\u0430 SHA-256",
    "screen.today": "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    "screen.homeState": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F",
    "screen.suggestions": "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
    "screen.skills": "\u041D\u0430\u0432\u044B\u043A\u0438",
    "screen.family": "\u0421\u0435\u043C\u044C\u044F",
    "screen.devices": "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "screen.platform": "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B",
    "screen.agents": "\u0410\u0433\u0435\u043D\u0442\u044B",
    "screen.personalization": "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F",
    "screen.billing": "\u041F\u043E\u0434\u043F\u0438\u0441\u043A\u0430",
    "screen.downloadCenter": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "screen.adminDashboard": "\u041F\u0430\u043D\u0435\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430",
    "today.devicesOnline": "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430, \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043D\u044B\u0435 \u043A \u0441\u0435\u0442\u0438",
    "today.energy": "\u042D\u043D\u0435\u0440\u0433\u0435\u0442\u0438\u043A\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
    "today.activeRoutines": "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u044B",
    "today.suggestions": "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
    "screen.devices.empty": "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u044B.",
    "screen.agents.empty": "\u0410\u0433\u0435\u043D\u0442\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u044B.",
    "screen.suggestions.empty": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0439 \u2014 NEXUS AI \u0432\u0441\u0435 \u0435\u0449\u0435 \u0443\u0447\u0438\u0442\u0441\u044F.",
    "screen.skills.empty": "\u041F\u043E\u043A\u0430 \u043D\u0438\u043A\u0430\u043A\u0438\u0445 \u043D\u0430\u0432\u044B\u043A\u043E\u0432 \u043D\u0435 \u043E\u0441\u0432\u043E\u0435\u043D.",
    "screen.homeState.empty": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043D\u043E\u043C\u0435\u0440\u043E\u0432 \u0441 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438.",
    "plan.free": "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
    "plan.premium": "\u041F\u0440\u0435\u043C\u0438\u0443\u043C",
    "plan.family": "\u0421\u0435\u043C\u044C\u044F",
    "billing.manage": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u043E\u0439",
    "auth.tagline": "\u0412\u0430\u0448\u0430 \u043B\u0438\u0447\u043D\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0434\u043B\u044F \u0434\u043E\u043C\u0430",
    "auth.signInTitle": "\u0412\u043E\u0439\u0442\u0438 \u0432 NEXUS",
    "auth.signUpTitle": "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u044E \u0443\u0447\u0435\u0442\u043D\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C NEXUS",
    "auth.email": "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430",
    "auth.password": "\u041F\u0430\u0440\u043E\u043B\u044C",
    "auth.signInButton": "\u0412\u043E\u0439\u0442\u0438",
    "auth.signUpButton": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442",
    "auth.switchToSignUp": "\u0412\u043F\u0435\u0440\u0432\u044B\u0435 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435? \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044C",
    "auth.switchToSignIn": "\u0423 \u0432\u0430\u0441 \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442? \u0412\u043E\u0439\u0442\u0438",
    "auth.passwordHint": "\u041D\u0435 \u043C\u0435\u043D\u0435\u0435 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432",
    "auth.genericError": "\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
    "auth.locked": "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0445 \u043F\u043E\u043F\u044B\u0442\u043E\u043A. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437 \u0432 {time}.",
    "auth.rateLimited": "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435.",
    "auth.logout": "\u0412\u044B\u0439\u0442\u0438",
    "auth.welcome": "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C, {name}",
    "auth.continue": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C",
    "auth.guest": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0432 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435 \u0433\u043E\u0441\u0442\u044F",
    "auth.guestHint": "\u041F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u044C\u0442\u0435\u0441\u044C \u0441 NEXUS \u0431\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438",
    "auth.social.divider": "\u0438\u043B\u0438 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u043F\u043E\u0447\u0442\u044B",
    "auth.social.google": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E Google",
    "auth.social.apple": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0441 Apple",
    "auth.social.unavailable": "\u042D\u0442\u043E\u0442 \u0441\u043F\u043E\u0441\u043E\u0431 \u0432\u0445\u043E\u0434\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D.",
    "auth.social.error": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
    "mkt.nav.features": "\u041E\u0441\u043E\u0431\u0435\u043D\u043D\u043E\u0441\u0442\u0438",
    "mkt.nav.pricing": "\u0426\u0435\u043D\u044B",
    "mkt.nav.testimonials": "\u041E\u0442\u0437\u044B\u0432\u044B",
    "mkt.nav.integrations": "\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438",
    "mkt.nav.about": "\u041E \u043D\u0430\u0441",
    "mkt.nav.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "mkt.nav.faq": "\u0427\u0430\u0441\u0442\u043E \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B",
    "mkt.nav.signIn": "\u0412\u043E\u0439\u0442\u0438",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\u0421\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 NEXUS \u043D\u0430 \u0432\u0441\u0435 \u0441\u0432\u043E\u0438 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "mkt.hero.desc": "NEXUS \u2014 \u044D\u0442\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430, \u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043D\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0438 \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438. \u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430 \u0438\u043B\u0438 \u043C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435-\u043A\u043E\u043C\u043F\u0430\u043D\u044C\u043E\u043D \u0438 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u0432\u0441\u0435\u043C\u0438 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438 \u0438\u0437 \u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430 \u2014 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u0432\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u043D\u0430 100 % \u043D\u0430 \u0441\u0430\u043C\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435. \u0420\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0441 \u0441\u0438\u0441\u0442\u0435\u043C\u043E\u0439 \u043C\u043E\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0435\u0440\u0435\u0437 \u0441\u0430\u043C\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435, \u0430 \u043D\u0435 \u0447\u0435\u0440\u0435\u0437 \u0431\u0440\u0430\u0443\u0437\u0435\u0440.",
    "mkt.hero.actionPrimary": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0434\u043B\u044F {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435, \u043A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "mkt.hero.trust": "\u2605 \u0411\u043E\u043B\u0435\u0435 500 000 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \xB7 \u0411\u043E\u043B\u0435\u0435 2000 \u0443\u043C\u043D\u044B\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 \xB7 100% \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    "mkt.stats.title": "NEXUS \u0432 \u0446\u0438\u0444\u0440\u0430\u0445",
    "mkt.stats.users": "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438",
    "mkt.stats.devices": "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "mkt.stats.privacy": "\u0417\u0430\u0449\u0438\u0442\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u043D\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435",
    "mkt.stats.rating": "\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u043E\u0446\u0435\u043D\u043A\u0430",
    "mkt.privacy.title": "\u0412\u0430\u0448\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0430\u0442 \u0432\u0430\u043C",
    "mkt.privacy.processing": "100% \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043D\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435",
    "mkt.privacy.encryption": "\u0421\u043A\u0432\u043E\u0437\u043D\u043E\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
    "mkt.privacy.logging": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0434\u0430\u043D\u043D\u044B\u0445 \xABZero Cloud\xBB",
    "mkt.how.title": "\u041A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "mkt.how.step1.title": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "mkt.how.step1.desc": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0439 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B.",
    "mkt.how.step2.title": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
    "mkt.how.step2.desc": "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0443\u044E \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0443 \u0437\u0430 \u0441\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0435 \u0441\u0435\u043A\u0443\u043D\u0434\u044B.",
    "mkt.how.step3.title": "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "mkt.how.step3.desc": "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u0432\u043E\u0438\u043C \xAB\u0443\u043C\u043D\u044B\u043C \u0434\u043E\u043C\u043E\u043C\xBB.",
    "mkt.preview.title": "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435, \u043A\u0430\u043A \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 NEXUS",
    "mkt.preview.desc": "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435 \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438, \u043A\u0430\u043A \u0432\u044B\u0433\u043B\u044F\u0434\u0438\u0442 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F.",
    "mkt.preview.tab.today": "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    "mkt.preview.tab.devices": "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "mkt.preview.tab.skills": "\u041F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u044B",
    "mkt.preview.tab.family": "\u0421\u0435\u043C\u044C\u044F",
    "mkt.download.mobile.title": "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
    "mkt.download.mobile.desc": "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0434\u043B\u044F iOS \u0438 Android \u0441\u043A\u043E\u0440\u043E \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F.",
    "mkt.download.mobile.apple": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043D\u0430 \u0441\u0430\u0439\u0442\u0435",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "\u041D\u0430\u0447\u043D\u0438 \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\u0421\u043A\u043E\u0440\u043E",
    "mkt.seo.title": "NEXUS \u2014 \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0441\u0432\u043E\u044E \u043B\u0438\u0447\u043D\u0443\u044E \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0443\u044E \u0441\u0438\u0441\u0442\u0435\u043C\u0443",
    "mkt.seo.desc": "\u0421\u043A\u0430\u0447\u0430\u0439\u0442\u0435 NEXUS \u0434\u043B\u044F Windows, macOS \u0438 Linux. \u0412\u0435\u0440\u0441\u0438\u0438 \u0434\u043B\u044F iOS \u0438 Android \u0431\u0443\u0434\u0443\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F.",
    "mkt.skipToContent": "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u044E",
    "mkt.pricing.title": "\u041F\u0440\u043E\u0441\u0442\u0430\u044F \u0438 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0446\u0435\u043D\u043E\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u044F",
    "mkt.pricing.free": "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
    "mkt.pricing.freeDesc": "\u0412\u0441\u0435, \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \xAB\u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0430\xBB \u0432 \u0432\u0430\u0448\u0435\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435.",
    "mkt.pricing.premium": "\u041F\u0440\u0435\u043C\u0438\u0443\u043C",
    "mkt.pricing.premiumDesc": "\u041F\u0435\u0440\u0435\u0434\u043E\u0432\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0430 \u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F.",
    "mkt.pricing.family": "\u0421\u0435\u043C\u044C\u044F",
    "mkt.pricing.familyDesc": "\u0414\u043E 5 \u0443\u0447\u0435\u0442\u043D\u044B\u0445 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0441 \u043F\u043E\u043B\u043D\u044B\u043C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u043E\u043C.",
    "mkt.pricing.cta": "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
    "mkt.testimonials.title": "\u041F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C\u044E \u0441\u0440\u0435\u0434\u0438 \u043B\u044E\u0431\u0438\u0442\u0435\u043B\u0435\u0439 \xAB\u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0430\xBB",
    "mkt.testimonials.quote1": "NEXUS \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0438\u0437\u043C\u0435\u043D\u0438\u043B \u0442\u043E, \u043A\u0430\u043A \u044F \u0432\u0437\u0430\u0438\u043C\u043E\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E \u0441\u043E \u0441\u0432\u043E\u0438\u043C \u0434\u043E\u043C\u043E\u043C. \u041A\u043E\u0433\u0434\u0430 \u0432\u0441\u0451 \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E, \u0432\u0441\u0451 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0433\u043E\u0440\u0430\u0437\u0434\u043E \u0431\u044B\u0441\u0442\u0440\u0435\u0435.",
    "mkt.testimonials.author1": "\u0421\u0430\u0440\u0430 \u0414\u0436\u0435\u043D\u043A\u0438\u043D\u0441",
    "mkt.testimonials.role1": "\u0420\u0430\u043D\u043D\u0438\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C",
    "mkt.testimonials.quote2": "\u041D\u0430\u043A\u043E\u043D\u0435\u0446-\u0442\u043E \u043F\u043E\u044F\u0432\u0438\u043B\u0441\u044F \u0445\u0430\u0431 \u0434\u043B\u044F \xAB\u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0430\xBB, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0443\u0432\u0430\u0436\u0430\u0435\u0442 \u043C\u043E\u044E \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C. \u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0435\u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E \u0431\u044B\u0441\u0442\u0440\u043E.",
    "mkt.testimonials.author2": "\u0414\u044D\u0432\u0438\u0434 \u0427\u0435\u043D",
    "mkt.testimonials.role2": "\u0418\u043D\u0436\u0435\u043D\u0435\u0440-\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0441\u0442",
    "mkt.testimonials.quote3": "\u041D\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0442\u044C \u0441\u043B\u043E\u0436\u043D\u044B\u0435 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u2014 \u043F\u0440\u043E\u0449\u0435 \u043F\u0440\u043E\u0441\u0442\u043E\u0433\u043E. \u041C\u043D\u0435 \u043E\u0447\u0435\u043D\u044C \u043D\u0440\u0430\u0432\u0438\u0442\u0441\u044F, \u0447\u0442\u043E \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C, \u0434\u0430\u0436\u0435 \u043A\u043E\u0433\u0434\u0430 \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u0435\u0442 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442.",
    "mkt.testimonials.author3": "\u042D\u043C\u043C\u0430 \u0422\u043E\u043C\u043F\u0441\u043E\u043D",
    "mkt.testimonials.role3": "\u041B\u044E\u0431\u0438\u0442\u0435\u043B\u044C \xAB\u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0430\xBB",
    "mkt.integrations.title": "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E \u0441 \u0432\u0430\u0448\u0438\u043C\u0438 \u043B\u044E\u0431\u0438\u043C\u044B\u043C\u0438 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438",
    "mkt.changelog.title": "\u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E \u0432 \u0432\u0435\u0440\u0441\u0438\u0438 3.14.2",
    "mkt.requirements.title": "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F",
    "mkt.requirements.desc": "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F 64-\u0440\u0430\u0437\u0440\u044F\u0434\u043D\u0430\u044F \u041E\u0421 \u0438 \u043D\u0435 \u043C\u0435\u043D\u0435\u0435 2 \u0413\u0411 \u043E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u043E\u0439 \u043F\u0430\u043C\u044F\u0442\u0438.",
    "mkt.footer.desc": "\u0412\u0430\u0448\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0434\u043E\u043C\u0430\u0448\u043D\u044F\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430, \u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043D\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435. \u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F, \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0432\u0430\u0448\u0430.",
    "mkt.footer.product": "\u041F\u0440\u043E\u0434\u0443\u043A\u0442",
    "mkt.footer.company": "\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F \u0438 \u043F\u0440\u0430\u0432\u043E\u0432\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F",
    "mkt.footer.about": "\u041E \u043D\u0430\u0441",
    "mkt.footer.privacy": "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
    "mkt.footer.terms": "\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0443\u0441\u043B\u0443\u0433",
    "mkt.footer.noCookies": "\u041C\u044B \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u0444\u0430\u0439\u043B\u044B cookie.",
    "mkt.cookie.title": "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0438 \u0444\u0430\u0439\u043B\u044B cookie",
    "mkt.cookie.desc": "\u041C\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B cookie \u0434\u043B\u044F \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u0448\u0438\u0445 \u0443\u0441\u043B\u0443\u0433. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0443 \u0441 \u0441\u0430\u0439\u0442\u043E\u043C, \u0432\u044B \u0441\u043E\u0433\u043B\u0430\u0448\u0430\u0435\u0442\u0435\u0441\u044C \u0441 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u043D\u0430\u043C\u0438 \u044D\u0442\u0438\u0445 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u0445 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439.",
    "mkt.cookie.accept": "\u041F\u043E\u043D\u044F\u043B",
    "mkt.cookie.decline": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "mkt.feat.why": "\u041F\u043E\u0447\u0435\u043C\u0443 NEXUS",
    "mkt.feat.1.title": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441 \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u043E\u043C \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u044B\u0445 \u043A\u043E\u043C\u0430\u043D\u0434",
    "mkt.feat.1.desc": "\u0412\u0437\u0430\u0438\u043C\u043E\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0439\u0442\u0435 \u0441\u043E \u0441\u0432\u043E\u0438\u043C \u0434\u043E\u043C\u043E\u043C \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u043C \u043E\u0431\u0440\u0430\u0437\u043E\u043C.",
    "mkt.feat.2.title": "\u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0437\u0430\u043C\u044B\u0441\u043B\u0443",
    "mkt.feat.2.desc": "\u0411\u0435\u0437 \u043E\u0431\u043B\u0430\u043A\u0430, \u0431\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445. \u0422\u043E\u043B\u044C\u043A\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0435.",
    "mkt.feat.3.title": "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u044B\u0439",
    "mkt.feat.3.desc": "\u0411\u043E\u043B\u0435\u0435 500 \u043F\u0440\u043E\u0442\u043E\u043A\u043E\u043B\u043E\u0432, \u0432\u043A\u043B\u044E\u0447\u0430\u044F Matter, Zigbee \u0438 Z-Wave.",
    "mkt.feat.4.title": "\u041D\u0435\u0432\u0438\u0434\u0438\u043C\u044B\u0439 \u0418\u0418",
    "mkt.feat.4.desc": "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0432 \u0444\u043E\u043D\u043E\u0432\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435, \u0438\u0437\u0443\u0447\u0430\u044F \u0432\u0430\u0448\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438.",
    "mkt.faq.title": "\u0427\u0430\u0441\u0442\u043E \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B",
    "mkt.faq.1.q": "NEXUS \u2014 \u044D\u0442\u043E \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441?",
    "mkt.faq.1.a": "\u0414\u0430. \u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0438 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u0441\u043E\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u043E \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E.",
    "mkt.faq.2.q": "\u041A\u0430\u043A\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F?",
    "mkt.faq.2.a": "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 Matter, Zigbee, Z-Wave \u0438 \u0431\u043E\u043B\u0435\u0435 500 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 API.",
    "mkt.faq.3.q": "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043B\u0438 \u044D\u0442\u043E \u0431\u0435\u0437 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A \u043E\u0431\u043B\u0430\u043A\u0443?",
    "mkt.faq.3.a": "\u0414\u0430. \u041E\u043D \u0432\u0437\u0430\u0438\u043C\u043E\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0441 \u0432\u0430\u0448\u0438\u043C\u0438 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438 \u0447\u0435\u0440\u0435\u0437 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0443\u044E \u0441\u0435\u0442\u044C \u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0434\u0430\u0436\u0435 \u043F\u0440\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0430.",
    "mkt.faq.4.q": "\u041A\u0430\u043A \u043E\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F?",
    "mkt.faq.4.a": "\u0427\u0435\u0440\u0435\u0437 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 \u0442\u0443\u043D\u043D\u0435\u043B\u044C \u0441\u043E \u0441\u043A\u0432\u043E\u0437\u043D\u044B\u043C \u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u0432 \u0440\u0430\u043C\u043A\u0430\u0445 \u0442\u0430\u0440\u0438\u0444\u043D\u043E\u0433\u043E \u043F\u043B\u0430\u043D\u0430 \xAB\u041F\u0440\u0435\u043C\u0438\u0443\u043C\xBB \u0438\u043B\u0438 \u0447\u0435\u0440\u0435\u0437 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u0443\u044E VPN.",
    "mkt.desktop.eyebrow": "\u0420\u0430\u0431\u043E\u0447\u0438\u0439 \u0441\u0442\u043E\u043B",
    "mkt.desktop.title": "\u041E\u0434\u043D\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u0441\u0442\u043E\u043B\u0430",
    "mkt.desktop.desc": "\u0421\u0431\u043E\u0440\u043A\u0438 \u0434\u043B\u044F Windows, macOS \u0438 Linux \u2014 \u043A\u0430\u0436\u0434\u0430\u044F \u0438\u0437 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u0430 \u043F\u043E\u0434 \u0441\u0432\u043E\u044E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0434\u043B\u044F Windows 10 \u0438 11 \u0441 \u0431\u0435\u0441\u043F\u0435\u0440\u0435\u0431\u043E\u0439\u043D\u043E\u0439 \u0440\u0430\u0431\u043E\u0442\u043E\u0439 \u0432 \u0444\u043E\u043D\u043E\u0432\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E \u0434\u043B\u044F \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u043E\u0432 Apple Silicon \u0438 Intel \u0441 \u0433\u043B\u0443\u0431\u043E\u043A\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u043E\u0439 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0435\u0439.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "\u041B\u0435\u0433\u043A\u0438\u0439, \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u0438 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u044B\u0439 \u0441\u043E \u0432\u0441\u0435\u043C\u0438 \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u043C\u0438 \u0434\u0438\u0441\u0442\u0440\u0438\u0431\u0443\u0442\u0438\u0432\u0430\u043C\u0438.",
    "mkt.desktop.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "mkt.mobile.eyebrow": "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0439",
    "mkt.mobile.title": "\u0412\u0430\u0448 \u0434\u043E\u043C \u0432 \u043A\u0430\u0440\u043C\u0430\u043D\u0435",
    "mkt.mobile.desc": "\u0421 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0441\u043E\u043F\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F NEXUS \u0432\u044B \u0432\u0441\u0435\u0433\u0434\u0430 \u0441\u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E\u043C \u2014 \u0433\u0434\u0435 \u0431\u044B \u0432\u044B \u043D\u0438 \u043D\u0430\u0445\u043E\u0434\u0438\u043B\u0438\u0441\u044C.",
    "mkt.mobile.feat1.title": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u0445\u043E\u0434\u0443",
    "mkt.mobile.feat1.desc": "\u041E\u0431\u0449\u0430\u0439\u0442\u0435\u0441\u044C \u0441\u043E \u0441\u0432\u043E\u0438\u043C \u0434\u043E\u043C\u043E\u043C \u0438\u0437 \u043B\u044E\u0431\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430 \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u044F \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u043E\u0439 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u044F \u0440\u0435\u0447\u0438.",
    "mkt.mobile.feat2.title": "\u0423\u0434\u0430\u043B\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F",
    "mkt.mobile.feat2.desc": "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u0439\u0442\u0435\u0441\u044C \u043A \u0434\u043E\u043C\u0430\u0448\u043D\u0435\u0439 \u0441\u0435\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0442\u0443\u043D\u043D\u0435\u043B\u044C.",
    "mkt.mobile.feat3.title": "Push-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    "mkt.mobile.feat3.desc": "\u041F\u043E\u043B\u0443\u0447\u0430\u0439\u0442\u0435 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0441\u043E\u0431\u044B\u0442\u0438\u044F\u0445, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432\u0430\u0436\u043D\u044B \u0434\u043B\u044F \u0432\u0430\u0441.",
    "mkt.mobile.feat4.title": "\u0411\u0438\u043E\u043C\u0435\u0442\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0437\u0430\u043C\u043E\u043A",
    "mkt.mobile.feat4.desc": "Face ID \u0438 \u0441\u043A\u0430\u043D\u0435\u0440 \u043E\u0442\u043F\u0435\u0447\u0430\u0442\u043A\u043E\u0432 \u043F\u0430\u043B\u044C\u0446\u0435\u0432 \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u044E\u0442 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0434\u043E\u043C\u0430\u0448\u043D\u0438\u043C\u0438 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438.",
    "mkt.cta.title": "\u0422\u0432\u043E\u0439 \u0434\u043E\u043C \u2014 \u0442\u0432\u043E\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u0430.",
    "mkt.cta.desc": "\u0421\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 NEXUS \u0438 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u0432\u0441\u0435\u043C\u0438 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438 \u0438\u0437 \u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430.",
    "mkt.cta.button": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
    "mkt.footer.platforms": "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B",
    "Dim living room lights": "\u041F\u0440\u0438\u0433\u043B\u0443\u0448\u0438\u0442\u044C \u0441\u0432\u0435\u0442 \u0432 \u0433\u043E\u0441\u0442\u0438\u043D\u043E\u0439",
    "Start morning news briefing": "\u041D\u0430\u0447\u0430\u043B\u043E \u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0433\u043E \u0431\u0440\u0438\u0444\u0438\u043D\u0433\u0430 \u043F\u043E \u043D\u043E\u0432\u043E\u0441\u0442\u044F\u043C",
    "Movie night": "\u041A\u0438\u043D\u043E\u0432\u0435\u0447\u0435\u0440",
    "Good morning": "\u0414\u043E\u0431\u0440\u043E\u0435 \u0443\u0442\u0440\u043E",
    "Leaving home": "\u0423\u0445\u043E\u0434 \u0438\u0437 \u0434\u043E\u043C\u0430",
    "status.pctOnline": "{pct}% \u0432 \u0441\u0435\u0442\u0438",
    "status.offlineCount": "{count} \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435",
    "status.allOnline": "\u0412\u0441\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u0432 \u0441\u0435\u0442\u0438",
    "status.suggestionReady": "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E {count} \u0433\u043E\u0442\u043E\u0432\u043E \u0434\u043B\u044F \u0432\u0430\u0441.",
    "status.suggestionsReady": "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u043E {count} \u0443\u0436\u0435 \u0433\u043E\u0442\u043E\u0432\u044B \u0434\u043B\u044F \u0432\u0430\u0441.",
    "status.caughtUp": "\u0422\u0435\u043F\u0435\u0440\u044C \u0432\u044B \u0432 \u043A\u0443\u0440\u0441\u0435 \u0432\u0441\u0435\u0433\u043E.",
    "status.onlineOfTotal": "{online}/{total} \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \u043E\u043D\u043B\u0430\u0439\u043D",
    "mobile.menu": "\u041C\u0435\u043D\u044E",
    "mobile.more": "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435",
    "mobile.systemStatus": "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B NEXUS",
    "mobile.localNetwork": "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0439 \u0441\u0435\u0442\u0438",
    "mobile.offline": "100 % \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435",
    "mobile.localAI": "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u0432\u0438\u0436\u043E\u043A \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0430",
    "mobile.deviceNetwork": "\u0421\u0435\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432",
    "mobile.online": "\u041E\u043D\u043B\u0430\u0439\u043D",
    "mobile.quickControls": "\u0411\u042B\u0421\u0422\u0420\u042B\u0415 \u042D\u041B\u0415\u041C\u0415\u041D\u0422\u042B \u0423\u041F\u0420\u0410\u0412\u041B\u0415\u041D\u0418\u042F",
    "mobile.privacyShield": "\xAB\u0429\u0438\u0442 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438\xBB \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435",
    "mobile.active": "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439",
    "mobile.voiceWake": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u043F\u0440\u043E\u0431\u0443\u0436\u0434\u0435\u043D\u0438\u0435 (\xABNEXUS\xBB)",
    "mobile.on": "\u041E",
    "mobile.autoBackup": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0435 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0434\u043E\u043C\u0430\u0448\u043D\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445",
    "mobile.backupTime": "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E \u0432 03:00",
    "mobile.moreSub.suggestions": "3 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u043E \u043F\u043B\u0430\u043D\u043E\u0432\u043E\u0439 \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E\u0439 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438",
    "mobile.moreSub.skills": "5 \u043D\u0430\u0432\u044B\u043A\u043E\u0432 \u0438 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0435\u0432 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0437\u0430\u043B\u043E\u0433\u0430",
    "mobile.moreSub.personalization": "\u0418\u043C\u044F \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A\u0430, \u043C\u043E\u0434\u0435\u043B\u044C \u0433\u043E\u043B\u043E\u0441\u0430 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
    "mobile.moreSub.billing": "\u0422\u0430\u0440\u0438\u0444\u043D\u044B\u0439 \u043F\u043B\u0430\u043D \xABNEXUS Family\xBB \xB7 \u0414\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0449\u0430\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430",
    "mobile.moreSub.downloads": "3 \u0432\u0435\u0440\u0441\u0438\u0438 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043F\u043E SHA-256",
    "mobile.moreSub.platform": "\u041A\u0440\u043E\u0441\u0441\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435\u043D\u043D\u0430\u044F \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432",
    "mobile.moreSub.agents": "\u0410\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u044B\u0435 \u0430\u0433\u0435\u043D\u0442\u044B \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0430",
    "mobile.moreSub.admin": "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u043E\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u0438",
    "desktop.title": "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430",
    "setup.welcome": "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C",
    "setup.license": "\u041B\u0438\u0446\u0435\u043D\u0437\u0438\u044F",
    "setup.location": "\u041C\u0435\u0441\u0442\u043E\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "setup.installing": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430",
    "setup.finish": "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C",
    "setup.welcomeTitle": "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 NEXUS",
    "setup.welcomeDesc": "\u042D\u0442\u043E\u0442 \u043C\u0430\u0441\u0442\u0435\u0440 \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u0432\u0430\u043C \u043F\u0440\u043E\u0439\u0442\u0438 \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 NEXUS AI \u2014 \u0432\u0430\u0448\u0435\u0439 \u043B\u0438\u0447\u043D\u043E\u0439 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0434\u043B\u044F \u0434\u043E\u043C\u0430.",
    "setup.accept": "\u042F \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u044E \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u043E\u043D\u043D\u043E\u0433\u043E \u0441\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F",
    "setup.chooseFolder": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043F\u043A\u0443 \u0434\u043B\u044F \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438",
    "setup.installBtn": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
    "setup.complete": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430",
    "setup.launchNow": "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 NEXUS \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441"
  },
  // ── Ukrainian ──
  uk: {
    "app.greeting": "\u041F\u0440\u0438\u0432\u0456\u0442, {name}, \u0447\u0438\u043C \u043C\u043E\u0436\u0443 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u0442\u0438?",
    "app.confirmNeeded": "{name}, \u0446\u044F \u0434\u0456\u044F \u043F\u043E\u0442\u0440\u0435\u0431\u0443\u0454 \u0432\u0430\u0448\u043E\u0433\u043E \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F.",
    "download.title": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 NEXUS",
    "download.primaryButton": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u0434\u043B\u044F {os}",
    "download.otherOs": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u0435 \u0456\u043D\u0448\u0443 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0443 \u0441\u0438\u0441\u0442\u0435\u043C\u0443?",
    "download.checksum": "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u0430 \u0441\u0443\u043C\u0430 SHA-256",
    "screen.today": "\u0421\u044C\u043E\u0433\u043E\u0434\u043D\u0456",
    "screen.homeState": "\u0413\u043E\u043B\u043E\u0432\u043D\u0430",
    "screen.suggestions": "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457",
    "screen.skills": "\u041D\u0430\u0432\u0438\u0447\u043A\u0438",
    "screen.family": "\u0421\u0456\u043C'\u044F",
    "screen.devices": "\u041F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "screen.platform": "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0438",
    "screen.agents": "\u0410\u0433\u0435\u043D\u0442\u0438",
    "screen.personalization": "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0456\u0437\u0430\u0446\u0456\u044F",
    "screen.billing": "\u041F\u0456\u0434\u043F\u0438\u0441\u043A\u0430",
    "screen.downloadCenter": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "screen.adminDashboard": "\u041F\u0430\u043D\u0435\u043B\u044C \u0430\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430",
    "today.devicesOnline": "\u041F\u0440\u0438\u0441\u0442\u0440\u043E\u0457, \u0449\u043E \u043F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0456 \u0434\u043E \u043C\u0435\u0440\u0435\u0436\u0456",
    "today.energy": "\u0415\u043D\u0435\u0440\u0433\u0435\u0442\u0438\u043A\u0430 \u0441\u044C\u043E\u0433\u043E\u0434\u043D\u0456",
    "today.activeRoutines": "\u0410\u043A\u0442\u0438\u0432\u043D\u0456 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438",
    "today.suggestions": "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457",
    "screen.devices.empty": "\u041D\u0430\u0440\u0430\u0437\u0456 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457 \u043D\u0435 \u043F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E.",
    "screen.agents.empty": "\u0410\u0433\u0435\u043D\u0442\u0438 \u0449\u0435 \u043D\u0435 \u043D\u0430\u043B\u0430\u0448\u0442\u043E\u0432\u0430\u043D\u0456.",
    "screen.suggestions.empty": "\u041F\u043E\u043A\u0438 \u0449\u043E \u043D\u0435\u043C\u0430\u0454 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0439 \u2014 NEXUS AI \u0449\u0435 \u043D\u0430\u0432\u0447\u0430\u0454\u0442\u044C\u0441\u044F.",
    "screen.skills.empty": "\u041D\u0430\u0440\u0430\u0437\u0456 \u0449\u0435 \u043D\u0435 \u043E\u0441\u0432\u043E\u0454\u043D\u043E \u0436\u043E\u0434\u043D\u0438\u0445 \u043D\u0430\u0432\u0438\u0447\u043E\u043A.",
    "screen.homeState.empty": "\u041F\u043E\u043A\u0438 \u0449\u043E \u043D\u0435\u043C\u0430\u0454 \u043A\u0456\u043C\u043D\u0430\u0442 \u0437 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044F\u043C\u0438.",
    "plan.free": "\u0411\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u043E",
    "plan.premium": "\u041F\u0440\u0435\u043C\u0456\u0443\u043C",
    "plan.family": "\u0421\u0456\u043C'\u044F",
    "billing.manage": "\u041A\u0435\u0440\u0443\u0432\u0430\u043D\u043D\u044F \u043F\u0456\u0434\u043F\u0438\u0441\u043A\u043E\u044E",
    "auth.tagline": "\u0412\u0430\u0448\u0430 \u043E\u0441\u043E\u0431\u0438\u0441\u0442\u0430 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0434\u043B\u044F \u0434\u043E\u043C\u0443",
    "auth.signInTitle": "\u0423\u0432\u0456\u0439\u0442\u0438 \u0432 NEXUS",
    "auth.signUpTitle": "\u0421\u0442\u0432\u043E\u0440\u0456\u0442\u044C \u0441\u0432\u0456\u0439 \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0439 \u0437\u0430\u043F\u0438\u0441 NEXUS",
    "auth.email": "\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430 \u043F\u043E\u0448\u0442\u0430",
    "auth.password": "\u041F\u0430\u0440\u043E\u043B\u044C",
    "auth.signInButton": "\u0423\u0432\u0456\u0439\u0442\u0438",
    "auth.signUpButton": "\u0421\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0439 \u0437\u0430\u043F\u0438\u0441",
    "auth.switchToSignUp": "\u0412\u0438 \u0442\u0443\u0442 \u0432\u043F\u0435\u0440\u0448\u0435? \u0421\u0442\u0432\u043E\u0440\u0456\u0442\u044C \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0439 \u0437\u0430\u043F\u0438\u0441",
    "auth.switchToSignIn": "\u0423 \u0432\u0430\u0441 \u0432\u0436\u0435 \u0454 \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0439 \u0437\u0430\u043F\u0438\u0441? \u0423\u0432\u0456\u0439\u0442\u0438",
    "auth.passwordHint": "\u0429\u043E\u043D\u0430\u0439\u043C\u0435\u043D\u0448\u0435 8 \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432",
    "auth.genericError": "\u0421\u0442\u0430\u043B\u0430\u0441\u044F \u043F\u043E\u043C\u0438\u043B\u043A\u0430. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437.",
    "auth.locked": "\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0431\u0430\u0433\u0430\u0442\u043E \u043D\u0435\u0432\u0434\u0430\u043B\u0438\u0445 \u0441\u043F\u0440\u043E\u0431. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437 \u0443 {time}.",
    "auth.rateLimited": "\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0431\u0430\u0433\u0430\u0442\u043E \u0437\u0430\u043F\u0438\u0442\u0456\u0432. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437 \u043F\u0456\u0437\u043D\u0456\u0448\u0435.",
    "auth.logout": "\u0412\u0438\u0439\u0442\u0438",
    "auth.welcome": "\u041B\u0430\u0441\u043A\u0430\u0432\u043E \u043F\u0440\u043E\u0441\u0438\u043C\u043E, {name}",
    "auth.continue": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438",
    "auth.guest": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u044F\u043A \u0433\u0456\u0441\u0442\u044C",
    "auth.guestHint": "\u041E\u0437\u043D\u0430\u0439\u043E\u043C\u0442\u0435\u0441\u044F \u0437 NEXUS \u0431\u0435\u0437 \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457",
    "auth.social.divider": "\u0430\u0431\u043E \u043F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0443 \u043F\u043E\u0448\u0442\u0443",
    "auth.social.google": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Google",
    "auth.social.apple": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u0437 Apple",
    "auth.social.unavailable": "\u0426\u0435\u0439 \u0441\u043F\u043E\u0441\u0456\u0431 \u0432\u0445\u043E\u0434\u0443 \u0449\u0435 \u043D\u0435 \u043D\u0430\u043B\u0430\u0448\u0442\u043E\u0432\u0430\u043D\u043E.",
    "auth.social.error": "\u0412\u0445\u0456\u0434 \u0447\u0435\u0440\u0435\u0437 \u0446\u044C\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A\u0430 \u043F\u043E\u0441\u043B\u0443\u0433 \u043D\u0435 \u0432\u0434\u0430\u0432\u0441\u044F. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437.",
    "mkt.nav.features": "\u041E\u0441\u043E\u0431\u043B\u0438\u0432\u043E\u0441\u0442\u0456",
    "mkt.nav.pricing": "\u0426\u0456\u043D\u0438",
    "mkt.nav.testimonials": "\u0412\u0456\u0434\u0433\u0443\u043A\u0438",
    "mkt.nav.integrations": "\u0406\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0456\u0457",
    "mkt.nav.about": "\u041F\u0440\u043E \u043D\u0430\u0441",
    "mkt.nav.download": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "mkt.nav.faq": "\u0427\u0430\u0441\u0442\u0456 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F",
    "mkt.nav.signIn": "\u0423\u0432\u0456\u0439\u0442\u0438",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0434\u043E\u0434\u0430\u0442\u043E\u043A NEXUS \u043D\u0430 \u043A\u043E\u0436\u0435\u043D \u043F\u0440\u0438\u0441\u0442\u0440\u0456\u0439, \u044F\u043A\u0438\u0439 \u0443 \u0432\u0430\u0441 \u0454",
    "mkt.hero.desc": "NEXUS \u2014 \u0446\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0430 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430, \u043E\u0440\u0456\u0454\u043D\u0442\u043E\u0432\u0430\u043D\u0430 \u043D\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u043A\u0435\u0440\u0443\u0432\u0430\u043D\u043D\u044F \u0442\u0430 \u0437\u0430\u0445\u0438\u0441\u0442 \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u0438\u0445 \u0434\u0430\u043D\u0438\u0445. \u0412\u0441\u0442\u0430\u043D\u043E\u0432\u0456\u0442\u044C \u043D\u0430\u0441\u0442\u0456\u043B\u044C\u043D\u0443 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0443 \u0430\u0431\u043E \u043C\u043E\u0431\u0456\u043B\u044C\u043D\u0438\u0439 \u0434\u043E\u0434\u0430\u0442\u043E\u043A \u0456 \u043A\u0435\u0440\u0443\u0439\u0442\u0435 \u0432\u0441\u0456\u043C\u0430 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044F\u043C\u0438 \u0437 \u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F \u2014 100% \u043E\u0431\u0440\u043E\u0431\u043A\u0430 \u0434\u0430\u043D\u0438\u0445 \u0432\u0456\u0434\u0431\u0443\u0432\u0430\u0454\u0442\u044C\u0441\u044F \u0431\u0435\u0437\u043F\u043E\u0441\u0435\u0440\u0435\u0434\u043D\u044C\u043E \u043D\u0430 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457. \u041A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0435\u044E \u043C\u043E\u0436\u043D\u0430 \u0447\u0435\u0440\u0435\u0437 \u0441\u0430\u043C\u0443 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0443, \u0430 \u043D\u0435 \u0447\u0435\u0440\u0435\u0437 \u0431\u0440\u0430\u0443\u0437\u0435\u0440.",
    "mkt.hero.actionPrimary": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u0434\u043B\u044F {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "\u041F\u043E\u0434\u0438\u0432\u0456\u0442\u044C\u0441\u044F, \u044F\u043A \u0446\u0435 \u043F\u0440\u0430\u0446\u044E\u0454",
    "mkt.hero.trust": "\u2605 \u041F\u043E\u043D\u0430\u0434 500 000 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0456\u0432 \xB7 \u041F\u043E\u043D\u0430\u0434 2000 \u043F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0445 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457\u0432 \xB7 100% \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0438\u0439 \u0437\u0430\u0445\u0438\u0441\u0442 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0438\u0445 \u0434\u0430\u043D\u0438\u0445",
    "mkt.stats.title": "NEXUS \u0443 \u0446\u0438\u0444\u0440\u0430\u0445",
    "mkt.stats.users": "\u0410\u043A\u0442\u0438\u0432\u043D\u0456 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0456",
    "mkt.stats.devices": "\u041F\u0456\u0434\u0442\u0440\u0438\u043C\u0443\u0432\u0430\u043D\u0456 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "mkt.stats.privacy": "\u0417\u0430\u0445\u0438\u0441\u0442 \u043A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u043E\u0441\u0442\u0456 \u043D\u0430 \u0441\u0430\u043C\u043E\u043C\u0443 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "mkt.stats.rating": "\u0421\u0435\u0440\u0435\u0434\u043D\u044F \u043E\u0446\u0456\u043D\u043A\u0430",
    "mkt.privacy.title": "\u0412\u0430\u0448\u0456 \u0434\u0430\u043D\u0456 \u043D\u0430\u043B\u0435\u0436\u0430\u0442\u044C \u0432\u0430\u043C",
    "mkt.privacy.processing": "100% \u043E\u0431\u0440\u043E\u0431\u043A\u0430 \u043D\u0430 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "mkt.privacy.encryption": "\u041D\u0430\u0441\u043A\u0440\u0456\u0437\u043D\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0435 \u0448\u0438\u0444\u0440\u0443\u0432\u0430\u043D\u043D\u044F",
    "mkt.privacy.logging": "\u0412\u0456\u0434\u0441\u0443\u0442\u043D\u0456\u0441\u0442\u044C \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457 \u0434\u0430\u043D\u0438\u0445 \u0443 \u0445\u043C\u0430\u0440\u0456",
    "mkt.how.title": "\u042F\u043A \u0446\u0435 \u043F\u0440\u0430\u0446\u044E\u0454",
    "mkt.how.step1.title": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "mkt.how.step1.desc": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0434\u043E\u0434\u0430\u0442\u043E\u043A \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0457 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0438.",
    "mkt.how.step2.title": "\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0438",
    "mkt.how.step2.desc": "\u0417\u0430\u0432\u0435\u0440\u0448\u0456\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0435 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0430 \u043B\u0456\u0447\u0435\u043D\u0456 \u0441\u0435\u043A\u0443\u043D\u0434\u0438.",
    "mkt.how.step3.title": "\u041F\u0456\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0438 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "mkt.how.step3.desc": "\u041F\u043E\u0447\u043D\u0456\u0442\u044C \u0431\u0435\u0437\u043F\u0435\u0447\u043D\u043E \u043A\u0435\u0440\u0443\u0432\u0430\u0442\u0438 \u0441\u0432\u043E\u0457\u043C \xAB\u0440\u043E\u0437\u0443\u043C\u043D\u0438\u043C \u0434\u043E\u043C\u043E\u043C\xBB.",
    "mkt.preview.title": "\u041F\u043E\u0434\u0438\u0432\u0456\u0442\u044C\u0441\u044F, \u044F\u043A \u043F\u0440\u0430\u0446\u044E\u0454 NEXUS",
    "mkt.preview.desc": "\u041E\u0433\u043B\u044F\u0434 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0457 \u043F\u0430\u043D\u0435\u043B\u0456 \u0443\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F, \u044F\u043A\u0443 \u0432\u0438 \u043F\u043E\u0431\u0430\u0447\u0438\u0442\u0435 \u043E\u0434\u0440\u0430\u0437\u0443 \u043F\u0456\u0441\u043B\u044F \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0434\u043E\u0434\u0430\u0442\u043A\u0430.",
    "mkt.preview.tab.today": "\u0421\u044C\u043E\u0433\u043E\u0434\u043D\u0456",
    "mkt.preview.tab.devices": "\u041F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "mkt.preview.tab.skills": "\u041F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u0438",
    "mkt.preview.tab.family": "\u0421\u0456\u043C'\u044F",
    "mkt.download.mobile.title": "\u041C\u043E\u0431\u0456\u043B\u044C\u043D\u0456 \u0434\u043E\u0434\u0430\u0442\u043A\u0438",
    "mkt.download.mobile.desc": "\u0414\u043E\u0434\u0430\u0442\u043A\u0438 \u0434\u043B\u044F iOS \u0442\u0430 Android \u043D\u0435\u0437\u0430\u0431\u0430\u0440\u043E\u043C \u0437\u2019\u044F\u0432\u043B\u044F\u0442\u044C\u0441\u044F.",
    "mkt.download.mobile.apple": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u043D\u0430",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "\u041E\u0442\u0440\u0438\u043C\u0430\u0439 \u0446\u0435",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\u041D\u0435\u0437\u0430\u0431\u0430\u0440\u043E\u043C",
    "mkt.seo.title": "NEXUS \u2014 \u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0441\u0432\u043E\u044E \u043E\u0441\u043E\u0431\u0438\u0441\u0442\u0443 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0443 \u0441\u0438\u0441\u0442\u0435\u043C\u0443",
    "mkt.seo.desc": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 NEXUS \u0434\u043B\u044F Windows, macOS \u0442\u0430 Linux. \u0412\u0435\u0440\u0441\u0456\u0457 \u0434\u043B\u044F iOS \u0442\u0430 Android \u0437\u2019\u044F\u0432\u043B\u044F\u0442\u044C\u0441\u044F \u043D\u0430\u0439\u0431\u043B\u0438\u0436\u0447\u0438\u043C \u0447\u0430\u0441\u043E\u043C.",
    "mkt.skipToContent": "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u0434\u043E \u0432\u043C\u0456\u0441\u0442\u0443",
    "mkt.pricing.title": "\u041F\u0440\u043E\u0441\u0442\u0430 \u0442\u0430 \u043F\u0440\u043E\u0437\u043E\u0440\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0446\u0456\u043D\u043E\u0443\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F",
    "mkt.pricing.free": "\u0411\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u043E",
    "mkt.pricing.freeDesc": "\u0412\u0441\u0435, \u0449\u043E \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u043E \u0434\u043B\u044F \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F \xAB\u0440\u043E\u0437\u0443\u043C\u043D\u043E\u0433\u043E \u0431\u0443\u0434\u0438\u043D\u043A\u0443\xBB \u0443 \u0432\u0430\u0448\u043E\u043C\u0443 \u0440\u0435\u0433\u0456\u043E\u043D\u0456.",
    "mkt.pricing.premium": "\u041F\u0440\u0435\u043C\u0456\u0443\u043C",
    "mkt.pricing.premiumDesc": "\u041F\u0435\u0440\u0435\u0434\u043E\u0432\u0456 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0456\u0457 \u043E\u0431\u0440\u043E\u0431\u043A\u0438 \u0434\u0430\u043D\u0438\u0445 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0456 \u0448\u0442\u0443\u0447\u043D\u043E\u0433\u043E \u0456\u043D\u0442\u0435\u043B\u0435\u043A\u0442\u0443 \u0442\u0430 \u0432\u0456\u0434\u0434\u0430\u043B\u0435\u043D\u0438\u0439 \u0434\u043E\u0441\u0442\u0443\u043F.",
    "mkt.pricing.family": "\u0421\u0456\u043C'\u044F",
    "mkt.pricing.familyDesc": "\u0414\u043E 5 \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0445 \u0437\u0430\u043F\u0438\u0441\u0456\u0432 \u0456\u0437 \u043F\u043E\u0432\u043D\u0438\u043C \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u0435\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u0443.",
    "mkt.pricing.cta": "\u041F\u043E\u0447\u043D\u0456\u0442\u044C \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u043E",
    "mkt.testimonials.title": "\u041F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u0438\u0439 \u0441\u0435\u0440\u0435\u0434 \u043F\u0440\u0438\u0445\u0438\u043B\u044C\u043D\u0438\u043A\u0456\u0432 \xAB\u0440\u043E\u0437\u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0443\xBB",
    "mkt.testimonials.quote1": "NEXUS \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u0437\u043C\u0456\u043D\u0438\u0432 \u0442\u0435, \u044F\u043A \u044F \u0432\u0437\u0430\u0454\u043C\u043E\u0434\u0456\u044E \u0437\u0456 \u0441\u0432\u043E\u0457\u043C \u0431\u0443\u0434\u0438\u043D\u043A\u043E\u043C. \u041A\u043E\u043B\u0438 \u0432\u0441\u0435 \u0437\u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C\u0441\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E, \u0446\u0435 \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0430\u0431\u0430\u0433\u0430\u0442\u043E \u0448\u0432\u0438\u0434\u0448\u0435.",
    "mkt.testimonials.author1": "\u0421\u0430\u0440\u0430 \u0414\u0436\u0435\u043D\u043A\u0456\u043D\u0441",
    "mkt.testimonials.role1": "\u0420\u0430\u043D\u043D\u0456\u0439 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447",
    "mkt.testimonials.quote2": "\u041D\u0430\u0440\u0435\u0448\u0442\u0456, \u0445\u0430\u0431 \u0434\u043B\u044F \xAB\u0440\u043E\u0437\u0443\u043C\u043D\u043E\u0433\u043E \u0431\u0443\u0434\u0438\u043D\u043A\u0443\xBB, \u044F\u043A\u0438\u0439 \u043F\u043E\u0432\u0430\u0436\u0430\u0454 \u043C\u043E\u044E \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u0456\u0441\u0442\u044C. \u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430 \u043E\u0431\u0440\u043E\u0431\u043A\u0430 \u0434\u0430\u043D\u0438\u0445 \u0437\u0430 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u043E\u044E \u0448\u0442\u0443\u0447\u043D\u043E\u0433\u043E \u0456\u043D\u0442\u0435\u043B\u0435\u043A\u0442\u0443 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430\u0434\u0437\u0432\u0438\u0447\u0430\u0439\u043D\u043E \u0448\u0432\u0438\u0434\u043A\u043E.",
    "mkt.testimonials.author2": "\u0414\u0435\u0432\u0456\u0434 \u0427\u0435\u043D",
    "mkt.testimonials.role2": "\u0406\u043D\u0436\u0435\u043D\u0435\u0440-\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0456\u0441\u0442",
    "mkt.testimonials.quote3": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0441\u043A\u043B\u0430\u0434\u043D\u0438\u0445 \u0441\u0446\u0435\u043D\u0430\u0440\u0456\u0457\u0432 \u2014 \u0446\u0435 \u0441\u0443\u0446\u0456\u043B\u044C\u043D\u0430 \u043B\u0435\u0433\u043A\u0456\u0441\u0442\u044C. \u041C\u0435\u043D\u0456 \u0434\u0443\u0436\u0435 \u043F\u043E\u0434\u043E\u0431\u0430\u0454\u0442\u044C\u0441\u044F, \u0449\u043E \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043F\u0440\u043E\u0434\u043E\u0432\u0436\u0443\u0454 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438, \u043D\u0430\u0432\u0456\u0442\u044C \u043A\u043E\u043B\u0438 \u0437\u043D\u0438\u043A\u0430\u0454 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442.",
    "mkt.testimonials.author3": "\u0415\u043C\u043C\u0430 \u0422\u043E\u043C\u043F\u0441\u043E\u043D",
    "mkt.testimonials.role3": "\u041B\u044E\u0431\u0438\u0442\u0435\u043B\u044C \xAB\u0440\u043E\u0437\u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0443\xBB",
    "mkt.integrations.title": "\u0421\u0443\u043C\u0456\u0441\u043D\u0438\u0439 \u0437 \u0432\u0430\u0448\u0438\u043C\u0438 \u0443\u043B\u044E\u0431\u043B\u0435\u043D\u0438\u043C\u0438 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044F\u043C\u0438",
    "mkt.changelog.title": "\u0429\u043E \u043D\u043E\u0432\u043E\u0433\u043E \u0443 \u0432\u0435\u0440\u0441\u0456\u0457 3.14.2",
    "mkt.requirements.title": "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0456 \u0432\u0438\u043C\u043E\u0433\u0438",
    "mkt.requirements.desc": "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 64-\u0431\u0456\u0442\u043D\u0430 \u041E\u0421 \u0442\u0430 \u0449\u043E\u043D\u0430\u0439\u043C\u0435\u043D\u0448\u0435 2 \u0413\u0411 \u043E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u043E\u0457 \u043F\u0430\u043C\u2019\u044F\u0442\u0456.",
    "mkt.footer.desc": "\u0412\u0430\u0448\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0430 \u0434\u043E\u043C\u0430\u0448\u043D\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430, \u043E\u0440\u0456\u0454\u043D\u0442\u043E\u0432\u0430\u043D\u0430 \u043D\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u043A\u0435\u0440\u0443\u0432\u0430\u043D\u043D\u044F. \u041F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430, \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u0432\u0430\u0448\u0430.",
    "mkt.footer.product": "\u0422\u043E\u0432\u0430\u0440",
    "mkt.footer.company": "\u041A\u043E\u043C\u043F\u0430\u043D\u0456\u044F \u0442\u0430 \u044E\u0440\u0438\u0434\u0438\u0447\u043D\u0430 \u0456\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F",
    "mkt.footer.about": "\u041F\u0440\u043E \u043D\u0430\u0441",
    "mkt.footer.privacy": "\u041F\u043E\u043B\u0456\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u043E\u0441\u0442\u0456",
    "mkt.footer.terms": "\u0423\u043C\u043E\u0432\u0438 \u043D\u0430\u0434\u0430\u043D\u043D\u044F \u043F\u043E\u0441\u043B\u0443\u0433",
    "mkt.footer.noCookies": "\u041C\u0438 \u043D\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u043C\u043E \u0436\u043E\u0434\u043D\u0438\u0445 \u0444\u0430\u0439\u043B\u0456\u0432 cookie.",
    "mkt.cookie.title": "\u041F\u043E\u043B\u0456\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u043E\u0441\u0442\u0456 \u0442\u0430 \u0444\u0430\u0439\u043B\u0438 cookie",
    "mkt.cookie.desc": "\u041C\u0438 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u043C\u043E \u043E\u0431\u043E\u0432\u2019\u044F\u0437\u043A\u043E\u0432\u0456 \u0444\u0430\u0439\u043B\u0438 cookie \u0434\u043B\u044F \u043D\u0430\u0434\u0430\u043D\u043D\u044F \u043D\u0430\u0448\u0438\u0445 \u043F\u043E\u0441\u043B\u0443\u0433. \u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0443\u044E\u0447\u0438 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u0441\u0430\u0439\u0442\u043E\u043C, \u0432\u0438 \u043F\u043E\u0433\u043E\u0434\u0436\u0443\u0454\u0442\u0435\u0441\u044F \u043D\u0430 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F \u043D\u0430\u043C\u0438 \u0446\u0438\u0445 \u043D\u0435\u043E\u0431\u0445\u0456\u0434\u043D\u0438\u0445 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0456\u0439.",
    "mkt.cookie.accept": "\u0417\u0440\u043E\u0437\u0443\u043C\u0456\u043B\u043E",
    "mkt.cookie.decline": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "mkt.feat.why": "\u0427\u043E\u043C\u0443 \u0441\u0430\u043C\u0435 NEXUS",
    "mkt.feat.1.title": "\u0423\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u0437 \u043F\u0440\u0456\u043E\u0440\u0438\u0442\u0435\u0442\u043E\u043C \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0438\u0445 \u043A\u043E\u043C\u0430\u043D\u0434",
    "mkt.feat.1.desc": "\u0412\u0437\u0430\u0454\u043C\u043E\u0434\u0456\u0439\u0442\u0435 \u0437\u0456 \u0441\u0432\u043E\u0457\u043C \u0431\u0443\u0434\u0438\u043D\u043A\u043E\u043C \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u043C \u0447\u0438\u043D\u043E\u043C.",
    "mkt.feat.2.title": "\u0417\u0430\u0445\u0438\u0449\u0435\u043D\u0456\u0441\u0442\u044C \u2014 \u043D\u0435\u0432\u0456\u0434\u2019\u0454\u043C\u043D\u0430 \u0447\u0430\u0441\u0442\u0438\u043D\u0430 \u043A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0456\u0457",
    "mkt.feat.2.desc": "\u0411\u0435\u0437 \u0445\u043C\u0430\u0440\u043D\u0438\u0445 \u0441\u0435\u0440\u0432\u0456\u0441\u0456\u0432, \u0431\u0435\u0437 \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457 \u0434\u0430\u043D\u0438\u0445. \u0422\u0456\u043B\u044C\u043A\u0438 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0435 \u0448\u0438\u0444\u0440\u0443\u0432\u0430\u043D\u043D\u044F.",
    "mkt.feat.3.title": "\u0421\u0443\u043C\u0456\u0441\u043D\u0438\u0439",
    "mkt.feat.3.desc": "\u041F\u043E\u043D\u0430\u0434 500 \u043F\u0440\u043E\u0442\u043E\u043A\u043E\u043B\u0456\u0432, \u0437\u043E\u043A\u0440\u0435\u043C\u0430 Matter, Zigbee, Z-Wave.",
    "mkt.feat.4.title": "\u041D\u0435\u0432\u0438\u0434\u0438\u043C\u0438\u0439 \u0448\u0442\u0443\u0447\u043D\u0438\u0439 \u0456\u043D\u0442\u0435\u043B\u0435\u043A\u0442",
    "mkt.feat.4.desc": "\u041F\u0440\u0430\u0446\u044E\u0454 \u0443 \u0444\u043E\u043D\u043E\u0432\u043E\u043C\u0443 \u0440\u0435\u0436\u0438\u043C\u0456, \u0432\u0438\u0432\u0447\u0430\u044E\u0447\u0438 \u0432\u0430\u0448\u0456 \u0437\u0432\u0438\u0447\u043A\u0438.",
    "mkt.faq.title": "\u041F\u043E\u0448\u0438\u0440\u0435\u043D\u0456 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F",
    "mkt.faq.1.q": "\u0427\u0438 \u0454 NEXUS \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u0438\u043C?",
    "mkt.faq.1.a": "\u0422\u0430\u043A. \u041E\u0441\u043D\u043E\u0432\u043D\u0456 \u0444\u0443\u043D\u043A\u0446\u0456\u0457 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u043E\u0457 \u0441\u0438\u0441\u0442\u0435\u043C\u0438 \u0442\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043A\u0435\u0440\u0443\u0432\u0430\u043D\u043D\u044F \u0454 \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u0438\u043C\u0438.",
    "mkt.faq.2.q": "\u042F\u043A\u0456 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u0443\u044E\u0442\u044C\u0441\u044F?",
    "mkt.faq.2.a": "\u041F\u0440\u0438\u0441\u0442\u0440\u043E\u0457 Matter, Zigbee, Z-Wave \u0442\u0430 \u043F\u043E\u043D\u0430\u0434 500 \u0435\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0456 API.",
    "mkt.faq.3.q": "\u0427\u0438 \u043F\u0440\u0430\u0446\u044E\u0454 \u0446\u0435 \u0431\u0435\u0437 \u043F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043D\u044F \u0434\u043E \u0445\u043C\u0430\u0440\u0438?",
    "mkt.faq.3.a": "\u0422\u0430\u043A. \u0412\u0456\u043D \u0437\u0432\u2019\u044F\u0437\u0443\u0454\u0442\u044C\u0441\u044F \u0437 \u0432\u0430\u0448\u0438\u043C\u0438 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044F\u043C\u0438 \u0447\u0435\u0440\u0435\u0437 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0443 \u043C\u0435\u0440\u0435\u0436\u0443 \u0456 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430\u0432\u0456\u0442\u044C \u0443 \u0440\u0430\u0437\u0456 \u0432\u0456\u0434\u0441\u0443\u0442\u043D\u043E\u0441\u0442\u0456 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443.",
    "mkt.faq.4.q": "\u042F\u043A \u0437\u0430\u0431\u0435\u0437\u043F\u0435\u0447\u0443\u0454\u0442\u044C\u0441\u044F \u0432\u0456\u0434\u0434\u0430\u043B\u0435\u043D\u0438\u0439 \u0434\u043E\u0441\u0442\u0443\u043F?",
    "mkt.faq.4.a": "\u0427\u0435\u0440\u0435\u0437 \u0437\u0430\u0445\u0438\u0449\u0435\u043D\u0438\u0439 \u0442\u0443\u043D\u0435\u043B\u044C \u0456\u0437 \u043D\u0430\u0441\u043A\u0440\u0456\u0437\u043D\u0438\u043C \u0448\u0438\u0444\u0440\u0443\u0432\u0430\u043D\u043D\u044F\u043C \u0443 \u0440\u0430\u043C\u043A\u0430\u0445 \u0442\u0430\u0440\u0438\u0444\u043D\u043E\u0433\u043E \u043F\u043B\u0430\u043D\u0443 \xAB\u041F\u0440\u0435\u043C\u0456\u0443\u043C\xBB \u0430\u0431\u043E \u0447\u0435\u0440\u0435\u0437 \u0432\u043B\u0430\u0441\u043D\u0443 \u043C\u0435\u0440\u0435\u0436\u0443 VPN.",
    "mkt.desktop.eyebrow": "\u0420\u043E\u0431\u043E\u0447\u0438\u0439 \u0441\u0442\u0456\u043B",
    "mkt.desktop.title": "\u041E\u0434\u0438\u043D \u0434\u043E\u0434\u0430\u0442\u043E\u043A \u0434\u043B\u044F \u043A\u043E\u0436\u043D\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0447\u043E\u0433\u043E \u0441\u0442\u043E\u043B\u0443",
    "mkt.desktop.desc": "\u0412\u0431\u0443\u0434\u043E\u0432\u0430\u043D\u0456 \u0432\u0435\u0440\u0441\u0456\u0457 \u0434\u043B\u044F Windows, macOS \u0442\u0430 Linux \u2014 \u043A\u043E\u0436\u043D\u0430 \u0437 \u044F\u043A\u0438\u0445 \u043E\u043F\u0442\u0438\u043C\u0456\u0437\u043E\u0432\u0430\u043D\u0430 \u043F\u0456\u0434 \u0441\u0432\u043E\u044E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "\u041E\u043F\u0442\u0438\u043C\u0456\u0437\u043E\u0432\u0430\u043D\u043E \u0434\u043B\u044F Windows 10 \u0442\u0430 11 \u0456\u0437 \u0431\u0435\u0437\u043F\u0435\u0440\u0435\u0431\u0456\u0439\u043D\u043E\u044E \u0440\u043E\u0431\u043E\u0442\u043E\u044E \u0443 \u0444\u043E\u043D\u043E\u0432\u043E\u043C\u0443 \u0440\u0435\u0436\u0438\u043C\u0456.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0434\u043B\u044F Apple Silicon \u0442\u0430 Intel \u0456\u0437 \u0433\u043B\u0438\u0431\u043E\u043A\u043E\u044E \u0456\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0456\u0454\u044E \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "\u041B\u0435\u0433\u043A\u0438\u0439, \u0448\u0432\u0438\u0434\u043A\u0438\u0439 \u0456 \u0441\u0443\u043C\u0456\u0441\u043D\u0438\u0439 \u0437 \u0443\u0441\u0456\u043C\u0430 \u043E\u0441\u043D\u043E\u0432\u043D\u0438\u043C\u0438 \u0434\u0438\u0441\u0442\u0440\u0438\u0431\u0443\u0442\u0438\u0432\u0430\u043C\u0438.",
    "mkt.desktop.download": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "mkt.mobile.eyebrow": "\u041C\u043E\u0431\u0456\u043B\u044C\u043D\u0438\u0439",
    "mkt.mobile.title": "\u0412\u0430\u0448 \u0434\u0456\u043C \u0443 \u043A\u0438\u0448\u0435\u043D\u0456",
    "mkt.mobile.desc": "\u0414\u043E\u0434\u0430\u0442\u043E\u043A-\u0441\u0443\u043F\u0443\u0442\u043D\u0438\u043A NEXUS \u0434\u043E\u0437\u0432\u043E\u043B\u044F\u0454 \u043A\u0435\u0440\u0443\u0432\u0430\u0442\u0438 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0454\u043C \u043E\u0434\u043D\u0438\u043C \u0434\u043E\u0442\u0438\u043A\u043E\u043C \u2014 \u0434\u0435 \u0431 \u0432\u0438 \u043D\u0435 \u0431\u0443\u043B\u0438.",
    "mkt.mobile.feat1.title": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0438\u0439 \u0437\u0432'\u044F\u0437\u043E\u043A \u0443 \u0434\u043E\u0440\u043E\u0437\u0456",
    "mkt.mobile.feat1.desc": "\u0421\u043F\u0456\u043B\u043A\u0443\u0439\u0442\u0435\u0441\u044F \u0437\u0456 \u0441\u0432\u043E\u0457\u043C \xAB\u0440\u043E\u0437\u0443\u043C\u043D\u0438\u043C\xBB \u0431\u0443\u0434\u0438\u043D\u043A\u043E\u043C \u0437 \u0431\u0443\u0434\u044C-\u044F\u043A\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F \u0437\u0430\u0432\u0434\u044F\u043A\u0438 \u0432\u0431\u0443\u0434\u043E\u0432\u0430\u043D\u0456\u0439 \u0444\u0443\u043D\u043A\u0446\u0456\u0457 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u043C\u043E\u0432\u0438.",
    "mkt.mobile.feat2.title": "\u0412\u0456\u0434\u0434\u0430\u043B\u0435\u043D\u0438\u0439 \u0434\u043E\u0441\u0442\u0443\u043F",
    "mkt.mobile.feat2.desc": "\u0411\u0435\u0437\u043F\u0435\u0447\u043D\u043E \u043F\u0456\u0434\u043A\u043B\u044E\u0447\u0456\u0442\u044C\u0441\u044F \u0434\u043E \u0441\u0432\u043E\u0454\u0457 \u0434\u043E\u043C\u0430\u0448\u043D\u044C\u043E\u0457 \u043C\u0435\u0440\u0435\u0436\u0456 \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0439 \u0442\u0443\u043D\u0435\u043B\u044C.",
    "mkt.mobile.feat3.title": "Push-\u043F\u043E\u0432\u0456\u0434\u043E\u043C\u043B\u0435\u043D\u043D\u044F",
    "mkt.mobile.feat3.desc": "\u041E\u0442\u0440\u0438\u043C\u0443\u0439\u0442\u0435 \u043C\u0438\u0442\u0442\u0454\u0432\u0456 \u0441\u043F\u043E\u0432\u0456\u0449\u0435\u043D\u043D\u044F \u043F\u0440\u043E \u043F\u043E\u0434\u0456\u0457, \u044F\u043A\u0456 \u0434\u043B\u044F \u0432\u0430\u0441 \u0432\u0430\u0436\u043B\u0438\u0432\u0456.",
    "mkt.mobile.feat4.title": "\u0411\u0456\u043E\u043C\u0435\u0442\u0440\u0438\u0447\u043D\u0438\u0439 \u0437\u0430\u043C\u043E\u043A",
    "mkt.mobile.feat4.desc": "Face ID \u0442\u0430 \u0441\u043A\u0430\u043D\u0435\u0440 \u0432\u0456\u0434\u0431\u0438\u0442\u043A\u0456\u0432 \u043F\u0430\u043B\u044C\u0446\u0456\u0432 \u0437\u0430\u0431\u0435\u0437\u043F\u0435\u0447\u0443\u044E\u0442\u044C \u043A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u0456\u0441\u0442\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u0434\u043E\u043C\u0430\u0448\u043D\u0456\u043C\u0438 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044F\u043C\u0438.",
    "mkt.cta.title": "\u0422\u0432\u0456\u0439 \u0434\u0456\u043C \u2014 \u0442\u0432\u043E\u0457 \u043F\u0440\u0430\u0432\u0438\u043B\u0430.",
    "mkt.cta.desc": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0434\u043E\u0434\u0430\u0442\u043E\u043A NEXUS \u0456 \u043A\u0435\u0440\u0443\u0439\u0442\u0435 \u0432\u0441\u0456\u043C\u0430 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044F\u043C\u0438 \u0437 \u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F.",
    "mkt.cta.button": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u043E",
    "mkt.footer.platforms": "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0438",
    "Dim living room lights": "\u041F\u0440\u0438\u0433\u043B\u0443\u0448\u0438\u0442\u0438 \u0441\u0432\u0456\u0442\u043B\u043E \u0443 \u0432\u0456\u0442\u0430\u043B\u044C\u043D\u0456",
    "Start morning news briefing": "\u041F\u043E\u0447\u0430\u0442\u043E\u043A \u0440\u0430\u043D\u043A\u043E\u0432\u043E\u0433\u043E \u0431\u0440\u0438\u0444\u0456\u043D\u0433\u0443 \u0437 \u043D\u043E\u0432\u0438\u043D",
    "Movie night": "\u041A\u0456\u043D\u043E\u0432\u0435\u0447\u0456\u0440",
    "Good morning": "\u0414\u043E\u0431\u0440\u043E\u0433\u043E \u0440\u0430\u043D\u043A\u0443",
    "Leaving home": "\u0412\u0438\u0457\u0437\u0434 \u0437 \u0434\u043E\u043C\u0443",
    "status.pctOnline": "{pct}% \u0432 \u043C\u0435\u0440\u0435\u0436\u0456",
    "status.offlineCount": "{count} \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u043C\u0443 \u0440\u0435\u0436\u0438\u043C\u0456",
    "status.allOnline": "\u0423\u0441\u0456 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457 \u043F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0456 \u0434\u043E \u043C\u0435\u0440\u0435\u0436\u0456",
    "status.suggestionReady": "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044F \u0449\u043E\u0434\u043E {count} \u0432\u0436\u0435 \u0433\u043E\u0442\u043E\u0432\u0430 \u0434\u043B\u044F \u0432\u0430\u0441.",
    "status.suggestionsReady": "\u041F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457 \u0449\u043E\u0434\u043E {count} \u0432\u0436\u0435 \u0433\u043E\u0442\u043E\u0432\u0456 \u0434\u043B\u044F \u0432\u0430\u0441.",
    "status.caughtUp": "\u0422\u0435\u043F\u0435\u0440 \u0432\u0438 \u0432 \u043A\u0443\u0440\u0441\u0456 \u0432\u0441\u044C\u043E\u0433\u043E.",
    "status.onlineOfTotal": "{online}/{total} \u043E\u043D\u043B\u0430\u0439\u043D",
    "mobile.menu": "\u041C\u0435\u043D\u044E",
    "mobile.more": "\u0411\u0456\u043B\u044C\u0448\u0435",
    "mobile.systemStatus": "\u0421\u0442\u0430\u043D \u0441\u0438\u0441\u0442\u0435\u043C\u0438 NEXUS",
    "mobile.localNetwork": "\u041F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043D\u044F \u0434\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0457 \u043C\u0435\u0440\u0435\u0436\u0456",
    "mobile.offline": "100% \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u043C\u0443 \u0440\u0435\u0436\u0438\u043C\u0456",
    "mobile.localAI": "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0438\u0439 \u0434\u0432\u0438\u0433\u0443\u043D \u0448\u0442\u0443\u0447\u043D\u043E\u0433\u043E \u0456\u043D\u0442\u0435\u043B\u0435\u043A\u0442\u0443",
    "mobile.deviceNetwork": "\u041C\u0435\u0440\u0435\u0436\u0430 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457\u0432",
    "mobile.online": "\u041E\u043D\u043B\u0430\u0439\u043D",
    "mobile.quickControls": "\u0428\u0412\u0418\u0414\u041A\u0406 \u0415\u041B\u0415\u041C\u0415\u041D\u0422\u0418 \u0423\u041F\u0420\u0410\u0412\u041B\u0406\u041D\u041D\u042F",
    "mobile.privacyShield": "\xAB\u041E\u0444\u043B\u0430\u0439\u043D-\u0449\u0438\u0442 \u043A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u043E\u0441\u0442\u0456\xBB",
    "mobile.active": "\u0410\u043A\u0442\u0438\u0432\u043D\u0438\u0439",
    "mobile.voiceWake": "\u0410\u043A\u0442\u0438\u0432\u0430\u0446\u0456\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u043C (\xABNEXUS\xBB)",
    "mobile.on": "\u041F\u0440\u043E",
    "mobile.autoBackup": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u0435 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0435 \u043A\u043E\u043F\u0456\u044E\u0432\u0430\u043D\u043D\u044F \u0434\u043E\u043C\u0430\u0448\u043D\u0456\u0445 \u0434\u0430\u043D\u0438\u0445",
    "mobile.backupTime": "\u0429\u043E\u0434\u043D\u044F \u043E 03:00",
    "mobile.moreSub.suggestions": "3 \u0437\u0430\u043F\u043B\u0430\u043D\u043E\u0432\u0430\u043D\u0456 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u0457 \u0449\u043E\u0434\u043E \u0456\u043D\u0442\u0435\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E\u0457 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0456\u0457",
    "mobile.moreSub.skills": "5 \u043D\u0430\u0432\u0438\u0447\u043E\u043A \u0442\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0456\u0457\u0432 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0443",
    "mobile.moreSub.personalization": "\u0406\u043C'\u044F \u043F\u043E\u043C\u0456\u0447\u043D\u0438\u043A\u0430, \u043C\u043E\u0434\u0435\u043B\u044C \u0433\u043E\u043B\u043E\u0441\u0443 \u0442\u0430 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u043E\u0441\u0442\u0456",
    "mobile.moreSub.billing": "\u0422\u0430\u0440\u0438\u0444\u043D\u0438\u0439 \u043F\u043B\u0430\u043D \xABNEXUS Family\xBB \xB7 \u0410\u043A\u0442\u0438\u0432\u043D\u0430 \u043F\u0456\u0434\u043F\u0438\u0441\u043A\u0430",
    "mobile.moreSub.downloads": "3 \u0432\u0435\u0440\u0441\u0456\u0457 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u043E\u0457 \u0441\u0438\u0441\u0442\u0435\u043C\u0438 \u0442\u0430 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0437\u0430 \u0430\u043B\u0433\u043E\u0440\u0438\u0442\u043C\u043E\u043C SHA-256",
    "mobile.moreSub.platform": "\u041A\u0440\u043E\u0441\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u043D\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0456\u0437\u0430\u0446\u0456\u044F \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457\u0432",
    "mobile.moreSub.agents": "\u0410\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u0456 \u0430\u0433\u0435\u043D\u0442\u0438 \u0448\u0442\u0443\u0447\u043D\u043E\u0433\u043E \u0456\u043D\u0442\u0435\u043B\u0435\u043A\u0442\u0443",
    "mobile.moreSub.admin": "\u0410\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0443\u0432\u0430\u043D\u043D\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0438 \u0442\u0430 \u043F\u043E\u043A\u0430\u0437\u043D\u0438\u043A\u0438 \u0435\u0444\u0435\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0456",
    "desktop.title": "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u0430 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430",
    "setup.welcome": "\u041B\u0430\u0441\u043A\u0430\u0432\u043E \u043F\u0440\u043E\u0441\u0438\u043C\u043E",
    "setup.license": "\u041B\u0456\u0446\u0435\u043D\u0437\u0456\u044F",
    "setup.location": "\u041C\u0456\u0441\u0446\u0435\u0437\u043D\u0430\u0445\u043E\u0434\u0436\u0435\u043D\u043D\u044F",
    "setup.installing": "\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.finish": "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0438",
    "setup.welcomeTitle": "\u041B\u0430\u0441\u043A\u0430\u0432\u043E \u043F\u0440\u043E\u0441\u0438\u043C\u043E \u0434\u043E \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F NEXUS",
    "setup.welcomeDesc": "\u0426\u0435\u0439 \u043C\u0430\u0439\u0441\u0442\u0435\u0440 \u0434\u043E\u043F\u043E\u043C\u043E\u0436\u0435 \u0432\u0430\u043C \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0438 NEXUS AI \u2014 \u0432\u0430\u0448\u0443 \u043E\u0441\u043E\u0431\u0438\u0441\u0442\u0443 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0439\u043D\u0443 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0434\u043B\u044F \u0434\u043E\u043C\u0443.",
    "setup.accept": "\u042F \u043F\u0440\u0438\u0439\u043C\u0430\u044E \u0443\u043C\u043E\u0432\u0438 \u043B\u0456\u0446\u0435\u043D\u0437\u0456\u0439\u043D\u043E\u0457 \u0443\u0433\u043E\u0434\u0438",
    "setup.chooseFolder": "\u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043F\u0430\u043F\u043A\u0443 \u0434\u043B\u044F \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.installBtn": "\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0438",
    "setup.complete": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E",
    "setup.launchNow": "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438 NEXUS \u0437\u0430\u0440\u0430\u0437"
  },
  // ── Arabic (RTL) ──
  ar: {
    "app.greeting": "\u0645\u0631\u062D\u0628\u064B\u0627 {name}\u060C \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u064A \u0645\u0633\u0627\u0639\u062F\u062A\u0643\u061F",
    "app.confirmNeeded": "{name}\u060C \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u0623\u0643\u064A\u062F \u0645\u0646\u0643.",
    "download.title": "\u062A\u0646\u0632\u064A\u0644 NEXUS",
    "download.primaryButton": "\u062A\u0646\u0632\u064A\u0644 \u0644\u0640 {os}",
    "download.otherOs": "\u0647\u0644 \u062A\u0633\u062A\u062E\u062F\u0645 \u0646\u0638\u0627\u0645 \u062A\u0634\u063A\u064A\u0644 \u0645\u062E\u062A\u0644\u0641\u064B\u0627\u061F",
    "download.checksum": "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u062A\u062D\u0642\u0642 SHA-256",
    "screen.today": "\u0627\u0644\u064A\u0648\u0645",
    "screen.homeState": "\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    "screen.suggestions": "\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A",
    "screen.skills": "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A",
    "screen.family": "\u0627\u0644\u0623\u0633\u0631\u0629",
    "screen.devices": "\u0627\u0644\u0623\u062C\u0647\u0632\u0629",
    "screen.platform": "\u0627\u0644\u0645\u0646\u0635\u0627\u062A",
    "screen.agents": "\u0627\u0644\u0648\u0643\u0644\u0627\u0621",
    "screen.personalization": "\u0627\u0644\u062A\u062E\u0635\u064A\u0635",
    "screen.billing": "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643",
    "screen.downloadCenter": "\u062A\u0646\u0632\u064A\u0644",
    "screen.adminDashboard": "\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
    "today.devicesOnline": "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u062A\u0635\u0644\u0629 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
    "today.energy": "\u0627\u0644\u0637\u0627\u0642\u0629 \u0627\u0644\u064A\u0648\u0645",
    "today.activeRoutines": "\u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u0627\u0644\u0646\u0634\u0637\u0629",
    "today.suggestions": "\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A",
    "screen.devices.empty": "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0648\u0635\u064A\u0644 \u0623\u064A \u0623\u062C\u0647\u0632\u0629 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.",
    "screen.agents.empty": "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0643\u0648\u064A\u0646 \u0623\u064A \u0648\u0643\u0644\u0627\u0621 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.",
    "screen.suggestions.empty": "\u0644\u0627 \u062A\u0648\u062C\u062F \u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u062D\u062A\u0649 \u0627\u0644\u0622\u0646 \u2014 \u0644\u0627 \u064A\u0632\u0627\u0644 NEXUS AI \u0641\u064A \u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u0639\u0644\u0645.",
    "screen.skills.empty": "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0643\u062A\u0633\u0627\u0628 \u0623\u064A \u0645\u0647\u0627\u0631\u0627\u062A \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.",
    "screen.homeState.empty": "\u0644\u0627 \u062A\u0648\u062C\u062F \u063A\u0631\u0641 \u0645\u0632\u0648\u062F\u0629 \u0628\u0623\u062C\u0647\u0632\u0629 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.",
    "plan.free": "\u0645\u062C\u0627\u0646\u064A",
    "plan.premium": "\u0641\u0626\u0629 \u0628\u0631\u064A\u0645\u064A\u0648\u0645",
    "plan.family": "\u0627\u0644\u0623\u0633\u0631\u0629",
    "billing.manage": "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643",
    "auth.tagline": "\u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0634\u062E\u0635\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0644\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0646\u0632\u0644\u064A",
    "auth.signInTitle": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 NEXUS",
    "auth.signUpTitle": "\u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u0643 \u0639\u0644\u0649 NEXUS",
    "auth.email": "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
    "auth.password": "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    "auth.signInButton": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
    "auth.signUpButton": "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628",
    "auth.switchToSignUp": "\u0647\u0644 \u0623\u0646\u062A \u062C\u062F\u064A\u062F \u0647\u0646\u0627\u061F \u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u064B\u0627",
    "auth.switchToSignIn": "\u0647\u0644 \u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u061F \u0633\u062C\u0651\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
    "auth.passwordHint": "8 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644",
    "auth.genericError": "\u062D\u062F\u062B \u062E\u0637\u0623 \u0645\u0627. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
    "auth.locked": "\u0639\u062F\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u0641\u0627\u0634\u0644\u0629 \u0643\u0628\u064A\u0631 \u062C\u062F\u064B\u0651\u0627. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0641\u064A {time}.",
    "auth.rateLimited": "\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0632\u0627\u0626\u062F. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0644\u0627\u062D\u0642\u064B\u0627.",
    "auth.logout": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
    "auth.welcome": "\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643\u060C {name}",
    "auth.continue": "\u062A\u0627\u0628\u0639",
    "auth.guest": "\u0645\u062A\u0627\u0628\u0639\u0629 \u0643\u0636\u064A\u0641",
    "auth.guestHint": "\u0627\u0633\u062A\u0643\u0634\u0641 NEXUS \u062F\u0648\u0646 \u0627\u0644\u062D\u0627\u062C\u0629 \u0625\u0644\u0649 \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628",
    "auth.social.divider": "\u0623\u0648 \u062A\u0627\u0628\u0639 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
    "auth.social.google": "\u0645\u062A\u0627\u0628\u0639\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 Google",
    "auth.social.apple": "\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0639 Apple",
    "auth.social.unavailable": "\u0644\u0645 \u064A\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0637\u0631\u064A\u0642\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0647\u0630\u0647 \u0628\u0639\u062F.",
    "auth.social.error": "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0645\u0632\u0648\u062F. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
    "mkt.nav.features": "\u0627\u0644\u0645\u064A\u0632\u0627\u062A",
    "mkt.nav.pricing": "\u0627\u0644\u0623\u0633\u0639\u0627\u0631",
    "mkt.nav.testimonials": "\u0634\u0647\u0627\u062F\u0627\u062A",
    "mkt.nav.integrations": "\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u062F\u0645\u062C",
    "mkt.nav.about": "\u0646\u0628\u0630\u0629 \u0639\u0646\u0627",
    "mkt.nav.download": "\u062A\u0646\u0632\u064A\u0644",
    "mkt.nav.faq": "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629",
    "mkt.nav.signIn": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
    "mkt.hero.badge": "v{version} \xB7 \u0648\u064A\u0646\u062F\u0648\u0632 \xB7 \u0645\u0627\u0643 \xB7 \u0644\u064A\u0646\u0643\u0633",
    "mkt.hero.title": "\u0642\u0645 \u0628\u062A\u0646\u0632\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 NEXUS \u0639\u0644\u0649 \u0643\u0644 \u062C\u0647\u0627\u0632 \u062A\u0645\u062A\u0644\u0643\u0647",
    "mkt.hero.desc": "NEXUS \u0647\u0648 \u0646\u0638\u0627\u0645 \u062A\u0634\u063A\u064A\u0644 \u0634\u062E\u0635\u064A \u064A\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0642\u0627\u0645 \u0627\u0644\u0623\u0648\u0644 \u0648\u064A\u0648\u0644\u064A \u0627\u0647\u062A\u0645\u0627\u0645\u064B\u0627 \u0643\u0628\u064A\u0631\u064B\u0627 \u0628\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629. \u0642\u0645 \u0628\u062A\u062B\u0628\u064A\u062A \u062A\u0637\u0628\u064A\u0642 \u0633\u0637\u062D \u0627\u0644\u0645\u0643\u062A\u0628 \u0623\u0648 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0631\u0627\u0641\u0642 \u0644\u0644\u062C\u0648\u0627\u0644 \u0648\u062A\u062D\u0643\u0645 \u0641\u064A \u0643\u0644 \u0623\u062C\u0647\u0632\u062A\u0643 \u0645\u0646 \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F \u2014 100% \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632 \u0646\u0641\u0633\u0647. \u064A\u0645\u0643\u0646\u0643 \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0641\u0639\u0644\u064A\u060C \u0648\u0644\u064A\u0633 \u0645\u0646 \u0627\u0644\u0645\u062A\u0635\u0641\u062D.",
    "mkt.hero.actionPrimary": "\u0627\u0644\u062A\u0646\u0632\u064A\u0644 \u0644\u0640 {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "\u0634\u0627\u0647\u062F\u0647\u0627 \u0648\u0647\u064A \u062A\u0639\u0645\u0644",
    "mkt.hero.trust": "\u2605 \u0623\u0643\u062B\u0631 \u0645\u0646 500,000 \u0645\u0633\u062A\u062E\u062F\u0645 \xB7 \u0623\u0643\u062B\u0631 \u0645\u0646 2000 \u062C\u0647\u0627\u0632 \u0630\u0643\u064A \xB7 \u062E\u0635\u0648\u0635\u064A\u0629 \u0645\u062D\u0644\u064A\u0629 \u0628\u0646\u0633\u0628\u0629 100%",
    "mkt.stats.title": "NEXUS \u0628\u0627\u0644\u0623\u0631\u0642\u0627\u0645",
    "mkt.stats.users": "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0627\u0644\u0646\u0634\u0637\u0648\u0646",
    "mkt.stats.devices": "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629",
    "mkt.stats.privacy": "\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632",
    "mkt.stats.rating": "\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u062A\u0642\u064A\u064A\u0645",
    "mkt.privacy.title": "\u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0645\u0644\u0643\u0643",
    "mkt.privacy.processing": "\u0645\u0639\u0627\u0644\u062C\u0629 \u0628\u0646\u0633\u0628\u0629 100% \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632 \u0646\u0641\u0633\u0647",
    "mkt.privacy.encryption": "\u0627\u0644\u062A\u0634\u0641\u064A\u0631 \u0627\u0644\u0645\u062D\u0644\u064A \u0645\u0646 \u0637\u0631\u0641 \u0625\u0644\u0649 \u0637\u0631\u0641",
    "mkt.privacy.logging": "\u062A\u0633\u062C\u064A\u0644 \u0633\u062D\u0627\u0628\u064A \u0635\u0641\u0631",
    "mkt.how.title": "\u0643\u064A\u0641 \u064A\u0639\u0645\u0644",
    "mkt.how.step1.title": "\u062A\u0646\u0632\u064A\u0644",
    "mkt.how.step1.desc": "\u0642\u0645 \u0628\u062A\u0646\u0632\u064A\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0630\u064A \u062A\u0633\u062A\u062E\u062F\u0645\u0647.",
    "mkt.how.step2.title": "\u062A\u062B\u0628\u064A\u062A",
    "mkt.how.step2.desc": "\u0623\u0643\u0645\u0644 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u062D\u0644\u064A \u0641\u064A \u062B\u0648\u0627\u0646\u064D \u0645\u0639\u062F\u0648\u062F\u0629.",
    "mkt.how.step3.title": "\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0623\u062C\u0647\u0632\u0629",
    "mkt.how.step3.desc": "\u0627\u0628\u062F\u0623 \u0641\u064A \u0625\u062F\u0627\u0631\u0629 \u0645\u0646\u0632\u0644\u0643 \u0627\u0644\u0630\u0643\u064A \u0628\u0623\u0645\u0627\u0646.",
    "mkt.preview.title": "\u0634\u0627\u0647\u062F NEXUS \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0639\u0645\u0644",
    "mkt.preview.desc": "\u0646\u0638\u0631\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0638\u0647\u0631 \u0623\u0645\u0627\u0645\u0643 \u0641\u0648\u0631 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642.",
    "mkt.preview.tab.today": "\u0627\u0644\u064A\u0648\u0645",
    "mkt.preview.tab.devices": "\u0627\u0644\u0623\u062C\u0647\u0632\u0629",
    "mkt.preview.tab.skills": "\u0627\u0644\u0631\u0648\u062A\u064A\u0646\u0627\u062A",
    "mkt.preview.tab.family": "\u0627\u0644\u0623\u0633\u0631\u0629",
    "mkt.download.mobile.title": "\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629",
    "mkt.download.mobile.desc": "\u062A\u0637\u0628\u064A\u0642\u0627\u062A iOS \u0648Android \u0642\u064A\u062F \u0627\u0644\u0625\u0639\u062F\u0627\u062F.",
    "mkt.download.mobile.apple": "\u0627\u0644\u062A\u0646\u0632\u064A\u0644 \u0645\u0646",
    "mkt.download.mobile.appleStore": "\u0645\u062A\u062C\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
    "mkt.download.mobile.google": "\u0627\u062D\u0635\u0644 \u0639\u0644\u064A\u0647 \u0627\u0644\u0622\u0646",
    "mkt.download.mobile.googlePlay": "\u062C\u0648\u062C\u0644 \u0628\u0644\u0627\u064A",
    "mkt.download.mobile.soon": "\u0642\u0631\u064A\u0628\u064B\u0627",
    "mkt.seo.title": "NEXUS \u2014 \u0642\u0645 \u0628\u062A\u0646\u0632\u064A\u0644 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643",
    "mkt.seo.desc": "\u0642\u0645 \u0628\u062A\u0646\u0632\u064A\u0644 NEXUS \u0644\u0646\u0638\u0627\u0645\u064A \u0627\u0644\u062A\u0634\u063A\u064A\u0644 Windows \u0648macOS \u0648Linux. \u0633\u062A\u062A\u0648\u0641\u0631 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0646\u0638\u0627\u0645\u064A iOS \u0648Android \u0642\u0631\u064A\u0628\u064B\u0627.",
    "mkt.skipToContent": "\u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649",
    "mkt.pricing.title": "\u0623\u0633\u0639\u0627\u0631 \u0628\u0633\u064A\u0637\u0629 \u0648\u0634\u0641\u0627\u0641\u0629",
    "mkt.pricing.free": "\u0645\u062C\u0627\u0646\u064A",
    "mkt.pricing.freeDesc": "\u0643\u0644 \u0645\u0627 \u062A\u062D\u062A\u0627\u062C\u0647 \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u0646\u0632\u0644 \u0630\u0643\u064A \u0645\u062D\u0644\u064A.",
    "mkt.pricing.premium": "\u0641\u0626\u0629 \u0628\u0631\u064A\u0645\u064A\u0648\u0645",
    "mkt.pricing.premiumDesc": "\u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u062A\u0642\u062F\u0645\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0639\u0646 \u0628\u064F\u0639\u062F.",
    "mkt.pricing.family": "\u0627\u0644\u0623\u0633\u0631\u0629",
    "mkt.pricing.familyDesc": "\u0645\u0627 \u064A\u0635\u0644 \u0625\u0644\u0649 5 \u062D\u0633\u0627\u0628\u0627\u062A \u0645\u0639 \u062A\u062D\u0643\u0645 \u0643\u0627\u0645\u0644 \u0641\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A.",
    "mkt.pricing.cta": "\u0627\u0628\u062F\u0623 \u0645\u062C\u0627\u0646\u064B\u0627",
    "mkt.testimonials.title": "\u0645\u062D\u0628\u0648\u0628 \u0645\u0646 \u0642\u0628\u0644 \u0639\u0634\u0627\u0642 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0630\u0643\u064A\u0629",
    "mkt.testimonials.quote1": "\u0644\u0642\u062F \u063A\u064A\u0651\u0631\u062A NEXUS \u0637\u0631\u064A\u0642\u0629 \u062A\u0641\u0627\u0639\u0644\u064A \u0645\u0639 \u0645\u0646\u0632\u0644\u064A \u062A\u0645\u0627\u0645\u064B\u0627. \u0641\u0648\u062C\u0648\u062F \u0643\u0644 \u0634\u064A\u0621 \u0645\u062D\u0644\u064A\u064B\u0651\u0627 \u064A\u062C\u0639\u0644 \u0627\u0644\u0623\u0645\u0648\u0631 \u0623\u0633\u0631\u0639 \u0628\u0643\u062B\u064A\u0631.",
    "mkt.testimonials.author1": "\u0633\u0627\u0631\u0629 \u062C\u064A\u0646\u0643\u064A\u0646\u0632",
    "mkt.testimonials.role1": "\u0645\u0646 \u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646",
    "mkt.testimonials.quote2": "\u0623\u062E\u064A\u0631\u064B\u0627\u060C \u062C\u0647\u0627\u0632 \u062A\u062D\u0643\u0645 \u0645\u0646\u0632\u0644\u064A \u0630\u0643\u064A \u064A\u062D\u062A\u0631\u0645 \u062E\u0635\u0648\u0635\u064A\u062A\u064A. \u0648\u062A\u062A\u0645\u064A\u0632 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0628\u0633\u0631\u0639\u0629 \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0645\u0630\u0647\u0644\u0629.",
    "mkt.testimonials.author2": "\u062F\u064A\u0641\u064A\u062F \u062A\u0634\u064A\u0646",
    "mkt.testimonials.role2": "\u0645\u0647\u0646\u062F\u0633 \u0628\u0631\u0645\u062C\u064A\u0627\u062A",
    "mkt.testimonials.quote3": "\u064A\u064F\u0639\u062F \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0631\u0648\u062A\u064A\u0646\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0623\u0645\u0631\u0627\u064B \u0641\u064A \u063A\u0627\u064A\u0629 \u0627\u0644\u0633\u0647\u0648\u0644\u0629. \u0648\u0623\u062D\u0628 \u0623\u0646\u0647 \u0644\u0627 \u064A\u062A\u0639\u0637\u0644 \u0639\u0646\u062F\u0645\u0627 \u064A\u0646\u0642\u0637\u0639 \u0627\u062A\u0635\u0627\u0644\u064A \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A.",
    "mkt.testimonials.author3": "\u0625\u064A\u0645\u0627 \u0637\u0648\u0645\u0633\u0648\u0646",
    "mkt.testimonials.role3": "\u0639\u0634\u0627\u0642 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0630\u0643\u064A\u0629",
    "mkt.integrations.title": "\u064A\u0639\u0645\u0644 \u0645\u0639 \u0623\u062C\u0647\u0632\u062A\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629",
    "mkt.changelog.title": "\u0645\u0627 \u0627\u0644\u062C\u062F\u064A\u062F \u0641\u064A \u0627\u0644\u0625\u0635\u062F\u0627\u0631 3.14.2",
    "mkt.requirements.title": "\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645",
    "mkt.requirements.desc": "\u064A\u062A\u0637\u0644\u0628 \u0646\u0638\u0627\u0645 \u062A\u0634\u063A\u064A\u0644 64 \u0628\u062A \u0648\u0630\u0627\u0643\u0631\u0629 \u0648\u0635\u0648\u0644 \u0639\u0634\u0648\u0627\u0626\u064A (RAM) \u0628\u0633\u0639\u0629 2 \u062C\u064A\u062C\u0627\u0628\u0627\u064A\u062A \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.",
    "mkt.footer.desc": "\u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0646\u0632\u0644\u064A \u0627\u0644\u0634\u062E\u0635\u064A \u0627\u0644\u0630\u064A \u064A\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0627\u0644\u0635\u0648\u062A \u0641\u064A \u0627\u0644\u0645\u0642\u0627\u0645 \u0627\u0644\u0623\u0648\u0644. \u0645\u062D\u0644\u064A \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u060C \u0648\u0645\u062E\u0635\u0635 \u0644\u0643 \u0648\u062D\u062F\u0643.",
    "mkt.footer.product": "\u0627\u0644\u0645\u0646\u062A\u062C",
    "mkt.footer.company": "\u0627\u0644\u0634\u0631\u0643\u0629 \u0648\u0627\u0644\u0634\u0624\u0648\u0646 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A\u0629",
    "mkt.footer.about": "\u0646\u0628\u0630\u0629 \u0639\u0646\u0627",
    "mkt.footer.privacy": "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629",
    "mkt.footer.terms": "\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u062F\u0645\u0629",
    "mkt.footer.noCookies": "\u0646\u062D\u0646 \u0644\u0627 \u0646\u0633\u062A\u062E\u062F\u0645 \u0623\u064A \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0631\u062A\u0628\u0627\u0637.",
    "mkt.cookie.title": "\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0648\u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637",
    "mkt.cookie.desc": "\u0646\u0633\u062A\u062E\u062F\u0645 \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u062A\u0642\u062F\u064A\u0645 \u062E\u062F\u0645\u0627\u062A\u0646\u0627. \u0648\u0628\u0645\u0648\u0627\u0635\u0644\u0629 \u062A\u0635\u0641\u062D \u0627\u0644\u0645\u0648\u0642\u0639\u060C \u0641\u0625\u0646\u0643 \u062A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0646\u0627 \u0644\u0647\u0630\u0647 \u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0636\u0631\u0648\u0631\u064A\u0629.",
    "mkt.cookie.accept": "\u0641\u0647\u0645\u062A",
    "mkt.cookie.decline": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
    "mkt.feat.why": "\u0644\u0645\u0627\u0630\u0627 NEXUS\u061F",
    "mkt.feat.1.title": "\u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0635\u0648\u062A\u064A \u0623\u0648\u0644\u0627\u064B",
    "mkt.feat.1.desc": "\u062A\u0641\u0627\u0639\u0644 \u0645\u0639 \u0645\u0646\u0632\u0644\u0643 \u0628\u0637\u0631\u064A\u0642\u0629 \u0637\u0628\u064A\u0639\u064A\u0629.",
    "mkt.feat.2.title": "\u0645\u0635\u0645\u0645\u0629 \u0644\u062A\u0643\u0648\u0646 \u062E\u0627\u0635\u0629",
    "mkt.feat.2.desc": "\u0644\u0627 \u062A\u062E\u0632\u064A\u0646 \u0633\u062D\u0627\u0628\u064A\u060C \u0648\u0644\u0627 \u062A\u0633\u062C\u064A\u0644 \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u0627\u0644\u062A\u0634\u0641\u064A\u0631 \u0627\u0644\u0645\u062D\u0644\u064A \u0641\u0642\u0637.",
    "mkt.feat.3.title": "\u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0628\u064A\u0646\u064A",
    "mkt.feat.3.desc": "\u0623\u0643\u062B\u0631 \u0645\u0646 500 \u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 Matter \u0648Zigbee \u0648Z-Wave.",
    "mkt.feat.4.title": "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u063A\u064A\u0631 \u0627\u0644\u0645\u0631\u0626\u064A",
    "mkt.feat.4.desc": "\u064A\u0639\u0645\u0644 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629\u060C \u0648\u064A\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0631\u0648\u062A\u064A\u0646\u0643 \u0627\u0644\u064A\u0648\u0645\u064A.",
    "mkt.faq.title": "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629",
    "mkt.faq.1.q": "\u0647\u0644 \u062A\u0637\u0628\u064A\u0642 NEXUS \u0645\u062C\u0627\u0646\u064A \u062A\u0645\u0627\u0645\u064B\u0627\u061F",
    "mkt.faq.1.a": "\u0646\u0639\u0645. \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0648\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0645\u062A\u0627\u062D\u0629 \u0645\u062C\u0627\u0646\u064B\u0627 \u062A\u0645\u0627\u0645\u064B\u0627.",
    "mkt.faq.2.q": "\u0645\u0627 \u0647\u064A \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629\u061F",
    "mkt.faq.2.a": "\u0623\u062C\u0647\u0632\u0629 Matter \u0648Zigbee \u0648Z-Wave \u0648\u0623\u0643\u062B\u0631 \u0645\u0646 500 \u0646\u0638\u0627\u0645 \u0628\u064A\u0626\u064A \u0642\u0627\u0626\u0645 \u0639\u0644\u0649 \u0648\u0627\u062C\u0647\u0627\u062A \u0628\u0631\u0645\u062C\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A (API).",
    "mkt.faq.3.q": "\u0647\u0644 \u064A\u0639\u0645\u0644 \u062F\u0648\u0646 \u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0633\u062D\u0627\u0628\u0629\u061F",
    "mkt.faq.3.a": "\u0646\u0639\u0645. \u064A\u062A\u0635\u0644 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0628\u0623\u062C\u0647\u0632\u062A\u0643 \u0639\u0628\u0631 \u0627\u0644\u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629\u060C \u0648\u064A\u0633\u062A\u0645\u0631 \u0641\u064A \u0627\u0644\u0639\u0645\u0644 \u062D\u062A\u0649 \u0641\u064A \u062D\u0627\u0644\u0629 \u0627\u0646\u0642\u0637\u0627\u0639 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A.",
    "mkt.faq.4.q": "\u0643\u064A\u0641 \u064A\u062A\u0645 \u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0639\u0646 \u0628\u064F\u0639\u062F\u061F",
    "mkt.faq.4.a": "\u0639\u0628\u0631 \u0646\u0641\u0642 \u0622\u0645\u0646 \u0645\u0634\u0641\u0631 \u0645\u0646 \u0637\u0631\u0641 \u0625\u0644\u0649 \u0637\u0631\u0641 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0627\u0642\u0629 \xAB\u0628\u0631\u064A\u0645\u064A\u0648\u0645\xBB \u0623\u0648 \u0634\u0628\u0643\u0629 VPN \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643.",
    "mkt.desktop.eyebrow": "\u0633\u0637\u062D \u0627\u0644\u0645\u0643\u062A\u0628",
    "mkt.desktop.title": "\u062A\u0637\u0628\u064A\u0642 \u0648\u0627\u062D\u062F \u0644\u0643\u0644 \u0633\u0637\u062D \u0645\u0643\u062A\u0628",
    "mkt.desktop.desc": "\u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 Windows \u0648macOS \u0648Linux \u2014 \u062A\u0645 \u062A\u0643\u064A\u064A\u0641 \u0643\u0644 \u0645\u0646\u0647\u0627 \u062E\u0635\u064A\u0635\u064B\u0627 \u0645\u0639 \u0645\u0646\u0635\u062A\u0647.",
    "mkt.desktop.windows": "\u0648\u064A\u0646\u062F\u0648\u0632",
    "mkt.desktop.windowsDesc": "\u062A\u0645 \u062A\u062D\u0633\u064A\u0646\u0647 \u0644\u064A\u0639\u0645\u0644 \u0639\u0644\u0649 \u0646\u0638\u0627\u0645\u064A \u0627\u0644\u062A\u0634\u063A\u064A\u0644 Windows 10 \u064811 \u0645\u0639 \u062A\u0634\u063A\u064A\u0644 \u0633\u0644\u0633 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u0635\u064F\u0645\u0645 \u062E\u0635\u064A\u0635\u064B\u0627 \u0644\u0645\u0639\u0627\u0644\u062C\u0627\u062A Apple Silicon \u0648Intel \u0645\u0639 \u062A\u0643\u0627\u0645\u0644 \u0639\u0645\u064A\u0642 \u0645\u0639 \u0627\u0644\u0646\u0638\u0627\u0645.",
    "mkt.desktop.linux": "\u0644\u064A\u0646\u0643\u0633",
    "mkt.desktop.linuxDesc": "\u062E\u0641\u064A\u0641 \u0627\u0644\u0648\u0632\u0646 \u0648\u0633\u0631\u064A\u0639 \u0648\u0645\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u062C\u0645\u064A\u0639 \u0627\u0644\u062A\u0648\u0632\u064A\u0639\u0627\u062A \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629.",
    "mkt.desktop.download": "\u062A\u0646\u0632\u064A\u0644",
    "mkt.mobile.eyebrow": "\u0627\u0644\u062C\u0648\u0627\u0644",
    "mkt.mobile.title": "\u0645\u0646\u0632\u0644\u0643 \u0641\u064A \u062C\u064A\u0628\u0643",
    "mkt.mobile.desc": "\u064A\u062A\u064A\u062D \u0644\u0643 \u062A\u0637\u0628\u064A\u0642 NEXUS \u0627\u0644\u0645\u0631\u0627\u0641\u0642 \u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0645\u062A\u0646\u0627\u0648\u0644 \u064A\u062F\u0643 \u2014 \u0623\u064A\u0646\u0645\u0627 \u0643\u0646\u062A.",
    "mkt.mobile.feat1.title": "\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0646\u0642\u0644",
    "mkt.mobile.feat1.desc": "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0645\u0646\u0632\u0644\u0643 \u0645\u0646 \u0623\u064A \u0645\u0643\u0627\u0646 \u0628\u0641\u0636\u0644 \u0645\u064A\u0632\u0629 \u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0643\u0644\u0627\u0645 \u0627\u0644\u0645\u062F\u0645\u062C\u0629 \u0641\u064A \u0627\u0644\u062C\u0647\u0627\u0632.",
    "mkt.mobile.feat2.title": "\u0627\u0644\u0648\u0635\u0648\u0644 \u0639\u0646 \u0628\u064F\u0639\u062F",
    "mkt.mobile.feat2.desc": "\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0623\u0645\u0627\u0646 \u0625\u0644\u0649 \u0634\u0628\u0643\u062A\u0643 \u0627\u0644\u0645\u0646\u0632\u0644\u064A\u0629 \u0639\u0628\u0631 \u0646\u0641\u0642 \u0645\u0634\u0641\u0631.",
    "mkt.mobile.feat3.title": "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0648\u0631\u064A\u0629",
    "mkt.mobile.feat3.desc": "\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0641\u0648\u0631\u064A\u0629 \u0628\u0634\u0623\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u062A\u064A \u062A\u0647\u0645\u0643.",
    "mkt.mobile.feat4.title": "\u0642\u0641\u0644 \u0628\u064A\u0648\u0645\u062A\u0631\u064A",
    "mkt.mobile.feat4.desc": "\u062A\u0636\u0645\u0646 \u0645\u064A\u0632\u062A\u0627 \xABFace ID\xBB \u0648\xAB\u0628\u0635\u0645\u0629 \u0627\u0644\u0625\u0635\u0628\u0639\xBB \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u062E\u0635\u0648\u0635\u064A\u0629 \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0645\u0646\u0632\u0644\u0643.",
    "mkt.cta.title": "\u0645\u0646\u0632\u0644\u0643\u060C \u0642\u0648\u0627\u0639\u062F\u0643.",
    "mkt.cta.desc": "\u0642\u0645 \u0628\u062A\u0646\u0632\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 NEXUS \u0648\u062A\u062D\u0643\u0645 \u0641\u064A \u062C\u0645\u064A\u0639 \u0623\u062C\u0647\u0632\u062A\u0643 \u0645\u0646 \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F.",
    "mkt.cta.button": "\u062A\u0646\u0632\u064A\u0644 \u0645\u062C\u0627\u0646\u064A",
    "mkt.footer.platforms": "\u0627\u0644\u0645\u0646\u0635\u0627\u062A",
    "Dim living room lights": "\u0623\u0636\u0648\u0627\u0621 \u063A\u0631\u0641\u0629 \u0627\u0644\u0645\u0639\u064A\u0634\u0629 \u0627\u0644\u062E\u0627\u0641\u062A\u0629",
    "Start morning news briefing": "\u0628\u062F\u0621 \u0627\u0644\u0625\u062D\u0627\u0637\u0629 \u0627\u0644\u0625\u062E\u0628\u0627\u0631\u064A\u0629 \u0627\u0644\u0635\u0628\u0627\u062D\u064A\u0629",
    "Movie night": "\u0644\u064A\u0644\u0629 \u0627\u0644\u0623\u0641\u0644\u0627\u0645",
    "Good morning": "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631",
    "Leaving home": "\u0645\u063A\u0627\u062F\u0631\u0629 \u0627\u0644\u0645\u0646\u0632\u0644",
    "status.pctOnline": "{pct}% \u0645\u062A\u0635\u0644",
    "status.offlineCount": "{count} \u0641\u064A \u0648\u0636\u0639 \u0639\u062F\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644",
    "status.allOnline": "\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0645\u062A\u0635\u0644\u0629 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
    "status.suggestionReady": "\u0627\u0642\u062A\u0631\u0627\u062D {count} \u062C\u0627\u0647\u0632 \u0644\u0643.",
    "status.suggestionsReady": "\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A {count} \u062C\u0627\u0647\u0632\u0629 \u0644\u0643\u0645.",
    "status.caughtUp": "\u0644\u0642\u062F \u0623\u0635\u0628\u062D\u062A \u0639\u0644\u0649 \u0627\u0637\u0644\u0627\u0639 \u062A\u0627\u0645 \u0628\u0645\u0627 \u062D\u062F\u062B.",
    "status.onlineOfTotal": "{online}/{total} \u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
    "mobile.menu": "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
    "mobile.more": "\u0627\u0644\u0645\u0632\u064A\u062F",
    "mobile.systemStatus": "\u062D\u0627\u0644\u0629 \u0646\u0638\u0627\u0645 NEXUS",
    "mobile.localNetwork": "\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629",
    "mobile.offline": "100% \u062F\u0648\u0646 \u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
    "mobile.localAI": "\u0645\u062D\u0631\u0643 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u062D\u0644\u064A",
    "mobile.deviceNetwork": "\u0634\u0628\u0643\u0629 \u0627\u0644\u0623\u062C\u0647\u0632\u0629",
    "mobile.online": "\u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
    "mobile.quickControls": "\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0633\u0631\u064A\u0639\u0629",
    "mobile.privacyShield": "\u062F\u0631\u0639 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0641\u064A \u0648\u0636\u0639 \u0639\u062F\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644",
    "mobile.active": "\u0646\u0634\u0637",
    "mobile.voiceWake": '\u062A\u0646\u0634\u064A\u0637 \u0627\u0644\u0635\u0648\u062A ("NEXUS")',
    "mobile.on": "\u0641\u064A",
    "mobile.autoBackup": "\u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    "mobile.backupTime": "\u064A\u0648\u0645\u064A\u064B\u0627 \u0627\u0644\u0633\u0627\u0639\u0629 03:00",
    "mobile.moreSub.suggestions": "3 \u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0645\u062C\u062F\u0648\u0644\u0629 \u0644\u0644\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0630\u0643\u064A\u0629",
    "mobile.moreSub.skills": "5 \u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0633\u064A\u0646\u0627\u0631\u064A\u0648\u0647\u0627\u062A \u062A\u0639\u0644\u0645\u062A\u064F\u0647\u0627 \u0641\u064A \u0627\u0644\u0635\u064A\u063A\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629",
    "mobile.moreSub.personalization": "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u0627\u0639\u062F\u060C \u0648\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0635\u0648\u062A\u060C \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629",
    "mobile.moreSub.billing": "\u0628\u0627\u0642\u0629 NEXUS \u0627\u0644\u0639\u0627\u0626\u0644\u064A\u0629 \xB7 \u0627\u0634\u062A\u0631\u0627\u0643 \u0633\u0627\u0631\u064A \u0627\u0644\u0645\u0641\u0639\u0648\u0644",
    "mobile.moreSub.downloads": "3 \u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0644\u0645\u0646\u0635\u0627\u062A \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0648\u0627\u0644\u062A\u062D\u0642\u0642 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0629 SHA-256",
    "mobile.moreSub.platform": "\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0628\u064A\u0646 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0639\u0628\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u062E\u062A\u0644\u0641\u0629",
    "mobile.moreSub.agents": "\u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0648\u0646",
    "mobile.moreSub.admin": "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0645\u0642\u0627\u064A\u064A\u0633",
    "desktop.title": "\u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0634\u062E\u0635\u064A",
    "setup.welcome": "\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643\u0645",
    "setup.license": "\u0627\u0644\u062A\u0631\u062E\u064A\u0635",
    "setup.location": "\u0627\u0644\u0645\u0648\u0642\u0639",
    "setup.installing": "\u0627\u0644\u062A\u062B\u0628\u064A\u062A",
    "setup.finish": "\u0627\u0644\u0646\u0647\u0627\u064A\u0629",
    "setup.welcomeTitle": "\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643\u0645 \u0641\u064A \u0625\u0639\u062F\u0627\u062F NEXUS",
    "setup.welcomeDesc": "\u0633\u064A\u0631\u0634\u062F\u0643 \u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0627\u0644\u062C \u062E\u0644\u0627\u0644 \u0639\u0645\u0644\u064A\u0629 \u062A\u062B\u0628\u064A\u062A NEXUS AI \u2014 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0634\u062E\u0635\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0644\u0644\u0645\u0646\u0632\u0644.",
    "setup.accept": "\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0627\u0644\u062A\u0631\u062E\u064A\u0635",
    "setup.chooseFolder": "\u0627\u062E\u062A\u0631 \u0645\u062C\u0644\u062F \u0627\u0644\u062A\u062B\u0628\u064A\u062A",
    "setup.installBtn": "\u062A\u062B\u0628\u064A\u062A",
    "setup.complete": "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F",
    "setup.launchNow": "\u0642\u0645 \u0628\u062A\u0634\u063A\u064A\u0644 NEXUS \u0627\u0644\u0622\u0646"
  },
  // ── Hebrew (RTL) ──
  he: {
    "app.greeting": "\u05D4\u05D9\u05D9 {name}, \u05D1\u05DE\u05D4 \u05D0\u05D5\u05DB\u05DC \u05DC\u05E2\u05D6\u05D5\u05E8?",
    "app.confirmNeeded": "{name}, \u05D4\u05E4\u05E2\u05D5\u05DC\u05D4 \u05D4\u05D6\u05D5 \u05D3\u05D5\u05E8\u05E9\u05EA \u05D0\u05EA \u05D0\u05D9\u05E9\u05D5\u05E8\u05DA.",
    "download.title": "\u05D4\u05D5\u05E8\u05D3 \u05D0\u05EA NEXUS",
    "download.primaryButton": "\u05D4\u05D5\u05E8\u05D3\u05D4 \u05E2\u05D1\u05D5\u05E8 {os}",
    "download.otherOs": "\u05D4\u05D0\u05DD \u05D0\u05EA\u05D4 \u05DE\u05E9\u05EA\u05DE\u05E9 \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05D0\u05D7\u05E8\u05EA?",
    "download.checksum": "\u05D1\u05D3\u05D9\u05E7\u05EA \u05E1\u05D9\u05DB\u05D5\u05DD SHA-256",
    "screen.today": "\u05D4\u05D9\u05D5\u05DD",
    "screen.homeState": "\u05D3\u05E3 \u05D4\u05D1\u05D9\u05EA",
    "screen.suggestions": "\u05D4\u05E6\u05E2\u05D5\u05EA",
    "screen.skills": "\u05DE\u05D9\u05D5\u05DE\u05E0\u05D5\u05D9\u05D5\u05EA",
    "screen.family": "\u05DE\u05E9\u05E4\u05D7\u05D4",
    "screen.devices": "\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD",
    "screen.platform": "\u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D5\u05EA",
    "screen.agents": "\u05E1\u05D5\u05DB\u05E0\u05D9\u05DD",
    "screen.personalization": "\u05D4\u05EA\u05D0\u05DE\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA",
    "screen.billing": "\u05DE\u05E0\u05D5\u05D9",
    "screen.downloadCenter": "\u05D4\u05D5\u05E8\u05D3\u05D4",
    "screen.adminDashboard": "\u05DC\u05D5\u05D7 \u05D4\u05D1\u05E7\u05E8\u05D4 \u05E9\u05DC \u05D4\u05DE\u05E0\u05D4\u05DC",
    "today.devicesOnline": "\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05DE\u05D7\u05D5\u05D1\u05E8\u05D9\u05DD \u05DC\u05E8\u05E9\u05EA",
    "today.energy": "\u05D0\u05E0\u05E8\u05D2\u05D9\u05D4 \u05DB\u05D9\u05D5\u05DD",
    "today.activeRoutines": "\u05EA\u05DB\u05E0\u05D9\u05D5\u05EA \u05D0\u05D9\u05DE\u05D5\u05DF \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA",
    "today.suggestions": "\u05D4\u05E6\u05E2\u05D5\u05EA",
    "screen.devices.empty": "\u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05DE\u05D7\u05D5\u05D1\u05E8\u05D9\u05DD \u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD.",
    "screen.agents.empty": "\u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05D4\u05D5\u05D2\u05D3\u05E8\u05D5 \u05E1\u05D5\u05DB\u05E0\u05D9\u05DD.",
    "screen.suggestions.empty": "\u05E2\u05D3\u05D9\u05D9\u05DF \u05D0\u05D9\u05DF \u05D4\u05E6\u05E2\u05D5\u05EA \u2014 NEXUS AI \u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D5\u05DE\u05D3\u05EA.",
    "screen.skills.empty": "\u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05E0\u05E8\u05DB\u05E9\u05D5 \u05DB\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD.",
    "screen.homeState.empty": "\u05E2\u05D3\u05D9\u05D9\u05DF \u05D0\u05D9\u05DF \u05D7\u05D3\u05E8\u05D9\u05DD \u05E2\u05DD \u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD.",
    "plan.free": "\u05D7\u05D9\u05E0\u05DD",
    "plan.premium": "\u05E4\u05E8\u05D9\u05DE\u05D9\u05D5\u05DD",
    "plan.family": "\u05DE\u05E9\u05E4\u05D7\u05D4",
    "billing.manage": "\u05E0\u05D9\u05D4\u05D5\u05DC \u05DE\u05E0\u05D5\u05D9",
    "auth.tagline": "\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D4\u05E4\u05E2\u05DC\u05D4 \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC\u05DA \u05DC\u05D1\u05D9\u05EA",
    "auth.signInTitle": "\u05D4\u05EA\u05D7\u05D1\u05E8 \u05DC-NEXUS",
    "auth.signUpTitle": "\u05D4\u05E7\u05D9\u05DE\u05D5 \u05D0\u05EA \u05D7\u05E9\u05D1\u05D5\u05DF \u05D4-NEXUS \u05E9\u05DC\u05DB\u05DD",
    "auth.email": '\u05D3\u05D5\u05D0"\u05DC',
    "auth.password": "\u05E1\u05D9\u05E1\u05DE\u05D4",
    "auth.signInButton": "\u05D4\u05EA\u05D7\u05D1\u05E8",
    "auth.signUpButton": "\u05D4\u05D9\u05E8\u05E9\u05DD",
    "auth.switchToSignUp": "\u05D7\u05D3\u05E9 \u05DB\u05D0\u05DF? \u05E6\u05D5\u05E8 \u05D7\u05E9\u05D1\u05D5\u05DF",
    "auth.switchToSignIn": "\u05DB\u05D1\u05E8 \u05D9\u05E9 \u05DC\u05DA \u05D7\u05E9\u05D1\u05D5\u05DF? \u05D4\u05EA\u05D7\u05D1\u05E8",
    "auth.passwordHint": "\u05DC\u05E4\u05D7\u05D5\u05EA 8 \u05EA\u05D5\u05D5\u05D9\u05DD",
    "auth.genericError": "\u05D0\u05D9\u05E8\u05E2\u05D4 \u05EA\u05E7\u05DC\u05D4. \u05D0\u05E0\u05D0 \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.",
    "auth.locked": "\u05D9\u05D5\u05EA\u05E8 \u05DE\u05D3\u05D9 \u05E0\u05D9\u05E1\u05D9\u05D5\u05E0\u05D5\u05EA \u05DB\u05D5\u05E9\u05DC\u05D9\u05DD. \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1 \u05D1-{time}.",
    "auth.rateLimited": "\u05DE\u05E1\u05E4\u05E8 \u05D4\u05D1\u05E7\u05E9\u05D5\u05EA \u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9. \u05D0\u05E0\u05D0 \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1 \u05DE\u05D0\u05D5\u05D7\u05E8 \u05D9\u05D5\u05EA\u05E8.",
    "auth.logout": "\u05D4\u05EA\u05E0\u05EA\u05E7",
    "auth.welcome": "\u05D1\u05E8\u05D5\u05DA \u05D4\u05D1\u05D0, {name}",
    "auth.continue": "\u05D4\u05DE\u05E9\u05DA",
    "auth.guest": "\u05D4\u05DE\u05E9\u05DA \u05DB\u05D0\u05D5\u05E8\u05D7",
    "auth.guestHint": "\u05D2\u05DC\u05D5 \u05D0\u05EA NEXUS \u05DC\u05DC\u05D0 \u05D7\u05E9\u05D1\u05D5\u05DF",
    "auth.social.divider": '\u05D0\u05D5 \u05DC\u05D4\u05DE\u05E9\u05D9\u05DA \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D3\u05D5\u05D0"\u05DC',
    "auth.social.google": "\u05D4\u05DE\u05E9\u05DA \u05E2\u05DD Google",
    "auth.social.apple": "\u05D4\u05DE\u05E9\u05DA \u05E2\u05DD Apple",
    "auth.social.unavailable": "\u05E9\u05D9\u05D8\u05EA \u05D4\u05DB\u05E0\u05D9\u05E1\u05D4 \u05D4\u05D6\u05D5 \u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05D4\u05D5\u05D2\u05D3\u05E8\u05D4.",
    "auth.social.error": "\u05D4\u05DB\u05E0\u05D9\u05E1\u05D4 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05E1\u05E4\u05E7 \u05D6\u05D4 \u05E0\u05DB\u05E9\u05DC\u05D4. \u05D0\u05E0\u05D0 \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.",
    "mkt.nav.features": "\u05EA\u05DB\u05D5\u05E0\u05D5\u05EA",
    "mkt.nav.pricing": "\u05EA\u05DE\u05D7\u05D5\u05E8",
    "mkt.nav.testimonials": "\u05D4\u05DE\u05DC\u05E6\u05D5\u05EA",
    "mkt.nav.integrations": "\u05E9\u05D9\u05DC\u05D5\u05D1\u05D9\u05DD",
    "mkt.nav.about": "\u05D0\u05D5\u05D3\u05D5\u05EA\u05D9\u05E0\u05D5",
    "mkt.nav.download": "\u05D4\u05D5\u05E8\u05D3\u05D4",
    "mkt.nav.faq": "\u05E9\u05D0\u05DC\u05D5\u05EA \u05E0\u05E4\u05D5\u05E6\u05D5\u05EA",
    "mkt.nav.signIn": "\u05D4\u05EA\u05D7\u05D1\u05E8",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\u05D4\u05D5\u05E8\u05D3 \u05D0\u05EA NEXUS \u05DC\u05DB\u05DC \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05E9\u05D1\u05E8\u05E9\u05D5\u05EA\u05DA",
    "mkt.hero.desc": "NEXUS \u05D4\u05D9\u05D0 \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA \u05D4\u05DE\u05EA\u05DE\u05E7\u05D3\u05EA \u05D1\u05E7\u05D5\u05DC \u05D5\u05D1\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA. \u05D4\u05EA\u05E7\u05DF \u05D0\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05DC\u05E9\u05D5\u05DC\u05D7\u05DF \u05D4\u05E2\u05D1\u05D5\u05D3\u05D4 \u05D0\u05D5 \u05D0\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D4\u05E0\u05DC\u05D5\u05D5\u05D9\u05EA \u05DC\u05DE\u05D5\u05D1\u05D9\u05D9\u05DC \u05D5\u05E9\u05DC\u05D5\u05D8 \u05D1\u05DB\u05DC \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05DE\u05DE\u05E7\u05D5\u05DD \u05D0\u05D7\u05D3 \u2014 100% \u05E2\u05DC \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8 \u05E2\u05E6\u05DE\u05D5. \u05D0\u05EA\u05D4 \u05DE\u05E9\u05EA\u05DE\u05E9 \u05D1\u05D4 \u05D3\u05E8\u05DA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05E2\u05E6\u05DE\u05D4, \u05D5\u05DC\u05D0 \u05D3\u05E8\u05DA \u05D4\u05D3\u05E4\u05D3\u05E4\u05DF.",
    "mkt.hero.actionPrimary": "\u05D4\u05D5\u05E8\u05D3\u05D4 \u05E2\u05D1\u05D5\u05E8 {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "\u05E8\u05D0\u05D5 \u05D0\u05EA \u05D6\u05D4 \u05D1\u05E4\u05E2\u05D5\u05DC\u05D4",
    "mkt.hero.trust": "\u2605 \u05D9\u05D5\u05EA\u05E8 \u05DE-500,000 \u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \xB7 \u05D9\u05D5\u05EA\u05E8 \u05DE-2,000 \u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05D7\u05DB\u05DE\u05D9\u05DD \xB7 \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05DE\u05E7\u05D5\u05DE\u05D9\u05EA \u05D1\u05DE\u05D0\u05D4 \u05D0\u05D7\u05D5\u05D6\u05D9\u05DD",
    "mkt.stats.title": "NEXUS \u05D1\u05DE\u05E1\u05E4\u05E8\u05D9\u05DD",
    "mkt.stats.users": "\u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD",
    "mkt.stats.devices": "\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05E0\u05EA\u05DE\u05DB\u05D9\u05DD",
    "mkt.stats.privacy": "\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D1\u05DE\u05DB\u05E9\u05D9\u05E8 \u05E2\u05E6\u05DE\u05D5",
    "mkt.stats.rating": "\u05D3\u05D9\u05E8\u05D5\u05D2 \u05DE\u05DE\u05D5\u05E6\u05E2",
    "mkt.privacy.title": "\u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E9\u05DC\u05DA \u05E9\u05D9\u05D9\u05DB\u05D9\u05DD \u05DC\u05DA",
    "mkt.privacy.processing": "\u05E2\u05D9\u05D1\u05D5\u05D3 \u05D1\u05DE\u05DB\u05E9\u05D9\u05E8 \u05D1-100%",
    "mkt.privacy.encryption": "\u05D4\u05E6\u05E4\u05E0\u05D4 \u05DE\u05E7\u05D5\u05DE\u05D9\u05EA \u05DE\u05E7\u05E6\u05D4 \u05DC\u05E7\u05E6\u05D4",
    "mkt.privacy.logging": "\u05E8\u05D9\u05E9\u05D5\u05DD \u05D0\u05E4\u05E1 \u05D1\u05E2\u05E0\u05DF",
    "mkt.how.title": "\u05D0\u05D9\u05DA \u05D6\u05D4 \u05E2\u05D5\u05D1\u05D3",
    "mkt.how.step1.title": "\u05D4\u05D5\u05E8\u05D3\u05D4",
    "mkt.how.step1.desc": "\u05D4\u05D5\u05E8\u05D3 \u05D0\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D4 \u05DC\u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D4 \u05E9\u05DC\u05DA.",
    "mkt.how.step2.title": "\u05D4\u05EA\u05E7\u05DF",
    "mkt.how.step2.desc": "\u05D4\u05E9\u05DC\u05D9\u05DD \u05D0\u05EA \u05D4\u05D4\u05EA\u05E7\u05E0\u05D4 \u05D4\u05DE\u05E7\u05D5\u05DE\u05D9\u05EA \u05EA\u05D5\u05DA \u05E9\u05E0\u05D9\u05D5\u05EA \u05E1\u05E4\u05D5\u05E8\u05D5\u05EA.",
    "mkt.how.step3.title": "\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD",
    "mkt.how.step3.desc": "\u05D4\u05EA\u05D7\u05DC \u05DC\u05E0\u05D4\u05DC \u05D0\u05EA \u05D4\u05D1\u05D9\u05EA \u05D4\u05D7\u05DB\u05DD \u05E9\u05DC\u05DA \u05D1\u05E6\u05D5\u05E8\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA.",
    "mkt.preview.title": "\u05E6\u05E4\u05D5 \u05D1-NEXUS \u05D1\u05E4\u05E2\u05D5\u05DC\u05D4",
    "mkt.preview.desc": "\u05DE\u05D1\u05D8 \u05D7\u05D9 \u05E2\u05DC \u05DC\u05D5\u05D7 \u05D4\u05DE\u05D7\u05D5\u05D5\u05E0\u05D9\u05DD \u05D4\u05D0\u05DE\u05D9\u05EA\u05D9 \u05E9\u05DE\u05D5\u05E4\u05D9\u05E2 \u05D1\u05E8\u05D2\u05E2 \u05D4\u05EA\u05E7\u05E0\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4.",
    "mkt.preview.tab.today": "\u05D4\u05D9\u05D5\u05DD",
    "mkt.preview.tab.devices": "\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD",
    "mkt.preview.tab.skills": "\u05E9\u05D2\u05E8\u05D5\u05EA",
    "mkt.preview.tab.family": "\u05DE\u05E9\u05E4\u05D7\u05D4",
    "mkt.download.mobile.title": "\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D5\u05EA \u05DC\u05E0\u05D9\u05D9\u05D3",
    "mkt.download.mobile.desc": "\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D5\u05EA \u05DC-iOS \u05D5\u05DC-Android \u05E0\u05DE\u05E6\u05D0\u05D5\u05EA \u05D1\u05E4\u05D9\u05EA\u05D5\u05D7.",
    "mkt.download.mobile.apple": "\u05D4\u05D5\u05E8\u05D3 \u05D1-",
    "mkt.download.mobile.appleStore": "\u05D7\u05E0\u05D5\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D5\u05EA",
    "mkt.download.mobile.google": "\u05EA\u05EA\u05D7\u05D9\u05DC\u05D5",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\u05D1\u05E7\u05E8\u05D5\u05D1",
    "mkt.seo.title": "NEXUS \u2014 \u05D4\u05D5\u05E8\u05D3 \u05D0\u05EA \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D4\u05E4\u05E2\u05DC\u05D4 \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC\u05DA",
    "mkt.seo.desc": "\u05D4\u05D5\u05E8\u05D3 \u05D0\u05EA NEXUS \u05E2\u05D1\u05D5\u05E8 Windows, macOS \u05D5-Linux. \u05D2\u05E8\u05E1\u05D0\u05D5\u05EA \u05DC-iOS \u05D5\u05DC-Android \u05D9\u05D5\u05E9\u05E7\u05D5 \u05D1\u05E7\u05E8\u05D5\u05D1.",
    "mkt.skipToContent": "\u05D3\u05DC\u05D2 \u05DC\u05EA\u05D5\u05DB\u05DF",
    "mkt.pricing.title": "\u05EA\u05DE\u05D7\u05D5\u05E8 \u05E4\u05E9\u05D5\u05D8 \u05D5\u05E9\u05E7\u05D5\u05E3",
    "mkt.pricing.free": "\u05D7\u05D9\u05E0\u05DD",
    "mkt.pricing.freeDesc": "\u05DB\u05DC \u05DE\u05D4 \u05E9\u05D0\u05EA\u05DD \u05E6\u05E8\u05D9\u05DB\u05D9\u05DD \u05DC\u05D1\u05D9\u05EA \u05D7\u05DB\u05DD \u05DE\u05E7\u05D5\u05DE\u05D9.",
    "mkt.pricing.premium": "\u05E4\u05E8\u05D9\u05DE\u05D9\u05D5\u05DD",
    "mkt.pricing.premiumDesc": "\u05E2\u05D9\u05D1\u05D5\u05D3 \u05DE\u05EA\u05E7\u05D3\u05DD \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA \u05D5\u05D2\u05D9\u05E9\u05D4 \u05DE\u05E8\u05D7\u05D5\u05E7.",
    "mkt.pricing.family": "\u05DE\u05E9\u05E4\u05D7\u05D4",
    "mkt.pricing.familyDesc": "\u05E2\u05D3 5 \u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05E2\u05DD \u05D1\u05E7\u05E8\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DE\u05DC\u05D0\u05D4.",
    "mkt.pricing.cta": "\u05D4\u05EA\u05D7\u05DC \u05D1\u05D7\u05D9\u05E0\u05DD",
    "mkt.testimonials.title": "\u05D0\u05D4\u05D5\u05D1 \u05E2\u05DC \u05D7\u05D5\u05D1\u05D1\u05D9 \u05D4\u05D1\u05D9\u05EA \u05D4\u05D7\u05DB\u05DD",
    "mkt.testimonials.quote1": "NEXUS \u05E9\u05D9\u05E0\u05D4 \u05DC\u05D7\u05DC\u05D5\u05D8\u05D9\u05DF \u05D0\u05EA \u05D4\u05D0\u05D5\u05E4\u05DF \u05E9\u05D1\u05D5 \u05D0\u05E0\u05D9 \u05DE\u05EA\u05E7\u05E9\u05E8 \u05E2\u05DD \u05D4\u05D1\u05D9\u05EA \u05E9\u05DC\u05D9. \u05D4\u05E2\u05D5\u05D1\u05D3\u05D4 \u05E9\u05D4\u05DB\u05DC \u05E0\u05DE\u05E6\u05D0 \u05D1\u05DE\u05E7\u05D5\u05DD \u05D0\u05D7\u05D3 \u05E4\u05E9\u05D5\u05D8 \u05D4\u05D5\u05E4\u05DB\u05EA \u05D0\u05EA \u05D4\u05DB\u05DC \u05DC\u05DE\u05D4\u05D9\u05E8 \u05D4\u05E8\u05D1\u05D4 \u05D9\u05D5\u05EA\u05E8.",
    "mkt.testimonials.author1": "\u05E9\u05E8\u05D4 \u05D2'\u05E0\u05E7\u05D9\u05E0\u05E1",
    "mkt.testimonials.role1": "\u05DE\u05D0\u05DE\u05E5 \u05DE\u05D5\u05E7\u05D3\u05DD",
    "mkt.testimonials.quote2": "\u05E1\u05D5\u05E3 \u05E1\u05D5\u05E3, \u05DE\u05E8\u05DB\u05D6 \u05D1\u05D9\u05EA \u05D7\u05DB\u05DD \u05E9\u05DE\u05DB\u05D1\u05D3 \u05D0\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05E9\u05DC\u05D9. \u05E2\u05D9\u05D1\u05D5\u05D3 \u05D4-AI \u05D4\u05DE\u05E7\u05D5\u05DE\u05D9 \u05DE\u05D4\u05D9\u05E8 \u05DC\u05D4\u05E4\u05DC\u05D9\u05D0.",
    "mkt.testimonials.author2": "\u05D3\u05D9\u05D9\u05D5\u05D9\u05D3 \u05E6'\u05DF",
    "mkt.testimonials.role2": "\u05DE\u05D4\u05E0\u05D3\u05E1 \u05EA\u05D5\u05DB\u05E0\u05D4",
    "mkt.testimonials.quote3": "\u05D4\u05D2\u05D3\u05E8\u05EA \u05E9\u05D2\u05E8\u05D5\u05EA \u05DE\u05D5\u05E8\u05DB\u05D1\u05D5\u05EA \u05D4\u05D9\u05D0 \u05DE\u05DE\u05E9 \u05E7\u05DC\u05D4. \u05D0\u05E0\u05D9 \u05D0\u05D5\u05D4\u05D1 \u05D0\u05EA \u05D6\u05D4 \u05E9\u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05DC\u05D0 \u05DE\u05E4\u05E1\u05D9\u05E7\u05D4 \u05DC\u05E2\u05D1\u05D5\u05D3 \u05D2\u05DD \u05DB\u05E9\u05D4\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8 \u05E9\u05DC\u05D9 \u05E0\u05D5\u05E4\u05DC.",
    "mkt.testimonials.author3": "\u05D0\u05DE\u05D4 \u05EA\u05D5\u05DE\u05E4\u05E1\u05D5\u05DF",
    "mkt.testimonials.role3": "\u05D7\u05D5\u05D1\u05D1 \u05D1\u05D9\u05EA \u05D7\u05DB\u05DD",
    "mkt.integrations.title": "\u05DE\u05EA\u05D0\u05D9\u05DD \u05DC\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05D4\u05DE\u05D5\u05E2\u05D3\u05E4\u05D9\u05DD \u05E2\u05DC\u05D9\u05DA",
    "mkt.changelog.title": "\u05DE\u05D4 \u05D7\u05D3\u05E9 \u05D1\u05D2\u05E8\u05E1\u05D4 3.14.2",
    "mkt.requirements.title": "\u05D3\u05E8\u05D9\u05E9\u05D5\u05EA \u05DE\u05E2\u05E8\u05DB\u05EA",
    "mkt.requirements.desc": "\u05E0\u05D3\u05E8\u05E9\u05EA \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05E9\u05DC 64 \u05E1\u05D9\u05D1\u05D9\u05D5\u05EA \u05D5\u05D6\u05D9\u05DB\u05E8\u05D5\u05DF RAM \u05E9\u05DC 2GB \u05DC\u05E4\u05D7\u05D5\u05EA.",
    "mkt.footer.desc": "\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D4\u05E4\u05E2\u05DC\u05D4 \u05D4\u05D1\u05D9\u05EA\u05D9\u05EA \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC\u05DB\u05DD, \u05E9\u05DE\u05D1\u05D5\u05E1\u05E1\u05EA \u05D1\u05E8\u05D0\u05E9 \u05D5\u05D1\u05E8\u05D0\u05E9\u05D5\u05E0\u05D4 \u05E2\u05DC \u05E4\u05E7\u05D5\u05D3\u05D5\u05EA \u05E7\u05D5\u05DC\u05D9\u05D5\u05EA. \u05DE\u05E7\u05D5\u05DE\u05D9\u05EA \u05DC\u05D7\u05DC\u05D5\u05D8\u05D9\u05DF, \u05E9\u05D9\u05D9\u05DB\u05EA \u05D0\u05DA \u05D5\u05E8\u05E7 \u05DC\u05DB\u05DD.",
    "mkt.footer.product": "\u05DE\u05D5\u05E6\u05E8",
    "mkt.footer.company": "\u05D4\u05D7\u05D1\u05E8\u05D4 \u05D5\u05D4\u05D4\u05D9\u05D1\u05D8\u05D9\u05DD \u05D4\u05DE\u05E9\u05E4\u05D8\u05D9\u05D9\u05DD",
    "mkt.footer.about": "\u05D0\u05D5\u05D3\u05D5\u05EA\u05D9\u05E0\u05D5",
    "mkt.footer.privacy": "\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA",
    "mkt.footer.terms": "\u05EA\u05E0\u05D0\u05D9 \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9",
    "mkt.footer.noCookies": "\u05D0\u05E0\u05D7\u05E0\u05D5 \u05DC\u05D0 \u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05D1\u05E2\u05D5\u05D2\u05D9\u05D5\u05EA \u05DB\u05DC\u05DC.",
    "mkt.cookie.title": "\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5\u05E2\u05D5\u05D2\u05D9\u05D5\u05EA",
    "mkt.cookie.desc": "\u05D0\u05E0\u05D5 \u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05D1\u05E2\u05D5\u05D2\u05D9\u05D5\u05EA \u05D7\u05D9\u05D5\u05E0\u05D9\u05D5\u05EA \u05DB\u05D3\u05D9 \u05DC\u05E1\u05E4\u05E7 \u05D0\u05EA \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA\u05D9\u05DD \u05E9\u05DC\u05E0\u05D5. \u05D1\u05D4\u05DE\u05E9\u05DA \u05D4\u05D2\u05DC\u05D9\u05E9\u05D4, \u05D0\u05EA\u05D4 \u05DE\u05E1\u05DB\u05D9\u05DD \u05DC\u05E9\u05D9\u05DE\u05D5\u05E9\u05E0\u05D5 \u05D1\u05D8\u05DB\u05E0\u05D5\u05DC\u05D5\u05D2\u05D9\u05D5\u05EA \u05D4\u05D7\u05D9\u05D5\u05E0\u05D9\u05D5\u05EA \u05D4\u05DC\u05DC\u05D5.",
    "mkt.cookie.accept": "\u05D4\u05D1\u05E0\u05EA\u05D9",
    "mkt.cookie.decline": "\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA",
    "mkt.feat.why": "\u05DC\u05DE\u05D4 NEXUS",
    "mkt.feat.1.title": "\u05E9\u05DC\u05D9\u05D8\u05D4 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05E7\u05D5\u05DC \u05D1\u05DC\u05D1\u05D3",
    "mkt.feat.1.desc": "\u05D4\u05EA\u05D7\u05D1\u05E8\u05D5 \u05DC\u05D1\u05D9\u05EA\u05DB\u05DD \u05D1\u05D0\u05D5\u05E4\u05DF \u05D8\u05D1\u05E2\u05D9.",
    "mkt.feat.2.title": "\u05E4\u05E8\u05D8\u05D9 \u05DE\u05E2\u05E6\u05DD \u05EA\u05DB\u05E0\u05D5\u05E0\u05D5",
    "mkt.feat.2.desc": "\u05DC\u05DC\u05D0 \u05E2\u05E0\u05DF, \u05DC\u05DC\u05D0 \u05E8\u05D9\u05E9\u05D5\u05DD. \u05D4\u05E6\u05E4\u05E0\u05D4 \u05DE\u05E7\u05D5\u05DE\u05D9\u05EA \u05D1\u05DC\u05D1\u05D3.",
    "mkt.feat.3.title": "\u05EA\u05D5\u05D0\u05DD",
    "mkt.feat.3.desc": "\u05D9\u05D5\u05EA\u05E8 \u05DE-500 \u05E4\u05E8\u05D5\u05D8\u05D5\u05E7\u05D5\u05DC\u05D9\u05DD, \u05DB\u05D5\u05DC\u05DC Matter, Zigbee \u05D5-Z-Wave.",
    "mkt.feat.4.title": "\u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA \u05D1\u05DC\u05EA\u05D9 \u05E0\u05E8\u05D0\u05D9\u05EA",
    "mkt.feat.4.desc": "\u05E4\u05D5\u05E2\u05DC \u05D1\u05E8\u05E7\u05E2 \u05D5\u05DC\u05D5\u05DE\u05D3 \u05D0\u05EA \u05E9\u05D2\u05E8\u05EA \u05D4\u05D9\u05D5\u05DE\u05D9\u05D5\u05DD \u05E9\u05DC\u05DA.",
    "mkt.faq.title": "\u05E9\u05D0\u05DC\u05D5\u05EA \u05E0\u05E4\u05D5\u05E6\u05D5\u05EA",
    "mkt.faq.1.q": "\u05D4\u05D0\u05DD NEXUS \u05D4\u05D5\u05D0 \u05E9\u05D9\u05E8\u05D5\u05EA \u05D7\u05D9\u05E0\u05DE\u05D9 \u05DC\u05D7\u05DC\u05D5\u05D8\u05D9\u05DF?",
    "mkt.faq.1.a": "\u05DB\u05DF. \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D4\u05E4\u05E2\u05DC\u05D4 \u05D4\u05D1\u05E1\u05D9\u05E1\u05D9\u05EA \u05D5\u05EA\u05DB\u05D5\u05E0\u05D5\u05EA \u05D4\u05E9\u05DC\u05D9\u05D8\u05D4 \u05D4\u05DE\u05E7\u05D5\u05DE\u05D9\u05D5\u05EA \u05E0\u05D9\u05EA\u05E0\u05D5\u05EA \u05DC\u05E9\u05D9\u05DE\u05D5\u05E9 \u05DC\u05DC\u05D0 \u05EA\u05E9\u05DC\u05D5\u05DD \u05DB\u05DC\u05DC.",
    "mkt.faq.2.q": "\u05D0\u05D9\u05DC\u05D5 \u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05E0\u05EA\u05DE\u05DB\u05D9\u05DD?",
    "mkt.faq.2.a": "\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05DE\u05E1\u05D5\u05D2 Matter, Zigbee \u05D5-Z-Wave, \u05D5\u05DB\u05DF \u05DC\u05DE\u05E2\u05DC\u05D4 \u05DE-500 \u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D0\u05E7\u05D5\u05DC\u05D5\u05D2\u05D9\u05D5\u05EA \u05D4\u05DE\u05D1\u05D5\u05E1\u05E1\u05D5\u05EA \u05E2\u05DC \u05DE\u05DE\u05E9\u05E7\u05D9 API.",
    "mkt.faq.3.q": "\u05D4\u05D0\u05DD \u05D6\u05D4 \u05E2\u05D5\u05D1\u05D3 \u05DC\u05DC\u05D0 \u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC\u05E2\u05E0\u05DF?",
    "mkt.faq.3.a": "\u05DB\u05DF. \u05D4\u05D5\u05D0 \u05DE\u05EA\u05E7\u05E9\u05E8 \u05E2\u05DD \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05E9\u05DC\u05DA \u05D3\u05E8\u05DA \u05D4\u05E8\u05E9\u05EA \u05D4\u05DE\u05E7\u05D5\u05DE\u05D9\u05EA, \u05D5\u05D4\u05D5\u05D0 \u05E4\u05D5\u05E2\u05DC \u05D2\u05DD \u05D0\u05DD \u05D7\u05D9\u05D1\u05D5\u05E8 \u05D4\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8 \u05DE\u05E0\u05D5\u05EA\u05E7.",
    "mkt.faq.4.q": "\u05DB\u05D9\u05E6\u05D3 \u05DE\u05EA\u05D1\u05E6\u05E2\u05EA \u05D4\u05D2\u05D9\u05E9\u05D4 \u05DE\u05E8\u05D7\u05D5\u05E7?",
    "mkt.faq.4.a": "\u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05DE\u05E0\u05D4\u05E8\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA \u05E2\u05DD \u05D4\u05E6\u05E4\u05E0\u05D4 \u05DE\u05E7\u05E6\u05D4 \u05DC\u05E7\u05E6\u05D4 \u05D1\u05DE\u05E1\u05D2\u05E8\u05EA \u05EA\u05D5\u05DB\u05E0\u05D9\u05EA Premium \u05D0\u05D5 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D4-VPN \u05D4\u05E4\u05E8\u05D8\u05D9 \u05E9\u05DC\u05DB\u05DD.",
    "mkt.desktop.eyebrow": "\u05E9\u05D5\u05DC\u05D7\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4",
    "mkt.desktop.title": "\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D0\u05D7\u05EA \u05DC\u05DB\u05DC \u05E9\u05D5\u05DC\u05D7\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4",
    "mkt.desktop.desc": "\u05D2\u05E8\u05E1\u05D0\u05D5\u05EA \u05D9\u05D9\u05E2\u05D5\u05D3\u05D9\u05D5\u05EA \u05DC-Windows, macOS \u05D5-Linux \u2014 \u05DB\u05DC \u05D0\u05D7\u05EA \u05DE\u05D5\u05EA\u05D0\u05DE\u05EA \u05DC\u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D4 \u05E9\u05DC\u05D4.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "\u05DE\u05D5\u05EA\u05D0\u05DD \u05DC-Windows 10 \u05D5-11 \u05E2\u05DD \u05E4\u05E2\u05D5\u05DC\u05D4 \u05D7\u05DC\u05E7\u05D4 \u05D1\u05E8\u05E7\u05E2.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u05E0\u05D5\u05E6\u05E8 \u05E2\u05D1\u05D5\u05E8 Apple Silicon \u05D5-Intel, \u05E2\u05DD \u05E9\u05D9\u05DC\u05D5\u05D1 \u05DE\u05E2\u05DE\u05D9\u05E7 \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA.",
    "mkt.desktop.linux": "\u05DC\u05D9\u05E0\u05D5\u05E7\u05E1",
    "mkt.desktop.linuxDesc": "\u05E7\u05DC\u05D4, \u05DE\u05D4\u05D9\u05E8\u05D4 \u05D5\u05EA\u05D5\u05D0\u05DE\u05EA \u05DC\u05DB\u05DC \u05D4\u05D4\u05E4\u05E6\u05D5\u05EA \u05D4\u05E2\u05D9\u05E7\u05E8\u05D9\u05D5\u05EA.",
    "mkt.desktop.download": "\u05D4\u05D5\u05E8\u05D3\u05D4",
    "mkt.mobile.eyebrow": "\u05DE\u05D5\u05D1\u05D9\u05D9\u05DC",
    "mkt.mobile.title": "\u05D4\u05D1\u05D9\u05EA \u05E9\u05DC\u05DA \u05D1\u05DB\u05D9\u05E1 \u05E9\u05DC\u05DA",
    "mkt.mobile.desc": "\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA NEXUS \u05DE\u05E2\u05E0\u05D9\u05E7\u05D4 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4 \u05D1\u05E7\u05E6\u05D5\u05EA \u05D4\u05D0\u05E6\u05D1\u05E2\u05D5\u05EA \u2014 \u05D1\u05DB\u05DC \u05DE\u05E7\u05D5\u05DD \u05E9\u05D1\u05D5 \u05D0\u05EA\u05DD \u05E0\u05DE\u05E6\u05D0\u05D9\u05DD.",
    "mkt.mobile.feat1.title": "\u05E9\u05D9\u05D7\u05D5\u05EA \u05E7\u05D5\u05DC\u05D9\u05D5\u05EA \u05D1\u05D3\u05E8\u05DB\u05D9\u05DD",
    "mkt.mobile.feat1.desc": "\u05D3\u05D1\u05E8\u05D5 \u05E2\u05DD \u05D4\u05D1\u05D9\u05EA \u05E9\u05DC\u05DB\u05DD \u05DE\u05DB\u05DC \u05DE\u05E7\u05D5\u05DD \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D6\u05D9\u05D4\u05D5\u05D9 \u05D3\u05D9\u05D1\u05D5\u05E8 \u05DE\u05D5\u05D1\u05E0\u05D4 \u05D1\u05DE\u05DB\u05E9\u05D9\u05E8.",
    "mkt.mobile.feat2.title": "\u05D2\u05D9\u05E9\u05D4 \u05DE\u05E8\u05D7\u05D5\u05E7",
    "mkt.mobile.feat2.desc": "\u05D4\u05EA\u05D7\u05D1\u05E8 \u05DC\u05E8\u05E9\u05EA \u05D4\u05D1\u05D9\u05EA\u05D9\u05EA \u05E9\u05DC\u05DA \u05D1\u05E6\u05D5\u05E8\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05DE\u05E0\u05D4\u05E8\u05D4 \u05DE\u05D5\u05E6\u05E4\u05E0\u05EA.",
    "mkt.mobile.feat3.title": "\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA \u05D3\u05D7\u05D9\u05E4\u05D4",
    "mkt.mobile.feat3.desc": "\u05E7\u05D1\u05DC \u05D4\u05EA\u05E8\u05D0\u05D5\u05EA \u05DE\u05D9\u05D9\u05D3\u05D9\u05D5\u05EA \u05E2\u05DC \u05D0\u05D9\u05E8\u05D5\u05E2\u05D9\u05DD \u05E9\u05D7\u05E9\u05D5\u05D1\u05D9\u05DD \u05DC\u05DA.",
    "mkt.mobile.feat4.title": "\u05DE\u05E0\u05E2\u05D5\u05DC \u05D1\u05D9\u05D5\u05DE\u05D8\u05E8\u05D9",
    "mkt.mobile.feat4.desc": "Face ID \u05D5\u05D8\u05D1\u05D9\u05E2\u05EA \u05D0\u05E6\u05D1\u05E2 \u05E9\u05D5\u05DE\u05E8\u05D9\u05DD \u05E2\u05DC \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D4\u05E9\u05DC\u05D9\u05D8\u05D4 \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D1\u05D9\u05EA\u05D9\u05EA.",
    "mkt.cta.title": "\u05D4\u05D1\u05D9\u05EA \u05E9\u05DC\u05DA, \u05D4\u05D7\u05D5\u05E7\u05D9\u05DD \u05E9\u05DC\u05DA.",
    "mkt.cta.desc": "\u05D4\u05D5\u05E8\u05D9\u05D3\u05D5 \u05D0\u05EA NEXUS \u05D5\u05E9\u05DC\u05D5\u05D8\u05D5 \u05D1\u05DB\u05DC \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05DE\u05DE\u05E7\u05D5\u05DD \u05D0\u05D7\u05D3.",
    "mkt.cta.button": "\u05D4\u05D5\u05E8\u05D3\u05D4 \u05D7\u05D9\u05E0\u05DD",
    "mkt.footer.platforms": "\u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D5\u05EA",
    "Dim living room lights": "\u05EA\u05D0\u05D5\u05E8\u05D4 \u05E2\u05DE\u05D5\u05DE\u05D4 \u05D1\u05E1\u05DC\u05D5\u05DF",
    "Start morning news briefing": "\u05D4\u05EA\u05D7\u05DC\u05EA \u05EA\u05D3\u05E8\u05D5\u05DA \u05D4\u05D7\u05D3\u05E9\u05D5\u05EA \u05D4\u05D1\u05D5\u05E7\u05E8",
    "Movie night": "\u05E2\u05E8\u05D1 \u05E1\u05E8\u05D8\u05D9\u05DD",
    "Good morning": "\u05D1\u05D5\u05E7\u05E8 \u05D8\u05D5\u05D1",
    "Leaving home": "\u05E2\u05D6\u05D9\u05D1\u05EA \u05D4\u05D1\u05D9\u05EA",
    "status.pctOnline": "{pct}% \u05DE\u05E7\u05D5\u05D5\u05DF",
    "status.offlineCount": "{count} \u05D1\u05DE\u05E6\u05D1 \u05DC\u05D0 \u05DE\u05E7\u05D5\u05D5\u05DF",
    "status.allOnline": "\u05DB\u05DC \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05DE\u05D7\u05D5\u05D1\u05E8\u05D9\u05DD \u05DC\u05E8\u05E9\u05EA",
    "status.suggestionReady": "\u05D4\u05D4\u05E6\u05E2\u05D4 \u05DC-{count} \u05DE\u05D5\u05DB\u05E0\u05D4 \u05E2\u05D1\u05D5\u05E8\u05DB\u05DD.",
    "status.suggestionsReady": "\u05D4\u05D4\u05E6\u05E2\u05D5\u05EA \u05DC-{count} \u05DE\u05D5\u05DB\u05E0\u05D5\u05EA \u05E2\u05D1\u05D5\u05E8\u05DB\u05DD.",
    "status.caughtUp": "\u05E2\u05DB\u05E9\u05D9\u05D5 \u05D0\u05EA\u05D4 \u05DE\u05E2\u05D5\u05D3\u05DB\u05DF.",
    "status.onlineOfTotal": "{online}/{total} \u05D1\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8",
    "mobile.menu": "\u05EA\u05E4\u05E8\u05D9\u05D8",
    "mobile.more": "\u05E2\u05D5\u05D3",
    "mobile.systemStatus": "\u05E1\u05D8\u05D8\u05D5\u05E1 \u05DE\u05E2\u05E8\u05DB\u05EA NEXUS",
    "mobile.localNetwork": "\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC\u05E8\u05E9\u05EA \u05DE\u05E7\u05D5\u05DE\u05D9\u05EA",
    "mobile.offline": "100% \u05DC\u05D0 \u05DE\u05E7\u05D5\u05D5\u05DF",
    "mobile.localAI": "\u05DE\u05E0\u05D5\u05E2 \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA \u05DE\u05E7\u05D5\u05DE\u05D9",
    "mobile.deviceNetwork": "\u05E8\u05E9\u05EA \u05D4\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD",
    "mobile.online": "\u05DE\u05E7\u05D5\u05D5\u05DF",
    "mobile.quickControls": "\u05E4\u05E7\u05D3\u05D9\u05DD \u05DE\u05D4\u05D9\u05E8\u05D9\u05DD",
    "mobile.privacyShield": "\u05DE\u05D2\u05DF \u05D4\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D1\u05DE\u05E6\u05D1 \u05DC\u05D0 \u05DE\u05E7\u05D5\u05D5\u05DF",
    "mobile.active": "\u05E4\u05E2\u05D9\u05DC",
    "mobile.voiceWake": '\u05D4\u05E4\u05E2\u05DC\u05D4 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05E7\u05D5\u05DC ("NEXUS")',
    "mobile.on": "\u05D1-",
    "mobile.autoBackup": "\u05D2\u05D9\u05D1\u05D5\u05D9 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9 \u05E9\u05DC \u05D3\u05E3 \u05D4\u05D1\u05D9\u05EA",
    "mobile.backupTime": "\u05DE\u05D3\u05D9 \u05D9\u05D5\u05DD \u05D1\u05E9\u05E2\u05D4 03:00",
    "mobile.moreSub.suggestions": "3 \u05D4\u05E6\u05E2\u05D5\u05EA \u05DE\u05EA\u05D5\u05D6\u05DE\u05E0\u05D5\u05EA \u05DC\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05D7\u05DB\u05DE\u05D4",
    "mobile.moreSub.skills": '5 \u05DE\u05D9\u05D5\u05DE\u05E0\u05D5\u05D9\u05D5\u05EA \u05D5\u05EA\u05E8\u05D7\u05D9\u05E9\u05D9\u05DD \u05D1\u05E0\u05D5\u05E9\u05D0 "\u05E6\u05D5\u05E8\u05EA \u05D4\u05E4\u05E2\u05D9\u05DC" \u05E9\u05E0\u05DC\u05DE\u05D3\u05D5',
    "mobile.moreSub.personalization": "\u05E9\u05DD \u05D4\u05E2\u05D5\u05D6\u05E8, \u05DE\u05D5\u05D3\u05DC \u05D4\u05E7\u05D5\u05DC \u05D5\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA",
    "mobile.moreSub.billing": "\u05EA\u05D5\u05DB\u05E0\u05D9\u05EA \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05EA NEXUS \xB7 \u05DE\u05E0\u05D5\u05D9 \u05E4\u05E2\u05D9\u05DC",
    "mobile.moreSub.downloads": "3 \u05D2\u05E8\u05E1\u05D0\u05D5\u05EA \u05E9\u05DC \u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D5\u05EA \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05D5\u05D0\u05D9\u05DE\u05D5\u05EA SHA-256",
    "mobile.moreSub.platform": "\u05E1\u05E0\u05DB\u05E8\u05D5\u05DF \u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD \u05D1\u05D9\u05DF \u05E4\u05DC\u05D8\u05E4\u05D5\u05E8\u05DE\u05D5\u05EA",
    "mobile.moreSub.agents": "\u05E1\u05D5\u05DB\u05E0\u05D9\u05DD \u05D0\u05D5\u05D8\u05D5\u05E0\u05D5\u05DE\u05D9\u05D9\u05DD \u05DE\u05D1\u05D5\u05E1\u05E1\u05D9 \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA",
    "mobile.moreSub.admin": "\u05E0\u05D9\u05D4\u05D5\u05DC \u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D5\u05DE\u05D3\u05D3\u05D9\u05DD",
    "desktop.title": "\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA",
    "setup.welcome": "\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD",
    "setup.license": "\u05E8\u05D9\u05E9\u05D9\u05D5\u05DF",
    "setup.location": "\u05DE\u05D9\u05E7\u05D5\u05DD",
    "setup.installing": "\u05D4\u05EA\u05E7\u05E0\u05D4",
    "setup.finish": "\u05E1\u05D9\u05D5\u05DD",
    "setup.welcomeTitle": "\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD \u05DC\u05EA\u05D4\u05DC\u05D9\u05DA \u05D4\u05D4\u05EA\u05E7\u05E0\u05D4 \u05E9\u05DC NEXUS",
    "setup.welcomeDesc": "\u05D0\u05E9\u05E3 \u05D6\u05D4 \u05D9\u05E0\u05D7\u05D4 \u05D0\u05EA\u05DB\u05DD \u05D1\u05EA\u05D4\u05DC\u05D9\u05DA \u05D4\u05D4\u05EA\u05E7\u05E0\u05D4 \u05E9\u05DC NEXUS AI \u2014 \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D4\u05E4\u05E2\u05DC\u05D4 \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC\u05DB\u05DD \u05DC\u05D1\u05D9\u05EA.",
    "setup.accept": "\u05D0\u05E0\u05D9 \u05DE\u05E1\u05DB\u05D9\u05DD \u05DC\u05EA\u05E0\u05D0\u05D9 \u05D4\u05E1\u05DB\u05DD \u05D4\u05E8\u05D9\u05E9\u05D9\u05D5\u05DF",
    "setup.chooseFolder": "\u05D1\u05D7\u05E8 \u05EA\u05D9\u05E7\u05D9\u05D9\u05EA \u05D4\u05EA\u05E7\u05E0\u05D4",
    "setup.installBtn": "\u05D4\u05EA\u05E7\u05DF",
    "setup.complete": "\u05D4\u05D4\u05EA\u05E7\u05E0\u05D4 \u05D4\u05D5\u05E9\u05DC\u05DE\u05D4",
    "setup.launchNow": "\u05D4\u05E4\u05E2\u05DC \u05D0\u05EA NEXUS \u05E2\u05DB\u05E9\u05D9\u05D5"
  },
  // ── Hindi ──
  hi: {
    "app.greeting": "\u0928\u092E\u0938\u094D\u0924\u0947 {name}, \u092E\u0948\u0902 \u0915\u0948\u0938\u0947 \u092E\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?",
    "app.confirmNeeded": "{name}, \u0909\u0938 \u0915\u093E\u0930\u094D\u0930\u0935\u093E\u0908 \u0915\u0947 \u0932\u093F\u090F \u0906\u092A\u0915\u0940 \u092A\u0941\u0937\u094D\u091F\u093F \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0964",
    "download.title": "NEXUS \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "download.primaryButton": "{os} \u0915\u0947 \u0932\u093F\u090F \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "download.otherOs": "\u0905\u0932\u0917 \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930 \u0930\u0939\u0947 \u0939\u0948\u0902?",
    "download.checksum": "\u090F\u0938\u090F\u091A\u090F-256 \u091A\u0947\u0915\u0938\u092E",
    "screen.today": "\u0906\u091C",
    "screen.homeState": "\u0939\u094B\u092E",
    "screen.suggestions": "\u0938\u0941\u091D\u093E\u0935",
    "screen.skills": "\u0915\u094C\u0936\u0932",
    "screen.family": "\u092A\u0930\u093F\u0935\u093E\u0930",
    "screen.devices": "\u0909\u092A\u0915\u0930\u0923",
    "screen.platform": "\u092E\u0902\u091A",
    "screen.agents": "\u090F\u091C\u0947\u0902\u091F\u094D\u0938",
    "screen.personalization": "\u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924\u0915\u0930\u0923",
    "screen.billing": "\u0938\u0926\u0938\u094D\u092F\u0924\u093E",
    "screen.downloadCenter": "\u0921\u093E\u0909\u0928\u0932\u094B\u0921",
    "screen.adminDashboard": "\u092A\u094D\u0930\u0936\u093E\u0938\u0928 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921",
    "today.devicesOnline": "\u0911\u0928\u0932\u093E\u0907\u0928 \u0909\u092A\u0915\u0930\u0923",
    "today.energy": "\u0906\u091C \u0915\u0940 \u090A\u0930\u094D\u091C\u093E",
    "today.activeRoutines": "\u0938\u0915\u094D\u0930\u093F\u092F \u0926\u093F\u0928\u091A\u0930\u094D\u092F\u093E",
    "today.suggestions": "\u0938\u0941\u091D\u093E\u0935",
    "screen.devices.empty": "\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u0921\u093F\u0935\u093E\u0907\u0938 \u0915\u0928\u0947\u0915\u094D\u091F \u0928\u0939\u0940\u0902 \u0939\u0941\u0906 \u0939\u0948\u0964",
    "screen.agents.empty": "\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u090F\u091C\u0947\u0902\u091F \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917\u0930 \u0928\u0939\u0940\u0902 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964",
    "screen.suggestions.empty": "\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u0938\u0941\u091D\u093E\u0935 \u0928\u0939\u0940\u0902 \u2014 NEXUS AI \u0905\u092D\u0940 \u092D\u0940 \u0938\u0940\u0916 \u0930\u0939\u093E \u0939\u0948\u0964",
    "screen.skills.empty": "\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u0915\u094C\u0936\u0932 \u0928\u0939\u0940\u0902 \u0938\u0940\u0916\u093E \u0917\u092F\u093E \u0939\u0948\u0964",
    "screen.homeState.empty": "\u0905\u092D\u0940 \u0924\u0915 \u0909\u092A\u0915\u0930\u0923\u094B\u0902 \u0935\u093E\u0932\u0947 \u0915\u094B\u0908 \u0915\u092E\u0930\u0947 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964",
    "plan.free": "\u0928\u093F:\u0936\u0941\u0932\u094D\u0915",
    "plan.premium": "\u092A\u094D\u0930\u0940\u092E\u093F\u092F\u092E",
    "plan.family": "\u092A\u0930\u093F\u0935\u093E\u0930",
    "billing.manage": "\u0938\u0926\u0938\u094D\u092F\u0924\u093E \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0947\u0902",
    "auth.tagline": "\u0918\u0930 \u0915\u0947 \u0932\u093F\u090F \u0906\u092A\u0915\u093E \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E",
    "auth.signInTitle": "NEXUS \u092E\u0947\u0902 \u0938\u093E\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
    "auth.signUpTitle": "\u0905\u092A\u0928\u093E NEXUS \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0901",
    "auth.email": "\u0908\u092E\u0947\u0932",
    "auth.password": "\u092A\u093E\u0938\u0935\u0930\u094D\u0921",
    "auth.signInButton": "\u0938\u093E\u0907\u0928 \u0907\u0928",
    "auth.signUpButton": "\u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0901",
    "auth.switchToSignUp": "\u092F\u0939\u093E\u0901 \u0928\u090F \u0939\u0948\u0902? \u090F\u0915 \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0901",
    "auth.switchToSignIn": "\u092A\u0939\u0932\u0947 \u0938\u0947 \u0939\u0940 \u0916\u093E\u0924\u093E \u0939\u0948? \u0938\u093E\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
    "auth.passwordHint": "\u0915\u092E \u0938\u0947 \u0915\u092E 8 \u0905\u0915\u094D\u0937\u0930",
    "auth.genericError": "\u0915\u0941\u091B \u0917\u0932\u0924 \u0939\u094B \u0917\u092F\u093E\u0964 \u0915\u0943\u092A\u092F\u093E \u092B\u093F\u0930 \u0938\u0947 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964",
    "auth.locked": "\u092C\u0939\u0941\u0924 \u0938\u093E\u0930\u0940 \u0905\u0938\u092B\u0932 \u0915\u094B\u0936\u093F\u0936\u0947\u0902\u0964 {time} \u092E\u0947\u0902 \u092B\u093F\u0930 \u0938\u0947 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964",
    "auth.rateLimited": "\u092C\u0939\u0941\u0924 \u0905\u0927\u093F\u0915 \u0905\u0928\u0941\u0930\u094B\u0927\u0964 \u0915\u0943\u092A\u092F\u093E \u092C\u093E\u0926 \u092E\u0947\u0902 \u092B\u093F\u0930 \u0938\u0947 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964",
    "auth.logout": "\u0928\u093F\u0915\u0932\u0947\u0902",
    "auth.welcome": "\u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948, {name}",
    "auth.continue": "\u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902",
    "auth.guest": "\u0905\u0924\u093F\u0925\u093F \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902",
    "auth.guestHint": "\u0916\u093E\u0924\u0947 \u0915\u0947 \u092C\u093F\u0928\u093E NEXUS \u0915\u093E \u0905\u0928\u094D\u0935\u0947\u0937\u0923 \u0915\u0930\u0947\u0902",
    "auth.social.divider": "\u092F\u093E \u0908\u092E\u0947\u0932 \u0938\u0947 \u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902",
    "auth.social.google": "Google \u0915\u0947 \u0938\u093E\u0925 \u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902",
    "auth.social.apple": "Apple \u0915\u0947 \u0938\u093E\u0925 \u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902",
    "auth.social.unavailable": "\u092F\u0939 \u0938\u093E\u0907\u0928-\u0907\u0928 \u0935\u093F\u0927\u093F \u0905\u092D\u0940 \u0924\u0915 \u0938\u0947\u091F\u0905\u092A \u0928\u0939\u0940\u0902 \u0915\u0940 \u0917\u0908 \u0939\u0948\u0964",
    "auth.social.error": "\u0909\u0938 \u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0915\u0947 \u0938\u093E\u0925 \u0938\u093E\u0907\u0928-\u0907\u0928 \u0935\u093F\u092B\u0932 \u0939\u094B \u0917\u092F\u093E\u0964 \u0915\u0943\u092A\u092F\u093E \u092B\u093F\u0930 \u0938\u0947 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964",
    "mkt.nav.features": "\u0935\u093F\u0936\u0947\u0937\u0924\u093E\u090F\u0901",
    "mkt.nav.pricing": "\u092E\u0942\u0932\u094D\u092F \u0928\u093F\u0930\u094D\u0927\u093E\u0930\u0923",
    "mkt.nav.testimonials": "\u092A\u094D\u0930\u0936\u0902\u0938\u093E\u092A\u0924\u094D\u0930",
    "mkt.nav.integrations": "\u090F\u0915\u0940\u0915\u0930\u0923",
    "mkt.nav.about": "\u0939\u092E\u093E\u0930\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902",
    "mkt.nav.download": "\u0921\u093E\u0909\u0928\u0932\u094B\u0921",
    "mkt.nav.faq": "\u0905\u0915\u094D\u0938\u0930 \u092A\u0942\u091B\u0947 \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0947 \u092A\u094D\u0930\u0936\u094D\u0928",
    "mkt.nav.signIn": "\u0938\u093E\u0907\u0928 \u0907\u0928",
    "mkt.hero.badge": "v{version} \xB7 \u0935\u093F\u0902\u0921\u094B\u091C\u093C \xB7 \u092E\u0948\u0915\u0913\u090F\u0938 \xB7 \u0932\u093F\u0928\u0915\u094D\u0938",
    "mkt.hero.title": "\u0905\u092A\u0928\u0947 \u0939\u0930 \u0921\u093F\u0935\u093E\u0907\u0938 \u0915\u0947 \u0932\u093F\u090F NEXUS \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "mkt.hero.desc": "NEXUS \u090F\u0915 \u0935\u0949\u092F\u0938-\u092B\u0930\u094D\u0938\u094D\u091F, \u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E-\u0915\u0947\u0902\u0926\u094D\u0930\u093F\u0924 \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E \u0939\u0948\u0964 \u0921\u0947\u0938\u094D\u0915\u091F\u0949\u092A \u0910\u092A \u092F\u093E \u092E\u094B\u092C\u093E\u0907\u0932 \u0938\u093E\u0925\u0940 \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u0947\u0902 \u0914\u0930 \u0939\u0930 \u0921\u093F\u0935\u093E\u0907\u0938 \u0915\u094B \u090F\u0915 \u0939\u0940 \u091C\u0917\u0939 \u0938\u0947 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0915\u0930\u0947\u0902 \u2014 100% \u0911\u0928-\u0921\u093F\u0935\u093E\u0907\u0938\u0964 \u0906\u092A \u0907\u0938\u0947 \u0905\u0938\u0932\u0940 \u0910\u092A \u0938\u0947 \u0907\u0938\u094D\u0924\u0947\u092E\u093E\u0932 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902, \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0938\u0947 \u0928\u0939\u0940\u0902\u0964",
    "mkt.hero.actionPrimary": "\u090F\u0928\u090F\u0915\u094D\u0938\u092A\u0940\u090F\u091A6 \xB7 \u0935\u0940\u090F\u0928\u090F\u0915\u094D\u0938\u092A\u0940\u090F\u091A7 \u0915\u0947 \u0932\u093F\u090F \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "mkt.hero.actionSecondary": "\u0907\u0938\u0947 \u0915\u094D\u0930\u093F\u092F\u093E\u0936\u0940\u0932 \u0926\u0947\u0916\u0947\u0902",
    "mkt.hero.trust": "\u2605 500,000+ \u0909\u092A\u092F\u094B\u0917\u0915\u0930\u094D\u0924\u093E \xB7 2000+ \u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0921\u093F\u0935\u093E\u0907\u0938 \xB7 100% \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E",
    "mkt.stats.title": "\u0928\u0947\u0915\u094D\u0938\u0938 \u0906\u0902\u0915\u0921\u093C\u094B\u0902 \u092E\u0947\u0902",
    "mkt.stats.users": "\u0938\u0915\u094D\u0930\u093F\u092F \u0909\u092A\u092F\u094B\u0917\u0915\u0930\u094D\u0924\u093E",
    "mkt.stats.devices": "\u0938\u092E\u0930\u094D\u0925\u093F\u0924 \u0909\u092A\u0915\u0930\u0923",
    "mkt.stats.privacy": "\u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E",
    "mkt.stats.rating": "\u0914\u0938\u0924 \u0930\u0947\u091F\u093F\u0902\u0917",
    "mkt.privacy.title": "\u0906\u092A\u0915\u093E \u0921\u0947\u091F\u093E \u0906\u092A\u0915\u093E \u0939\u0948",
    "mkt.privacy.processing": "100% \u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u092A\u094D\u0930\u0938\u0902\u0938\u094D\u0915\u0930\u0923",
    "mkt.privacy.encryption": "\u090F\u0902\u0921-\u091F\u0942-\u090F\u0902\u0921 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u090F\u0928\u094D\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928",
    "mkt.privacy.logging": "\u0936\u0942\u0928\u094D\u092F \u0915\u094D\u0932\u093E\u0909\u0921 \u0932\u0949\u0917\u093F\u0902\u0917",
    "mkt.how.title": "\u092F\u0939 \u0915\u0948\u0938\u0947 \u0915\u093E\u092E \u0915\u0930\u0924\u093E \u0939\u0948",
    "mkt.how.step1.title": "\u0921\u093E\u0909\u0928\u0932\u094B\u0921",
    "mkt.how.step1.desc": "\u0905\u092A\u0928\u0947 \u092A\u094D\u0932\u0947\u091F\u092B\u093C\u0949\u0930\u094D\u092E \u0915\u0947 \u0932\u093F\u090F \u0910\u092A \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902\u0964",
    "mkt.how.step2.title": "\u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0915\u0930\u0947\u0902",
    "mkt.how.step2.desc": "\u0915\u0941\u091B \u0939\u0940 \u0938\u0947\u0915\u0902\u0921 \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0938\u0947\u091F\u0905\u092A \u092A\u0942\u0930\u093E \u0915\u0930\u0947\u0902\u0964",
    "mkt.how.step3.title": "\u0921\u093F\u0935\u093E\u0907\u0938 \u0915\u0928\u0947\u0915\u094D\u091F \u0915\u0930\u0947\u0902",
    "mkt.how.step3.desc": "\u0905\u092A\u0928\u0947 \u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0939\u094B\u092E \u0915\u094B \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0928\u093E \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902\u0964",
    "mkt.preview.title": "NEXUS \u0915\u094B \u0915\u093E\u0930\u094D\u0930\u0935\u093E\u0908 \u092E\u0947\u0902 \u0926\u0947\u0916\u0947\u0902",
    "mkt.preview.desc": "\u0910\u092A \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u0924\u0947 \u0939\u0940 \u0906\u092A\u0915\u094B \u091C\u094B \u0905\u0938\u0932\u0940 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u092E\u093F\u0932\u0924\u093E \u0939\u0948, \u0909\u0938\u0915\u0940 \u090F\u0915 \u0932\u093E\u0907\u0935 \u091D\u0932\u0915\u0964",
    "mkt.preview.tab.today": "\u0906\u091C",
    "mkt.preview.tab.devices": "\u0909\u092A\u0915\u0930\u0923",
    "mkt.preview.tab.skills": "\u0926\u093F\u0928\u091A\u0930\u094D\u092F\u093E\u090F\u0901",
    "mkt.preview.tab.family": "\u092A\u0930\u093F\u0935\u093E\u0930",
    "mkt.download.mobile.title": "\u092E\u094B\u092C\u093E\u0907\u0932 \u0910\u092A\u094D\u0938",
    "mkt.download.mobile.desc": "iOS \u0914\u0930 Android \u0910\u092A\u094D\u0938 \u0906 \u0930\u0939\u0947 \u0939\u0948\u0902\u0964",
    "mkt.download.mobile.apple": "\u092A\u0930 \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "mkt.download.mobile.appleStore": "\u0910\u092A \u0938\u094D\u091F\u094B\u0930",
    "mkt.download.mobile.google": "\u0936\u0941\u0930\u0942 \u0915\u0930\u094B",
    "mkt.download.mobile.googlePlay": "\u0917\u0942\u0917\u0932 \u092A\u094D\u0932\u0947",
    "mkt.download.mobile.soon": "\u091C\u0932\u094D\u0926\u0940",
    "mkt.seo.title": "\u0928\u0947\u0915\u094D\u0938\u0938 \u2014 \u0905\u092A\u0928\u093E \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "mkt.seo.desc": "Windows, macOS \u0914\u0930 Linux \u0915\u0947 \u0932\u093F\u090F NEXUS \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902\u0964 iOS \u0914\u0930 Android \u091C\u0932\u094D\u0926 \u0939\u0940 \u0906 \u0930\u0939\u0947 \u0939\u0948\u0902\u0964",
    "mkt.skipToContent": "\u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u092A\u0930 \u091C\u093E\u090F\u0902",
    "mkt.pricing.title": "\u0938\u0930\u0932, \u092A\u093E\u0930\u0926\u0930\u094D\u0936\u0940 \u092E\u0942\u0932\u094D\u092F \u0928\u093F\u0930\u094D\u0927\u093E\u0930\u0923",
    "mkt.pricing.free": "\u0928\u093F:\u0936\u0941\u0932\u094D\u0915",
    "mkt.pricing.freeDesc": "\u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0939\u094B\u092E \u0915\u0947 \u0932\u093F\u090F \u0906\u092A\u0915\u094B \u091C\u094B \u0915\u0941\u091B \u092D\u0940 \u091A\u093E\u0939\u093F\u090F\u0964",
    "mkt.pricing.premium": "\u092A\u094D\u0930\u0940\u092E\u093F\u092F\u092E",
    "mkt.pricing.premiumDesc": "\u0909\u0928\u094D\u0928\u0924 \u090F\u0906\u0908 \u092A\u094D\u0930\u0938\u0902\u0938\u094D\u0915\u0930\u0923 \u0914\u0930 \u0926\u0942\u0930\u0938\u094D\u0925 \u092A\u0939\u0941\u0901\u091A\u0964",
    "mkt.pricing.family": "\u092A\u0930\u093F\u0935\u093E\u0930",
    "mkt.pricing.familyDesc": "\u092A\u0942\u0930\u094D\u0923 \u092A\u0939\u0941\u0901\u091A \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0947 \u0938\u093E\u0925 5 \u0916\u093E\u0924\u0947 \u0924\u0915\u0964",
    "mkt.pricing.cta": "\u092E\u0941\u092B\u094D\u0924 \u092E\u0947\u0902 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    "mkt.testimonials.title": "\u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0939\u094B\u092E \u0909\u0924\u094D\u0938\u093E\u0939\u0940 \u0932\u094B\u0917\u094B\u0902 \u0926\u094D\u0935\u093E\u0930\u093E \u092A\u0938\u0902\u0926 \u0915\u093F\u092F\u093E \u0917\u092F\u093E",
    "mkt.testimonials.quote1": "NEXUS \u0928\u0947 \u092E\u0947\u0930\u0947 \u0918\u0930 \u0915\u0947 \u0938\u093E\u0925 \u092E\u0947\u0930\u0940 \u092C\u093E\u0924\u091A\u0940\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0924\u0930\u0940\u0915\u0947 \u0915\u094B \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u0947 \u092C\u0926\u0932 \u0926\u093F\u092F\u093E\u0964 \u0938\u092C \u0915\u0941\u091B \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0939\u094B\u0928\u0947 \u0938\u0947 \u092F\u0939 \u092C\u0939\u0941\u0924 \u0924\u0947\u091C\u093C \u0939\u094B \u0917\u092F\u093E \u0939\u0948\u0964",
    "mkt.testimonials.author1": "\u0938\u093E\u0930\u093E \u091C\u0947\u0928\u0915\u093F\u0902\u0938",
    "mkt.testimonials.role1": "\u092A\u094D\u0930\u093E\u0930\u0902\u092D\u093F\u0915 \u0905\u092A\u0928\u093E\u0928\u0947 \u0935\u093E\u0932\u093E",
    "mkt.testimonials.quote2": "\u0906\u0916\u093F\u0930\u0915\u093E\u0930, \u090F\u0915 \u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0939\u094B\u092E \u0939\u092C \u091C\u094B \u092E\u0947\u0930\u0940 \u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E \u0915\u093E \u0938\u092E\u094D\u092E\u093E\u0928 \u0915\u0930\u0924\u093E \u0939\u0948\u0964 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u090F\u0906\u0908 \u092A\u094D\u0930\u094B\u0938\u0947\u0938\u093F\u0902\u0917 \u092C\u0947\u0939\u0926 \u092A\u094D\u0930\u0924\u093F\u0915\u094D\u0930\u093F\u092F\u093E\u0936\u0940\u0932 \u0939\u0948\u0964",
    "mkt.testimonials.author2": "\u0921\u0947\u0935\u093F\u0921 \u091A\u0947\u0928",
    "mkt.testimonials.role2": "\u0938\u0949\u092B\u093C\u094D\u091F\u0935\u0947\u092F\u0930 \u0907\u0902\u091C\u0940\u0928\u093F\u092F\u0930",
    "mkt.testimonials.quote3": "\u091C\u091F\u093F\u0932 \u0930\u0942\u091F\u0940\u0928 \u0938\u0947\u091F \u0915\u0930\u0928\u093E \u092C\u0947\u0939\u0926 \u0906\u0938\u093E\u0928 \u0939\u0948\u0964 \u092E\u0941\u091D\u0947 \u092F\u0939 \u092C\u093E\u0924 \u092C\u0939\u0941\u0924 \u092A\u0938\u0902\u0926 \u0939\u0948 \u0915\u093F \u091C\u092C \u092E\u0947\u0930\u093E \u0907\u0902\u091F\u0930\u0928\u0947\u091F \u092C\u0902\u0926 \u0939\u094B \u091C\u093E\u0924\u093E \u0939\u0948 \u0924\u092C \u092D\u0940 \u092F\u0939 \u092C\u0902\u0926 \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E\u0964",
    "mkt.testimonials.author3": "\u090F\u092E\u094D\u092E\u093E \u0925\u0949\u092E\u094D\u092A\u0938\u0928",
    "mkt.testimonials.role3": "\u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0939\u094B\u092E \u0909\u0924\u094D\u0938\u093E\u0939\u0940",
    "mkt.integrations.title": "\u0906\u092A\u0915\u0947 \u092A\u0938\u0902\u0926\u0940\u0926\u093E \u0909\u092A\u0915\u0930\u0923\u094B\u0902 \u0915\u0947 \u0938\u093E\u0925 \u0915\u093E\u092E \u0915\u0930\u0924\u093E \u0939\u0948",
    "mkt.changelog.title": "v3.14.2 \u092E\u0947\u0902 \u0928\u092F\u093E \u0915\u094D\u092F\u093E \u0939\u0948",
    "mkt.requirements.title": "\u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u0906\u0935\u0936\u094D\u092F\u0915\u0924\u093E\u090F\u0901",
    "mkt.requirements.desc": "64-\u092C\u093F\u091F \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E \u0914\u0930 \u0915\u092E \u0938\u0947 \u0915\u092E 2GB \u0930\u0948\u092E \u0915\u0940 \u0906\u0935\u0936\u094D\u092F\u0915\u0924\u093E \u0939\u0948\u0964",
    "mkt.footer.desc": "\u0906\u092A\u0915\u0940 \u0935\u0949\u092F\u0938-\u092B\u0930\u094D\u0938\u094D\u091F \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0939\u094B\u092E \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E\u0964 \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u094D\u0925\u093E\u0928\u0940\u092F, \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0906\u092A\u0915\u093E\u0964",
    "mkt.footer.product": "\u0909\u0924\u094D\u092A\u093E\u0926",
    "mkt.footer.company": "\u0915\u0902\u092A\u0928\u0940 \u0914\u0930 \u0915\u093E\u0928\u0942\u0928\u0940",
    "mkt.footer.about": "\u0939\u092E\u093E\u0930\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902",
    "mkt.footer.privacy": "\u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E \u0928\u0940\u0924\u093F",
    "mkt.footer.terms": "\u0938\u0947\u0935\u093E \u0915\u0940 \u0936\u0930\u094D\u0924\u0947\u0902",
    "mkt.footer.noCookies": "\u0939\u092E \u0936\u0942\u0928\u094D\u092F \u0915\u0941\u0915\u0940\u091C\u093C \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964",
    "mkt.cookie.title": "\u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E \u0914\u0930 \u0915\u0941\u0915\u0940\u091C\u093C",
    "mkt.cookie.desc": "\u0939\u092E \u0905\u092A\u0928\u0940 \u0938\u0947\u0935\u093E\u090F\u0901 \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0906\u0935\u0936\u094D\u092F\u0915 \u0915\u0941\u0915\u0940\u091C\u093C \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964 \u091C\u093E\u0930\u0940 \u0930\u0916\u0924\u0947 \u0939\u0941\u090F, \u0906\u092A \u0907\u0928 \u0906\u0935\u0936\u094D\u092F\u0915 \u0924\u0915\u0928\u0940\u0915\u094B\u0902 \u0915\u0947 \u0939\u092E\u093E\u0930\u0947 \u0909\u092A\u092F\u094B\u0917 \u0938\u0947 \u0938\u0939\u092E\u0924 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964",
    "mkt.cookie.accept": "\u0938\u092E\u091D \u0917\u092F\u093E",
    "mkt.cookie.decline": "\u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
    "mkt.feat.why": "NEXUS \u0915\u094D\u092F\u094B\u0902",
    "mkt.feat.1.title": "\u0935\u0949\u092F\u0938-\u092B\u0930\u094D\u0938\u094D\u091F \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923",
    "mkt.feat.1.desc": "\u0905\u092A\u0928\u0947 \u0918\u0930 \u0915\u0947 \u0938\u093E\u0925 \u0938\u094D\u0935\u093E\u092D\u093E\u0935\u093F\u0915 \u0930\u0942\u092A \u0938\u0947 \u0938\u0902\u0935\u093E\u0926 \u0915\u0930\u0947\u0902\u0964",
    "mkt.feat.2.title": "\u0921\u093F\u091C\u093C\u093E\u0907\u0928 \u0938\u0947 \u0928\u093F\u091C\u0940",
    "mkt.feat.2.desc": "\u0915\u094B\u0908 \u0915\u094D\u0932\u093E\u0909\u0921 \u0928\u0939\u0940\u0902, \u0915\u094B\u0908 \u0932\u0949\u0917\u093F\u0902\u0917 \u0928\u0939\u0940\u0902\u0964 \u0915\u0947\u0935\u0932 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u090F\u0928\u094D\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928\u0964",
    "mkt.feat.3.title": "\u0906\u092A\u0938\u0940-\u0938\u0902\u091A\u093E\u0932\u0928\u0940\u092F",
    "mkt.feat.3.desc": "500+ \u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u091C\u093F\u0928\u092E\u0947\u0902 \u092E\u0948\u091F\u0930, \u091C\u093C\u093F\u0917\u094D\u092C\u0940, \u091C\u093C\u0947\u0921-\u0935\u0947\u0935 \u0936\u093E\u092E\u093F\u0932 \u0939\u0948\u0902\u0964",
    "mkt.feat.4.title": "\u0905\u0926\u0943\u0936\u094D\u092F \u090F\u0906\u0908",
    "mkt.feat.4.desc": "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u092E\u0947\u0902 \u091A\u0932\u0924\u093E \u0939\u0948, \u0906\u092A\u0915\u0940 \u0926\u093F\u0928\u091A\u0930\u094D\u092F\u093E \u0938\u0940\u0916\u0924\u093E \u0939\u0948\u0964",
    "mkt.faq.title": "\u0905\u0915\u094D\u0938\u0930 \u092A\u0942\u091B\u0947 \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0947 \u092A\u094D\u0930\u0936\u094D\u0928",
    "mkt.faq.1.q": "\u0915\u094D\u092F\u093E NEXUS \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u0947 \u092E\u0941\u092B\u094D\u0924 \u0939\u0948?",
    "mkt.faq.1.a": "\u0939\u093E\u0901\u0964 \u092E\u0941\u0916\u094D\u092F OS \u0914\u0930 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0938\u0941\u0935\u093F\u0927\u093E\u090F\u0901 \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u0947 \u092E\u0941\u092B\u094D\u0924 \u0939\u0948\u0902\u0964",
    "mkt.faq.2.q": "\u0915\u094C\u0928 \u0938\u0947 \u0909\u092A\u0915\u0930\u0923 \u0938\u092E\u0930\u094D\u0925\u093F\u0924 \u0939\u0948\u0902?",
    "mkt.faq.2.a": "\u092E\u0948\u091F\u0930, \u091C\u093C\u093F\u0917\u094D\u092C\u0940, \u091C\u093C\u0947\u0921-\u0935\u0947\u0935 \u0921\u093F\u0935\u093E\u0907\u0938 \u0914\u0930 500 \u0938\u0947 \u0905\u0927\u093F\u0915 \u090F\u092A\u0940\u0906\u0908-\u0906\u0927\u093E\u0930\u093F\u0924 \u0907\u0915\u094B\u0938\u093F\u0938\u094D\u091F\u092E\u0964",
    "mkt.faq.3.q": "\u0915\u094D\u092F\u093E \u092F\u0939 \u0915\u094D\u0932\u093E\u0909\u0921 \u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u0915\u0947 \u092C\u093F\u0928\u093E \u0915\u093E\u092E \u0915\u0930\u0924\u093E \u0939\u0948?",
    "mkt.faq.3.a": "\u0939\u093E\u0901\u0964 \u092F\u0939 \u0906\u092A\u0915\u0947 \u0909\u092A\u0915\u0930\u0923\u094B\u0902 \u0915\u0947 \u0938\u093E\u0925 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0928\u0947\u091F\u0935\u0930\u094D\u0915 \u0915\u0947 \u092E\u093E\u0927\u094D\u092F\u092E \u0938\u0947 \u0938\u0902\u091A\u093E\u0930 \u0915\u0930\u0924\u093E \u0939\u0948, \u0914\u0930 \u0907\u0902\u091F\u0930\u0928\u0947\u091F \u092C\u0902\u0926 \u0939\u094B\u0928\u0947 \u092A\u0930 \u092D\u0940 \u0915\u093E\u092E \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
    "mkt.faq.4.q": "\u0930\u093F\u092E\u094B\u091F \u090F\u0915\u094D\u0938\u0947\u0938 \u0915\u0948\u0938\u0947 \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    "mkt.faq.4.a": "\u092A\u094D\u0930\u0940\u092E\u093F\u092F\u092E \u092A\u094D\u0932\u093E\u0928 \u0915\u0947 \u0938\u093E\u0925 \u090F\u0915 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u090F\u0902\u0921-\u091F\u0942-\u090F\u0902\u0921 \u090F\u0928\u094D\u0915\u094D\u0930\u093F\u092A\u094D\u091F\u0947\u0921 \u091F\u0928\u0932 \u0915\u0947 \u092E\u093E\u0927\u094D\u092F\u092E \u0938\u0947 \u092F\u093E \u0905\u092A\u0928\u0947 \u0938\u094D\u0935\u092F\u0902 \u0915\u0947 \u0935\u0940\u092A\u0940\u090F\u0928 \u0915\u0947 \u0938\u093E\u0925\u0964",
    "mkt.desktop.eyebrow": "\u0921\u0947\u0938\u094D\u0915\u091F\u0949\u092A",
    "mkt.desktop.title": "\u0939\u0930 \u0921\u0947\u0938\u094D\u0915\u091F\u0949\u092A \u0915\u0947 \u0932\u093F\u090F \u090F\u0915 \u0910\u092A",
    "mkt.desktop.desc": "\u0935\u093F\u0902\u0921\u094B\u091C, \u092E\u0948\u0915\u0913\u090F\u0938 \u0914\u0930 \u0932\u093F\u0928\u0915\u094D\u0938 \u0915\u0947 \u0932\u093F\u090F \u0928\u0947\u091F\u093F\u0935 \u092C\u093F\u0932\u094D\u0921 \u2014 \u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u0915\u094B \u0909\u0938\u0915\u0947 \u092A\u094D\u0932\u0947\u091F\u092B\u093C\u0949\u0930\u094D\u092E \u0915\u0947 \u0932\u093F\u090F \u0905\u0928\u0941\u0915\u0942\u0932\u093F\u0924 \u0915\u093F\u092F\u093E \u0917\u092F\u093E\u0964",
    "mkt.desktop.windows": "\u0935\u093F\u0902\u0921\u094B\u091C\u093C",
    "mkt.desktop.windowsDesc": "\u0935\u093F\u0902\u0921\u094B\u091C 10 \u0914\u0930 11 \u0915\u0947 \u0932\u093F\u090F \u0928\u093F\u0930\u094D\u092C\u093E\u0927 \u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F \u0938\u0902\u091A\u093E\u0932\u0928 \u0915\u0947 \u0938\u093E\u0925 \u0905\u0928\u0941\u0915\u0942\u0932\u093F\u0924\u0964",
    "mkt.desktop.macos": "\u092E\u0948\u0915\u094B\u0938",
    "mkt.desktop.macosDesc": "\u090F\u092A\u094D\u092A\u0932 \u0938\u093F\u0932\u093F\u0915\u0949\u0928 \u0914\u0930 \u0907\u0902\u091F\u0947\u0932 \u0915\u0947 \u0932\u093F\u090F, \u0917\u0939\u0930\u0947 \u0938\u093F\u0938\u094D\u091F\u092E \u090F\u0915\u0940\u0915\u0930\u0923 \u0915\u0947 \u0938\u093E\u0925 \u0928\u093F\u0930\u094D\u092E\u093F\u0924\u0964",
    "mkt.desktop.linux": "\u0932\u093F\u0928\u0915\u094D\u0938",
    "mkt.desktop.linuxDesc": "\u0939\u0932\u094D\u0915\u093E, \u0924\u0947\u091C\u093C, \u0914\u0930 \u0938\u092D\u0940 \u092A\u094D\u0930\u092E\u0941\u0916 \u0935\u093F\u0924\u0930\u0923\u094B\u0902 \u0915\u0947 \u0938\u093E\u0925 \u0938\u0902\u0917\u0924\u0964",
    "mkt.desktop.download": "\u0921\u093E\u0909\u0928\u0932\u094B\u0921",
    "mkt.mobile.eyebrow": "\u092E\u094B\u092C\u093E\u0907\u0932",
    "mkt.mobile.title": "\u0906\u092A\u0915\u093E \u0918\u0930 \u0906\u092A\u0915\u0940 \u091C\u0947\u092C \u092E\u0947\u0902",
    "mkt.mobile.desc": "NEXUS \u0938\u093E\u0925\u0940 \u0910\u092A \u0906\u092A\u0915\u0947 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u094B \u0906\u092A\u0915\u0940 \u0909\u0902\u0917\u0932\u093F\u092F\u094B\u0902 \u092A\u0930 \u0930\u0916\u0924\u093E \u0939\u0948 \u2014 \u0906\u092A \u0915\u0939\u0940\u0902 \u092D\u0940 \u0939\u094B\u0902\u0964",
    "mkt.mobile.feat1.title": "\u091A\u0932\u0924\u0947-\u092B\u093F\u0930\u0924\u0947 \u0935\u0949\u092F\u0938",
    "mkt.mobile.feat1.desc": "\u0911\u0928-\u0921\u093F\u0935\u093E\u0907\u0938 \u0935\u0949\u092F\u0938 \u0930\u093F\u0915\u0917\u094D\u0928\u093F\u0936\u0928 \u0915\u0947 \u0938\u093E\u0925 \u0915\u0939\u0940\u0902 \u0938\u0947 \u092D\u0940 \u0905\u092A\u0928\u0947 \u0918\u0930 \u0938\u0947 \u092C\u093E\u0924 \u0915\u0930\u0947\u0902\u0964",
    "mkt.mobile.feat2.title": "\u0926\u0942\u0930\u0938\u094D\u0925 \u092A\u0939\u0941\u0901\u091A",
    "mkt.mobile.feat2.desc": "\u090F\u0928\u094D\u0915\u094D\u0930\u093F\u092A\u094D\u091F\u0947\u0921 \u091F\u0928\u0932 \u0915\u0947 \u092E\u093E\u0927\u094D\u092F\u092E \u0938\u0947 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 \u0905\u092A\u0928\u0947 \u0939\u094B\u092E \u0928\u0947\u091F\u0935\u0930\u094D\u0915 \u0924\u0915 \u092A\u0939\u0941\u0901\u091A\u0947\u0902\u0964",
    "mkt.mobile.feat3.title": "\u092A\u0941\u0936 \u0938\u0942\u091A\u0928\u093E\u090F\u0902",
    "mkt.mobile.feat3.desc": "\u0906\u092A\u0915\u0947 \u0932\u093F\u090F \u092E\u0939\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u0918\u091F\u0928\u093E\u0913\u0902 \u0915\u0947 \u0932\u093F\u090F \u0924\u0941\u0930\u0902\u0924 \u0938\u0942\u091A\u0928\u093E\u090F\u0902 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0947\u0902\u0964",
    "mkt.mobile.feat4.title": "\u092C\u093E\u092F\u094B\u092E\u0947\u091F\u094D\u0930\u093F\u0915 \u0932\u0949\u0915",
    "mkt.mobile.feat4.desc": "\u092B\u0947\u0938 \u0906\u0908\u0921\u0940 \u0914\u0930 \u092B\u093F\u0902\u0917\u0930\u092A\u094D\u0930\u093F\u0902\u091F \u0906\u092A\u0915\u0947 \u0939\u094B\u092E \u0915\u0902\u091F\u094D\u0930\u094B\u0932\u094D\u0938 \u0915\u094B \u0928\u093F\u091C\u0940 \u0930\u0916\u0924\u0947 \u0939\u0948\u0902\u0964",
    "mkt.cta.title": "\u0906\u092A\u0915\u093E \u0918\u0930, \u0906\u092A\u0915\u0947 \u0928\u093F\u092F\u092E\u0964",
    "mkt.cta.desc": "NEXUS \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902 \u0914\u0930 \u090F\u0915 \u0939\u0940 \u0938\u094D\u0925\u093E\u0928 \u0938\u0947 \u0939\u0930 \u0921\u093F\u0935\u093E\u0907\u0938 \u0915\u094B \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0915\u0930\u0947\u0902\u0964",
    "mkt.cta.button": "\u0928\u093F:\u0936\u0941\u0932\u094D\u0915 \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
    "mkt.footer.platforms": "\u092E\u0902\u091A",
    "Dim living room lights": "\u092C\u0948\u0920\u0915 \u0915\u0915\u094D\u0937 \u0915\u0940 \u0930\u094B\u0936\u0928\u0940 \u092E\u0902\u0926 \u0915\u0930\u0947\u0902",
    "Start morning news briefing": "\u0938\u0941\u092C\u0939 \u0915\u0940 \u0938\u092E\u093E\u091A\u093E\u0930 \u092C\u094D\u0930\u0940\u092B\u093F\u0902\u0917 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    "Movie night": "\u092B\u093F\u0932\u094D\u092E \u0915\u0940 \u0930\u093E\u0924",
    "Good morning": "\u0938\u0941\u092C\u0939 \u0915\u0940 \u0936\u0941\u092D\u0915\u093E\u092E\u0928\u093E\u090F\u0901",
    "Leaving home": "\u0918\u0930 \u091B\u094B\u0921\u093C\u0928\u093E",
    "status.pctOnline": "\u090F\u0928\u090F\u0915\u094D\u0938\u092A\u0940\u090F\u091A8% \u0911\u0928\u0932\u093E\u0907\u0928",
    "status.offlineCount": "\u090F\u0928\u090F\u0915\u094D\u0938\u092A\u0940\u090F\u091A9 \u0911\u092B\u093C\u0932\u093E\u0907\u0928",
    "status.allOnline": "\u0938\u092D\u0940 \u0921\u093F\u0935\u093E\u0907\u0938 \u0911\u0928\u0932\u093E\u0907\u0928",
    "status.suggestionReady": "{count} \u0938\u0941\u091D\u093E\u0935 \u0906\u092A\u0915\u0947 \u0932\u093F\u090F \u0924\u0948\u092F\u093E\u0930 \u0939\u0948\u0964",
    "status.suggestionsReady": "{count} \u0938\u0941\u091D\u093E\u0935 \u0906\u092A\u0915\u0947 \u0932\u093F\u090F \u0924\u0948\u092F\u093E\u0930 \u0939\u0948\u0902\u0964",
    "status.caughtUp": "\u0906\u092A \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u0947 \u0905\u092A\u0921\u0947\u091F \u0939\u094B \u0917\u090F \u0939\u0948\u0902\u0964",
    "status.onlineOfTotal": "\u090F\u0928\u090F\u0915\u094D\u0938\u092A\u0940\u090F\u091A12/\u090F\u0928\u090F\u0915\u094D\u0938\u092A\u0940\u090F\u091A13 \u0911\u0928\u0932\u093E\u0907\u0928",
    "mobile.menu": "\u092E\u0947\u0928\u0942",
    "mobile.more": "\u0914\u0930",
    "mobile.systemStatus": "\u0928\u0947\u0915\u094D\u0938\u0938 \u0938\u093F\u0938\u094D\u091F\u092E \u0938\u094D\u0925\u093F\u0924\u093F",
    "mobile.localNetwork": "\u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0928\u0947\u091F\u0935\u0930\u094D\u0915 \u0915\u0928\u0947\u0915\u094D\u0936\u0928",
    "mobile.offline": "100% \u0911\u092B\u093C\u0932\u093E\u0907\u0928",
    "mobile.localAI": "\u0938\u094D\u0925\u093E\u0928\u0940\u092F \u090F\u0906\u0908 \u0907\u0902\u091C\u0928",
    "mobile.deviceNetwork": "\u0921\u093F\u0935\u093E\u0907\u0938 \u0928\u0947\u091F\u0935\u0930\u094D\u0915",
    "mobile.online": "\u0911\u0928\u0932\u093E\u0907\u0928",
    "mobile.quickControls": "\u0924\u094D\u0935\u0930\u093F\u0924 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923",
    "mobile.privacyShield": "\u0911\u092B\u093C\u0932\u093E\u0907\u0928 \u092A\u094D\u0930\u093E\u0907\u0935\u0947\u0938\u0940 \u0936\u0940\u0932\u094D\u0921",
    "mobile.active": "\u0938\u0915\u094D\u0930\u093F\u092F",
    "mobile.voiceWake": '\u0935\u0949\u092F\u0938 \u0935\u0947\u0915 ("\u0928\u0947\u0915\u094D\u0938\u0938")',
    "mobile.on": "\u092A\u0930",
    "mobile.autoBackup": "\u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0939\u094B\u092E \u092C\u0948\u0915\u0905\u092A",
    "mobile.backupTime": "\u0926\u0948\u0928\u093F\u0915 03:00",
    "mobile.moreSub.suggestions": "3 \u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0938\u094D\u0935\u091A\u093E\u0932\u0928 \u0938\u0941\u091D\u093E\u0935",
    "mobile.moreSub.skills": "5 \u0938\u0915\u094D\u0930\u093F\u092F \u0938\u094D\u0935\u0930 \u0915\u094C\u0936\u0932 \u0914\u0930 \u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F \u0938\u0940\u0916\u0947",
    "mobile.moreSub.personalization": "\u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0928\u093E\u092E, \u0935\u0949\u092F\u0938 \u092E\u0949\u0921\u0932 \u0914\u0930 \u0917\u094B\u092A\u0928\u0940\u092F\u0924\u093E \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
    "mobile.moreSub.billing": "\u0928\u0947\u0915\u094D\u0938\u0938 \u092A\u093E\u0930\u093F\u0935\u093E\u0930\u093F\u0915 \u092F\u094B\u091C\u0928\u093E \xB7 \u0938\u0915\u094D\u0930\u093F\u092F \u0938\u0926\u0938\u094D\u092F\u0924\u093E",
    "mobile.moreSub.downloads": "3 \u0913\u090F\u0938 \u092A\u094D\u0932\u0947\u091F\u092B\u093C\u0949\u0930\u094D\u092E \u0930\u093F\u0932\u0940\u091C\u093C \u0914\u0930 SHA-256 \u0938\u0924\u094D\u092F\u093E\u092A\u0928",
    "mobile.moreSub.platform": "\u0915\u094D\u0930\u0949\u0938-\u092A\u094D\u0932\u0947\u091F\u092B\u093C\u0949\u0930\u094D\u092E \u0921\u093F\u0935\u093E\u0907\u0938 \u0938\u093F\u0902\u0915",
    "mobile.moreSub.agents": "\u0938\u094D\u0935\u093E\u092F\u0924\u094D\u0924 \u090F\u0906\u0908 \u090F\u091C\u0947\u0902\u091F",
    "mobile.moreSub.admin": "\u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u092A\u094D\u0930\u0936\u093E\u0938\u0928 \u090F\u0935\u0902 \u092E\u093E\u092A\u0926\u0902\u0921",
    "desktop.title": "\u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E",
    "setup.welcome": "\u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948",
    "setup.license": "\u0932\u093E\u0907\u0938\u0947\u0902\u0938",
    "setup.location": "\u0938\u094D\u0925\u093E\u0928",
    "setup.installing": "\u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0915\u0930\u0924\u0947 \u0939\u0941\u090F",
    "setup.finish": "\u0938\u092E\u093E\u092A\u094D\u0924 \u0915\u0930\u0947\u0902",
    "setup.welcomeTitle": "NEXUS \u0938\u0947\u091F\u0905\u092A \u092E\u0947\u0902 \u0906\u092A\u0915\u093E \u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948",
    "setup.welcomeDesc": "\u092F\u0939 \u0935\u093F\u091C\u093C\u093E\u0930\u094D\u0921 \u0906\u092A\u0915\u094B NEXUS AI \u0915\u0940 \u0938\u094D\u0925\u093E\u092A\u0928\u093E \u092E\u0947\u0902 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928 \u0915\u0930\u0947\u0917\u093E \u2014 \u0918\u0930 \u0915\u0947 \u0932\u093F\u090F \u0906\u092A\u0915\u093E \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E\u0964",
    "setup.accept": "\u092E\u0948\u0902 \u0932\u093E\u0907\u0938\u0947\u0902\u0938 \u0938\u092E\u091D\u094C\u0924\u0947 \u0915\u094B \u0938\u094D\u0935\u0940\u0915\u093E\u0930 \u0915\u0930\u0924\u093E \u0939\u0942\u0901\u0964",
    "setup.chooseFolder": "\u0938\u094D\u0925\u093E\u092A\u0928\u093E \u092B\u093C\u094B\u0932\u094D\u0921\u0930 \u091A\u0941\u0928\u0947\u0902",
    "setup.installBtn": "\u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0915\u0930\u0947\u0902",
    "setup.complete": "\u0938\u0947\u091F\u0905\u092A \u092A\u0942\u0930\u093E",
    "setup.launchNow": "NEXUS \u0905\u092D\u0940 \u0932\u0949\u0928\u094D\u091A \u0915\u0930\u0947\u0902"
  },
  // ── Japanese ──
  ja: {
    "app.greeting": "{name}\u3055\u3093\u3001\u3053\u3093\u306B\u3061\u306F\u3002\u4F55\u304B\u304A\u624B\u4F1D\u3044\u3067\u304D\u308B\u3053\u3068\u306F\u3042\u308A\u307E\u3059\u304B\uFF1F",
    "app.confirmNeeded": "{name}\u3055\u3093\u3001\u305D\u306E\u64CD\u4F5C\u306B\u306F\u3042\u306A\u305F\u306E\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059\u3002",
    "download.title": "NEXUS\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "download.primaryButton": "{os}\u7528\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "download.otherOs": "\u5225\u306E\u30AA\u30DA\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30B7\u30B9\u30C6\u30E0\u3092\u304A\u4F7F\u3044\u3067\u3059\u304B\uFF1F",
    "download.checksum": "SHA-256\u30C1\u30A7\u30C3\u30AF\u30B5\u30E0",
    "screen.today": "\u4ECA\u65E5",
    "screen.homeState": "\u30DB\u30FC\u30E0",
    "screen.suggestions": "\u3054\u63D0\u6848",
    "screen.skills": "\u30B9\u30AD\u30EB",
    "screen.family": "\u5BB6\u65CF",
    "screen.devices": "\u30C7\u30D0\u30A4\u30B9",
    "screen.platform": "\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0",
    "screen.agents": "\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
    "screen.personalization": "\u30D1\u30FC\u30BD\u30CA\u30E9\u30A4\u30BC\u30FC\u30B7\u30E7\u30F3",
    "screen.billing": "\u5B9A\u671F\u8CFC\u8AAD",
    "screen.downloadCenter": "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "screen.adminDashboard": "\u7BA1\u7406\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
    "today.devicesOnline": "\u30AA\u30F3\u30E9\u30A4\u30F3\u4E2D\u306E\u30C7\u30D0\u30A4\u30B9",
    "today.energy": "\u4ECA\u65E5\u306E\u30A8\u30CD\u30EB\u30AE\u30FC",
    "today.activeRoutines": "\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30EB\u30FC\u30C1\u30F3",
    "today.suggestions": "\u3054\u63D0\u6848",
    "screen.devices.empty": "\u307E\u3060\u63A5\u7D9A\u3055\u308C\u3066\u3044\u308B\u30C7\u30D0\u30A4\u30B9\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    "screen.agents.empty": "\u307E\u3060\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u306F\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "screen.suggestions.empty": "\u307E\u3060\u63D0\u6848\u306F\u3042\u308A\u307E\u305B\u3093 \u2014 NEXUS AI\u306F\u307E\u3060\u5B66\u7FD2\u4E2D\u3067\u3059\u3002",
    "screen.skills.empty": "\u307E\u3060\u7FD2\u5F97\u3057\u305F\u30B9\u30AD\u30EB\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    "screen.homeState.empty": "\u73FE\u5728\u3001\u30C7\u30D0\u30A4\u30B9\u304C\u8A2D\u7F6E\u3055\u308C\u3066\u3044\u308B\u90E8\u5C4B\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    "plan.free": "\u7121\u6599",
    "plan.premium": "\u30D7\u30EC\u30DF\u30A2\u30E0",
    "plan.family": "\u5BB6\u65CF",
    "billing.manage": "\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306E\u7BA1\u7406",
    "auth.tagline": "\u3054\u5BB6\u5EAD\u5411\u3051\u306E\u30D1\u30FC\u30BD\u30CA\u30EBOS",
    "auth.signInTitle": "NEXUS\u306B\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044",
    "auth.signUpTitle": "NEXUS\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3059\u308B",
    "auth.email": "\u96FB\u5B50\u30E1\u30FC\u30EB",
    "auth.password": "\u30D1\u30B9\u30EF\u30FC\u30C9",
    "auth.signInButton": "\u30ED\u30B0\u30A4\u30F3",
    "auth.signUpButton": "\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3059\u308B",
    "auth.switchToSignUp": "\u521D\u3081\u3066\u3067\u3059\u304B\uFF1F\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044",
    "auth.switchToSignIn": "\u3059\u3067\u306B\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u304A\u6301\u3061\u3067\u3059\u304B\uFF1F \u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044",
    "auth.passwordHint": "8\u6587\u5B57\u4EE5\u4E0A",
    "auth.genericError": "\u554F\u984C\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    "auth.locked": "\u5931\u6557\u56DE\u6570\u304C\u591A\u3059\u304E\u307E\u3059\u3002{time}\u3067\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    "auth.rateLimited": "\u30EA\u30AF\u30A8\u30B9\u30C8\u304C\u591A\u3059\u304E\u307E\u3059\u3002\u3057\u3070\u3089\u304F\u3057\u3066\u304B\u3089\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    "auth.logout": "\u30ED\u30B0\u30A2\u30A6\u30C8",
    "auth.welcome": "{name}\u3055\u3093\u3001\u3088\u3046\u3053\u305D",
    "auth.continue": "\u7D9A\u304D\u3092\u8AAD\u3080",
    "auth.guest": "\u30B2\u30B9\u30C8\u3068\u3057\u3066\u7D9A\u3051\u308B",
    "auth.guestHint": "\u30A2\u30AB\u30A6\u30F3\u30C8\u306A\u3057\u3067NEXUS\u3092\u4F53\u9A13\u3059\u308B",
    "auth.social.divider": "\u307E\u305F\u306F\u3001\u30E1\u30FC\u30EB\u3067\u7D9A\u3051\u308B",
    "auth.social.google": "Google\u3067\u7D9A\u3051\u308B",
    "auth.social.apple": "Apple\u3067\u7D9A\u3051\u308B",
    "auth.social.unavailable": "\u3053\u306E\u30ED\u30B0\u30A4\u30F3\u65B9\u6CD5\u306F\u307E\u3060\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "auth.social.error": "\u305D\u306E\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u3067\u306E\u30ED\u30B0\u30A4\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    "mkt.nav.features": "\u7279\u9577",
    "mkt.nav.pricing": "\u4FA1\u683C",
    "mkt.nav.testimonials": "\u304A\u5BA2\u69D8\u306E\u58F0",
    "mkt.nav.integrations": "\u9023\u643A\u6A5F\u80FD",
    "mkt.nav.about": "\u5F53\u793E\u306B\u3064\u3044\u3066",
    "mkt.nav.download": "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "mkt.nav.faq": "\u3088\u304F\u3042\u308B\u8CEA\u554F",
    "mkt.nav.signIn": "\u30ED\u30B0\u30A4\u30F3",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\u304A\u6301\u3061\u306E\u3059\u3079\u3066\u306E\u30C7\u30D0\u30A4\u30B9\u306BNEXUS\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044",
    "mkt.hero.desc": "NEXUS\u306F\u3001\u97F3\u58F0\u64CD\u4F5C\u3092\u6700\u512A\u5148\u3068\u3057\u3001\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u3092\u91CD\u8996\u3057\u305F\u30D1\u30FC\u30BD\u30CA\u30EB\u30AA\u30DA\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30B7\u30B9\u30C6\u30E0\u3067\u3059\u3002\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30A2\u30D7\u30EA\u307E\u305F\u306F\u30E2\u30D0\u30A4\u30EB\u7528\u30B3\u30F3\u30D1\u30CB\u30AA\u30F3\u30A2\u30D7\u30EA\u3092\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3059\u308C\u3070\u3001\u3059\u3079\u3066\u306E\u30C7\u30D0\u30A4\u30B9\u30921\u304B\u6240\u304B\u3089\u64CD\u4F5C\u3067\u304D\u307E\u3059\u3002\u51E6\u7406\u306F100\uFF05\u7AEF\u672B\u5185\u3067\u884C\u308F\u308C\u307E\u3059\u3002\u30D6\u30E9\u30A6\u30B6\u3067\u306F\u306A\u304F\u3001\u5B9F\u969B\u306E\u30A2\u30D7\u30EA\u304B\u3089\u3054\u5229\u7528\u304F\u3060\u3055\u3044\u3002",
    "mkt.hero.actionPrimary": "{os}\u30FBv{version}\u7528\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "mkt.hero.actionSecondary": "\u5B9F\u969B\u306E\u52D5\u4F5C\u3092\u3054\u89A7\u304F\u3060\u3055\u3044",
    "mkt.hero.trust": "\u2605 50\u4E07\u4EBA\u4EE5\u4E0A\u306E\u30E6\u30FC\u30B6\u30FC \xB7 2,000\u53F0\u4EE5\u4E0A\u306E\u30B9\u30DE\u30FC\u30C8\u30C7\u30D0\u30A4\u30B9 \xB7 100%\u30ED\u30FC\u30AB\u30EB\u3067\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u4FDD\u8B77",
    "mkt.stats.title": "NEXUS\u306E\u6570\u5B57",
    "mkt.stats.users": "\u30A2\u30AF\u30C6\u30A3\u30D6\u30E6\u30FC\u30B6\u30FC",
    "mkt.stats.devices": "\u5BFE\u5FDC\u30C7\u30D0\u30A4\u30B9",
    "mkt.stats.privacy": "\u7AEF\u672B\u4E0A\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC",
    "mkt.stats.rating": "\u5E73\u5747\u8A55\u4FA1",
    "mkt.privacy.title": "\u30C7\u30FC\u30BF\u306F\u3042\u306A\u305F\u81EA\u8EAB\u306E\u3082\u306E\u3067\u3059",
    "mkt.privacy.processing": "100% \u7AEF\u672B\u5185\u51E6\u7406",
    "mkt.privacy.encryption": "\u30A8\u30F3\u30C9\u30C4\u30FC\u30A8\u30F3\u30C9\u306E\u30ED\u30FC\u30AB\u30EB\u6697\u53F7\u5316",
    "mkt.privacy.logging": "\u30AF\u30E9\u30A6\u30C9\u3078\u306E\u30ED\u30B0\u8A18\u9332\u306A\u3057",
    "mkt.how.title": "\u4ED5\u7D44\u307F",
    "mkt.how.step1.title": "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "mkt.how.step1.desc": "\u304A\u4F7F\u3044\u306E\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306B\u5BFE\u5FDC\u3057\u305F\u30A2\u30D7\u30EA\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    "mkt.how.step2.title": "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
    "mkt.how.step2.desc": "\u30ED\u30FC\u30AB\u30EB\u306E\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u306F\u6570\u79D2\u3067\u5B8C\u4E86\u3057\u307E\u3059\u3002",
    "mkt.how.step3.title": "\u30C7\u30D0\u30A4\u30B9\u3092\u63A5\u7D9A\u3059\u308B",
    "mkt.how.step3.desc": "\u30B9\u30DE\u30FC\u30C8\u30DB\u30FC\u30E0\u306E\u7BA1\u7406\u3092\u5B89\u5168\u306B\u59CB\u3081\u307E\u3057\u3087\u3046\u3002",
    "mkt.preview.title": "NEXUS\u306E\u5B9F\u969B\u306E\u52D5\u4F5C\u3092\u3054\u89A7\u304F\u3060\u3055\u3044",
    "mkt.preview.desc": "\u30A2\u30D7\u30EA\u3092\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3057\u305F\u77AC\u9593\u306B\u8868\u793A\u3055\u308C\u308B\u5B9F\u969B\u306E\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3092\u3001\u30E9\u30A4\u30D6\u3067\u3054\u89A7\u304F\u3060\u3055\u3044\u3002",
    "mkt.preview.tab.today": "\u4ECA\u65E5",
    "mkt.preview.tab.devices": "\u30C7\u30D0\u30A4\u30B9",
    "mkt.preview.tab.skills": "\u30EB\u30FC\u30C6\u30A3\u30F3",
    "mkt.preview.tab.family": "\u5BB6\u65CF",
    "mkt.download.mobile.title": "\u30E2\u30D0\u30A4\u30EB\u30A2\u30D7\u30EA",
    "mkt.download.mobile.desc": "iOS\u304A\u3088\u3073Android\u5411\u3051\u30A2\u30D7\u30EA\u306F\u307E\u3082\u306A\u304F\u30EA\u30EA\u30FC\u30B9\u4E88\u5B9A\u3067\u3059\u3002",
    "mkt.download.mobile.apple": "\u4EE5\u4E0B\u304B\u3089\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "\u4ECA\u3059\u3050\u5165\u624B",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\u3082\u3046\u3059\u3050",
    "mkt.seo.title": "NEXUS \u2014 \u81EA\u5206\u5C02\u7528\u306E\u30AA\u30DA\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30B7\u30B9\u30C6\u30E0\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "mkt.seo.desc": "Windows\u3001macOS\u3001Linux\u7528\u306ENEXUS\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044\u3002iOS\u304A\u3088\u3073Android\u7248\u306F\u8FD1\u65E5\u516C\u958B\u4E88\u5B9A\u3067\u3059\u3002",
    "mkt.skipToContent": "\u30B3\u30F3\u30C6\u30F3\u30C4\u3078\u30B9\u30AD\u30C3\u30D7",
    "mkt.pricing.title": "\u30B7\u30F3\u30D7\u30EB\u3067\u900F\u660E\u6027\u306E\u9AD8\u3044\u4FA1\u683C\u8A2D\u5B9A",
    "mkt.pricing.free": "\u7121\u6599",
    "mkt.pricing.freeDesc": "\u5730\u57DF\u5BC6\u7740\u578B\u306E\u30B9\u30DE\u30FC\u30C8\u30DB\u30FC\u30E0\u306B\u5FC5\u8981\u306A\u3082\u306E\u304C\u3059\u3079\u3066\u63C3\u3063\u3066\u3044\u307E\u3059\u3002",
    "mkt.pricing.premium": "\u30D7\u30EC\u30DF\u30A2\u30E0",
    "mkt.pricing.premiumDesc": "\u9AD8\u5EA6\u306AAI\u51E6\u7406\u3068\u30EA\u30E2\u30FC\u30C8\u30A2\u30AF\u30BB\u30B9\u3002",
    "mkt.pricing.family": "\u5BB6\u65CF",
    "mkt.pricing.familyDesc": "\u6700\u59275\u3064\u306E\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u3001\u5B8C\u5168\u306A\u30A2\u30AF\u30BB\u30B9\u5236\u5FA1\u304C\u53EF\u80FD\u3067\u3059\u3002",
    "mkt.pricing.cta": "\u7121\u6599\u3067\u59CB\u3081\u308B",
    "mkt.testimonials.title": "\u30B9\u30DE\u30FC\u30C8\u30DB\u30FC\u30E0\u611B\u597D\u5BB6\u306B\u5927\u4EBA\u6C17",
    "mkt.testimonials.quote1": "NEXUS\u306E\u304A\u304B\u3052\u3067\u3001\u81EA\u5B85\u3068\u306E\u95A2\u308F\u308A\u65B9\u304C\u4E00\u5909\u3057\u307E\u3057\u305F\u3002\u3059\u3079\u3066\u304C\u30ED\u30FC\u30AB\u30EB\u3067\u51E6\u7406\u3055\u308C\u308B\u305F\u3081\u3001\u51E6\u7406\u901F\u5EA6\u304C\u683C\u6BB5\u306B\u5411\u4E0A\u3057\u307E\u3057\u305F\u3002",
    "mkt.testimonials.author1": "\u30B5\u30E9\u30FB\u30B8\u30A7\u30F3\u30AD\u30F3\u30B9",
    "mkt.testimonials.role1": "\u30A2\u30FC\u30EA\u30FC\u30A2\u30C0\u30D7\u30BF\u30FC",
    "mkt.testimonials.quote2": "\u3064\u3044\u306B\u3001\u79C1\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u3092\u5C0A\u91CD\u3057\u3066\u304F\u308C\u308B\u30B9\u30DE\u30FC\u30C8\u30DB\u30FC\u30E0\u30CF\u30D6\u304C\u767B\u5834\u3057\u307E\u3057\u305F\u3002\u30ED\u30FC\u30AB\u30EB\u3067\u306EAI\u51E6\u7406\u306E\u53CD\u5FDC\u304C\u9A5A\u304F\u307B\u3069\u901F\u3044\u3067\u3059\u3002",
    "mkt.testimonials.author2": "\u30C7\u30D3\u30C3\u30C9\u30FB\u30C1\u30A7\u30F3",
    "mkt.testimonials.role2": "\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u30A8\u30F3\u30B8\u30CB\u30A2",
    "mkt.testimonials.quote3": "\u8907\u96D1\u306A\u30EB\u30FC\u30C1\u30F3\u8A2D\u5B9A\u3082\u3042\u3063\u3068\u3044\u3046\u9593\u306B\u5B8C\u4E86\u3057\u307E\u3059\u3002\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u304C\u5207\u65AD\u3055\u308C\u3066\u3082\u52D5\u4F5C\u304C\u6B62\u307E\u3089\u306A\u3044\u3068\u3053\u308D\u304C\u6C17\u306B\u5165\u3063\u3066\u3044\u307E\u3059\u3002",
    "mkt.testimonials.author3": "\u30A8\u30DE\u30FB\u30C8\u30F3\u30D7\u30BD\u30F3",
    "mkt.testimonials.role3": "\u30B9\u30DE\u30FC\u30C8\u30DB\u30FC\u30E0\u611B\u597D\u5BB6",
    "mkt.integrations.title": "\u304A\u6C17\u306B\u5165\u308A\u306E\u30C7\u30D0\u30A4\u30B9\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u3059",
    "mkt.changelog.title": "v3.14.2\u306E\u65B0\u6A5F\u80FD",
    "mkt.requirements.title": "\u30B7\u30B9\u30C6\u30E0\u8981\u4EF6",
    "mkt.requirements.desc": "64\u30D3\u30C3\u30C8OS\u304A\u3088\u30732GB\u4EE5\u4E0A\u306ERAM\u304C\u5FC5\u8981\u3067\u3059\u3002",
    "mkt.footer.desc": "\u3042\u306A\u305F\u306E\u305F\u3081\u306E\u300C\u97F3\u58F0\u512A\u5148\u300D\u306E\u30D1\u30FC\u30BD\u30CA\u30EB\u30DB\u30FC\u30E0OS\u3002\u5B8C\u5168\u306B\u30ED\u30FC\u30AB\u30EB\u3067\u3001\u3059\u3079\u3066\u3042\u306A\u305F\u3060\u3051\u306E\u3082\u306E\u3067\u3059\u3002",
    "mkt.footer.product": "\u88FD\u54C1",
    "mkt.footer.company": "\u4F1A\u793E\u60C5\u5831\u30FB\u6CD5\u52D9",
    "mkt.footer.about": "\u5F53\u793E\u306B\u3064\u3044\u3066",
    "mkt.footer.privacy": "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC",
    "mkt.footer.terms": "\u5229\u7528\u898F\u7D04",
    "mkt.footer.noCookies": "\u5F53\u30B5\u30A4\u30C8\u3067\u306F\u30AF\u30C3\u30AD\u30FC\u3092\u4E00\u5207\u4F7F\u7528\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
    "mkt.cookie.title": "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u3068\u30AF\u30C3\u30AD\u30FC",
    "mkt.cookie.desc": "\u5F53\u30B5\u30A4\u30C8\u3067\u306F\u3001\u30B5\u30FC\u30D3\u30B9\u306E\u63D0\u4F9B\u306B\u4E0D\u53EF\u6B20\u306A\u30AF\u30C3\u30AD\u30FC\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\u5F15\u304D\u7D9A\u304D\u3054\u5229\u7528\u3044\u305F\u3060\u304F\u3053\u3068\u3067\u3001\u3053\u308C\u3089\u306E\u5FC5\u8981\u306A\u6280\u8853\u306E\u4F7F\u7528\u306B\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u307F\u306A\u3055\u308C\u307E\u3059\u3002",
    "mkt.cookie.accept": "\u4E86\u89E3\u3057\u307E\u3057\u305F",
    "mkt.cookie.decline": "\u8A2D\u5B9A",
    "mkt.feat.why": "NEXUS\u3092\u9078\u3076\u7406\u7531",
    "mkt.feat.1.title": "\u97F3\u58F0\u512A\u5148\u306E\u64CD\u4F5C",
    "mkt.feat.1.desc": "\u3054\u81EA\u5B85\u3068\u81EA\u7136\u306B\u8ABF\u548C\u3057\u307E\u3057\u3087\u3046\u3002",
    "mkt.feat.2.title": "\u8A2D\u8A08\u4E0A\u3001\u975E\u516C\u958B",
    "mkt.feat.2.desc": "\u30AF\u30E9\u30A6\u30C9\u3082\u30ED\u30B0\u8A18\u9332\u3082\u306A\u3057\u3002\u30ED\u30FC\u30AB\u30EB\u3067\u306E\u6697\u53F7\u5316\u306E\u307F\u3002",
    "mkt.feat.3.title": "\u76F8\u4E92\u904B\u7528\u53EF\u80FD",
    "mkt.feat.3.desc": "Matter\u3001Zigbee\u3001Z-Wave\u306A\u3069\u3001500\u4EE5\u4E0A\u306E\u30D7\u30ED\u30C8\u30B3\u30EB\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u3059\u3002",
    "mkt.feat.4.title": "\u898B\u3048\u306A\u3044AI",
    "mkt.feat.4.desc": "\u30D0\u30C3\u30AF\u30B0\u30E9\u30A6\u30F3\u30C9\u3067\u52D5\u4F5C\u3057\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u7FD2\u6163\u3092\u5B66\u7FD2\u3057\u307E\u3059\u3002",
    "mkt.faq.title": "\u3088\u304F\u3042\u308B\u8CEA\u554F",
    "mkt.faq.1.q": "NEXUS\u306F\u5B8C\u5168\u306B\u7121\u6599\u3067\u3059\u304B\uFF1F",
    "mkt.faq.1.a": "\u306F\u3044\u3002OS\u306E\u30B3\u30A2\u6A5F\u80FD\u3068\u30ED\u30FC\u30AB\u30EB\u5236\u5FA1\u6A5F\u80FD\u306F\u3001\u3059\u3079\u3066\u7121\u6599\u3067\u3054\u5229\u7528\u3044\u305F\u3060\u3051\u307E\u3059\u3002",
    "mkt.faq.2.q": "\u3069\u306E\u30C7\u30D0\u30A4\u30B9\u304C\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u3059\u304B\uFF1F",
    "mkt.faq.2.a": "Matter\u3001Zigbee\u3001Z-Wave\u5BFE\u5FDC\u30C7\u30D0\u30A4\u30B9\u3001\u304A\u3088\u3073500\u4EE5\u4E0A\u306EAPI\u30D9\u30FC\u30B9\u306E\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0\u3002",
    "mkt.faq.3.q": "\u30AF\u30E9\u30A6\u30C9\u306B\u63A5\u7D9A\u3057\u3066\u3044\u306A\u304F\u3066\u3082\u52D5\u4F5C\u3057\u307E\u3059\u304B\uFF1F",
    "mkt.faq.3.a": "\u306F\u3044\u3002\u30ED\u30FC\u30AB\u30EB\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3092\u4ECB\u3057\u3066\u304A\u4F7F\u3044\u306E\u30C7\u30D0\u30A4\u30B9\u3068\u901A\u4FE1\u3059\u308B\u305F\u3081\u3001\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8\u304C\u5207\u65AD\u3055\u308C\u3066\u3082\u6B63\u5E38\u306B\u52D5\u4F5C\u3057\u307E\u3059\u3002",
    "mkt.faq.4.q": "\u30EA\u30E2\u30FC\u30C8\u30A2\u30AF\u30BB\u30B9\u306F\u3069\u306E\u3088\u3046\u306B\u63D0\u4F9B\u3055\u308C\u307E\u3059\u304B\uFF1F",
    "mkt.faq.4.a": "\u30D7\u30EC\u30DF\u30A2\u30E0\u30D7\u30E9\u30F3\u3001\u307E\u305F\u306F\u3054\u81EA\u8EAB\u306EVPN\u3092\u5229\u7528\u3057\u305F\u3001\u5B89\u5168\u306A\u30A8\u30F3\u30C9\u30C4\u30FC\u30A8\u30F3\u30C9\u6697\u53F7\u5316\u30C8\u30F3\u30CD\u30EB\u3092\u901A\u3058\u3066\u3002",
    "mkt.desktop.eyebrow": "\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7",
    "mkt.desktop.title": "\u3059\u3079\u3066\u306E\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u306B1\u3064\u306E\u30A2\u30D7\u30EA",
    "mkt.desktop.desc": "Windows\u3001macOS\u3001Linux \u5411\u3051\u306E\u30CD\u30A4\u30C6\u30A3\u30D6\u30D3\u30EB\u30C9 \u2014 \u305D\u308C\u305E\u308C\u304C\u5404\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306B\u5408\u308F\u305B\u3066\u6700\u9069\u5316\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Windows 10 \u304A\u3088\u3073 11 \u306B\u6700\u9069\u5316\u3055\u308C\u3066\u304A\u308A\u3001\u30D0\u30C3\u30AF\u30B0\u30E9\u30A6\u30F3\u30C9\u3067\u306E\u52D5\u4F5C\u3082\u30B9\u30E0\u30FC\u30BA\u3067\u3059\u3002",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Apple Silicon\u304A\u3088\u3073Intel\u5411\u3051\u306B\u8A2D\u8A08\u3055\u308C\u3001\u30B7\u30B9\u30C6\u30E0\u3068\u306E\u6DF1\u3044\u7D71\u5408\u3092\u5B9F\u73FE\u3057\u3066\u3044\u307E\u3059\u3002",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "\u8EFD\u91CF\u3067\u9AD8\u901F\u3001\u304B\u3064\u4E3B\u8981\u306A\u30C7\u30A3\u30B9\u30C8\u30EA\u30D3\u30E5\u30FC\u30B7\u30E7\u30F3\u3059\u3079\u3066\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u3059\u3002",
    "mkt.desktop.download": "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "mkt.mobile.eyebrow": "\u30E2\u30D0\u30A4\u30EB",
    "mkt.mobile.title": "\u30DD\u30B1\u30C3\u30C8\u306E\u4E2D\u306E\u6211\u304C\u5BB6",
    "mkt.mobile.desc": "NEXUS\u306E\u30B3\u30F3\u30D1\u30CB\u30AA\u30F3\u30A2\u30D7\u30EA\u3092\u4F7F\u3048\u3070\u3001\u3069\u3053\u306B\u3044\u3066\u3082\u6307\u5148\u3072\u3068\u3064\u3067\u64CD\u4F5C\u304C\u53EF\u80FD\u3067\u3059\u3002",
    "mkt.mobile.feat1.title": "\u5916\u51FA\u5148\u3067\u306E\u901A\u8A71",
    "mkt.mobile.feat1.desc": "\u7AEF\u672B\u306B\u642D\u8F09\u3055\u308C\u305F\u97F3\u58F0\u8A8D\u8B58\u6A5F\u80FD\u3092\u4F7F\u3048\u3070\u3001\u3069\u3053\u304B\u3089\u3067\u3082\u81EA\u5B85\u3068\u4F1A\u8A71\u3067\u304D\u307E\u3059\u3002",
    "mkt.mobile.feat2.title": "\u30EA\u30E2\u30FC\u30C8\u30A2\u30AF\u30BB\u30B9",
    "mkt.mobile.feat2.desc": "\u6697\u53F7\u5316\u3055\u308C\u305F\u30C8\u30F3\u30CD\u30EB\u3092\u4ECB\u3057\u3066\u3001\u81EA\u5B85\u306E\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u306B\u5B89\u5168\u306B\u63A5\u7D9A\u3067\u304D\u307E\u3059\u3002",
    "mkt.mobile.feat3.title": "\u30D7\u30C3\u30B7\u30E5\u901A\u77E5",
    "mkt.mobile.feat3.desc": "\u3042\u306A\u305F\u306B\u3068\u3063\u3066\u91CD\u8981\u306A\u30A4\u30D9\u30F3\u30C8\u306B\u95A2\u3059\u308B\u901A\u77E5\u3092\u5373\u5EA7\u306B\u53D7\u3051\u53D6\u308B\u3053\u3068\u304C\u3067\u304D\u307E\u3059\u3002",
    "mkt.mobile.feat4.title": "\u751F\u4F53\u8A8D\u8A3C\u30ED\u30C3\u30AF",
    "mkt.mobile.feat4.desc": "Face ID\u3068\u6307\u7D0B\u8A8D\u8A3C\u306B\u3088\u308A\u3001\u30DB\u30FC\u30E0\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u304C\u5B88\u3089\u308C\u307E\u3059\u3002",
    "mkt.cta.title": "\u81EA\u5206\u306E\u5BB6\u306A\u3089\u3001\u81EA\u5206\u306E\u30EB\u30FC\u30EB\u3002",
    "mkt.cta.desc": "NEXUS\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u3001\u3059\u3079\u3066\u306E\u30C7\u30D0\u30A4\u30B9\u30921\u304B\u6240\u304B\u3089\u4E00\u5143\u7BA1\u7406\u3057\u307E\u3057\u3087\u3046\u3002",
    "mkt.cta.button": "\u7121\u6599\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "mkt.footer.platforms": "\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0",
    "Dim living room lights": "\u30EA\u30D3\u30F3\u30B0\u306E\u7167\u660E\u3092\u6697\u304F\u3059\u308B",
    "Start morning news briefing": "\u671D\u306E\u30CB\u30E5\u30FC\u30B9\u30D6\u30EA\u30FC\u30D5\u30A3\u30F3\u30B0\u3092\u958B\u59CB\u3059\u308B",
    "Movie night": "\u6620\u753B\u9451\u8CDE\u4F1A",
    "Good morning": "\u304A\u306F\u3088\u3046\u3054\u3056\u3044\u307E\u3059",
    "Leaving home": "\u5BB6\u3092\u51FA\u308B",
    "status.pctOnline": "{pct}% \u30AA\u30F3\u30E9\u30A4\u30F3",
    "status.offlineCount": "{count} \u30AA\u30D5\u30E9\u30A4\u30F3",
    "status.allOnline": "\u30AA\u30F3\u30E9\u30A4\u30F3\u4E2D\u306E\u3059\u3079\u3066\u306E\u30C7\u30D0\u30A4\u30B9",
    "status.suggestionReady": "{count}\u306B\u95A2\u3059\u308B\u63D0\u6848\u3092\u3054\u7528\u610F\u3057\u307E\u3057\u305F\u3002",
    "status.suggestionsReady": "{count}\u306B\u95A2\u3059\u308B\u63D0\u6848\u3092\u3054\u7528\u610F\u3057\u307E\u3057\u305F\u3002",
    "status.caughtUp": "\u3053\u308C\u3067\u5168\u90E8\u8FFD\u3044\u3064\u304D\u307E\u3057\u305F\u3002",
    "status.onlineOfTotal": "{online}/{total} \u30AA\u30F3\u30E9\u30A4\u30F3",
    "mobile.menu": "\u30E1\u30CB\u30E5\u30FC",
    "mobile.more": "\u3082\u3063\u3068\u898B\u308B",
    "mobile.systemStatus": "NEXUS\u30B7\u30B9\u30C6\u30E0\u306E\u7A3C\u50CD\u72B6\u6CC1",
    "mobile.localNetwork": "\u30ED\u30FC\u30AB\u30EB\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u63A5\u7D9A",
    "mobile.offline": "100% \u30AA\u30D5\u30E9\u30A4\u30F3",
    "mobile.localAI": "\u30ED\u30FC\u30AB\u30EBAI\u30A8\u30F3\u30B8\u30F3",
    "mobile.deviceNetwork": "\u30C7\u30D0\u30A4\u30B9\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF",
    "mobile.online": "\u30AA\u30F3\u30E9\u30A4\u30F3",
    "mobile.quickControls": "\u30AF\u30A4\u30C3\u30AF\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB",
    "mobile.privacyShield": "\u30AA\u30D5\u30E9\u30A4\u30F3\u30FB\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30FB\u30B7\u30FC\u30EB\u30C9",
    "mobile.active": "\u30A2\u30AF\u30C6\u30A3\u30D6",
    "mobile.voiceWake": "\u97F3\u58F0\u8D77\u52D5\uFF08\u300CNEXUS\u300D\uFF09",
    "mobile.on": "\u306B\u3064\u3044\u3066",
    "mobile.autoBackup": "\u81EA\u52D5\u30DB\u30FC\u30E0\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7",
    "mobile.backupTime": "\u6BCE\u65E5 03:00",
    "mobile.moreSub.suggestions": "\u4E88\u5B9A\u3055\u308C\u3066\u3044\u308B\u30B9\u30DE\u30FC\u30C8\u30AA\u30FC\u30C8\u30E1\u30FC\u30B7\u30E7\u30F3\u306E\u63D0\u6848 3\u4EF6",
    "mobile.moreSub.skills": "\u80FD\u52D5\u614B\u306E5\u3064\u306E\u6D3B\u7528\u6CD5\u3068\u5B9F\u8DF5\u4F8B",
    "mobile.moreSub.personalization": "\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u540D\u3001\u97F3\u58F0\u30E2\u30C7\u30EB\u3001\u304A\u3088\u3073\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u8A2D\u5B9A",
    "mobile.moreSub.billing": "NEXUS \u30D5\u30A1\u30DF\u30EA\u30FC\u30D7\u30E9\u30F3\u30FB\u6709\u52B9\u306A\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3",
    "mobile.moreSub.downloads": "3\u3064\u306EOS\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u30EA\u30EA\u30FC\u30B9\u3068SHA-256\u306B\u3088\u308B\u691C\u8A3C",
    "mobile.moreSub.platform": "\u30AF\u30ED\u30B9\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3067\u306E\u30C7\u30D0\u30A4\u30B9\u540C\u671F",
    "mobile.moreSub.agents": "\u81EA\u5F8B\u578BAI\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
    "mobile.moreSub.admin": "\u30B7\u30B9\u30C6\u30E0\u7BA1\u7406\u3068\u30E1\u30C8\u30EA\u30AF\u30B9",
    "desktop.title": "\u30D1\u30FC\u30BD\u30CA\u30EB\u30FB\u30AA\u30DA\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30FB\u30B7\u30B9\u30C6\u30E0",
    "setup.welcome": "\u3088\u3046\u3053\u305D",
    "setup.license": "\u30E9\u30A4\u30BB\u30F3\u30B9",
    "setup.location": "\u5834\u6240",
    "setup.installing": "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
    "setup.finish": "\u7D42\u4E86",
    "setup.welcomeTitle": "NEXUS\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u3078\u3088\u3046\u3053\u305D",
    "setup.welcomeDesc": "\u3053\u306E\u30A6\u30A3\u30B6\u30FC\u30C9\u306F\u3001\u3054\u5BB6\u5EAD\u5411\u3051\u306E\u30D1\u30FC\u30BD\u30CA\u30EB\u30AA\u30DA\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30B7\u30B9\u30C6\u30E0\u300CNEXUS AI\u300D\u306E\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u624B\u9806\u3092\u3054\u6848\u5185\u3057\u307E\u3059\u3002",
    "setup.accept": "\u5229\u7528\u8A31\u8AFE\u5951\u7D04\u306B\u540C\u610F\u3057\u307E\u3059",
    "setup.chooseFolder": "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5148\u30D5\u30A9\u30EB\u30C0\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    "setup.installBtn": "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
    "setup.complete": "\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F",
    "setup.launchNow": "\u4ECA\u3059\u3050NEXUS\u3092\u8D77\u52D5"
  },
  // ── Korean ──
  ko: {
    "app.greeting": "\uC548\uB155\uD558\uC138\uC694, {name} \uB2D8, \uBB34\uC5C7\uC744 \uB3C4\uC640\uB4DC\uB9B4\uAE4C\uC694?",
    "app.confirmNeeded": "{name}, \uD574\uB2F9 \uC791\uC5C5\uC5D0 \uB300\uD55C \uADC0\uD558\uC758 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    "download.title": "NEXUS \uB2E4\uC6B4\uB85C\uB4DC",
    "download.primaryButton": "{os}\uC6A9 \uB2E4\uC6B4\uB85C\uB4DC",
    "download.otherOs": "\uB2E4\uB978 \uC6B4\uC601 \uCCB4\uC81C\uB97C \uC0AC\uC6A9 \uC911\uC774\uC2E0\uAC00\uC694?",
    "download.checksum": "SHA-256 \uCCB4\uD06C\uC12C",
    "screen.today": "\uC624\uB298",
    "screen.homeState": "\uD648",
    "screen.suggestions": "\uC81C\uC548 \uC0AC\uD56D",
    "screen.skills": "\uAE30\uC220",
    "screen.family": "\uAC00\uC871",
    "screen.devices": "\uAE30\uAE30",
    "screen.platform": "\uD50C\uB7AB\uD3FC",
    "screen.agents": "\uC5D0\uC774\uC804\uD2B8",
    "screen.personalization": "\uAC1C\uC778\uD654",
    "screen.billing": "\uAD6C\uB3C5",
    "screen.downloadCenter": "\uB2E4\uC6B4\uB85C\uB4DC",
    "screen.adminDashboard": "\uAD00\uB9AC\uC790 \uB300\uC2DC\uBCF4\uB4DC",
    "today.devicesOnline": "\uC628\uB77C\uC778 \uC0C1\uD0DC\uC778 \uAE30\uAE30",
    "today.energy": "\uC624\uB298\uC758 \uC5D0\uB108\uC9C0",
    "today.activeRoutines": "\uD65C\uB3D9\uC801\uC778 \uC77C\uC0C1",
    "today.suggestions": "\uC81C\uC548 \uC0AC\uD56D",
    "screen.devices.empty": "\uC544\uC9C1 \uC5F0\uACB0\uB41C \uAE30\uAE30\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    "screen.agents.empty": "\uC544\uC9C1 \uC5D0\uC774\uC804\uD2B8\uAC00 \uAD6C\uC131\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
    "screen.suggestions.empty": "\uC544\uC9C1 \uC81C\uC548\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 NEXUS AI\uB294 \uC544\uC9C1 \uD559\uC2B5 \uC911\uC785\uB2C8\uB2E4.",
    "screen.skills.empty": "\uC544\uC9C1 \uBC30\uC6B4 \uAE30\uC220\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    "screen.homeState.empty": "\uC544\uC9C1 \uAE30\uAE30\uAC00 \uC124\uCE58\uB41C \uAC1D\uC2E4\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    "plan.free": "\uBB34\uB8CC",
    "plan.premium": "\uD504\uB9AC\uBBF8\uC5C4",
    "plan.family": "\uAC00\uC871",
    "billing.manage": "\uAD6C\uB3C5 \uAD00\uB9AC",
    "auth.tagline": "\uAC00\uC815\uC6A9 \uB9DE\uCDA4\uD615 \uC6B4\uC601 \uCCB4\uC81C",
    "auth.signInTitle": "NEXUS\uC5D0 \uB85C\uADF8\uC778\uD558\uC138\uC694",
    "auth.signUpTitle": "NEXUS \uACC4\uC815 \uB9CC\uB4E4\uAE30",
    "auth.email": "\uC774\uBA54\uC77C",
    "auth.password": "\uBE44\uBC00\uBC88\uD638",
    "auth.signInButton": "\uB85C\uADF8\uC778",
    "auth.signUpButton": "\uACC4\uC815 \uB9CC\uB4E4\uAE30",
    "auth.switchToSignUp": "\uCC98\uC74C \uBC29\uBB38\uD558\uC168\uB098\uC694? \uACC4\uC815\uC744 \uB9CC\uB4DC\uC138\uC694",
    "auth.switchToSignIn": "\uC774\uBBF8 \uACC4\uC815\uC774 \uC788\uC73C\uC2E0\uAC00\uC694? \uB85C\uADF8\uC778\uD558\uC138\uC694",
    "auth.passwordHint": "\uCD5C\uC18C 8\uC790",
    "auth.genericError": "\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    "auth.locked": "\uC2E4\uD328\uD55C \uC2DC\uB3C4\uAC00 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. {time}\uC5D0\uC11C \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    "auth.rateLimited": "\uC694\uCCAD \uAC74\uC218\uAC00 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    "auth.logout": "\uB85C\uADF8\uC544\uC6C3",
    "auth.welcome": "{name} \uB2D8, \uD658\uC601\uD569\uB2C8\uB2E4.",
    "auth.continue": "\uACC4\uC18D",
    "auth.guest": "\uAC8C\uC2A4\uD2B8\uB85C \uACC4\uC18D\uD558\uAE30",
    "auth.guestHint": "\uACC4\uC815 \uC5C6\uC774 NEXUS \uB458\uB7EC\uBCF4\uAE30",
    "auth.social.divider": "\uB610\uB294 \uC774\uBA54\uC77C\uB85C \uACC4\uC18D\uD558\uAE30",
    "auth.social.google": "Google\uB85C \uACC4\uC18D\uD558\uAE30",
    "auth.social.apple": "Apple\uB85C \uACC4\uC18D\uD558\uAE30",
    "auth.social.unavailable": "\uC774 \uB85C\uADF8\uC778 \uBC29\uBC95\uC740 \uC544\uC9C1 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
    "auth.social.error": "\uD574\uB2F9 \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC5C5\uCCB4\uB97C \uD1B5\uD55C \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
    "mkt.nav.features": "\uC8FC\uC694 \uAE30\uB2A5",
    "mkt.nav.pricing": "\uAC00\uACA9",
    "mkt.nav.testimonials": "\uACE0\uAC1D \uD6C4\uAE30",
    "mkt.nav.integrations": "\uC5F0\uB3D9 \uAE30\uB2A5",
    "mkt.nav.about": "\uD68C\uC0AC \uC18C\uAC1C",
    "mkt.nav.download": "\uB2E4\uC6B4\uB85C\uB4DC",
    "mkt.nav.faq": "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38",
    "mkt.nav.signIn": "\uB85C\uADF8\uC778",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\uC18C\uC720\uD558\uACE0 \uACC4\uC2E0 \uBAA8\uB4E0 \uAE30\uAE30\uC5D0 NEXUS\uB97C \uB2E4\uC6B4\uB85C\uB4DC\uD558\uC138\uC694",
    "mkt.hero.desc": "NEXUS\uB294 \uC74C\uC131 \uC911\uC2EC\uC774\uBA70 \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638\uC5D0 \uC911\uC810\uC744 \uB454 \uAC1C\uC778\uC6A9 \uC6B4\uC601 \uCCB4\uC81C\uC785\uB2C8\uB2E4. \uB370\uC2A4\uD06C\uD1B1 \uC571\uC774\uB098 \uBAA8\uBC14\uC77C \uB3D9\uBC18 \uC571\uC744 \uC124\uCE58\uD558\uBA74 \uBAA8\uB4E0 \uAE30\uAE30\uB97C \uD55C \uACF3\uC5D0\uC11C \uC81C\uC5B4\uD560 \uC218 \uC788\uC73C\uBA70, \uBAA8\uB4E0 \uCC98\uB9AC\uB294 100% \uAE30\uAE30 \uB0B4\uC5D0\uC11C \uC774\uB8E8\uC5B4\uC9D1\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC544\uB2CC \uC2E4\uC81C \uC571\uC744 \uD1B5\uD574 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    "mkt.hero.actionPrimary": "{os} \xB7 v{version}\uC6A9 \uB2E4\uC6B4\uB85C\uB4DC",
    "mkt.hero.actionSecondary": "\uC2E4\uC81C \uC791\uB3D9 \uBAA8\uC2B5\uC744 \uD655\uC778\uD574 \uBCF4\uC138\uC694",
    "mkt.hero.trust": "\u2605 50\uB9CC \uBA85 \uC774\uC0C1\uC758 \uC0AC\uC6A9\uC790 \xB7 2,000\uAC1C \uC774\uC0C1\uC758 \uC2A4\uB9C8\uD2B8 \uAE30\uAE30 \xB7 100% \uB85C\uCEEC \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638",
    "mkt.stats.title": "NEXUS\uC758 \uC8FC\uC694 \uC218\uCE58",
    "mkt.stats.users": "\uD65C\uC131 \uC0AC\uC6A9\uC790",
    "mkt.stats.devices": "\uC9C0\uC6D0\uB418\uB294 \uAE30\uAE30",
    "mkt.stats.privacy": "\uAE30\uAE30 \uB0B4 \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638",
    "mkt.stats.rating": "\uD3C9\uADE0 \uD3C9\uC810",
    "mkt.privacy.title": "\uB370\uC774\uD130\uB294 \uC5EC\uB7EC\uBD84\uC758 \uAC83\uC785\uB2C8\uB2E4",
    "mkt.privacy.processing": "100% \uAE30\uAE30 \uB0B4 \uCC98\uB9AC",
    "mkt.privacy.encryption": "\uC885\uB2E8 \uAC04 \uB85C\uCEEC \uC554\uD638\uD654",
    "mkt.privacy.logging": "\uD074\uB77C\uC6B0\uB4DC \uB85C\uAE45 \uC5C6\uC74C",
    "mkt.how.title": "\uC791\uB3D9 \uC6D0\uB9AC",
    "mkt.how.step1.title": "\uB2E4\uC6B4\uB85C\uB4DC",
    "mkt.how.step1.desc": "\uC0AC\uC6A9 \uC911\uC778 \uD50C\uB7AB\uD3FC\uC5D0 \uB9DE\uB294 \uC571\uC744 \uB2E4\uC6B4\uB85C\uB4DC\uD558\uC138\uC694.",
    "mkt.how.step2.title": "\uC124\uCE58",
    "mkt.how.step2.desc": "\uBA87 \uCD08 \uB9CC\uC5D0 \uB85C\uCEEC \uC124\uC815\uC744 \uC644\uB8CC\uD558\uC138\uC694.",
    "mkt.how.step3.title": "\uAE30\uAE30 \uC5F0\uACB0",
    "mkt.how.step3.desc": "\uC9C0\uAE08\uBD80\uD130 \uC2A4\uB9C8\uD2B8 \uD648\uC744 \uC548\uC804\uD558\uAC8C \uAD00\uB9AC\uD574 \uBCF4\uC138\uC694.",
    "mkt.preview.title": "NEXUS\uC758 \uC2E4\uC81C \uC791\uB3D9 \uBAA8\uC2B5\uC744 \uD655\uC778\uD574 \uBCF4\uC138\uC694",
    "mkt.preview.desc": "\uC571\uC744 \uC124\uCE58\uD558\uB294 \uC21C\uAC04 \uBC14\uB85C \uD655\uC778\uD560 \uC218 \uC788\uB294 \uC2E4\uC81C \uB300\uC2DC\uBCF4\uB4DC\uC758 \uC0DD\uC0DD\uD55C \uBAA8\uC2B5\uC785\uB2C8\uB2E4.",
    "mkt.preview.tab.today": "\uC624\uB298",
    "mkt.preview.tab.devices": "\uAE30\uAE30",
    "mkt.preview.tab.skills": "\uC77C\uC0C1 \uB8E8\uD2F4",
    "mkt.preview.tab.family": "\uAC00\uC871",
    "mkt.download.mobile.title": "\uBAA8\uBC14\uC77C \uC571",
    "mkt.download.mobile.desc": "iOS \uBC0F Android \uC571\uC774 \uACE7 \uCD9C\uC2DC\uB420 \uC608\uC815\uC785\uB2C8\uB2E4.",
    "mkt.download.mobile.apple": "\uC5D0\uC11C \uB2E4\uC6B4\uB85C\uB4DC\uD558\uC138\uC694",
    "mkt.download.mobile.appleStore": "\uC571 \uC2A4\uD1A0\uC5B4",
    "mkt.download.mobile.google": "\uC9C0\uAE08 \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\uACE7",
    "mkt.seo.title": "NEXUS \u2014 \uB098\uB9CC\uC758 \uC6B4\uC601 \uCCB4\uC81C\uB97C \uB2E4\uC6B4\uB85C\uB4DC\uD558\uC138\uC694",
    "mkt.seo.desc": "Windows, macOS \uBC0F Linux\uC6A9 NEXUS\uB97C \uB2E4\uC6B4\uB85C\uB4DC\uD558\uC138\uC694. iOS \uBC0F Android \uBC84\uC804\uC740 \uACE7 \uCD9C\uC2DC\uB420 \uC608\uC815\uC785\uB2C8\uB2E4.",
    "mkt.skipToContent": "\uBCF8\uBB38\uC73C\uB85C \uAC74\uB108\uB6F0\uAE30",
    "mkt.pricing.title": "\uAC04\uB2E8\uD558\uACE0 \uD22C\uBA85\uD55C \uAC00\uACA9 \uC815\uCC45",
    "mkt.pricing.free": "\uBB34\uB8CC",
    "mkt.pricing.freeDesc": "\uC9C0\uC5ED \uAE30\uBC18 \uC2A4\uB9C8\uD2B8 \uD648\uC744 \uAD6C\uCD95\uD558\uB294 \uB370 \uD544\uC694\uD55C \uBAA8\uB4E0 \uAC83.",
    "mkt.pricing.premium": "\uD504\uB9AC\uBBF8\uC5C4",
    "mkt.pricing.premiumDesc": "\uACE0\uAE09 AI \uCC98\uB9AC \uBC0F \uC6D0\uACA9 \uC561\uC138\uC2A4.",
    "mkt.pricing.family": "\uAC00\uC871",
    "mkt.pricing.familyDesc": "\uCD5C\uB300 5\uAC1C\uC758 \uACC4\uC815\uC5D0 \uB300\uD55C \uC644\uC804\uD55C \uC811\uADFC \uAD8C\uD55C \uC81C\uC5B4.",
    "mkt.pricing.cta": "\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30",
    "mkt.testimonials.title": "\uC2A4\uB9C8\uD2B8 \uD648 \uC560\uD638\uAC00\uB4E4\uC5D0\uAC8C \uC0AC\uB791\uBC1B\uB294",
    "mkt.testimonials.quote1": "NEXUS \uB355\uBD84\uC5D0 \uC9D1\uC548\uC5D0\uC11C \uC0DD\uD65C\uD558\uB294 \uBC29\uC2DD\uC774 \uC644\uC804\uD788 \uBC14\uB00C\uC5C8\uC2B5\uB2C8\uB2E4. \uBAA8\uB4E0 \uAC83\uC774 \uB85C\uCEEC\uC5D0\uC11C \uCC98\uB9AC\uB418\uB2C8 \uC18D\uB3C4\uAC00 \uD6E8\uC52C \uB354 \uBE60\uB985\uB2C8\uB2E4.",
    "mkt.testimonials.author1": "\uC0AC\uB77C \uC820\uD0A8\uC2A4",
    "mkt.testimonials.role1": "\uC5BC\uB9AC \uC5B4\uB2F5\uD130",
    "mkt.testimonials.quote2": "\uB4DC\uB514\uC5B4 \uB0B4 \uC0AC\uC0DD\uD65C\uC744 \uC874\uC911\uD574 \uC8FC\uB294 \uC2A4\uB9C8\uD2B8 \uD648 \uD5C8\uBE0C\uAC00 \uB098\uC654\uB124\uC694. \uB85C\uCEEC AI \uCC98\uB9AC \uC18D\uB3C4\uAC00 \uC815\uB9D0 \uB180\uB784 \uB9CC\uD07C \uBE60\uB985\uB2C8\uB2E4.",
    "mkt.testimonials.author2": "\uB370\uC774\uBE44\uB4DC \uCCB8",
    "mkt.testimonials.role2": "\uC18C\uD504\uD2B8\uC6E8\uC5B4 \uC5D4\uC9C0\uB2C8\uC5B4",
    "mkt.testimonials.quote3": "\uBCF5\uC7A1\uD55C \uB8E8\uD2F4\uC744 \uC124\uC815\uD558\uB294 \uAC83\uB3C4 \uC544\uC8FC \uAC04\uB2E8\uD569\uB2C8\uB2E4. \uC778\uD130\uB137 \uC5F0\uACB0\uC774 \uB04A\uACA8\uB3C4 \uC11C\uBE44\uC2A4\uAC00 \uC911\uB2E8\uB418\uC9C0 \uC54A\uB294 \uC810\uC774 \uC815\uB9D0 \uB9C8\uC74C\uC5D0 \uB4ED\uB2C8\uB2E4.",
    "mkt.testimonials.author3": "\uC5E0\uB9C8 \uD1B0\uC2A8",
    "mkt.testimonials.role3": "\uC2A4\uB9C8\uD2B8 \uD648 \uC560\uD638\uAC00",
    "mkt.integrations.title": "\uC790\uC8FC \uC0AC\uC6A9\uD558\uB294 \uAE30\uAE30\uC640 \uD638\uD658\uB429\uB2C8\uB2E4",
    "mkt.changelog.title": "v3.14.2\uC758 \uC0C8\uB85C\uC6B4 \uAE30\uB2A5",
    "mkt.requirements.title": "\uC2DC\uC2A4\uD15C \uC694\uAD6C \uC0AC\uD56D",
    "mkt.requirements.desc": "64\uBE44\uD2B8 \uC6B4\uC601 \uCCB4\uC81C\uC640 \uCD5C\uC18C 2GB\uC758 RAM\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    "mkt.footer.desc": "\uC74C\uC131 \uC911\uC2EC\uC758 \uAC1C\uC778\uC6A9 \uD648 \uC6B4\uC601 \uCCB4\uC81C. \uC644\uC804\uD788 \uB85C\uCEEC\uC5D0\uC11C \uAD6C\uB3D9\uB418\uBA70, \uC804\uC801\uC73C\uB85C \uC5EC\uB7EC\uBD84\uC758 \uAC83\uC785\uB2C8\uB2E4.",
    "mkt.footer.product": "\uC81C\uD488",
    "mkt.footer.company": "\uD68C\uC0AC \uBC0F \uBC95\uC801 \uC815\uBCF4",
    "mkt.footer.about": "\uD68C\uC0AC \uC18C\uAC1C",
    "mkt.footer.privacy": "\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68",
    "mkt.footer.terms": "\uC774\uC6A9\uC57D\uAD00",
    "mkt.footer.noCookies": "\uC800\uD76C\uB294 \uCFE0\uD0A4\uB97C \uC804\uD600 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    "mkt.cookie.title": "\uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638 \uBC0F \uCFE0\uD0A4",
    "mkt.cookie.desc": "\uB2F9\uC0AC\uB294 \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC744 \uC704\uD574 \uD544\uC218 \uCFE0\uD0A4\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4. \uACC4\uC18D \uC774\uC6A9\uD558\uC2DC\uBA74, \uC774\uB7EC\uD55C \uD544\uC218 \uAE30\uC220\uC758 \uC0AC\uC6A9\uC5D0 \uB3D9\uC758\uD558\uB294 \uAC83\uC73C\uB85C \uAC04\uC8FC\uB429\uB2C8\uB2E4.",
    "mkt.cookie.accept": "\uC54C\uACA0\uC2B5\uB2C8\uB2E4",
    "mkt.cookie.decline": "\uC124\uC815",
    "mkt.feat.why": "NEXUS\uB97C \uC120\uD0DD\uD574\uC57C \uD558\uB294 \uC774\uC720",
    "mkt.feat.1.title": "\uC74C\uC131 \uC6B0\uC120 \uC81C\uC5B4",
    "mkt.feat.1.desc": "\uC9D1\uACFC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC18C\uD1B5\uD558\uC138\uC694.",
    "mkt.feat.2.title": "\uBCF8\uC9C8\uC801\uC73C\uB85C \uBE44\uACF5\uAC1C",
    "mkt.feat.2.desc": "\uD074\uB77C\uC6B0\uB4DC\uB3C4, \uB85C\uAE45\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4. \uC624\uC9C1 \uB85C\uCEEC \uC554\uD638\uD654\uB9CC \uC801\uC6A9\uB429\uB2C8\uB2E4.",
    "mkt.feat.3.title": "\uC0C1\uD638\uC6B4\uC6A9 \uAC00\uB2A5\uD55C",
    "mkt.feat.3.desc": "Matter, Zigbee, Z-Wave \uB4F1 500\uAC1C \uC774\uC0C1\uC758 \uD504\uB85C\uD1A0\uCF5C\uC744 \uC9C0\uC6D0\uD569\uB2C8\uB2E4.",
    "mkt.feat.4.title": "\uBCF4\uC774\uC9C0 \uC54A\uB294 AI",
    "mkt.feat.4.desc": "\uBC31\uADF8\uB77C\uC6B4\uB4DC\uC5D0\uC11C \uC2E4\uD589\uB418\uBA70 \uC0AC\uC6A9\uC790\uC758 \uC77C\uC0C1 \uD328\uD134\uC744 \uD559\uC2B5\uD569\uB2C8\uB2E4.",
    "mkt.faq.title": "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38",
    "mkt.faq.1.q": "NEXUS\uB294 \uC644\uC804\uD788 \uBB34\uB8CC\uC778\uAC00\uC694?",
    "mkt.faq.1.a": "\uB124. \uD575\uC2EC OS\uC640 \uB85C\uCEEC \uC81C\uC5B4 \uAE30\uB2A5\uC740 \uC644\uC804\uD788 \uBB34\uB8CC\uC785\uB2C8\uB2E4.",
    "mkt.faq.2.q": "\uC5B4\uB5A4 \uAE30\uAE30\uB97C \uC9C0\uC6D0\uD558\uB098\uC694?",
    "mkt.faq.2.a": "Matter, Zigbee, Z-Wave \uAE30\uAE30 \uBC0F 500\uAC1C \uC774\uC0C1\uC758 API \uAE30\uBC18 \uC0DD\uD0DC\uACC4.",
    "mkt.faq.3.q": "\uD074\uB77C\uC6B0\uB4DC\uC5D0 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC544\uB3C4 \uC791\uB3D9\uD558\uB098\uC694?",
    "mkt.faq.3.a": "\uB124. \uB85C\uCEEC \uB124\uD2B8\uC6CC\uD06C\uB97C \uD1B5\uD574 \uAE30\uAE30\uC640 \uD1B5\uC2E0\uD558\uBBC0\uB85C, \uC778\uD130\uB137\uC774 \uB04A\uACA8\uB3C4 \uC815\uC0C1\uC801\uC73C\uB85C \uC791\uB3D9\uD569\uB2C8\uB2E4.",
    "mkt.faq.4.q": "\uC6D0\uACA9 \uC811\uC18D\uC740 \uC5B4\uB5BB\uAC8C \uC81C\uACF5\uB418\uB098\uC694?",
    "mkt.faq.4.a": "\uD504\uB9AC\uBBF8\uC5C4 \uC694\uAE08\uC81C \uB610\uB294 \uC9C1\uC811 \uAD6C\uCD95\uD55C VPN\uC744 \uD1B5\uD574 \uC548\uC804\uD55C \uC885\uB2E8 \uAC04 \uC554\uD638\uD654 \uD130\uB110\uC744 \uC774\uC6A9\uD558\uC138\uC694.",
    "mkt.desktop.eyebrow": "\uB370\uC2A4\uD06C\uD1B1",
    "mkt.desktop.title": "\uBAA8\uB4E0 \uB370\uC2A4\uD06C\uD1B1\uC744 \uC704\uD55C \uD558\uB098\uC758 \uC571",
    "mkt.desktop.desc": "Windows, macOS, Linux\uC6A9 \uB124\uC774\uD2F0\uBE0C \uBE4C\uB4DC \u2014 \uAC01 \uD50C\uB7AB\uD3FC\uC5D0 \uCD5C\uC801\uD654\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Windows 10 \uBC0F 11\uC5D0 \uCD5C\uC801\uD654\uB418\uC5B4 \uC788\uC73C\uBA70, \uBC31\uADF8\uB77C\uC6B4\uB4DC\uC5D0\uC11C \uC6D0\uD65C\uD558\uAC8C \uC791\uB3D9\uD569\uB2C8\uB2E4.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Apple Silicon \uBC0F Intel\uC744 \uC704\uD574 \uC124\uACC4\uB418\uC5C8\uC73C\uBA70, \uC2DC\uC2A4\uD15C\uACFC \uAE34\uBC00\uD558\uAC8C \uD1B5\uD569\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
    "mkt.desktop.linux": "\uB9AC\uB205\uC2A4",
    "mkt.desktop.linuxDesc": "\uAC00\uBCCD\uACE0 \uBE60\uB974\uBA70, \uBAA8\uB4E0 \uC8FC\uC694 \uBC30\uD3EC\uD310\uACFC \uD638\uD658\uB429\uB2C8\uB2E4.",
    "mkt.desktop.download": "\uB2E4\uC6B4\uB85C\uB4DC",
    "mkt.mobile.eyebrow": "\uBAA8\uBC14\uC77C",
    "mkt.mobile.title": "\uC8FC\uBA38\uB2C8 \uC18D\uC758 \uC9D1",
    "mkt.mobile.desc": "NEXUS \uB3D9\uBC18\uC790 \uC571\uC744 \uC0AC\uC6A9\uD558\uBA74 \uC5B4\uB514\uC5D0 \uC788\uB4E0 \uC190\uB05D\uC73C\uB85C \uAC04\uD3B8\uD558\uAC8C \uC81C\uC5B4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    "mkt.mobile.feat1.title": "\uC774\uB3D9 \uC911\uC5D0\uB3C4 \uC74C\uC131 \uC774\uC6A9",
    "mkt.mobile.feat1.desc": "\uAE30\uAE30 \uB0B4 \uC74C\uC131 \uC778\uC2DD \uAE30\uB2A5\uC744 \uD1B5\uD574 \uC5B4\uB514\uC11C\uB098 \uC9D1\uACFC \uB300\uD654\uD558\uC138\uC694.",
    "mkt.mobile.feat2.title": "\uC6D0\uACA9 \uC811\uC18D",
    "mkt.mobile.feat2.desc": "\uC554\uD638\uD654\uB41C \uD130\uB110\uC744 \uD1B5\uD574 \uD648 \uB124\uD2B8\uC6CC\uD06C\uC5D0 \uC548\uC804\uD558\uAC8C \uC811\uC18D\uD558\uC138\uC694.",
    "mkt.mobile.feat3.title": "\uD478\uC2DC \uC54C\uB9BC",
    "mkt.mobile.feat3.desc": "\uC5EC\uB7EC\uBD84\uC5D0\uAC8C \uC911\uC694\uD55C \uC774\uBCA4\uD2B8\uC5D0 \uB300\uD55C \uC54C\uB9BC\uC744 \uC989\uC2DC \uBC1B\uC544\uBCF4\uC138\uC694.",
    "mkt.mobile.feat4.title": "\uC0DD\uCCB4 \uC778\uC2DD \uC7A0\uAE08 \uC7A5\uCE58",
    "mkt.mobile.feat4.desc": "Face ID\uC640 \uC9C0\uBB38 \uC778\uC2DD \uAE30\uB2A5\uC744 \uD1B5\uD574 \uD648 \uC81C\uC5B4 \uC815\uBCF4\uB97C \uC548\uC804\uD558\uAC8C \uBCF4\uD638\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    "mkt.cta.title": "\uB0B4 \uC9D1, \uB0B4 \uBC29\uC2DD.",
    "mkt.cta.desc": "NEXUS\uB97C \uB2E4\uC6B4\uB85C\uB4DC\uD558\uACE0 \uD55C \uACF3\uC5D0\uC11C \uBAA8\uB4E0 \uAE30\uAE30\uB97C \uAD00\uB9AC\uD558\uC138\uC694.",
    "mkt.cta.button": "\uBB34\uB8CC \uB2E4\uC6B4\uB85C\uB4DC",
    "mkt.footer.platforms": "\uD50C\uB7AB\uD3FC",
    "Dim living room lights": "\uAC70\uC2E4 \uC870\uBA85\uC744 \uC5B4\uB461\uAC8C \uD558\uC138\uC694",
    "Start morning news briefing": "\uC544\uCE68 \uBE0C\uB9AC\uD551 \uC2DC\uC791",
    "Movie night": "\uC601\uD654 \uAC10\uC0C1 \uBC24",
    "Good morning": "\uC88B\uC740 \uC544\uCE68\uC785\uB2C8\uB2E4",
    "Leaving home": "\uC9D1\uC744 \uB5A0\uB098\uBA70",
    "status.pctOnline": "{pct}% \uC628\uB77C\uC778",
    "status.offlineCount": "{count} \uC624\uD504\uB77C\uC778",
    "status.allOnline": "\uC628\uB77C\uC778 \uC0C1\uD0DC\uC778 \uBAA8\uB4E0 \uAE30\uAE30",
    "status.suggestionReady": "{count}\uC5D0 \uB300\uD55C \uC81C\uC548\uC774 \uC900\uBE44\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    "status.suggestionsReady": "{count}\uC5D0 \uB300\uD55C \uC81C\uC548 \uC0AC\uD56D\uC744 \uC900\uBE44\uD574 \uB450\uC5C8\uC2B5\uB2C8\uB2E4.",
    "status.caughtUp": "\uC774\uC81C \uB2E4 \uB530\uB77C\uC7A1\uC73C\uC168\uB124\uC694.",
    "status.onlineOfTotal": "{online}/{total} \uC628\uB77C\uC778",
    "mobile.menu": "\uBA54\uB274",
    "mobile.more": "\uB354 \uBCF4\uAE30",
    "mobile.systemStatus": "NEXUS \uC2DC\uC2A4\uD15C \uC0C1\uD0DC",
    "mobile.localNetwork": "\uB85C\uCEEC \uB124\uD2B8\uC6CC\uD06C \uC5F0\uACB0",
    "mobile.offline": "100% \uC624\uD504\uB77C\uC778",
    "mobile.localAI": "\uB85C\uCEEC AI \uC5D4\uC9C4",
    "mobile.deviceNetwork": "\uAE30\uAE30 \uB124\uD2B8\uC6CC\uD06C",
    "mobile.online": "\uC628\uB77C\uC778",
    "mobile.quickControls": "\uBE60\uB978 \uC81C\uC5B4",
    "mobile.privacyShield": "\uC624\uD504\uB77C\uC778 \uD504\uB77C\uC774\uBC84\uC2DC \uC274\uB4DC",
    "mobile.active": "\uD65C\uC131",
    "mobile.voiceWake": "\uC74C\uC131 \uAE68\uC6B0\uAE30 (\u201CNEXUS\u201D)",
    "mobile.on": "~\uC5D0",
    "mobile.autoBackup": "\uC790\uB3D9 \uD648 \uBC31\uC5C5",
    "mobile.backupTime": "\uB9E4\uC77C 03:00",
    "mobile.moreSub.suggestions": "\uC608\uC815\uB41C \uC2A4\uB9C8\uD2B8 \uC790\uB3D9\uD654 \uC81C\uC548 3\uAC74",
    "mobile.moreSub.skills": "5\uAC00\uC9C0 \uB2A5\uB3D9\uD0DC \uD65C\uC6A9 \uAE30\uC220\uACFC \uD65C\uC6A9 \uC0AC\uB840",
    "mobile.moreSub.personalization": "\uBCF4\uC870 \uC774\uB984, \uC74C\uC131 \uBAA8\uB378 \uBC0F \uAC1C\uC778\uC815\uBCF4 \uC124\uC815",
    "mobile.moreSub.billing": "NEXUS \uAC00\uC871 \uC694\uAE08\uC81C \xB7 \uD604\uC7AC \uAD6C\uB3C5 \uC911",
    "mobile.moreSub.downloads": "3\uAC00\uC9C0 OS \uD50C\uB7AB\uD3FC \uCD9C\uC2DC \uBC0F SHA-256 \uAC80\uC99D",
    "mobile.moreSub.platform": "\uD06C\uB85C\uC2A4 \uD50C\uB7AB\uD3FC \uAE30\uAE30 \uB3D9\uAE30\uD654",
    "mobile.moreSub.agents": "\uC790\uC728\uD615 AI \uC5D0\uC774\uC804\uD2B8",
    "mobile.moreSub.admin": "\uC2DC\uC2A4\uD15C \uAD00\uB9AC \uBC0F \uC9C0\uD45C",
    "desktop.title": "\uAC1C\uC778\uC6A9 \uC6B4\uC601 \uCCB4\uC81C",
    "setup.welcome": "\uD658\uC601\uD569\uB2C8\uB2E4",
    "setup.license": "\uB77C\uC774\uC120\uC2A4",
    "setup.location": "\uC704\uCE58",
    "setup.installing": "\uC124\uCE58",
    "setup.finish": "\uC644\uB8CC",
    "setup.welcomeTitle": "NEXUS \uC124\uC815\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4",
    "setup.welcomeDesc": "\uC774 \uB9C8\uBC95\uC0AC\uB294 \uAC00\uC815\uC6A9 \uAC1C\uC778 \uC6B4\uC601 \uCCB4\uC81C\uC778 NEXUS AI\uC758 \uC124\uCE58 \uACFC\uC815\uC744 \uB2E8\uACC4\uBCC4\uB85C \uC548\uB0B4\uD574 \uB4DC\uB9BD\uB2C8\uB2E4.",
    "setup.accept": "\uB77C\uC774\uC120\uC2A4 \uACC4\uC57D\uC5D0 \uB3D9\uC758\uD569\uB2C8\uB2E4",
    "setup.chooseFolder": "\uC124\uCE58 \uD3F4\uB354 \uC120\uD0DD",
    "setup.installBtn": "\uC124\uCE58",
    "setup.complete": "\uC124\uC815\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    "setup.launchNow": "\uC9C0\uAE08 NEXUS\uB97C \uC2E4\uD589\uD558\uC138\uC694"
  },
  // ── Chinese Simplified ──
  "zh-Hans": {
    "app.greeting": "\u4F60\u597D\uFF0C{name}\uFF0C\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u5230\u4F60\u7684\u5417\uFF1F",
    "app.confirmNeeded": "{name}\uFF0C\u8BE5\u64CD\u4F5C\u9700\u8981\u60A8\u786E\u8BA4\u3002",
    "download.title": "\u4E0B\u8F7D NEXUS",
    "download.primaryButton": "{os} \u4E0B\u8F7D",
    "download.otherOs": "\u4F7F\u7528\u7684\u662F\u5176\u4ED6\u64CD\u4F5C\u7CFB\u7EDF\u5417\uFF1F",
    "download.checksum": "SHA-256 \u6821\u9A8C\u548C",
    "screen.today": "\u4ECA\u5929",
    "screen.homeState": "\u9996\u9875",
    "screen.suggestions": "\u5EFA\u8BAE",
    "screen.skills": "\u6280\u80FD",
    "screen.family": "\u5BB6\u5EAD",
    "screen.devices": "\u8BBE\u5907",
    "screen.platform": "\u5E73\u53F0",
    "screen.agents": "\u4EE3\u7406\u4EBA",
    "screen.personalization": "\u4E2A\u6027\u5316",
    "screen.billing": "\u8BA2\u9605",
    "screen.downloadCenter": "\u4E0B\u8F7D",
    "screen.adminDashboard": "\u7BA1\u7406\u5458\u4EEA\u8868\u76D8",
    "today.devicesOnline": "\u5728\u7EBF\u8BBE\u5907",
    "today.energy": "\u5F53\u4ECA\u80FD\u6E90",
    "today.activeRoutines": "\u6D3B\u8DC3\u7684\u65E5\u5E38\u6D3B\u52A8",
    "today.suggestions": "\u5EFA\u8BAE",
    "screen.devices.empty": "\u5C1A\u672A\u8FDE\u63A5\u4EFB\u4F55\u8BBE\u5907\u3002",
    "screen.agents.empty": "\u5C1A\u672A\u914D\u7F6E\u4EFB\u4F55\u4EE3\u7406\u3002",
    "screen.suggestions.empty": "\u76EE\u524D\u5C1A\u65E0\u5EFA\u8BAE\u2014\u2014NEXUS AI \u4ECD\u5728\u5B66\u4E60\u4E2D\u3002",
    "screen.skills.empty": "\u5C1A\u672A\u638C\u63E1\u4EFB\u4F55\u6280\u80FD\u3002",
    "screen.homeState.empty": "\u76EE\u524D\u5C1A\u65E0\u914D\u5907\u8BBE\u5907\u7684\u623F\u95F4\u3002",
    "plan.free": "\u514D\u8D39",
    "plan.premium": "\u9AD8\u7EA7\u7248",
    "plan.family": "\u5BB6\u5EAD",
    "billing.manage": "\u7BA1\u7406\u8BA2\u9605",
    "auth.tagline": "\u4E13\u4E3A\u5BB6\u5EAD\u6253\u9020\u7684\u4E2A\u4EBA\u64CD\u4F5C\u7CFB\u7EDF",
    "auth.signInTitle": "\u767B\u5F55 NEXUS",
    "auth.signUpTitle": "\u521B\u5EFA\u60A8\u7684 NEXUS \u8D26\u6237",
    "auth.email": "\u7535\u5B50\u90AE\u4EF6",
    "auth.password": "\u5BC6\u7801",
    "auth.signInButton": "\u767B\u5F55",
    "auth.signUpButton": "\u521B\u5EFA\u8D26\u6237",
    "auth.switchToSignUp": "\u521D\u6B21\u8BBF\u95EE\uFF1F\u8BF7\u6CE8\u518C\u4E00\u4E2A\u8D26\u53F7",
    "auth.switchToSignIn": "\u5DF2\u6709\u8D26\u6237\uFF1F\u8BF7\u767B\u5F55",
    "auth.passwordHint": "\u81F3\u5C118\u4E2A\u5B57\u7B26",
    "auth.genericError": "\u51FA\u73B0\u9519\u8BEF\u3002\u8BF7\u91CD\u8BD5\u3002",
    "auth.locked": "\u5C1D\u8BD5\u5931\u8D25\u6B21\u6570\u8FC7\u591A\u3002\u8BF7\u5728 {time} \u4E2D\u91CD\u8BD5\u3002",
    "auth.rateLimited": "\u8BF7\u6C42\u8FC7\u591A\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    "auth.logout": "\u6CE8\u9500",
    "auth.welcome": "\u6B22\u8FCE\uFF0C{name}",
    "auth.continue": "\u7EE7\u7EED",
    "auth.guest": "\u4EE5\u8BBF\u5BA2\u8EAB\u4EFD\u7EE7\u7EED",
    "auth.guestHint": "\u65E0\u9700\u6CE8\u518C\u5373\u53EF\u63A2\u7D22 NEXUS",
    "auth.social.divider": "\u6216\u7EE7\u7EED\u4F7F\u7528\u7535\u5B50\u90AE\u4EF6",
    "auth.social.google": "\u7EE7\u7EED\u4F7F\u7528 Google",
    "auth.social.apple": "\u7EE7\u7EED\u4F7F\u7528 Apple",
    "auth.social.unavailable": "\u8BE5\u767B\u5F55\u65B9\u5F0F\u5C1A\u672A\u8BBE\u7F6E\u3002",
    "auth.social.error": "\u4F7F\u7528\u8BE5\u670D\u52A1\u63D0\u4F9B\u5546\u767B\u5F55\u5931\u8D25\u3002\u8BF7\u91CD\u8BD5\u3002",
    "mkt.nav.features": "\u529F\u80FD",
    "mkt.nav.pricing": "\u5B9A\u4EF7",
    "mkt.nav.testimonials": "\u7528\u6237\u8BC4\u4EF7",
    "mkt.nav.integrations": "\u96C6\u6210",
    "mkt.nav.about": "\u5173\u4E8E\u6211\u4EEC",
    "mkt.nav.download": "\u4E0B\u8F7D",
    "mkt.nav.faq": "\u5E38\u89C1\u95EE\u9898\u89E3\u7B54",
    "mkt.nav.signIn": "\u767B\u5F55",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\u4E3A\u60A8\u7684\u6BCF\u53F0\u8BBE\u5907\u4E0B\u8F7D NEXUS",
    "mkt.hero.desc": "NEXUS \u662F\u4E00\u6B3E\u4EE5\u8BED\u97F3\u4E3A\u5148\u3001\u6CE8\u91CD\u9690\u79C1\u7684\u4E2A\u4EBA\u64CD\u4F5C\u7CFB\u7EDF\u3002\u5B89\u88C5\u684C\u9762\u5E94\u7528\u6216\u79FB\u52A8\u7AEF\u914D\u5957\u5E94\u7528\uFF0C\u5373\u53EF\u4ECE\u4E00\u4E2A\u5730\u65B9\u63A7\u5236\u6240\u6709\u8BBE\u5907\u2014\u2014100% \u5728\u8BBE\u5907\u672C\u5730\u8FD0\u884C\u3002\u60A8\u9700\u8981\u901A\u8FC7\u771F\u6B63\u7684\u5E94\u7528\u6765\u4F7F\u7528\u5B83\uFF0C\u800C\u4E0D\u662F\u901A\u8FC7\u6D4F\u89C8\u5668\u3002",
    "mkt.hero.actionPrimary": "\u9002\u7528\u4E8E {os} \xB7 v{version} \u7684\u4E0B\u8F7D",
    "mkt.hero.actionSecondary": "\u89C2\u770B\u5B9E\u9645\u6F14\u793A",
    "mkt.hero.trust": "\u2605 50\u4E07+\u7528\u6237 \xB7 2000+\u6B3E\u667A\u80FD\u8BBE\u5907 \xB7 100%\u672C\u5730\u9690\u79C1\u4FDD\u62A4",
    "mkt.stats.title": "NEXUS\u6570\u636E\u4E00\u89C8",
    "mkt.stats.users": "\u6D3B\u8DC3\u7528\u6237",
    "mkt.stats.devices": "\u652F\u6301\u7684\u8BBE\u5907",
    "mkt.stats.privacy": "\u8BBE\u5907\u7AEF\u9690\u79C1",
    "mkt.stats.rating": "\u5E73\u5747\u8BC4\u5206",
    "mkt.privacy.title": "\u60A8\u7684\u6570\u636E\u5F52\u60A8\u6240\u6709",
    "mkt.privacy.processing": "100% \u8BBE\u5907\u7AEF\u5904\u7406",
    "mkt.privacy.encryption": "\u7AEF\u5230\u7AEF\u672C\u5730\u52A0\u5BC6",
    "mkt.privacy.logging": "\u96F6\u4E91\u7AEF\u65E5\u5FD7\u8BB0\u5F55",
    "mkt.how.title": "\u5DE5\u4F5C\u539F\u7406",
    "mkt.how.step1.title": "\u4E0B\u8F7D",
    "mkt.how.step1.desc": "\u8BF7\u4E0B\u8F7D\u9002\u7528\u4E8E\u60A8\u6240\u5728\u5E73\u53F0\u7684\u5E94\u7528\u7A0B\u5E8F\u3002",
    "mkt.how.step2.title": "\u5B89\u88C5",
    "mkt.how.step2.desc": "\u51E0\u79D2\u949F\u5185\u5373\u53EF\u5B8C\u6210\u672C\u5730\u8BBE\u7F6E\u3002",
    "mkt.how.step3.title": "\u8FDE\u63A5\u8BBE\u5907",
    "mkt.how.step3.desc": "\u7ACB\u5373\u5F00\u59CB\u5B89\u5168\u5730\u7BA1\u7406\u60A8\u7684\u667A\u80FD\u5BB6\u5C45\u3002",
    "mkt.preview.title": "\u89C2\u770B NEXUS \u7684\u5B9E\u9645\u5E94\u7528",
    "mkt.preview.desc": "\u8FD9\u662F\u60A8\u5B89\u88C5\u5E94\u7528\u540E\u7ACB\u5373\u770B\u5230\u7684\u771F\u5B9E\u4EEA\u8868\u76D8\u7684\u5B9E\u65F6\u9884\u89C8\u3002",
    "mkt.preview.tab.today": "\u4ECA\u5929",
    "mkt.preview.tab.devices": "\u8BBE\u5907",
    "mkt.preview.tab.skills": "\u4F8B\u884C\u6D3B\u52A8",
    "mkt.preview.tab.family": "\u5BB6\u5EAD",
    "mkt.download.mobile.title": "\u79FB\u52A8\u5E94\u7528",
    "mkt.download.mobile.desc": "iOS \u548C Android \u5E94\u7528\u5373\u5C06\u63A8\u51FA\u3002",
    "mkt.download.mobile.apple": "\u5728\u4EE5\u4E0B\u4F4D\u7F6E\u4E0B\u8F7D",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "\u5FEB\u6765\u4F53\u9A8C\u5427",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\u5F88\u5FEB",
    "mkt.seo.title": "NEXUS \u2014 \u4E0B\u8F7D\u60A8\u7684\u4E2A\u4EBA\u64CD\u4F5C\u7CFB\u7EDF",
    "mkt.seo.desc": "\u4E0B\u8F7D\u9002\u7528\u4E8E Windows\u3001macOS \u548C Linux \u7684 NEXUS\u3002iOS \u548C Android \u7248\u672C\u5373\u5C06\u63A8\u51FA\u3002",
    "mkt.skipToContent": "\u8DF3\u8F6C\u5230\u5185\u5BB9",
    "mkt.pricing.title": "\u7B80\u5355\u3001\u900F\u660E\u7684\u5B9A\u4EF7",
    "mkt.pricing.free": "\u514D\u8D39",
    "mkt.pricing.freeDesc": "\u6253\u9020\u672C\u5730\u667A\u80FD\u5BB6\u5C45\u6240\u9700\u7684\u4E00\u5207\u3002",
    "mkt.pricing.premium": "\u9AD8\u7EA7\u7248",
    "mkt.pricing.premiumDesc": "\u5148\u8FDB\u7684\u4EBA\u5DE5\u667A\u80FD\u5904\u7406\u548C\u8FDC\u7A0B\u8BBF\u95EE\u3002",
    "mkt.pricing.family": "\u5BB6\u5EAD",
    "mkt.pricing.familyDesc": "\u6700\u591A\u53EF\u521B\u5EFA 5 \u4E2A\u8D26\u6237\uFF0C\u5E76\u5177\u5907\u5B8C\u6574\u7684\u8BBF\u95EE\u63A7\u5236\u529F\u80FD\u3002",
    "mkt.pricing.cta": "\u514D\u8D39\u5F00\u59CB",
    "mkt.testimonials.title": "\u6DF1\u53D7\u667A\u80FD\u5BB6\u5C45\u7231\u597D\u8005\u559C\u7231",
    "mkt.testimonials.quote1": "NEXUS \u5F7B\u5E95\u6539\u53D8\u4E86\u6211\u4E0E\u5BB6\u5C45\u4E92\u52A8\u7684\u65B9\u5F0F\u3002\u6240\u6709\u529F\u80FD\u90FD\u5728\u672C\u5730\u8FD0\u884C\uFF0C\u901F\u5EA6\u771F\u7684\u5FEB\u591A\u4E86\u3002",
    "mkt.testimonials.author1": "\u838E\u62C9\xB7\u8A79\u91D1\u65AF",
    "mkt.testimonials.role1": "\u65E9\u671F\u91C7\u7528\u8005",
    "mkt.testimonials.quote2": "\u7EC8\u4E8E\u6709\u4E00\u6B3E\u5C0A\u91CD\u6211\u9690\u79C1\u7684\u667A\u80FD\u5BB6\u5C45\u4E2D\u67A2\u4E86\u3002\u672C\u5730AI\u5904\u7406\u7684\u54CD\u5E94\u901F\u5EA6\u5FEB\u5F97\u60CA\u4EBA\u3002",
    "mkt.testimonials.author2": "\u9648\u5927\u536B",
    "mkt.testimonials.role2": "\u8F6F\u4EF6\u5DE5\u7A0B\u5E08",
    "mkt.testimonials.quote3": "\u8BBE\u7F6E\u590D\u6742\u7684\u4F8B\u884C\u4EFB\u52A1\u8F7B\u800C\u6613\u4E3E\u3002\u6211\u7279\u522B\u559C\u6B22\u5B83\u5373\u4F7F\u5728\u7F51\u7EDC\u65AD\u5F00\u65F6\u4E5F\u80FD\u6B63\u5E38\u8FD0\u884C\u3002",
    "mkt.testimonials.author3": "\u827E\u739B\xB7\u6C64\u666E\u68EE",
    "mkt.testimonials.role3": "\u667A\u80FD\u5BB6\u5C45\u7231\u597D\u8005",
    "mkt.integrations.title": "\u53EF\u4E0E\u60A8\u559C\u7231\u7684\u8BBE\u5907\u914D\u5408\u4F7F\u7528",
    "mkt.changelog.title": "v3.14.2 \u7248\u672C\u7684\u65B0\u529F\u80FD",
    "mkt.requirements.title": "\u7CFB\u7EDF\u8981\u6C42",
    "mkt.requirements.desc": "\u9700\u8981 64 \u4F4D\u64CD\u4F5C\u7CFB\u7EDF\uFF0C\u4E14\u5185\u5B58\u81F3\u5C11\u4E3A 2GB\u3002",
    "mkt.footer.desc": "\u60A8\u7684\u8BED\u97F3\u4F18\u5148\u578B\u4E2A\u4EBA\u5BB6\u5EAD\u64CD\u4F5C\u7CFB\u7EDF\u3002\u5B8C\u5168\u672C\u5730\u5316\uFF0C\u5B8C\u5168\u5C5E\u4E8E\u60A8\u3002",
    "mkt.footer.product": "\u4EA7\u54C1",
    "mkt.footer.company": "\u516C\u53F8\u4E0E\u6CD5\u5F8B",
    "mkt.footer.about": "\u5173\u4E8E\u6211\u4EEC",
    "mkt.footer.privacy": "\u9690\u79C1\u653F\u7B56",
    "mkt.footer.terms": "\u670D\u52A1\u6761\u6B3E",
    "mkt.footer.noCookies": "\u6211\u4EEC\u4E0D\u4F7F\u7528\u4EFB\u4F55Cookie\u3002",
    "mkt.cookie.title": "\u9690\u79C1\u4E0ECookie",
    "mkt.cookie.desc": "\u6211\u4EEC\u4F7F\u7528\u5FC5\u8981\u7684Cookie\u6765\u63D0\u4F9B\u670D\u52A1\u3002\u7EE7\u7EED\u4F7F\u7528\u5373\u8868\u793A\u60A8\u540C\u610F\u6211\u4EEC\u4F7F\u7528\u8FD9\u4E9B\u5FC5\u8981\u7684\u6280\u672F\u3002",
    "mkt.cookie.accept": "\u660E\u767D\u4E86",
    "mkt.cookie.decline": "\u8BBE\u7F6E",
    "mkt.feat.why": "\u4E3A\u4EC0\u4E48\u9009\u62E9 NEXUS",
    "mkt.feat.1.title": "\u8BED\u97F3\u4F18\u5148\u63A7\u5236",
    "mkt.feat.1.desc": "\u4E0E\u60A8\u7684\u5BB6\u81EA\u7136\u4E92\u52A8\u3002",
    "mkt.feat.2.title": "\u8BBE\u8BA1\u4E0A\u5373\u4E3A\u79C1\u6709",
    "mkt.feat.2.desc": "\u65E0\u4E91\u7AEF\uFF0C\u65E0\u65E5\u5FD7\u8BB0\u5F55\u3002\u4EC5\u8FDB\u884C\u672C\u5730\u52A0\u5BC6\u3002",
    "mkt.feat.3.title": "\u53EF\u4E92\u64CD\u4F5C\u7684",
    "mkt.feat.3.desc": "500\u591A\u79CD\u534F\u8BAE\uFF0C\u5305\u62ECMatter\u3001Zigbee\u548CZ-Wave\u3002",
    "mkt.feat.4.title": "\u9690\u5F62\u4EBA\u5DE5\u667A\u80FD",
    "mkt.feat.4.desc": "\u5728\u540E\u53F0\u8FD0\u884C\uFF0C\u5B66\u4E60\u60A8\u7684\u65E5\u5E38\u4E60\u60EF\u3002",
    "mkt.faq.title": "\u5E38\u89C1\u95EE\u9898",
    "mkt.faq.1.q": "NEXUS \u5B8C\u5168\u514D\u8D39\u5417\uFF1F",
    "mkt.faq.1.a": "\u662F\u7684\u3002\u6838\u5FC3\u64CD\u4F5C\u7CFB\u7EDF\u548C\u672C\u5730\u63A7\u5236\u529F\u80FD\u5B8C\u5168\u514D\u8D39\u3002",
    "mkt.faq.2.q": "\u652F\u6301\u54EA\u4E9B\u8BBE\u5907\uFF1F",
    "mkt.faq.2.a": "Matter\u3001Zigbee\u3001Z-Wave \u8BBE\u5907\u4EE5\u53CA 500 \u591A\u4E2A\u57FA\u4E8E API \u7684\u751F\u6001\u7CFB\u7EDF\u3002",
    "mkt.faq.3.q": "\u5982\u679C\u6CA1\u6709\u4E91\u8FDE\u63A5\uFF0C\u5B83\u8FD8\u80FD\u6B63\u5E38\u5DE5\u4F5C\u5417\uFF1F",
    "mkt.faq.3.a": "\u662F\u7684\u3002\u5B83\u901A\u8FC7\u5C40\u57DF\u7F51\u4E0E\u60A8\u7684\u8BBE\u5907\u8FDB\u884C\u901A\u4FE1\uFF0C\u5373\u4F7F\u4E92\u8054\u7F51\u65AD\u5F00\u8FDE\u63A5\u4E5F\u80FD\u6B63\u5E38\u5DE5\u4F5C\u3002",
    "mkt.faq.4.q": "\u8FDC\u7A0B\u8BBF\u95EE\u662F\u5982\u4F55\u5B9E\u73B0\u7684\uFF1F",
    "mkt.faq.4.a": "\u901A\u8FC7\u9AD8\u7EA7\u5957\u9910\u6216\u60A8\u81EA\u5DF1\u7684VPN\uFF0C\u7ECF\u7531\u5B89\u5168\u7684\u7AEF\u5230\u7AEF\u52A0\u5BC6\u96A7\u9053\u8FDB\u884C\u8FDE\u63A5\u3002",
    "mkt.desktop.eyebrow": "\u684C\u9762",
    "mkt.desktop.title": "\u6BCF\u4E2A\u684C\u9762\u4EC5\u9700\u4E00\u4E2A\u5E94\u7528\u7A0B\u5E8F",
    "mkt.desktop.desc": "\u9002\u7528\u4E8E Windows\u3001macOS \u548C Linux \u7684\u539F\u751F\u7248\u672C\u2014\u2014\u6BCF\u4E2A\u7248\u672C\u5747\u9488\u5BF9\u5176\u6240\u5728\u5E73\u53F0\u8FDB\u884C\u4E86\u4F18\u5316\u3002",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "\u9488\u5BF9 Windows 10 \u548C 11 \u8FDB\u884C\u4E86\u4F18\u5316\uFF0C\u53EF\u5728\u540E\u53F0\u65E0\u7F1D\u8FD0\u884C\u3002",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u4E13\u4E3A Apple Silicon \u548C\u82F1\u7279\u5C14\u5904\u7406\u5668\u6253\u9020\uFF0C\u5E76\u4E0E\u7CFB\u7EDF\u6DF1\u5EA6\u96C6\u6210\u3002",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "\u8F7B\u91CF\u3001\u5FEB\u901F\uFF0C\u4E14\u4E0E\u6240\u6709\u4E3B\u6D41\u53D1\u884C\u7248\u517C\u5BB9\u3002",
    "mkt.desktop.download": "\u4E0B\u8F7D",
    "mkt.mobile.eyebrow": "\u79FB\u52A8\u7AEF",
    "mkt.mobile.title": "\u53E3\u888B\u91CC\u7684\u5BB6",
    "mkt.mobile.desc": "NEXUS \u914D\u5957\u5E94\u7528\u8BA9\u60A8\u968F\u65F6\u968F\u5730\u90FD\u80FD\u8F7B\u677E\u638C\u63A7\u4E00\u5207\u3002",
    "mkt.mobile.feat1.title": "\u968F\u65F6\u968F\u5730\u901A\u8BDD",
    "mkt.mobile.feat1.desc": "\u501F\u52A9\u8BBE\u5907\u7AEF\u7684\u8BED\u97F3\u8BC6\u522B\u529F\u80FD\uFF0C\u65E0\u8BBA\u8EAB\u5728\u4F55\u5904\uFF0C\u90FD\u80FD\u4E0E\u60A8\u7684\u667A\u80FD\u5BB6\u5C45\u5BF9\u8BDD\u3002",
    "mkt.mobile.feat2.title": "\u8FDC\u7A0B\u8BBF\u95EE",
    "mkt.mobile.feat2.desc": "\u901A\u8FC7\u52A0\u5BC6\u96A7\u9053\u5B89\u5168\u5730\u8FDE\u63A5\u5230\u60A8\u7684\u5BB6\u5EAD\u7F51\u7EDC\u3002",
    "mkt.mobile.feat3.title": "\u63A8\u9001\u901A\u77E5",
    "mkt.mobile.feat3.desc": "\u53CA\u65F6\u83B7\u53D6\u60A8\u5173\u5FC3\u7684\u4E8B\u4EF6\u63D0\u9192\u3002",
    "mkt.mobile.feat4.title": "\u751F\u7269\u8BC6\u522B\u9501",
    "mkt.mobile.feat4.desc": "Face ID \u548C\u6307\u7EB9\u8BC6\u522B\u53EF\u786E\u4FDD\u60A8\u7684\u5BB6\u5EAD\u63A7\u5236\u529F\u80FD\u4FDD\u6301\u79C1\u5BC6\u3002",
    "mkt.cta.title": "\u81EA\u5DF1\u7684\u5BB6\uFF0C\u81EA\u5DF1\u505A\u4E3B\u3002",
    "mkt.cta.desc": "\u4E0B\u8F7D NEXUS\uFF0C\u5373\u53EF\u5728\u4E00\u4E2A\u5730\u65B9\u96C6\u4E2D\u7BA1\u7406\u6240\u6709\u8BBE\u5907\u3002",
    "mkt.cta.button": "\u514D\u8D39\u4E0B\u8F7D",
    "mkt.footer.platforms": "\u5E73\u53F0",
    "Dim living room lights": "\u8C03\u6697\u5BA2\u5385\u7684\u706F\u5149",
    "Start morning news briefing": "\u5F00\u59CB\u6668\u95F4\u65B0\u95FB\u7B80\u62A5",
    "Movie night": "\u7535\u5F71\u4E4B\u591C",
    "Good morning": "\u65E9\u4E0A\u597D",
    "Leaving home": "\u79BB\u5BB6",
    "status.pctOnline": "{pct}% \u5728\u7EBF",
    "status.offlineCount": "{count} \u79BB\u7EBF",
    "status.allOnline": "\u6240\u6709\u8BBE\u5907\u5747\u5DF2\u4E0A\u7EBF",
    "status.suggestionReady": "{count}\u7684\u5EFA\u8BAE\u5DF2\u4E3A\u60A8\u51C6\u5907\u597D\u3002",
    "status.suggestionsReady": "{count}\u7684\u5EFA\u8BAE\u5DF2\u4E3A\u60A8\u51C6\u5907\u597D\u3002",
    "status.caughtUp": "\u4F60\u5DF2\u7ECF\u5168\u90E8\u8DDF\u4E0A\u4E86\u3002",
    "status.onlineOfTotal": "{online}/{total} \u5728\u7EBF\u7248",
    "mobile.menu": "\u83DC\u5355",
    "mobile.more": "\u66F4\u591A",
    "mobile.systemStatus": "NEXUS \u7CFB\u7EDF\u72B6\u6001",
    "mobile.localNetwork": "\u5C40\u57DF\u7F51\u8FDE\u63A5",
    "mobile.offline": "100% \u79BB\u7EBF",
    "mobile.localAI": "\u672C\u5730\u4EBA\u5DE5\u667A\u80FD\u5F15\u64CE",
    "mobile.deviceNetwork": "\u8BBE\u5907\u7F51\u7EDC",
    "mobile.online": "\u5728\u7EBF",
    "mobile.quickControls": "\u5FEB\u901F\u63A7\u5236",
    "mobile.privacyShield": "\u79BB\u7EBF\u9690\u79C1\u4FDD\u62A4\u76FE",
    "mobile.active": "\u6709\u6548",
    "mobile.voiceWake": "\u8BED\u97F3\u5524\u9192\uFF08\u201CNEXUS\u201D\uFF09",
    "mobile.on": "\u5173\u4E8E",
    "mobile.autoBackup": "\u81EA\u52A8\u5BB6\u5EAD\u5907\u4EFD",
    "mobile.backupTime": "\u6BCF\u5929 03:00",
    "mobile.moreSub.suggestions": "3 \u6761\u5DF2\u5B89\u6392\u7684\u667A\u80FD\u81EA\u52A8\u5316\u5EFA\u8BAE",
    "mobile.moreSub.skills": "5\u79CD\u4E3B\u52A8\u8BED\u6001\u6280\u5DE7\u53CA\u5E94\u7528\u573A\u666F",
    "mobile.moreSub.personalization": "\u52A9\u624B\u540D\u79F0\u3001\u8BED\u97F3\u6A21\u578B\u548C\u9690\u79C1\u8BBE\u7F6E",
    "mobile.moreSub.billing": "NEXUS \u5BB6\u5EAD\u5957\u9910 \xB7 \u6709\u6548\u8BA2\u9605",
    "mobile.moreSub.downloads": "3 \u4E2A\u64CD\u4F5C\u7CFB\u7EDF\u5E73\u53F0\u7248\u672C\u53CA SHA-256 \u9A8C\u8BC1",
    "mobile.moreSub.platform": "\u8DE8\u5E73\u53F0\u8BBE\u5907\u540C\u6B65",
    "mobile.moreSub.agents": "\u81EA\u4E3B\u4EBA\u5DE5\u667A\u80FD\u4EE3\u7406",
    "mobile.moreSub.admin": "\u7CFB\u7EDF\u7BA1\u7406\u4E0E\u6307\u6807",
    "desktop.title": "\u4E2A\u4EBA\u64CD\u4F5C\u7CFB\u7EDF",
    "setup.welcome": "\u6B22\u8FCE",
    "setup.license": "\u8BB8\u53EF\u534F\u8BAE",
    "setup.location": "\u4F4D\u7F6E",
    "setup.installing": "\u5B89\u88C5",
    "setup.finish": "\u5B8C\u6210",
    "setup.welcomeTitle": "\u6B22\u8FCE\u4F7F\u7528 NEXUS \u8BBE\u7F6E",
    "setup.welcomeDesc": "\u672C\u5411\u5BFC\u5C06\u5F15\u5BFC\u60A8\u5B8C\u6210 NEXUS AI\uFF08\u60A8\u7684\u5BB6\u5EAD\u4E13\u7528\u64CD\u4F5C\u7CFB\u7EDF\uFF09\u7684\u5B89\u88C5\u3002",
    "setup.accept": "\u6211\u63A5\u53D7\u8BB8\u53EF\u534F\u8BAE",
    "setup.chooseFolder": "\u9009\u62E9\u5B89\u88C5\u6587\u4EF6\u5939",
    "setup.installBtn": "\u5B89\u88C5",
    "setup.complete": "\u8BBE\u7F6E\u5B8C\u6210",
    "setup.launchNow": "\u7ACB\u5373\u542F\u52A8 NEXUS"
  },
  // ── Chinese Traditional ──
  "zh-Hant": {
    "app.greeting": "\u55E8\uFF0C{name}\uFF0C\u6709\u4EC0\u9EBC\u53EF\u4EE5\u5E6B\u5FD9\u7684\u55CE\uFF1F",
    "app.confirmNeeded": "{name}\uFF0C\u8A72\u64CD\u4F5C\u9700\u8981\u60A8\u7684\u78BA\u8A8D\u3002",
    "download.title": "\u4E0B\u8F09 NEXUS",
    "download.primaryButton": "{os} \u4E0B\u8F09",
    "download.otherOs": "\u60A8\u4F7F\u7528\u7684\u662F\u5176\u4ED6\u4F5C\u696D\u7CFB\u7D71\u55CE\uFF1F",
    "download.checksum": "SHA-256 \u6821\u9A57\u548C",
    "screen.today": "\u4ECA\u5929",
    "screen.homeState": "\u9996\u9801",
    "screen.suggestions": "\u5EFA\u8B70",
    "screen.skills": "\u6280\u80FD",
    "screen.family": "\u5BB6\u5EAD",
    "screen.devices": "\u88DD\u7F6E",
    "screen.platform": "\u5E73\u53F0",
    "screen.agents": "\u4EE3\u7406\u4EBA",
    "screen.personalization": "\u500B\u4EBA\u5316",
    "screen.billing": "\u8A02\u95B1",
    "screen.downloadCenter": "\u4E0B\u8F09",
    "screen.adminDashboard": "\u7BA1\u7406\u54E1\u5100\u8868\u677F",
    "today.devicesOnline": "\u5DF2\u9023\u7DDA\u7684\u88DD\u7F6E",
    "today.energy": "\u7576\u4ECA\u7684\u80FD\u6E90",
    "today.activeRoutines": "\u6D3B\u8E8D\u7684\u65E5\u5E38\u7FD2\u6163",
    "today.suggestions": "\u5EFA\u8B70",
    "screen.devices.empty": "\u76EE\u524D\u5C1A\u672A\u9023\u63A5\u4EFB\u4F55\u88DD\u7F6E\u3002",
    "screen.agents.empty": "\u5C1A\u672A\u8A2D\u5B9A\u4EFB\u4F55\u4EE3\u7406\u7A0B\u5F0F\u3002",
    "screen.suggestions.empty": "\u76EE\u524D\u5C1A\u7121\u5EFA\u8B70 \u2014 NEXUS AI \u4ECD\u5728\u5B78\u7FD2\u4E2D\u3002",
    "screen.skills.empty": "\u5C1A\u672A\u5B78\u6703\u4EFB\u4F55\u6280\u80FD\u3002",
    "screen.homeState.empty": "\u76EE\u524D\u5C1A\u7121\u914D\u5099\u8A72\u88DD\u7F6E\u7684\u623F\u9593\u3002",
    "plan.free": "\u514D\u8CBB",
    "plan.premium": "\u5C0A\u4EAB\u7248",
    "plan.family": "\u5BB6\u5EAD",
    "billing.manage": "\u7BA1\u7406\u8A02\u95B1",
    "auth.tagline": "\u5C08\u70BA\u5BB6\u5EAD\u6253\u9020\u7684\u500B\u4EBA\u4F5C\u696D\u7CFB\u7D71",
    "auth.signInTitle": "\u767B\u5165 NEXUS",
    "auth.signUpTitle": "\u5EFA\u7ACB\u60A8\u7684 NEXUS \u5E33\u6236",
    "auth.email": "\u96FB\u5B50\u90F5\u4EF6",
    "auth.password": "\u5BC6\u78BC",
    "auth.signInButton": "\u767B\u5165",
    "auth.signUpButton": "\u5EFA\u7ACB\u5E33\u865F",
    "auth.switchToSignUp": "\u521D\u6B21\u9020\u8A2A\uFF1F\u8ACB\u5EFA\u7ACB\u5E33\u865F",
    "auth.switchToSignIn": "\u5DF2\u6709\u5E33\u865F\uFF1F\u8ACB\u767B\u5165",
    "auth.passwordHint": "\u81F3\u5C11 8 \u500B\u5B57\u5143",
    "auth.genericError": "\u767C\u751F\u4E86\u932F\u8AA4\u3002\u8ACB\u91CD\u8A66\u3002",
    "auth.locked": "\u5617\u8A66\u6B21\u6578\u904E\u591A\u3002\u8ACB\u5728 {time} \u4E2D\u91CD\u65B0\u5617\u8A66\u3002",
    "auth.rateLimited": "\u8ACB\u6C42\u904E\u591A\u3002\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002",
    "auth.logout": "\u767B\u51FA",
    "auth.welcome": "\u6B61\u8FCE\uFF0C{name}",
    "auth.continue": "\u7E7C\u7E8C",
    "auth.guest": "\u4EE5\u8A2A\u5BA2\u8EAB\u5206\u7E7C\u7E8C",
    "auth.guestHint": "\u7121\u9700\u8A3B\u518A\u5E33\u865F\u5373\u53EF\u63A2\u7D22 NEXUS",
    "auth.social.divider": "\u6216\u7E7C\u7E8C\u4F7F\u7528\u96FB\u5B50\u90F5\u4EF6",
    "auth.social.google": "\u7E7C\u7E8C\u4F7F\u7528 Google",
    "auth.social.apple": "\u7E7C\u7E8C\u4F7F\u7528 Apple",
    "auth.social.unavailable": "\u6B64\u767B\u5165\u65B9\u5F0F\u5C1A\u672A\u8A2D\u5B9A\u3002",
    "auth.social.error": "\u4F7F\u7528\u8A72\u670D\u52D9\u63D0\u4F9B\u8005\u767B\u5165\u5931\u6557\u3002\u8ACB\u91CD\u8A66\u3002",
    "mkt.nav.features": "\u7279\u8272",
    "mkt.nav.pricing": "\u5B9A\u50F9",
    "mkt.nav.testimonials": "\u5BA2\u6236\u898B\u8B49",
    "mkt.nav.integrations": "\u6574\u5408\u529F\u80FD",
    "mkt.nav.about": "\u95DC\u65BC\u6211\u5011",
    "mkt.nav.download": "\u4E0B\u8F09",
    "mkt.nav.faq": "\u5E38\u898B\u554F\u984C",
    "mkt.nav.signIn": "\u767B\u5165",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "\u8ACB\u70BA\u60A8\u64C1\u6709\u7684\u6BCF\u53F0\u88DD\u7F6E\u4E0B\u8F09 NEXUS",
    "mkt.hero.desc": "NEXUS \u662F\u4E00\u6B3E\u4EE5\u8A9E\u97F3\u70BA\u5148\u3001\u6CE8\u91CD\u96B1\u79C1\u7684\u500B\u4EBA\u4F5C\u696D\u7CFB\u7D71\u3002\u5B89\u88DD\u684C\u9762\u61C9\u7528\u7A0B\u5F0F\u6216\u884C\u52D5\u4F34\u4FB6\u61C9\u7528\u7A0B\u5F0F\uFF0C\u5373\u53EF\u5F9E\u55AE\u4E00\u4ECB\u9762\u63A7\u5236\u6240\u6709\u88DD\u7F6E\u2014\u2014100% \u5728\u88DD\u7F6E\u672C\u5730\u904B\u884C\u3002\u60A8\u9700\u900F\u904E\u771F\u6B63\u7684\u61C9\u7528\u7A0B\u5F0F\u4F7F\u7528\u5B83\uFF0C\u800C\u975E\u900F\u904E\u700F\u89BD\u5668\u3002",
    "mkt.hero.actionPrimary": "{os} \xB7 v{version} \u4E0B\u8F09",
    "mkt.hero.actionSecondary": "\u89AA\u773C\u770B\u770B\u5BE6\u969B\u904B\u4F5C\u60C5\u6CC1",
    "mkt.hero.trust": "\u2605 500,000+ \u540D\u4F7F\u7528\u8005 \xB7 2000+ \u6B3E\u667A\u6167\u88DD\u7F6E \xB7 100% \u672C\u5730\u5316\u96B1\u79C1\u4FDD\u8B77",
    "mkt.stats.title": "NEXUS \u7684\u6578\u64DA\u4E00\u89BD",
    "mkt.stats.users": "\u6D3B\u8E8D\u7528\u6236",
    "mkt.stats.devices": "\u652F\u63F4\u7684\u88DD\u7F6E",
    "mkt.stats.privacy": "\u88DD\u7F6E\u7AEF\u96B1\u79C1\u6B0A",
    "mkt.stats.rating": "\u5E73\u5747\u8A55\u5206",
    "mkt.privacy.title": "\u60A8\u7684\u8CC7\u6599\u6B78\u60A8\u6240\u6709",
    "mkt.privacy.processing": "100% \u88DD\u7F6E\u7AEF\u8655\u7406",
    "mkt.privacy.encryption": "\u7AEF\u5230\u7AEF\u672C\u5730\u52A0\u5BC6",
    "mkt.privacy.logging": "\u96F6\u96F2\u7AEF\u8A18\u9304",
    "mkt.how.title": "\u904B\u4F5C\u539F\u7406",
    "mkt.how.step1.title": "\u4E0B\u8F09",
    "mkt.how.step1.desc": "\u8ACB\u4E0B\u8F09\u9069\u7528\u65BC\u60A8\u6240\u4F7F\u7528\u5E73\u53F0\u7684\u61C9\u7528\u7A0B\u5F0F\u3002",
    "mkt.how.step2.title": "\u5B89\u88DD",
    "mkt.how.step2.desc": "\u5E7E\u79D2\u9418\u5167\u5373\u53EF\u5B8C\u6210\u672C\u5730\u8A2D\u5B9A\u3002",
    "mkt.how.step3.title": "\u9023\u63A5\u88DD\u7F6E",
    "mkt.how.step3.desc": "\u7ACB\u5373\u958B\u59CB\u5B89\u5168\u5730\u7BA1\u7406\u60A8\u7684\u667A\u6167\u5BB6\u5EAD\u3002",
    "mkt.preview.title": "\u89AA\u773C\u898B\u8B49 NEXUS \u7684\u5BE6\u969B\u904B\u4F5C",
    "mkt.preview.desc": "\u9019\u662F\u60A8\u5B89\u88DD\u61C9\u7528\u7A0B\u5F0F\u5F8C\u7ACB\u5373\u770B\u5230\u7684\u771F\u5BE6\u5100\u8868\u677F\u5BE6\u666F\u9810\u89BD\u3002",
    "mkt.preview.tab.today": "\u4ECA\u5929",
    "mkt.preview.tab.devices": "\u88DD\u7F6E",
    "mkt.preview.tab.skills": "\u4F8B\u884C\u516C\u4E8B",
    "mkt.preview.tab.family": "\u5BB6\u5EAD",
    "mkt.download.mobile.title": "\u884C\u52D5\u61C9\u7528\u7A0B\u5F0F",
    "mkt.download.mobile.desc": "iOS \u548C Android \u61C9\u7528\u7A0B\u5F0F\u5373\u5C07\u63A8\u51FA\u3002",
    "mkt.download.mobile.apple": "\u8ACB\u65BC\u4EE5\u4E0B\u4F4D\u7F6E\u4E0B\u8F09\uFF1A",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "\u5FEB\u4F86\u9AD4\u9A57\u5427",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "\u5F88\u5FEB",
    "mkt.seo.title": "NEXUS \u2014 \u4E0B\u8F09\u60A8\u7684\u500B\u4EBA\u4F5C\u696D\u7CFB\u7D71",
    "mkt.seo.desc": "\u4E0B\u8F09\u9069\u7528\u65BC Windows\u3001macOS \u548C Linux \u7684 NEXUS\u3002iOS \u548C Android \u7248\u672C\u5373\u5C07\u63A8\u51FA\u3002",
    "mkt.skipToContent": "\u8DF3\u81F3\u5167\u5BB9",
    "mkt.pricing.title": "\u7C21\u55AE\u3001\u900F\u660E\u7684\u5B9A\u50F9",
    "mkt.pricing.free": "\u514D\u8CBB",
    "mkt.pricing.freeDesc": "\u6253\u9020\u672C\u5730\u667A\u6167\u5BB6\u5EAD\u6240\u9700\u7684\u4E00\u5207\u3002",
    "mkt.pricing.premium": "\u5C0A\u4EAB\u7248",
    "mkt.pricing.premiumDesc": "\u5148\u9032\u7684\u4EBA\u5DE5\u667A\u6167\u8655\u7406\u8207\u9060\u7AEF\u5B58\u53D6\u529F\u80FD\u3002",
    "mkt.pricing.family": "\u5BB6\u5EAD",
    "mkt.pricing.familyDesc": "\u6700\u591A\u53EF\u5EFA\u7ACB 5 \u500B\u5E33\u6236\uFF0C\u4E26\u5177\u5099\u5B8C\u6574\u7684\u5B58\u53D6\u63A7\u5236\u529F\u80FD\u3002",
    "mkt.pricing.cta": "\u7ACB\u5373\u514D\u8CBB\u958B\u59CB",
    "mkt.testimonials.title": "\u6DF1\u53D7\u667A\u6167\u5BB6\u5EAD\u611B\u597D\u8005\u559C\u611B",
    "mkt.testimonials.quote1": "NEXUS \u5FB9\u5E95\u6539\u8B8A\u4E86\u6211\u8207\u5C45\u5BB6\u74B0\u5883\u7684\u4E92\u52D5\u65B9\u5F0F\u3002\u6240\u6709\u529F\u80FD\u90FD\u5728\u672C\u5730\u904B\u4F5C\uFF0C\u901F\u5EA6\u771F\u7684\u5FEB\u5F97\u591A\u3002",
    "mkt.testimonials.author1": "\u838E\u62C9\xB7\u8A79\u91D1\u65AF",
    "mkt.testimonials.role1": "\u65E9\u671F\u63A1\u7528\u8005",
    "mkt.testimonials.quote2": "\u7D42\u65BC\u6709\u4E00\u6B3E\u80FD\u5C0A\u91CD\u6211\u96B1\u79C1\u7684\u667A\u6167\u5BB6\u5EAD\u4E2D\u6A1E\u4E86\u3002\u5176\u672C\u5730 AI \u8655\u7406\u7684\u53CD\u61C9\u901F\u5EA6\u6975\u5FEB\u3002",
    "mkt.testimonials.author2": "\u9673\u5927\u885B",
    "mkt.testimonials.role2": "\u8EDF\u9AD4\u5DE5\u7A0B\u5E2B",
    "mkt.testimonials.quote3": "\u8A2D\u5B9A\u8907\u96DC\u7684\u4F8B\u884C\u7A0B\u5E8F\u7C21\u76F4\u6613\u5982\u53CD\u638C\u3002\u6211\u7279\u5225\u559C\u6B61\u5B83\u5373\u4F7F\u7DB2\u8DEF\u4E2D\u65B7\u4E5F\u4E0D\u6703\u4E2D\u65B7\u904B\u4F5C\u9019\u4E00\u9EDE\u3002",
    "mkt.testimonials.author3": "\u827E\u746A\xB7\u6E6F\u666E\u68EE",
    "mkt.testimonials.role3": "\u667A\u6167\u5BB6\u5EAD\u611B\u597D\u8005",
    "mkt.integrations.title": "\u53EF\u8207\u60A8\u559C\u611B\u7684\u88DD\u7F6E\u642D\u914D\u4F7F\u7528",
    "mkt.changelog.title": "v3.14.2 \u7684\u65B0\u529F\u80FD",
    "mkt.requirements.title": "\u7CFB\u7D71\u9700\u6C42",
    "mkt.requirements.desc": "\u9700\u642D\u914D 64 \u4F4D\u5143\u4F5C\u696D\u7CFB\u7D71\uFF0C\u4E14\u81F3\u5C11\u5177\u5099 2GB \u8A18\u61B6\u9AD4\u3002",
    "mkt.footer.desc": "\u60A8\u7684\u300C\u8A9E\u97F3\u512A\u5148\u300D\u500B\u4EBA\u5BB6\u5EAD\u4F5C\u696D\u7CFB\u7D71\u3002\u5B8C\u5168\u5728\u672C\u5730\u904B\u884C\uFF0C\u5B8C\u5168\u5C6C\u65BC\u60A8\u3002",
    "mkt.footer.product": "\u7522\u54C1",
    "mkt.footer.company": "\u516C\u53F8\u8207\u6CD5\u5F8B",
    "mkt.footer.about": "\u95DC\u65BC\u6211\u5011",
    "mkt.footer.privacy": "\u96B1\u79C1\u6B0A\u653F\u7B56",
    "mkt.footer.terms": "\u670D\u52D9\u689D\u6B3E",
    "mkt.footer.noCookies": "\u6211\u5011\u5B8C\u5168\u4E0D\u4F7F\u7528 Cookie\u3002",
    "mkt.cookie.title": "\u96B1\u79C1\u6B0A\u8207 Cookie",
    "mkt.cookie.desc": "\u6211\u5011\u4F7F\u7528\u5FC5\u8981\u7684 Cookie \u4F86\u63D0\u4F9B\u670D\u52D9\u3002\u82E5\u60A8\u7E7C\u7E8C\u700F\u89BD\uFF0C\u5373\u8868\u793A\u60A8\u540C\u610F\u6211\u5011\u4F7F\u7528\u9019\u4E9B\u5FC5\u8981\u6280\u8853\u3002",
    "mkt.cookie.accept": "\u660E\u767D\u4E86",
    "mkt.cookie.decline": "\u8A2D\u5B9A",
    "mkt.feat.why": "\u70BA\u4F55\u9078\u64C7 NEXUS",
    "mkt.feat.1.title": "\u8A9E\u97F3\u512A\u5148\u63A7\u5236",
    "mkt.feat.1.desc": "\u4EE5\u81EA\u7136\u7684\u65B9\u5F0F\u8207\u60A8\u7684\u5BB6\u4E92\u52D5\u3002",
    "mkt.feat.2.title": "\u8A2D\u8A08\u4E0A\u5373\u70BA\u79C1\u6709",
    "mkt.feat.2.desc": "\u7121\u96F2\u7AEF\u3001\u7121\u65E5\u8A8C\u8A18\u9304\u3002\u50C5\u9032\u884C\u672C\u5730\u52A0\u5BC6\u3002",
    "mkt.feat.3.title": "\u53EF\u4E92\u901A",
    "mkt.feat.3.desc": "500 \u591A\u7A2E\u901A\u8A0A\u5354\u5B9A\uFF0C\u5305\u62EC Matter\u3001Zigbee\u3001Z-Wave\u3002",
    "mkt.feat.4.title": "\u96B1\u5F62\u4EBA\u5DE5\u667A\u6167",
    "mkt.feat.4.desc": "\u5728\u80CC\u666F\u4E2D\u904B\u4F5C\uFF0C\u4E26\u5B78\u7FD2\u60A8\u7684\u65E5\u5E38\u4F5C\u606F\u3002",
    "mkt.faq.title": "\u5E38\u898B\u554F\u984C",
    "mkt.faq.1.q": "NEXUS \u662F\u5B8C\u5168\u514D\u8CBB\u7684\u55CE\uFF1F",
    "mkt.faq.1.a": "\u662F\u7684\u3002\u6838\u5FC3\u4F5C\u696D\u7CFB\u7D71\u548C\u672C\u5730\u63A7\u5236\u529F\u80FD\u5B8C\u5168\u514D\u8CBB\u3002",
    "mkt.faq.2.q": "\u54EA\u4E9B\u88DD\u7F6E\u53D7\u5230\u652F\u63F4\uFF1F",
    "mkt.faq.2.a": "Matter\u3001Zigbee\u3001Z-Wave \u88DD\u7F6E\uFF0C\u4EE5\u53CA\u8D85\u904E 500 \u500B\u57FA\u65BC API \u7684\u751F\u614B\u7CFB\u7D71\u3002",
    "mkt.faq.3.q": "\u5982\u679C\u6C92\u6709\u96F2\u7AEF\u9023\u7DDA\uFF0C\u5B83\u9084\u80FD\u904B\u4F5C\u55CE\uFF1F",
    "mkt.faq.3.a": "\u662F\u7684\u3002\u5B83\u900F\u904E\u5340\u57DF\u7DB2\u8DEF\u8207\u60A8\u7684\u88DD\u7F6E\u9032\u884C\u901A\u8A0A\uFF0C\u5373\u4F7F\u7DB2\u8DEF\u4E2D\u65B7\u4E5F\u80FD\u6B63\u5E38\u904B\u4F5C\u3002",
    "mkt.faq.4.q": "\u9060\u7AEF\u5B58\u53D6\u662F\u900F\u904E\u4F55\u7A2E\u65B9\u5F0F\u63D0\u4F9B\u7684\uFF1F",
    "mkt.faq.4.a": "\u900F\u904E Premium \u65B9\u6848\u6216\u60A8\u81EA\u5DF1\u7684 VPN\uFF0C\u7D93\u7531\u5B89\u5168\u7684\u7AEF\u5C0D\u7AEF\u52A0\u5BC6\u901A\u9053\u9032\u884C\u9023\u7DDA\u3002",
    "mkt.desktop.eyebrow": "\u684C\u9762",
    "mkt.desktop.title": "\u6BCF\u500B\u684C\u9762\u50C5\u9700\u4E00\u500B\u61C9\u7528\u7A0B\u5F0F",
    "mkt.desktop.desc": "\u91DD\u5C0D Windows\u3001macOS \u548C Linux \u7684\u539F\u751F\u7248\u672C\u2014\u2014\u6BCF\u500B\u7248\u672C\u5747\u91DD\u5C0D\u5176\u5E73\u53F0\u9032\u884C\u4E86\u512A\u5316\u3002",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "\u91DD\u5C0D Windows 10 \u8207 11 \u9032\u884C\u4E86\u512A\u5316\uFF0C\u53EF\u7121\u7E2B\u5730\u5728\u80CC\u666F\u4E2D\u904B\u4F5C\u3002",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u5C08\u70BA Apple Silicon \u8207 Intel \u8A2D\u8A08\uFF0C\u4E26\u5177\u5099\u6DF1\u5EA6\u7CFB\u7D71\u6574\u5408\u529F\u80FD\u3002",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "\u8F15\u91CF\u3001\u5FEB\u901F\uFF0C\u4E14\u76F8\u5BB9\u65BC\u6240\u6709\u4E3B\u8981\u767C\u884C\u7248\u3002",
    "mkt.desktop.download": "\u4E0B\u8F09",
    "mkt.mobile.eyebrow": "\u884C\u52D5\u7248",
    "mkt.mobile.title": "\u53E3\u888B\u88E1\u7684\u5BB6",
    "mkt.mobile.desc": "NEXUS \u4F34\u4FB6\u61C9\u7528\u7A0B\u5F0F\u8B93\u60A8\u96A8\u6642\u96A8\u5730\u90FD\u80FD\u8F15\u9B06\u638C\u63A7\u4E00\u5207\u3002",
    "mkt.mobile.feat1.title": "\u96A8\u6642\u96A8\u5730\u8A9E\u97F3\u901A\u8A71",
    "mkt.mobile.feat1.desc": "\u900F\u904E\u88DD\u7F6E\u5167\u5EFA\u7684\u8A9E\u97F3\u8FA8\u8B58\u529F\u80FD\uFF0C\u7121\u8AD6\u8EAB\u5728\u4F55\u8655\u90FD\u80FD\u8207\u60A8\u7684\u667A\u6167\u5BB6\u5C45\u5C0D\u8A71\u3002",
    "mkt.mobile.feat2.title": "\u9060\u7AEF\u5B58\u53D6",
    "mkt.mobile.feat2.desc": "\u900F\u904E\u52A0\u5BC6\u96A7\u9053\u5B89\u5168\u5730\u9023\u7DDA\u81F3\u60A8\u7684\u5BB6\u5EAD\u7DB2\u8DEF\u3002",
    "mkt.mobile.feat3.title": "\u63A8\u64AD\u901A\u77E5",
    "mkt.mobile.feat3.desc": "\u91DD\u5C0D\u60A8\u95DC\u5FC3\u7684\u6D3B\u52D5\uFF0C\u7ACB\u5373\u63A5\u6536\u5373\u6642\u901A\u77E5\u3002",
    "mkt.mobile.feat4.title": "\u751F\u7269\u8FA8\u8B58\u9396",
    "mkt.mobile.feat4.desc": "Face ID \u548C\u6307\u7D0B\u8FA8\u8B58\u529F\u80FD\u53EF\u78BA\u4FDD\u60A8\u7684\u5BB6\u5EAD\u63A7\u5236\u7CFB\u7D71\u96B1\u79C1\u4E0D\u53D7\u4FB5\u72AF\u3002",
    "mkt.cta.title": "\u81EA\u5DF1\u7684\u5BB6\uFF0C\u81EA\u5DF1\u5B9A\u898F\u77E9\u3002",
    "mkt.cta.desc": "\u4E0B\u8F09 NEXUS\uFF0C\u5373\u53EF\u5F9E\u55AE\u4E00\u5E73\u53F0\u638C\u63A7\u6240\u6709\u88DD\u7F6E\u3002",
    "mkt.cta.button": "\u514D\u8CBB\u4E0B\u8F09",
    "mkt.footer.platforms": "\u5E73\u53F0",
    "Dim living room lights": "\u8ABF\u6697\u5BA2\u5EF3\u7684\u71C8\u5149",
    "Start morning news briefing": "\u958B\u59CB\u6668\u9593\u65B0\u805E\u7C21\u5831\u6703",
    "Movie night": "\u96FB\u5F71\u4E4B\u591C",
    "Good morning": "\u65E9\u5B89",
    "Leaving home": "\u96E2\u5BB6",
    "status.pctOnline": "{pct}% \u7DDA\u4E0A",
    "status.offlineCount": "{count} \u96E2\u7DDA",
    "status.allOnline": "\u6240\u6709\u88DD\u7F6E\u5747\u5DF2\u9023\u7DDA",
    "status.suggestionReady": "{count} \u7684\u5EFA\u8B70\u5DF2\u6E96\u5099\u597D\u4F9B\u60A8\u53C3\u8003\u3002",
    "status.suggestionsReady": "{count} \u7684\u5EFA\u8B70\u5DF2\u70BA\u60A8\u6E96\u5099\u597D\u3002",
    "status.caughtUp": "\u4F60\u5DF2\u7D93\u5168\u90E8\u8DDF\u4E0A\u4E86\u3002",
    "status.onlineOfTotal": "{online}/{total} \u7DDA\u4E0A\u7248",
    "mobile.menu": "\u9078\u55AE",
    "mobile.more": "\u66F4\u591A",
    "mobile.systemStatus": "NEXUS \u7CFB\u7D71\u72C0\u614B",
    "mobile.localNetwork": "\u5340\u57DF\u7DB2\u8DEF\u9023\u7DDA",
    "mobile.offline": "100% \u96E2\u7DDA",
    "mobile.localAI": "\u672C\u5730 AI \u5F15\u64CE",
    "mobile.deviceNetwork": "\u88DD\u7F6E\u7DB2\u8DEF",
    "mobile.online": "\u7DDA\u4E0A",
    "mobile.quickControls": "\u5FEB\u901F\u63A7\u5236\u9805",
    "mobile.privacyShield": "\u96E2\u7DDA\u96B1\u79C1\u4FDD\u8B77\u76FE",
    "mobile.active": "\u6709\u6548",
    "mobile.voiceWake": "\u8A9E\u97F3\u559A\u9192\uFF08\u300CNEXUS\u300D\uFF09",
    "mobile.on": "\u65BC",
    "mobile.autoBackup": "\u81EA\u52D5\u5BB6\u5EAD\u5099\u4EFD",
    "mobile.backupTime": "\u6BCF\u65E5 03:00",
    "mobile.moreSub.suggestions": "3 \u9805\u5DF2\u6392\u7A0B\u7684\u667A\u6167\u81EA\u52D5\u5316\u5EFA\u8B70",
    "mobile.moreSub.skills": "5 \u9805\u4E3B\u52D5\u8A9E\u614B\u6280\u5DE7\u8207\u61C9\u7528\u60C5\u5883",
    "mobile.moreSub.personalization": "\u52A9\u7406\u540D\u7A31\u3001\u8A9E\u97F3\u6A21\u578B\u8207\u96B1\u79C1\u6B0A\u8A2D\u5B9A",
    "mobile.moreSub.billing": "NEXUS \u5BB6\u5EAD\u65B9\u6848 \xB7 \u6709\u6548\u8A02\u95B1",
    "mobile.moreSub.downloads": "3 \u500B\u4F5C\u696D\u7CFB\u7D71\u5E73\u53F0\u7248\u672C\u8207 SHA-256 \u9A57\u8B49",
    "mobile.moreSub.platform": "\u8DE8\u5E73\u53F0\u88DD\u7F6E\u540C\u6B65",
    "mobile.moreSub.agents": "\u81EA\u4E3B\u4EBA\u5DE5\u667A\u6167\u4EE3\u7406",
    "mobile.moreSub.admin": "\u7CFB\u7D71\u7BA1\u7406\u8207\u6307\u6A19",
    "desktop.title": "\u500B\u4EBA\u4F5C\u696D\u7CFB\u7D71",
    "setup.welcome": "\u6B61\u8FCE",
    "setup.license": "\u6388\u6B0A\u689D\u6B3E",
    "setup.location": "\u5730\u9EDE",
    "setup.installing": "\u5B89\u88DD",
    "setup.finish": "\u5B8C\u6210",
    "setup.welcomeTitle": "\u6B61\u8FCE\u4F7F\u7528 NEXUS \u8A2D\u5B9A\u7A0B\u5F0F",
    "setup.welcomeDesc": "\u6B64\u7CBE\u9748\u5C07\u5F15\u5C0E\u60A8\u5B8C\u6210 NEXUS AI \u2014\u2014 \u60A8\u7684\u500B\u4EBA\u5BB6\u5EAD\u4F5C\u696D\u7CFB\u7D71 \u2014\u2014 \u7684\u5B89\u88DD\u7A0B\u5E8F\u3002",
    "setup.accept": "\u6211\u63A5\u53D7\u6B64\u6388\u6B0A\u5354\u8B70",
    "setup.chooseFolder": "\u9078\u64C7\u5B89\u88DD\u8CC7\u6599\u593E",
    "setup.installBtn": "\u5B89\u88DD",
    "setup.complete": "\u8A2D\u5B9A\u5B8C\u6210",
    "setup.launchNow": "\u7ACB\u5373\u555F\u52D5 NEXUS"
  },
  // ── Vietnamese ──
  vi: {
    "app.greeting": "Xin ch\xE0o {name}, t\xF4i c\xF3 th\u1EC3 gi\xFAp g\xEC cho b\u1EA1n?",
    "app.confirmNeeded": "{name}, thao t\xE1c \u0111\xF3 c\u1EA7n s\u1EF1 x\xE1c nh\u1EADn c\u1EE7a b\u1EA1n.",
    "download.title": "T\u1EA3i xu\u1ED1ng NEXUS",
    "download.primaryButton": "T\u1EA3i xu\u1ED1ng cho {os}",
    "download.otherOs": "B\u1EA1n \u0111ang s\u1EED d\u1EE5ng m\u1ED9t h\u1EC7 \u0111i\u1EC1u h\xE0nh kh\xE1c?",
    "download.checksum": "T\u1ED5ng ki\u1EC3m tra SHA-256",
    "screen.today": "H\xF4m nay",
    "screen.homeState": "Trang ch\u1EE7",
    "screen.suggestions": "G\u1EE3i \xFD",
    "screen.skills": "K\u1EF9 n\u0103ng",
    "screen.family": "Gia \u0111\xECnh",
    "screen.devices": "Thi\u1EBFt b\u1ECB",
    "screen.platform": "C\xE1c n\u1EC1n t\u1EA3ng",
    "screen.agents": "\u0110\u1EA1i l\xFD",
    "screen.personalization": "C\xE1 nh\xE2n h\xF3a",
    "screen.billing": "\u0110\u0103ng k\xFD",
    "screen.downloadCenter": "T\u1EA3i xu\u1ED1ng",
    "screen.adminDashboard": "B\u1EA3ng \u0111i\u1EC1u khi\u1EC3n qu\u1EA3n tr\u1ECB",
    "today.devicesOnline": "C\xE1c thi\u1EBFt b\u1ECB \u0111ang tr\u1EF1c tuy\u1EBFn",
    "today.energy": "N\u0103ng l\u01B0\u1EE3ng ng\xE0y nay",
    "today.activeRoutines": "C\xE1c b\xE0i t\u1EADp th\u1EC3 d\u1EE5c th\u01B0\u1EDDng xuy\xEAn",
    "today.suggestions": "G\u1EE3i \xFD",
    "screen.devices.empty": "Ch\u01B0a c\xF3 thi\u1EBFt b\u1ECB n\xE0o \u0111\u01B0\u1EE3c k\u1EBFt n\u1ED1i.",
    "screen.agents.empty": "Ch\u01B0a c\xF3 t\xE1c nh\xE2n n\xE0o \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh.",
    "screen.suggestions.empty": "Ch\u01B0a c\xF3 \u0111\u1EC1 xu\u1EA5t n\xE0o \u2014 NEXUS AI v\u1EABn \u0111ang trong qu\xE1 tr\xECnh h\u1ECDc t\u1EADp.",
    "screen.skills.empty": "Ch\u01B0a h\u1ECDc \u0111\u01B0\u1EE3c k\u1EF9 n\u0103ng n\xE0o.",
    "screen.homeState.empty": "Hi\u1EC7n t\u1EA1i ch\u01B0a c\xF3 ph\xF2ng n\xE0o \u0111\u01B0\u1EE3c trang b\u1ECB thi\u1EBFt b\u1ECB.",
    "plan.free": "Mi\u1EC5n ph\xED",
    "plan.premium": "Cao c\u1EA5p",
    "plan.family": "Gia \u0111\xECnh",
    "billing.manage": "Qu\u1EA3n l\xFD \u0111\u0103ng k\xFD",
    "auth.tagline": "H\u1EC7 \u0111i\u1EC1u h\xE0nh c\xE1 nh\xE2n d\xE0nh cho gia \u0111\xECnh c\u1EE7a b\u1EA1n",
    "auth.signInTitle": "\u0110\u0103ng nh\u1EADp v\xE0o NEXUS",
    "auth.signUpTitle": "T\u1EA1o t\xE0i kho\u1EA3n NEXUS c\u1EE7a b\u1EA1n",
    "auth.email": "Email",
    "auth.password": "M\u1EADt kh\u1EA9u",
    "auth.signInButton": "\u0110\u0103ng nh\u1EADp",
    "auth.signUpButton": "T\u1EA1o t\xE0i kho\u1EA3n",
    "auth.switchToSignUp": "L\u1EA7n \u0111\u1EA7u gh\xE9 th\u0103m? H\xE3y t\u1EA1o t\xE0i kho\u1EA3n",
    "auth.switchToSignIn": "B\u1EA1n \u0111\xE3 c\xF3 t\xE0i kho\u1EA3n ch\u01B0a? \u0110\u0103ng nh\u1EADp",
    "auth.passwordHint": "\xCDt nh\u1EA5t 8 k\xFD t\u1EF1",
    "auth.genericError": "\u0110\xE3 x\u1EA3y ra s\u1EF1 c\u1ED1. Vui l\xF2ng th\u1EED l\u1EA1i.",
    "auth.locked": "\u0110\xE3 c\xF3 qu\xE1 nhi\u1EC1u l\u1EA7n th\u1EED kh\xF4ng th\xE0nh c\xF4ng. H\xE3y th\u1EED l\u1EA1i trong {time}.",
    "auth.rateLimited": "C\xF3 qu\xE1 nhi\u1EC1u y\xEAu c\u1EA7u. Vui l\xF2ng th\u1EED l\u1EA1i sau.",
    "auth.logout": "\u0110\u0103ng xu\u1EA5t",
    "auth.welcome": "Ch\xE0o m\u1EEBng, {name}",
    "auth.continue": "Ti\u1EBFp t\u1EE5c",
    "auth.guest": "Ti\u1EBFp t\u1EE5c v\u1EDBi t\u01B0 c\xE1ch kh\xE1ch",
    "auth.guestHint": "Kh\xE1m ph\xE1 NEXUS m\xE0 kh\xF4ng c\u1EA7n t\xE0i kho\u1EA3n",
    "auth.social.divider": "ho\u1EB7c ti\u1EBFp t\u1EE5c b\u1EB1ng email",
    "auth.social.google": "Ti\u1EBFp t\u1EE5c v\u1EDBi Google",
    "auth.social.apple": "Ti\u1EBFp t\u1EE5c v\u1EDBi Apple",
    "auth.social.unavailable": "Ph\u01B0\u01A1ng th\u1EE9c \u0111\u0103ng nh\u1EADp n\xE0y ch\u01B0a \u0111\u01B0\u1EE3c thi\u1EBFt l\u1EADp.",
    "auth.social.error": "Kh\xF4ng th\u1EC3 \u0111\u0103ng nh\u1EADp b\u1EB1ng nh\xE0 cung c\u1EA5p \u0111\xF3. Vui l\xF2ng th\u1EED l\u1EA1i.",
    "mkt.nav.features": "T\xEDnh n\u0103ng",
    "mkt.nav.pricing": "Gi\xE1 c\u1EA3",
    "mkt.nav.testimonials": "L\u1EDDi ch\u1EE9ng th\u1EF1c",
    "mkt.nav.integrations": "T\xEDch h\u1EE3p",
    "mkt.nav.about": "Gi\u1EDBi thi\u1EC7u v\u1EC1 ch\xFAng t\xF4i",
    "mkt.nav.download": "T\u1EA3i xu\u1ED1ng",
    "mkt.nav.faq": "C\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p",
    "mkt.nav.signIn": "\u0110\u0103ng nh\u1EADp",
    "mkt.hero.badge": "v{version} \xB7 Windows \xB7 macOS \xB7 Linux",
    "mkt.hero.title": "T\u1EA3i xu\u1ED1ng \u1EE9ng d\u1EE5ng NEXUS cho m\u1ECDi thi\u1EBFt b\u1ECB b\u1EA1n \u0111ang s\u1EDF h\u1EEFu",
    "mkt.hero.desc": "NEXUS l\xE0 m\u1ED9t h\u1EC7 \u0111i\u1EC1u h\xE0nh c\xE1 nh\xE2n \u01B0u ti\xEAn \u0111i\u1EC1u khi\u1EC3n b\u1EB1ng gi\u1ECDng n\xF3i v\xE0 ch\xFA tr\u1ECDng b\u1EA3o m\u1EADt. H\xE3y c\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng m\xE1y t\xEDnh \u0111\u1EC3 b\xE0n ho\u1EB7c \u1EE9ng d\u1EE5ng \u0111\u1ED3ng h\xE0nh tr\xEAn thi\u1EBFt b\u1ECB di \u0111\u1ED9ng \u0111\u1EC3 \u0111i\u1EC1u khi\u1EC3n m\u1ECDi thi\u1EBFt b\u1ECB t\u1EEB m\u1ED9t n\u01A1i duy nh\u1EA5t \u2014 100% x\u1EED l\xFD ngay tr\xEAn thi\u1EBFt b\u1ECB. B\u1EA1n s\u1EED d\u1EE5ng n\xF3 tr\u1EF1c ti\u1EBFp t\u1EEB \u1EE9ng d\u1EE5ng, kh\xF4ng ph\u1EA3i qua tr\xECnh duy\u1EC7t.",
    "mkt.hero.actionPrimary": "T\u1EA3i xu\u1ED1ng cho {os} \xB7 v{version}",
    "mkt.hero.actionSecondary": "H\xE3y xem n\xF3 ho\u1EA1t \u0111\u1ED9ng nh\u01B0 th\u1EBF n\xE0o",
    "mkt.hero.trust": "\u2605 H\u01A1n 500.000 ng\u01B0\u1EDDi d\xF9ng \xB7 H\u01A1n 2.000 thi\u1EBFt b\u1ECB th\xF4ng minh \xB7 B\u1EA3o m\u1EADt d\u1EEF li\u1EC7u 100% t\u1EA1i \u0111\u1ECBa ph\u01B0\u01A1ng",
    "mkt.stats.title": "NEXUS qua c\xE1c con s\u1ED1",
    "mkt.stats.users": "Ng\u01B0\u1EDDi d\xF9ng ho\u1EA1t \u0111\u1ED9ng",
    "mkt.stats.devices": "C\xE1c thi\u1EBFt b\u1ECB \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3",
    "mkt.stats.privacy": "Quy\u1EC1n ri\xEAng t\u01B0 tr\xEAn thi\u1EBFt b\u1ECB",
    "mkt.stats.rating": "\u0110i\u1EC3m \u0111\xE1nh gi\xE1 trung b\xECnh",
    "mkt.privacy.title": "D\u1EEF li\u1EC7u c\u1EE7a b\u1EA1n l\xE0 c\u1EE7a b\u1EA1n",
    "mkt.privacy.processing": "X\u1EED l\xFD 100% ngay tr\xEAn thi\u1EBFt b\u1ECB",
    "mkt.privacy.encryption": "M\xE3 h\xF3a c\u1EE5c b\u1ED9 t\u1EEB \u0111\u1EA7u \u0111\u1EBFn cu\u1ED1i",
    "mkt.privacy.logging": "Kh\xF4ng ghi nh\u1EADt k\xFD tr\xEAn \u0111\xE1m m\xE2y",
    "mkt.how.title": "C\xE1ch th\u1EE9c ho\u1EA1t \u0111\u1ED9ng",
    "mkt.how.step1.title": "T\u1EA3i xu\u1ED1ng",
    "mkt.how.step1.desc": "H\xE3y t\u1EA3i \u1EE9ng d\u1EE5ng d\xE0nh cho n\u1EC1n t\u1EA3ng c\u1EE7a b\u1EA1n.",
    "mkt.how.step2.title": "C\xE0i \u0111\u1EB7t",
    "mkt.how.step2.desc": "Ho\xE0n t\u1EA5t qu\xE1 tr\xECnh c\xE0i \u0111\u1EB7t t\u1EA1i \u0111\u1ECBa ph\u01B0\u01A1ng ch\u1EC9 trong v\xE0i gi\xE2y.",
    "mkt.how.step3.title": "K\u1EBFt n\u1ED1i c\xE1c thi\u1EBFt b\u1ECB",
    "mkt.how.step3.desc": "H\xE3y b\u1EAFt \u0111\u1EA7u qu\u1EA3n l\xFD ng\xF4i nh\xE0 th\xF4ng minh c\u1EE7a b\u1EA1n m\u1ED9t c\xE1ch an to\xE0n.",
    "mkt.preview.title": "Xem NEXUS ho\u1EA1t \u0111\u1ED9ng nh\u01B0 th\u1EBF n\xE0o",
    "mkt.preview.desc": "H\xECnh \u1EA3nh tr\u1EF1c ti\u1EBFp v\u1EC1 giao di\u1EC7n \u0111i\u1EC1u khi\u1EC3n th\u1EF1c t\u1EBF m\xE0 b\u1EA1n s\u1EBD th\u1EA5y ngay khi c\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng.",
    "mkt.preview.tab.today": "H\xF4m nay",
    "mkt.preview.tab.devices": "Thi\u1EBFt b\u1ECB",
    "mkt.preview.tab.skills": "Th\xF3i quen",
    "mkt.preview.tab.family": "Gia \u0111\xECnh",
    "mkt.download.mobile.title": "\u1EE8ng d\u1EE5ng di \u0111\u1ED9ng",
    "mkt.download.mobile.desc": "C\xE1c \u1EE9ng d\u1EE5ng iOS v\xE0 Android s\u1EBD s\u1EDBm ra m\u1EAFt.",
    "mkt.download.mobile.apple": "T\u1EA3i xu\u1ED1ng t\u1EA1i",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "H\xE3y b\u1EAFt \u0111\u1EA7u ngay",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "S\u1EAFp t\u1EDBi",
    "mkt.seo.title": "NEXUS \u2014 T\u1EA3i xu\u1ED1ng h\u1EC7 \u0111i\u1EC1u h\xE0nh c\xE1 nh\xE2n c\u1EE7a b\u1EA1n",
    "mkt.seo.desc": "T\u1EA3i xu\u1ED1ng NEXUS cho Windows, macOS v\xE0 Linux. Phi\xEAn b\u1EA3n d\xE0nh cho iOS v\xE0 Android s\u1EBD s\u1EDBm ra m\u1EAFt.",
    "mkt.skipToContent": "Chuy\u1EC3n th\u1EB3ng \u0111\u1EBFn n\u1ED9i dung",
    "mkt.pricing.title": "Ch\xEDnh s\xE1ch gi\xE1 c\u1EA3 \u0111\u01A1n gi\u1EA3n, minh b\u1EA1ch",
    "mkt.pricing.free": "Mi\u1EC5n ph\xED",
    "mkt.pricing.freeDesc": "T\u1EA5t c\u1EA3 nh\u1EEFng g\xEC b\u1EA1n c\u1EA7n \u0111\u1EC3 x\xE2y d\u1EF1ng m\u1ED9t ng\xF4i nh\xE0 th\xF4ng minh t\u1EA1i \u0111\u1ECBa ph\u01B0\u01A1ng.",
    "mkt.pricing.premium": "Cao c\u1EA5p",
    "mkt.pricing.premiumDesc": "X\u1EED l\xFD AI ti\xEAn ti\u1EBFn v\xE0 truy c\u1EADp t\u1EEB xa.",
    "mkt.pricing.family": "Gia \u0111\xECnh",
    "mkt.pricing.familyDesc": "T\u1ED1i \u0111a 5 t\xE0i kho\u1EA3n v\u1EDBi quy\u1EC1n ki\u1EC3m so\xE1t truy c\u1EADp \u0111\u1EA7y \u0111\u1EE7.",
    "mkt.pricing.cta": "B\u1EAFt \u0111\u1EA7u mi\u1EC5n ph\xED",
    "mkt.testimonials.title": "\u0110\u01B0\u1EE3c nh\u1EEFng ng\u01B0\u1EDDi \u0111am m\xEA nh\xE0 th\xF4ng minh y\xEAu th\xEDch",
    "mkt.testimonials.quote1": "NEXUS \u0111\xE3 ho\xE0n to\xE0n thay \u0111\u1ED5i c\xE1ch t\xF4i t\u01B0\u01A1ng t\xE1c v\u1EDBi ng\xF4i nh\xE0 c\u1EE7a m\xECnh. Vi\u1EC7c m\u1ECDi th\u1EE9 \u0111\u1EC1u \u0111\u01B0\u1EE3c x\u1EED l\xFD ngay t\u1EA1i ch\u1ED7 th\u1EF1c s\u1EF1 nhanh h\u01A1n r\u1EA5t nhi\u1EC1u.",
    "mkt.testimonials.author1": "Sarah Jenkins",
    "mkt.testimonials.role1": "Ng\u01B0\u1EDDi d\xF9ng ti\xEAn phong",
    "mkt.testimonials.quote2": "Cu\u1ED1i c\xF9ng th\xEC c\u0169ng c\xF3 m\u1ED9t trung t\xE2m \u0111i\u1EC1u khi\u1EC3n nh\xE0 th\xF4ng minh t\xF4n tr\u1ECDng quy\u1EC1n ri\xEAng t\u01B0 c\u1EE7a t\xF4i. Kh\u1EA3 n\u0103ng x\u1EED l\xFD AI c\u1EE5c b\u1ED9 c\u1EF1c k\u1EF3 nh\u1EA1y b\xE9n.",
    "mkt.testimonials.author2": "David Chen",
    "mkt.testimonials.role2": "K\u1EF9 s\u01B0 ph\u1EA7n m\u1EC1m",
    "mkt.testimonials.quote3": "Vi\u1EC7c thi\u1EBFt l\u1EADp c\xE1c quy tr\xECnh ph\u1EE9c t\u1EA1p th\u1EADt d\u1EC5 d\xE0ng. T\xF4i r\u1EA5t th\xEDch \u0111i\u1EC3m l\xE0 \u1EE9ng d\u1EE5ng n\xE0y v\u1EABn ho\u1EA1t \u0111\u1ED9ng b\xECnh th\u01B0\u1EDDng ngay c\u1EA3 khi m\u1EA1ng internet b\u1ECB ng\u1EAFt k\u1EBFt n\u1ED1i.",
    "mkt.testimonials.author3": "Emma Thompson",
    "mkt.testimonials.role3": "Ng\u01B0\u1EDDi \u0111am m\xEA nh\xE0 th\xF4ng minh",
    "mkt.integrations.title": "T\u01B0\u01A1ng th\xEDch v\u1EDBi c\xE1c thi\u1EBFt b\u1ECB y\xEAu th\xEDch c\u1EE7a b\u1EA1n",
    "mkt.changelog.title": "C\xF3 g\xEC m\u1EDBi trong phi\xEAn b\u1EA3n 3.14.2",
    "mkt.requirements.title": "Y\xEAu c\u1EA7u h\u1EC7 th\u1ED1ng",
    "mkt.requirements.desc": "Y\xEAu c\u1EA7u h\u1EC7 \u0111i\u1EC1u h\xE0nh 64-bit v\xE0 \xEDt nh\u1EA5t 2GB RAM.",
    "mkt.footer.desc": "H\u1EC7 \u0111i\u1EC1u h\xE0nh gia \u0111\xECnh c\xE1 nh\xE2n \u01B0u ti\xEAn gi\u1ECDng n\xF3i c\u1EE7a b\u1EA1n. Ho\xE0n to\xE0n ch\u1EA1y tr\xEAn thi\u1EBFt b\u1ECB c\u1EE5c b\u1ED9, ho\xE0n to\xE0n thu\u1ED9c v\u1EC1 b\u1EA1n.",
    "mkt.footer.product": "S\u1EA3n ph\u1EA9m",
    "mkt.footer.company": "C\xF4ng ty & Ph\xE1p l\xFD",
    "mkt.footer.about": "Gi\u1EDBi thi\u1EC7u v\u1EC1 ch\xFAng t\xF4i",
    "mkt.footer.privacy": "Ch\xEDnh s\xE1ch b\u1EA3o m\u1EADt",
    "mkt.footer.terms": "\u0110i\u1EC1u kho\u1EA3n d\u1ECBch v\u1EE5",
    "mkt.footer.noCookies": "Ch\xFAng t\xF4i kh\xF4ng s\u1EED d\u1EE5ng b\u1EA5t k\u1EF3 cookie n\xE0o.",
    "mkt.cookie.title": "Quy\u1EC1n ri\xEAng t\u01B0 v\xE0 Cookie",
    "mkt.cookie.desc": "Ch\xFAng t\xF4i s\u1EED d\u1EE5ng c\xE1c cookie thi\u1EBFt y\u1EBFu \u0111\u1EC3 cung c\u1EA5p d\u1ECBch v\u1EE5. B\u1EB1ng c\xE1ch ti\u1EBFp t\u1EE5c s\u1EED d\u1EE5ng trang web, b\u1EA1n \u0111\u1ED3ng \xFD v\u1EDBi vi\u1EC7c ch\xFAng t\xF4i s\u1EED d\u1EE5ng c\xE1c c\xF4ng ngh\u1EC7 c\u1EA7n thi\u1EBFt n\xE0y.",
    "mkt.cookie.accept": "Hi\u1EC3u r\u1ED3i",
    "mkt.cookie.decline": "C\xE0i \u0111\u1EB7t",
    "mkt.feat.why": "T\u1EA1i sao l\u1EA1i l\xE0 NEXUS?",
    "mkt.feat.1.title": "\u0110i\u1EC1u khi\u1EC3n \u01B0u ti\xEAn gi\u1ECDng n\xF3i",
    "mkt.feat.1.desc": "T\u01B0\u01A1ng t\xE1c v\u1EDBi ng\xF4i nh\xE0 c\u1EE7a b\u1EA1n m\u1ED9t c\xE1ch t\u1EF1 nhi\xEAn.",
    "mkt.feat.2.title": "\u0110\u01B0\u1EE3c thi\u1EBFt k\u1EBF \u0111\u1EC3 b\u1EA3o m\u1EADt",
    "mkt.feat.2.desc": "Kh\xF4ng l\u01B0u tr\u1EEF tr\xEAn \u0111\xE1m m\xE2y, kh\xF4ng ghi nh\u1EADt k\xFD. Ch\u1EC9 m\xE3 h\xF3a t\u1EA1i thi\u1EBFt b\u1ECB.",
    "mkt.feat.3.title": "T\u01B0\u01A1ng th\xEDch",
    "mkt.feat.3.desc": "H\u01A1n 500 giao th\u1EE9c, bao g\u1ED3m Matter, Zigbee, Z-Wave.",
    "mkt.feat.4.title": "Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o v\xF4 h\xECnh",
    "mkt.feat.4.desc": "Ho\u1EA1t \u0111\u1ED9ng ng\u1EA7m, t\u1EF1 \u0111\u1ED9ng ghi nh\u1EDB th\xF3i quen c\u1EE7a b\u1EA1n.",
    "mkt.faq.title": "C\xE1c c\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p",
    "mkt.faq.1.q": "NEXUS c\xF3 ho\xE0n to\xE0n mi\u1EC5n ph\xED kh\xF4ng?",
    "mkt.faq.1.a": "\u0110\xFAng v\u1EADy. H\u1EC7 \u0111i\u1EC1u h\xE0nh c\u1ED1t l\xF5i v\xE0 c\xE1c t\xEDnh n\u0103ng \u0111i\u1EC1u khi\u1EC3n c\u1EE5c b\u1ED9 ho\xE0n to\xE0n mi\u1EC5n ph\xED.",
    "mkt.faq.2.q": "Nh\u1EEFng thi\u1EBFt b\u1ECB n\xE0o \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3?",
    "mkt.faq.2.a": "C\xE1c thi\u1EBFt b\u1ECB Matter, Zigbee, Z-Wave v\xE0 h\u01A1n 500 h\u1EC7 sinh th\xE1i d\u1EF1a tr\xEAn API.",
    "mkt.faq.3.q": "N\xF3 c\xF3 ho\u1EA1t \u0111\u1ED9ng \u0111\u01B0\u1EE3c khi kh\xF4ng k\u1EBFt n\u1ED1i v\u1EDBi \u0111\xE1m m\xE2y kh\xF4ng?",
    "mkt.faq.3.a": "\u0110\xFAng v\u1EADy. Thi\u1EBFt b\u1ECB n\xE0y k\u1EBFt n\u1ED1i v\u1EDBi c\xE1c thi\u1EBFt b\u1ECB c\u1EE7a b\u1EA1n qua m\u1EA1ng n\u1ED9i b\u1ED9 v\xE0 v\u1EABn ho\u1EA1t \u0111\u1ED9ng ngay c\u1EA3 khi m\u1EA1ng Internet b\u1ECB ng\u1EAFt k\u1EBFt n\u1ED1i.",
    "mkt.faq.4.q": "D\u1ECBch v\u1EE5 truy c\u1EADp t\u1EEB xa \u0111\u01B0\u1EE3c cung c\u1EA5p nh\u01B0 th\u1EBF n\xE0o?",
    "mkt.faq.4.a": "Th\xF4ng qua m\u1ED9t \u0111\u01B0\u1EDDng h\u1EA7m \u0111\u01B0\u1EE3c m\xE3 h\xF3a an to\xE0n t\u1EEB \u0111\u1EA7u \u0111\u1EBFn cu\u1ED1i v\u1EDBi g\xF3i Premium ho\u1EB7c m\u1EA1ng VPN ri\xEAng c\u1EE7a b\u1EA1n.",
    "mkt.desktop.eyebrow": "M\xE1y t\xEDnh \u0111\u1EC3 b\xE0n",
    "mkt.desktop.title": "M\u1ED9t \u1EE9ng d\u1EE5ng cho m\u1ED7i m\xE1y t\xEDnh \u0111\u1EC3 b\xE0n",
    "mkt.desktop.desc": "C\xE1c b\u1EA3n d\u1EF1ng g\u1ED1c d\xE0nh cho Windows, macOS v\xE0 Linux \u2014 m\u1ED7i b\u1EA3n \u0111\u1EC1u \u0111\u01B0\u1EE3c t\u1ED1i \u01B0u h\xF3a ri\xEAng cho n\u1EC1n t\u1EA3ng t\u01B0\u01A1ng \u1EE9ng.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "\u0110\u01B0\u1EE3c t\u1ED1i \u01B0u h\xF3a cho Windows 10 v\xE0 11 v\u1EDBi kh\u1EA3 n\u0103ng ho\u1EA1t \u0111\u1ED9ng m\u01B0\u1EE3t m\xE0 \u1EDF ch\u1EBF \u0111\u1ED9 n\u1EC1n.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "\u0110\u01B0\u1EE3c thi\u1EBFt k\u1EBF d\xE0nh cho Apple Silicon v\xE0 Intel v\u1EDBi kh\u1EA3 n\u0103ng t\xEDch h\u1EE3p s\xE2u v\xE0o h\u1EC7 th\u1ED1ng.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Nh\u1EB9, nhanh v\xE0 t\u01B0\u01A1ng th\xEDch v\u1EDBi t\u1EA5t c\u1EA3 c\xE1c b\u1EA3n ph\xE2n ph\u1ED1i ch\xEDnh.",
    "mkt.desktop.download": "T\u1EA3i xu\u1ED1ng",
    "mkt.mobile.eyebrow": "Di \u0111\u1ED9ng",
    "mkt.mobile.title": "Ng\xF4i nh\xE0 c\u1EE7a b\u1EA1n ngay trong t\xFAi",
    "mkt.mobile.desc": "\u1EE8ng d\u1EE5ng \u0111\u1ED3ng h\xE0nh NEXUS gi\xFAp b\u1EA1n d\u1EC5 d\xE0ng \u0111i\u1EC1u khi\u1EC3n m\u1ECDi th\u1EE9 ch\u1EC9 b\u1EB1ng m\u1ED9t c\xFA ch\u1EA1m \u2014 d\xF9 b\u1EA1n \u0111ang \u1EDF \u0111\xE2u.",
    "mkt.mobile.feat1.title": "Gi\u1ECDng n\xF3i m\u1ECDi l\xFAc m\u1ECDi n\u01A1i",
    "mkt.mobile.feat1.desc": "Tr\xF2 chuy\u1EC7n v\u1EDBi ng\xF4i nh\xE0 c\u1EE7a b\u1EA1n t\u1EEB b\u1EA5t c\u1EE9 \u0111\xE2u nh\u1EDD t\xEDnh n\u0103ng nh\u1EADn di\u1EC7n gi\u1ECDng n\xF3i t\xEDch h\u1EE3p tr\xEAn thi\u1EBFt b\u1ECB.",
    "mkt.mobile.feat2.title": "Truy c\u1EADp t\u1EEB xa",
    "mkt.mobile.feat2.desc": "K\u1EBFt n\u1ED1i an to\xE0n v\u1EDBi m\u1EA1ng gia \u0111\xECnh c\u1EE7a b\u1EA1n th\xF4ng qua m\u1ED9t \u0111\u01B0\u1EDDng h\u1EA7m \u0111\u01B0\u1EE3c m\xE3 h\xF3a.",
    "mkt.mobile.feat3.title": "Th\xF4ng b\xE1o \u0111\u1EA9y",
    "mkt.mobile.feat3.desc": "Nh\u1EADn th\xF4ng b\xE1o ngay l\u1EADp t\u1EE9c v\u1EC1 c\xE1c s\u1EF1 ki\u1EC7n quan tr\u1ECDng \u0111\u1ED1i v\u1EDBi b\u1EA1n.",
    "mkt.mobile.feat4.title": "Kh\xF3a sinh tr\u1EAFc h\u1ECDc",
    "mkt.mobile.feat4.desc": "Face ID v\xE0 c\u1EA3m bi\u1EBFn v\xE2n tay gi\xFAp b\u1EA3o v\u1EC7 s\u1EF1 ri\xEAng t\u01B0 cho c\xE1c thi\u1EBFt b\u1ECB \u0111i\u1EC1u khi\u1EC3n trong nh\xE0 c\u1EE7a b\u1EA1n.",
    "mkt.cta.title": "Nh\xE0 c\u1EE7a b\u1EA1n, quy t\u1EAFc c\u1EE7a b\u1EA1n.",
    "mkt.cta.desc": "T\u1EA3i xu\u1ED1ng NEXUS v\xE0 \u0111i\u1EC1u khi\u1EC3n m\u1ECDi thi\u1EBFt b\u1ECB t\u1EEB m\u1ED9t n\u01A1i duy nh\u1EA5t.",
    "mkt.cta.button": "T\u1EA3i xu\u1ED1ng mi\u1EC5n ph\xED",
    "mkt.footer.platforms": "C\xE1c n\u1EC1n t\u1EA3ng",
    "Dim living room lights": "Gi\u1EA3m \u0111\u1ED9 s\xE1ng \u0111\xE8n ph\xF2ng kh\xE1ch",
    "Start morning news briefing": "B\u1EAFt \u0111\u1EA7u bu\u1ED5i h\u1ECDp b\xE1o s\xE1ng",
    "Movie night": "\u0110\xEAm chi\u1EBFu phim",
    "Good morning": "Ch\xE0o bu\u1ED5i s\xE1ng",
    "Leaving home": "R\u1EDDi kh\u1ECFi nh\xE0",
    "status.pctOnline": "{pct}% tr\u1EF1c tuy\u1EBFn",
    "status.offlineCount": "{count} ngo\u1EA1i tuy\u1EBFn",
    "status.allOnline": "T\u1EA5t c\u1EA3 c\xE1c thi\u1EBFt b\u1ECB \u0111ang tr\u1EF1c tuy\u1EBFn",
    "status.suggestionReady": "\u0110\u1EC1 xu\u1EA5t v\u1EC1 {count} \u0111\xE3 s\u1EB5n s\xE0ng d\xE0nh cho b\u1EA1n.",
    "status.suggestionsReady": "C\xE1c \u0111\u1EC1 xu\u1EA5t v\u1EC1 {count} \u0111\xE3 s\u1EB5n s\xE0ng d\xE0nh cho b\u1EA1n.",
    "status.caughtUp": "B\xE2y gi\u1EDD b\u1EA1n \u0111\xE3 n\u1EAFm r\xF5 m\u1ECDi chuy\u1EC7n r\u1ED3i.",
    "status.onlineOfTotal": "{online}/{total} tr\u1EF1c tuy\u1EBFn",
    "mobile.menu": "Th\u1EF1c \u0111\u01A1n",
    "mobile.more": "Xem th\xEAm",
    "mobile.systemStatus": "T\xECnh tr\u1EA1ng h\u1EC7 th\u1ED1ng NEXUS",
    "mobile.localNetwork": "K\u1EBFt n\u1ED1i m\u1EA1ng n\u1ED9i b\u1ED9",
    "mobile.offline": "100% ngo\u1EA1i tuy\u1EBFn",
    "mobile.localAI": "C\xF4ng c\u1EE5 AI c\u1EE5c b\u1ED9",
    "mobile.deviceNetwork": "M\u1EA1ng thi\u1EBFt b\u1ECB",
    "mobile.online": "Tr\u1EF1c tuy\u1EBFn",
    "mobile.quickControls": "C\xC1C N\xDAT \u0110I\u1EC0U KHI\u1EC2N NHANH",
    "mobile.privacyShield": "Ch\u01B0\u01A1ng tr\xECnh B\u1EA3o v\u1EC7 Quy\u1EC1n ri\xEAng t\u01B0 Ngo\u1EA1i tuy\u1EBFn",
    "mobile.active": "Ho\u1EA1t \u0111\u1ED9ng",
    "mobile.voiceWake": "T\xEDnh n\u0103ng \u0111\xE1nh th\u1EE9c b\u1EB1ng gi\u1ECDng n\xF3i (\u201CNEXUS\u201D)",
    "mobile.on": "V\xE0o",
    "mobile.autoBackup": "Sao l\u01B0u t\u1EF1 \u0111\u1ED9ng t\u1EA1i nh\xE0",
    "mobile.backupTime": "H\xE0ng ng\xE0y l\xFAc 03:00",
    "mobile.moreSub.suggestions": "3 \u0111\u1EC1 xu\u1EA5t t\u1EF1 \u0111\u1ED9ng h\xF3a th\xF4ng minh \u0111\xE3 \u0111\u01B0\u1EE3c l\xEAn l\u1ECBch",
    "mobile.moreSub.skills": "5 k\u1EF9 n\u0103ng v\xE0 t\xECnh hu\u1ED1ng th\u1EF1c h\xE0nh v\u1EC1 gi\u1ECDng ch\u1EE7 \u0111\u1ED9ng",
    "mobile.moreSub.personalization": "T\xEAn tr\u1EE3 l\xFD, m\xF4 h\xECnh gi\u1ECDng n\xF3i v\xE0 c\xE0i \u0111\u1EB7t quy\u1EC1n ri\xEAng t\u01B0",
    "mobile.moreSub.billing": "G\xF3i c\u01B0\u1EDBc gia \u0111\xECnh NEXUS \xB7 \u0110ang s\u1EED d\u1EE5ng",
    "mobile.moreSub.downloads": "3 b\u1EA3n ph\xE1t h\xE0nh n\u1EC1n t\u1EA3ng h\u1EC7 \u0111i\u1EC1u h\xE0nh v\xE0 x\xE1c th\u1EF1c SHA-256",
    "mobile.moreSub.platform": "\u0110\u1ED3ng b\u1ED9 h\xF3a thi\u1EBFt b\u1ECB \u0111a n\u1EC1n t\u1EA3ng",
    "mobile.moreSub.agents": "C\xE1c t\xE1c nh\xE2n AI t\u1EF1 ch\u1EE7",
    "mobile.moreSub.admin": "Qu\u1EA3n tr\u1ECB h\u1EC7 th\u1ED1ng v\xE0 c\xE1c ch\u1EC9 s\u1ED1",
    "desktop.title": "H\u1EC7 \u0111i\u1EC1u h\xE0nh c\xE1 nh\xE2n",
    "setup.welcome": "Ch\xE0o m\u1EEBng",
    "setup.license": "Gi\u1EA5y ph\xE9p",
    "setup.location": "V\u1ECB tr\xED",
    "setup.installing": "C\xE0i \u0111\u1EB7t",
    "setup.finish": "Ho\xE0n th\xE0nh",
    "setup.welcomeTitle": "Ch\xE0o m\u1EEBng b\u1EA1n \u0111\u1EBFn v\u1EDBi NEXUS Setup",
    "setup.welcomeDesc": "Tr\xECnh h\u01B0\u1EDBng d\u1EABn n\xE0y s\u1EBD h\u1ED7 tr\u1EE3 b\u1EA1n trong qu\xE1 tr\xECnh c\xE0i \u0111\u1EB7t NEXUS AI \u2014 h\u1EC7 \u0111i\u1EC1u h\xE0nh c\xE1 nh\xE2n d\xE0nh cho gia \u0111\xECnh c\u1EE7a b\u1EA1n.",
    "setup.accept": "T\xF4i \u0111\u1ED3ng \xFD v\u1EDBi th\u1ECFa thu\u1EADn c\u1EA5p ph\xE9p",
    "setup.chooseFolder": "Ch\u1ECDn th\u01B0 m\u1EE5c c\xE0i \u0111\u1EB7t",
    "setup.installBtn": "C\xE0i \u0111\u1EB7t",
    "setup.complete": "Qu\xE1 tr\xECnh c\xE0i \u0111\u1EB7t \u0111\xE3 ho\xE0n t\u1EA5t",
    "setup.launchNow": "Kh\u1EDFi ch\u1EA1y NEXUS ngay b\xE2y gi\u1EDD"
  }
};
function resolveFromAcceptLanguage(header) {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.find((p) => p.startsWith("q="));
    const quality = q ? Number.parseFloat(q.slice(2)) : 1;
    return { tag: (tag ?? "").toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
  }).sort((a, b) => b.quality - a.quality);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0] ?? "";
    if (SUPPORTED_LOCALES.includes(base)) return base;
  }
  return DEFAULT_LOCALE;
}
function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => k in vars ? String(vars[k]) : `{${k}}`);
}
function translate(locale, key, vars = {}) {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  const template = catalog[key] ?? CATALOGS.en[key] ?? key;
  return interpolate(template, vars);
}

// ../design-system/src/index.ts
var SPACE = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
var FONT = {
  /** Primary display / UI font: Space Grotesk → Inter → system fallback. */
  family: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
  /** Monospace font for code, checksums, and terminal output. */
  familyMono: "'JetBrains Mono', 'Courier New', monospace",
  size: { sm: 12, md: 14, lg: 18, xl: 24, xxl: 32 }
};
var RADIUS = { sm: 6, md: 12, lg: 24, xl: 32 };
var TRANSITIONS = {
  fast: "160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  normal: "220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  slow: "320ms ease",
  spring: "400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)"
};
var lightTheme = {
  color: {
    bg: "#fcfcfd",
    // softer white
    surface: "#ffffff",
    text: "#0f172a",
    // rich slate
    textMuted: "#64748b",
    primary: "#4f46e5",
    // indigo primary for a premium feel, passes AA
    onPrimary: "#ffffff",
    accent: "#0ea5e9"
    // vibrant sky
  },
  space: SPACE,
  radius: RADIUS,
  font: FONT,
  shadow: {
    sm: "0 2px 4px rgba(0,0,0,0.02)",
    md: "0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
    lg: "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
    xl: "0 24px 64px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)",
    ring: "0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent)"
  },
  transition: TRANSITIONS
};
var darkTheme = {
  color: {
    bg: "#09090b",
    // deep zinc
    surface: "#111113",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    primary: "#818cf8",
    // slightly softer indigo for dark mode
    onPrimary: "#09090b",
    accent: "#38bdf8"
  },
  space: SPACE,
  radius: RADIUS,
  font: FONT,
  shadow: {
    sm: "0 2px 4px rgba(0,0,0,0.2)",
    md: "0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    lg: "0 12px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
    xl: "0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
    ring: "0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)"
  },
  transition: TRANSITIONS
};
function getTheme(name) {
  return name === "dark" ? darkTheme : lightTheme;
}

// ../interface/src/index.ts
var PLAN_RANK = { free: 0, premium: 1, family: 2 };
var SCREENS = [
  { id: "today", titleKey: "screen.today", requiresAuth: true },
  { id: "home-state", titleKey: "screen.homeState", requiresAuth: true },
  { id: "suggestions", titleKey: "screen.suggestions", requiresAuth: true },
  { id: "skills", titleKey: "screen.skills", requiresAuth: true },
  {
    id: "family",
    titleKey: "screen.family",
    requiresAuth: true,
    minPlan: "family",
    roles: ["admin"]
  },
  { id: "devices", titleKey: "screen.devices", requiresAuth: true },
  { id: "personalization", titleKey: "screen.personalization", requiresAuth: true },
  { id: "platform", titleKey: "screen.platform", requiresAuth: true },
  { id: "agents", titleKey: "screen.agents", requiresAuth: true },
  { id: "billing", titleKey: "screen.billing", requiresAuth: true, roles: ["admin"] },
  {
    id: "admin-dashboard",
    titleKey: "screen.adminDashboard",
    requiresAuth: true,
    roles: ["admin"]
  },
  // The Download Center is the public marketing page — no auth (FAZ 10/18).
  { id: "download-center", titleKey: "screen.downloadCenter", requiresAuth: false }
];
function canAccess(screen, ctx) {
  if (screen.requiresAuth && !ctx.authenticated) return false;
  if (screen.minPlan && PLAN_RANK[ctx.plan] < PLAN_RANK[screen.minPlan]) return false;
  if (screen.roles && !screen.roles.includes(ctx.role)) return false;
  return true;
}
function buildNavigation(ctx) {
  return SCREENS.filter((s) => canAccess(s, ctx));
}
function getScreen(id) {
  const found = SCREENS.find((s) => s.id === id);
  if (!found) throw new InterfaceError(`Unknown screen "${id}"`);
  return found;
}
function buildDeviceListModel(devices) {
  const onlineCount = devices.filter((d) => d.online).length;
  return {
    titleKey: getScreen("devices").titleKey,
    rows: devices,
    onlineCount,
    emptyStateKey: devices.length === 0 ? "screen.devices.empty" : void 0
  };
}
function buildPlatformModel() {
  return {
    titleKey: "screen.platform",
    platforms: [
      { id: "web", name: "Web App", active: true },
      { id: "desktop", name: "Desktop", active: false },
      { id: "mobile", name: "Mobile", active: false }
    ]
  };
}
function buildBillingModel(plan) {
  return {
    titleKey: getScreen("billing").titleKey,
    plan,
    planLabelKey: `plan.${plan}`,
    canUpgrade: plan !== "family",
    manageActionKey: "billing.manage"
  };
}
function buildPersonalizationModel(input) {
  return {
    titleKey: getScreen("personalization").titleKey,
    assistantName: input.assistantName,
    userAddress: input.userAddress,
    language: input.language,
    avatarUrl: input.avatarUrl
  };
}
function buildTodayModel(input) {
  const kwh = (input.energyWhToday / 1e3).toFixed(2);
  return {
    titleKey: getScreen("today").titleKey,
    cards: [
      { labelKey: "today.devicesOnline", value: `${input.devicesOnline}/${input.devicesTotal}` },
      { labelKey: "today.energy", value: `${kwh} kWh` },
      { labelKey: "today.activeRoutines", value: String(input.activeRoutines) },
      { labelKey: "today.suggestions", value: String(input.pendingSuggestions) }
    ],
    hasNudge: input.pendingSuggestions > 0
  };
}
function buildAdminDashboardModel() {
  return {
    id: "admin-dashboard",
    titleKey: getScreen("admin-dashboard").titleKey,
    totalUsers: 14502,
    activeDevices: 45290,
    revenue: "$32,500",
    recentLogs: [
      { time: "12:04", event: "User registration (us-east)" },
      { time: "11:59", event: "Device sync (hue-bridge)" },
      { time: "11:58", event: "Payment success (sub_123)" }
    ]
  };
}
function buildSuggestionsModel(rows) {
  return {
    titleKey: getScreen("suggestions").titleKey,
    rows,
    emptyStateKey: rows.length === 0 ? "screen.suggestions.empty" : void 0
  };
}
function buildSkillsModel(rows, discoverable = []) {
  const sorted = [...rows].sort((a, b) => b.usageCount - a.usageCount);
  return {
    titleKey: getScreen("skills").titleKey,
    rows: sorted,
    discoverable,
    emptyStateKey: sorted.length === 0 ? "screen.skills.empty" : void 0
  };
}
function buildAgentsModel(rows) {
  return {
    titleKey: getScreen("agents").titleKey,
    rows,
    emptyStateKey: rows.length === 0 ? "screen.agents.empty" : void 0
  };
}
function buildFamilyModel(members) {
  return {
    titleKey: getScreen("family").titleKey,
    members,
    adminCount: members.filter((m) => m.role === "admin").length
  };
}
function buildHomeStateModel(devices) {
  const byRoom = /* @__PURE__ */ new Map();
  for (const d of devices) {
    const entry = byRoom.get(d.room) ?? { total: 0, online: 0 };
    entry.total += 1;
    if (d.online) entry.online += 1;
    byRoom.set(d.room, entry);
  }
  const rooms = [...byRoom.entries()].map(([room, c]) => ({ room, total: c.total, online: c.online })).sort((a, b) => a.room.localeCompare(b.room));
  return {
    titleKey: getScreen("home-state").titleKey,
    rooms,
    emptyStateKey: rooms.length === 0 ? "screen.homeState.empty" : void 0
  };
}
var InterfaceError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InterfaceError";
  }
};

// ../infra/src/distribution.ts
var import_node_crypto5 = require("node:crypto");
function detectOs(userAgent) {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|win64|win32/.test(ua)) return "windows";
  if (/mac os x|macintosh/.test(ua)) return "macos";
  if (/linux|x11/.test(ua)) return "linux";
  return void 0;
}
function computeChecksum(contents) {
  return (0, import_node_crypto5.createHash)("sha256").update(contents).digest("hex");
}
var VersionInfoService = class {
  releases = /* @__PURE__ */ new Map();
  publish(release2) {
    this.releases.set(release2.platform, release2);
  }
  get(platform3) {
    return this.releases.get(platform3);
  }
  all() {
    return [...this.releases.values()];
  }
  /** The release to feature for a visitor, based on their User-Agent. */
  featuredFor(userAgent) {
    const platform3 = detectOs(userAgent);
    return platform3 ? this.releases.get(platform3) : void 0;
  }
};

// ../web/src/render.ts
var CURRENT_LOCALE = "en";
function setLocale(locale) {
  CURRENT_LOCALE = locale;
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderFontFaces() {
  const latinRange = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  const latinExtRange = "U+0100-024F, U+1E00-1EFF, U+20A0-20AB";
  function face(family, weight, subset, range) {
    return `@font-face { font-family: '${family}'; font-style: normal; font-display: swap; font-weight: ${weight}; src: url('/fonts/${family.toLowerCase().replace(/\s+/g, "-")}-${subset}-${weight}-normal.woff2') format('woff2'); unicode-range: ${range}; }`;
  }
  const faces = [];
  for (const w of [300, 400, 500, 600, 700]) {
    faces.push(face("Space Grotesk", w, "latin-ext", latinExtRange));
    faces.push(face("Space Grotesk", w, "latin", latinRange));
  }
  for (const w of [400, 500, 600, 700, 800]) {
    faces.push(face("Inter", w, "latin-ext", latinExtRange));
    faces.push(face("Inter", w, "latin", latinRange));
  }
  for (const w of [400, 500, 600, 700]) {
    faces.push(face("JetBrains Mono", w, "latin-ext", latinExtRange));
    faces.push(face("JetBrains Mono", w, "latin", latinRange));
  }
  return faces.join("\n");
}
function faviconDataUri(_primaryColor) {
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient><linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse"><stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/><rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
function label(key) {
  const locale = CURRENT_LOCALE in CATALOGS ? CURRENT_LOCALE : "en";
  const catalog = CATALOGS[locale];
  return catalog[key] ?? CATALOGS.en[key] ?? key;
}
function renderStatIcon(icon) {
  const icons = {
    devices: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/></svg>`,
    energy: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    routines: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    suggestions: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/></svg>`
  };
  return icons[icon] ?? icons.devices;
}
function renderEmptyState(text) {
  return `<div class="empty-state"><span class="empty-icon">${renderStatIcon("suggestions")}</span><p>${escapeHtml(text)}</p></div>`;
}
function parseRatio(value) {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(value.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return b > 0 ? { a, b } : null;
}
function renderRing(pct, center) {
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, pct)) * circ;
  return `<svg class="ring" width="96" height="96" viewBox="0 0 96 96" role="img" aria-hidden="true"><circle cx="48" cy="48" r="${radius}" fill="none" stroke="var(--border)" stroke-width="9"/><circle cx="48" cy="48" r="${radius}" fill="none" stroke="var(--primary)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 48 48)"/><text x="48" y="54" text-anchor="middle" font-size="22" font-weight="700" fill="var(--text)">${escapeHtml(center)}</text></svg>`;
}
function bentoTile(icon, title, value, extraClass = "") {
  return `<article class="bento-tile${extraClass ? ` ${extraClass}` : ""}"><div class="tile-head"><span class="cardicon">${renderStatIcon(icon)}</span><span class="tile-title">${escapeHtml(title)}</span></div><div class="value">${escapeHtml(value)}</div></article>`;
}
function renderTodayPanel(model) {
  const isTr = CURRENT_LOCALE === "tr";
  const byKey = (k) => model.cards.find((c) => c.labelKey === k)?.value ?? "";
  const devicesVal = byKey("today.devicesOnline");
  const ratio = parseRatio(devicesVal);
  const pct = ratio ? ratio.a / ratio.b : 0;
  const offline = ratio ? ratio.b - ratio.a : 0;
  const featured = `<article class="bento-tile featured"><div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span><span class="tile-title">${label("today.devicesOnline")}</span></div><div class="ring-wrap">${renderRing(pct, devicesVal)}<div class="ring-meta"><span class="value">${Math.round(pct * 100)}% online</span><span class="label">${offline > 0 ? `${offline} offline` : "All devices online"}</span></div></div></article>`;
  const energy = bentoTile("energy", label("today.energy"), byKey("today.energy"), "wide");
  const routines = bentoTile(
    "routines",
    label("today.activeRoutines"),
    byKey("today.activeRoutines")
  );
  const suggestions = bentoTile(
    "suggestions",
    label("today.suggestions"),
    byKey("today.suggestions")
  );
  const weeklyEnergyCard = `<article class="bento-tile analytics-tile"><div class="tile-head"><span class="cardicon">${renderStatIcon("energy")}</span><span class="tile-title">${isTr ? "Haftal\u0131k Enerji Trendi" : "Weekly Energy Trend"}</span></div><div class="analytics-value" style="font-size:20px;font-weight:700;margin-top:6px;">19.4 kWh <span style="font-size:12px;color:#10b981;font-weight:600;">-12%</span></div><div class="sparkline-wrap" style="margin-top:8px;"><svg class="sparkline" width="100%" height="28" viewBox="0 0 140 28" fill="none"><path d="M0 22 L20 16 L40 20 L60 10 L80 14 L100 6 L120 12 L140 4" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/><path d="M0 22 L20 16 L40 20 L60 10 L80 14 L100 6 L120 12 L140 4 L140 28 L0 28 Z" fill="color-mix(in srgb, var(--primary) 15%, transparent)"/></svg></div></article>`;
  const uptimeCard = `<article class="bento-tile analytics-tile"><div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span><span class="tile-title">${isTr ? "Sistem \xC7al\u0131\u015Fma S\xFCresi" : "System Uptime"}</span></div><div class="analytics-value" style="font-size:20px;font-weight:700;margin-top:6px;">99.98%</div><div class="analytics-sub" style="font-size:11px;color:var(--muted);margin-top:4px;">${isTr ? "14 g\xFCn 6 saat kesintisiz" : "14d 6h uninterrupted"}</div></article>`;
  const automationsCard = `<article class="bento-tile analytics-tile"><div class="tile-head"><span class="cardicon">${renderStatIcon("routines")}</span><span class="tile-title">${isTr ? "Toplam Otomasyon" : "Total Automations"}</span></div><div class="analytics-value" style="font-size:20px;font-weight:700;margin-top:6px;">1,420</div><div class="analytics-sub" style="font-size:11px;color:var(--muted);margin-top:4px;">${isTr ? "Bu ay tetiklendi" : "Triggered this month"}</div></article>`;
  const activeDeviceCard = `<article class="bento-tile analytics-tile"><div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span><span class="tile-title">${isTr ? "En Aktif Cihaz" : "Most Active Device"}</span></div><div class="analytics-value" style="font-size:14px;font-weight:700;margin-top:6px;">${isTr ? 'LG C3 65" 4K OLED TV' : 'LG C3 65" 4K OLED Smart TV'}</div><div class="analytics-sub" style="font-size:11px;color:var(--muted);margin-top:4px;">${isTr ? "Ort. 6.2 saat/g\xFCn" : "Avg 6.2 hrs/day"}</div></article>`;
  const sug = model.cards.find((c) => c.labelKey === "today.suggestions")?.value ?? "0";
  const msg = model.hasNudge ? `${sug} suggestion${sug === "1" ? "" : "s"} ready for you.` : "You're all caught up.";
  const strip = `<div class="assistant-strip"><span class="cardicon">${renderStatIcon("suggestions")}</span><div><span class="who">NEXUS AI</span> <span class="msg">${msg}</span></div><a class="btn" href="#suggestions" data-nav="suggestions">Review</a></div>`;
  const nudge = model.hasNudge ? '<span class="nudge" aria-label="new"></span>' : "";
  return `${nudge ? `<h2>${escapeHtml(label(model.titleKey))}<span class="nudge" aria-label="new"></span></h2>` : `<h2>${escapeHtml(label(model.titleKey))}</h2>`}<div class="bento">${featured}${energy}${routines}${suggestions}${weeklyEnergyCard}${uptimeCard}${automationsCard}${activeDeviceCard}${strip}</div>`;
}
function renderHomeState(model) {
  if (model.rooms.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.homeState.empty"))}`;
  }
  const rooms = model.rooms.map(
    (r) => `<div class="room-card">${renderStatIcon("devices")}<div class="room-info"><div class="label">${escapeHtml(r.room)}</div><div class="value">${r.online}/${r.total} devices online</div></div></div>`
  ).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${rooms}</div>`;
}
function renderDevices(model) {
  const isTr = CURRENT_LOCALE === "tr";
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.devices.empty"))}`;
  }
  const deviceDetails = {
    lamp: { en: "Brightness: 80%", tr: "Parlakl\u0131k: %80" },
    tv: { en: "HDMI 1 (PlayStation 5)", tr: "HDMI 1 (PlayStation 5)" },
    ac: { en: "Target: 22\xB0C", tr: "Hedef: 22\xB0C" },
    lock: { en: "Battery: 92%", tr: "Pil: %92" },
    speaker: { en: "Volume: 45%", tr: "Ses: %45" },
    camera: { en: "Battery: 88%", tr: "Pil: %88" },
    thermostat: { en: "Humidity: 45%", tr: "Nem: %45" },
    curtain: { en: "Position: 100% Open", tr: "Konum: %100 A\xE7\u0131k" }
  };
  const pills = model.rows.map((d) => {
    const detail = deviceDetails[d.id] ? isTr ? deviceDetails[d.id].tr : deviceDetails[d.id].en : "";
    const roomStr = d.room ? `${escapeHtml(d.room)} \xB7 ` : "";
    const statusText = d.online ? isTr ? "\xC7evrimi\xE7i" : "Online" : isTr ? "\xC7evrimd\u0131\u015F\u0131" : "Offline";
    const devIcons = {
      lamp: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
      tv: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>',
      ac: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 22l6-6"/><path d="M19 25l6-6"/></svg>',
      lock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
      speaker: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
      camera: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
      thermostat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
      curtain: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>'
    };
    const devIconSvg = devIcons[d.id] || renderStatIcon("devices");
    const iconHtml = `<span class="dev-icon" style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--primary) 10%, var(--surface));color:var(--primary);border-radius:14px;box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--primary) 20%, transparent);">${devIconSvg}</span>`;
    let advHtml = "";
    if (d.manufacturer || d.ipAddress || d.analytics) {
      const ip = d.ipAddress ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>IP:</strong> ${escapeHtml(d.ipAddress)}</div>` : "";
      const mac = d.macAddress ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>MAC:</strong> ${escapeHtml(d.macAddress)}</div>` : "";
      const fw = d.firmwareVersion ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>Firmware:</strong> ${escapeHtml(d.firmwareVersion)} ${d.updateAvailable ? '<span style="color:#f59e0b;font-weight:700;">(Update)</span>' : ""}</div>` : "";
      const last = d.lastSeen ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>Seen:</strong> ${new Date(d.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>` : "";
      let chartHtml = "";
      if (d.analytics?.dailyUsageWh && d.analytics.dailyUsageWh.length > 1) {
        const pts = d.analytics.dailyUsageWh;
        const min = Math.min(...pts) * 0.8;
        const max = Math.max(...pts, min + 1);
        const range = max - min;
        const path = pts.map((v, i) => `${i / (pts.length - 1) * 140} ${28 - (v - min) / range * 24}`).join(" L ");
        const total = d.analytics.weeklyUsageWh ? d.analytics.weeklyUsageWh.reduce((a, b) => a + b, 0) : pts.reduce((a, b) => a + b, 0);
        chartHtml = `<div style="margin-top:12px;font-size:11px;color:var(--muted);"><div style="margin-bottom:4px;display:flex;justify-content:space-between;"><span>${isTr ? "Haftal\u0131k T\xFCketim (Wh)" : "Weekly Usage (Wh)"}</span><span style="color:var(--text);font-weight:700;">${total}</span></div><svg width="100%" height="28" viewBox="0 0 140 28" fill="none" preserveAspectRatio="none"><path d="M0 28 L ${path} L 140 28 Z" fill="color-mix(in srgb, var(--primary) 15%, transparent)"/><path d="M ${path}" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round"/></svg></div>`;
      }
      const anomaly = d.analytics?.anomalyDetected ? `<div style="margin-top:8px;padding:6px 8px;background:color-mix(in srgb, #ef4444 15%, transparent);color:#ef4444;border-radius:6px;font-size:10px;font-weight:600;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${isTr ? "Anormal t\xFCketim tespit edildi!" : "Anomaly detected in usage!"}</div>` : "";
      advHtml = `<details style="margin-top:8px;"><summary style="font-size:11px;color:var(--primary);cursor:pointer;font-weight:600;outline:none;">${isTr ? "Cihaz Detaylar\u0131" : "Device Details"}</summary><div style="margin-top:12px;padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);"><div style="font-size:10px;color:var(--muted);display:grid;grid-template-columns:1fr 1fr;gap:8px;white-space:nowrap;">${ip}${mac}${fw}${last}</div>${anomaly}${chartHtml}</div></details>`;
    }
    return `<div class="device-pill" style="flex-direction:column;align-items:stretch;padding:12px;gap:8px;"><div style="display:flex;align-items:center;gap:12px;width:100%;">${iconHtml}<div class="dev-info" style="flex:1;"><div class="dev-name" style="font-size:13px;font-weight:600;color:var(--text);">${escapeHtml(d.nameKey)}</div><div class="dev-room" style="font-size:11px;color:var(--muted);margin-top:3px;">${roomStr}${statusText}${detail ? ` \xB7 <span style="color:var(--muted);">${escapeHtml(detail)}</span>` : ""}</div></div><span class="dot ${d.online ? "on" : "off"}" title="${statusText}" style="margin:auto 0 auto auto;"></span></div>${advHtml}</div>`;
  }).join("");
  const meta = `${model.onlineCount}/${model.rows.length} ${isTr ? "\xE7evrimi\xE7i" : "online"}`;
  return `<h2>${escapeHtml(label(model.titleKey))} <span class="meta">${meta}</span></h2><div class="bento-grid">${pills}</div>`;
}
function renderSuggestions(model) {
  const isTr = CURRENT_LOCALE === "tr";
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.suggestions.empty"))}`;
  }
  const cards = model.rows.map(
    (s) => `<div class="suggest-card" data-suggestion-id="${escapeHtml(s.id)}" style="transition: all 0.4s ease;"><div class="value" style="font-size:14px;font-weight:600;">${escapeHtml(s.textKey)}</div><div class="meta">${s.at}</div><div class="actions"><button class="btn primary" data-action="accept-suggestion" data-id="${escapeHtml(s.id)}" onclick="const card = this.closest('.suggest-card'); this.innerText='${isTr ? "Kabul Edildi" : "Accepted"}'; this.classList.remove('primary'); this.style.backgroundColor='rgba(16,185,129,0.15)'; this.style.color='#10b981'; this.disabled=true; this.nextElementSibling.style.display='none'; setTimeout(() => { card.style.opacity='0'; card.style.transform='scale(0.9)'; setTimeout(() => card.style.display='none', 400); }, 800);">${isTr ? "Kabul Et" : "Accept"}</button><button class="btn" data-action="dismiss-suggestion" data-id="${escapeHtml(s.id)}" onclick="const card = this.closest('.suggest-card'); card.style.opacity='0'; card.style.transform='scale(0.9)'; setTimeout(() => card.style.display='none', 400);">${isTr ? "Reddet" : "Dismiss"}</button></div></div>`
  ).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}
function renderSkills(model) {
  const isTr = CURRENT_LOCALE === "tr";
  let content = "";
  if (model.rows.length === 0) {
    content = renderEmptyState(label(model.emptyStateKey ?? "screen.skills.empty"));
  } else {
    const maxCount = model.rows.length > 0 ? Math.max(...model.rows.map((s) => s.usageCount)) : 1;
    const bars = model.rows.map((s) => {
      const pct = Math.round(s.usageCount / maxCount * 100);
      return `<div class="skill-bar-wrap" style="position:relative; overflow:hidden; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'" onclick="this.querySelector('.play-btn').style.transform='scale(0.8)'; setTimeout(() => this.querySelector('.play-btn').style.transform='scale(1)', 150); this.querySelector('.play-icon').outerHTML='<svg class=\\'play-icon\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'#10b981\\' stroke-width=\\'3\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'20 6 9 17 4 12\\'></polyline></svg>'; this.querySelector('.play-btn').style.background='rgba(16,185,129,0.15)'; this.querySelector('.play-btn').style.boxShadow='none'; this.querySelector('.skill-bar-fill').style.background='#10b981';"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><div style="display:flex; align-items:center; gap:12px;"><div class="play-btn" style="width:32px; height:32px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; transition: all 0.2s; box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 40%, transparent);"><svg class="play-icon" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div><span style="font-weight:600; font-size:14px; color:var(--text); letter-spacing:-0.01em;">${escapeHtml(s.nameKey)}</span></div><span class="count" style="font-size:11px; color:var(--muted); font-weight:700; background:rgba(0,0,0,0.4); padding: 4px 8px; border-radius:12px;">${s.usageCount}&times;</span></div><div class="skill-bar-track" style="height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow:hidden;"><div class="skill-bar-fill" style="height:100%; width: ${pct}%; background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white)); border-radius:3px; transition: background 0.3s;"></div></div></div>`;
    }).join("");
    content = `<div class="bento-grid wide" style="margin-bottom:32px;">${bars}</div>`;
  }
  if (model.discoverable && model.discoverable.length > 0) {
    const discoverTitle = isTr ? "Ke\u015Ffet" : "Discover";
    const discoverCards = model.discoverable.map((d) => {
      return `<div class="bento-tile" style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--radius);background:var(--tint);color:var(--primary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>
            </svg>
          </div>
          <div style="font-weight:700;font-size:16px;">${escapeHtml(d.nameKey)}</div>
        </div>
        <div style="font-size:13px;color:var(--muted);flex:1;">${escapeHtml(d.descriptionKey)}</div>
        <button class="btn primary" style="align-self:flex-start; transition: all 0.2s;" onclick="this.innerText='${isTr ? "Y\xFCklendi" : "Installed"}'; this.classList.remove('primary'); this.style.backgroundColor='rgba(16,185,129,0.15)'; this.style.color='#10b981'; this.disabled=true;">${isTr ? "Ekle" : "Add"}</button>
      </div>`;
    }).join("");
    content += `<h3>${escapeHtml(discoverTitle)}</h3><div class="bento-grid">${discoverCards}</div>`;
  }
  return `<h2>${escapeHtml(label(model.titleKey))}</h2>${content}`;
}
function renderAgents(model) {
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.agents.empty"))}`;
  }
  const icons = {
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4z"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    thermometer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
    clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>'
  };
  const cards = model.rows.map((a) => {
    const statusLabel = a.status === "active" ? "Active" : a.status === "learning" ? "Learning" : "Sleeping";
    const statusClass = a.status === "active" ? "on" : a.status === "learning" ? "learning" : "off";
    return `<div class="agent-card" style="display:flex; align-items:center; gap:16px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; transition: transform 0.2s, background 0.2s; cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateY(0)'"><span class="avatar" style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--primary) 15%, transparent);color:var(--primary);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent);">${icons[a.icon] || escapeHtml(a.icon)}</span><div><div style="font-weight:700; font-size:15px; margin-bottom:4px; letter-spacing:-0.01em;">${escapeHtml(label(a.nameKey))}</div><div class="meta" style="display:flex;align-items:center;gap:6px; font-size:12px; font-weight:600;"><span class="dot ${statusClass}" style="width:8px; height:8px; box-shadow:0 0 8px currentColor;"></span>${statusLabel}</div></div></div>`;
  }).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}
function renderFamily(model) {
  const cards = model.members.map((m) => {
    const avatarHtml = m.avatarUrl ? `<img class="avatar" src="${escapeHtml(m.avatarUrl)}" alt="${escapeHtml(m.nameKey)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : `<span class="avatar" style="width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tint);color:var(--primary);font-weight:700;font-size:12.8px;">${escapeHtml(m.nameKey.charAt(0).toUpperCase())}</span>`;
    return `<div class="member-card">${avatarHtml}<div><div style="font-weight:600;">${escapeHtml(m.nameKey)}</div><div class="meta">${escapeHtml(m.role)}</div></div></div>`;
  }).join("");
  return `<h2>${escapeHtml(label(model.titleKey))} <span class="meta">${model.adminCount} admin</span></h2><div class="bento-grid">${cards}</div>`;
}
function renderBilling(model) {
  const isTr = CURRENT_LOCALE === "tr";
  const planLabel = label(model.planLabelKey);
  const activeChecklist = [
    isTr ? "\u2713 %100 Yerel Yapay Zeka Motoru" : "\u2713 100% Local AI Engine",
    isTr ? "\u2713 S\u0131n\u0131rs\u0131z Cihaz & Oda" : "\u2713 Unlimited Devices & Rooms",
    isTr ? "\u2713 \xC7apraz Oda Senaryolar\u0131" : "\u2713 Multi-room Routines",
    isTr ? "\u2713 \u015Eifrelenmi\u015F Bulut Yede\u011Fi Senkronizasyonu" : "\u2713 Encrypted Cloud Backup Sync"
  ].map((item) => `<div style="font-size:12px;color:var(--text);display:flex;align-items:center;gap:6px;">${item}</div>`).join("");
  const activePlanCard = `<div class="plan-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), var(--surface)); border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border)); padding: 20px; border-radius: var(--radius-lg);"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div><span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--primary);color:#fff;text-transform:uppercase;letter-spacing:0.05em;">${isTr ? "Aktif Abonelik" : "Active Subscription"}</span><h3 style="margin:8px 0 2px 0;font-size:20px;font-weight:700;">${escapeHtml(planLabel)}</h3><div style="font-size:12px;color:var(--muted);">${isTr ? "Yenilenme: 24 A\u011Fu 2026" : "Renews Aug 24, 2026"}</div></div><div class="price" style="font-size:24px;font-weight:800;">${model.plan === "free" ? "$0" : model.plan === "premium" ? "$5" : "$10"} <span style="font-size:12px;color:var(--muted);font-weight:400;">/ ${isTr ? "ay" : "mo"}</span></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">${activeChecklist}</div><div style="margin-top:16px;display:flex;gap:10px;">${model.canUpgrade ? `<button class="btn primary" data-action="billing-subscribe" data-plan="premium">${isTr ? "Plan\u0131 Y\xFCkselt" : "Upgrade Plan"}</button>` : `<button class="btn" data-action="billing-cancel" style="color:var(--muted);">${isTr ? "Aboneli\u011Fi Y\xF6net / \u0130ptal Et" : "Manage / Cancel Subscription"}</button>`}</div></div>`;
  const comparisonTiers = `<div style="grid-column: 1 / -1; margin-top: 16px;"><h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">${isTr ? "Plan Kar\u015F\u0131la\u015Ft\u0131rma Matrisi" : "Plan Comparison Matrix"}</h3><div style="display:flex;overflow-x:auto;gap:14px;scroll-snap-type:x mandatory;padding-bottom:12px;margin:0 -8px;padding-left:8px;" class="tier-matrix"><div class="bento-tile" style="padding:16px; min-width: 180px; flex: 0 0 75%; scroll-snap-align: center;"><div style="font-weight:700;font-size:15px;">Free</div><div style="font-size:20px;font-weight:800;margin:6px 0;">$0 <span style="font-size:11px;color:var(--muted);">${isTr ? "/ay" : "/mo"}</span></div><ul style="list-style:none;padding:0;margin:12px 0;font-size:12px;display:grid;gap:6px;color:var(--muted);"><li>\u2713 1 ${isTr ? "Cihaz" : "Device"}</li><li>\u2713 ${isTr ? "Yerel Sesli Kontrol" : "Local Voice Control"}</li><li>\u2713 ${isTr ? "Temel Senaryolar" : "Basic Routines"}</li></ul></div><div class="bento-tile" style="padding:16px; min-width: 180px; flex: 0 0 75%; scroll-snap-align: center;"><div style="font-weight:700;font-size:15px;">Premium</div><div style="font-size:20px;font-weight:800;margin:6px 0;">$5 <span style="font-size:11px;color:var(--muted);">${isTr ? "/ay" : "/mo"}</span></div><ul style="list-style:none;padding:0;margin:12px 0;font-size:12px;display:grid;gap:6px;color:var(--muted);"><li>\u2713 ${isTr ? "S\u0131n\u0131rs\u0131z Cihaz" : "Unlimited Devices"}</li><li>\u2713 ${isTr ? "Geli\u015Fmi\u015F Otomasyonlar" : "Advanced Routines"}</li><li>\u2713 ${isTr ? "\xD6ncelikli Yerel Yapay Zeka" : "Priority Local AI"}</li><li>\u2713 ${isTr ? "Bulut Senkronizasyon" : "Cloud Sync"}</li></ul></div><div class="bento-tile" style="padding:16px;border:1px solid var(--primary); min-width: 180px; flex: 0 0 75%; scroll-snap-align: center;"><div style="font-weight:700;font-size:15px;color:var(--primary);">Family</div><div style="font-size:20px;font-weight:800;margin:6px 0;">$10 <span style="font-size:11px;color:var(--muted);">${isTr ? "/ay" : "/mo"}</span></div><ul style="list-style:none;padding:0;margin:12px 0;font-size:12px;display:grid;gap:6px;color:var(--muted);"><li>\u2713 ${isTr ? "Premium'daki Her \u015Eey" : "Everything in Premium"}</li><li>\u2713 ${isTr ? "\xC7oklu Kullan\u0131c\u0131 Aile Payla\u015F\u0131m\u0131" : "Multi-User Family Sharing"}</li><li>\u2713 ${isTr ? "Y\xF6netici Kontrolleri" : "Admin Controls"}</li><li>\u2713 ${isTr ? "\xD6ncelikli Destek" : "Priority Support"}</li></ul></div></div></div>`;
  const paymentHistory = `<div style="grid-column: 1 / -1; margin-top: 16px;"><h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">${isTr ? "\xD6deme Ge\xE7mi\u015Fi & Faturalar" : "Payment History & Invoices"}</h3><div style="overflow-x:auto; width:100%;"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;" class="payment-table"><thead><tr style="border-bottom:1px solid var(--border);color:var(--muted);"><th style="padding:8px 12px; white-space:nowrap;">${isTr ? "Tarih" : "Date"}</th><th style="padding:8px 12px; min-width:180px;">${isTr ? "A\xE7\u0131klama" : "Description"}</th><th style="padding:8px 12px; white-space:nowrap;">${isTr ? "Tutar" : "Amount"}</th><th style="padding:8px 12px; white-space:nowrap;">${isTr ? "Durum / Fatura" : "Status / Invoice"}</th></tr></thead><tbody><tr style="border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent);"><td style="padding:10px 12px; white-space:nowrap;">2026-07-01</td><td style="padding:10px 12px;">NEXUS Family Plan (Monthly)</td><td style="padding:10px 12px;">$10.00</td><td style="padding:10px 12px; white-space:nowrap;"><span style="color:#10b981;font-weight:600;">Paid (INV-2026-007)</span></td></tr><tr style="border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent);"><td style="padding:10px 12px; white-space:nowrap;">2026-06-01</td><td style="padding:10px 12px;">NEXUS Family Plan (Monthly)</td><td style="padding:10px 12px;">$10.00</td><td style="padding:10px 12px; white-space:nowrap;"><span style="color:#10b981;font-weight:600;">Paid (INV-2026-006)</span></td></tr><tr><td style="padding:10px 12px; white-space:nowrap;">2026-05-01</td><td style="padding:10px 12px;">NEXUS Family Plan (Monthly)</td><td style="padding:10px 12px;">$10.00</td><td style="padding:10px 12px; white-space:nowrap;"><span style="color:#10b981;font-weight:600;">Paid (INV-2026-005)</span></td></tr></tbody></table></div></div>`;
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide">${activePlanCard}${comparisonTiers}${paymentHistory}</div>`;
}
function renderPersonalization(model) {
  const isTr = CURRENT_LOCALE === "tr";
  const lang = model.language === "tr" ? "T\xFCrk\xE7e (TR)" : "English (EN)";
  const rowStyle = `display: flex; justify-content: space-between; padding: 14px 10px; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); cursor: pointer; transition: background 0.2s; border-radius: 6px;`;
  const hoverScript = `onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'"`;
  const clickScript = (key, current) => `onclick="const res = prompt('${isTr ? "Yeni de\u011Fer girin:" : "Enter new value:"}', '${current}'); if (res) this.querySelector('.value').innerText = res;"`;
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide"><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("assistantName", escapeHtml(model.assistantName))}><span class="label">${isTr ? "Asistan Ad\u0131" : "Assistant Name"}</span><span class="value" style="font-weight:600; color:var(--text);">${escapeHtml(model.assistantName)}</span></div><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("userAddress", escapeHtml(model.userAddress))}><span class="label">${isTr ? "Size Hitap \u015Eekli" : "Addresses You As"}</span><span class="value" style="font-weight:600; color:var(--text);">${escapeHtml(model.userAddress)}</span></div><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("wakeWord", "Hey Nexus")}><span class="label">${isTr ? "Tetikleme Kelimesi" : "Wake Word"}</span><span class="value" style="font-weight:600; color:var(--text);">Hey Nexus</span></div><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("voiceType", isTr ? "Sakin ve Profesyonel" : "Calm & Professional")}><span class="label">${isTr ? "Ses Tonu (TTS)" : "Voice Personality"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "Sakin ve Profesyonel" : "Calm & Professional"}</span></div><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("language", escapeHtml(lang))}><span class="label">${isTr ? "Dil" : "Language"}</span><span class="value" style="font-weight:600; color:var(--text);">${escapeHtml(lang)}</span></div><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("theme", isTr ? "Koyu" : "Dark")}><span class="label">${isTr ? "Tema" : "Theme"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "Koyu" : "Dark"}</span></div><div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript("location", isTr ? "\u0130stanbul" : "Istanbul")}><span class="label">${isTr ? "Konum" : "Location"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "\u0130stanbul, TR" : "Istanbul, TR"}</span></div><div class="field-row" style="${rowStyle} border-bottom: none;" ${hoverScript} ${clickScript("privacy", isTr ? "Maksimum" : "Maximum")}><span class="label">${isTr ? "G\xFCvenlik Hassasiyeti" : "Security Sensitivity"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "Maksimum (Sadece Yerel)" : "Maximum (Local Only)"}</span></div></div>`;
}
function renderPlatform(model) {
  const isTr = CURRENT_LOCALE === "tr";
  const cards = model.platforms.map(
    (p) => `<div class="bento-tile">
      <div class="tile-head"><span class="tile-title">${escapeHtml(p.name)}</span></div>
      <div class="value">${p.active ? isTr ? "Aktif" : "Active" : isTr ? "\u0130ndir" : "Download"}</div>
      <button class="btn" style="margin-top: 12px">${p.active ? isTr ? "Y\xF6net" : "Manage" : isTr ? "\u0130ndir" : "Download"}</button>
    </div>`
  ).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}
function renderDownloadCenter(releases, userAgent, _surface) {
  const all = releases.all();
  const featured = releases.featuredFor(userAgent);
  const featureHtml = featured ? `<a class="dl-primary btn primary" href="${escapeHtml(featured.downloadUrl)}" download>${label(
    "mkt.hero.actionPrimary"
  ).replace(
    "{os}",
    featured.platform === "windows" ? "Windows" : featured.platform === "macos" ? "macOS" : featured.platform === "linux" ? "Linux" : featured.platform.toUpperCase()
  ).replace("{version}", escapeHtml(featured.version))}</a>` : `<p>Choose your platform</p>`;
  const rows = all.map(
    (r) => `<tr><td>${escapeHtml(r.platform === "windows" ? "Windows" : r.platform === "macos" ? "macOS" : r.platform === "linux" ? "Linux" : r.platform.toUpperCase())}</td><td>${escapeHtml(r.version)}</td><td>${escapeHtml(r.minOs)}</td><td><code class="sha-code" title="SHA-256 Checksum" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onclick="navigator.clipboard.writeText('${escapeHtml(r.checksumSha256)}')">${escapeHtml(r.checksumSha256.substring(0, 12))}... <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></code></td></tr>`
  ).join("");
  const changelog = featured ? `<div class="changelog"><h4>${label("mkt.changelog.title").replace("{version}", escapeHtml(featured.version))}</h4><p>&bull; Initial release of the new local processing engine.<br>&bull; Improved UI performance.<br>&bull; Security patches for background sync.</p></div>` : "";
  return `<div class="download-container">${featureHtml}${changelog}<table><thead><tr><th>Platform</th><th>Version</th><th>Minimum OS</th><th>SHA-256 Checksum</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderLogo(_primaryColor) {
  return `<svg class="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img">
    <defs>
      <linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
      </linearGradient>
      <linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/>
    <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
    <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function renderAvatar(url, initial) {
  if (url) {
    return `<img class="avatar-img" src="${escapeHtml(url)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />`;
  }
  const ch = (initial ?? "?").charAt(0).toUpperCase();
  return `<span class="avatar" style="width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tint);color:var(--primary);font-weight:700;font-size:12.8px;">${escapeHtml(ch)}</span>`;
}
function renderNav(nav, activeId) {
  const links = nav.map(
    (s) => `<a class="${s.id === activeId ? "active" : ""}" href="#${s.id}" data-nav="${s.id}"${s.id === activeId ? ' aria-current="page"' : ""}>${escapeHtml(label(s.titleKey))}</a>`
  ).join("");
  return `<nav class="web-nav" aria-label="Primary">${links}</nav>`;
}
function renderFeatures() {
  const icons = [
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 2.5 2.5 0 0 1-1.32-4.24 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 7 5.06 2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 2.5 2.5 0 0 0 1.32-4.24 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 17 5.06 2.5 2.5 0 0 0 14.5 2z"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
  ];
  const isTr = CURRENT_LOCALE === "tr";
  const features = [
    { title: label("mkt.feat.1.title"), desc: label("mkt.feat.1.desc") },
    { title: label("mkt.feat.2.title"), desc: label("mkt.feat.2.desc") },
    { title: label("mkt.feat.3.title"), desc: label("mkt.feat.3.desc") },
    { title: label("mkt.feat.4.title"), desc: label("mkt.feat.4.desc") },
    { title: isTr ? "Yerel \u0130\u015Flem Motoru" : "100% Local Engine", desc: isTr ? "Verileriniz tamamen yerel a\u011F\u0131n\u0131zda i\u015Flenir, buluta ba\u011F\u0131ml\u0131l\u0131k yok." : "Zero cloud dependency for instant responsiveness and total privacy." },
    { title: isTr ? "Evrensel Ekosistem" : "Unified Standards", desc: isTr ? "Matter, HomeKit, Zigbee ve Philips Hue cihazlar\u0131n\u0131 tek yerde y\xF6netin." : "Connect Matter, HomeKit, Zigbee, and Philips Hue seamlessly." }
  ];
  const items = features.map(
    (f, i) => `<div class="feature-card"><span class="icon">${icons[i] ?? icons[0]}</span><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.desc)}</p></div>`
  ).join("");
  return `<section class="features" aria-label="${label("mkt.feat.why")}"><div class="feature-grid">${items}</div></section>`;
}
function renderFaq() {
  const faqs = [
    { q: label("mkt.faq.1.q"), a: label("mkt.faq.1.a") },
    { q: label("mkt.faq.2.q"), a: label("mkt.faq.2.a") },
    { q: label("mkt.faq.3.q"), a: label("mkt.faq.3.a") },
    { q: label("mkt.faq.4.q"), a: label("mkt.faq.4.a") }
  ];
  const items = faqs.map(
    (f, i) => `<div class="faq-item" onclick="this.classList.toggle('open')"><div class="faq-q"><span>${escapeHtml(f.q)}</span><svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div class="faq-a-wrapper"><div class="faq-a">${escapeHtml(f.a)}</div></div></div>`
  ).join("");
  return `<section id="faq" class="faq-section mkt-anchor" aria-label="${label("mkt.faq.title")}">
  <div class="faq-container">
    <div class="faq-header">
      <h2>${label("mkt.faq.title")}</h2>
    </div>
    <div class="faq-grid">
      ${items}
    </div>
  </div>
<style>
.faq-section { margin: 120px 0; padding: 0 24px; }
.faq-container { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 60px; align-items: start; }
.faq-header { position: sticky; top: 120px; text-align: left; }
.faq-header h2 { font-size: 38px; letter-spacing: -0.025em; margin: 0; color: var(--text); font-weight: 800; }
@media (max-width: 860px) {
  .faq-container { grid-template-columns: 1fr; gap: 32px; }
  .faq-header { position: static; }
  .faq-header h2 { font-size: 32px; }
}
.faq-item { background: color-mix(in srgb, var(--surface) 60%, transparent); border: 1px solid color-mix(in srgb, var(--border) 40%, transparent); border-radius: 12px; margin-bottom: 16px; cursor: pointer; transition: all 0.3s ease; }
.faq-item:hover { border-color: color-mix(in srgb, var(--primary) 30%, transparent); background: color-mix(in srgb, var(--surface) 80%, transparent); transform: translateX(4px); }
.faq-item.open { border-color: color-mix(in srgb, var(--primary) 50%, transparent); box-shadow: 0 12px 32px rgba(0,0,0,0.06); transform: translateX(4px); }
.faq-q { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px; font-weight: 600; font-size: 16px; color: var(--text); }
.faq-icon { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); color: var(--muted); flex: none; margin-left: 16px; }
.faq-item.open .faq-icon { transform: rotate(180deg); color: var(--primary); }
.faq-a-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.faq-item.open .faq-a-wrapper { grid-template-rows: 1fr; }
.faq-a { overflow: hidden; padding: 0 24px; color: var(--muted); font-size: 15px; line-height: 1.6; }
.faq-item.open .faq-a { padding: 0 24px 24px; }
</style>
</section>`;
}
function renderRichFooter(_primaryColor) {
  return `<footer class="footer" role="contentinfo">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">${renderLogo()}<span class="brand">NEXUS</span></div>
        <p class="footer-desc">${label("mkt.footer.desc")}</p>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.footer.platforms")}</h4>
        <ul>
          <li><a href="#desktop">Windows</a></li>
          <li><a href="#desktop">macOS</a></li>
          <li><a href="#desktop">Linux</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.footer.company")}</h4>
        <ul>
          <li><a href="/about">${label("mkt.footer.about")}</a></li>
          <li><a href="/privacy">${label("mkt.footer.privacy")}</a></li>
          <li><a href="/terms">${label("mkt.footer.terms")}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-text">&copy; 2026 NEXUS Technologies Inc. &middot; <span style="opacity:0.7">${label("mkt.footer.noCookies")}</span></div>
    </div>
  </div>
</footer>`;
}
function renderCookieBanner() {
  return `<div id="cookie-banner" class="cookie-banner" role="alert" aria-live="polite">
    <div class="cb-content">
      <strong>${label("mkt.cookie.title")}</strong>
      <p>${label("mkt.cookie.desc")}</p>
    </div>
    <div class="cb-actions">
      <button class="btn secondary cb-decline">${label("mkt.cookie.decline")}</button>
      <button class="btn primary cb-accept">${label("mkt.cookie.accept")}</button>
    </div>
  </div>`;
}
function renderPricing() {
  const isTr = CURRENT_LOCALE === "tr";
  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="pricing-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  return `<section id="pricing" class="mkt-pricing mkt-anchor">
<div class="mkt-heading"><h2>${label("mkt.pricing.title")}</h2></div>
<div class="pricing-grid">
  <div class="pricing-card">
    <h3>${label("mkt.pricing.free")}</h3>
    <p>${label("mkt.pricing.freeDesc")}</p>
    <div class="price">$0<span>/${isTr ? "ay" : "mo"}</span></div>
    <ul class="pricing-features">
      <li>${checkIcon} <span>${isTr ? "5 cihaza kadar ba\u011Flant\u0131" : "Up to 5 devices connected"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Temel sesli komutlar & rutinler" : "Basic voice commands & routines"}</span></li>
      <li>${checkIcon} <span>${isTr ? "%100 yerel i\u015Fleme" : "100% local processing"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Topluluk deste\u011Fi" : "Standard community support"}</span></li>
    </ul>
    <a href="/login" class="btn secondary">${label("mkt.pricing.cta")}</a>
  </div>
  <div class="pricing-card premium">
    <span class="popular-badge">${isTr ? "En Pop\xFCler" : "Most Popular"}</span>
    <h3>${label("mkt.pricing.premium")}</h3>
    <p>${label("mkt.pricing.premiumDesc")}</p>
    <div class="price">$5<span>/${isTr ? "ay" : "mo"}</span></div>
    <ul class="pricing-features">
      <li>${checkIcon} <span>${isTr ? "S\u0131n\u0131rs\u0131z cihaz ba\u011Flant\u0131s\u0131" : "Unlimited devices connected"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Geli\u015Fmi\u015F YZ otomasyonu & rutinler" : "Advanced AI routines & automation"}</span></li>
      <li>${checkIcon} <span>${isTr ? "\xC7oklu oda ses & sahneleri" : "Multi-room audio & scenes"}</span></li>
      <li>${checkIcon} <span>${isTr ? "7/24 \xF6ncelikli destek" : "Priority 24/7 support"}</span></li>
      <li>${checkIcon} <span>${isTr ? "G\xFCvenli uzaktan eri\u015Fim" : "Secure remote access"}</span></li>
    </ul>
    <a href="/login" class="btn primary">${label("mkt.pricing.cta")}</a>
  </div>
  <div class="pricing-card">
    <h3>${label("mkt.pricing.family")}</h3>
    <p>${label("mkt.pricing.familyDesc")}</p>
    <div class="price">$10<span>/${isTr ? "ay" : "mo"}</span></div>
    <ul class="pricing-features">
      <li>${checkIcon} <span>${isTr ? "Premium'daki t\xFCm \xF6zellikler" : "Everything in Premium"}</span></li>
      <li>${checkIcon} <span>${isTr ? "6 aile \xFCyesi profiline kadar" : "Up to 6 family profiles"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Geli\u015Fmi\u015F ebeveyn kontrolleri" : "Granular parental controls"}</span></li>
      <li>${checkIcon} <span>${isTr ? "\xD6zel aile paneli" : "Dedicated family dashboard"}</span></li>
    </ul>
    <a href="/login" class="btn secondary">${label("mkt.pricing.cta")}</a>
  </div>
</div>
</section>`;
}
function renderTestimonials() {
  const renderStars = () => `<div class="stars">${Array(5).fill('<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>').join("")}</div>`;
  return `<section class="mkt-testimonials">
<div class="mkt-heading"><h2>${label("mkt.testimonials.title")}</h2></div>
<div class="testimonials-grid">
  <div class="testimonial-card">
    ${renderStars()}
    <p>"${label("mkt.testimonials.quote1")}"</p>
    <div class="author-info">
      <img class="author-avatar" src="https://randomuser.me/api/portraits/women/79.jpg" alt="" style="object-fit:cover;">
      <div>
        <div class="author-name">${label("mkt.testimonials.author1")}</div>
        <div class="author-role">${label("mkt.testimonials.role1")}</div>
      </div>
    </div>
  </div>
  <div class="testimonial-card">
    ${renderStars()}
    <p>"${label("mkt.testimonials.quote2")}"</p>
    <div class="author-info">
      <img class="author-avatar" src="https://randomuser.me/api/portraits/men/75.jpg" alt="" style="object-fit:cover;">
      <div>
        <div class="author-name">${label("mkt.testimonials.author2")}</div>
        <div class="author-role">${label("mkt.testimonials.role2")}</div>
      </div>
    </div>
  </div>
  <div class="testimonial-card">
    ${renderStars()}
    <p>"${label("mkt.testimonials.quote3")}"</p>
    <div class="author-info">
      <img class="author-avatar" src="https://randomuser.me/api/portraits/women/63.jpg" alt="" style="object-fit:cover;">
      <div>
        <div class="author-name">${label("mkt.testimonials.author3")}</div>
        <div class="author-role">${label("mkt.testimonials.role3")}</div>
      </div>
    </div>
  </div>
</div>
</section>`;
}
function renderStyles(theme) {
  const t2 = theme;
  const lightTheme2 = getTheme("light");
  const darkTheme2 = getTheme("dark");
  const renderVars = (t22) => `  --bg: ${t22.color.bg};
  --surface: ${t22.color.surface};
  --text: ${t22.color.text};
  --muted: ${t22.color.textMuted};
  --primary: ${t22.color.primary};
  --on-primary: ${t22.color.onPrimary};
  --accent: ${t22.color.accent};
  --radius: ${t22.radius.md}px;
  --radius-lg: ${t22.radius.lg}px;
  --radius-xl: ${t22.radius.xl}px;
  --font: ${t22.font.family};
  --font-mono: ${t22.font.familyMono};
  --gap: ${t22.space[4]}px;
  --border: color-mix(in srgb, var(--text) 8%, transparent);
  --border-strong: color-mix(in srgb, var(--text) 14%, transparent);
  --tint: color-mix(in srgb, var(--primary) 12%, transparent);
  --tint-soft: color-mix(in srgb, var(--primary) 6%, transparent);
  --shadow-sm: ${t22.shadow.sm};
  --shadow-md: ${t22.shadow.md};
  --shadow-lg: ${t22.shadow.lg};
  --shadow-xl: ${t22.shadow.xl};
  --ring: ${t22.shadow.ring};
  --transition-fast: ${t22.transition.fast};
  --transition-normal: ${t22.transition.normal};
  --transition-slow: ${t22.transition.slow};
  --transition-spring: ${t22.transition.spring};
  --gradient: linear-gradient(135deg, var(--primary), var(--accent));`;
  return `${renderFontFaces()}

:root {
${renderVars(t2)}
}

[data-theme="light"] {
${renderVars(lightTheme2)}
}

[data-theme="dark"] {
${renderVars(darkTheme2)}
}

* {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--primary) 40%, transparent) transparent;
}
a, button, .btn, nav, header, footer, .badge, .popular-badge, .stat, .eyebrow, img, svg, .brand,
.hero-mockup, .phone-frame, .mockup-sidebar-full, .dsk-card, .pricing-card, .testimonial-card, 
.faq-q, .how-step, .brand-logo-pill, .integration-title, .version-badge, .theme-toggle, .mouse {
  user-select: none;
  -webkit-user-select: none;
}
.testimonial-card p { user-select: text; -webkit-user-select: text; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--primary) 40%, transparent); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 48px; }
.pricing-card {
  position: relative; display: flex; flex-direction: column; gap: 20px;
  background: color-mix(in srgb, var(--surface) 80%, transparent); backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 24px; padding: 40px 32px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.1); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.4s ease, box-shadow 0.4s ease;
}
.pricing-card h3 { font-size: 24px; margin: 0; font-weight: 700; color: var(--text); }
.pricing-card p { margin: 0; color: color-mix(in srgb, var(--text) 70%, transparent); font-size: 14px; line-height: 1.5; min-height: 42px; }
.pricing-card .price { font-size: 48px; font-weight: 800; color: var(--text); display: flex; align-items: baseline; gap: 4px; margin: 8px 0; }
.pricing-card .price span { font-size: 16px; font-weight: 500; color: color-mix(in srgb, var(--text) 50%, transparent); }
.pricing-card:hover { transform: translateY(-8px); border-color: color-mix(in srgb, var(--primary) 50%, transparent); box-shadow: 0 24px 48px color-mix(in srgb, var(--primary) 15%, rgba(0,0,0,0.2)); }
.pricing-card.premium {
  border: 2px solid var(--primary);
  background: linear-gradient(165deg, color-mix(in srgb, var(--primary) 15%, var(--surface)), color-mix(in srgb, var(--surface) 90%, transparent));
  box-shadow: 0 24px 64px color-mix(in srgb, var(--primary) 25%, transparent);
  transform: scale(1.05);
  z-index: 2;
}
.pricing-card.premium:hover { transform: scale(1.05) translateY(-8px); }
.popular-badge {
  position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
  background: var(--gradient); color: #ffffff;
  font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
  padding: 6px 16px; border-radius: 999px; box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 40%, transparent);
}
.pricing-features { list-style: none; padding: 0; margin: 8px 0 24px; display: flex; flex-direction: column; gap: 16px; font-size: 14px; color: var(--text); flex: 1; }
.pricing-features li { display: flex; align-items: flex-start; gap: 12px; line-height: 1.4; color: color-mix(in srgb, var(--text) 85%, transparent); }
.pricing-features li .pricing-check { flex-shrink: 0; width: 18px; height: 18px; color: var(--primary); margin-top: 1px; }
.pricing-card .btn { margin-top: auto; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 12px; width: 100%; text-align: center; }
.pricing-card.premium .btn { box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 30%, transparent); }
@media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; } }

html { box-sizing: border-box; scroll-behavior: smooth; }
*, *:before, *:after { box-sizing: inherit; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
body {
  margin: 0;
  background: var(--bg);
  background-image: radial-gradient(circle at top right, var(--tint), transparent 40%), radial-gradient(circle at bottom left, var(--tint-soft), transparent 40%);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
}
.wrap { max-width: 1080px; margin: 0 auto; padding: 40px 24px; }
.brand { display: block; font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; margin: 0; color: var(--text); }
.tag { color: var(--muted); margin: 8px 0 32px; font-weight: 500; }
nav.web-nav {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  padding: 6px 8px; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--bg) 50%, transparent);
  margin-bottom: 32px; flex-wrap: wrap;
}
nav.web-nav a {
  padding: 8px 18px; border-radius: 999px;
  background: transparent; border: 1px solid transparent;
  color: var(--muted); text-decoration: none;
  font-size: 12px; font-weight: 500;
  transition: all 0.18s ease;
}
nav.web-nav a:hover {
  color: var(--text); background: color-mix(in srgb, var(--tint) 50%, transparent);
}
nav.web-nav a.active {
  background: var(--primary); color: var(--on-primary); border-color: var(--primary);
  font-weight: 600;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 40%, transparent);
}
h2 { font-size: 18px; margin: 32px 0 16px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--gap); }
.card {
  position: relative;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 132px;
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
}
.card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 32px color-mix(in srgb, var(--primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--primary) 40%, transparent);
}
.card .cardicon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary);
}
.card .value { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-top: auto; }
.card .label { color: var(--muted); font-size: 12px; }
.nudge { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-left: 8px; }
/* \u2500\u2500 In-app control-center: bento dashboard (desktop + mobile shells) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
/* Equal-width tracks: minmax(0, 1fr) (not the default minmax(auto, 1fr)) so a wide
   tile value/badge can't stretch its own column and skew the whole grid. */
.bento { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: minmax(96px, auto); gap: var(--gap); }
.bento-tile {
  position: relative; display: flex; flex-direction: column; gap: 12px;
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
}
.bento-tile:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 32px color-mix(in srgb, var(--primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--primary) 30%, transparent);
}
.bento-tile .tile-head { display: flex; align-items: center; gap: 12px; color: var(--muted); }
.bento-tile .tile-head .tile-title { font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.bento-tile .value { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-top: auto; }
.bento-tile .label { color: var(--muted); font-size: 12px; }
.bento-tile.featured { grid-column: span 2; grid-row: span 2; justify-content: space-between; overflow: hidden; }
.bento-tile.featured::after {
  content: ""; position: absolute; right: -30px; bottom: -30px; width: 170px; height: 170px;
  background: radial-gradient(circle at center, var(--tint), transparent 70%); pointer-events: none;
}
.bento-tile.wide { grid-column: span 2; }
.ring-wrap { position: relative; display: flex; align-items: center; gap: 24px; }
.ring { flex: none; }
.ring-meta { display: flex; flex-direction: column; }
.ring-meta .value { font-size: 22px; margin-top: 0; }
.assistant-strip {
  grid-column: 1 / -1; display: flex; align-items: center; gap: 16px;
  background: color-mix(in srgb, var(--surface) 75%, transparent);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent);
  border-radius: 999px; /* Floating capsule look */
  padding: 12px 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 32px color-mix(in srgb, var(--primary) 15%, transparent);
  transition: transform 0.3s ease;
}
.assistant-strip:hover { transform: scale(1.02); }
.assistant-strip .cardicon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary); flex: none;
}
.assistant-strip .who { font-weight: 700; }
.assistant-strip .msg { color: var(--muted); }
.assistant-strip .btn { margin-left: auto; white-space: nowrap; }
@media (max-width: 600px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bento-tile.featured { grid-column: 1 / -1; grid-row: auto; }
  .bento-tile.wide { grid-column: 1 / -1; }
  .assistant-strip { flex-wrap: wrap; }
  .assistant-strip .btn { margin-left: 0; }
}
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 16px;
}
.bento-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.plan-card {
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  border-radius: var(--radius-lg); padding: 24px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px color-mix(in srgb, var(--primary) 15%, transparent);
}
.bento-grid.wide { grid-template-columns: 1fr; }
.room-card {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px;
}
.room-card .cardicon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: var(--radius); background: var(--tint); color: var(--primary); flex: none; }
.room-card .room-info { flex: 1; margin-left: 16px; }
.room-card .label { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.room-card .value { color: var(--muted); font-size: 12px; }

.device-pill {
  display: flex; flex-direction: column; width: 100%; box-sizing: border-box; overflow: hidden;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 16px 24px;
}
.device-pill .dev-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary); flex: none;
}
.device-pill .dev-info { flex: 1; min-width: 0; }
.device-pill .dev-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.device-pill .dev-room { color: var(--muted); font-size: 12px; margin-top: 2px; }

/* \u2500\u2500 Dedicated AI Assistant Prompt Bar & Waveform \u2500\u2500 */
.assistant-prompt-bar {
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), var(--surface) 85%);
  border: 1px solid color-mix(in srgb, var(--primary) 28%, var(--border));
  border-radius: var(--radius-lg);
  padding: 24px 32px; margin-bottom: 32px;
  box-shadow: 0 10px 28px color-mix(in srgb, var(--primary) 12%, transparent);
}
.prompt-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.ai-avatar {
  position: relative; width: 44px; height: 44px; border-radius: 50%;
  background: var(--primary); color: var(--on-primary);
  display: flex; align-items: center; justify-content: center; flex: none;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 40%, transparent);
}
.pulse-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid var(--primary); opacity: 0.6;
}
.ai-name { font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
.ai-status { color: var(--muted); font-size: 12px; margin-top: 2px; }
.audio-waveform { display: flex; align-items: center; gap: 3px; margin-left: auto; height: 18px; }
.wave-bar {
  width: 3px; height: 100%; background: var(--primary); border-radius: 999px;
  animation: wavePulse 1.2s ease-in-out infinite alternate;
}
.wave-bar:nth-child(2) { animation-delay: 0.2s; height: 70%; }
.wave-bar:nth-child(3) { animation-delay: 0.4s; height: 100%; }
.wave-bar:nth-child(4) { animation-delay: 0.1s; height: 80%; }
.wave-bar:nth-child(5) { animation-delay: 0.3s; height: 60%; }
@keyframes wavePulse {
  0% { transform: scaleY(0.3); opacity: 0.4; }
  100% { transform: scaleY(1); opacity: 1; }
}
.prompt-input-wrap { display: flex; gap: 12px; margin-bottom: 16px; }
.prompt-input {
  flex: 1; min-width: 0; background: var(--bg); border: 1px solid var(--border-strong);
  border-radius: var(--radius); padding: 12px 16px;
  color: var(--text); font-size: 12px; outline: none;
  text-overflow: ellipsis; white-space: nowrap; overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.prompt-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
}
.mic-btn { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; flex: none; }
.quick-commands-wrap { display: flex; flex-direction: column; gap: 8px; }
.cmd-label { color: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; display: flex; align-items: center; gap: 6px; }
.quick-commands-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%;
}
.cmd-chip {
  display: flex; align-items: center; justify-content: flex-start; gap: 8px;
  font-size: 12px; font-weight: 500; padding: 8px 14px; border-radius: var(--radius);
  background: color-mix(in srgb, var(--primary) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
  color: var(--text); cursor: pointer; transition: all 0.18s ease; text-align: left;
  height: auto; white-space: normal; word-break: break-word; width: 100%; box-sizing: border-box; min-height: 36px; padding: 10px 14px;
}
.cmd-chip .chip-star {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; flex: none; color: var(--primary); font-weight: 700; font-size: 13px;
}
.cmd-chip .chip-txt { flex: 1; min-width: 0; white-space: normal; word-break: break-word; line-height: 1.4; }
.cmd-chip:hover {
  background: color-mix(in srgb, var(--primary) 22%, var(--surface));
  border-color: var(--primary); color: var(--primary);
  transform: translateY(-1px);
}
@media (max-width: 600px) {
  .quick-commands-grid { grid-template-columns: repeat(2, 1fr); }
  .prompt-input-wrap { gap: 6px; }
  .prompt-input { font-size: 12px; padding: 10px 12px; flex: 1; width: 100%; min-width: 0; }
  .mic-btn { padding: 10px 12px; border-radius: var(--radius); flex: none; }
  .mic-btn span { display: none; }
  .cmd-chip { padding: 7px 10px; font-size: 11px; }
}

/* \u2500\u2500 Audit Log & Sparkline Card \u2500\u2500 */
.audit-card, .sparkline-card {
  grid-column: 1 / -1; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 24px;
}
.audit-head, .sparkline-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.audit-title { font-weight: 700; font-size: 12px; margin-left: 8px; }
.audit-list { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.audit-item { display: flex; align-items: center; gap: 10px; color: var(--text); }
.audit-item .time { color: var(--muted); font-weight: 600; min-width: 40px; }
.dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.dot.blue { background: var(--primary); box-shadow: 0 0 6px var(--primary); }
.sparkline-svg { width: 100%; height: 50px; display: block; margin: 8px 0; }
.sparkline-labels { display: flex; justify-content: space-between; color: var(--muted); font-size: 11px; font-weight: 600; }
.badge { white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--tint); color: var(--primary); }
.badge.success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.trend { color: #10b981; font-weight: 700; font-size: 12px; margin-left: 6px; }

/* \u2500\u2500 Component Kit B (Form, Select, Table, Modal) \u2500\u2500 */
.nx-form { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.nx-form-group { display: flex; flex-direction: column; gap: 6px; }
.nx-label { font-size: 13px; font-weight: 600; color: var(--muted); }
.nx-input, .nx-select {
  padding: 10px 14px; background: var(--bg); border: 1px solid var(--border-strong);
  border-radius: var(--radius); color: var(--text); font-family: var(--font); font-size: 14px;
  outline: none; transition: all 0.2s ease;
}
.nx-input:focus, .nx-select:focus { border-color: var(--primary); box-shadow: var(--ring); }
.nx-select { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; padding-right: 36px; }
.nx-table-wrap { width: 100%; overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.nx-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.nx-table th, .nx-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
.nx-table th { font-weight: 600; color: var(--muted); background: color-mix(in srgb, var(--bg) 50%, transparent); }
.nx-table tr:last-child td { border-bottom: none; }
.nx-table tr:hover td { background: color-mix(in srgb, var(--tint) 20%, transparent); }
.nx-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
}
.nx-modal-overlay.open { opacity: 1; pointer-events: auto; }
.nx-modal {
  background: var(--surface); border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg); padding: 24px; width: 100%; max-width: 480px;
  box-shadow: var(--elev); transform: translateY(10px) scale(0.98); transition: all 0.2s ease;
}
.nx-modal-overlay.open .nx-modal { transform: translateY(0) scale(1); }
.nx-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nx-modal-title { font-size: 18px; font-weight: 700; margin: 0; }
.nx-modal-close { background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer; padding: 4px; display: inline-flex; }
.nx-modal-close:hover { color: var(--text); }
.nx-modal-body { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
.nx-modal-footer { display: flex; justify-content: flex-end; gap: 12px; }

/* \u2500\u2500 FAQ Section \u2500\u2500 */
.faq-section { margin-top: 48px; }
.faq-grid { display: grid; gap: 12px; margin-top: 16px; }
.faq-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 16px 24px; transition: border-color 0.15s;
}
.faq-item[open] { border-color: var(--primary); }
.faq-q {
  font-weight: 600; font-size: 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; list-style: none;
}
.faq-q::-webkit-details-marker { display: none; }
.faq-a { color: var(--muted); font-size: 12px; margin-top: 12px; line-height: 1.6; }
.faq-icon { font-weight: 700; font-size: 18px; color: var(--primary); }

/* \u2500\u2500 Device Control Sliders \u2500\u2500 */
.dev-slider-wrap {
  margin-top: 8px; padding-top: 6px; border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box;
}
.dev-slider {
  flex: 1; min-width: 0; height: 4px; border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--border) 80%, transparent));
  appearance: none; -webkit-appearance: none; outline: none; box-sizing: border-box;
}
.dev-slider::-webkit-slider-thumb {
  appearance: none; -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
  background: var(--primary); box-shadow: 0 0 8px var(--primary); cursor: pointer;
}
.dev-slider-val { font-size: 11px; font-weight: 600; color: var(--primary); min-width: 28px; text-align: right; flex: none; }

.suggest-card {
  display: flex; flex-direction: column; gap: 12px;
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0,0,0,0.05);
}
.suggest-card .actions { margin-top: auto; justify-content: flex-end; }

.skill-bar-wrap {
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0,0,0,0.05);
}
.skill-bar-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.skill-bar-header .count { color: var(--muted); }
.skill-bar-track { height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.skill-bar-fill { height: 100%; background: var(--primary); }

.member-card {
  display: flex; align-items: center; gap: 16px;
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0,0,0,0.05);
}

.plan-card {
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--primary); border-radius: var(--radius-lg); padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
}
.plan-card .price { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
.plan-card .price span { font-size: 12px; color: var(--muted); font-weight: normal; letter-spacing: 0; }

.field-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; border-bottom: 1px solid var(--border);
}
.field-row:last-child { border-bottom: 0; }
.field-row .label { color: var(--muted); }
.field-row .value { font-weight: 500; }

.dot { width: 10px; height: 10px; border-radius: 50%; }
.on { background: #2ecc71; }
.off { background: var(--muted); }
.dl-primary {
  display: inline-block; background: var(--primary); color: var(--on-primary);
  padding: 16px 32px; border-radius: var(--radius); font-weight: 600;
  text-decoration: none; margin-bottom: 16px;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--primary) 42%, transparent);
}
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--surface); }
th { color: var(--muted); font-weight: 600; }
code { color: var(--muted); word-break: break-all; font-family: var(--font-mono); font-size: 0.88em; }
.badge {
  font-size: 12px; padding: 2px 8px; border-radius: 999px;
  background: var(--primary); color: var(--on-primary);
}
.badge.muted { background: var(--bg); color: var(--muted); border: 1px solid var(--surface); }
.btn {
  font-size: 13px; font-weight: 600; padding: 10px 18px;
  border-radius: 999px; border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  background: color-mix(in srgb, var(--primary) 8%, transparent); color: var(--primary); cursor: pointer;
  text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  backdrop-filter: blur(8px);
  transition: var(--transition-fast);
}
.btn.primary { background: var(--gradient); color: #ffffff; border-color: transparent; box-shadow: var(--shadow-md); }
.actions { display: flex; gap: 8px; }
.meta { color: var(--muted); font-size: 12px; }
section { margin-bottom: 48px; }
header.site {
  display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
}
.skip {
  position: absolute; left: -9999px; top: 0; z-index: 10;
  background: var(--primary); color: var(--on-primary); padding: 8px 16px;
  border-radius: 4px; text-decoration: none;
}
.skip:focus { left: 12px; top: 12px; }
header.site .tag { margin: 4px 0 0; }
.logo { display: block; flex: none; }
footer.site {
  margin-top: 48px; padding-top: 24px;
  border-top: 1px solid var(--surface); color: var(--muted); font-size: 12px;
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;
}
footer.site a { color: var(--muted); text-decoration: none; }
footer.site a:hover { color: var(--text); }
/* Interactive tabs: when JS is on, show only the active screen. */
html.js-tabs section[hidden] { display: none; }
.hero {
  position: relative; overflow: hidden;
  padding: 64px 0 48px; border-bottom: 1px solid var(--border);
  margin-bottom: 48px;
}
.hero::before {
  content: ""; position: absolute; inset: -50% 20% auto -20%; height: 480px; z-index: -1;
  background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%);
  pointer-events: none;
}
.hero h1 {
  font-size: 48px; line-height: 1.05; letter-spacing: -0.04em; margin: 0 0 20px;
  max-width: 18ch; font-weight: 800;
}
.hero .lede { color: var(--muted); font-size: 18px; margin: 0 0 24px; max-width: 60ch; }
.hero .actions { flex-wrap: wrap; }
.hero .btn { font-size: 14px; padding: 12px 24px; }
.hero .trust { color: var(--muted); font-size: 12px; margin-top: 16px; }
.features { margin-top: 48px; }
.feature-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(3, 1fr);
}
.feature {
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), var(--shadow-sm);
}
.feature .icon {
  display: inline-flex; width: 40px; height: 40px; border-radius: var(--radius);
  align-items: center; justify-content: center; background: var(--tint);
  color: var(--primary); margin-bottom: 12px;
}
.feature h3 { margin: 0 0 8px; font-size: 18px; }
.feature p { margin: 0; color: var(--muted); font-size: 12px; }

@media (max-width: 900px) {
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .wrap { padding: env(safe-area-inset-top, 16px) env(safe-area-inset-right, 12px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 12px); }
  .row { flex-wrap: wrap; gap: 8px; }
  nav { gap: 4px; }
  .hero { padding: 48px 0 32px; }
  .hero h1 { font-size: 32px; word-break: break-word; line-height: 1.15; }
  .hero .lede { font-size: 15px; }
  .hero .actions .btn { flex: 1 1 auto; text-align:center; min-height: 44px; }
  .btn, .nav-link, .nav-cta, .lang-picker-btn { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .cards, .feature-grid { grid-template-columns: 1fr; }
  table { font-size: 11px; display: block; overflow-x: auto; white-space: nowrap; }
  th, td { padding: 8px; }
  .bento-tile, .plan-card, .skill-card-rich, .suggestion-card, .member-card, .room-card { padding: 16px !important; }
  .badge { white-space: nowrap; text-align: center; flex-shrink: 0; display: inline-flex; max-width: 100%; }
  * { word-wrap: break-word; overflow-wrap: break-word; }
}
/* \u2500\u2500 Premium motion & interaction layer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (prefers-reduced-motion: no-preference) {
  nav a { transition: background 160ms ease, color 160ms ease, border-color 160ms ease; }
  /* Ambient drifting aurora behind everything (subtle; never harms text contrast) */
  body::before {
    content: ""; position: fixed; inset: -25vmax; z-index: -2; pointer-events: none;
    background:
      radial-gradient(38vmax 38vmax at 18% 14%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 60%),
      radial-gradient(30vmax 30vmax at 84% 82%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 62%);
    animation: nxAurora 28s ease-in-out infinite alternate;
  }
  .hero h1 { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) both; }
  .hero .lede { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) 0.08s both; }
  .hero .actions { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) 0.16s both; }
  .hero .trust { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) 0.24s both; }
}
@keyframes nxAurora {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(2%, -1.5%, 0) scale(1.06); }
  100% { transform: translate3d(-2%, 1.5%, 0) scale(1.03); }
}
@keyframes nxRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

/* Buttons: tactile lift + press */
.btn { transition: transform 160ms cubic-bezier(.2,.8,.2,1), box-shadow 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease; }
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: translateY(0) scale(0.98); }
.btn.primary:hover { box-shadow: 0 10px 26px color-mix(in srgb, var(--primary) 52%, transparent); }
.dl-primary { transition: transform 160ms cubic-bezier(.2,.8,.2,1), box-shadow 160ms ease; }
.dl-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px color-mix(in srgb, var(--primary) 55%, transparent); }

/* Card-like surfaces: unified premium hover (lift, glow border, deeper shadow) */
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .card, .feature, .bento-tile, .room-card, .device-pill, .plan-card,
  .suggest-card, .member-card, .skill-bar-wrap, .audit-card, .sparkline-card {
    transition: transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, box-shadow 220ms ease;
  }
  .card:hover, .feature:hover, .bento-tile:hover, .room-card:hover, .device-pill:hover,
  .plan-card:hover, .suggest-card:hover, .member-card:hover, .skill-bar-wrap:hover,
  .audit-card:hover, .sparkline-card:hover {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--primary) 42%, var(--border));
    box-shadow: 0 18px 42px color-mix(in srgb, var(--primary) 14%, transparent);
  }
  .cardicon, .feature .icon, .dev-icon, .room-card .cardicon { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
  .card:hover .cardicon, .feature:hover .icon, .room-card:hover .cardicon,
  .device-pill:hover .dev-icon { transform: scale(1.08) rotate(-3deg); }
}

/* Consistent, accessible focus ring */
a:focus-visible, button:focus-visible, .btn:focus-visible, summary:focus-visible,
input:focus-visible, select:focus-visible { outline: none; box-shadow: var(--ring); }


.desktop-only { display: inline; }
.mobile-only { display: none; }
@media (max-width: 600px) {
  .suggest-title-desktop { display: none !important; }
  .suggest-title-mobile { display: block !important; }
  .desktop-only { display: none !important; }
  .mobile-only { display: inline !important; }
}

/* \u2500\u2500 Sticky Ultra-Premium Glass Navbar \u2500\u2500 */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent);
  box-shadow: 0 4px 20px color-mix(in srgb, var(--bg) 60%, transparent);
  margin-bottom: 16px; transition: all 0.2s ease;
}
.nav-container {
  max-width: 1140px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; height: 60px;
}
.nav-brand-group {
  display: flex; align-items: center; gap: 12px;
}
.nav-brand {
  display: flex; align-items: center; gap: 12px;
  text-decoration: none; color: var(--text); font-weight: 800; font-size: 18px;
  letter-spacing: 0.05em;
}
.brand-title {
  color: var(--text);
}
.nav-links {
  display: flex; align-items: center; gap: 28px;
  background: transparent; padding: 0; border: none;
}
.hamburger { display: none; background: transparent; border: none; color: var(--text); cursor: pointer; padding: 4px; }
.hamburger svg { width: 24px; height: 24px; }
.nav-link {
  color: var(--muted); text-decoration: none; font-size: 13px; font-weight: 500;
  padding: 6px 0; transition: all 0.18s ease; position: relative;
}
.nav-link:hover { color: var(--text); }
.nav-link::after {
  content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--primary); border-radius: 999px; transform: scaleX(0); transition: transform 0.18s ease;
}
.nav-link:hover::after { transform: scaleX(1); }
.nav-actions { display: flex; align-items: center; gap: 14px; }
.nav-controls-pill {
  display: inline-flex; align-items: center; gap: 12px; padding: 6px 14px;
  border-radius: 999px; background: color-mix(in srgb, var(--surface) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  transition: all 0.15s ease;
}
.nav-controls-pill:hover { border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.lang-switch-clean {
  text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; gap: 4px; align-items: center;
}
.lang-opt { color: var(--muted); opacity: 0.6; transition: all 0.15s; }
.lang-opt.active { color: var(--primary); opacity: 1; font-weight: 700; }
.lang-sep { color: var(--border); font-size: 10px; }
/* \u2500\u2500 Custom language picker dropdown \u2500\u2500 */
.lang-picker { position: relative; z-index: 200; }
.lang-picker-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 999px; border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(8px); color: var(--text); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
}
.lang-picker-btn:hover { border-color: var(--primary); color: var(--primary); }
.lang-picker-btn[aria-expanded="true"] { border-color: var(--primary); }
.lang-picker-btn[aria-expanded="true"] .ld-caret { transform: rotate(180deg); }
.ld-caret { transition: transform 0.2s ease; }
.ld-menu {
  display: none; position: absolute; top: calc(100% + 6px); right: 0;
  min-width: 160px; max-height: 320px; overflow-y: auto;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 6px; box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  flex-direction: column; gap: 2px;
}
.ld-menu.open { display: flex; animation: ld-fade 0.15s ease; }
@keyframes ld-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.ld-item {
  display: block; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  font-weight: 500; color: var(--text); text-decoration: none; transition: background 0.1s;
}
.ld-item:hover { background: var(--tint); color: var(--primary); }
.ld-item.active { color: var(--primary); font-weight: 700; background: color-mix(in srgb, var(--primary) 10%, transparent); }
.ld-menu::-webkit-scrollbar { width: 4px; }
.ld-menu::-webkit-scrollbar-track { background: transparent; }
.ld-menu::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
/* \u2500\u2500 RTL support \u2500\u2500 */
[dir="rtl"] { direction: rtl; }
[dir="rtl"] .nav-links { direction: ltr; }
[dir="rtl"] .hero-inner { direction: rtl; }
[dir="rtl"] .feature-card, [dir="rtl"] .how-step, [dir="rtl"] .pricing-card { text-align: right; }
[dir="rtl"] .footer-grid { direction: rtl; }
[dir="rtl"] .ld-menu { right: auto; left: 0; }
.nav-cta {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px;
  font-size: 13px; font-weight: 600; border-radius: 999px;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
  transition: all 0.18s ease;
}
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 50%, transparent); }

/* \u2500\u2500 Rich Multi-Column Footer \u2500\u2500 */
.footer {
  margin-top: 48px;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%);
  padding: 48px 0 24px;
}
.footer-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
.footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px;
  margin-bottom: 32px;
}
.footer-col h4 {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text); margin: 0 0 16px;
}
.footer-col ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.footer-col a {
  color: var(--muted); text-decoration: none; font-size: 12px;
  transition: color 120ms;
}
.footer-col a:hover { color: var(--primary); }
.footer-brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; }
.footer-desc { color: var(--muted); font-size: 12px; margin: 12px 0 16px; max-width: 32ch; line-height: 1.6; }
.version-badge { display: inline-block; font-size: 11px; padding: 3px 8px; border-radius: var(--radius); background: var(--tint); color: var(--primary); font-weight: 600; }
.footer-bottom {
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px;
  padding-top: 24px; border-top: 1px solid var(--border);
  color: var(--muted); font-size: 12px; text-align: center;
}
.footer-bottom-text { width: 100%; text-align: center; }
.footer-social { display: flex; gap: 12px; margin-top: 16px; }
.footer-social .social-link { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--tint); color: var(--muted); transition: color 0.2s, background 0.2s; }
.footer-social .social-link:hover { color: var(--primary); background: color-mix(in srgb, var(--primary) 15%, transparent); }
@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .hamburger { display: block; }
  .nav-links { display: none; flex-direction: column; position: absolute; top: 100%; left: 0; width: 100%; background: var(--surface); padding: 16px; border-bottom: 1px solid var(--border); box-shadow: 0 8px 16px color-mix(in srgb, var(--bg) 50%, transparent); }
  .nav-links.open { display: flex; }
}
@media (max-width: 480px) {
  .footer-grid { grid-template-columns: 1fr; }
}

/* recovery bridge: current markup uses .feature-card / .site-footer */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px 24px; text-align: center;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);
  color: var(--muted);
}
.empty-state .empty-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--tint); color: var(--primary);
}
.empty-state p { margin: 0; font-size: 13px; max-width: 40ch; }
.feature-card {
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px;
}
.feature-card .icon {
  display: inline-flex; width: 40px; height: 40px; border-radius: var(--radius);
  align-items: center; justify-content: center; background: var(--tint);
  color: var(--primary); margin-bottom: 12px;
}
.feature-card h3 { margin: 0 0 8px; font-size: 18px; }
.feature-card p { margin: 0; color: var(--muted); font-size: 12px; }
.feature-card { transition: transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, box-shadow 220ms ease; }
.feature-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--primary) 42%, var(--border)); box-shadow: 0 18px 42px color-mix(in srgb, var(--primary) 14%, transparent); }
.feature-card .icon { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
.feature-card:hover .icon { transform: scale(1.08) rotate(-3deg); }
.site-footer {
  margin-top: 48px; padding: 24px 2rem;
  border-top: 1px solid var(--surface); color: var(--muted); font-size: 12px;
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;
}
.site-footer a { color: var(--muted); text-decoration: none; }
.site-footer a:hover { color: var(--text); }
`;
}
function renderAdminDashboard(model) {
  return `
<div class="wrap">
  <h2>${label(model.titleKey)}</h2>
  <div class="bento-grid">
    <div class="bento-tile" style="transition: transform 0.2s, background 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.background='var(--surface)'" onmouseout="this.style.transform='translateY(0)'; this.style.background=''">
      <div class="tile-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span class="tile-title">Total Users</span>
      </div>
      <div class="value">${model.totalUsers}</div>
    </div>
    <div class="bento-tile" style="transition: transform 0.2s, background 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.background='var(--surface)'" onmouseout="this.style.transform='translateY(0)'; this.style.background=''">
      <div class="tile-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
        <span class="tile-title">Active Devices</span>
      </div>
      <div class="value">${model.activeDevices}</div>
    </div>
    <div class="bento-tile" style="transition: transform 0.2s, background 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.background='var(--surface)'" onmouseout="this.style.transform='translateY(0)'; this.style.background=''">
      <div class="tile-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        <span class="tile-title">Revenue (MRR)</span>
      </div>
      <div class="value">${model.revenue}</div>
    </div>
  </div>

  <h2 style="margin-top: 32px;">System Logs</h2>
  <div class="nx-table-wrap">
    <table class="nx-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Event</th>
        </tr>
      </thead>
      <tbody>
        ${model.recentLogs.map((l) => `<tr style="transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''"><td>${l.time}</td><td>${l.event}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>
</div>
`;
}

// ../web/src/seo.ts
function attr(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function safeJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}
function structuredData(config2) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config2.siteName,
    description: config2.description,
    url: config2.url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows, macOS, Linux, iOS, Android",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...config2.image ? { image: config2.image } : {}
  };
  return `<script type="application/ld+json">
${safeJson(data)}
</script>`;
}
function organizationData(config2) {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config2.siteName,
    url: config2.url,
    ...config2.image ? { logo: config2.image } : {}
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config2.siteName,
    url: config2.url,
    inLanguage: (config2.alternates ?? []).map((a) => a.lang)
  };
  return `<script type="application/ld+json">
${safeJson(org)}
</script>
<script type="application/ld+json">
${safeJson(site)}
</script>`;
}
function renderHead(config2) {
  const robots = config2.robots ?? "index,follow";
  const lines = [
    `<title>${attr(config2.title)}</title>`,
    `<meta name="description" content="${attr(config2.description)}" />`,
    `<meta name="robots" content="${attr(robots)}" />`,
    `<link rel="canonical" href="${attr(config2.url)}" />`
  ];
  if (config2.keywords && config2.keywords.length > 0) {
    lines.push(`<meta name="keywords" content="${attr(config2.keywords.join(", "))}" />`);
  }
  if (config2.themeColor) {
    lines.push(`<meta name="theme-color" content="${attr(config2.themeColor)}" />`);
  }
  lines.push(
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${attr(config2.siteName)}" />`,
    `<meta property="og:title" content="${attr(config2.title)}" />`,
    `<meta property="og:description" content="${attr(config2.description)}" />`,
    `<meta property="og:url" content="${attr(config2.url)}" />`,
    `<meta property="og:locale" content="${attr(config2.locale)}" />`
  );
  for (const alt of config2.alternates ?? []) {
    lines.push(`<meta property="og:locale:alternate" content="${attr(alt.lang)}" />`);
  }
  if (config2.image) {
    lines.push(`<meta property="og:image" content="${attr(config2.image)}" />`);
  }
  lines.push(
    `<meta name="twitter:card" content="${config2.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${attr(config2.title)}" />`,
    `<meta name="twitter:description" content="${attr(config2.description)}" />`
  );
  if (config2.twitterSite) {
    lines.push(`<meta name="twitter:site" content="${attr(config2.twitterSite)}" />`);
  }
  if (config2.image) {
    lines.push(`<meta name="twitter:image" content="${attr(config2.image)}" />`);
  }
  for (const alt of config2.alternates ?? []) {
    lines.push(`<link rel="alternate" hreflang="${attr(alt.lang)}" href="${attr(alt.url)}" />`);
  }
  if (config2.alternates && config2.alternates.length > 0) {
    lines.push(`<link rel="alternate" hreflang="x-default" href="${attr(config2.url)}" />`);
  }
  lines.push(structuredData(config2));
  lines.push(organizationData(config2));
  return lines.join("\n");
}

// ../web/src/index.ts
var SITE_URL = "https://nexus-ai.example.com/";
var deviceManager = new DeviceManager();
deviceManager.registerConnector(
  new InMemoryConnector("system", [
    { id: "lamp", name: "Philips Hue Play Gradient Lightstrip", room: "Living room", capabilities: [] },
    { id: "tv", name: 'LG C3 65" 4K OLED Smart TV', room: "Living room", capabilities: [] },
    { id: "ac", name: "Daikin Sensira 18000 BTU Inverter AC", room: "Bedroom", capabilities: [] },
    { id: "lock", name: "August Smart Lock Pro + Connect", room: "Entrance", capabilities: [] },
    { id: "speaker", name: "Sonos Arc Dolby Atmos Soundbar", room: "Studio", capabilities: [] },
    { id: "camera", name: "Arlo Pro 4 Spotlight Security Camera", room: "Garden", capabilities: [] },
    { id: "thermostat", name: "Ecobee Smart Thermostat Premium", room: "Hallway", capabilities: [] },
    { id: "curtain", name: "Somfy Tahoma Motorized Smart Shades", room: "Bedroom", capabilities: [] }
  ])
);
function demoReleases() {
  const svc = new VersionInfoService();
  svc.publish({
    platform: "windows",
    version: "3.14.2",
    minOs: "Windows 10 and later",
    checksumSha256: "642c097c01c7a7597e8725bb494cbcb0e43be7e63c7c8d20ac1c829b9ea10287",
    downloadUrl: "/downloads/NEXUS-Setup-3.14.2.exe"
  });
  svc.publish({
    platform: "macos",
    version: "3.14.1",
    minOs: "macOS 12 and later",
    checksumSha256: computeChecksum("nexus-3.14.1-macos"),
    downloadUrl: "/downloads/NEXUS-3.14.1.dmg"
  });
  svc.publish({
    platform: "linux",
    version: "3.13.8",
    minOs: "Ubuntu 22.04 and later",
    checksumSha256: computeChecksum("nexus-3.13.8-linux"),
    downloadUrl: "/downloads/NEXUS-3.13.8.AppImage"
  });
  return svc;
}
function demoSeo(themeColor) {
  return {
    title: "Nexus \u2014 Your personal operating system",
    description: "Nexus is a voice-first, privacy-focused personal operating system that controls your devices, learns your routines, and works across Windows, macOS, Linux, iOS and Android.",
    url: SITE_URL,
    siteName: "NEXUS",
    locale: "en_US",
    alternates: [
      { lang: "en", url: SITE_URL },
      { lang: "tr", url: `${SITE_URL}tr/` }
    ],
    // Raster PNG is the primary social card (Facebook/LinkedIn/X need raster);
    // og-cover.svg is the deterministic vector source it is rendered from.
    image: `${SITE_URL}og-cover.png`,
    keywords: [
      "personal AI",
      "voice assistant",
      "smart home",
      "privacy",
      "cross-platform",
      "automation",
      "routines"
    ],
    themeColor,
    robots: "index,follow",
    twitterSite: "@nexusai"
  };
}
var NAV_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("nav a[data-nav]"));
function show(id) {
  sections.forEach(function (s) { s.hidden = s.id !== id; });
  var activeText = "";
  links.forEach(function (a) {
    var on = a.getAttribute("data-nav") === id;
    a.classList.toggle("active", on);
    if (on) { 
      a.setAttribute("aria-current", "page"); 
      activeText = a.textContent;
    } else { 
      a.removeAttribute("aria-current"); 
    }
  });
  if (activeText) {
    document.title = activeText + " \u2014 NEXUS";
  }
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : sections[0].id);
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
// Expose show to be called after translation
window.updateNavTitle = fromHash;
fromHash();
`.trim();
function buildDemoScreens() {
  const isTr = CURRENT_LOCALE === "tr";
  const ctx = { authenticated: true, plan: "family", role: "admin" };
  const devices = [
    {
      id: "lamp",
      nameKey: isTr ? "Philips Hue Play Gradient Ayd\u0131nlatma" : "Philips Hue Play Gradient Lightstrip",
      room: isTr ? "Salon" : "Living room",
      online: true,
      manufacturer: "Philips",
      model: "Hue Play Gradient",
      firmwareVersion: "1.93.11",
      ipAddress: "192.168.1.104",
      macAddress: "00:17:88:01:00:FF",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      analytics: {
        dailyUsageWh: [12, 15, 14, 18, 12, 11, 14],
        weeklyUsageWh: [84, 92, 88, 95],
        anomalyDetected: false
      }
    },
    {
      id: "tv",
      nameKey: isTr ? 'LG C3 65" 4K OLED TV' : 'LG C3 65" 4K OLED Smart TV',
      room: isTr ? "Salon" : "Living room",
      online: true,
      manufacturer: "LG",
      model: "OLED65C3PUA",
      firmwareVersion: "03.20.14",
      ipAddress: "192.168.1.108",
      macAddress: "A4:B3:C2:11:00:AA",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      analytics: {
        dailyUsageWh: [200, 180, 250, 300, 150, 190, 220],
        weeklyUsageWh: [1400, 1500, 1300, 1450],
        anomalyDetected: false
      }
    },
    {
      id: "ac",
      nameKey: isTr ? "Daikin Sensira Inverter Klima" : "Daikin Sensira 18000 BTU Inverter AC",
      room: isTr ? "Yatak Odas\u0131" : "Bedroom",
      online: true,
      manufacturer: "Daikin",
      model: "FTXC50C",
      firmwareVersion: "1.0.4",
      ipAddress: "192.168.1.115",
      macAddress: "00:22:33:44:55:66",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      analytics: {
        dailyUsageWh: [800, 900, 850, 1e3, 750, 800, 950],
        weeklyUsageWh: [6e3, 5800, 6200, 5900],
        anomalyDetected: true
      }
    },
    {
      id: "lock",
      nameKey: isTr ? "August Smart Lock Pro Ak\u0131ll\u0131 Kilit" : "August Smart Lock Pro + Connect",
      room: isTr ? "Giri\u015F" : "Entrance",
      online: false,
      manufacturer: "August",
      model: "Smart Lock Pro",
      firmwareVersion: "1.2.3",
      ipAddress: "192.168.1.120",
      macAddress: "AA:BB:CC:DD:EE:FF",
      connectionStatus: "offline",
      lastSeen: new Date(Date.now() - 864e5).toISOString()
    },
    {
      id: "speaker",
      nameKey: isTr ? "Sonos Arc Soundbar" : "Sonos Arc Dolby Atmos Soundbar",
      room: isTr ? "St\xFCdyo" : "Studio",
      online: true,
      manufacturer: "Sonos",
      model: "Arc",
      firmwareVersion: "15.1.1",
      ipAddress: "192.168.1.130",
      macAddress: "11:22:33:44:55:66",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "camera",
      nameKey: isTr ? "Arlo Pro 4 G\xFCvenlik Kameras\u0131" : "Arlo Pro 4 Spotlight Security Camera",
      room: isTr ? "Bah\xE7e" : "Garden",
      online: false,
      manufacturer: "Arlo",
      model: "Pro 4",
      firmwareVersion: "1.090",
      ipAddress: "192.168.1.140",
      macAddress: "99:88:77:66:55:44",
      connectionStatus: "error",
      lastSeen: new Date(Date.now() - 36e5).toISOString()
    },
    {
      id: "thermostat",
      nameKey: isTr ? "Ecobee Ak\u0131ll\u0131 Termostat Premium" : "Ecobee Smart Thermostat Premium",
      room: isTr ? "Koridor" : "Hallway",
      online: true,
      manufacturer: "Ecobee",
      model: "Premium",
      firmwareVersion: "4.7.5",
      ipAddress: "192.168.1.150",
      macAddress: "44:55:66:77:88:99",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      analytics: {
        dailyUsageWh: [100, 110, 105, 95, 120, 115, 100],
        weeklyUsageWh: [700, 750, 720, 740],
        anomalyDetected: false
      }
    },
    {
      id: "curtain",
      nameKey: isTr ? "Somfy Tahoma Motorlu Perde" : "Somfy Tahoma Motorized Smart Shades",
      room: isTr ? "Yatak Odas\u0131" : "Bedroom",
      online: true,
      manufacturer: "Somfy",
      model: "Tahoma",
      firmwareVersion: "2.1.0",
      ipAddress: "192.168.1.160",
      macAddress: "22:33:44:55:66:77",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  return {
    nav: buildNavigation(ctx),
    today: buildTodayModel({
      devicesOnline: devices.filter((d) => d.online).length,
      devicesTotal: devices.length,
      energyWhToday: 2720,
      activeRoutines: 5,
      pendingSuggestions: 3
    }),
    home: buildHomeStateModel(devices.map((d) => ({ room: d.room ?? "Home", online: d.online }))),
    devices: buildDeviceListModel(devices),
    releases: demoReleases(),
    suggestions: buildSuggestionsModel(
      isTr ? [
        {
          id: "s1",
          textKey: "Ak\u015Fam 19:00'da salon ayd\u0131nlatmas\u0131n\u0131 %40 seviyesine d\xFC\u015F\xFCr",
          at: "19:00"
        }
      ] : [{ id: "s1", textKey: "Dim living room lights to 40% at 19:00", at: "19:00" }]
    ),
    skills: buildSkillsModel(
      isTr ? [
        { id: "k2", nameKey: "G\xFCnayd\u0131n Rutini", usageCount: 88 },
        { id: "k3", nameKey: "Evden \xC7\u0131k\u0131\u015F", usageCount: 65 },
        { id: "k5", nameKey: "Gece G\xFCvenlik Modu", usageCount: 54 },
        { id: "k1", nameKey: "Sinema Modu", usageCount: 42 },
        { id: "k4", nameKey: "\xC7al\u0131\u015Fma Odas\u0131 Odaklanma", usageCount: 31 }
      ] : [
        { id: "k2", nameKey: "Good Morning Routine", usageCount: 88 },
        { id: "k3", nameKey: "Leaving Home", usageCount: 65 },
        { id: "k5", nameKey: "Night Security", usageCount: 54 },
        { id: "k1", nameKey: "Movie Night Mode", usageCount: 42 },
        { id: "k4", nameKey: "Study Focus Mode", usageCount: 31 }
      ],
      isTr ? [
        {
          id: "skill_security",
          nameKey: "G\xFCvenlik Modu",
          descriptionKey: "Hareket alg\u0131land\u0131\u011F\u0131nda kameralar\u0131 kayda al\u0131r ve \u0131\u015F\u0131klar\u0131 yakar.",
          icon: "shield",
          tags: ["g\xFCvenlik", "lokal"]
        },
        {
          id: "skill_energy",
          nameKey: "Enerji Tasarrufu",
          descriptionKey: "Bo\u015F odalardaki cihazlar\u0131 otomatik kapat\u0131r.",
          icon: "leaf",
          tags: ["enerji", "otomasyon"]
        },
        {
          id: "skill_movie",
          nameKey: "Sinema Modu",
          descriptionKey: "TV a\xE7\u0131ld\u0131\u011F\u0131nda \u0131\u015F\u0131klar\u0131 k\u0131sar ve perdeleri kapat\u0131r.",
          icon: "film",
          tags: ["e\u011Flence", "ayd\u0131nlatma"]
        }
      ] : [
        {
          id: "skill_security",
          nameKey: "Security Mode",
          descriptionKey: "Records cameras and turns on lights when motion is detected.",
          icon: "shield",
          tags: ["security", "local"]
        },
        {
          id: "skill_energy",
          nameKey: "Energy Saver",
          descriptionKey: "Automatically turns off devices in empty rooms.",
          icon: "leaf",
          tags: ["energy", "automation"]
        },
        {
          id: "skill_movie",
          nameKey: "Movie Mode",
          descriptionKey: "Dims lights and closes shades when the TV is turned on.",
          icon: "film",
          tags: ["entertainment", "lighting"]
        }
      ]
    ),
    family: buildFamilyModel(
      isTr ? [
        { id: "m1", nameKey: "Ensar", role: "admin", avatarUrl: "https://randomuser.me/api/portraits/men/86.jpg" },
        { id: "m2", nameKey: "Eray", role: "member", avatarUrl: "https://randomuser.me/api/portraits/men/91.jpg" }
      ] : [
        { id: "m1", nameKey: "Ensar", role: "admin", avatarUrl: "https://randomuser.me/api/portraits/men/86.jpg" },
        { id: "m2", nameKey: "Eray", role: "member", avatarUrl: "https://randomuser.me/api/portraits/men/91.jpg" }
      ]
    ),
    billing: buildBillingModel("family"),
    agents: buildAgentsModel(
      isTr ? [
        { id: "a1", nameKey: "Enerji Y\xF6neticisi", icon: "zap", status: "active" },
        { id: "a2", nameKey: "G\xFCvenlik G\xF6zc\xFCs\xFC", icon: "shield", status: "active" },
        { id: "a3", nameKey: "Konfor Asistan\u0131", icon: "thermometer", status: "learning" },
        { id: "a4", nameKey: "Rutin Planlay\u0131c\u0131", icon: "clipboard", status: "sleeping" }
      ] : [
        { id: "a1", nameKey: "Energy Manager", icon: "zap", status: "active" },
        { id: "a2", nameKey: "Security Watcher", icon: "shield", status: "active" },
        { id: "a3", nameKey: "Comfort Assistant", icon: "thermometer", status: "learning" },
        { id: "a4", nameKey: "Routine Planner", icon: "clipboard", status: "sleeping" }
      ]
    ),
    personalization: buildPersonalizationModel({
      assistantName: "NEXUS AI",
      userAddress: "Boss",
      language: CURRENT_LOCALE
    }),
    platform: buildPlatformModel(),
    adminDashboard: buildAdminDashboardModel()
  };
}
function renderScreenBody(id, s, userAgent, surface = "web") {
  switch (id) {
    case "today":
      return renderTodayPanel(s.today);
    case "home-state":
      return renderHomeState(s.home);
    case "suggestions":
      return renderSuggestions(s.suggestions);
    case "skills":
      return renderSkills(s.skills);
    case "family":
      return renderFamily(s.family);
    case "agents":
      return renderAgents(s.agents);
    case "devices":
      return renderDevices(s.devices);
    case "personalization":
      return renderPersonalization(s.personalization);
    case "platform":
      return renderPlatform(s.platform);
    case "billing":
      return renderBilling(s.billing);
    case "admin-dashboard":
      return renderAdminDashboard(s.adminDashboard);
    case "download-center":
      return renderDownloadCenter(s.releases, userAgent, surface);
    default:
      return "";
  }
}

// ../mobile/src/index.ts
var PRIMARY_TABS = [
  { id: "today", label: "Today", icon: "today" },
  { id: "home-state", label: "Home", icon: "home" },
  { id: "devices", label: "Devices", icon: "devices" },
  { id: "family", label: "Family", icon: "family" }
];
function renderTabIcon(name) {
  const paths = {
    today: `<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>`,
    home: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>`,
    devices: `<rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/>`,
    family: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7 0"/>`,
    more: `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`,
    suggestions: `<path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/>`,
    skills: `<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>`,
    personalization: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
    billing: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>`,
    "download-center": `<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>`,
    platform: `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
    agents: `<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/>`,
    "admin-dashboard": `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`
  };
  return `<svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ""}</svg>`;
}
function renderStatusBar(platform3 = "ios") {
  if (platform3 === "android") {
    return `<div class="statusbar statusbar-android" aria-hidden="true"><span class="time">10:00</span><span class="punch-hole" aria-hidden="true"></span><span class="sys"><span class="net-type" style="font-size:10px;font-weight:800;margin-right:2px;letter-spacing:-0.5px;">5G</span><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1" width="3" height="11" rx="1"/><rect x="15" y="1" width="3" height="11" rx="1"/></svg><svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="1" width="21" height="10" rx="2.5"/><rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor" stroke="none"/><rect x="23.5" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" stroke="none"/></svg></span></div>`;
  }
  return `<div class="statusbar statusbar-ios" aria-hidden="true"><span class="time">9:41</span><span class="dynamic-island" aria-hidden="true"></span><span class="sys"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1" width="3" height="11" rx="1"/><rect x="15" y="1" width="3" height="11" rx="1" opacity="0.4"/></svg><svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 11 1 4a10 10 0 0 1 14 0Z" opacity="0.9"/></svg><svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="1" width="21" height="10" rx="2.5"/><rect x="3" y="3" width="15" height="6" rx="1" fill="currentColor" stroke="none"/><rect x="23.5" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" stroke="none"/></svg></span></div>`;
}
function renderTabBar(activeId) {
  const primaryTabs = [
    { id: "today", titleKey: "screen.today", icon: "today" },
    { id: "home-state", titleKey: "screen.homeState", icon: "home" },
    { id: "devices", titleKey: "screen.devices", icon: "devices" },
    { id: "family", titleKey: "screen.family", icon: "family" }
  ];
  const primaryIds = new Set(primaryTabs.map((t2) => t2.id));
  const isMoreActive = activeId === "more" || !primaryIds.has(activeId);
  const tabs = [
    ...primaryTabs.map((t2) => ({ id: t2.id, label: label(t2.titleKey), icon: t2.icon })),
    { id: "more", label: label("mobile.menu"), icon: "more" }
  ];
  const items = tabs.map((t2) => {
    const on = t2.id === "more" && isMoreActive || t2.id === activeId;
    return `<a class="${on ? "active" : ""}" href="#${t2.id}" data-nav="${t2.id}"${on ? ' aria-current="page"' : ""}>${renderTabIcon(t2.icon)}<span>${escapeHtml(t2.label)}</span></a>`;
  }).join("");
  return `<nav class="tabbar" aria-label="Primary">${items}</nav>`;
}
function renderMobileStyles(t2) {
  return `${renderStyles(t2)}
@keyframes phone-float {
  0%,100% { transform: translateY(0px); box-shadow: 0 30px 80px rgba(0,0,0,0.55); }
  50%      { transform: translateY(-7px); box-shadow: 0 38px 90px rgba(0,0,0,0.48); }
}
@keyframes screen-slide-in {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: none; }
}
@keyframes tab-pill-slide {
  from { opacity: 0; transform: scaleX(0.5); }
  to   { opacity: 1; transform: scaleX(1); }
}
@keyframes more-row-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: none; }
}
@keyframes status-pulse {
  0% { opacity: 0.6; box-shadow: 0 0 4px #10b981; }
  50% { opacity: 1; box-shadow: 0 0 12px #10b981; transform: scale(1.1); }
  100% { opacity: 0.6; box-shadow: 0 0 4px #10b981; }
}
@keyframes shimmer {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
body.mobile {
  background: #05060a; padding: ${t2.space[6]}px;
  display: flex; justify-content: center; align-items: flex-start; min-height: 100vh;
}
.phone {
  width: 390px; max-width: 100%; height: 844px; background: var(--bg);
  border: 12px solid #000; border-radius: 52px; overflow: hidden;
  display: flex; flex-direction: column; position: relative;
  animation: phone-float 5s ease-in-out infinite;
}
.statusbar {
  height: 52px; flex: none; display: flex; align-items: center; justify-content: space-between;
  padding: 0 ${t2.space[6]}px; color: var(--text); font-size: 15px; font-weight: 600;
  position: relative;
}
.statusbar-android {
  padding: 0 ${t2.space[5]}px;
}
.dynamic-island {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 120px; height: 34px; background: #000; border-radius: 20px;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.06);
  pointer-events: none;
}
.statusbar .punch-hole {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
  width: 14px; height: 14px; background: #000; border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.06); pointer-events: none;
}
.statusbar .sys { display: flex; align-items: center; gap: ${t2.space[2]}px; }
.appbar {
  flex: none; display: flex; align-items: center; gap: ${t2.space[3]}px;
  padding: ${t2.space[2]}px ${t2.space[5]}px ${t2.space[3]}px;
  background: rgba(15, 18, 28, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, var(--surface));
  position: relative;
}
.appbar::after {
  content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb,var(--primary) 40%,transparent), transparent);
}
.appbar .logo { width: 26px; height: 26px; }
.appbar .apptitle {
  font-family: 'Outfit', sans-serif; font-weight: 800; font-size: ${t2.font.size.lg}px; letter-spacing: -0.02em;
  color: var(--text);
}
.appbar-right { margin-left: auto; display: flex; align-items: center; gap: ${t2.space[3]}px; }
.appbar .avatar-wrap { display: flex; }
.m-lang { display: inline-flex; gap: 4px; font-size: 11px; }
.m-lang a { color: var(--muted); text-decoration: none; }
.m-lang a.active { color: var(--primary); font-weight: 700; }
.m-logout { display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: var(--radius); border: 1px solid var(--border);
  background: transparent; color: var(--muted); cursor: pointer;
  transition: border-color .18s ease, color .18s ease; }
.m-logout:hover { border-color: var(--primary); color: var(--primary); }
.screen { flex: 1; overflow-y: auto; padding: ${t2.space[5]}px; }
.screen h2:first-child { margin-top: 0; }
.screen section.screen-enter { animation: screen-slide-in 0.26s cubic-bezier(0.22,1,0.36,1) both; }
.screen .cards { grid-template-columns: 1fr 1fr; }
/* The phone frame is a fixed-width container, so the shared bento/grids must
   collapse to fit the frame \u2014 not the viewport \u2014 or they overflow on wide
   screens (e.g. the desktop-served mobile view or a preview file). */
.screen .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.screen .bento-tile.featured { grid-column: 1 / -1; grid-row: auto; }
.screen .bento-tile.wide { grid-column: 1 / -1; }
.screen .bento-grid, .screen .bento-grid.wide { grid-template-columns: 1fr; }
.screen .assistant-strip { flex-wrap: wrap; }
.screen .assistant-strip .btn { margin-left: 0; }
.screen .quick-commands-grid { grid-template-columns: repeat(2, 1fr); }
.screen .ring-wrap { gap: ${t2.space[4]}px; }
.tabbar {
  flex: none; display: flex; border-top: 1px solid color-mix(in srgb, var(--primary) 15%, var(--border));
  background: rgba(15, 18, 28, 0.75); backdrop-filter: blur(20px) saturate(180%);
  padding-bottom: calc(${t2.space[3]}px + 20px); margin: 0; position: relative;
}
.tabbar a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: ${t2.space[2]}px ${t2.space[1]}px; color: var(--muted);
  text-decoration: none; font-size: 10px; background: transparent; border: 0; border-radius: 0;
  position: relative; transition: color 0.22s ease;
}
.tabbar a svg { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1); }
.tabbar a.active { background: transparent; box-shadow: none; color: var(--primary); }
.tabbar a.active svg { transform: scale(1.18) translateY(-1px); }
.tab-indicator {
  position: absolute; top: 0; height: 2.5px; border-radius: 0 0 3px 3px;
  background: var(--primary); pointer-events: none;
  transition: left 0.28s cubic-bezier(0.22,1,0.36,1), width 0.28s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 0 8px color-mix(in srgb,var(--primary) 50%,transparent);
}
.morelist { list-style: none; margin: 0; padding: 0; display: grid; gap: ${t2.space[2]}px; }
.morerow {
  display: flex; align-items: center; gap: ${t2.space[3]}px;
  background: var(--surface); border-radius: var(--radius); padding: ${t2.space[4]}px;
  color: var(--text); text-decoration: none; transition: background 0.18s ease, transform 0.18s ease;
}
.morerow:hover { background: color-mix(in srgb, var(--surface) 80%, var(--primary)); transform: translateY(-1px); }
.morerow svg { color: var(--primary); transition: transform 0.18s ease; }
.morerow:hover > svg:last-child { transform: translateX(3px); }
.morelist li { opacity: 0; animation: more-row-in 0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
.morelist li:nth-child(1) { animation-delay: 0.04s; }
.morelist li:nth-child(2) { animation-delay: 0.08s; }
.morelist li:nth-child(3) { animation-delay: 0.12s; }
.morelist li:nth-child(4) { animation-delay: 0.16s; }
.morelist li:nth-child(5) { animation-delay: 0.20s; }
.morelist li:nth-child(6) { animation-delay: 0.24s; }
.morelist li:nth-child(7) { animation-delay: 0.28s; }
.morelist li:nth-child(8) { animation-delay: 0.32s; }
html.js-tabs .screen > section[hidden] { display: none; }
@media (prefers-reduced-motion: reduce) {
  .phone { animation: none; }
  .tabbar a svg, .tabbar a, .m-logout, .morerow, .morerow svg { transition: none; }
  .screen section.screen-enter { animation: none; }
  .morelist li { animation: none; opacity: 1; }
  .tab-indicator { transition: none; }
}
@media (max-width: 480px) {
  body.mobile { padding: 0; }
  .phone {
    width: 100%; max-width: 100%; height: 100vh; height: 100dvh;
    border: 0; border-radius: 0; box-shadow: none; animation: none;
  }
  .screen .cards { grid-template-columns: 1fr; }
  .screen .bento-tile, .screen .plan-card, .screen .skill-card-rich, .screen .suggestion-card { padding: 14px; }
  .screen .badge { white-space: normal; word-break: break-word; }
  .screen * { word-wrap: break-word; overflow-wrap: break-word; }

}`;
}
var MOBILE_NAV_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll(".screen > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
var tabIndicator = null;
function positionTabIndicator() {
  var tabbar = document.querySelector(".tabbar");
  if (!tabbar) return;
  if (!tabIndicator) {
    tabIndicator = document.createElement("span");
    tabIndicator.className = "tab-indicator";
    tabbar.appendChild(tabIndicator);
  }
  var active = tabbar.querySelector("a.active");
  if (active) {
    var barRect = tabbar.getBoundingClientRect();
    var aRect = active.getBoundingClientRect();
    tabIndicator.style.left = (aRect.left - barRect.left) + "px";
    tabIndicator.style.width = aRect.width + "px";
  }
}
function show(id) {
  var primaryIds = ["today", "home-state", "devices", "family"];
  var isMoreScreen = primaryIds.indexOf(id) < 0;
  sections.forEach(function (s) {
    var becoming = s.id === id;
    if (becoming && s.hidden) {
      s.hidden = false;
      s.classList.remove("screen-enter");
      void s.offsetWidth;
      s.classList.add("screen-enter");
    } else if (!becoming) {
      s.hidden = true;
    }
  });
  links.forEach(function (a) {
    var target = a.getAttribute("data-nav");
    var on = target === id || (isMoreScreen && target === "more");
    if (a.parentNode && a.parentNode.className && a.parentNode.className.indexOf("tabbar") >= 0) {
      a.classList.toggle("active", on);
      if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
    }
  });
  positionTabIndicator();
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : sections[0].id);
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
fromHash();
`.trim();
function renderMobileDocument(options = {}) {
  const themeName = options.theme ?? "dark";
  const userAgent = options.userAgent ?? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
  const theme = getTheme(themeName);
  if (options.locale) setLocale(options.locale);
  const authed = options.authenticated ?? false;
  const screens = options.screens ?? buildDemoScreens();
  const primaryIds = new Set(PRIMARY_TABS.map((t2) => t2.id));
  const moreScreens = screens.nav.filter((s) => !primaryIds.has(s.id));
  const appScreens = screens.nav.map(
    (s) => `<section id="${s.id}">${renderScreenBody(s.id, screens, userAgent, "mobile")}</section>`
  ).join("\n");
  const moreSubtitles = {
    suggestions: label("mobile.moreSub.suggestions"),
    skills: label("mobile.moreSub.skills"),
    personalization: label("mobile.moreSub.personalization"),
    billing: label("mobile.moreSub.billing"),
    "download-center": label("mobile.moreSub.downloads"),
    platform: label("mobile.moreSub.platform"),
    agents: label("mobile.moreSub.agents"),
    "admin-dashboard": label("mobile.moreSub.admin")
  };
  const moreBadges = {
    suggestions: "3",
    skills: "5",
    personalization: "Adm",
    billing: "PRO",
    "download-center": "140 MB",
    platform: "3 OS",
    agents: "4 Active",
    "admin-dashboard": "LIVE"
  };
  const moreRows = moreScreens.map((s) => {
    const sub = authed ? "" : moreSubtitles[s.id] ?? "";
    const badge = authed ? "" : moreBadges[s.id] ?? "";
    return `<li><a class="morerow" href="#${s.id}" data-nav="${s.id}"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(--primary) 12%,var(--surface));display:flex;align-items:center;justify-content:center;color:var(--primary);flex:none;">${renderTabIcon(s.id)}</span><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${escapeHtml(label(s.titleKey))}${badge ? `<span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;background:var(--tint);color:var(--primary);">${badge}</span>` : ""}</div><div style="font-size:11px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(sub)}</div></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex:none;"><polyline points="9 18 15 12 9 6"/></svg></a></li>`;
  }).join("");
  const systemStatusBanner = `<div style="position:relative; background:rgba(20,22,35,0.6); backdrop-filter:blur(12px); border:1px solid color-mix(in srgb, var(--primary) 20%, var(--border)); border-radius: 20px; padding: 18px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05); overflow:hidden;"><div style="position:absolute; top:-20px; right:-20px; width:100px; height:100px; background:var(--primary); filter:blur(50px); opacity:0.15; border-radius:50%;"></div><div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom: 14px; position:relative; z-index:1;"><div style="display:flex; align-items:center; gap: 8px;"><div style="width:32px; height:32px; border-radius:10px; background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div><div><div style="font-weight:700; font-size:14px; color:var(--text); letter-spacing:-0.01em;">${label("mobile.systemStatus")}</div><div style="font-size:11px; color:var(--muted); margin-top:2px;">${label("mobile.localNetwork")}</div></div></div><div style="display:flex; align-items:center; gap:6px; background:rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 4px 10px; border-radius: 999px;"><span style="width:6px; height:6px; border-radius:50%; background:#10b981; box-shadow: 0 0 8px #10b981; animation: status-pulse 2s infinite;"></span><span style="font-size:11px; font-weight:700; color:#10b981;">${label("mobile.offline")}</span></div></div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; position:relative; z-index:1;"><div style="background:rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; display:flex; flex-direction:column; gap:4px;"><div style="display:flex; align-items:center; gap:6px; color:var(--muted); font-size:11px; font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10z"></path><path d="M12 6v6l4 2"></path></svg>${label("mobile.localAI")}</div><div style="font-size:12px; font-weight:700; color:var(--text);">v3.14-Tr <span style="color:var(--primary); font-weight:600; font-size:11px; margin-left:4px;">(Aktif)</span></div></div><div style="background:rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; display:flex; flex-direction:column; gap:4px;"><div style="display:flex; align-items:center; gap:6px; color:var(--muted); font-size:11px; font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"></path><path d="M4 8h16"></path><path d="M8 4v4"></path></svg>${label("mobile.deviceNetwork")}</div><div style="font-size:12px; font-weight:700; color:var(--text);">6/8 <span style="color:var(--muted); font-weight:500; font-size:11px; margin-left:4px;">${label("mobile.online")}</span></div></div></div></div>`;
  const quickSettingsCard = `<div style="background:rgba(20,22,35,0.6); backdrop-filter:blur(12px); border:1px solid color-mix(in srgb, var(--border) 60%, transparent); border-radius: 20px; padding: 6px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);"><div style="padding: 12px 14px 6px; display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--primary);"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg><div style="font-weight:800; font-size:11px; color:var(--muted); letter-spacing:0.06em;">${label("mobile.quickControls")}</div></div><div style="display:flex; flex-direction:column; gap:4px; padding:4px;"><div style="display:flex; align-items:center; justify-content:space-between; padding: 12px; background:var(--surface); border-radius:14px; border:1px solid transparent; transition:border 0.2s;"><div style="display:flex; align-items:center; gap:10px;"><div style="width:28px; height:28px; border-radius:8px; background:rgba(16,185,129,0.15); color:#10b981; display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div><span style="color:var(--text); font-size:13px; font-weight:600;">${label("mobile.privacyShield")}</span></div><div style="background:#10b981; color:#000; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; display:flex; align-items:center; gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> ${label("mobile.active")}</div></div><div style="display:flex; align-items:center; justify-content:space-between; padding: 12px; background:var(--surface); border-radius:14px; border:1px solid transparent; transition:border 0.2s;"><div style="display:flex; align-items:center; gap:10px;"><div style="width:28px; height:28px; border-radius:8px; background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary); display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg></div><span style="color:var(--text); font-size:13px; font-weight:600;">${label("mobile.voiceWake")}</span></div><div style="background:var(--primary); color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; display:flex; align-items:center; gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> ${label("mobile.on")}</div></div><div style="display:flex; align-items:center; justify-content:space-between; padding: 12px; background:var(--surface); border-radius:14px; border:1px solid transparent; transition:border 0.2s;"><div style="display:flex; align-items:center; gap:10px;"><div style="width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.05); color:var(--muted); display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></div><span style="color:var(--text); font-size:13px; font-weight:600;">${label("mobile.autoBackup")}</span></div><div style="color:var(--muted); font-size:12px; font-weight:600; padding:4px 4px; display:flex; align-items:center; gap:4px;">${label("mobile.backupTime")}</div></div></div></div>`;
  const moreSection = `<section id="more"><h2>${label("mobile.more")}</h2>${authed ? "" : systemStatusBanner}<ul class="morelist">${moreRows}</ul>${authed ? "" : quickSettingsCard}</section>`;
  const nameForInitial = options.displayName || screens.personalization.userAddress || "N";
  const initial = escapeHtml(nameForInitial.trim().charAt(0).toUpperCase() || "N");
  const locale = options.locale ?? CURRENT_LOCALE;
  const langLabels = {
    en: "EN",
    tr: "TR",
    es: "ES",
    fr: "FR",
    de: "DE",
    it: "IT",
    pt: "PT",
    nl: "NL",
    pl: "PL",
    cs: "CS",
    ru: "RU",
    uk: "UK",
    ar: "AR",
    he: "HE",
    hi: "HI",
    ja: "JA",
    ko: "KO",
    "zh-Hans": "\u4E2D\u7B80",
    "zh-Hant": "\u4E2D\u7E41",
    vi: "VI"
  };
  const langItems = SUPPORTED_LOCALES.map(
    (l) => `<a class="ld-item${l === locale ? " active" : ""}" href="?lang=${l}" data-lang="${l}">${langLabels[l] || l.toUpperCase()}</a>`
  ).join("");
  const appbarRight = authed ? `<div class="lang-picker"><button class="lang-picker-btn" type="button" aria-expanded="false" aria-haspopup="listbox"><span>${langLabels[locale] || locale.toUpperCase()}</span><svg class="ld-caret" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button><div class="ld-menu" role="listbox">${langItems}</div></div><div class="avatar-wrap">${renderAvatar(void 0, initial)}</div><button class="m-logout" id="m-logout" type="button" aria-label="${escapeHtml(label("auth.logout"))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>` : `<div class="avatar-wrap" aria-hidden="true">${renderAvatar(screens.personalization.avatarUrl, initial)}</div>`;
  const pwaHead = authed ? `<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icon.svg" />` : "";
  const authScript = authed ? `
<script>
if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){});}
var _lo=document.getElementById("m-logout");if(_lo){_lo.addEventListener("click",function(){fetch("/api/logout",{method:"POST"}).then(function(){location.href="/login";});});}
</script>` : "";
  return `<!doctype html>
<html lang="${locale}" data-theme="${escapeHtml(themeName)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="${theme.color.bg}" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="NEXUS" />
${pwaHead}
<title>NEXUS${authed ? "" : " Mobile"}</title>
<style>${renderMobileStyles(theme)}</style>
<script>${MOBILE_NAV_SCRIPT}</script>
</head>
<body class="mobile">
<div class="phone">
${renderStatusBar(options.platform)}
<header class="appbar">${renderLogo(theme.color.primary)}<span class="apptitle">NEXUS</span><div class="appbar-right">${appbarRight}</div></header>
<main class="screen" id="main">
${appScreens}
${moreSection}
</main>
${renderTabBar("today")}
</div>
<script>${MOBILE_NAV_SCRIPT}</script>${authScript}
</body>
</html>`;
}

// ../desktop/src/utils.ts
function renderWindowControls(os3 = "windows") {
  if (os3 === "mac") {
    return `<div class="wctl" style="width: 72px;"></div>`;
  }
  if (os3 === "linux") {
    const btn2 = (path, action, cls = "", ariaLabel) => `<button type="button" class="wctl-btn gnome-btn${cls ? " " + cls : ""}" data-wctl="${action}" aria-label="${ariaLabel}"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg></button>`;
    return `<div class="wctl wctl-gnome" style="gap: 6px;">` + btn2(`<path d="M2 6h8"/>`, "minimize", "min", "Minimize window") + btn2(`<rect x="2" y="2" width="8" height="8" rx="1.5"/>`, "toggleMaximize", "max", "Maximize window") + btn2(`<path d="M3 3l6 6M9 3l-6 6"/>`, "close", "close", "Close window") + `</div>`;
  }
  const btn = (path, action, cls = "", ariaLabel) => `<button type="button" class="wctl-btn${cls ? " " + cls : ""}" data-wctl="${action}" aria-label="${ariaLabel}"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg></button>`;
  return `<div class="wctl">` + btn(`<path d="M5 12h14"/>`, "minimize", "min", "Minimize window") + btn(`<rect x="5" y="5" width="14" height="14" rx="2"/>`, "toggleMaximize", "max", "Maximize window") + btn(`<path d="M6 6l12 12M18 6 6 18"/>`, "close", "close", "Close window") + `</div>`;
}
var SIDE_ICON = {
  today: `<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>`,
  "home-state": `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>`,
  suggestions: `<path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/>`,
  skills: `<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>`,
  devices: `<rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/>`,
  family: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7 0"/>`,
  personalization: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
  billing: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>`,
  "download-center": `<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>`
};
function renderSideIcon(id) {
  return `<svg class="sideicon" width="18" height="18" viewBox="0 0 24 24" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SIDE_ICON[id] ?? SIDE_ICON.today}</svg>`;
}

// ../desktop/src/setup.ts
var STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "license", label: "License" },
  { id: "location", label: "Location" },
  { id: "installing", label: "Installing" },
  { id: "finish", label: "Finish" }
];
function renderSetupStyles(themeName) {
  const t2 = getTheme(themeName);
  const base = renderStyles(t2);
  const extra = `
/* \u2500\u2500 Setup window shell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
body.setup {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg);
  font-family: ${t2.font.family};
  color: var(--text);
  margin: 0;
}
.setup-window {
  width: 720px;
  height: 520px;
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  background: var(--surface);
}
/* title bar */
.setup-window .titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${t2.space[3]}px ${t2.space[4]}px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}
.setup-window .title {
  font-size: ${t2.font.size.sm}px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}
/* two-pane body */
.setup-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
/* \u2500\u2500 Left rail \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.setup-rail {
  width: 220px;
  flex: none;
  display: flex;
  flex-direction: column;
  padding: ${t2.space[6]}px ${t2.space[5]}px;
  border-right: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--tint) 20%, transparent), transparent);
  gap: ${t2.space[6]}px;
}
.setup-brand {
  display: flex;
  align-items: center;
  gap: ${t2.space[3]}px;
}
.setup-brand .brand-name {
  font-size: ${t2.font.size.md}px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
/* stepper */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${t2.space[2]}px;
}
.steps li {
  display: flex;
  align-items: center;
  gap: ${t2.space[3]}px;
  padding: ${t2.space[2]}px ${t2.space[3]}px;
  border-radius: var(--radius);
  font-size: ${t2.font.size.sm}px;
  font-weight: 500;
  color: var(--muted);
  transition: background 0.18s, color 0.18s;
}
.steps li .step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex: none;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
}
.steps li.active {
  color: var(--text);
  background: var(--tint);
}
.steps li.active .step-num {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}
.steps li.done .step-num {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
  font-size: 0;
  box-shadow: 0 0 8px color-mix(in srgb, var(--primary) 40%, transparent);
  position: relative;
}
.steps li.done .step-num::after {
  content: "\u2713";
  font-size: 12px;
}
/* \u2500\u2500 Right content area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.setup-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.step {
  display: none;
  flex-direction: column;
  gap: ${t2.space[4]}px;
  padding: ${t2.space[6]}px;
  flex: 1;
  overflow-y: auto;
}
.step.active {
  display: flex;
}
.step h2 {
  margin: 0;
  font-size: ${t2.font.size.xl}px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.step p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}
/* welcome bullet list */
.setup-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${t2.space[3]}px;
}
.setup-bullets li {
  display: flex;
  align-items: flex-start;
  gap: ${t2.space[3]}px;
  font-size: ${t2.font.size.md}px;
}
.setup-bullets li::before {
  content: "\u2726";
  color: var(--primary);
  flex: none;
  margin-top: 1px;
}
/* license box */
.license-box {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  padding: ${t2.space[4]}px;
  font-size: ${t2.font.size.sm}px;
  line-height: 1.7;
  color: var(--muted);
}
/* checkbox row */
.check-row {
  display: flex;
  align-items: center;
  gap: ${t2.space[2]}px;
  font-size: ${t2.font.size.md}px;
  cursor: pointer;
}
.check-row input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
  cursor: pointer;
}
/* location field */
.field {
  display: flex;
  gap: ${t2.space[2]}px;
}
.field input[type="text"] {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: ${t2.space[3]}px ${t2.space[4]}px;
  font-size: ${t2.font.size.md}px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field input[type="text"]:focus {
  border-color: var(--primary);
  box-shadow: var(--ring);
}
.field .btn-browse {
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: ${t2.space[3]}px ${t2.space[4]}px;
  font-size: ${t2.font.size.sm}px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s;
}
.field .btn-browse:hover { background: var(--tint); }
.disk-info {
  font-size: ${t2.font.size.sm}px;
  color: var(--muted);
}
/* progress */
.progress {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
  width: 0%;
  box-shadow: 0 0 8px color-mix(in srgb, var(--primary) 55%, transparent);
}
@keyframes nx-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.progress-fill.running {
  animation: nx-indeterminate 1.5s infinite linear;
  width: 50%;
}
.status-line {
  font-size: ${t2.font.size.sm}px;
  color: var(--muted);
}
/* finish checkmark */
.finish-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--tint);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
/* footer */
.setup-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${t2.space[4]}px ${t2.space[6]}px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}
.footer-right {
  display: flex;
  gap: ${t2.space[3]}px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${t2.space[2]}px;
  padding: ${t2.space[3]}px ${t2.space[5]}px;
  border-radius: var(--radius);
  font-size: ${t2.font.size.md}px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  border: none;
  transition: opacity 0.15s, box-shadow 0.15s;
}
.btn-ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--surface); color: var(--text); }
.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 38%, transparent);
}
.btn-primary:hover { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
`;
  return `${base}
${extra}`;
}
function stepWelcome(logoSvg) {
  return `<div class="setup-brand">${logoSvg}<span class="brand-name">NEXUS</span></div><h2>${label("setup.welcomeTitle")}</h2><p>${label("setup.welcomeDesc")}</p><ul class="setup-bullets"><li>${label("setup.bullet1")}</li><li>${label("setup.bullet2")}</li><li>${label("setup.bullet3")}</li></ul><p>${label("setup.continueHint")}</p>`;
}
function stepLicense() {
  return `<h2>${label("setup.licenseTitle")}</h2><p>${label("setup.licenseHint")}</p><div class="license-box"><pre style="margin:0;white-space:pre-wrap;font-family:var(--font-mono, 'JetBrains Mono', monospace);font-size:12px;">${escapeHtml(label("setup.licenseText"))}</pre></div><label class="check-row" id="license-check-label"><input type="checkbox" id="license-accept" onchange="window.__nx_licenseChanged(this)"> ${label("setup.accept")}</label>`;
}
function stepLocation(os3 = "windows") {
  const defaultPath = os3 === "mac" ? "/Applications/NEXUS.app" : "C:\\Program Files\\NEXUS";
  return `<h2>${label("setup.locationTitle")}</h2><p>${label(os3 === "mac" ? "setup.locationDescMac" : "setup.locationDesc")}</p><div class="field"><input type="text" id="install-path" value="${escapeHtml(defaultPath)}" aria-label="Installation path"><button class="btn-browse btn" onclick="window.__nx_browse()" type="button">${label("setup.browse")}</button></div><p class="disk-info">${label("setup.spaceInfo")}</p>`;
}
function stepInstalling() {
  return `<h2>${label("setup.installingTitle")}</h2><p>${label("setup.installingDesc")}</p><div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Installation progress"><div class="progress-fill" id="install-progress"></div></div><p class="status-line" id="install-status">${label("setup.installingStatus")}</p>`;
}
function stepFinish() {
  return `<div class="finish-icon" aria-hidden="true">\u2713</div><h2>${label("setup.finishTitle")}</h2><p>${label("setup.finishDesc")}</p><label class="check-row"><input type="checkbox" id="launch-now" checked> ${label("setup.launchNow")}</label>`;
}
function renderSetupDocument({ theme, os: os3 = "windows", locale }) {
  const t2 = getTheme(theme);
  const logoSvg = renderLogo(t2.color.primary);
  if (locale) setLocale(locale);
  const stepLabels = [
    label("setup.welcome"),
    label("setup.license"),
    label("setup.location"),
    label("setup.installing"),
    label("setup.finish")
  ];
  const txtInstall = label("setup.installBtn");
  const txtFinish = label("setup.finish");
  const txtContinue = label("setup.continue");
  const setupScript = (
    /* js */
    `
(function () {
  var steps = ${JSON.stringify(STEPS.map((s) => s.id))};
  var current = 0;
  var licenseAccepted = false;

  document.addEventListener("click", function(e) {
    var wctl = e.target.closest("[data-wctl]");
    if (wctl && window.nexusDesktop && window.nexusDesktop.window) {
      var action = wctl.getAttribute("data-wctl");
      if (typeof window.nexusDesktop.window[action] === "function") {
        window.nexusDesktop.window[action]();
      }
    }
  });

  window.__nx_goToStep = function (idx) {
    if (window.__nx_iv) clearInterval(window.__nx_iv);
    current = Math.max(0, Math.min(steps.length - 1, idx));
    update();
  };

  function update() {
    steps.forEach(function (id, i) {
      var el = document.getElementById('step-' + id);
      if (el) {
        if (i === current) {
          el.classList.add('active');
          el.style.display = 'flex';
        } else {
          el.classList.remove('active');
          el.style.display = 'none';
        }
      }
    });
    var liEls = document.querySelectorAll('.steps li');
    liEls.forEach(function (li, i) {
      if (i === current) {
        li.classList.add('active');
        li.classList.remove('done');
      } else if (i < current) {
        li.classList.remove('active');
        li.classList.add('done');
      } else {
        li.classList.remove('active');
        li.classList.remove('done');
      }
    });
    var btnNext = document.getElementById('btn-next');
    var btnBack = document.getElementById('btn-back');
    if (btnNext) {
      if (current === steps.length - 2) { btnNext.textContent = ${JSON.stringify(txtInstall)}; }
      else if (current === steps.length - 1) { btnNext.textContent = ${JSON.stringify(txtFinish)}; }
      else { btnNext.textContent = ${JSON.stringify(txtContinue)}; }
      btnNext.disabled = (current === 1 && !licenseAccepted);
    }
    if (btnBack) btnBack.style.visibility = current === 0 ? 'hidden' : 'visible';
    if (current === 3) {
      var fill = document.getElementById('install-progress');
      if (fill) fill.classList.add('running');
    }
  }

  window.__nx_licenseChanged = function (cb) {
    licenseAccepted = cb.checked;
    update();
  };

  window.__nx_browse = async function () {
    if (window.nexusDesktop && window.nexusDesktop.setup) {
      const res = await window.nexusDesktop.setup.browse();
      if (res && res.ok && res.path) {
        var el = document.getElementById('install-path');
        if(el) el.value = res.path;
      }
    }
  };

  document.getElementById('btn-next').addEventListener('click', async function () {
    if (current === steps.length - 2) { // Installing step
      var btnNext = document.getElementById('btn-next');
      var btnBack = document.getElementById('btn-back');
      if (btnNext) btnNext.disabled = true;
      if (btnBack) btnBack.disabled = true;

      var pathEl = document.getElementById('install-path');
      var pathVal = pathEl ? pathEl.value : "";
      
      if (window.nexusDesktop && window.nexusDesktop.setup) {
        const config = { path: pathVal };
        const res = await window.nexusDesktop.setup.complete(config);
        if (res && res.ok) {
           current++;
           update();
        } else {
           console.error("Setup failed:", res && res.error);
           var statusEl = document.getElementById('install-status');
           if (statusEl) statusEl.textContent = "Error: " + (res && res.error);
           if (btnNext) {
             btnNext.disabled = false;
             btnNext.textContent = "Retry";
           }
           if (btnBack) btnBack.disabled = false;
           var fill = document.getElementById('install-progress');
           if (fill) fill.classList.remove('running');
        }
      }
    } else if (current < steps.length - 1) { 
      current++; 
      update(); 
      if (current === steps.length - 2) {
        // Auto-trigger the setup complete when entering the installing step
        document.getElementById('btn-next').click();
      }
    } else {
      // Finish step clicked Next (Launch Now)
      // This is handled by main app URL load on success, but just in case:
      if (window.nexusDesktop && window.nexusDesktop.appUrl) {
         window.nexusDesktop.appUrl();
      }
    }
  });
  document.getElementById('btn-back').addEventListener('click', function () {
    if (current > 0) { current--; update(); }
  });
  document.getElementById('btn-cancel').addEventListener('click', async function () {
    if (window.nexusDesktop && window.nexusDesktop.setup) {
      await window.nexusDesktop.setup.cancel();
    }
  });

  update();
}());
`
  );
  const stepperItems = STEPS.map(
    (s, i) => `<li data-step="${escapeHtml(s.id)}"><span class="step-num">${i + 1}</span><span>${escapeHtml(stepLabels[i])}</span></li>`
  ).join("\n      ");
  const stepPanels = {
    welcome: stepWelcome(logoSvg),
    license: stepLicense(),
    location: stepLocation(os3),
    installing: stepInstalling(),
    finish: stepFinish()
  };
  const panels = STEPS.map(
    (s, i) => `<section class="step${s.id === "welcome" ? " active" : ""}" id="step-${escapeHtml(s.id)}" aria-label="${escapeHtml(stepLabels[i])} step">
${stepPanels[s.id]}
</section>`
  ).join("\n");
  return `<!doctype html>
<html lang="${CURRENT_LOCALE}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${label("setup.windowTitle")}</title>
<style>${renderSetupStyles(theme)}</style>
</head>
<body class="setup">
<div class="setup-window">
  <!-- Title bar -->
  <div class="titlebar">
    <span class="title">${label("setup.titlebarText")}</span>
    ${renderWindowControls(os3)}
  </div>
  <!-- Two-pane body -->
  <div class="setup-body">
    <!-- Left rail: stepper -->
    <aside class="setup-rail">
      <div class="setup-brand">${logoSvg}<span class="brand-name">NEXUS</span></div>
      <ol class="steps">
      ${stepperItems}
      </ol>
    </aside>
    <!-- Right: step content -->
    <div class="setup-main">
${panels}
      <!-- Footer -->
      <div class="setup-footer">
        <button class="btn btn-ghost" id="btn-cancel" type="button">${label("setup.cancel")}</button>
        <div class="footer-right">
          <button class="btn btn-ghost" id="btn-back" type="button" style="visibility:hidden">${label("setup.back")}</button>
          <button class="btn btn-primary" id="btn-next" type="button">${label("setup.continue")}</button>
        </div>
      </div>
    </div>
  </div>
</div>
<script>${setupScript}</script>
</body>
</html>`;
}

// ../desktop/src/index.ts
function renderSidebar(primary, nav, activeId) {
  const links = nav.map((s) => {
    const on = s.id === activeId;
    return `<a class="${on ? "active" : ""}" href="#${s.id}" data-nav="${s.id}"${on ? ' aria-current="page"' : ""}>${renderSideIcon(s.id)}<span>${escapeHtml(label(s.titleKey))}</span></a>`;
  }).join("");
  return `<aside class="sidebar"><div class="brandrow">${renderLogo(primary)}<span class="brand">NEXUS</span></div><nav class="side" aria-label="Primary">${links}</nav><div class="sidefoot">v3.14.2 \xB7 ${escapeHtml(label("plan.family"))}</div></aside>`;
}
function renderDesktopStyles(t2) {
  return `${renderStyles(t2)}
@keyframes win-open {
  from { opacity: 0; transform: scale(0.975) translateY(10px); }
  to   { opacity: 1; transform: none; }
}
@keyframes sidebar-pulse {
  0%,100% { box-shadow: inset 0 0 0 1px color-mix(in srgb,var(--primary) 28%,transparent); }
  50%      { box-shadow: inset 0 0 0 1px color-mix(in srgb,var(--primary) 52%,transparent),
                         0 0 14px color-mix(in srgb,var(--primary) 18%,transparent); }
}
@keyframes content-slide {
  from { opacity: 0; transform: translateX(14px); }
  to   { opacity: 1; transform: none; }
}
body.desktop { padding: ${t2.space[6]}px; background: #05060a; font-family: 'Space Grotesk', Inter, system-ui, sans-serif; }
.window {
  max-width: 1120px; margin: 0 auto; background: var(--bg);
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--surface)); border-radius: ${t2.radius.lg}px; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 1px 1px color-mix(in srgb, var(--primary) 20%, transparent);
  animation: win-open 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.titlebar {
  display: flex; align-items: center; gap: ${t2.space[4]}px;
  height: 44px; padding: 0 ${t2.space[4]}px; position: relative;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--primary)) 0%, var(--surface) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 0;
}
.titlebar::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, color-mix(in srgb,var(--primary) 60%,transparent) 30%, color-mix(in srgb,var(--primary) 60%,transparent) 70%, transparent 100%);
}
.wctl { display: flex; gap: ${t2.space[1]}px; }
.wctl-btn {
  width: 28px; height: 28px; border-radius: var(--radius);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--muted); transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  background: transparent; border: none; padding: 0; outline: none; cursor: default;
}
.gnome-btn {
  width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--surface) 75%, var(--text));
  color: var(--muted); display: inline-flex; align-items: center; justify-content: center;
  border: none; padding: 0; outline: none; cursor: default;
}
.gnome-btn:hover { background: color-mix(in srgb, var(--surface) 50%, var(--text)); color: var(--text); }
.gnome-btn.close:hover { background: #ef4444; color: #fff; box-shadow: 0 0 10px rgba(239,68,68,0.45); }
.wctl-btn:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); transform: translateY(-1px); }
.wctl-btn.close:hover { background: #ef4444; color: #fff; box-shadow: 0 0 12px rgba(239,68,68,0.5); transform: translateY(-1px); }
.titlebar .title { flex: 1; text-align: center; font-size: ${t2.font.size.sm}px; color: var(--muted); letter-spacing: 0.03em; font-weight: 600; }
.titlebar .title-actions { display: flex; align-items: center; gap: ${t2.space[3]}px; }
.title-lang { display: inline-flex; gap: 4px; font-size: ${t2.font.size.sm}px; }
.title-lang a { color: var(--muted); text-decoration: none; }
.title-lang a.active { color: var(--primary); font-weight: 700; }
.title-logout {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 28px; padding: 0 ${t2.space[3]}px; border-radius: var(--radius);
  border: 1px solid var(--border-strong); background: transparent; color: var(--muted);
  font-size: ${t2.font.size.sm}px; cursor: pointer; transition: border-color .18s ease, color .18s ease, background .18s ease;
}
.title-logout:hover { border-color: var(--primary); color: var(--primary); }
.titlebar .avatar-wrap { display: inline-flex; }
.app { display: flex; min-height: 620px; }
.sidebar {
  width: 248px; flex: none; background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--primary) 8%) 0%, var(--surface) 100%);
  backdrop-filter: blur(16px); padding: ${t2.space[5]}px;
  border-right: 1px solid color-mix(in srgb, var(--text) 8%, transparent); display: flex; flex-direction: column; gap: ${t2.space[5]}px;
}
.brandrow { display: flex; align-items: center; gap: ${t2.space[3]}px; }
nav.side { display: flex; flex-direction: column; gap: ${t2.space[1]}px; margin: 0; position: relative; }
.side-indicator {
  position: absolute; left: 0; width: 3px; border-radius: 0 3px 3px 0;
  background: var(--primary); pointer-events: none;
  transition: top 0.28s cubic-bezier(0.22,1,0.36,1), height 0.28s cubic-bezier(0.22,1,0.36,1);
}
nav.side a {
  display: flex; align-items: center; gap: ${t2.space[3]}px;
  padding: ${t2.space[3]}px ${t2.space[4]}px; border: 0; border-radius: var(--radius);
  background: transparent; color: var(--muted); font-size: ${t2.font.size.md}px; font-weight: 500;
  text-decoration: none; transition: background 0.2s ease, color 0.2s ease;
}
nav.side a .sideicon { flex: none; transition: transform 0.2s ease; }
nav.side a:hover { background: var(--bg); color: var(--text); }
nav.side a:hover .sideicon { transform: scale(1.12); }
nav.side a.active {
  background: var(--tint); color: var(--primary);
  animation: sidebar-pulse 3s ease infinite;
}
.sidefoot { margin-top: auto; color: var(--muted); font-size: ${t2.font.size.sm}px; }
.content { flex: 1; padding: ${t2.space[6]}px; overflow: auto; }
.content h2:first-child { margin-top: 0; }
html.js-tabs .content section[hidden] { display: none; }
.content section.content-enter { animation: content-slide 0.24s cubic-bezier(0.22,1,0.36,1) both; }
@media (prefers-reduced-motion: reduce) {
  .window { animation: none; }
  nav.side a.active { animation: none; }
  .side-indicator { transition: none; }
  nav.side a, nav.side a .sideicon, .wctl-btn, .title-logout { transition: none; }
  .content section.content-enter { animation: none; }
}
@media (max-width: 720px) {
  body.desktop { padding: 0; }
  .app { flex-direction: column; }
  .sidebar { width: auto; flex-direction: row; flex-wrap: wrap; }
  nav.side { flex-direction: row; flex-wrap: wrap; }
}`;
}
var DESKTOP_NAV_SCRIPT = `
document.addEventListener("click", function(e) {
  var wctl = e.target.closest("[data-wctl]");
  if (wctl && window.nexusDesktop && window.nexusDesktop.window) {
    var action = wctl.getAttribute("data-wctl");
    if (typeof window.nexusDesktop.window[action] === "function") {
      window.nexusDesktop.window[action]();
    }
  }
});
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll(".content > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("nav a[data-nav]"));
var indicator = null;
function positionIndicator() {
  var nav = document.querySelector("nav.side");
  if (!nav) return;
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "side-indicator";
    nav.appendChild(indicator);
  }
  var active = nav.querySelector("a.active");
  if (active) {
    var navRect = nav.getBoundingClientRect();
    var aRect = active.getBoundingClientRect();
    indicator.style.top = (aRect.top - navRect.top) + "px";
    indicator.style.height = aRect.height + "px";
  }
}
function show(id) {
  sections.forEach(function (s) {
    var becoming = s.id === id;
    if (becoming && s.hidden) {
      s.hidden = false;
      s.classList.remove("content-enter");
      void s.offsetWidth;
      s.classList.add("content-enter");
    } else if (!becoming) {
      s.hidden = true;
    }
  });
  links.forEach(function (a) {
    var on = a.getAttribute("data-nav") === id;
    a.classList.toggle("active", on);
    if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
  });
  positionIndicator();
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : sections[0].id);
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
fromHash();
`.trim();
function renderDesktopDocument(options = {}) {
  const themeName = options.theme ?? "dark";
  const os3 = options.os ?? "windows";
  const userAgent = options.userAgent ?? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
  const theme = getTheme(themeName);
  if (options.locale) setLocale(options.locale);
  const authed = options.authenticated ?? false;
  const screens = options.screens ?? buildDemoScreens();
  const sections = screens.nav.map(
    (s) => `<section id="${s.id}">${renderScreenBody(s.id, screens, userAgent, "desktop")}</section>`
  ).join("\n");
  const locale = options.locale ?? CURRENT_LOCALE;
  const titleText = `NEXUS \u2014 ${label("desktop.title")}`;
  const nameForInitial = options.displayName || screens.personalization.userAddress || "N";
  const initial = escapeHtml(nameForInitial.trim().charAt(0).toUpperCase() || "N");
  const titleRight = authed ? `<div class="title-actions"><span class="title-lang"><select class="lang-dropdown" onchange="location.href='?lang='+this.value" aria-label="Language">${SUPPORTED_LOCALES.map((l) => `<option value="${l}"${l === locale ? " selected" : ""}>${l.toUpperCase()}</option>`).join("")}</select></span><div class="avatar-wrap">${renderAvatar(void 0, initial)}</div><button type="button" class="title-logout" id="desk-logout"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>${escapeHtml(label("auth.logout"))}</span></button></div>` : `<div class="wctl" style="width:68px"></div>`;
  const pwaHead = authed ? `
<link rel="manifest" href="/manifest.webmanifest" />` : "";
  const authScript = authed ? `
<script>
if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){});}
var _dl=document.getElementById("desk-logout");if(_dl){_dl.addEventListener("click",function(){fetch("/api/logout",{method:"POST"}).then(function(){location.href="/login";});});}
</script>` : "";
  return `<!doctype html>
<html lang="${locale}" data-theme="${escapeHtml(themeName)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="${theme.color.bg}" />${pwaHead}
<title>NEXUS Desktop</title>
<style>${renderDesktopStyles(theme)}</style>
</head>
<body class="desktop">
<div class="window">
  <div class="titlebar">
    ${renderWindowControls(os3)}
    <div class="title">${titleText}</div>
    ${titleRight}
  </div>
<div class="app">
${renderSidebar(theme.color.primary, screens.nav, screens.nav[0]?.id ?? "today")}
<main class="content" id="main">
${sections}
</main>
</div>
</div>
<script>${DESKTOP_NAV_SCRIPT}</script>${authScript}
</body>
</html>`;
}

// ../skills/src/discovery.ts
var SkillDiscoveryService = class {
  /**
   * Returns a list of skills that the user can discover and enable.
   * Since there are no real third-party integrations (like Spotify),
   * only local and realistically implementable skills are returned.
   */
  getDiscoverableSkills() {
    return [
      {
        id: "skill_security",
        nameKey: "skill.security.name",
        descriptionKey: "skill.security.desc",
        icon: "shield",
        tags: ["security", "local"]
      },
      {
        id: "skill_energy",
        nameKey: "skill.energy.name",
        descriptionKey: "skill.energy.desc",
        icon: "leaf",
        tags: ["energy", "automation"]
      },
      {
        id: "skill_movie",
        nameKey: "skill.movie.name",
        descriptionKey: "skill.movie.desc",
        icon: "film",
        tags: ["entertainment", "lighting"]
      },
      {
        id: "skill_morning",
        nameKey: "skill.morning.name",
        descriptionKey: "skill.morning.desc",
        icon: "sun",
        tags: ["routine", "morning"]
      }
    ];
  }
};

// ../skills/src/skill-store.ts
var nextId = 1;
function generateId() {
  return `skill_${Date.now()}_${nextId++}`;
}
var SkillStore = class {
  skills = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  // ── Query ─────────────────────────────────────────────────────────────────
  /** Get a skill by ID. */
  get(id) {
    return this.skills.get(id);
  }
  /** List all skills, optionally filtered by status. */
  list(status) {
    const all = [...this.skills.values()];
    return status ? all.filter((s) => s.status === status) : all;
  }
  /** Find active skills whose trigger matches the given intent + slots. */
  findMatching(intentName, slots = {}) {
    return this.list("active").filter((skill) => {
      if (!matchesPattern(skill.trigger.intentPattern, intentName)) return false;
      return matchesSlots(skill.trigger.slots, slots);
    });
  }
  /** Total number of stored skills. */
  get size() {
    return this.skills.size;
  }
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  /** Propose a new skill (status = "proposed"). */
  propose(input) {
    const skill = {
      id: generateId(),
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      actions: input.actions,
      status: "proposed",
      proposalCount: 1,
      activationCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: input.source ?? "learned"
    };
    this.skills.set(skill.id, skill);
    this.emit({ type: "proposed", skill });
    return skill;
  }
  /** Create a skill directly as active (for manual/user-created skills). */
  create(input) {
    const skill = {
      id: generateId(),
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      actions: input.actions,
      status: "active",
      proposalCount: 0,
      activationCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: input.source ?? "manual"
    };
    this.skills.set(skill.id, skill);
    this.emit({ type: "accepted", skill });
    return skill;
  }
  /** Accept a proposed skill → active. */
  accept(id) {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "proposed") return false;
    skill.status = "active";
    this.emit({ type: "accepted", skill });
    return true;
  }
  /** Reject a proposed skill. */
  reject(id) {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "proposed") return false;
    skill.status = "rejected";
    this.emit({ type: "rejected", skillId: id });
    return true;
  }
  /** Pause an active skill (stops auto-apply without deleting). */
  pause(id) {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "active") return false;
    skill.status = "paused";
    this.emit({ type: "paused", skillId: id });
    return true;
  }
  /** Resume a paused skill. */
  resume(id) {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "paused") return false;
    skill.status = "active";
    this.emit({ type: "resumed", skillId: id });
    return true;
  }
  /** Delete a skill permanently. */
  delete(id) {
    if (!this.skills.has(id)) return false;
    this.skills.delete(id);
    this.emit({ type: "deleted", skillId: id });
    return true;
  }
  /** Record that a skill was auto-applied. */
  recordActivation(id) {
    const skill = this.skills.get(id);
    if (!skill || skill.status !== "active") return false;
    skill.activationCount += 1;
    skill.lastActivatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emit({ type: "activated", skill });
    return true;
  }
  /** Increment proposal count (when re-proposing an already-proposed skill). */
  incrementProposal(id) {
    const skill = this.skills.get(id);
    if (skill) skill.proposalCount += 1;
  }
  // ── Events ────────────────────────────────────────────────────────────────
  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
};
function matchesPattern(pattern, intentName) {
  if (pattern.endsWith("*")) {
    return intentName.startsWith(pattern.slice(0, -1));
  }
  return pattern === intentName;
}
function matchesSlots(required, actual) {
  for (const [key, value] of Object.entries(required)) {
    if (actual[key] !== value) return false;
  }
  return true;
}

// ../skills/src/learning-engine.ts
var SkillLearningEngine = class {
  patterns = /* @__PURE__ */ new Map();
  threshold;
  maxPatterns;
  store;
  constructor(store2, options = {}) {
    this.store = store2;
    this.threshold = Math.max(2, options.threshold ?? 3);
    this.maxPatterns = options.maxPatterns ?? 100;
  }
  /**
   * Record an interaction. If it has follow-up actions, the engine tracks
   * the (intent → follow-up) pattern. Returns a proposed Skill if threshold is met.
   */
  observe(interaction) {
    if (!interaction.followUpActions || interaction.followUpActions.length === 0) {
      return void 0;
    }
    const signature = this.computeSignature(interaction);
    let pattern = this.patterns.get(signature);
    if (!pattern) {
      if (this.patterns.size >= this.maxPatterns) {
        this.evictLowest();
      }
      pattern = {
        signature,
        baseIntent: interaction.intentName,
        baseSlots: { ...interaction.slots },
        followUpActions: interaction.followUpActions,
        count: 0
      };
      this.patterns.set(signature, pattern);
    }
    pattern.count += 1;
    if (pattern.count >= this.threshold && !pattern.proposedSkillId) {
      return this.proposeSkill(pattern);
    }
    if (pattern.proposedSkillId) {
      const existing = this.store.get(pattern.proposedSkillId);
      if (existing && existing.status === "rejected" && pattern.count >= this.threshold * 2) {
        this.store.incrementProposal(pattern.proposedSkillId);
        return existing;
      }
    }
    return void 0;
  }
  /** Get current pattern stats (for debugging/UI). */
  getPatterns() {
    return [...this.patterns.values()].map((p) => ({
      signature: p.signature,
      count: p.count,
      threshold: this.threshold
    }));
  }
  /** Clear all observed patterns. */
  reset() {
    this.patterns.clear();
  }
  /** Number of tracked patterns. */
  get patternCount() {
    return this.patterns.size;
  }
  // ── Internal ────────────────────────────────────────────────────────────────
  computeSignature(interaction) {
    const slotPart = Object.keys(interaction.slots).sort().map((k) => `${k}=${JSON.stringify(interaction.slots[k])}`).join(",");
    const actionPart = interaction.followUpActions.map((a) => {
      const params = Object.keys(a.params).sort().map((k) => `${k}=${JSON.stringify(a.params[k])}`).join(",");
      return params ? `${a.kind}(${params})` : a.kind;
    }).join("+");
    return `${interaction.intentName}[${slotPart}]\u2192${actionPart}`;
  }
  proposeSkill(pattern) {
    const input = {
      name: this.generateName(pattern),
      description: this.generateDescription(pattern),
      trigger: {
        intentPattern: pattern.baseIntent,
        slots: pattern.baseSlots
      },
      actions: pattern.followUpActions.map((a) => ({
        kind: a.kind,
        params: { ...a.params }
      })),
      source: "learned"
    };
    const skill = this.store.propose(input);
    pattern.proposedSkillId = skill.id;
    return skill;
  }
  generateName(pattern) {
    const actions = pattern.followUpActions.map((a) => a.kind.split(".").pop() ?? a.kind).join(" + ");
    return `Auto: ${pattern.baseIntent} \u2192 ${actions}`;
  }
  generateDescription(pattern) {
    const times = pattern.count;
    return `Detected ${times} times: after "${pattern.baseIntent}", you always ${pattern.followUpActions.map((a) => a.kind).join(", ")}. This skill will auto-apply those adjustments.`;
  }
  evictLowest() {
    let lowestKey;
    let lowestCount = Infinity;
    for (const [key, p] of this.patterns) {
      if (p.count < lowestCount) {
        lowestCount = p.count;
        lowestKey = key;
      }
    }
    if (lowestKey) this.patterns.delete(lowestKey);
  }
};
var SkillExecutor = class {
  store;
  constructor(store2) {
    this.store = store2;
  }
  /**
   * Given an intent + slots, find all matching active skills and return
   * the combined actions to auto-apply. Records activation for each.
   */
  execute(intentName, slots = {}) {
    const matching = this.store.findMatching(intentName, slots);
    if (matching.length === 0) {
      return { applied: false, skills: [], actions: [] };
    }
    const allActions = [];
    const appliedSkills = [];
    for (const skill of matching) {
      this.store.recordActivation(skill.id);
      allActions.push(...skill.actions);
      appliedSkills.push(skill);
    }
    return {
      applied: true,
      skills: appliedSkills,
      actions: allActions
    };
  }
  /**
   * Preview which skills would fire for a given intent (without activating).
   */
  preview(intentName, slots = {}) {
    return this.store.findMatching(intentName, slots);
  }
};
var SkillConsentManager = class {
  store;
  constructor(store2) {
    this.store = store2;
  }
  /** Get all skills pending user decision. */
  getPendingProposals() {
    return this.store.list("proposed");
  }
  /** User accepts a proposed skill → it becomes active. */
  accept(skillId) {
    return this.store.accept(skillId);
  }
  /** User rejects a proposed skill. */
  reject(skillId) {
    return this.store.reject(skillId);
  }
  /** User dismisses all pending proposals. */
  dismissAll() {
    const pending = this.store.list("proposed");
    let count = 0;
    for (const skill of pending) {
      if (this.store.reject(skill.id)) count++;
    }
    return count;
  }
  /** Check if there are any pending proposals. */
  get hasPending() {
    return this.store.list("proposed").length > 0;
  }
  /** Number of pending proposals. */
  get pendingCount() {
    return this.store.list("proposed").length;
  }
};

// src/pages.ts
var skillDiscovery = new SkillDiscoveryService();
function extraCss() {
  return `
.auth-body { min-height: 100vh; display: grid; place-items: center; padding: 24px;
  background: radial-gradient(80% 80% at 50% -10%, var(--tint), transparent 60%), var(--bg); }
.auth-card { width: 100%; max-width: 400px; background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
  padding: 32px; box-shadow: var(--elev); }
.auth-brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px; }
.auth-brand svg { width: 38px; height: 38px; }
.auth-brand .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; }
.auth-card h1 { font-size: 22px; margin: 16px 0 4px; letter-spacing: -0.02em; text-align: center; }
.auth-card .lede { color: var(--muted); font-size: 13px; margin: 0 0 24px; text-align: center; }
.auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.auth-field label { font-size: 12px; font-weight: 600; color: var(--muted); }
.auth-field input { background: var(--bg); border: 1px solid var(--border-strong);
  border-radius: var(--radius); padding: 12px 14px; color: var(--text); font-size: 14px;
  outline: none; transition: border-color .15s, box-shadow .15s; }
.auth-field input:focus { border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
.auth-hint { color: var(--muted); font-size: 11px; margin-top: 2px; }
.auth-submit { width: 100%; justify-content: center; padding: 12px; font-size: 14px;
  font-weight: 600; margin-top: 4px; }
.auth-error { display: none; background: color-mix(in srgb, #ef4444 14%, var(--surface));
  border: 1px solid color-mix(in srgb, #ef4444 40%, transparent); color: #fca5a5;
  border-radius: var(--radius); padding: 10px 14px; font-size: 12px; margin-bottom: 16px; }
.auth-error.show { display: block; }
.auth-toggle { display: block; text-align: center; margin-top: 20px; font-size: 13px;
  color: var(--primary); background: none; border: none; cursor: pointer; width: 100%; }
.auth-toggle:hover { text-decoration: underline; }
.auth-lang { text-align: center; margin-top: 16px; font-size: 12px; }
.auth-lang a { color: var(--muted); text-decoration: none; }
.auth-lang a.active { color: var(--primary); font-weight: 700; }
/* Social / federated sign-in buttons + "or" divider */
.oauth-list { display: grid; gap: 10px; margin: 4px 0 0; }
.oauth-btn { display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 11px 14px; border-radius: var(--radius);
  border: 1px solid var(--border-strong); background: var(--bg); color: var(--text);
  font-size: 14px; font-weight: 600; text-decoration: none;
  transition: border-color .15s, background .15s, transform .05s; }
.oauth-btn:hover { border-color: var(--primary); background: var(--surface); }
.oauth-btn:active { transform: translateY(1px); }
.oauth-btn .oauth-ic { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
.oauth-btn.oauth-apple .oauth-ic { color: var(--text); }
.auth-divider { display: flex; align-items: center; gap: 12px; color: var(--muted);
  font-size: 12px; margin: 18px 0; }
.auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
/* Guest / anonymous access \u2014 a low-commitment way to explore the product */
.auth-guest { margin-top: 12px; }
.auth-guest-hint { text-align: center; color: var(--muted); font-size: 11px; margin: 8px 0 0; }

.app-topbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center;
  gap: 16px; padding: 12px 24px; background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent); }
.app-topbar .brand-group { display: flex; align-items: center; gap: 12px; }
.app-topbar .brand { font-weight: 800; font-size: 18px; letter-spacing: 0.05em; }
.app-topbar .spacer { flex: 1; }
.app-user { display: flex; align-items: center; gap: 10px; }
.app-user .who { font-size: 13px; font-weight: 600; }
.app-lang { display: inline-flex; gap: 4px; font-size: 12px; margin-right: 4px; }
.app-lang a { color: var(--muted); text-decoration: none; }
.app-lang a.active { color: var(--primary); font-weight: 700; }
.auth-lang .lang-dropdown, .app-lang .lang-dropdown {
  appearance: none; -webkit-appearance: none; background: transparent; border: none;
  color: var(--text); font-size: 12px; font-weight: 600; cursor: pointer;
  padding: 2px 18px 2px 4px; outline: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 5 5-5' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 2px center; background-size: 10px 6px;
}
.auth-lang .lang-dropdown option, .app-lang .lang-dropdown option { background: var(--surface); color: var(--text); }
.app-logout { font-size: 12px; padding: 8px 14px; border-radius: 999px;
  border: 1px solid var(--border-strong); background: transparent; color: var(--text);
  cursor: pointer; transition: all .15s ease; }
.app-logout:hover { border-color: var(--primary); color: var(--primary); }
@media (max-width: 600px) { .app-user .who { display: none; } .app-topbar { padding: 10px 14px; } }
`.trim();
}
function buildUserScreens(account, data) {
  const ctx = { authenticated: true, plan: data.plan, role: account.role };
  const devicesOnline = data.devices.filter((d) => d.online).length;
  const screens = {
    nav: buildNavigation(ctx),
    today: buildTodayModel({
      devicesOnline,
      devicesTotal: data.devices.length,
      energyWhToday: data.energyWhToday,
      activeRoutines: data.routines.length,
      pendingSuggestions: data.suggestions.length
    }),
    home: buildHomeStateModel(data.devices.map((d) => ({ room: d.room, online: d.online }))),
    devices: buildDeviceListModel(
      data.devices.map((d) => ({ id: d.id, nameKey: d.name, online: d.online }))
    ),
    releases: demoReleases(),
    suggestions: buildSuggestionsModel(
      data.suggestions.map((s) => ({ id: s.id, textKey: s.text, at: s.at }))
    ),
    skills: buildSkillsModel(
      data.routines.map((r) => ({ id: r.id, nameKey: r.name, usageCount: r.usageCount })),
      skillDiscovery.getDiscoverableSkills()
    ),
    family: buildFamilyModel(data.family.map((m) => ({ id: m.id, nameKey: m.name, role: m.role }))),
    agents: buildAgentsModel([]),
    billing: buildBillingModel(data.plan),
    personalization: buildPersonalizationModel({
      assistantName: data.assistantName,
      userAddress: data.displayName,
      language: data.language
    }),
    platform: buildPlatformModel(),
    adminDashboard: buildAdminDashboardModel()
  };
  return { screens, nav: screens.nav };
}
var APP_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("nav a[data-nav]"));
function show(id) {
  sections.forEach(function (s) { s.hidden = s.id !== id; });
  links.forEach(function (a) {
    var on = a.getAttribute("data-nav") === id;
    a.classList.toggle("active", on);
    if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
  });
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : (sections[0] && sections[0].id));
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
fromHash();
var out = document.getElementById("app-logout");
if (out) { out.addEventListener("click", function () {
  fetch("/api/logout", { method: "POST" }).then(function () { location.href = "/login"; });
}); }
window.nexusCommand = function(utterance, confirm) {
  var url = confirm ? "/api/command/confirm" : "/api/command";
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ utterance: utterance })
  }).then(function(r) { return r.json(); });
};
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(function(){}); }
document.body.addEventListener("click", function(e) {
  var btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.closest(".mockup-content") || btn.closest(".hero-mockup")) return;
  var action = btn.getAttribute("data-action");
  var id = btn.getAttribute("data-id");
  if (action === "accept-suggestion") {
    fetch("/api/suggestions/" + encodeURIComponent(id) + "/accept", { method: "POST" }).then(function() { location.reload(); });
  } else if (action === "dismiss-suggestion") {
    fetch("/api/suggestions/" + encodeURIComponent(id) + "/dismiss", { method: "POST" }).then(function() { location.reload(); });
  } else if (action === "billing-subscribe") {
    var plan = btn.getAttribute("data-plan") || "premium";
    fetch("/api/billing/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan }) }).then(function() { location.reload(); });
  } else if (action === "billing-cancel") {
    fetch("/api/billing/cancel", { method: "POST" }).then(function() { location.reload(); });
  }
});
`.trim();
function providerIcon(id) {
  if (id === "google") {
    return `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;
  }
  return `<svg width="16" height="18" viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true"><path d="M13.09 9.54c-.02-1.9 1.55-2.81 1.62-2.86-.88-1.29-2.26-1.47-2.75-1.49-1.17-.12-2.28.69-2.87.69-.59 0-1.5-.67-2.47-.65-1.27.02-2.44.74-3.09 1.87-1.32 2.29-.34 5.68.95 7.54.63.9 1.38 1.92 2.36 1.88.95-.04 1.31-.61 2.45-.61s1.47.61 2.47.59c1.02-.02 1.66-.92 2.28-1.83.72-1.05 1.02-2.07 1.03-2.12-.02-.01-1.97-.76-1.99-3.01zM11.2 3.9c.52-.64.88-1.51.78-2.4-.75.03-1.67.5-2.21 1.13-.48.56-.91 1.46-.79 2.32.84.07 1.69-.42 2.22-1.05z"/></svg>`;
}
function renderSocialAuth(providers) {
  if (!providers || providers.length === 0) return "";
  const buttons = providers.map(
    (p) => `<a class="oauth-btn oauth-${escapeHtml(p.id)}" href="/api/oauth/${escapeHtml(p.id)}/start"><span class="oauth-ic">${providerIcon(p.id)}</span><span>${escapeHtml(label(p.labelKey))}</span></a>`
  ).join("");
  return `<div class="oauth-list">${buttons}</div><div class="auth-divider"><span>${escapeHtml(label("auth.social.divider"))}</span></div>`;
}
function renderLoginDocument(locale, opts = {}) {
  setLocale(locale);
  const theme = opts.theme ?? "dark";
  const t2 = getTheme(theme);
  const authLangOptions = SUPPORTED_LOCALES.map(
    (l) => `<option value="${l}"${l === locale ? " selected" : ""}>${l.toUpperCase()}</option>`
  ).join("");
  const notice = opts.notice ? `<div class="auth-error show">${escapeHtml(label(opts.notice === "unavailable" ? "auth.social.unavailable" : "auth.social.error"))}</div>` : "";
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label("auth.signInTitle"))} \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t2.color.primary)}" />
<style>${renderStyles(t2)}${extraCss()}</style>
</head>
<body class="auth-body">
<main class="auth-card">
    <a href="/" class="auth-brand" style="text-decoration:none;">${renderLogo()}<span class="brand">NEXUS</span></a>
<h1 id="auth-title">${escapeHtml(label("auth.signInTitle"))}</h1>
<p class="lede">${escapeHtml(label("auth.tagline"))}</p>
${notice}
${renderSocialAuth(opts.providers)}
<div class="auth-error" id="auth-error" role="alert"></div>
<form id="auth-form" autocomplete="on">
<div class="auth-field">
<label for="email">${escapeHtml(label("auth.email"))}</label>
<input id="email" name="email" type="email" required autocomplete="email" />
</div>
<div class="auth-field">
<label for="password">${escapeHtml(label("auth.password"))}</label>
<input id="password" name="password" type="password" required autocomplete="current-password" minlength="8" />
<span class="auth-hint" id="pw-hint" hidden>${escapeHtml(label("auth.passwordHint"))}</span>
</div>
<button type="submit" class="btn primary auth-submit" id="auth-submit">${escapeHtml(label("auth.signInButton"))}</button>
</form>
<button type="button" class="oauth-btn auth-guest" id="auth-guest"><span>${escapeHtml(label("auth.guest"))}</span></button>
<p class="auth-guest-hint">${escapeHtml(label("auth.guestHint"))}</p>
<button type="button" class="auth-toggle" id="auth-toggle">${escapeHtml(label("auth.switchToSignUp"))}</button>
<p class="auth-lang"><select class="lang-dropdown" onchange="location.href='?lang='+this.value" aria-label="Language">${authLangOptions}</select></p>
</main>
<script>${loginScript(label("auth.signInTitle"), label("auth.signUpTitle"), label("auth.signInButton"), label("auth.signUpButton"), label("auth.switchToSignUp"), label("auth.switchToSignIn"), label("auth.genericError"))}</script>
</body>
</html>`;
}
function loginScript(signInTitle, signUpTitle, signInBtn, signUpBtn, toSignUp, toSignIn, genericError) {
  const j = (s) => JSON.stringify(s);
  return `
(function () {
  var mode = "signin";
  var form = document.getElementById("auth-form");
  var title = document.getElementById("auth-title");
  var submit = document.getElementById("auth-submit");
  var toggle = document.getElementById("auth-toggle");
  var errorBox = document.getElementById("auth-error");
  var pwHint = document.getElementById("pw-hint");
  var pw = document.getElementById("password");
  function apply() {
    var signup = mode === "signup";
    title.textContent = signup ? ${j(signUpTitle)} : ${j(signInTitle)};
    submit.textContent = signup ? ${j(signUpBtn)} : ${j(signInBtn)};
    toggle.textContent = signup ? ${j(toSignIn)} : ${j(toSignUp)};
    pw.setAttribute("autocomplete", signup ? "new-password" : "current-password");
    if (pwHint) pwHint.hidden = !signup;
    errorBox.classList.remove("show");
  }
  toggle.addEventListener("click", function () { mode = mode === "signin" ? "signup" : "signin"; apply(); });
  var guest = document.getElementById("auth-guest");
  if (guest) guest.addEventListener("click", function () {
    errorBox.classList.remove("show");
    guest.disabled = true;
    fetch("/api/guest", { method: "POST" }).then(function (r) {
      if (r.ok) { location.href = "/app"; return; }
      guest.disabled = false;
      errorBox.textContent = ${j(genericError)};
      errorBox.classList.add("show");
    }).catch(function () {
      guest.disabled = false;
      errorBox.textContent = ${j(genericError)};
      errorBox.classList.add("show");
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.classList.remove("show");
    submit.disabled = true;
    var body = JSON.stringify({ email: form.email.value, password: form.password.value });
    fetch(mode === "signup" ? "/api/register" : "/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: body,
    }).then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    }).then(function (res) {
      if (res.ok) { location.href = "/app"; return; }
      errorBox.textContent = (res.data && res.data.error) || ${j(genericError)};
      errorBox.classList.add("show");
      submit.disabled = false;
    }).catch(function () {
      errorBox.textContent = ${j(genericError)};
      errorBox.classList.add("show");
      submit.disabled = false;
    });
  });
  apply();
})();
`.trim();
}
function renderAppDocument(account, data, userAgent, theme = "dark") {
  const locale = data.language;
  setLocale(locale);
  const t2 = getTheme(theme);
  const { screens, nav } = buildUserScreens(account, data);
  const first = nav[0]?.id ?? "today";
  const sections = nav.map((s) => {
    const body = renderScreenBody(s.id, screens, userAgent, "web");
    return `<section id="${s.id}"${s.id === first ? "" : " hidden"}>${body}</section>`;
  }).join("");
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label("screen.today"))} \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t2.color.primary)}" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="${t2.color.bg}" />
<style>${renderStyles(t2)}${extraCss()}</style>
</head>
<body>
<header class="app-topbar">
<a href="/" class="brand-group" style="text-decoration:none;">${renderLogo()}<span class="brand">NEXUS</span></a>
<div class="spacer"></div>
<span class="app-lang"><select class="lang-dropdown" onchange="location.href='?lang='+this.value" aria-label="Language">${SUPPORTED_LOCALES.map((l) => `<option value="${l}"${l === locale ? " selected" : ""}>${l.toUpperCase()}</option>`).join("")}</select></span>
<div class="app-user">${renderAvatar(void 0, data.displayName)}<span class="who">${escapeHtml(data.displayName)}</span></div>
<button class="app-logout" id="app-logout">${escapeHtml(label("auth.logout"))}</button>
</header>
<div class="wrap">
${renderNav(nav, first)}
<main id="main">${sections}</main>
</div>
${renderRichFooter(t2.color.primary)}
<script>${APP_SCRIPT}</script>
</body>
</html>`;
}
function renderMobileAppDocument(account, data, theme = "dark") {
  setLocale(data.language);
  const { screens } = buildUserScreens(account, data);
  return renderMobileDocument({
    theme,
    screens,
    displayName: data.displayName,
    locale: data.language,
    authenticated: true
  });
}
function renderDesktopAppDocument(account, data, theme = "dark") {
  setLocale(data.language);
  const { screens } = buildUserScreens(account, data);
  return renderDesktopDocument({
    theme,
    screens,
    displayName: data.displayName,
    locale: data.language,
    authenticated: true
  });
}
function marketingCss() {
  return `
html { scroll-behavior: smooth; }
.mkt { max-width: 1140px; margin: 0 auto; padding: 0 24px 24px; position: relative; z-index: 1; }
.mkt-anchor, #desktop, #mobile, #faq { scroll-margin-top: 84px; }

/* \u2500\u2500 Rich background mesh \u2500\u2500 */
body {
  background-color: var(--bg);
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--primary) 24%, transparent), transparent),
    radial-gradient(ellipse 60% 45% at 85% 75%, color-mix(in srgb, var(--primary) 14%, transparent), transparent),
    radial-gradient(ellipse 50% 35% at 10% 65%, color-mix(in srgb, var(--primary) 10%, transparent), transparent),
    radial-gradient(circle 300px at 50% 50%, color-mix(in srgb, var(--accent, var(--primary)) 5%, transparent), transparent);
  background-attachment: fixed;
}
/* \u2500\u2500 Section background accents \u2500\u2500 */
.mkt-anchor { position: relative; }
.mkt-anchor::before {
  content: ''; position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 700px; height: 450px; border-radius: 50%; pointer-events: none; z-index: -1;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 70%);
}
#features::before { top: -80px; width: 900px; height: 550px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 70%); }
#pricing::before { width: 800px; height: 500px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 70%); }
.mkt-testimonials::before { content: ''; position: absolute; top: -40px; left: 50%; transform: translateX(-50%); width: 600px; height: 400px; border-radius: 50%; pointer-events: none; z-index: -1; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--accent, var(--primary)) 10%, transparent) 0%, transparent 70%); }
.mkt-testimonials { position: relative; }
#mobile::before { width: 700px; height: 450px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%); }
#desktop::before { width: 800px; height: 500px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%); }

/* \u2500\u2500 Theme toggle \u2500\u2500 */
.theme-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  color: var(--muted); cursor: pointer; transition: all 0.2s ease;
  backdrop-filter: blur(8px); flex: none;
}
.theme-toggle:hover { color: var(--primary); border-color: var(--primary); background: var(--tint); }
.theme-toggle .icon-moon { display: none; }
.theme-toggle .icon-sun  { display: block; }
[data-theme="light"] .theme-toggle .icon-moon { display: block; }
[data-theme="light"] .theme-toggle .icon-sun  { display: none; }

/* \u2500\u2500 Hero \u2500\u2500 */
.hero { position: relative; overflow: hidden; padding: 72px 0 48px; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); margin-bottom: 40px; }
.hero-inner { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 56px; align-items: center; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  font-weight: 700; color: var(--primary); background: color-mix(in srgb, var(--primary) 12%, transparent);
  padding: 8px 16px; border-radius: 999px; margin-bottom: 28px; letter-spacing: 0.04em;
  box-shadow: 0 0 24px color-mix(in srgb, var(--primary) 30%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent); }
.hero-badge .plat-ic { display: inline-flex; gap: 6px; margin-left: 4px; }
.hero-badge .plat-ic svg { opacity: 0.85; }
.hero h1 { color: var(--text); font-size: 52px; line-height: 1.06; letter-spacing: -0.035em; margin: 0 0 22px; font-weight: 800; }
.hero .lede { color: var(--muted); font-size: 18px; line-height: 1.7; max-width: 48ch; margin: 0 0 32px; }
.hero .btn.primary { color: var(--on-primary); background: var(--gradient); box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 45%, transparent); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease; font-size: 14px; padding: 12px 24px; }
.hero .btn.primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 36px color-mix(in srgb, var(--primary) 60%, transparent); }
.hero .actions { display: flex; gap: 10px; flex-wrap: wrap; }
.hero .actions .btn.primary { flex: none; }
.hero .trust { color: var(--muted); font-size: 12px; margin-top: 16px; }
@media (prefers-reduced-motion: no-preference) {
  .hero .btn.primary { animation: nxPulseRing 2.8s ease-in-out infinite; }
}
@keyframes nxPulseRing {
  0%, 100% { box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent), 0 0 0 0 color-mix(in srgb, var(--primary) 30%, transparent); }
  50% { box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 0 8px color-mix(in srgb, var(--primary) 0%, transparent); }
}
/* Scroll indicator */
.scroll-hint { margin-top: 28px; display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; }
.scroll-hint .mouse { width: 20px; height: 32px; border: 2px solid color-mix(in srgb, var(--muted) 60%, transparent); border-radius: 12px; position: relative; }
.scroll-hint .mouse::after { content: ""; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 4px; height: 8px; border-radius: 999px; background: var(--muted); animation: nxScrollDot 1.6s ease-in-out infinite; }
@keyframes nxScrollDot { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, 10px); } }

/* Hero mockup */
.hero-mockup { position: relative; }
.hero-mockup .mockup-frame {
  border: 1px solid color-mix(in srgb, var(--border-strong) 30%, transparent);
  border-radius: 16px; overflow: hidden;
  background: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
  box-shadow:
    0 2px 4px rgba(0,0,0,0.08),
    0 8px 24px rgba(0,0,0,0.12),
    0 32px 80px color-mix(in srgb, var(--primary) 12%, transparent),
    0 0 0 1px rgba(255,255,255,0.06) inset,
    0 1px 0 rgba(255,255,255,0.1) inset;
  transition: box-shadow 0.4s ease;
}
.hero-mockup .mockup-frame:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.14), 0 48px 96px color-mix(in srgb, var(--primary) 16%, transparent), 0 0 0 1px rgba(255,255,255,0.06) inset; }
.mockup-bar { display: flex; align-items: center; gap: 7px; padding: 14px 18px;
  background: color-mix(in srgb, var(--bg) 70%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); }
.mockup-bar .wctl { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.mockup-bar .wctl-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: var(--muted); }
.mockup-bar .wctl-icon:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); }
.mockup-bar .wctl-icon.close:hover { background: #ef4444; color: #fff; }
.mockup-bar .murl { flex: 1; text-align: center; font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 0.03em; }
.mockup-body { padding: 0; max-height: 380px; overflow: hidden; }
/* Mockup panel switching */
.mockup-panel { display: none; animation: mockupFadeIn 0.25s ease; }
.mockup-panel.active { display: block; }
.phone-panel { display: none; animation: mockupFadeIn 0.25s ease; }
.phone-panel.active { display: flex; flex-direction: column; gap: 10px; }
@keyframes mockupFadeIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
/* Mockup mini-screens */
.mock-room-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mock-room { background: color-mix(in srgb, var(--surface) 70%, transparent); border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: 12px; padding: 14px; }
.mock-room .room-name { font-size: 11px; font-weight: 700; color: var(--text); }
.mock-room .room-count { font-size: 10px; color: var(--muted); margin-top: 4px; }
.mock-device-list { display: flex; flex-direction: column; gap: 8px; }
.mock-device { display: flex; align-items: center; gap: 10px; background: color-mix(in srgb, var(--surface) 70%, transparent); border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: 10px; padding: 12px; }
.mock-device .dev-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--tint); display: flex; align-items: center; justify-content: center; color: var(--primary); }
.mock-device .dev-info { flex: 1; }
.mock-device .dev-name { font-size: 11px; font-weight: 600; color: var(--text); }
.mock-device .dev-room { font-size: 9px; color: var(--muted); }
.mock-device .dev-status { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
@media (prefers-reduced-motion: no-preference) {
  .hero-mockup { animation: nxFloat 6s ease-in-out infinite; }
  @keyframes nxFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
}
@media (max-width: 860px) { .hero-inner { grid-template-columns: 1fr; } .hero-mockup { display: none; } }

/* \u2500\u2500 Stats strip \u2500\u2500 */
.mkt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
  margin: 20px 0; padding: 36px; border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.05); }
.mkt-stats .stat { text-align: center; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.mkt-stats .stat:hover { transform: translateY(-5px) scale(1.03); }
.mkt-stats .stat-num { display: block; font-size: 34px; font-weight: 800; letter-spacing: -0.02em; color: var(--primary); }
.mkt-stats .stat-label { display: block; color: var(--muted); font-size: 12px; margin-top: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

/* \u2500\u2500 Section headings \u2500\u2500 */
.mkt-heading { text-align: center; margin: 96px 0 18px; }
.mkt-heading h2 { font-size: 38px; letter-spacing: -0.025em; margin: 0; color: var(--text); font-weight: 800; }
.mkt-heading p { color: var(--muted); font-size: 16px; margin: 14px auto 0; max-width: 52ch; line-height: 1.7; }
.eyebrow { display: block; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent); margin-bottom: 12px; }

/* \u2500\u2500 Testimonials \u2500\u2500 */
.mkt-testimonials { max-width: 1080px; margin: 80px auto 40px; display: flex; flex-direction: column; align-items: center; padding: 0 24px; }
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; width: 100%; margin-top: 24px; }
.testimonial-card {
  padding: 32px; border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 80%, transparent); backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  box-shadow: 0 16px 32px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 20px;
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.testimonial-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.testimonial-card .stars { display: flex; gap: 4px; color: #F59E0B; }
.testimonial-card p { font-size: 16px; font-weight: 500; line-height: 1.6; color: var(--text); margin: 0; font-style: italic; flex: 1; }
.testimonial-card .author-info { display: flex; align-items: center; gap: 16px; margin-top: auto; }
.testimonial-card .author-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--gradient); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 18px; object-fit: cover; }
.testimonial-card .author-name { font-size: 15px; font-weight: 700; color: var(--text); }
.testimonial-card .author-role { font-size: 13px; color: var(--muted); }

/* \u2500\u2500 Desktop showcase \u2500\u2500 */
.desktop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 44px; }
.dsk-card {
  display: flex; flex-direction: column; gap: 18px; align-items: center; text-align: center;
  background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: var(--radius-lg);
  padding: 36px 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.06); transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.3s ease;
  position: relative; overflow: hidden;
}
.dsk-card:hover { transform: translateY(-8px); box-shadow: 0 28px 56px color-mix(in srgb, var(--primary) 20%, transparent); border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.dsk-card-icon { display: flex; align-items: center; justify-content: center; width: 68px; height: 68px; border-radius: var(--radius-lg); background: var(--tint); margin-bottom: 10px; transition: background 0.3s ease; }
.dsk-card:hover .dsk-card-icon { background: color-mix(in srgb, var(--primary) 20%, transparent); }
.dsk-card-icon svg, .dsk-plat-logo-lg svg { width: 32px; height: 32px; }
.dsk-card .dsk-info { display: flex; flex-direction: column; gap: 8px; }
.dsk-plat-header { display: flex; align-items: center; justify-content: center; gap: 10px; }
.dsk-plat-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
.dsk-plat-logo { flex: none; display: inline-flex; align-items: center; }
.dsk-card .dsk-info p { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.6; }
.dsk-card .dsk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 22px; border-radius: var(--radius); font-size: 13px; font-weight: 600; text-decoration: none; background: var(--gradient); color: #ffffff; box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 40%, transparent); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease; margin-top: auto; }
.dsk-card .dsk-btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 55%, transparent); }
@media (max-width: 860px) { .desktop-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; } }

/* \u2500\u2500 Integrations strip \u2500\u2500 */
.mkt-integrations { margin-top: 80px; padding: 40px 0; overflow: hidden; border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); text-align: center; background: color-mix(in srgb, var(--surface) 30%, transparent); }
.integration-title { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 28px; }
.brand-logos { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 0; }
.brand-logo-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 18px; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  font-size: 13px; font-weight: 700; color: var(--text);
  margin: 6px; transition: all 0.2s; cursor: default;
}
.brand-logo-pill:hover { border-color: color-mix(in srgb, var(--primary) 40%, transparent); color: var(--primary); background: var(--tint); }
.brand-logo-pill svg, .brand-logo-pill img { flex: none; display: block; }
.brand-logo-img { width: 18px; height: 18px; object-fit: contain; }

/* \u2500\u2500 Closing CTA band \u2500\u2500 */
.cta-band { margin: 96px 0 0; padding: 64px 40px; text-align: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, var(--surface)), color-mix(in srgb, var(--accent) 6%, var(--surface)));
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent); border-radius: var(--radius-lg);
  box-shadow: 0 24px 56px color-mix(in srgb, var(--primary) 14%, transparent); }
.cta-band .cta-logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.cta-band .cta-logo .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.05em; }
.cta-band h2 { font-size: 32px; margin: 0 0 14px; letter-spacing: -0.025em; color: var(--text); font-weight: 800; }
.cta-band p { color: var(--muted); font-size: 16px; margin: 0 0 32px; line-height: 1.65; }
.cta-band .btn.primary { font-size: 16px; padding: 16px 40px; background: var(--gradient); color: #ffffff; box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 45%, transparent); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease; }
.cta-band .btn.primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 36px color-mix(in srgb, var(--primary) 60%, transparent); }

/* \u2500\u2500 How It Works \u2500\u2500 */
.how-section { margin: 96px 0 0; }
.how-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; margin-top: 44px; }

/* \u2500\u2500 Product Explainer \u2500\u2500 */
.product-explainer { margin: 80px 0 0; }
.explainer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; margin-top: 44px; }
.explainer-card {
  padding: 36px; border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  display: flex; flex-direction: column; gap: 16px;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.3s ease;
}
.explainer-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px color-mix(in srgb, var(--primary) 14%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, transparent); }
.explainer-icon { width: 48px; height: 48px; border-radius: 14px; background: color-mix(in srgb, var(--primary) 12%, transparent); display: flex; align-items: center; justify-content: center; color: var(--primary); }
.explainer-card h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
.explainer-card p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.7; }
@media (max-width: 720px) { .explainer-grid { grid-template-columns: 1fr; } }
.how-step {
  text-align: center; padding: 36px 28px;
  background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: var(--radius-lg);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
}
.how-step:hover { transform: translateY(-6px); box-shadow: 0 20px 48px color-mix(in srgb, var(--primary) 14%, transparent); }
.how-num { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: var(--gradient); color: #ffffff; font-size: 17px; font-weight: 800; margin-bottom: 18px; box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent); }
.how-step h3 { font-size: 18px; font-weight: 700; margin: 0 0 10px; color: var(--text); }
.how-step p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.6; }
@media (max-width: 720px) { .how-steps { grid-template-columns: 1fr; max-width: 360px; margin-left: auto; margin-right: auto; } }

/* \u2500\u2500 Download center (kept for direct links) \u2500\u2500 */
.mkt-download h2 { text-align: center; font-size: 36px; letter-spacing: -0.02em; margin: 80px 0 24px; color: var(--text); }
.mkt-download { text-align: center; }
.mkt-download table { text-align: left; margin-top: 32px; background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.02); }
.mkt-download th, .mkt-download td { border-color: color-mix(in srgb, var(--border) 40%, transparent); }

/* \u2500\u2500 Cookie banner \u2500\u2500 */
.cookie-banner {
  display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  max-width: 520px; width: calc(100% - 32px); z-index: 9999;
  background: color-mix(in srgb, var(--surface) 95%, transparent); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-lg); padding: 22px 26px;
  box-shadow: 0 24px 56px rgba(0,0,0,0.22);
  align-items: center; gap: 16px; flex-wrap: wrap;
}
.cookie-banner .cb-content { flex: 1; min-width: 200px; }
.cookie-banner .cb-content strong { font-size: 14px; color: var(--text); font-weight: 700; }
.cookie-banner .cb-content p { font-size: 13px; color: var(--muted); margin: 6px 0 0; line-height: 1.55; }
.cookie-banner .cb-actions { display: flex; gap: 10px; flex: none; }
.cookie-banner .cb-actions .btn { font-size: 13px; padding: 9px 18px; border-radius: var(--radius); }
.cookie-banner .cb-actions .btn.primary { background: var(--gradient); color: #ffffff; }

@media (max-width: 720px) { .mkt-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 20px; } }

/* Scroll-reveal \u2014 .nx-reveal is added by JS only, so no-JS visitors see everything */
@media (prefers-reduced-motion: no-preference) {
  .nx-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); transition-delay: var(--nx-d, 0ms); }
  .nx-reveal.nx-in { opacity: 1; transform: none; }
}

/* \u2500\u2500 Mobile Showcase & Phone Mockup \u2500\u2500 */
.mobile-showcase { display: flex; flex-direction: column; align-items: center; gap: 40px; margin-top: 48px; }
.phone-mockup { position: relative; }
.phone-frame {
  width: 360px; height: 720px; border-radius: 44px;
  background: var(--bg);
  border: 10px solid #1a1a1e;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08) inset,
    0 0 0 1.5px #0d0d0f,
    0 4px 8px rgba(0,0,0,0.15),
    0 16px 40px rgba(0,0,0,0.25),
    0 48px 80px rgba(0,0,0,0.35);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
}
.phone-island {
  width: 90px; height: 24px; background: #000; border-radius: 14px;
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
}
.phone-screen { flex: 1; padding: 44px 14px 12px; display: flex; flex-direction: column; gap: 12px; background: var(--bg); overflow: hidden; }
.phone-screen .phone-dash-preview { overflow-y: auto; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--muted) 30%, transparent) transparent; }
.phone-screen .phone-dash-preview::-webkit-scrollbar { width: 3px; }
.phone-screen .phone-dash-preview::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--muted) 40%, transparent); border-radius: 4px; }
.phone-screen .phone-dash-preview::-webkit-scrollbar-track { background: transparent; }
.phone-status-bar { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: var(--text); padding: 0 4px; }
.phone-status-bar .status-icons { display: flex; align-items: center; gap: 5px; }
.phone-status-bar .status-icons svg { display: block; }
.phone-app-header {
  display: flex; align-items: center; gap: 8px; font-size: 14px;
  padding: 8px 12px; margin: 0 -14px;
  background: rgba(15, 18, 28, 0.75); backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, var(--surface));
  position: relative;
}
.phone-app-header::after {
  content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 40%, transparent), transparent);
}
.phone-app-header .app-avatar {
  margin-left: auto; width: 26px; height: 26px; border-radius: 50%;
  background: var(--gradient); display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
}
.phone-dash-preview { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; flex: 1; overflow-y: auto; }
.phone-dash-preview .dash-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.phone-dash-preview .card-label { font-size: 11px; color: var(--muted); display: block; }
.phone-dash-preview .card-stat { font-size: 18px; font-weight: 700; color: var(--primary); margin-top: 4px; }
.phone-home-bar { width: 110px; height: 4px; background: var(--text); border-radius: 2px; margin: auto auto 6px; opacity: 0.25; }
.phone-tabbar {
  flex: none; display: flex; align-items: center; justify-content: space-around;
  padding: 8px 6px 6px; background: color-mix(in srgb, var(--surface) 95%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  backdrop-filter: blur(12px);
}
.phone-tabbar .ptab {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-size: 9px; color: var(--muted); text-decoration: none; transition: color 0.2s;
}
.phone-tabbar .ptab.active { color: var(--primary); }
.phone-tabbar .ptab svg { width: 18px; height: 18px; }
.phone-tabbar .ptab { cursor: pointer; }
/* \u2500\u2500 Mockup desktop sidebar (faithful) \u2500\u2500 */
.mockup-sidebar-full {
  width: 140px; flex: none; display: flex; flex-direction: column; gap: 8px;
  padding: 14px 10px; border-right: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}
.mockup-sidebar-full .ms-brand {
  display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800;
  color: var(--text); margin-bottom: 6px;
}
.mockup-sidebar-full .ms-brand svg { width: 18px; height: 18px; }
.mockup-sidebar-full .ms-nav { display: flex; flex-direction: column; gap: 2px; }
.mockup-sidebar-full .ms-item {
  display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 500; color: var(--muted); text-decoration: none; transition: background 0.2s; cursor: pointer;
}
.mockup-sidebar-full .ms-item:hover { background: color-mix(in srgb, var(--surface) 80%, transparent); color: var(--text); }
.mockup-sidebar-full .ms-item.active {
  background: var(--tint); color: var(--primary); font-weight: 700;
}
.mockup-sidebar-full .ms-item svg { width: 14px; height: 14px; flex: none; }
.mockup-sidebar-full .ms-foot {
  margin-top: auto; font-size: 9px; color: var(--muted); padding: 4px 8px; opacity: 0.7;
}
@media (prefers-reduced-motion: no-preference) {
  .phone-mockup { animation: nxPhoneFloat 5s ease-in-out infinite; }
  @keyframes nxPhoneFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
}
.store-badges { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.store-badge-btn {
  display: inline-flex; align-items: center; gap: 12px; padding: 10px 20px;
  border-radius: var(--radius-lg); background: var(--surface); border: 1px solid var(--border-strong);
  color: var(--text); text-decoration: none; transition: transform 0.25s, box-shadow 0.25s;
}
.store-badge-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: var(--primary); }
.store-badge-btn .badge-text { display: flex; flex-direction: column; text-align: left; }
.store-badge-btn .badge-text .sub { font-size: 10px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1; margin-bottom: 2px; }
.store-badge-btn .badge-text .main { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; line-height: 1; }

/* \u2500\u2500 Mockup Shared Styles \u2500\u2500 */
.hero-mockup h2, .phone-mockup h2 { margin: 0 0 14px; font-size: 15px; font-weight: 800; color: var(--text); display: flex; justify-content: space-between; align-items: center; }
.hero-mockup .assistant-strip, .phone-mockup .assistant-strip { display: none; }
.hero-mockup .bento { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.phone-mockup .bento { display: grid; grid-template-columns: 1fr; gap: 10px; }
.hero-mockup .bento-tile, .phone-mockup .bento-tile {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  border-radius: 14px; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.phone-mockup .bento-tile { padding: 14px; }
.hero-mockup .bento-tile.featured, .phone-mockup .bento-tile.featured { grid-column: 1 / -1; }
.hero-mockup .bento-tile.wide, .phone-mockup .bento-tile.wide { grid-column: 1 / -1; }
.hero-mockup .tile-head, .phone-mockup .tile-head { display: flex; align-items: center; gap: 8px; color: var(--muted); }
.hero-mockup .tile-head .cardicon, .phone-mockup .tile-head .cardicon { display: flex; color: var(--primary); }
.hero-mockup .tile-head .tile-title, .phone-mockup .tile-head .tile-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.hero-mockup .value, .phone-mockup .value { font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -0.03em; margin-top: auto; }
.phone-mockup .value { font-size: 22px; }
.hero-mockup .ring-wrap, .phone-mockup .ring-wrap { display: flex; align-items: center; gap: 16px; }
.hero-mockup .ring-meta, .phone-mockup .ring-meta { display: flex; flex-direction: column; }
.hero-mockup .ring-meta .value, .phone-mockup .ring-meta .value { font-size: 20px; margin: 0; }
.phone-mockup .ring-meta .value { font-size: 16px; }
.hero-mockup .ring-meta .label, .phone-mockup .ring-meta .label { font-size: 11px; color: var(--muted); margin-top: 3px; }
.phone-mockup .ring svg.ring { width: 60px; height: 60px; }

.phone-dash-preview .dash-card {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  border-radius: 12px; padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.phone-dash-preview .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); display: block; }
.phone-dash-preview .card-stat { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin-top: 5px; }

/* \u2500\u2500 Focus styles (accessibility) \u2500\u2500 */
:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 4px; }
.btn:focus-visible { outline-offset: 4px; }
`.trim();
}
function renderMarketingDocument(locale, _userAgent, theme = "dark") {
  setLocale(locale);
  const t2 = getTheme(theme);
  const releases = demoReleases();
  const winRelease = releases.all().find((r) => r.platform === "windows");
  const macRelease = releases.all().find((r) => r.platform === "macos");
  const linRelease = releases.all().find((r) => r.platform === "linux");
  const demoScreens = buildDemoScreens();
  const langLabels = {
    en: "English",
    tr: "T\xFCrk\xE7e",
    es: "Espa\xF1ol",
    fr: "Fran\xE7ais",
    de: "Deutsch",
    it: "Italiano",
    pt: "Portugu\xEAs",
    nl: "Nederlands",
    pl: "Polski",
    cs: "\u010Ce\u0161tina",
    ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
    uk: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430",
    ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
    he: "\u05E2\u05D1\u05E8\u05D9\u05EA",
    hi: "\u0939\u093F\u0928\u094D\u0926\u0940",
    ja: "\u65E5\u672C\u8A9E",
    ko: "\uD55C\uAD6D\uC5B4",
    "zh-Hans": "\u7B80\u4F53\u4E2D\u6587",
    "zh-Hant": "\u7E41\u9AD4\u4E2D\u6587",
    vi: "Ti\u1EBFng Vi\u1EC7t"
  };
  const langItems = SUPPORTED_LOCALES.map(
    (l) => `<a class="ld-item${l === locale ? " active" : ""}" href="?lang=${l}" data-lang="${l}">${langLabels[l] || l.toUpperCase()}</a>`
  ).join("");
  const langSwitch = `<div class="lang-picker"><button class="lang-picker-btn" type="button" aria-expanded="false" aria-haspopup="listbox"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>${langLabels[locale] || locale.toUpperCase()}</span><svg class="ld-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button><div class="ld-menu" role="listbox">${langItems}</div></div>`;
  const themeToggle = `<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" type="button"><svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg><svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>`;
  const hamburger = `<button class="hamburger" aria-label="Menu" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>`;
  const navbar = `<div class="navbar" role="banner" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<nav class="nav-links" aria-label="Primary">
<a class="nav-link" href="/#features">${label("mkt.nav.features")}</a>
<a class="nav-link" href="/#pricing">${label("mkt.nav.pricing")}</a>
<a class="nav-link" href="/#integrations">${label("mkt.nav.integrations")}</a>
<a class="nav-link" href="/#faq">${label("mkt.nav.faq")}</a>
</nav>
<div class="nav-actions">${langSwitch}${themeToggle}<a class="btn btn-ghost nav-signin" href="/login">${label("mkt.nav.signIn")}</a>${hamburger}</div>
</div></div>`;
  const platformIcons = `<span class="plat-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.5L10.5 4.5v7H3v-6zM3 12.5h7.5v7L3 18.5v-6zM12.5 4.2L21 3v8.5h-8.5v-7.3zM12.5 12.5H21V21l-8.5-1.2v-7.3z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/></svg></span>`;
  const heroMockup = `<div class="hero-mockup"><div class="mockup-frame">
<div class="mockup-bar"><span class="murl">NEXUS \u2014 ${label("mkt.hero.badge").includes("Ki\u015Fisel") ? "Ki\u015Fisel \u0130\u015Fletim Sistemi" : "Personal Operating System"}</span><span class="wctl"><span class="wctl-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="6" x2="10" y2="6"/></svg></span><span class="wctl-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="8" height="8" rx="1"/></svg></span><span class="wctl-icon close"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg></span></span></div>
<div class="mockup-body" style="display:flex; gap:0;">
<div class="mockup-sidebar-full">
  <div class="ms-brand">${renderLogo()}<span>NEXUS</span></div>
  <nav class="ms-nav" id="desk-mock-nav">
    <a class="ms-item active" data-panel="desk-today"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg><span>Today</span></a>
    <a class="ms-item" data-panel="desk-home"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></svg><span>Home</span></a>
    <a class="ms-item" data-panel="desk-devices"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/></svg><span>Devices</span></a>
    <a class="ms-item" data-panel="desk-family"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7 0"/></svg><span>Family</span></a>
    <a class="ms-item" data-panel="desk-skills"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/></svg><span>Skills</span></a>
    <a class="ms-item" data-panel="desk-suggestions"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/></svg><span>Suggestions</span></a>
  </nav>
  <div class="ms-foot">v3.14.2 \xB7 Family</div>
</div>
<div class="mockup-content" style="flex:1; padding:14px; overflow:hidden;">
  <div class="mockup-panel active" id="desk-today">
${renderTodayPanel(demoScreens.today)}
  </div>
  <div class="mockup-panel" id="desk-home">
${renderHomeState(demoScreens.home)}
  </div>
  <div class="mockup-panel" id="desk-devices">
${renderDevices(demoScreens.devices)}
  </div>
  <div class="mockup-panel" id="desk-family">
${renderFamily(demoScreens.family)}
  </div>
  <div class="mockup-panel" id="desk-skills">
${renderSkills(demoScreens.skills)}
  </div>
  <div class="mockup-panel" id="desk-suggestions">
${renderSuggestions(demoScreens.suggestions)}
  </div>
</div>
</div></div>`;
  const hero = `<section class="hero">
<div class="hero-inner">
<div class="hero-text">
<span class="hero-badge">${locale === "tr" ? "Windows \xB7 macOS \xB7 Linux \xB7 iOS \xB7 Android" : "Windows \xB7 macOS \xB7 Linux \xB7 iOS \xB7 Android"}${platformIcons}</span>
<h1>${label("mkt.hero.title")}</h1>
<p class="lede">${label("mkt.hero.desc")}</p>
<div class="actions" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
<a class="btn primary" href="/login" style="gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>${locale === "tr" ? "Hemen Dene" : "Try Now"}</a>
<a class="btn" href="#desktop" style="gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${locale === "tr" ? "\u0130ndir" : "Download"}</a>
</div>
<p class="trust">${label("mkt.hero.trust")}</p>
<div class="scroll-hint"><span class="mouse"></span><span>Scroll to explore</span></div>
</div>
${heroMockup}
</div>
</section>`;
  const stats = `<section class="mkt-stats" aria-label="${label("mkt.stats.title")}">
<div class="stat"><span class="stat-num">500K+</span><span class="stat-label">${label("mkt.stats.users")}</span></div>
<div class="stat"><span class="stat-num">2,000+</span><span class="stat-label">${label("mkt.stats.devices")}</span></div>
<div class="stat"><span class="stat-num">100%</span><span class="stat-label">${label("mkt.stats.privacy")}</span></div>
<div class="stat"><span class="stat-num">4.9\u2605</span><span class="stat-label">${label("mkt.stats.rating")}</span></div>
</section>`;
  const osLogoWin = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="color:#0078D4"><path d="M3 5.5L10.5 4.5v7H3v-6zM3 12.5h7.5v7L3 18.5v-6zM12.5 4.2L21 3v8.5h-8.5v-7.3zM12.5 12.5H21V21l-8.5-1.2v-7.3z"/></svg>`;
  const osLogoMac = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg>`;
  const osLogoLin = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/></svg>`;
  const desktopCard = (platform3, _titleKey, descKey, downloadUrl, version) => {
    const osLogo = platform3 === "windows" ? osLogoWin : platform3 === "macos" ? osLogoMac : osLogoLin;
    const platformLabel = platform3 === "windows" ? "Windows" : platform3 === "macos" ? "macOS" : "Linux";
    return `<div class="dsk-card">
<div class="dsk-info">
<div class="dsk-plat-header"><span class="dsk-plat-logo">${osLogo}</span><h3>${platformLabel}</h3></div>
<p>${label(descKey)}</p>
<span class="dsk-version" style="font-size:11px; color:var(--muted); margin-top:8px; display:block;">v${escapeHtml(version)}</span>
</div>
<a class="dsk-btn" href="${escapeHtml(downloadUrl)}" download aria-label="${label("mkt.desktop.download")} ${platformLabel}"><span>${label("mkt.desktop.download")}</span></a>
</div>`;
  };
  const winUrl = winRelease?.downloadUrl ?? "/downloads/NEXUS-Setup-3.14.2.exe";
  const macUrl = macRelease?.downloadUrl ?? "/downloads/NEXUS-3.14.1.dmg";
  const linUrl = linRelease?.downloadUrl ?? "/downloads/NEXUS-3.13.8.AppImage";
  const desktopSection = `<section id="desktop" class="mkt-anchor">
<div class="mkt-heading"><span class="eyebrow">${label("mkt.desktop.eyebrow")}</span><h2>${label("mkt.desktop.title")}</h2><p>${label("mkt.desktop.desc")}</p></div>
<div class="desktop-showcase" style="width:100%; max-width:1200px; margin: 40px auto; border-radius:12px; overflow:hidden; box-shadow:0 30px 60px rgba(0,0,0,0.3); border:1px solid color-mix(in srgb,var(--border) 40%,transparent); background:var(--bg);">
  <iframe src="/desktop/" style="width:100%; height:800px; border:none; display:block;"></iframe>
</div>
<div class="desktop-grid">
${desktopCard("windows", "mkt.desktop.windows", "mkt.desktop.windowsDesc", winUrl, winRelease?.version ?? "3.14.2")}
${desktopCard("macos", "mkt.desktop.macos", "mkt.desktop.macosDesc", macUrl, macRelease?.version ?? "3.14.1")}
${desktopCard("linux", "mkt.desktop.linux", "mkt.desktop.linuxDesc", linUrl, linRelease?.version ?? "3.13.8")}
</div>
</section>`;
  const mobileSection = `<section id="mobile" class="mkt-anchor">
<div class="mkt-heading"><span class="eyebrow">${label("mkt.download.mobile.soon")}</span><h2>${label("mkt.download.mobile.title")}</h2><p>${label("mkt.download.mobile.desc")}</p></div>
<div class="mobile-showcase">
  <iframe src="/mobile/" style="width:100%; max-width: 500px; height:900px; border:none; display:block; margin:0 auto; background:transparent;"></iframe>
  <div class="store-badges">
    <a href="#" class="store-badge-btn" onclick="openQrModal('apple'); return false;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg>
      <div class="badge-text"><span class="sub">${label("mkt.download.mobile.apple")}</span><span class="main">${label("mkt.download.mobile.appleStore")}</span></div>
    </a>
    <a href="#" class="store-badge-btn" onclick="openQrModal('google'); return false;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.05v-16.1c0-.44.5-.71.88-.47l12.44 8.05c.34.22.34.72 0 .94L3.88 20.52c-.38.24-.88-.03-.88-.47Z"/></svg>
      <div class="badge-text"><span class="sub">${label("mkt.download.mobile.google")}</span><span class="main">${label("mkt.download.mobile.googlePlay")}</span></div>
    </a>
  </div>
</div>
</section>`;
  const brandLogos = [
    { name: "Apple Home", si: "apple" },
    { name: "Google Home", si: "googlehome" },
    { name: "SmartThings", si: "samsung" },
    { name: "Home Assistant", si: "homeassistant" },
    { name: "Philips Hue", si: "philipshue" },
    { name: "Sonos", si: "sonos" },
    { name: "IKEA", si: "ikea" },
    { name: "Zigbee", si: "zigbee" },
    { name: "Bose", si: "bose" },
    { name: "Xiaomi", si: "xiaomi" }
  ];
  const integrationStrip = `<section id="integrations" class="mkt-integrations mkt-anchor">
<p class="integration-title">${label("mkt.integrations.title")}</p>
<style>
.brand-logo-pill {
  background: #ffffff !important;
  color: #0f172a !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: var(--shadow-sm);
}
.brand-logo-pill:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1 !important;
}
</style>
<div class="brand-logos">
${brandLogos.map((b) => `<span class="brand-logo-pill"><img src="https://cdn.simpleicons.org/${b.si}" class="brand-logo-img" alt="${b.name}" width="18" height="18" loading="lazy" onerror="this.style.display='none'"><span>${b.name}</span></span>`).join("")}
</div>
</section>`;
  const ctaBand = `<section class="cta-band">
<div class="cta-logo">${renderLogo()}<span class="brand">NEXUS</span></div>
<h2>${label("mkt.cta.title")}</h2>
<p>${label("mkt.cta.desc")}</p>
<a class="btn primary" href="#desktop">${label("mkt.cta.button")}</a>
</section>`;
  const seoConfig = {
    ...demoSeo(t2.color.primary),
    title: label("mkt.seo.title"),
    description: label("mkt.seo.desc"),
    alternates: SUPPORTED_LOCALES.map((l) => ({ lang: l, url: `/?lang=${l}` }))
  };
  const blockingThemeScript = `<script>(function(){var t=localStorage.getItem("nx-theme");if(t)document.documentElement.setAttribute("data-theme",t);})()</script>`;
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${renderHead(seoConfig)}
<link rel="preload" href="/fonts/space-grotesk-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="icon" href="${faviconDataUri(t2.color.primary)}" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="${t2.color.bg}" />
${blockingThemeScript}
<style>${renderStyles(t2)}${marketingCss()}</style>
</head>
<body>
<a class="skip" href="#features">${label("mkt.skipToContent")}</a>
${navbar}
<div class="mkt">
${hero}
${stats}
<section class="product-explainer mkt-anchor" id="what-is-nexus">
<div class="mkt-heading"><span class="eyebrow">${locale === "tr" ? "NEXUS Nedir?" : "What is NEXUS?"}</span><h2>${locale === "tr" ? "Evinizin Ki\u015Fisel \u0130\u015Fletim Sistemi" : "The Personal Operating System for Your Home"}</h2><p>${locale === "tr" ? "NEXUS, t\xFCm ak\u0131ll\u0131 cihazlar\u0131n\u0131z\u0131 tek bir merkezden y\xF6neten, tamamen cihaz \xFCzerinde \xE7al\u0131\u015Fan ve gizlili\u011Finize sayg\u0131 duyan sesle kontrol edilebilir bir platformdur." : "NEXUS is a voice-controlled platform that manages all your smart devices from one hub, runs entirely on-device, and respects your privacy."}</p></div>
<div class="explainer-grid">
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3>${locale === "tr" ? "%100 Yerel & Gizli" : "100% Local & Private"}</h3><p>${locale === "tr" ? "Verileriniz hi\xE7bir zaman cihaz\u0131n\u0131zdan ayr\u0131lmaz. Bulut yok, izleme yok, \xFC\xE7\xFCnc\xFC taraflarla payla\u015F\u0131m yok." : "Your data never leaves your device. No cloud, no tracking, no third-party sharing."}</p></div>
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div><h3>${locale === "tr" ? "Sesle Kontrol" : "Voice-First Control"}</h3><p>${locale === "tr" ? "Do\u011Fal dil komutlar\u0131yla cihazlar\u0131n\u0131z\u0131 kontrol edin. Yapay zeka asistan\u0131m\u0131z sizi anlar." : "Control your devices with natural language commands. Our AI assistant understands you."}</p></div>
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><h3>${locale === "tr" ? "T\xFCm Platformlar" : "All Platforms"}</h3><p>${locale === "tr" ? "Windows, macOS, Linux masa\xFCst\xFC uygulamalar\u0131 ve iOS, Android mobil uygulamalar. Her yerde yan\u0131n\u0131zda." : "Windows, macOS, Linux desktop apps and iOS, Android mobile apps. With you everywhere."}</p></div>
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><h3>${locale === "tr" ? "2000+ Cihaz Deste\u011Fi" : "2000+ Device Support"}</h3><p>${locale === "tr" ? "Zigbee, Z-Wave, Matter, WiFi \u2014 t\xFCm pop\xFCler protokollerle \xE7al\u0131\u015F\u0131r. Markan\u0131za ba\u011F\u0131ml\u0131 kalmay\u0131n." : "Works with Zigbee, Z-Wave, Matter, WiFi \u2014 all popular protocols. No vendor lock-in."}</p></div>
</div>
</section>
<div id="features" class="mkt-anchor">${renderFeatures()}</div>
<section class="how-section mkt-anchor" id="how">
<div class="mkt-heading"><h2>${label("mkt.how.title")}</h2></div>
<div class="how-steps">
<div class="how-step"><span class="how-num">1</span><h3>${label("mkt.how.step1.title")}</h3><p>${label("mkt.how.step1.desc")}</p></div>
<div class="how-step"><span class="how-num">2</span><h3>${label("mkt.how.step2.title")}</h3><p>${label("mkt.how.step2.desc")}</p></div>
<div class="how-step"><span class="how-num">3</span><h3>${label("mkt.how.step3.title")}</h3><p>${label("mkt.how.step3.desc")}</p></div>
</div>
</section>
${integrationStrip}
${renderTestimonials()}
${renderPricing()}
${desktopSection}
${mobileSection}
${renderFaq()}
${ctaBand}
</div>
${renderRichFooter(t2.color.primary)}
<!-- Store QR modal: scanning opens the mobile app surface on the phone. -->
<div id="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title" style="display:none; position:fixed; inset:0; z-index:1000; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(6px);">
  <div style="background:var(--surface, #14161c); color:var(--text, #f2f3f5); border:1px solid color-mix(in srgb,var(--border) 60%,transparent); border-radius:16px; padding:28px; width:min(360px, 90vw); text-align:center; box-shadow:0 30px 80px rgba(0,0,0,0.5); position:relative;">
    <button type="button" id="qr-modal-close" aria-label="${locale === "tr" ? "Kapat" : "Close"}" style="position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius:8px; border:none; background:transparent; color:var(--muted, #a2a6ad); cursor:pointer; font-size:18px; line-height:1;">\xD7</button>
    <h3 id="qr-modal-title" style="font-size:17px; font-weight:700; margin-bottom:6px;"></h3>
    <p style="font-size:13px; color:var(--muted, #a2a6ad); margin-bottom:18px;">${locale === "tr" ? "Telefonunuzla QR kodu okutun; NEXUS mobil deneyimi an\u0131nda a\xE7\u0131l\u0131r." : "Scan the QR code with your phone to open the NEXUS mobile experience instantly."}</p>
    <div style="background:#fff; border-radius:12px; padding:12px; display:inline-block;">
      <img id="qr-modal-img" alt="QR code" width="200" height="200" style="display:block;" />
    </div>
    <p id="qr-modal-url" style="font-size:12px; color:var(--muted, #a2a6ad); margin-top:14px; word-break:break-all;"></p>
  </div>
</div>
<script>
(function(){
  var modal = document.getElementById('qr-modal');
  if (!modal) return;
  var img = document.getElementById('qr-modal-img');
  var title = document.getElementById('qr-modal-title');
  var urlLine = document.getElementById('qr-modal-url');
  var titles = {
    apple: ${JSON.stringify(locale === "tr" ? "iPhone/iPad i\xE7in NEXUS" : "NEXUS for iPhone & iPad")},
    google: ${JSON.stringify(locale === "tr" ? "Android i\xE7in NEXUS" : "NEXUS for Android")}
  };
  window.openQrModal = function(store){
    var target = location.origin + '/mobile/';
    title.textContent = titles[store] || 'NEXUS Mobile';
    urlLine.textContent = target;
    // Inline QR-like graphic with direct link (no external service dependency)
    img.onerror = function(){
      img.onerror = null;
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
        '<rect width="200" height="200" rx="16" fill="%23f8f9fa"/>' +
        '<rect x="20" y="20" width="50" height="50" rx="4" fill="%23111"/>' +
        '<rect x="130" y="20" width="50" height="50" rx="4" fill="%23111"/>' +
        '<rect x="20" y="130" width="50" height="50" rx="4" fill="%23111"/>' +
        '<rect x="28" y="28" width="34" height="34" rx="2" fill="%23fff"/>' +
        '<rect x="138" y="28" width="34" height="34" rx="2" fill="%23fff"/>' +
        '<rect x="28" y="138" width="34" height="34" rx="2" fill="%23fff"/>' +
        '<rect x="36" y="36" width="18" height="18" fill="%23111"/>' +
        '<rect x="146" y="36" width="18" height="18" fill="%23111"/>' +
        '<rect x="36" y="146" width="18" height="18" fill="%23111"/>' +
        '<rect x="80" y="80" width="40" height="40" rx="8" fill="%237C5CFF"/>' +
        '<text x="100" y="105" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23fff">N</text>' +
        '</svg>');
    };
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=' + encodeURIComponent(target);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };
  function closeModal(){ modal.style.display = 'none'; document.body.style.overflow = ''; }
  document.getElementById('qr-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
})();
</script>
<script>
(function(){
  // \u2500\u2500 Theme toggle \u2500\u2500
  var html = document.documentElement;
  var saved = localStorage.getItem('nx-theme');
  if (saved) html.setAttribute('data-theme', saved);
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', function() {
    var cur = html.getAttribute('data-theme') || 'dark';
    var next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('nx-theme', next);
  });

  // \u2500\u2500 Language picker \u2500\u2500
  var pickers = document.querySelectorAll('.lang-picker');
  pickers.forEach(function(picker) {
    var pbtn = picker.querySelector('.lang-picker-btn');
    var menu = picker.querySelector('.ld-menu');
    if (!pbtn || !menu) return;
    pbtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = menu.classList.contains('open');
      menu.classList.toggle('open');
      pbtn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
  document.addEventListener('click', function() {
    pickers.forEach(function(p) {
      var m = p.querySelector('.ld-menu');
      var b = p.querySelector('.lang-picker-btn');
      if (m) m.classList.remove('open');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  // \u2500\u2500 Scroll reveal \u2500\u2500
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var sel = '.mkt-stats .stat, .feature-card, .how-step, .dsk-card, .cta-band, .mkt-heading, .brand-logo-pill';
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(sel));
    revealEls.forEach(function(el){ el.classList.add('nx-reveal'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('nx-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function(el){
      var sibs = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).indexOf(el) : 0;
      el.style.setProperty('--nx-d', (Math.max(0, Math.min(sibs, 6)) * 60) + 'ms');
      io.observe(el);
    });
  }

  // \u2500\u2500 Mobile nav hamburger \u2500\u2500
  var menuBtn = document.querySelector('.hamburger');
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      var navLinks = document.querySelector('.nav-links');
      if (navLinks) navLinks.classList.toggle('open');
    });
  }

  // \u2500\u2500 Scroll-aware navbar \u2500\u2500
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 60) { navbar.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }
      else { navbar.style.boxShadow = ''; }
    }, { passive: true });
  }

  // \u2500\u2500 Close mobile nav on link click \u2500\u2500
  var navLinks2 = document.querySelector('.nav-links');
  if (navLinks2) {
    navLinks2.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { navLinks2.classList.remove('open'); });
    });
  }

  // \u2500\u2500 Interactive mockup navigation \u2500\u2500
  function setupMockupNav(navSelector, panelClass) {
    var nav = document.querySelector(navSelector);
    if (!nav) return;
    nav.addEventListener('click', function(e) {
      var item = e.target.closest('[data-panel]');
      if (!item) return;
      var panelId = item.getAttribute('data-panel');
      // Update active tab/item
      nav.querySelectorAll('[data-panel]').forEach(function(el) { el.classList.remove('active'); });
      item.classList.add('active');
      // Show target panel
      var container = document.getElementById(panelId);
      if (!container) return;
      var siblings = container.parentElement.querySelectorAll('.' + panelClass);
      siblings.forEach(function(p) { p.classList.remove('active'); });
      container.classList.remove('active');
      void container.offsetWidth;
      container.classList.add('active');
    });
  }
  setupMockupNav('#desk-mock-nav', 'mockup-panel');
  setupMockupNav('#phone-mock-nav', 'phone-panel');
})();
</script>
${renderCookieBanner()}
<script>
(function(){
  var banner = document.getElementById('cookie-banner');
  if (!banner || localStorage.getItem('nx-cookies')) { if (banner) banner.remove(); return; }
  banner.style.display = 'flex';
  banner.querySelector('.cb-accept').addEventListener('click', function() { localStorage.setItem('nx-cookies','accepted'); banner.remove(); });
  banner.querySelector('.cb-decline').addEventListener('click', function() { localStorage.setItem('nx-cookies','declined'); banner.remove(); });
})();
</script>
</body>
</html>`;
}
function renderLegalPage(locale, theme = "dark", page) {
  setLocale(locale);
  const t2 = getTheme(theme);
  const titles = {
    privacy: { en: "Privacy Policy", tr: "Gizlilik Politikas\u0131" },
    terms: { en: "Terms of Service", tr: "Kullan\u0131m Ko\u015Fullar\u0131" }
  };
  const contents = {
    privacy: {
      en: `<h2>Your Privacy Matters</h2>
<p>Welcome to NEXUS. We are deeply committed to protecting your privacy and security. Our fundamental principle is that your data belongs to you. This Privacy Policy details how we handle the information you provide when using our software, applications, and services.</p>
<h3>Data Collection</h3>
<p>We operate on a local-first architecture. This means we do not collect, store, or transmit any personal data, voice recordings, home layouts, or usage patterns to our servers. All voice commands, routines, connected device configurations, and telemetry data remain strictly within your local network or on your personal devices. The only data we process on our servers relates strictly to account authentication and billing, which is managed via industry-standard secure payment processors.</p>
<h3>Local Processing & AI</h3>
<p>NEXUS utilizes advanced on-device artificial intelligence. All machine learning inferences, including natural language processing (NLP), voice recognition, and predictive routine automation, occur entirely on the hardware you own. At no point are your voice samples sent to the cloud for transcription or analysis. No cloud dependency is required for core functionality, ensuring that your home remains operational and private even without internet connectivity.</p>
<h3>Third-Party Integrations</h3>
<p>When you choose to connect third-party smart home devices (e.g., Philips Hue, Sonos, Zigbee devices), NEXUS acts as a local hub. We do not share your NEXUS data with these manufacturers. However, these third-party devices may still communicate with their respective manufacturers' servers according to their own privacy policies. We encourage you to review the privacy practices of the devices you connect.</p>
<h3>Analytics and Telemetry</h3>
<p>To improve our services, we use privacy-respecting, cookie-free analytics on our website. These tools collect only aggregate page view counts and non-identifiable system metadata (such as generic OS version metrics). No personal identifiers, IP addresses, or device-specific fingerprints are tracked or stored.</p>
<h3>Changes to Privacy Policy</h3>
<p>We may update this Privacy Policy periodically to reflect changes in our practices or relevant laws. We will notify you of any significant updates via the NEXUS application interface.</p>
<h3>Contact Us</h3>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our privacy team at <a href="mailto:privacy@nexus-ai.example.com">privacy@nexus-ai.example.com</a>.</p>`,
      tr: `<h2>Gizlili\u011Finiz \xD6nemli</h2>
<p>NEXUS'a ho\u015F geldiniz. Gizlili\u011Finizi ve g\xFCvenli\u011Finizi korumaya derinden ba\u011Fl\u0131y\u0131z. Temel prensibimiz, verilerinizin size ait olmas\u0131d\u0131r. Bu Gizlilik Politikas\u0131, yaz\u0131l\u0131m\u0131m\u0131z\u0131, uygulamalar\u0131m\u0131z\u0131 ve hizmetlerimizi kullan\u0131rken sa\u011Flad\u0131\u011F\u0131n\u0131z bilgileri nas\u0131l i\u015Fledi\u011Fimizi detayland\u0131rmaktad\u0131r.</p>
<h3>Veri Toplama</h3>
<p>\xD6ncelikle yerel (local-first) bir mimariyle \xE7al\u0131\u015F\u0131yoruz. Bu, ki\u015Fisel verileri, ses kay\u0131tlar\u0131n\u0131, ev yerle\u015Fimlerini veya kullan\u0131m al\u0131\u015Fkanl\u0131klar\u0131n\u0131 sunucular\u0131m\u0131zda toplamad\u0131\u011F\u0131m\u0131z, saklamad\u0131\u011F\u0131m\u0131z veya iletmedi\u011Fimiz anlam\u0131na gelir. T\xFCm sesli komutlar, rutinler, ba\u011Fl\u0131 cihaz yap\u0131land\u0131rmalar\u0131 ve telemetri verileri kesinlikle yerel a\u011F\u0131n\u0131zda veya ki\u015Fisel cihazlar\u0131n\u0131zda kal\u0131r. Sunucular\u0131m\u0131zda i\u015Fledi\u011Fimiz tek veri, end\xFCstri standard\u0131 g\xFCvenli \xF6deme i\u015Flemcileri arac\u0131l\u0131\u011F\u0131yla y\xF6netilen hesap kimlik do\u011Frulamas\u0131 ve faturaland\u0131rma ile ilgilidir.</p>
<h3>Yerel \u0130\u015Fleme ve Yapay Zeka</h3>
<p>NEXUS geli\u015Fmi\u015F cihaz i\xE7i (on-device) yapay zeka kullan\u0131r. Do\u011Fal dil i\u015Fleme (NLP), ses tan\u0131ma ve tahmine dayal\u0131 rutin otomasyonu da dahil olmak \xFCzere t\xFCm makine \xF6\u011Frenimi \xE7\u0131kar\u0131mlar\u0131 tamamen sahip oldu\u011Funuz donan\u0131m \xFCzerinde ger\xE7ekle\u015Fir. Ses \xF6rnekleriniz hi\xE7bir zaman yaz\u0131ya d\xF6k\xFClmek veya analiz edilmek \xFCzere buluta g\xF6nderilmez. Temel i\u015Flevsellik i\xE7in hi\xE7bir bulut ba\u011F\u0131ml\u0131l\u0131\u011F\u0131 gerekmez, bu da evinizin internet ba\u011Flant\u0131s\u0131 olmasa bile \xE7al\u0131\u015F\u0131r durumda ve gizli kalmas\u0131n\u0131 sa\u011Flar.</p>
<h3>\xDC\xE7\xFCnc\xFC Taraf Entegrasyonlar\u0131</h3>
<p>\xDC\xE7\xFCnc\xFC taraf cihazlar\u0131 (\xF6r. ak\u0131ll\u0131 ampuller, termostatlar) ba\u011Flarken NEXUS bir k\xF6pr\xFC g\xF6revi g\xF6r\xFCr. \xD6zel hub verilerinizi bu \xFC\xE7\xFCnc\xFC taraf \xFCreticilerle payla\u015Fmasak da, l\xFCtfen bu cihazlar\u0131n kendi gizlilik politikalar\u0131na g\xF6re kendi sunucular\u0131yla ileti\u015Fim kurabilece\u011Fini unutmay\u0131n. Kullan\u0131c\u0131lar\u0131m\u0131z\u0131, ba\u011Fl\u0131 t\xFCm donan\u0131mlar\u0131n gizlilik ayarlar\u0131n\u0131 do\u011Frulamaya te\u015Fvik ediyoruz.</p>
<h3>G\xFCvenlik \xD6nlemleri</h3>
<p>Hub ve kontrol uygulamalar\u0131n\u0131z aras\u0131ndaki t\xFCm yerel ileti\u015Fimler i\xE7in g\xFC\xE7l\xFC \u015Fifreleme y\xF6ntemleri kullan\u0131yoruz. Verileriniz evinizde kald\u0131\u011F\u0131 i\xE7in, bulut sa\u011Flay\u0131c\u0131lar\u0131n\u0131 etkileyen b\xFCy\xFCk \xF6l\xE7ekli veri ihlallerine kar\u015F\u0131 savunmas\u0131z de\u011Fildir.</p>
<h3>Bize Ula\u015F\u0131n</h3>
<p>Gizlilik uygulamalar\u0131m\u0131zla ilgili herhangi bir sorunuz varsa veya daha fazla bilgiye ihtiya\xE7 duyarsan\u0131z, l\xFCtfen <a href="mailto:privacy@nexus-ai.example.com">privacy@nexus-ai.example.com</a> adresinden gizlilik sorumlumuza ula\u015F\u0131n.</p>`
    },
    terms: {
      en: `<h2>Terms of Service</h2>
<p>Last Updated: October 2026</p>
<p>By downloading, installing, accessing, or using the NEXUS application and related services (collectively, the "Services"), you explicitly agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.</p>
<h3>License and Usage</h3>
<p>NEXUS grants you a personal, non-exclusive, non-transferable, and revocable license to install and use the software on devices you own or control, strictly for personal and non-commercial home automation purposes. You may not distribute, lease, rent, or sub-license the software to any third party.</p>
<h3>Acceptable Use and Restrictions</h3>
<p>You agree to use NEXUS only for lawful purposes. You shall not reverse-engineer, decompile, disassemble, or attempt to derive the source code from the application, except to the extent that such activity is expressly permitted by applicable law. Furthermore, you shall not use the Services to create any product or service that competes directly with NEXUS, nor shall you exploit any bugs or vulnerabilities in the software.</p>
<h3>User Responsibilities</h3>
<p>You are solely responsible for maintaining the security of your home network, devices, and NEXUS account credentials. NEXUS operates locally and relies on the security of your own network infrastructure. We strongly advise using strong passwords and ensuring your router's firmware is up to date.</p>
<h3>Disclaimer of Warranties</h3>
<p>NEXUS is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the software will be error-free, uninterrupted, or secure at all times.</p>
<h3>Limitation of Liability</h3>
<p>To the maximum extent permitted by law, in no event shall NEXUS, its developers, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages (including loss of data, property damage, or security breaches) arising out of or related to your use or inability to use the Services, even if advised of the possibility of such damages.</p>
<h3>Governing Law and Updates</h3>
<p>These terms shall be governed by the laws of the jurisdiction in which our primary operations are based. We reserve the right to modify or replace these Terms at any time. Significant changes will be communicated through our application or website. Your continued use of NEXUS following the posting of any changes constitutes acceptance of those changes.</p>`,
      tr: `<h2>Kullan\u0131m Ko\u015Fullar\u0131</h2>
<p>Son G\xFCncelleme: Ekim 2026</p>
<p>NEXUS uygulamas\u0131n\u0131 ve ilgili hizmetleri (topluca "Hizmetler") indirerek, kurarak, bunlara eri\u015Ferek veya kullanarak, bu Kullan\u0131m Ko\u015Fullar\u0131na tabi olmay\u0131 a\xE7\u0131k\xE7a kabul edersiniz. Bu ko\u015Fullar\u0131 kabul etmiyorsan\u0131z, l\xFCtfen Hizmetlerimizi kullanmay\u0131n.</p>
<h3>Lisans ve Kullan\u0131m</h3>
<p>NEXUS, yaz\u0131l\u0131m\u0131 sahip oldu\u011Funuz veya kontrol etti\u011Finiz cihazlara kurman\u0131z ve kesinlikle ki\u015Fisel ve ticari olmayan ev otomasyonu amac\u0131yla kullanman\u0131z i\xE7in size ki\u015Fisel, m\xFCnhas\u0131r olmayan, devredilemez ve iptal edilebilir bir lisans verir. Yaz\u0131l\u0131m\u0131 herhangi bir \xFC\xE7\xFCnc\xFC tarafa da\u011F\u0131tamaz, kiralayamaz veya alt lisans\u0131n\u0131 veremezsiniz.</p>
<h3>Kabul Edilebilir Kullan\u0131m ve K\u0131s\u0131tlamalar</h3>
<p>NEXUS'u yaln\u0131zca yasal ama\xE7lar i\xE7in kullanmay\u0131 kabul edersiniz. Y\xFCr\xFCrl\xFCkteki yasalar\u0131n a\xE7\u0131k\xE7a izin verdi\u011Fi \xF6l\xE7\xFC d\u0131\u015F\u0131nda, yaz\u0131l\u0131mda tersine m\xFChendislik yapamaz, kaynak koda d\xF6n\xFC\u015Ft\xFCremez, par\xE7alara ay\u0131ramaz veya uygulamadan kaynak kodunu elde etmeye \xE7al\u0131\u015Famazs\u0131n\u0131z. Ayr\u0131ca, Hizmetleri do\u011Frudan NEXUS ile rekabet eden herhangi bir \xFCr\xFCn veya hizmet olu\u015Fturmak i\xE7in kullanamaz ve yaz\u0131l\u0131mdaki herhangi bir hatay\u0131 veya g\xFCvenlik a\xE7\u0131\u011F\u0131n\u0131 istismar edemezsiniz.</p>
<h3>Kullan\u0131c\u0131 Sorumluluklar\u0131</h3>
<p>Ev a\u011F\u0131n\u0131z\u0131n, cihazlar\u0131n\u0131z\u0131n ve NEXUS hesap kimlik bilgilerinizin g\xFCvenli\u011Fini sa\u011Flamaktan yaln\u0131zca siz sorumlusunuz. NEXUS yerel olarak \xE7al\u0131\u015F\u0131r ve kendi a\u011F altyap\u0131n\u0131z\u0131n g\xFCvenli\u011Fine dayan\u0131r. G\xFC\xE7l\xFC parolalar kullanman\u0131z\u0131 ve y\xF6nlendiricinizin (router) donan\u0131m yaz\u0131l\u0131m\u0131n\u0131n g\xFCncel oldu\u011Fundan emin olman\u0131z\u0131 \u015Fiddetle tavsiye ederiz.</p>
<h3>Garanti Reddi</h3>
<p>NEXUS, ticari elveri\u015Flilik, belirli bir amaca uygunluk veya ihlal etmeme gibi z\u0131mni garantiler dahil ancak bunlarla s\u0131n\u0131rl\u0131 olmamak \xFCzere, a\xE7\u0131k veya z\u0131mni hi\xE7bir t\xFCr garanti olmaks\u0131z\u0131n "oldu\u011Fu gibi" ve "mevcut oldu\u011Fu gibi" esas\u0131na g\xF6re sa\u011Flan\u0131r. Yaz\u0131l\u0131m\u0131n her zaman hatas\u0131z, kesintisiz veya g\xFCvenli olaca\u011F\u0131n\u0131 garanti etmiyoruz.</p>
<h3>Sorumlulu\u011Fun S\u0131n\u0131rland\u0131r\u0131lmas\u0131</h3>
<p>Yasalar\u0131n izin verdi\u011Fi azami \xF6l\xE7\xFCde, NEXUS, geli\u015Ftiricileri veya ba\u011Fl\u0131 kurulu\u015Flar\u0131, bu t\xFCr hasarlar\u0131n olas\u0131l\u0131\u011F\u0131 konusunda bilgilendirilmi\u015F olsalar dahi, Hizmetleri kullanman\u0131zdan veya kullanamaman\u0131zdan kaynaklanan veya bununla ba\u011Flant\u0131l\u0131 olan herhangi bir do\u011Frudan, dolayl\u0131, ar\u0131zi, \xF6zel, sonu\xE7 olarak ortaya \xE7\u0131kan veya cezai hasarlardan (veri kayb\u0131, m\xFClk hasar\u0131 veya g\xFCvenlik ihlalleri dahil) hi\xE7bir durumda sorumlu tutulamaz.</p>
<h3>Ge\xE7erli Kanun ve G\xFCncellemeler</h3>
<p>Bu ko\u015Fullar, ana faaliyetlerimizin bulundu\u011Fu yarg\u0131 b\xF6lgesinin yasalar\u0131na tabi olacakt\u0131r. Bu Ko\u015Fullar\u0131 herhangi bir zamanda de\u011Fi\u015Ftirme veya yenileme hakk\u0131m\u0131z\u0131 sakl\u0131 tutuyoruz. \xD6nemli de\u011Fi\u015Fiklikler uygulamam\u0131z veya web sitemiz arac\u0131l\u0131\u011F\u0131yla iletilecektir. Herhangi bir de\u011Fi\u015Fikli\u011Fin yay\u0131nlanmas\u0131n\u0131n ard\u0131ndan NEXUS'u kullanmaya devam etmeniz, s\xF6z konusu de\u011Fi\u015Fiklikleri kabul etti\u011Finiz anlam\u0131na gelir.</p>`
    }
  };
  const lang = locale === "tr" ? "tr" : "en";
  const title = titles[page][lang];
  const content = contents[page][lang];
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t2.color.primary)}" />
<meta name="theme-color" content="${t2.color.bg}" />
<style>${renderStyles(t2)}${legalPageCss()}</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${lang === "tr" ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="legal-content">
<h1>${escapeHtml(title)}</h1>
<p class="legal-updated">${lang === "tr" ? "Son g\xFCncelleme: Temmuz 2026" : "Last updated: July 2026"}</p>
${content}
</main>
${renderRichFooter(t2.color.primary)}
</body>
</html>`;
}
function legalPageCss() {
  return `
.legal-content { max-width: 720px; margin: 0 auto; padding: 100px 24px 60px; }
.legal-content h1 { font-size: 36px; letter-spacing: -0.02em; margin: 0 0 8px; color: var(--text); }
.legal-content h2 { font-size: 24px; margin: 40px 0 12px; color: var(--text); }
.legal-content h3 { font-size: 17px; margin: 24px 0 8px; color: var(--text); }
.legal-content p { font-size: 15px; color: var(--muted); line-height: 1.7; margin: 0 0 16px; }
.legal-content a { color: var(--primary); text-decoration: underline; }
.legal-updated { font-size: 12px; color: var(--muted); margin-bottom: 32px; opacity: 0.7; }
`.trim();
}
function renderAboutPage(locale, theme = "dark") {
  setLocale(locale);
  const t2 = getTheme(theme);
  const isTr = locale === "tr";
  const title = isTr ? "NEXUS Hakk\u0131nda" : "About NEXUS";
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t2.color.primary)}" />
<meta name="theme-color" content="${t2.color.bg}" />
<style>${renderStyles(t2)}${legalPageCss()}</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${isTr ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="legal-content">
<h1>${escapeHtml(title)}</h1>
<p class="legal-updated">${isTr ? "Ki\u015Fisel Ak\u0131ll\u0131 Ev \u0130\u015Fletim Sistemi" : "The Personal Operating System for Your Smart Home"}</p>

<h2>${isTr ? "Hikayemiz" : "Our Story"}</h2>
<p>${isTr ? "NEXUS, ak\u0131ll\u0131 ev teknolojilerinin karma\u015F\u0131kl\u0131\u011F\u0131na, bulut ba\u011F\u0131ml\u0131l\u0131\u011F\u0131na ve gizlilik endi\u015Felerine bir tepki olarak do\u011Fdu. Bulut sunucular\u0131 \xE7\xF6kt\xFC\u011F\xFCnde \u0131\u015F\u0131klar\u0131n\u0131z\u0131 bile kapatamad\u0131\u011F\u0131n\u0131z g\xFCnleri geride b\u0131rakmak istedik. Sadece sizin kontrol\xFCn\xFCzde olan, yerel donan\u0131m\u0131n\u0131z\u0131n g\xFCc\xFCn\xFC kullanan ve verilerinizi d\u0131\u015F d\xFCnyayla payla\u015Fmayan bir sistem hayal ettik ve NEXUS'u in\u015Fa ettik." : "NEXUS was born out of frustration with the complexity, cloud dependency, and privacy concerns of modern smart home technology. We wanted to leave behind the days when you couldn't even turn off your lights because a cloud server went down. We envisioned and built NEXUS\u2014a system entirely under your control, harnessing the power of your local hardware without sharing your data with the outside world."}</p>

<h2>${isTr ? "Misyonumuz" : "Our Mission"}</h2>
<p>${isTr ? "NEXUS, ak\u0131ll\u0131 ev otomasyonunu tamamen yerel, g\xFCvenli ve gizlilik odakl\u0131 bir deneyime d\xF6n\xFC\u015Ft\xFCrmek i\xE7in tasarlanm\u0131\u015Ft\u0131r. Amac\u0131m\u0131z, teknolojiyi g\xF6r\xFCnmez ama her zaman yan\u0131n\u0131zda olan g\xFCvenilir bir yard\u0131mc\u0131ya d\xF6n\xFC\u015Ft\xFCrmektir. Verilerinizin, ailenizin ve evinizin kontrol\xFC %100 sizdedir." : "NEXUS is designed to transform smart home automation into a completely local, secure, and privacy-first experience. Our goal is to make technology an invisible yet reliable assistant that is always there for you. You retain 100% control over your data, your family, and your home."}</p>

<h2>${isTr ? "Neden Biz?" : "Why Us?"}</h2>
<p>${isTr ? "\xC7\xFCnk\xFC biz de sizin gibi kullan\u0131c\u0131y\u0131z. Pazardaki \xE7o\u011Fu \xE7\xF6z\xFCm, sizi kendi ekosistemlerine kilitlemek ve verileriniz \xFCzerinden gelir elde etmek \xFCzerine kuruluyken, biz size tam bir \xF6zg\xFCrl\xFCk sunuyoruz. A\xE7\u0131k standartlar\u0131 (Matter, Zigbee, Z-Wave vb.) destekliyor, cihazlar\u0131n\u0131z\u0131 bir platforma ba\u011Flamak zorunda kalmadan kendi a\u011F\u0131n\u0131zda yerel olarak y\xF6netmenizi sa\u011Fl\u0131yoruz." : "Because we are users just like you. While most market solutions are built to lock you into their ecosystems and monetize your data, we offer you complete freedom. We support open standards (Matter, Zigbee, Z-Wave, etc.) and allow you to manage your devices locally on your own network without being forced to tether them to an external platform."}</p>

<h2>${isTr ? "Gelecek Vizyonumuz" : "Our Future Vision"}</h2>
<p>${isTr ? "Yapay zeka modellerinin do\u011Frudan kendi sunucunuzda (Edge AI) \xE7al\u0131\u015Ft\u0131r\u0131larak evinizi tam anlam\u0131yla tan\u0131d\u0131\u011F\u0131, al\u0131\u015Fkanl\u0131klar\u0131n\u0131za g\xF6re proaktif olarak hareket eden ancak hi\xE7bir veriyi d\u0131\u015Far\u0131 s\u0131zd\u0131rmayan otonom evler in\u015Fa etmek istiyoruz. Her ge\xE7en g\xFCn platformumuza yeni entegrasyonlar, a\xE7\u0131k kaynakl\u0131 eklentiler ve geli\u015Fmi\u015F otomasyon rutinleri eklemeye devam ediyoruz." : "We want to build autonomous homes where AI models run directly on your own server (Edge AI), truly understanding your home and proactively acting on your habits without leaking any data. Every day, we continue to add new integrations, open-source plugins, and advanced automation routines to our platform."}</p>

<h2>${isTr ? "Ekibimiz" : "Our Team"}</h2>
<p>${isTr ? "NEXUS, d\xFCnyan\u0131n d\xF6rt bir yan\u0131ndan gelen teknoloji merakl\u0131lar\u0131, m\xFChendisler ve tasar\u0131mc\u0131lar\u0131n ortak bir tutkuyla bir araya geldi\u011Fi bir ekiptir. Uzaktan \xE7al\u0131\u015Fan da\u011F\u0131t\u0131k bir yap\u0131ya sahibiz ve g\xFCc\xFCm\xFCz\xFC toplulu\u011Fumuzdan al\u0131yoruz. Siz de bu devrimin bir par\xE7as\u0131 olmak istiyorsan\u0131z, bize kat\u0131l\u0131n!" : "NEXUS is a team of technology enthusiasts, engineers, and designers from around the world brought together by a shared passion. We have a distributed, remote structure and draw our strength from our community. If you want to be part of this revolution, join us!"}</p>
</main>
${renderRichFooter(t2.color.primary)}
</body>
</html>`;
}
function renderStoreDocument(options = {}) {
  const theme = options.theme ?? "dark";
  const locale = options.locale ?? "en";
  setLocale(locale);
  const t2 = getTheme(theme);
  const isTr = locale === "tr";
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NEXUS AI \u2014 App Store & Play Store</title>
<link rel="icon" href="${faviconDataUri(t2.color.primary)}" />
<meta name="theme-color" content="${t2.color.bg}" />
<style>${renderStyles(t2)}
.store-container { max-width: 860px; margin: 0 auto; padding: 40px 24px 80px; }
.store-header { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 32px; }
.store-icon { width: 100px; height: 100px; border-radius: 22px; background: var(--surface); border: 1px solid var(--border-strong); display: flex; align-items: center; justify-content: center; box-shadow: var(--elev); flex: none; }
.store-meta { flex: 1; }
.store-title { font-size: 28px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.02em; }
.store-subtitle { font-size: 15px; color: var(--muted); margin: 0 0 16px; }
.store-stats { display: flex; gap: 24px; padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.stat-item { display: flex; flex-direction: column; }
.stat-item .val { font-weight: 800; font-size: 16px; color: var(--text); }
.stat-item .lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; margin-top: 2px; }
.store-cta { display: flex; gap: 12px; }
.store-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--tint); color: var(--primary); text-transform: uppercase; display: inline-block; margin-bottom: 8px; }
.store-screenshots { display: flex; gap: 14px; overflow-x: auto; padding: 12px 0 24px; margin-bottom: 32px; }
.screen-mock { width: 200px; height: 380px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; flex: none; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${isTr ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="store-container">
<span class="store-badge">${isTr ? "\xD6ne \xC7\u0131kan Uygulama" : "Featured App"}</span>
<div class="store-header">
  <div class="store-icon">${renderLogo(t2.color.primary)}</div>
  <div class="store-meta">
    <h1 class="store-title">NEXUS AI</h1>
    <div class="store-subtitle">${isTr ? "Ki\u015Fisel \u0130\u015Fletim Sistemi & Ak\u0131ll\u0131 Ev Asistan\u0131" : "Personal Operating System & Smart Home AI"}</div>
    <div class="store-stats">
      <div class="stat-item"><span class="val">4.9 \u2605</span><span class="lbl">12.4K ${isTr ? "De\u011Ferlendirme" : "Ratings"}</span></div>
      <div class="stat-item"><span class="val">#1</span><span class="lbl">${isTr ? "Ev Otomasyonu" : "Smart Home"}</span></div>
      <div class="stat-item"><span class="val">4+</span><span class="lbl">${isTr ? "Ya\u015F S\u0131n\u0131r\u0131" : "Age Rating"}</span></div>
      <div class="stat-item"><span class="val">100%</span><span class="lbl">${isTr ? "Gizlilik Odakl\u0131" : "Private"}</span></div>
    </div>
    <div class="store-cta">
      <a href="/downloads" class="btn primary">${isTr ? "\u0130ndir / Y\xFCkle" : "Get / Install"}</a>
      <a href="/preview/mobile" class="btn">${isTr ? "Mobil \xD6nizleme" : "Mobile Preview"}</a>
    </div>
  </div>
</div>
<h2>${isTr ? "Ekran G\xF6r\xFCnt\xFCleri" : "Screenshots"}</h2>
<div class="store-screenshots">
  <div class="screen-mock"><div style="font-weight:700;font-size:14px;">Today Dashboard</div><div style="font-size:12px;color:var(--muted);">19.4 kWh \xB7 99.98% Uptime</div><div style="font-size:10px;color:var(--primary);font-weight:700;">NEXUS AI ACTIVE</div></div>
  <div class="screen-mock"><div style="font-weight:700;font-size:14px;">Smart Devices</div><div style="font-size:12px;color:var(--muted);">Philips Hue \xB7 LG C3 OLED</div><div style="font-size:10px;color:#10b981;font-weight:700;">6 ONLINE</div></div>
  <div class="screen-mock"><div style="font-weight:700;font-size:14px;">Family & Sync</div><div style="font-size:12px;color:var(--muted);">Multi-user control</div><div style="font-size:10px;color:var(--primary);font-weight:700;">3 OS SYNC</div></div>
</div>
<h2>${isTr ? "A\xE7\u0131klama" : "Description"}</h2>
<p style="color:var(--muted);line-height:1.7;font-size:15px;">
${isTr ? "NEXUS AI, ak\u0131ll\u0131 evinizi ve ki\u015Fisel otomasyonlar\u0131n\u0131z\u0131 internet ba\u011F\u0131ml\u0131l\u0131\u011F\u0131 olmadan yerel olarak y\xF6neten ses odakl\u0131 ki\u015Fisel i\u015Fletim sistemidir. Gizlili\u011Finizi %100 korurken, cihazlar\u0131n\u0131z\u0131 ve senaryolar\u0131n\u0131z\u0131 an\u0131nda senkronize eder." : "NEXUS AI is a voice-first, privacy-focused personal operating system that controls your smart home, learns your routines, and works across iOS, Android, Windows, macOS, and Linux with zero external cloud dependencies."}
</p>
</main>
${renderRichFooter(t2.color.primary)}
</body>
</html>`;
}

// src/oauth.ts
var OAUTH_PROVIDERS = [
  { id: "google", labelKey: "auth.social.google" },
  { id: "apple", labelKey: "auth.social.apple" }
];
function trimmed(v) {
  return (v ?? "").trim();
}
function resolveBaseUrl(env) {
  const explicit = trimmed(env.OAUTH_BASE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  const port2 = trimmed(env.PORT) || "4178";
  return `http://localhost:${port2}`;
}
function buildOAuthRegistry(env = process.env) {
  const baseUrl = resolveBaseUrl(env);
  const providers = /* @__PURE__ */ new Map();
  const googleId = trimmed(env.GOOGLE_CLIENT_ID);
  const googleSecret = trimmed(env.GOOGLE_CLIENT_SECRET);
  if (googleId && googleSecret) {
    providers.set(
      "google",
      new GoogleAuthProvider({
        clientId: googleId,
        clientSecret: googleSecret,
        redirectUri: `${baseUrl}/api/oauth/google/callback`
      })
    );
  }
  const appleId = trimmed(env.APPLE_CLIENT_ID);
  const appleTeam = trimmed(env.APPLE_TEAM_ID);
  const appleKeyId = trimmed(env.APPLE_KEY_ID);
  const applePrivateKey = trimmed(env.APPLE_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (appleId && appleTeam && appleKeyId && applePrivateKey) {
    providers.set(
      "apple",
      new AppleAuthProvider({
        clientId: appleId,
        teamId: appleTeam,
        keyId: appleKeyId,
        privateKey: applePrivateKey,
        redirectUri: `${baseUrl}/api/oauth/apple/callback`
      })
    );
  }
  return {
    get: (id) => providers.get(id),
    isConfigured: (id) => providers.has(id)
  };
}

// src/command.ts
var MAX_BODY = 64 * 1024;
async function readJsonBody(req) {
  return await new Promise((resolve3, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve3({});
      try {
        resolve3(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  if (!res.headersSent) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  }
  res.end(text);
}
async function handleCommandApi(req, res, core, userId, confirm, suggestionEngine, userDataStore) {
  const body = await readJsonBody(req);
  const utterance = String(body.utterance ?? "");
  const response = await core.handle(userId, utterance, { confirm });
  if (suggestionEngine && userDataStore) {
    const data = userDataStore.get(userId);
    if (data) {
      const testTime = Array.isArray(req.headers["x-test-time"]) ? req.headers["x-test-time"][0] : req.headers["x-test-time"];
      let at = testTime;
      if (!at) {
        const now = /* @__PURE__ */ new Date();
        at = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      }
      for (const step of response.executed) {
        suggestionEngine.observe({ action: step.action, at });
      }
      const newSuggestions = suggestionEngine.suggest();
      let changed = false;
      let suggestions = [...data.suggestions];
      for (const s of newSuggestions) {
        if (!suggestions.some((ex) => ex.id === s.signature) && !data.routines.some((r) => r.name === s.proposal.name)) {
          suggestions.push({
            id: s.signature,
            text: s.proposal.name,
            at: s.at
          });
          changed = true;
        }
      }
      if (changed) {
        userDataStore.set(userId, { ...data, suggestions });
      }
    }
  }
  sendJson(res, 200, response);
}

// src/app.ts
var SESSION_COOKIE = "nx_session";
var LANG_COOKIE = "nx_lang";
var MAX_BODY2 = 64 * 1024;
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".exe": "application/vnd.microsoft.portable-executable",
  ".dmg": "application/x-apple-diskimage",
  ".appimage": "application/x-executable"
};
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
function setCookie(res, name, value, maxAgeSec) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`
  ];
  appendHeader(res, "Set-Cookie", parts.join("; "));
}
function clearCookie(res, name) {
  appendHeader(res, "Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
var OAUTH_COOKIES = [
  "nx_oauth_state",
  "nx_oauth_pkce",
  "nx_oauth_nonce",
  "nx_oauth_provider"
];
function setOAuthCookie(res, name, value) {
  appendHeader(
    res,
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
}
function clearOAuthCookies(res) {
  for (const name of OAUTH_COOKIES) clearCookie(res, name);
}
function appendHeader(res, name, value) {
  const existing = res.getHeader(name);
  if (existing === void 0) res.setHeader(name, value);
  else if (Array.isArray(existing)) res.setHeader(name, [...existing, value]);
  else res.setHeader(name, [String(existing), value]);
}
function sendJson2(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(text);
}
function sendHtml(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
async function readJsonBody2(req) {
  return await new Promise((resolve3, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY2) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve3({});
      try {
        resolve3(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
async function readFormBody(req) {
  return await new Promise((resolve3, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY2) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const params = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
      resolve3(Object.fromEntries(params));
    });
    req.on("error", reject);
  });
}
function isLocale(v) {
  return SUPPORTED_LOCALES.includes(v);
}
function resolveLocale(url, cookies, acceptLanguage) {
  const q = url.searchParams.get("lang");
  if (q && isLocale(q)) return q;
  const c = cookies[LANG_COOKIE];
  if (c && isLocale(c)) return c;
  return resolveFromAcceptLanguage(acceptLanguage);
}
async function serveStatic(res, root, urlPath) {
  const ext = (0, import_node_path4.extname)(urlPath).toLowerCase();
  if (!ext || !(ext in MIME)) return false;
  const rel = (0, import_node_path4.normalize)(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const abs = (0, import_node_path4.join)(root, rel);
  if (!abs.startsWith(root + import_node_path4.sep) && abs !== root) return false;
  try {
    const info = await (0, import_promises.stat)(abs);
    if (!info.isFile()) return false;
    const headers = {
      "Content-Type": MIME[ext] ?? "application/octet-stream"
    };
    if (ext === ".exe" || ext === ".dmg" || ext === ".appimage") {
      headers["Content-Disposition"] = `attachment; filename="${rel.split("/").pop() ?? "download"}"`;
    }
    res.writeHead(200, headers);
    res.end(await (0, import_promises.readFile)(abs));
    return true;
  } catch {
    return false;
  }
}
function isMobileUserAgent(ua) {
  return /Android|iPhone|iPod|iPad|Mobile|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
    ua
  );
}
function isDesktopUserAgent(ua) {
  return /Electron|NexusDesktop/i.test(ua);
}
var SERVICE_WORKER = `
var CACHE = "nexus-shell-v1";
var SHELL = ["/", "/app", "/login", "/manifest.webmanifest", "/icon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function(){}); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.url.indexOf("/api/") >= 0) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function(){}); });
      return res;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match("/"); }); })
  );
});
`.trim();
function createRequestHandler(deps) {
  const { accounts, userData, staticRoot: staticRoot2, oauth, core } = deps;
  const rateLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60 * 1e3 });
  const lockout = new LoginLockout();
  const telemetry = deps.telemetry ?? new TelemetryService({
    optIn: true,
    sink: (e) => console.log(`[Telemetry] ${e.type}`, e.payload ?? "")
  });
  const suggestionEngine = new RoutineSuggestionEngine({ threshold: 3 });
  return (req, res) => {
    handle(req, res).catch((err) => {
      if (!res.headersSent) sendJson2(res, 500, { error: "Internal server error" });
      else res.end();
      console.error("[nexus/server]", err);
    });
  };
  async function handle(req, res) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;
    const method = req.method ?? "GET";
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    const account = token ? accounts.validateSession(token) : void 0;
    res.setHeader("X-Content-Type-Options", "nosniff");
    const isEmbeddableDemoPath = path === "/desktop" || path === "/desktop/light" || path === "/mobile" || path === "/mobile/light" || path.startsWith("/preview/");
    res.setHeader("X-Frame-Options", isEmbeddableDemoPath ? "SAMEORIGIN" : "DENY");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'"
    );
    if (path === "/health" && method === "GET") {
      if (req.socket.remoteAddress && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress)) {
        return sendJson2(res, 403, { error: "Forbidden" });
      }
      return sendJson2(res, 200, { ok: true, service: "nexus-local-core", version: "3.14.2" });
    }
    if (path === "/api/register" && method === "POST") {
      const body = await readJsonBody2(req);
      const email = String(body.email ?? "");
      const password = String(body.password ?? "");
      const locale = localeFrom(cookies, req);
      const rl = rateLimiter.check(email);
      if (!rl.allowed) {
        return sendJson2(res, 429, { error: translate(locale, "auth.rateLimited") });
      }
      try {
        const created = accounts.register({ email, password, role: "admin" });
        const session = accounts.login(email, password);
        setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
        userData.ensure(created.id, created.email, locale);
        return sendJson2(res, 201, { user: publicUser(created) });
      } catch (err) {
        return sendJson2(res, 400, { error: authMessage(err) });
      }
    }
    if (path === "/api/login" && method === "POST") {
      const body = await readJsonBody2(req);
      const email = String(body.email ?? "");
      const password = String(body.password ?? "");
      const locale = localeFrom(cookies, req);
      const rl = rateLimiter.check(email);
      if (!rl.allowed) {
        return sendJson2(res, 429, { error: translate(locale, "auth.rateLimited") });
      }
      const lo = lockout.isLocked(email);
      if (lo.locked) {
        const time = Math.ceil((lo.remainingMs ?? 0) / 1e3) + "s";
        return sendJson2(res, 423, { error: translate(locale, "auth.locked", { time }) });
      }
      try {
        const session = accounts.login(email, password);
        lockout.recordSuccess(email);
        const user = accounts.validateSession(session.token);
        setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
        userData.ensure(user.id, user.email, locale);
        return sendJson2(res, 200, { user: publicUser(user) });
      } catch (err) {
        lockout.recordFailure(email);
        return sendJson2(res, 401, { error: authMessage(err) });
      }
    }
    if (path === "/api/logout" && method === "POST") {
      if (token) accounts.logout(token);
      clearCookie(res, SESSION_COOKIE);
      return sendJson2(res, 200, { ok: true });
    }
    if (path === "/api/guest" && method === "POST") {
      const session = accounts.loginAsGuest();
      const user = accounts.validateSession(session.token);
      setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
      userData.ensure(user.id, user.email, localeFrom(cookies, req));
      return sendJson2(res, 200, { user: publicUser(user) });
    }
    const startMatch = /^\/api\/oauth\/([a-z]+)\/start$/.exec(path);
    if (startMatch && method === "GET") {
      const id = startMatch[1] ?? "";
      const known = OAUTH_PROVIDERS.some((p) => p.id === id);
      const provider = known ? oauth?.get(id) : void 0;
      if (!provider) return redirect(res, "/login?oauth=unavailable");
      const state = generateState();
      const nonce = generateNonce();
      const { verifier, challenge } = generatePkce();
      setOAuthCookie(res, "nx_oauth_state", state);
      setOAuthCookie(res, "nx_oauth_pkce", verifier);
      setOAuthCookie(res, "nx_oauth_nonce", nonce);
      setOAuthCookie(res, "nx_oauth_provider", id);
      return redirect(res, provider.authorizeUrl(state, challenge, nonce));
    }
    const cbMatch = /^\/api\/oauth\/([a-z]+)\/callback$/.exec(path);
    if (cbMatch && (method === "GET" || method === "POST")) {
      const id = cbMatch[1] ?? "";
      const provider = oauth?.get(id);
      const params = method === "POST" ? await readFormBody(req) : Object.fromEntries(url.searchParams);
      const code = String(params.code ?? "");
      const returnedState = String(params.state ?? "");
      const savedState = cookies["nx_oauth_state"];
      const verifier = cookies["nx_oauth_pkce"] ?? "";
      const savedProvider = cookies["nx_oauth_provider"];
      clearOAuthCookies(res);
      if (!provider || !code || !savedState || returnedState !== savedState || savedProvider !== id) {
        return redirect(res, "/login?oauth=error");
      }
      try {
        const profile = await provider.exchange(code, verifier);
        const session = accounts.loginWithProvider(profile, provider);
        const user = accounts.validateSession(session.token);
        setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
        userData.ensure(user.id, user.email, localeFrom(cookies, req));
        return redirect(res, "/app");
      } catch {
        return redirect(res, "/login?oauth=error");
      }
    }
    if (path === "/api/me" && method === "GET") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      return sendJson2(res, 200, { user: publicUser(account) });
    }
    if (path === "/api/command" && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      return handleCommandApi(req, res, deps.core, account.id, false, suggestionEngine, userData);
    }
    if (path === "/api/command/confirm" && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      return handleCommandApi(req, res, deps.core, account.id, true, suggestionEngine, userData);
    }
    const acceptMatch = path.match(/^\/api\/suggestions\/([^/]+)\/accept$/);
    if (acceptMatch && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      const id = decodeURIComponent(acceptMatch[1]);
      const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      const sigIndex = data.suggestions.findIndex((s) => s.id === id);
      if (sigIndex > -1) {
        const suggestion = data.suggestions[sigIndex];
        const updatedData = {
          ...data,
          suggestions: data.suggestions.filter((s) => s.id !== id),
          routines: [
            ...data.routines,
            {
              id: Math.random().toString(36).slice(2),
              name: suggestion.text,
              usageCount: 0
            }
          ]
        };
        userData.set(account.id, updatedData);
      }
      return sendJson2(res, 200, { success: true });
    }
    const dismissMatch = path.match(/^\/api\/suggestions\/([^/]+)\/dismiss$/);
    if (dismissMatch && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      const id = decodeURIComponent(dismissMatch[1]);
      const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      const sigIndex = data.suggestions.findIndex((s) => s.id === id);
      if (sigIndex > -1) {
        const updatedData = {
          ...data,
          suggestions: data.suggestions.filter((s) => s.id !== id)
        };
        userData.set(account.id, updatedData);
        suggestionEngine.dismiss(id);
      }
      return sendJson2(res, 200, { success: true });
    }
    if (path === "/api/billing/subscribe" && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.billing) return sendJson2(res, 501, { error: "Billing not enabled" });
      const body = await readJsonBody2(req);
      const plan = String(body.plan ?? "free");
      try {
        let sub = deps.billing.get(account.id);
        if (!sub) sub = deps.billing.subscribe(account.id, plan);
        else sub = deps.billing.changePlan(account.id, plan);
        const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
        userData.patch(account.id, account.email, data.language, { plan });
        return sendJson2(res, 200, { ok: true, sub });
      } catch (err) {
        return sendJson2(res, 400, { error: err.message });
      }
    }
    if (path === "/api/billing/cancel" && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.billing) return sendJson2(res, 501, { error: "Billing not enabled" });
      try {
        deps.billing.cancel(account.id);
        const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
        userData.patch(account.id, account.email, data.language, { plan: "free" });
        return sendJson2(res, 200, { ok: true });
      } catch (err) {
        return sendJson2(res, 400, { error: err.message });
      }
    }
    if (path === "/api/legal/tos" && method === "GET") {
      if (!deps.legal) return sendJson2(res, 501, { error: "Legal not enabled" });
      const locale = localeFrom(cookies, req);
      return sendJson2(res, 200, { text: deps.legal.getTermsOfService(locale) });
    }
    if (path === "/api/legal/privacy" && method === "GET") {
      if (!deps.legal) return sendJson2(res, 501, { error: "Legal not enabled" });
      const locale = localeFrom(cookies, req);
      return sendJson2(res, 200, { text: deps.legal.getPrivacyPolicy(locale) });
    }
    if (path === "/api/support/ticket" && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.support) return sendJson2(res, 501, { error: "Support not enabled" });
      const body = await readJsonBody2(req);
      if (!body || !body.subject || !body.message)
        return sendJson2(res, 400, { error: "Missing subject or message" });
      const ticket = deps.support.createTicket(
        account.email,
        body.subject,
        body.message
      );
      return sendJson2(res, 200, ticket);
    }
    if (path === "/api/support/tickets" && method === "GET") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.support) return sendJson2(res, 501, { error: "Support not enabled" });
      return sendJson2(res, 200, { tickets: deps.support.getTickets(account.email) });
    }
    if (path === "/api/platform/info" && method === "GET") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.platform) return sendJson2(res, 501, { error: "Platform not enabled" });
      return sendJson2(res, 200, deps.platform.getSystemInfo());
    }
    if (path === "/api/platform/notify" && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.platform) return sendJson2(res, 501, { error: "Platform not enabled" });
      const body = await readJsonBody2(req);
      if (!body || !body.title || !body.message)
        return sendJson2(res, 400, { error: "Missing title or message" });
      deps.platform.showNotification(body.title, body.message);
      return sendJson2(res, 200, { ok: true });
    }
    if (path === "/api/data") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      if (method === "GET") return sendJson2(res, 200, { data });
      if (method === "PUT") {
        const body = await readJsonBody2(req);
        const next = userData.patch(account.id, account.email, data.language, sanitizePatch(body));
        return sendJson2(res, 200, { data: next });
      }
      return sendJson2(res, 405, { error: "Method not allowed" });
    }
    if (path === "/api/store/catalog" && method === "GET") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.connectors) return sendJson2(res, 501, { error: "Store not enabled" });
      const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      return sendJson2(res, 200, { catalog: deps.connectors.catalog(data.plan) });
    }
    const installMatch = path.match(/^\/api\/store\/([^/]+)\/install$/);
    if (installMatch && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.connectors) return sendJson2(res, 501, { error: "Store not enabled" });
      const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      try {
        deps.connectors.install(installMatch[1], data.plan);
        return sendJson2(res, 200, { ok: true });
      } catch (err) {
        return sendJson2(res, 400, { error: err.message });
      }
    }
    const uninstallMatch = path.match(/^\/api\/store\/([^/]+)\/uninstall$/);
    if (uninstallMatch && method === "POST") {
      if (!account) return sendJson2(res, 401, { error: "Not signed in" });
      if (!deps.connectors) return sendJson2(res, 501, { error: "Store not enabled" });
      try {
        deps.connectors.uninstall(uninstallMatch[1]);
        return sendJson2(res, 200, { ok: true });
      } catch (err) {
        return sendJson2(res, 400, { error: err.message });
      }
    }
    if (method === "POST" && path === "/api/telemetry") {
      const body = await readJsonBody2(req);
      if (!body || typeof body !== "object" || !("type" in body)) {
        return sendJson2(res, 400, { error: "Invalid telemetry payload" });
      }
      telemetry.track(
        body.type,
        body.payload
      );
      return sendJson2(res, 200, { ok: true });
    }
    if (method === "POST" && path === "/api/devices/usage") {
      if (!account) return sendJson2(res, 401, { error: "Unauthorized" });
      const entries = await readJsonBody2(req);
      if (!Array.isArray(entries)) {
        return sendJson2(res, 400, { error: "Expected an array of UsageEntry" });
      }
      const summary = summarizeUsage(entries);
      const user = userData.get(account.id);
      if (user) {
        userData.set(account.id, {
          ...user,
          energyWhToday: user.energyWhToday + summary.totalEnergyWh
        });
      }
      return sendJson2(res, 200, { ok: true, summary });
    }
    if (method === "GET" && (path.startsWith("/downloads/") || (0, import_node_path4.extname)(path))) {
      if (staticRoot2) {
        const served = await serveStatic(res, staticRoot2, path);
        if (served) return;
      }
      const ext = (0, import_node_path4.extname)(path).toLowerCase();
      if (ext === ".exe" || ext === ".dmg" || ext === ".appimage" || path.startsWith("/downloads/")) {
        const filename = path.split("/").pop() ?? "download";
        let cType = "application/octet-stream";
        if (ext === ".exe") cType = "application/x-msdownload";
        else if (ext === ".dmg") cType = "application/x-apple-diskimage";
        const prefix = ext === ".exe" ? "MZ\x90\0\0\0\0\0\0\0\xFF\xFF\0\0" : "";
        const version = /(\d+\.\d+\.\d+)/.exec(filename)?.[1] ?? "3.14.2";
        const dummyPayload = Buffer.from(prefix + `

NEXUS Installer Binary for ${filename}
Version ${version}
`);
        res.writeHead(200, {
          "Content-Type": cType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(dummyPayload.length)
        });
        res.end(dummyPayload);
        return;
      }
    }
    if (path === "/login" && method === "GET") {
      if (account) return redirect(res, "/app");
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      persistLang(res, url, locale);
      const oauthNotice = url.searchParams.get("oauth");
      const notice = oauthNotice === "unavailable" || oauthNotice === "error" ? oauthNotice : void 0;
      const configuredProviders = OAUTH_PROVIDERS;
      return sendHtml(
        res,
        200,
        renderLoginDocument(locale, { providers: configuredProviders, notice })
      );
    }
    if (path === "/" && method === "GET") {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      persistLang(res, url, locale);
      const ua = String(req.headers["user-agent"] ?? "");
      return sendHtml(res, 200, renderMarketingDocument(locale, ua));
    }
    const injectMockupStyles = (html, p) => {
      if (!p.startsWith("/preview/")) return html;
      return html.replace("</head>", "<style>::-webkit-scrollbar { display: none; } * { -ms-overflow-style: none; scrollbar-width: none; }</style></head>");
    };
    if (method === "GET" && (path === "/mobile" || path === "/preview/mobile")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, injectMockupStyles(renderMobileDocument({ theme: "dark", locale }), path));
    }
    if (method === "GET" && (path === "/mobile/light" || path === "/preview/mobile/light")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, injectMockupStyles(renderMobileDocument({ theme: "light", locale }), path));
    }
    if (method === "GET" && (path === "/desktop" || path === "/preview/desktop")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, injectMockupStyles(renderDesktopDocument({ theme: "dark", locale }), path));
    }
    if (method === "GET" && (path === "/desktop/light" || path === "/preview/desktop/light")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, injectMockupStyles(renderDesktopDocument({ theme: "light", locale }), path));
    }
    if (method === "GET" && (path === "/installer" || path === "/preview/installer")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderSetupDocument({ theme: "dark", locale }));
    }
    if (method === "GET" && (path === "/installer/light" || path === "/preview/installer/light")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderSetupDocument({ theme: "light", locale }));
    }
    if (method === "GET" && (path === "/store" || path === "/preview/store")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderStoreDocument({ theme: "dark", locale }));
    }
    if (method === "GET" && (path === "/store/light" || path === "/preview/store/light")) {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderStoreDocument({ theme: "light", locale }));
    }
    if (path === "/privacy" && method === "GET") {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderLegalPage(locale, "dark", "privacy"));
    }
    if (path === "/terms" && method === "GET") {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderLegalPage(locale, "dark", "terms"));
    }
    if (path === "/about" && method === "GET") {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      return sendHtml(res, 200, renderAboutPage(locale, "dark"));
    }
    if (path === "/app" && method === "GET") {
      if (!account) return redirect(res, "/login");
      let data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      const q = url.searchParams.get("lang");
      if (q && isLocale(q) && q !== data.language) {
        data = userData.patch(account.id, account.email, data.language, { language: q });
        setCookie(res, LANG_COOKIE, q, 60 * 60 * 24 * 365);
        return redirect(res, "/app");
      }
      const ua = String(req.headers["user-agent"] ?? "");
      const html = isDesktopUserAgent(ua) ? renderDesktopAppDocument(account, data) : isMobileUserAgent(ua) ? renderMobileAppDocument(account, data) : renderAppDocument(account, data, ua);
      return sendHtml(res, 200, html);
    }
    if (path === "/sw.js" && method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
        "Service-Worker-Allowed": "/"
      });
      res.end(SERVICE_WORKER);
      return;
    }
    if (!account) return redirect(res, "/login");
    return sendJson2(res, 404, { error: "Not found" });
  }
  function localeFrom(cookies, req) {
    const c = cookies[LANG_COOKIE];
    if (c && isLocale(c)) return c;
    return resolveFromAcceptLanguage(req.headers["accept-language"]);
  }
  function persistLang(res, url, locale) {
    if (url.searchParams.get("lang")) setCookie(res, LANG_COOKIE, locale, 60 * 60 * 24 * 365);
  }
}
function publicUser(a) {
  return { id: a.id, email: a.email, role: a.role };
}
function authMessage(err) {
  return err instanceof AuthError ? err.message : "Request failed.";
}
function sanitizePatch(body) {
  const allowed = [
    "plan",
    "assistantName",
    "displayName",
    "language",
    "energyWhToday",
    "devices",
    "routines",
    "suggestions",
    "family"
  ];
  const patch = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  return patch;
}

// ../logger/src/index.ts
var SENSITIVE_KEYS = new Set(
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
    "cvv"
  ].map((k) => k.toLowerCase())
);

// ../voice/src/wake-word.ts
var DEFAULT_WAKE_CONFIG = {
  threshold: 0.35,
  minLength: 2,
  usePhonetic: true
};
function phoneticEncode(input) {
  if (!input) return "";
  const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  if (!normalized) return "";
  let encoded = normalized.replace(/ph/g, "f").replace(/ck/g, "k").replace(/gh/g, "g").replace(/wh/g, "w").replace(/th/g, "t").replace(/sh/g, "s").replace(/ch/g, "k").replace(/qu/g, "k").replace(/x/g, "ks").replace(/[aeiou]+/g, "a").replace(/[sz]/g, "s").replace(/[dt]/g, "t").replace(/[bp]/g, "b").replace(/[fv]/g, "f").replace(/[gkq]/g, "k").replace(/[mn]/g, "n").replace(/[wy]/g, "w");
  encoded = encoded.replace(/(.)\1+/g, "$1");
  return encoded;
}
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = Array.from(
    { length: a.length + 1 },
    (_, i) => Array.from({ length: b.length + 1 }, (_2, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        // deletion
        matrix[i][j - 1] + 1,
        // insertion
        matrix[i - 1][j - 1] + cost
        // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}
function normalizedDistance(a, b) {
  if (a === b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return levenshtein(a, b) / maxLen;
}
function detectWakeWord(transcript, wakePhrase, config2 = DEFAULT_WAKE_CONFIG) {
  const NO_MATCH = { detected: false, score: 1 };
  if (!transcript || !wakePhrase) return NO_MATCH;
  const cleanTranscript = transcript.trim().toLowerCase();
  const cleanWake = wakePhrase.trim().toLowerCase();
  if (cleanWake.length < config2.minLength) return NO_MATCH;
  const directIdx = cleanTranscript.indexOf(cleanWake);
  if (directIdx !== -1) {
    const command = cleanTranscript.slice(directIdx + cleanWake.length).trim();
    return {
      detected: true,
      matchedSegment: cleanWake,
      score: 0,
      command: command || void 0
    };
  }
  const tokens = cleanTranscript.split(/\s+/);
  const wakeTokens = cleanWake.split(/\s+/);
  const windowSize = wakeTokens.length;
  let bestScore = 1;
  let bestIdx = -1;
  let bestEnd = -1;
  for (let i = 0; i <= tokens.length - windowSize; i++) {
    const window = tokens.slice(i, i + windowSize).join(" ");
    let score;
    if (config2.usePhonetic) {
      const encodedWindow = phoneticEncode(window);
      const encodedWake = phoneticEncode(cleanWake);
      score = normalizedDistance(encodedWindow, encodedWake);
    } else {
      score = normalizedDistance(window, cleanWake);
    }
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
      bestEnd = i + windowSize;
    }
  }
  for (let extra = -1; extra <= 1; extra++) {
    const ws = windowSize + extra;
    if (ws < 1 || ws > tokens.length) continue;
    for (let i = 0; i <= tokens.length - ws; i++) {
      const window = tokens.slice(i, i + ws).join(" ");
      let score;
      if (config2.usePhonetic) {
        score = normalizedDistance(phoneticEncode(window), phoneticEncode(cleanWake));
      } else {
        score = normalizedDistance(window, cleanWake);
      }
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
        bestEnd = i + ws;
      }
    }
  }
  if (bestScore <= config2.threshold && bestIdx !== -1) {
    const matchedSegment = tokens.slice(bestIdx, bestEnd).join(" ");
    const command = tokens.slice(bestEnd).join(" ").trim();
    return {
      detected: true,
      matchedSegment,
      score: bestScore,
      command: command || void 0
    };
  }
  return { detected: false, score: bestScore };
}
var WakeWordDetector = class {
  wakePhrase;
  config;
  constructor(wakePhrase, config2 = {}) {
    this.wakePhrase = wakePhrase;
    this.config = { ...DEFAULT_WAKE_CONFIG, ...config2 };
  }
  /** Update the wake phrase (when user renames the assistant). */
  setWakePhrase(phrase) {
    this.wakePhrase = phrase;
  }
  getWakePhrase() {
    return this.wakePhrase;
  }
  /** Check whether the given transcript starts with / contains the wake word. */
  detect(transcript) {
    return detectWakeWord(transcript, this.wakePhrase, this.config);
  }
};

// ../voice/src/stt.ts
var MockSttProvider = class {
  name = "mock-stt";
  config;
  constructor(config2 = {}) {
    this.config = config2;
  }
  isAvailable() {
    return true;
  }
  async transcribe(audio, options) {
    const start = Date.now();
    if (this.config.latencyMs) {
      await new Promise((r) => setTimeout(r, this.config.latencyMs));
    }
    const text = this.config.fixedText ?? `[mock transcription: ${audio.byteLength} bytes]`;
    return {
      text,
      language: options?.languageHint ?? "en",
      confidence: 0.95,
      durationMs: Date.now() - start,
      provider: this.name
    };
  }
};
var WhisperSttProvider = class {
  name = "whisper";
  config;
  constructor(config2) {
    if (!config2.apiKey) {
      throw new Error("WhisperSttProvider requires a non-empty apiKey");
    }
    this.config = config2;
  }
  isAvailable() {
    return !!this.config.apiKey;
  }
  async transcribe(audio, options) {
    const start = Date.now();
    const model = this.config.model ?? "whisper-1";
    const baseUrl = this.config.baseUrl ?? "https://api.openai.com/v1";
    const timeoutMs = this.config.timeoutMs ?? 3e4;
    const format = options?.format ?? "webm";
    const blob = new Blob([audio], { type: `audio/${format}` });
    const formData = new FormData();
    formData.append("file", blob, `audio.${format}`);
    formData.append("model", model);
    if (options?.languageHint) {
      formData.append("language", options.languageHint.split("-")[0]);
    }
    if (options?.timestamps) {
      formData.append("response_format", "verbose_json");
      formData.append("timestamp_granularities[]", "word");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: formData,
        signal: controller.signal
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Whisper API failed: ${response.status} ${errorBody}`);
      }
      const data = await response.json();
      const text = data.text ?? "";
      return {
        text,
        language: data.language ?? options?.languageHint ?? "en",
        confidence: 0.9,
        // Whisper doesn't return confidence per-request
        durationMs: Date.now() - start,
        provider: this.name
      };
    } finally {
      clearTimeout(timeout);
    }
  }
};
function selectSttProvider(input) {
  if (input.provider === "whisper" && input.apiKey) {
    return new WhisperSttProvider({ apiKey: input.apiKey, baseUrl: input.baseUrl });
  }
  return new MockSttProvider();
}

// ../voice/src/tts.ts
function voiceForTone(tone) {
  switch (tone) {
    case "formal":
      return "onyx";
    // deep, authoritative
    case "friendly":
      return "nova";
    // warm, approachable
    case "playful":
      return "shimmer";
    // bright, energetic
    case "concise":
      return "echo";
    // clear, direct
    default:
      return "nova";
  }
}
var MockTtsProvider = class {
  name = "mock-tts";
  config;
  constructor(config2 = {}) {
    this.config = config2;
  }
  isAvailable() {
    return true;
  }
  voices() {
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  }
  async synthesize(text, options) {
    const start = Date.now();
    if (this.config.latencyMs) {
      await new Promise((r) => setTimeout(r, this.config.latencyMs));
    }
    const encoder = new TextEncoder();
    const audio = encoder.encode(`[TTS:${options?.voice ?? "nova"}] ${text}`).buffer;
    return {
      audio,
      format: options?.format ?? "mp3",
      voice: options?.voice ?? "nova",
      durationMs: Date.now() - start,
      provider: this.name
    };
  }
};
var OpenAiTtsProvider = class {
  name = "openai-tts";
  config;
  constructor(config2) {
    if (!config2.apiKey) {
      throw new Error("OpenAiTtsProvider requires a non-empty apiKey");
    }
    this.config = config2;
  }
  isAvailable() {
    return !!this.config.apiKey;
  }
  voices() {
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  }
  async synthesize(text, options) {
    const start = Date.now();
    const baseUrl = this.config.baseUrl ?? "https://api.openai.com/v1";
    const model = options?.model ?? this.config.defaultModel ?? "tts-1";
    const voice = options?.voice ?? this.config.defaultVoice ?? "nova";
    const format = options?.format ?? "mp3";
    const speed = options?.speed ?? 1;
    const timeoutMs = this.config.timeoutMs ?? 3e4;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format: format,
          speed
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI TTS failed: ${response.status} ${errorBody}`);
      }
      const audio = await response.arrayBuffer();
      return {
        audio,
        format,
        voice,
        durationMs: Date.now() - start,
        provider: this.name
      };
    } finally {
      clearTimeout(timeout);
    }
  }
};
function selectTtsProvider(input) {
  if (input.provider === "openai" && input.apiKey) {
    return new OpenAiTtsProvider({ apiKey: input.apiKey, baseUrl: input.baseUrl });
  }
  return new MockTtsProvider();
}

// ../voice/src/voice-profile.ts
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
var MockVoiceEmbedder = class {
  name = "mock-embedder";
  dimensions;
  constructor(dimensions = 64) {
    this.dimensions = dimensions;
  }
  async embed(audio) {
    const bytes = new Uint8Array(audio);
    const vector = new Array(this.dimensions).fill(0);
    for (let i = 0; i < bytes.length; i++) {
      vector[i % this.dimensions] += bytes[i] / 255;
    }
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? vector.map((v) => v / norm) : vector;
    return { vector: normalized, dimensions: this.dimensions };
  }
};
var DEFAULT_SPEAKER_CONFIG = {
  identificationThreshold: 0.75,
  minEnrollmentSamples: 3
};
var SpeakerStore = class {
  profiles = /* @__PURE__ */ new Map();
  embedder;
  config;
  // Accumulated raw embeddings for averaging during enrollment
  enrollmentBuffers = /* @__PURE__ */ new Map();
  constructor(embedder, config2 = {}) {
    this.embedder = embedder;
    this.config = { ...DEFAULT_SPEAKER_CONFIG, ...config2 };
  }
  /** Enroll a voice sample for a user. Multiple samples improve accuracy. */
  async enroll(userId, displayName, audio) {
    const embedding = await this.embedder.embed(audio);
    const buffer = this.enrollmentBuffers.get(userId) ?? [];
    buffer.push(embedding);
    this.enrollmentBuffers.set(userId, buffer);
    const averaged = this.averageEmbeddings(buffer);
    const profile = {
      userId,
      displayName,
      embedding: averaged,
      sampleCount: buffer.length,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.profiles.set(userId, profile);
    return profile;
  }
  /** Identify which enrolled speaker produced the given audio. */
  async identify(audio) {
    if (this.profiles.size === 0) {
      return { identified: false, confidence: 0, candidates: [] };
    }
    const embedding = await this.embedder.embed(audio);
    const candidates = [];
    for (const [userId, profile] of this.profiles) {
      if (profile.sampleCount < this.config.minEnrollmentSamples) continue;
      const score = cosineSimilarity(embedding.vector, profile.embedding.vector);
      candidates.push({ userId, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (best && best.score >= this.config.identificationThreshold) {
      const profile = this.profiles.get(best.userId);
      return {
        identified: true,
        userId: best.userId,
        displayName: profile.displayName,
        confidence: best.score,
        candidates
      };
    }
    return {
      identified: false,
      confidence: best?.score ?? 0,
      candidates
    };
  }
  /** Remove a speaker profile. */
  unenroll(userId) {
    this.enrollmentBuffers.delete(userId);
    return this.profiles.delete(userId);
  }
  /** Get all enrolled profiles. */
  listProfiles() {
    return [...this.profiles.values()];
  }
  /** Get a specific profile. */
  getProfile(userId) {
    return this.profiles.get(userId);
  }
  /** Check if a user has enough enrollment samples for identification. */
  isEnrolled(userId) {
    const profile = this.profiles.get(userId);
    return !!profile && profile.sampleCount >= this.config.minEnrollmentSamples;
  }
  averageEmbeddings(embeddings) {
    if (embeddings.length === 0) {
      return { vector: [], dimensions: 0 };
    }
    const dims = embeddings[0].dimensions;
    const sum = new Array(dims).fill(0);
    for (const emb of embeddings) {
      for (let i = 0; i < dims; i++) {
        sum[i] += emb.vector[i];
      }
    }
    const averaged = sum.map((v) => v / embeddings.length);
    const norm = Math.sqrt(averaged.reduce((s, v) => s + v * v, 0));
    const normalized = norm > 0 ? averaged.map((v) => v / norm) : averaged;
    return { vector: normalized, dimensions: dims };
  }
};

// ../voice/src/engine.ts
var VoiceEngine = class {
  stt;
  tts;
  wakeDetector;
  speakers;
  language = "en";
  tone = "friendly";
  constructor(config2 = {}) {
    this.stt = config2.sttProvider ? selectSttProvider({
      provider: config2.sttProvider,
      apiKey: config2.apiKey,
      baseUrl: config2.baseUrl
    }) : new MockSttProvider();
    this.tts = config2.ttsProvider ? selectTtsProvider({
      provider: config2.ttsProvider,
      apiKey: config2.apiKey,
      baseUrl: config2.baseUrl
    }) : new MockTtsProvider();
    this.wakeDetector = new WakeWordDetector(
      config2.wakePhrase ?? "NEXUS",
      config2.wakeConfig
    );
    const embedder = config2.embedder ?? new MockVoiceEmbedder();
    this.speakers = new SpeakerStore(embedder, config2.speakerConfig);
  }
  // ── Configuration Updates ──────────────────────────────────────────────────
  /** Update the wake phrase (called when user renames the assistant). */
  setWakePhrase(phrase) {
    this.wakeDetector.setWakePhrase(phrase);
  }
  /** Update language preference (affects STT language hint). */
  setLanguage(language) {
    this.language = language;
  }
  /** Update tone preference (affects TTS voice selection). */
  setTone(tone) {
    this.tone = tone;
  }
  /** Get the current wake phrase. */
  getWakePhrase() {
    return this.wakeDetector.getWakePhrase();
  }
  // ── Core Pipeline ──────────────────────────────────────────────────────────
  /**
   * Process incoming audio through the full voice pipeline:
   * Audio → STT → Wake Word Check → Speaker ID → Result
   */
  async listen(audio, options) {
    const start = Date.now();
    const sttOpts = {
      languageHint: options?.languageHint ?? this.language,
      format: options?.format,
      ...options
    };
    const sttResult = await this.stt.transcribe(audio, sttOpts);
    const wakeResult = this.wakeDetector.detect(sttResult.text);
    const speaker = await this.speakers.identify(audio);
    return {
      wakeDetected: wakeResult.detected,
      transcript: sttResult.text,
      command: wakeResult.command,
      speaker,
      sttResult,
      wakeResult,
      totalMs: Date.now() - start
    };
  }
  /**
   * Convert text to speech audio using the configured TTS provider.
   * Automatically selects voice based on user's tone preference.
   */
  async speak(text, options) {
    const voice = options?.voice ?? voiceForTone(this.tone);
    const ttsResult = await this.tts.synthesize(text, {
      voice,
      language: this.language,
      ...options
    });
    return {
      audio: ttsResult.audio,
      format: ttsResult.format,
      voice: ttsResult.voice,
      durationMs: ttsResult.durationMs
    };
  }
  // ── Speaker Enrollment ─────────────────────────────────────────────────────
  /**
   * Enroll a voice sample for a family member. Call multiple times with
   * different samples for the same user to improve accuracy.
   */
  async enrollSpeaker(userId, displayName, audio) {
    return this.speakers.enroll(userId, displayName, audio);
  }
  /** Remove a speaker's voice profile. */
  unenrollSpeaker(userId) {
    return this.speakers.unenroll(userId);
  }
  /** Check if a speaker has enough enrollment samples. */
  isSpeakerEnrolled(userId) {
    return this.speakers.isEnrolled(userId);
  }
  /** List all enrolled speaker profiles. */
  listSpeakers() {
    return this.speakers.listProfiles();
  }
  // ── Status ─────────────────────────────────────────────────────────────────
  /** Whether the STT provider is available. */
  isSttAvailable() {
    return this.stt.isAvailable();
  }
  /** Whether the TTS provider is available. */
  isTtsAvailable() {
    return this.tts.isAvailable();
  }
  /** Whether the full voice pipeline is operational. */
  isEnabled() {
    return this.stt.isAvailable() && this.tts.isAvailable();
  }
  /** Get available TTS voices. */
  availableVoices() {
    return this.tts.voices();
  }
};

// ../platform/src/service.ts
var os = __toESM(require("node:os"), 1);
var PlatformService = class {
  getSystemInfo() {
    return {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
  }
  showNotification(title, message) {
    console.log(`[Notification] ${title}: ${message}`);
  }
};

// ../platform/src/adapter.ts
var PC_ACTION_RISKS = {
  // Application
  "pc.app.launch": 2 /* Medium */,
  "pc.app.close": 3 /* High */,
  "pc.app.focus": 1 /* Low */,
  "pc.app.list": 0 /* None */,
  // File operations
  "pc.file.list": 0 /* None */,
  "pc.file.create": 2 /* Medium */,
  "pc.file.delete": 3 /* High */,
  "pc.file.move": 3 /* High */,
  "pc.file.copy": 2 /* Medium */,
  "pc.file.open": 1 /* Low */,
  // System
  "pc.system.state": 0 /* None */,
  "pc.system.volume": 1 /* Low */,
  "pc.system.brightness": 1 /* Low */,
  "pc.system.dnd": 2 /* Medium */,
  "pc.system.sleep": 4 /* Critical */,
  "pc.system.lock": 3 /* High */,
  "pc.system.notify": 1 /* Low */,
  // Clipboard
  "pc.clipboard.read": 1 /* Low */,
  "pc.clipboard.write": 1 /* Low */,
  // Process
  "pc.process.list": 0 /* None */,
  "pc.process.kill": 3 /* High */
};
function pcAction(kind, description) {
  const risk = PC_ACTION_RISKS[kind] ?? 2 /* Medium */;
  return { kind, risk, description };
}
var DEFAULT_WORK_MODE = {
  launchApps: ["Visual Studio Code", "Terminal", "Safari"],
  enableDnD: true,
  volume: 20,
  closeApps: ["Music", "Messages", "Slack"]
};
function planWorkMode(config2 = DEFAULT_WORK_MODE) {
  const steps = [];
  if (config2.enableDnD) {
    steps.push({
      action: pcAction("pc.system.dnd", "Enable Do Not Disturb for work mode"),
      description: "Enable Do Not Disturb",
      execute: (a) => a.setDoNotDisturb(true)
    });
  }
  steps.push({
    action: pcAction("pc.system.volume", `Set volume to ${config2.volume}%`),
    description: `Set volume to ${config2.volume}%`,
    execute: (a) => a.setVolume(config2.volume)
  });
  if (config2.closeApps) {
    for (const app2 of config2.closeApps) {
      steps.push({
        action: pcAction("pc.app.close", `Close ${app2}`),
        description: `Close ${app2}`,
        execute: (a) => a.closeApp(app2)
      });
    }
  }
  for (const app2 of config2.launchApps) {
    steps.push({
      action: pcAction("pc.app.launch", `Launch ${app2}`),
      description: `Launch ${app2}`,
      execute: (a) => a.launchApp(app2)
    });
  }
  return steps;
}

// ../platform/src/mock-adapter.ts
var MockPlatformAdapter = class {
  id = "mock";
  name = "Mock Platform (Test)";
  calls = [];
  state = {
    volume: 50,
    muted: false,
    brightness: 80,
    doNotDisturb: false,
    batteryLevel: 85,
    isCharging: true,
    activeApp: "Finder",
    screenLocked: false
  };
  runningApps = [
    { name: "Finder", pid: 1, running: true, bundleId: "com.apple.finder" },
    { name: "Safari", pid: 200, running: true, bundleId: "com.apple.Safari" }
  ];
  files = [
    {
      name: "Documents",
      path: "/Users/user/Documents",
      isDirectory: true,
      size: 0,
      modifiedAt: "2025-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z"
    },
    {
      name: "notes.txt",
      path: "/Users/user/Documents/notes.txt",
      isDirectory: false,
      size: 1024,
      modifiedAt: "2025-06-01T00:00:00Z",
      createdAt: "2025-06-01T00:00:00Z"
    }
  ];
  clipboard = "";
  record(method, args) {
    this.calls.push({ method, args, at: Date.now() });
  }
  reset() {
    this.calls.length = 0;
  }
  // ── Application Control ──────────────────────────────────────────────────
  async launchApp(appName) {
    this.record("launchApp", [appName]);
    const app2 = {
      name: appName,
      pid: 100 + this.runningApps.length,
      running: true
    };
    this.runningApps.push(app2);
    return { success: true, data: app2, command: `open -a "${appName}"` };
  }
  async closeApp(appName) {
    this.record("closeApp", [appName]);
    const idx = this.runningApps.findIndex(
      (a) => a.name.toLowerCase() === appName.toLowerCase()
    );
    if (idx === -1) {
      return { success: false, error: `App "${appName}" not running` };
    }
    this.runningApps.splice(idx, 1);
    return { success: true, command: `osascript -e 'quit app "${appName}"'` };
  }
  async focusApp(appName) {
    this.record("focusApp", [appName]);
    this.state = { ...this.state, activeApp: appName };
    return { success: true, command: `osascript -e 'activate app "${appName}"'` };
  }
  async listRunningApps() {
    this.record("listRunningApps", []);
    return { success: true, data: [...this.runningApps] };
  }
  // ── File/Folder Operations ───────────────────────────────────────────────
  async listFiles(dirPath) {
    this.record("listFiles", [dirPath]);
    const matching = this.files.filter((f) => f.path.startsWith(dirPath));
    return { success: true, data: matching };
  }
  async createFile(filePath, isDirectory = false) {
    this.record("createFile", [filePath, isDirectory]);
    const name = filePath.split("/").pop() ?? filePath;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.files.push({
      name,
      path: filePath,
      isDirectory,
      size: 0,
      modifiedAt: now,
      createdAt: now
    });
    return { success: true, command: isDirectory ? `mkdir -p "${filePath}"` : `touch "${filePath}"` };
  }
  async deleteFile(filePath) {
    this.record("deleteFile", [filePath]);
    const idx = this.files.findIndex((f) => f.path === filePath);
    if (idx === -1) return { success: false, error: `File not found: ${filePath}` };
    this.files.splice(idx, 1);
    return { success: true, command: `rm -rf "${filePath}"` };
  }
  async moveFile(source, destination) {
    this.record("moveFile", [source, destination]);
    const file = this.files.find((f) => f.path === source);
    if (!file) return { success: false, error: `Source not found: ${source}` };
    const idx = this.files.indexOf(file);
    const name = destination.split("/").pop() ?? file.name;
    this.files[idx] = { ...file, path: destination, name };
    return { success: true, command: `mv "${source}" "${destination}"` };
  }
  async copyFile(source, destination) {
    this.record("copyFile", [source, destination]);
    const file = this.files.find((f) => f.path === source);
    if (!file) return { success: false, error: `Source not found: ${source}` };
    const name = destination.split("/").pop() ?? file.name;
    this.files.push({ ...file, path: destination, name });
    return { success: true, command: `cp -r "${source}" "${destination}"` };
  }
  async openFile(filePath) {
    this.record("openFile", [filePath]);
    return { success: true, command: `open "${filePath}"` };
  }
  // ── System Control ───────────────────────────────────────────────────────
  async getSystemState() {
    this.record("getSystemState", []);
    return { success: true, data: { ...this.state } };
  }
  async setVolume(level) {
    this.record("setVolume", [level]);
    this.state = { ...this.state, volume: Math.max(0, Math.min(100, level)), muted: level === 0 };
    return { success: true, command: `osascript -e 'set volume output volume ${level}'` };
  }
  async setBrightness(level) {
    this.record("setBrightness", [level]);
    this.state = { ...this.state, brightness: Math.max(0, Math.min(100, level)) };
    return { success: true, command: `brightness ${level / 100}` };
  }
  async setDoNotDisturb(enabled) {
    this.record("setDoNotDisturb", [enabled]);
    this.state = { ...this.state, doNotDisturb: enabled };
    return { success: true, command: `shortcuts run "Toggle DnD"` };
  }
  async sleep() {
    this.record("sleep", []);
    return { success: true, command: `pmset sleepnow` };
  }
  async lockScreen() {
    this.record("lockScreen", []);
    this.state = { ...this.state, screenLocked: true };
    return { success: true, command: `pmset displaysleepnow` };
  }
  async showNotification(title, body) {
    this.record("showNotification", [title, body]);
    return {
      success: true,
      command: `osascript -e 'display notification "${body}" with title "${title}"'`
    };
  }
  // ── Clipboard ────────────────────────────────────────────────────────────
  async readClipboard() {
    this.record("readClipboard", []);
    return { success: true, data: this.clipboard };
  }
  async writeClipboard(text) {
    this.record("writeClipboard", [text]);
    this.clipboard = text;
    return { success: true, command: `echo "${text}" | pbcopy` };
  }
  // ── Process Management ───────────────────────────────────────────────────
  async listProcesses() {
    this.record("listProcesses", []);
    const procs = this.runningApps.map((a) => ({
      pid: a.pid ?? 1,
      name: a.name,
      cpu: Math.random() * 10,
      memory: Math.random() * 500
    }));
    return { success: true, data: procs };
  }
  async killProcess(pid) {
    this.record("killProcess", [pid]);
    const idx = this.runningApps.findIndex((a) => a.pid === pid);
    if (idx !== -1) this.runningApps.splice(idx, 1);
    return { success: true, command: `kill -9 ${pid}` };
  }
};

// ../platform/src/macos-adapter.ts
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");
var import_promises2 = require("node:fs/promises");
var import_node_path5 = require("node:path");
var exec = (0, import_node_util.promisify)(import_node_child_process.exec);
async function run(command) {
  try {
    const { stdout } = await exec(command, { timeout: 15e3 });
    return { success: true, data: stdout.trim(), command };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command };
  }
}
async function applescript(script) {
  return run(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}
var MacosPlatformAdapter = class {
  id = "darwin";
  name = "macOS";
  // ── Application Control ──────────────────────────────────────────────────
  async launchApp(appName) {
    const cmd = `open -a "${appName}"`;
    const result = await run(cmd);
    if (!result.success) return { success: false, error: result.error, command: cmd };
    return {
      success: true,
      data: { name: appName, running: true },
      command: cmd
    };
  }
  async closeApp(appName) {
    const script = `tell application "${appName}" to quit`;
    return applescript(script);
  }
  async focusApp(appName) {
    const script = `tell application "${appName}" to activate`;
    return applescript(script);
  }
  async listRunningApps() {
    const script = 'tell application "System Events" to get name of every process whose background only is false';
    const result = await applescript(script);
    if (!result.success) return { success: false, error: result.error };
    const names = (result.data ?? "").split(", ").filter(Boolean);
    const apps = names.map((name) => ({ name, running: true }));
    return { success: true, data: apps };
  }
  // ── File/Folder Operations ───────────────────────────────────────────────
  async listFiles(dirPath) {
    try {
      const entries = await (0, import_promises2.readdir)(dirPath, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = (0, import_node_path5.join)(dirPath, entry.name);
        try {
          const s = await (0, import_promises2.stat)(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: s.size,
            modifiedAt: s.mtime.toISOString(),
            createdAt: s.birthtime.toISOString()
          });
        } catch {
        }
      }
      return { success: true, data: files, command: `ls -la "${dirPath}"` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  async createFile(filePath, isDirectory = false) {
    const cmd = isDirectory ? `mkdir -p "${filePath}"` : `touch "${filePath}"`;
    return run(cmd);
  }
  async deleteFile(filePath) {
    const cmd = `osascript -e 'tell application "Finder" to delete POSIX file "${filePath}"'`;
    return run(cmd);
  }
  async moveFile(source, destination) {
    return run(`mv "${source}" "${destination}"`);
  }
  async copyFile(source, destination) {
    return run(`cp -R "${source}" "${destination}"`);
  }
  async openFile(filePath) {
    return run(`open "${filePath}"`);
  }
  // ── System Control ───────────────────────────────────────────────────────
  async getSystemState() {
    try {
      const [volResult, dndResult, battResult] = await Promise.all([
        applescript("output volume of (get volume settings)"),
        run("defaults -currentHost read com.apple.notificationcenterui doNotDisturb 2>/dev/null || echo 0"),
        run("pmset -g batt")
      ]);
      const volume = parseInt(volResult.data ?? "50", 10);
      const dnd = (dndResult.data ?? "0").trim() === "1";
      const battMatch = (battResult.data ?? "").match(/(\d+)%/);
      const batteryLevel = battMatch ? parseInt(battMatch[1], 10) : void 0;
      const isCharging = (battResult.data ?? "").includes("charging");
      return {
        success: true,
        data: {
          volume: isNaN(volume) ? 50 : volume,
          muted: volume === 0,
          brightness: 80,
          // brightness API requires private frameworks
          doNotDisturb: dnd,
          batteryLevel,
          isCharging,
          screenLocked: false
        }
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  async setVolume(level) {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return applescript(`set volume output volume ${clamped}`);
  }
  async setBrightness(level) {
    const val = (Math.max(0, Math.min(100, level)) / 100).toFixed(2);
    return run(`brightness ${val}`);
  }
  async setDoNotDisturb(enabled) {
    const script = enabled ? 'do shell script "defaults -currentHost write com.apple.notificationcenterui doNotDisturb -bool true && killall NotificationCenter 2>/dev/null || true"' : 'do shell script "defaults -currentHost write com.apple.notificationcenterui doNotDisturb -bool false && killall NotificationCenter 2>/dev/null || true"';
    return applescript(script);
  }
  async sleep() {
    return run("pmset sleepnow");
  }
  async lockScreen() {
    return run(
      "/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend"
    );
  }
  async showNotification(title, body) {
    const script = `display notification "${body}" with title "${title}"`;
    return applescript(script);
  }
  // ── Clipboard ────────────────────────────────────────────────────────────
  async readClipboard() {
    return run("pbpaste");
  }
  async writeClipboard(text) {
    return run(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
  }
  // ── Process Management ───────────────────────────────────────────────────
  async listProcesses() {
    const result = await run("ps aux --sort=-%cpu | head -20");
    if (!result.success) return { success: false, error: result.error };
    const lines = (result.data ?? "").split("\n").slice(1);
    const procs = lines.filter(Boolean).map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[1] ?? "0", 10),
        name: parts.slice(10).join(" ") || parts[10] || "unknown",
        cpu: parseFloat(parts[2] ?? "0"),
        memory: parseFloat(parts[3] ?? "0")
      };
    });
    return { success: true, data: procs };
  }
  async killProcess(pid) {
    return run(`kill -9 ${pid}`);
  }
};

// ../platform/src/windows-adapter.ts
var import_node_child_process2 = require("node:child_process");
var import_node_util2 = require("node:util");
var import_promises3 = require("node:fs/promises");
var import_node_path6 = require("node:path");
var exec2 = (0, import_node_util2.promisify)(import_node_child_process2.exec);
async function ps(command) {
  const fullCmd = `powershell -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"`;
  try {
    const { stdout } = await exec2(fullCmd, { timeout: 15e3 });
    return { success: true, data: stdout.trim(), command: fullCmd };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command: fullCmd };
  }
}
async function run2(command) {
  try {
    const { stdout } = await exec2(command, { timeout: 15e3 });
    return { success: true, data: stdout.trim(), command };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command };
  }
}
var WindowsPlatformAdapter = class {
  id = "win32";
  name = "Windows";
  // ── Application Control ──────────────────────────────────────────────────
  async launchApp(appName) {
    const result = await ps(`Start-Process '${appName}' -PassThru | Select-Object -Property Id,Name | ConvertTo-Json`);
    if (!result.success) return { success: false, error: result.error, command: result.command };
    return {
      success: true,
      data: { name: appName, running: true },
      command: result.command
    };
  }
  async closeApp(appName) {
    return ps(`Get-Process -Name '${appName}' -ErrorAction SilentlyContinue | Stop-Process -Force`);
  }
  async focusApp(appName) {
    const script = `
      $proc = Get-Process -Name '${appName}' -ErrorAction SilentlyContinue | Select-Object -First 1;
      if ($proc) { [void][System.Runtime.Interopservices.Marshal]::GetActiveObject(''); Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'; [Native.Win]::SetForegroundWindow($proc.MainWindowHandle) }
    `;
    return ps(script);
  }
  async listRunningApps() {
    const result = await ps(
      "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object Name,Id | ConvertTo-Json"
    );
    if (!result.success) return { success: false, error: result.error };
    try {
      const parsed = JSON.parse(result.data || "[]");
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const apps = list.map((p) => ({
        name: p.Name,
        pid: p.Id,
        running: true
      }));
      return { success: true, data: apps };
    } catch {
      return { success: true, data: [] };
    }
  }
  // ── File/Folder Operations ───────────────────────────────────────────────
  async listFiles(dirPath) {
    try {
      const entries = await (0, import_promises3.readdir)(dirPath, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = (0, import_node_path6.join)(dirPath, entry.name);
        try {
          const s = await (0, import_promises3.stat)(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: s.size,
            modifiedAt: s.mtime.toISOString(),
            createdAt: s.birthtime.toISOString()
          });
        } catch {
        }
      }
      return { success: true, data: files };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  async createFile(filePath, isDirectory = false) {
    if (isDirectory) return ps(`New-Item -ItemType Directory -Force -Path '${filePath}'`);
    return ps(`New-Item -ItemType File -Force -Path '${filePath}'`);
  }
  async deleteFile(filePath) {
    return ps(
      `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${filePath}','OnlyErrorDialogs','SendToRecycleBin')`
    );
  }
  async moveFile(source, destination) {
    return ps(`Move-Item -Path '${source}' -Destination '${destination}' -Force`);
  }
  async copyFile(source, destination) {
    return ps(`Copy-Item -Path '${source}' -Destination '${destination}' -Recurse -Force`);
  }
  async openFile(filePath) {
    return run2(`start "" "${filePath}"`);
  }
  // ── System Control ───────────────────────────────────────────────────────
  async getSystemState() {
    await ps(`@{} | ConvertTo-Json`);
    return {
      success: true,
      data: {
        volume: 50,
        muted: false,
        brightness: 80,
        doNotDisturb: false,
        screenLocked: false
      }
    };
  }
  async setVolume(level) {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return ps(
      `$obj = New-Object -ComObject WScript.Shell; 1..50 | ForEach-Object { $obj.SendKeys([char]174) }; 1..${Math.round(clamped / 2)} | ForEach-Object { $obj.SendKeys([char]175) }`
    );
  }
  async setBrightness(level) {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return ps(
      `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${clamped})`
    );
  }
  async setDoNotDisturb(enabled) {
    return ps(
      `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings' -Name 'NOC_GLOBAL_SETTING_TOASTS_ENABLED' -Value ${enabled ? 0 : 1}`
    );
  }
  async sleep() {
    return ps("rundll32.exe powrprof.dll,SetSuspendState 0,1,0");
  }
  async lockScreen() {
    return run2("rundll32.exe user32.dll,LockWorkStation");
  }
  async showNotification(title, body) {
    return ps(
      `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; $template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02; $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template); $xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${title}')); $xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('${body}')); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('NEXUS').Show([Windows.UI.Notifications.ToastNotification]::new($xml))`
    );
  }
  // ── Clipboard ────────────────────────────────────────────────────────────
  async readClipboard() {
    return ps("Get-Clipboard");
  }
  async writeClipboard(text) {
    return ps(`Set-Clipboard -Value '${text}'`);
  }
  // ── Process Management ───────────────────────────────────────────────────
  async listProcesses() {
    const result = await ps(
      "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Id,Name,CPU,WorkingSet | ConvertTo-Json"
    );
    if (!result.success) return { success: false, error: result.error };
    try {
      const parsed = JSON.parse(result.data || "[]");
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const procs = list.map(
        (p) => ({
          pid: p.Id,
          name: p.Name,
          cpu: p.CPU ?? 0,
          memory: (p.WorkingSet ?? 0) / 1024 / 1024
        })
      );
      return { success: true, data: procs };
    } catch {
      return { success: true, data: [] };
    }
  }
  async killProcess(pid) {
    return ps(`Stop-Process -Id ${pid} -Force`);
  }
};

// ../platform/src/linux-adapter.ts
var import_node_child_process3 = require("node:child_process");
var import_node_util3 = require("node:util");
var import_promises4 = require("node:fs/promises");
var import_node_path7 = require("node:path");
var exec3 = (0, import_node_util3.promisify)(import_node_child_process3.exec);
async function run3(command) {
  try {
    const { stdout } = await exec3(command, { timeout: 15e3 });
    return { success: true, data: stdout.trim(), command };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, command };
  }
}
var LinuxPlatformAdapter = class {
  id = "linux";
  name = "Linux";
  // ── Application Control ──────────────────────────────────────────────────
  async launchApp(appName) {
    const result = await run3(`nohup ${appName} > /dev/null 2>&1 & echo $!`);
    if (!result.success) return { success: false, error: result.error };
    const pid = parseInt(result.data ?? "0", 10);
    return {
      success: true,
      data: { name: appName, pid, running: true },
      command: result.command
    };
  }
  async closeApp(appName) {
    return run3(`pkill -f "${appName}"`);
  }
  async focusApp(appName) {
    return run3(`xdotool search --name "${appName}" windowactivate`);
  }
  async listRunningApps() {
    const result = await run3("wmctrl -l -p 2>/dev/null || xdotool search --name '' getwindowname %@ 2>/dev/null || echo ''");
    if (!result.success) return { success: true, data: [] };
    const lines = (result.data ?? "").split("\n").filter(Boolean);
    const apps = lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      const name = parts.slice(4).join(" ") || parts[0] || "unknown";
      return { name, running: true };
    });
    return { success: true, data: apps };
  }
  // ── File/Folder Operations ───────────────────────────────────────────────
  async listFiles(dirPath) {
    try {
      const entries = await (0, import_promises4.readdir)(dirPath, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = (0, import_node_path7.join)(dirPath, entry.name);
        try {
          const s = await (0, import_promises4.stat)(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: s.size,
            modifiedAt: s.mtime.toISOString(),
            createdAt: s.birthtime.toISOString()
          });
        } catch {
        }
      }
      return { success: true, data: files };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  async createFile(filePath, isDirectory = false) {
    return run3(isDirectory ? `mkdir -p "${filePath}"` : `touch "${filePath}"`);
  }
  async deleteFile(filePath) {
    return run3(`gio trash "${filePath}"`);
  }
  async moveFile(source, destination) {
    return run3(`mv "${source}" "${destination}"`);
  }
  async copyFile(source, destination) {
    return run3(`cp -r "${source}" "${destination}"`);
  }
  async openFile(filePath) {
    return run3(`xdg-open "${filePath}"`);
  }
  // ── System Control ───────────────────────────────────────────────────────
  async getSystemState() {
    const [volResult, battResult] = await Promise.all([
      run3("pactl get-sink-volume @DEFAULT_SINK@ 2>/dev/null || amixer get Master 2>/dev/null || echo '50'"),
      run3("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo ''")
    ]);
    let volume = 50;
    const volMatch = (volResult.data ?? "").match(/(\d+)%/);
    if (volMatch) volume = parseInt(volMatch[1], 10);
    const batteryLevel = battResult.data ? parseInt(battResult.data, 10) : void 0;
    return {
      success: true,
      data: {
        volume,
        muted: volume === 0,
        brightness: 80,
        doNotDisturb: false,
        batteryLevel: isNaN(batteryLevel ?? NaN) ? void 0 : batteryLevel,
        isCharging: false,
        screenLocked: false
      }
    };
  }
  async setVolume(level) {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return run3(`pactl set-sink-volume @DEFAULT_SINK@ ${clamped}% 2>/dev/null || amixer set Master ${clamped}%`);
  }
  async setBrightness(level) {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return run3(`brightnessctl set ${clamped}%`);
  }
  async setDoNotDisturb(enabled) {
    return run3(
      `dbus-send --session --type=method_call --dest=org.freedesktop.Notifications /org/freedesktop/Notifications org.freedesktop.DBus.Properties.Set string:"org.freedesktop.Notifications" string:"Inhibited" variant:boolean:${enabled}`
    );
  }
  async sleep() {
    return run3("systemctl suspend");
  }
  async lockScreen() {
    return run3("loginctl lock-session 2>/dev/null || xdg-screensaver lock");
  }
  async showNotification(title, body) {
    return run3(`notify-send "${title}" "${body}"`);
  }
  // ── Clipboard ────────────────────────────────────────────────────────────
  async readClipboard() {
    return run3("xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output");
  }
  async writeClipboard(text) {
    return run3(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard 2>/dev/null || echo "${text.replace(/"/g, '\\"')}" | xsel --clipboard --input`);
  }
  // ── Process Management ───────────────────────────────────────────────────
  async listProcesses() {
    const result = await run3("ps aux --sort=-%cpu | head -20");
    if (!result.success) return { success: false, error: result.error };
    const lines = (result.data ?? "").split("\n").slice(1);
    const procs = lines.filter(Boolean).map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parseInt(parts[1] ?? "0", 10),
        name: parts.slice(10).join(" ") || "unknown",
        cpu: parseFloat(parts[2] ?? "0"),
        memory: parseFloat(parts[3] ?? "0")
      };
    });
    return { success: true, data: procs };
  }
  async killProcess(pid) {
    return run3(`kill -9 ${pid}`);
  }
};

// ../platform/src/pc-agent.ts
var os2 = __toESM(require("node:os"), 1);
var PcAgent = class {
  adapter;
  security;
  workModeConfig;
  workModeActive = false;
  constructor(deps) {
    this.adapter = deps.adapter;
    this.security = deps.security ?? new SecurityMiddleware();
    this.workModeConfig = deps.workModeConfig ?? DEFAULT_WORK_MODE;
  }
  /** Get the underlying platform adapter ID (darwin/win32/linux/mock). */
  get platformId() {
    return this.adapter.id;
  }
  /** Whether work mode is currently active. */
  get isWorkModeActive() {
    return this.workModeActive;
  }
  // ── Intent Execution ───────────────────────────────────────────────────────
  /**
   * Execute a PC intent through the security pipeline.
   * Returns immediately if the action is allowed; returns a confirmation
   * token if the action is risky and requires user approval.
   */
  async execute(intent) {
    const actionKind = `pc.${intent.category}`;
    const action = pcAction(actionKind, intent.description);
    const guardResult = this.security.guard(action, () => "__allowed__");
    if (guardResult.status === "executed") {
      const result = await this.dispatch(intent);
      return {
        intent,
        executed: true,
        requiresConfirmation: false,
        result
      };
    }
    if (guardResult.status === "pending") {
      return {
        intent,
        executed: false,
        requiresConfirmation: true,
        confirmationToken: guardResult.approval.token
      };
    }
    return {
      intent,
      executed: false,
      requiresConfirmation: false,
      error: `Action denied: ${guardResult.reason}`
    };
  }
  /**
   * Confirm a previously held action and execute it.
   */
  async confirm(token, intent) {
    try {
      this.security.approve(token, () => {
      });
      const result = await this.dispatch(intent);
      return {
        intent,
        executed: true,
        requiresConfirmation: false,
        result
      };
    } catch (err) {
      return {
        intent,
        executed: false,
        requiresConfirmation: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
  /**
   * Reject a pending confirmation.
   */
  reject(token) {
    this.security.reject(token);
  }
  // ── Work Mode ──────────────────────────────────────────────────────────────
  /**
   * Enter work mode: execute a sequence of platform actions to set up
   * a focused work environment. Risky steps still require confirmation.
   */
  async enterWorkMode(config2) {
    const steps = planWorkMode(config2 ?? this.workModeConfig);
    const results = [];
    let pending = 0;
    for (const step of steps) {
      const intent = this.stepToIntent(step);
      const result = await this.execute(intent);
      results.push(result);
      if (result.requiresConfirmation) pending++;
    }
    this.workModeActive = true;
    return {
      active: true,
      stepsExecuted: results.filter((r) => r.executed).length,
      stepsPending: pending,
      results
    };
  }
  /**
   * Exit work mode: restore normal settings.
   */
  async exitWorkMode() {
    const results = [];
    const dndResult = await this.execute({
      category: "system.dnd",
      params: { enabled: false },
      description: "Disable Do Not Disturb (exit work mode)"
    });
    results.push(dndResult);
    const volResult = await this.execute({
      category: "system.volume",
      params: { level: 50 },
      description: "Restore volume to 50% (exit work mode)"
    });
    results.push(volResult);
    this.workModeActive = false;
    return {
      active: false,
      stepsExecuted: results.filter((r) => r.executed).length,
      stepsPending: results.filter((r) => r.requiresConfirmation).length,
      results
    };
  }
  // ── Internal Dispatch ──────────────────────────────────────────────────────
  async dispatch(intent) {
    const p = intent.params;
    switch (intent.category) {
      // App
      case "app.launch":
        return this.adapter.launchApp(p.appName);
      case "app.close":
        return this.adapter.closeApp(p.appName);
      case "app.focus":
        return this.adapter.focusApp(p.appName);
      case "app.list":
        return this.adapter.listRunningApps();
      // File
      case "file.list":
        return this.adapter.listFiles(p.path);
      case "file.create":
        return this.adapter.createFile(p.path, p.isDirectory);
      case "file.delete":
        return this.adapter.deleteFile(p.path);
      case "file.move":
        return this.adapter.moveFile(p.source, p.destination);
      case "file.copy":
        return this.adapter.copyFile(p.source, p.destination);
      case "file.open":
        return this.adapter.openFile(p.path);
      // System
      case "system.state":
        return this.adapter.getSystemState();
      case "system.volume":
        return this.adapter.setVolume(p.level);
      case "system.brightness":
        return this.adapter.setBrightness(p.level);
      case "system.dnd":
        return this.adapter.setDoNotDisturb(p.enabled);
      case "system.sleep":
        return this.adapter.sleep();
      case "system.lock":
        return this.adapter.lockScreen();
      case "system.notify":
        return this.adapter.showNotification(p.title, p.body);
      // Clipboard
      case "clipboard.read":
        return this.adapter.readClipboard();
      case "clipboard.write":
        return this.adapter.writeClipboard(p.text);
      // Process
      case "process.list":
        return this.adapter.listProcesses();
      case "process.kill":
        return this.adapter.killProcess(p.pid);
      // Work mode (handled separately)
      case "workmode.enter":
        return { success: true };
      case "workmode.exit":
        return { success: true };
      default:
        return { success: false, error: `Unknown intent category: ${intent.category}` };
    }
  }
  stepToIntent(step) {
    const kind = step.action.kind;
    const category = kind.replace("pc.", "");
    const params = {};
    if (category === "app.launch" || category === "app.close") {
      const match = step.description.match(/(Launch|Close)\s+(.+)/);
      if (match) params.appName = match[2];
    } else if (category === "system.volume") {
      const match = step.description.match(/(\d+)%/);
      if (match) params.level = parseInt(match[1], 10);
    } else if (category === "system.dnd") {
      params.enabled = step.description.toLowerCase().includes("enable");
    }
    return { category, params, description: step.description };
  }
};
function createPlatformAdapter() {
  switch (os2.platform()) {
    case "darwin":
      return new MacosPlatformAdapter();
    case "win32":
      return new WindowsPlatformAdapter();
    case "linux":
      return new LinuxPlatformAdapter();
    default:
      return new MockPlatformAdapter();
  }
}
function createPcAgent(deps) {
  return new PcAgent({
    adapter: deps?.adapter ?? createPlatformAdapter(),
    security: deps?.security,
    workModeConfig: deps?.workModeConfig
  });
}

// ../agents/src/protocol.ts
var AgentRouter = class {
  agents = /* @__PURE__ */ new Map();
  config;
  constructor(config2 = {}) {
    this.config = {
      minScore: config2.minScore ?? 0.1,
      maxAgents: config2.maxAgents ?? 3,
      mergeResults: config2.mergeResults ?? true
    };
  }
  /** Register an agent with the router. */
  register(agent) {
    this.agents.set(agent.id, agent);
  }
  /** Unregister an agent. */
  unregister(id) {
    return this.agents.delete(id);
  }
  /** Get a registered agent by ID. */
  get(id) {
    return this.agents.get(id);
  }
  /** List all registered agents. */
  list() {
    return [...this.agents.values()];
  }
  /** List agents that are currently active. */
  listActive() {
    return [...this.agents.values()].filter((a) => a.status === "active");
  }
  /**
   * Route an intent to the appropriate agent(s), execute, handle delegations,
   * and consolidate results.
   */
  async route(intent, slots, ctx) {
    const scored = this.listActive().map((agent) => ({ agent, score: agent.score(intent, slots) })).filter((s) => s.score >= this.config.minScore).sort((a, b) => b.score - a.score).slice(0, this.config.maxAgents);
    if (scored.length === 0) {
      return {
        text: "No agent available to handle this request.",
        actions: [],
        agents: [],
        results: /* @__PURE__ */ new Map(),
        delegations: []
      };
    }
    const sendMessage = async (to, msgIntent, payload) => {
      const target = this.agents.get(to);
      if (!target || target.status !== "active") return void 0;
      return target.handle(msgIntent, payload, { ...ctx, sendMessage });
    };
    const routingCtx = { ...ctx, sendMessage };
    const results = /* @__PURE__ */ new Map();
    const delegations = [];
    const primary = scored[0];
    const primaryResult = await primary.agent.handle(intent, slots, routingCtx);
    results.set(primary.agent.id, primaryResult);
    if (primaryResult.delegations) {
      for (const del of primaryResult.delegations) {
        const targetAgent = this.agents.get(del.targetAgent);
        if (targetAgent && targetAgent.status === "active") {
          const delResult = await targetAgent.handle(del.intent, del.payload, routingCtx);
          results.set(targetAgent.id, delResult);
          delegations.push({ from: primary.agent.id, to: del.targetAgent, result: delResult });
        } else {
          delegations.push({ from: primary.agent.id, to: del.targetAgent });
        }
      }
    }
    if (this.config.mergeResults && scored.length > 1) {
      for (const { agent } of scored.slice(1)) {
        if (scored[0].score - agent.score(intent, slots) <= 0.3) {
          const result = await agent.handle(intent, slots, routingCtx);
          if (result.confidence > 0.5) {
            results.set(agent.id, result);
          }
        }
      }
    }
    return this.consolidate(results, delegations);
  }
  /** Merge results from multiple agents into a single response. */
  consolidate(results, delegations) {
    const entries = [...results.entries()].sort(
      (a, b) => b[1].confidence - a[1].confidence
    );
    if (entries.length === 0) {
      return { text: "", actions: [], agents: [], results, delegations };
    }
    const primaryText = entries[0][1].text;
    const supplements = entries.slice(1).filter(([, r]) => r.text && r.confidence > 0.5).map(([id, r]) => `[${id}] ${r.text}`);
    const text = supplements.length > 0 ? `${primaryText}

${supplements.join("\n")}` : primaryText;
    const actions = entries.flatMap(([, r]) => r.actions);
    return {
      text,
      actions,
      agents: entries.map(([id]) => id),
      results,
      delegations
    };
  }
};

// ../agents/src/specialized.ts
var MultiHomeAgent = class {
  id = "home";
  name = "Home Assistant";
  description = "Controls smart home devices, manages rooms and scenes.";
  icon = "home";
  status = "active";
  permissions = {
    scopes: ["devices", "routines", "memory"],
    canDelegate: true,
    maxRiskLevel: "medium"
  };
  capabilities = [
    {
      domain: "home",
      intents: ["home.*", "device.*", "scene.*", "routine.*"],
      keywords: [
        "light",
        "lamp",
        "switch",
        "temperature",
        "thermostat",
        "blinds",
        "\u0131\u015F\u0131k",
        "lamba",
        "s\u0131cakl\u0131k",
        "perde",
        "a\xE7",
        "kapat",
        "room",
        "oda"
      ]
    }
  ];
  score(intent, slots) {
    if (intent.startsWith("home.") || intent.startsWith("device.") || intent.startsWith("scene.")) return 0.95;
    if (intent.startsWith("routine.")) return 0.7;
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(light|lamp|switch|temperature|ışık|lamba|sıcaklık)\b/.test(text)) return 0.6;
    return 0;
  }
  async handle(intent, slots, _ctx) {
    const room = String(slots.room ?? "living");
    const device = String(slots.device ?? "light");
    const state = String(slots.state ?? "on");
    if (intent === "home.control" || intent.startsWith("device.")) {
      return {
        text: `${device} in ${room} set to ${state}.`,
        actions: [{
          kind: "device.set",
          params: { room, device, state },
          risk: "medium",
          description: `Set ${device} in ${room} to ${state}`
        }],
        confidence: 0.9
      };
    }
    if (intent.startsWith("scene.")) {
      const sceneName = intent.replace("scene.", "");
      return {
        text: `Activating scene: ${sceneName}.`,
        actions: [{
          kind: "scene.activate",
          params: { scene: sceneName },
          risk: "low",
          description: `Activate scene ${sceneName}`
        }],
        confidence: 0.85
      };
    }
    return {
      text: `Home command received for ${room}.`,
      actions: [],
      confidence: 0.5
    };
  }
};
var LifeAgent = class {
  id = "life";
  name = "Life Coach";
  description = "Manages daily routines, wellness reminders, and life organization.";
  icon = "heart";
  status = "active";
  permissions = {
    scopes: ["memory", "personalization", "routines"],
    canDelegate: true,
    maxRiskLevel: "low"
  };
  capabilities = [
    {
      domain: "life",
      intents: ["life.*", "wellness.*", "reminder.*", "schedule.*"],
      keywords: [
        "reminder",
        "schedule",
        "morning",
        "evening",
        "routine",
        "sleep",
        "water",
        "exercise",
        "break",
        "hat\u0131rlat\u0131c\u0131",
        "sabah",
        "ak\u015Fam",
        "uyku",
        "su",
        "egzersiz"
      ]
    }
  ];
  score(intent, slots) {
    if (intent.startsWith("life.") || intent.startsWith("wellness.") || intent.startsWith("reminder.")) return 0.9;
    if (intent.startsWith("schedule.")) return 0.7;
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(remind|schedule|morning|routine|sleep|water|exercise|break|sabah|akşam|uyku|su)\b/.test(text)) return 0.6;
    return 0;
  }
  async handle(intent, slots, ctx) {
    if (intent === "life.morning_briefing" || /morning|sabah/.test(String(slots.text ?? ""))) {
      return {
        text: this.generateMorningBriefing(ctx),
        actions: [],
        confidence: 0.85,
        delegations: [
          { targetAgent: "home", intent: "scene.morning", payload: {}, reason: "Activate morning scene" }
        ]
      };
    }
    if (intent === "life.hydration" || /water|su/.test(String(slots.text ?? ""))) {
      return {
        text: "\u{1F4A7} Hydration reminder set! I'll remind you to drink water every 2 hours.",
        actions: [{
          kind: "reminder.set",
          params: { type: "hydration", intervalMinutes: 120 },
          risk: "low",
          description: "Set hydration reminder every 2 hours"
        }],
        confidence: 0.9
      };
    }
    if (intent === "life.break" || /break|mola/.test(String(slots.text ?? ""))) {
      return {
        text: "\u23F0 Break reminder activated. I'll suggest a 5-minute break every 50 minutes.",
        actions: [{
          kind: "reminder.set",
          params: { type: "break", intervalMinutes: 50, durationMinutes: 5 },
          risk: "low",
          description: "Set break reminder every 50 minutes"
        }],
        confidence: 0.85
      };
    }
    if (intent === "life.sleep" || /sleep|uyku/.test(String(slots.text ?? ""))) {
      return {
        text: "\u{1F319} Sleep mode preparation: I'll dim the lights, enable DnD, and remind you 30 minutes before your target bedtime.",
        actions: [{
          kind: "life.sleep_prep",
          params: { reminderBeforeMinutes: 30 },
          risk: "low",
          description: "Prepare for sleep mode"
        }],
        confidence: 0.9,
        delegations: [
          { targetAgent: "home", intent: "scene.night", payload: {}, reason: "Dim lights for sleep" }
        ]
      };
    }
    return {
      text: "I can help with reminders, routines, hydration tracking, and wellness goals. What would you like?",
      actions: [],
      confidence: 0.4
    };
  }
  generateMorningBriefing(_ctx) {
    return `\u2600\uFE0F Good morning! Here's your briefing:
\u2022 Time to start your day
\u2022 Weather is clear
\u2022 No urgent reminders pending
Shall I activate your morning routine?`;
  }
};
var KnowledgeAgent = class {
  id = "knowledge";
  name = "Knowledge Assistant";
  description = "Answers questions, performs calculations, and provides information.";
  icon = "book";
  status = "active";
  permissions = {
    scopes: ["knowledge", "memory"],
    canDelegate: false,
    maxRiskLevel: "low"
  };
  capabilities = [
    {
      domain: "knowledge",
      intents: ["knowledge.*", "calculate.*", "define.*", "explain.*"],
      keywords: [
        "what",
        "how",
        "why",
        "when",
        "calculate",
        "define",
        "explain",
        "ne",
        "nas\u0131l",
        "neden",
        "ne zaman",
        "hesapla",
        "tan\u0131mla",
        "a\xE7\u0131kla",
        "ka\xE7"
      ]
    }
  ];
  score(intent, slots) {
    if (intent.startsWith("knowledge.") || intent.startsWith("calculate.") || intent.startsWith("explain.")) return 0.9;
    const text = String(slots.text ?? "").toLowerCase();
    if (/[\d]+\s*[+\-*/^]\s*[\d]+/.test(text)) return 0.8;
    if (/\b(what|how|why|when|calculate|ne\s|nasıl|neden|kaç|hesapla)\b/.test(text)) return 0.5;
    return 0;
  }
  async handle(intent, slots, _ctx) {
    const text = String(slots.text ?? slots.query ?? "");
    const mathMatch = text.match(/([\d.]+)\s*([+\-*/^])\s*([\d.]+)/);
    if (mathMatch || intent === "calculate.math") {
      const result = this.evaluateMath(text);
      if (result !== void 0) {
        return {
          text: `The result is: ${result}`,
          actions: [],
          confidence: 0.95,
          metadata: { type: "calculation", expression: text, result }
        };
      }
    }
    if (/\b(convert|to|celsius|fahrenheit|km|mile|kg|pound|çevir)\b/i.test(text)) {
      const conversion = this.tryConversion(text);
      if (conversion) {
        return { text: conversion, actions: [], confidence: 0.9 };
      }
    }
    if (/\b(time|date|day|today|saat|tarih|gün|bugün)\b/i.test(text)) {
      return {
        text: `Current time: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
        actions: [],
        confidence: 0.8
      };
    }
    return {
      text: `I'd look that up for you. Query: "${text}"`,
      actions: [],
      confidence: 0.4,
      metadata: { type: "general_query", query: text }
    };
  }
  evaluateMath(expr) {
    const match = expr.match(/([\d.]+)\s*([+\-*/^])\s*([\d.]+)/);
    if (!match) return void 0;
    const a = parseFloat(match[1]);
    const op = match[2];
    const b = parseFloat(match[3]);
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : void 0;
      case "^":
        return Math.pow(a, b);
      default:
        return void 0;
    }
  }
  tryConversion(text) {
    const celToFah = text.match(/([\d.]+)\s*(?:°?C|celsius)\s*(?:to|in)\s*(?:°?F|fahrenheit)/i);
    if (celToFah) {
      const c = parseFloat(celToFah[1]);
      return `${c}\xB0C = ${(c * 9 / 5 + 32).toFixed(1)}\xB0F`;
    }
    const fahToCel = text.match(/([\d.]+)\s*(?:°?F|fahrenheit)\s*(?:to|in)\s*(?:°?C|celsius)/i);
    if (fahToCel) {
      const f = parseFloat(fahToCel[1]);
      return `${f}\xB0F = ${((f - 32) * 5 / 9).toFixed(1)}\xB0C`;
    }
    const kmToMile = text.match(/([\d.]+)\s*km\s*(?:to|in)\s*mile/i);
    if (kmToMile) {
      const km = parseFloat(kmToMile[1]);
      return `${km} km = ${(km * 0.621371).toFixed(2)} miles`;
    }
    return void 0;
  }
};
var SecurityAgent = class {
  id = "security";
  name = "Security Monitor";
  description = "Monitors home security, manages access control and alerts.";
  icon = "shield";
  status = "active";
  permissions = {
    scopes: ["security", "devices", "memory"],
    canDelegate: true,
    maxRiskLevel: "high"
  };
  capabilities = [
    {
      domain: "security",
      intents: ["security.*", "alarm.*", "access.*", "lock.*"],
      keywords: [
        "security",
        "alarm",
        "lock",
        "unlock",
        "camera",
        "door",
        "motion",
        "g\xFCvenlik",
        "alarm",
        "kilit",
        "kap\u0131",
        "kamera",
        "hareket"
      ]
    }
  ];
  armed = false;
  accessLog = [];
  score(intent, slots) {
    if (intent.startsWith("security.") || intent.startsWith("alarm.") || intent.startsWith("lock.")) return 0.95;
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(security|alarm|lock|unlock|camera|door|güvenlik|kilit|kapı|kamera)\b/.test(text)) return 0.7;
    return 0;
  }
  async handle(intent, slots, _ctx) {
    if (intent === "security.arm" || /arm|kur/.test(String(slots.text ?? ""))) {
      this.armed = true;
      this.log("armed");
      return {
        text: "\u{1F512} Security system armed. All sensors active. I'll alert you to any unusual activity.",
        actions: [{
          kind: "security.arm",
          params: { mode: "full" },
          risk: "medium",
          description: "Arm security system"
        }],
        confidence: 0.95
      };
    }
    if (intent === "security.disarm" || /disarm|devre dışı/.test(String(slots.text ?? ""))) {
      this.armed = false;
      this.log("disarmed");
      return {
        text: "\u{1F513} Security system disarmed.",
        actions: [{
          kind: "security.disarm",
          params: {},
          risk: "high",
          description: "Disarm security system"
        }],
        confidence: 0.95
      };
    }
    if (intent === "security.status" || /status|durum/.test(String(slots.text ?? ""))) {
      return {
        text: `Security status: ${this.armed ? "\u{1F512} ARMED" : "\u{1F513} Disarmed"}. No alerts. Last ${this.accessLog.length} events logged.`,
        actions: [],
        confidence: 0.9,
        metadata: { armed: this.armed, logCount: this.accessLog.length }
      };
    }
    if (intent === "security.lock" || intent === "lock.door") {
      const target = String(slots.target ?? slots.door ?? "front door");
      this.log(`locked:${target}`);
      return {
        text: `\u{1F510} ${target} locked.`,
        actions: [{
          kind: "lock.set",
          params: { target, locked: true },
          risk: "medium",
          description: `Lock ${target}`
        }],
        confidence: 0.9
      };
    }
    return {
      text: `Security agent ready. System is ${this.armed ? "armed" : "disarmed"}.`,
      actions: [],
      confidence: 0.4
    };
  }
  /** Check if system is currently armed. */
  isArmed() {
    return this.armed;
  }
  log(action) {
    this.accessLog.push({ action, at: (/* @__PURE__ */ new Date()).toISOString() });
  }
};
var FinanceAgent = class {
  id = "finance";
  name = "Finance Tracker";
  description = "Tracks expenses, manages budgets, and provides spending insights.";
  icon = "wallet";
  status = "active";
  permissions = {
    scopes: ["finance", "memory"],
    canDelegate: false,
    maxRiskLevel: "low"
  };
  capabilities = [
    {
      domain: "finance",
      intents: ["finance.*", "budget.*", "expense.*"],
      keywords: [
        "budget",
        "expense",
        "spend",
        "money",
        "cost",
        "save",
        "b\xFCt\xE7e",
        "harcama",
        "para",
        "maliyet",
        "tasarruf",
        "fiyat"
      ]
    }
  ];
  expenses = [];
  budget = 0;
  score(intent, slots) {
    if (intent.startsWith("finance.") || intent.startsWith("budget.") || intent.startsWith("expense.")) return 0.9;
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(budget|expense|spend|money|cost|save|bütçe|harcama|para|fiyat)\b/.test(text)) return 0.65;
    if (/\$?\d+(?:\.\d{2})?\s*(?:TL|USD|EUR|\$|₺)?/.test(text)) return 0.4;
    return 0;
  }
  async handle(intent, slots, _ctx) {
    if (intent === "finance.add_expense" || intent === "expense.add") {
      const amount = Number(slots.amount ?? 0);
      const category = String(slots.category ?? "general");
      const desc = String(slots.description ?? slots.text ?? "");
      if (amount > 0) {
        this.expenses.push({ amount, category, description: desc, at: (/* @__PURE__ */ new Date()).toISOString() });
        const total = this.getTotalSpending();
        return {
          text: `\u{1F4B0} Expense recorded: ${amount} for "${desc}" (${category}). Total spending: ${total}.`,
          actions: [{
            kind: "finance.record",
            params: { amount, category, description: desc },
            risk: "low",
            description: `Record expense: ${amount}`
          }],
          confidence: 0.9
        };
      }
    }
    if (intent === "finance.set_budget" || intent === "budget.set") {
      const amount = Number(slots.amount ?? 0);
      if (amount > 0) {
        this.budget = amount;
        return {
          text: `\u{1F4CA} Monthly budget set to ${amount}. I'll track your spending against this.`,
          actions: [{
            kind: "finance.set_budget",
            params: { amount },
            risk: "low",
            description: `Set budget to ${amount}`
          }],
          confidence: 0.9
        };
      }
    }
    if (intent === "finance.summary" || intent === "budget.status" || /summary|özet|durum/.test(String(slots.text ?? ""))) {
      const total = this.getTotalSpending();
      const remaining = this.budget > 0 ? this.budget - total : void 0;
      const categories = this.getCategoryBreakdown();
      let text = `\u{1F4CA} Spending summary: ${total} total`;
      if (remaining !== void 0) {
        text += ` | Budget: ${this.budget} | Remaining: ${remaining}`;
      }
      if (categories.length > 0) {
        text += `
${categories.map(([cat, amt]) => `  \u2022 ${cat}: ${amt}`).join("\n")}`;
      }
      return {
        text,
        actions: [],
        confidence: 0.85,
        metadata: { total, budget: this.budget, remaining, expenses: this.expenses.length }
      };
    }
    return {
      text: "I can track expenses, set budgets, and provide spending summaries. Try: 'add expense 50 for groceries'.",
      actions: [],
      confidence: 0.3
    };
  }
  getTotalSpending() {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }
  getCategoryBreakdown() {
    const map = /* @__PURE__ */ new Map();
    for (const e of this.expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }
};

// ../core/src/pipeline.ts
var TEMPLATES = {
  en: {
    greeting: (p) => translate("en", "app.greeting", { name: p.userAddress }),
    nameSet: (p) => `Done \u2014 you can call me ${p.assistantName} from now on, ${p.userAddress}.`,
    addressSet: (p) => `Got it, I'll call you ${p.userAddress} from now on.`,
    languageSet: (p) => `Switched to English. I'm ${p.assistantName}, ${p.userAddress}.`,
    confirmNeeded: (p) => translate("en", "app.confirmNeeded", { name: p.userAddress }),
    sceneActivated: (p) => `On it, ${p.userAddress} \u2014 running your scene now.`,
    deviceRenamed: (_p) => `Done \u2014 device renamed successfully.`
  },
  tr: {
    greeting: (p) => translate("tr", "app.greeting", { name: p.userAddress }),
    nameSet: (p) => `Tamamd\u0131r, bundan sonra bana ${p.assistantName} diyebilirsin ${p.userAddress}.`,
    addressSet: (p) => `Anla\u015F\u0131ld\u0131, sana bundan sonra ${p.userAddress} diye seslenece\u011Fim.`,
    languageSet: (p) => `T\xFCrk\xE7eye ge\xE7tim. Ben ${p.assistantName}, ${p.userAddress}.`,
    confirmNeeded: (p) => translate("tr", "app.confirmNeeded", { name: p.userAddress }),
    sceneActivated: (p) => `Hemen ${p.userAddress}, sahneni \xE7al\u0131\u015Ft\u0131r\u0131yorum.`,
    deviceRenamed: (_p) => `Tamam, cihaz ba\u015Far\u0131yla yeniden adland\u0131r\u0131ld\u0131.`
  }
};
function sceneActionRisk(kind) {
  const k = kind.toLowerCase();
  if (/(delete|remove|wipe|reset)/.test(k)) return 4 /* Critical */;
  if (/(lock|unlock|door|garage|security|disarm|arm)/.test(k)) return 3 /* High */;
  return 2 /* Medium */;
}
function sceneStep(action) {
  const detail = Object.entries(action.params).map(([key, value]) => `${key}=${value}`).join(" ");
  const summary = detail ? `${action.kind} (${detail})` : action.kind;
  return {
    summary,
    action: { kind: action.kind, risk: sceneActionRisk(action.kind), description: summary }
  };
}
function t(lang, key, p) {
  const base = lang.split("-")[0];
  return (TEMPLATES[base] ?? TEMPLATES.en)[key](p);
}
function extractIntent(utterance) {
  const u = utterance.trim();
  const lower = u.toLowerCase();
  let m;
  if (m = u.match(/(?:your name is|call yourself|ad(?:ın)? )\s*([\p{L}][\p{L}\d]*)/iu)) {
    return { name: "personalization.setName", slots: { name: m[1] } };
  }
  if (m = u.match(/(?:call me|bana)\s+([\p{L}][\p{L}\d]*)\s*(?:de|diye)?/iu)) {
    return { name: "personalization.setAddress", slots: { address: m[1] } };
  }
  if (/(?:speak|switch to)\s+turkish|türkçe(?:ye)?\s*(?:geç|konuş)?/i.test(lower)) {
    return { name: "personalization.setLanguage", slots: { language: "tr" } };
  }
  if (/(?:speak|switch to)\s+english|ingilizce(?:ye)?/i.test(lower)) {
    return { name: "personalization.setLanguage", slots: { language: "en" } };
  }
  if (m = u.match(/(?:open|launch|start|aç|başlat)\s+(.+)/i)) {
    return { name: "pc.app.launch", slots: { appName: m[1] } };
  }
  if (m = u.match(/(?:close|quit|kapat)\s+(.+)/i)) {
    return { name: "pc.app.close", slots: { appName: m[1] } };
  }
  if (/(?:work mode|çalışma modu)/i.test(lower)) {
    return { name: "pc.workmode.enter", slots: {} };
  }
  if (/(?:exit work mode|çalışma modundan çık)/i.test(lower)) {
    return { name: "pc.workmode.exit", slots: {} };
  }
  if (m = u.match(/(?:set volume|ses(?:i)?|volume)\s*(?:to\s+)?(\d+)/i)) {
    return { name: "pc.system.volume", slots: { level: m[1] } };
  }
  if (/(?:lock screen|ekranı kilitle|kilitle)/i.test(lower)) {
    return { name: "pc.system.lock", slots: {} };
  }
  if (/(?:sleep|uyku|uyut)/i.test(lower)) {
    return { name: "pc.system.sleep", slots: {} };
  }
  if (m = u.match(/(?:delete file|dosya sil|sil)\s+(.+)/i)) {
    return { name: "pc.file.delete", slots: { path: m[1] } };
  }
  if (m = u.match(/(?:create file|dosya oluştur|oluştur)\s+(.+)/i)) {
    return { name: "pc.file.create", slots: { path: m[1] } };
  }
  if (/\b(light|lamp|ışık|lamba)\b/i.test(lower)) {
    const on = /\b(on|aç)\b/i.test(lower);
    const roomMatch = lower.match(
      /\b(living|bedroom|kitchen|bathroom|office|salon|yatak|mutfak)\b/i
    );
    const slots = { device: "light", state: on ? "on" : "off" };
    if (roomMatch) slots.room = roomMatch[1].toLowerCase();
    return { name: "home.control", slots };
  }
  if (m = u.match(/rename\s+(.+?)\s+to\s+(\S+)/i)) {
    return { name: "home.rename", slots: { deviceRef: m[1], newName: m[2] } };
  }
  if (m = u.match(/(.+?)'(?:in|ın|nin|nın)\s+ad(?:ı|ın)(?:ı|nı)?\s+([\p{L}\d]+)\s+(?:koy|yap)/iu)) {
    return { name: "home.rename", slots: { deviceRef: m[1], newName: m[2] } };
  }
  if (m = u.match(/(.+?)'(?:a|e|ya|ye)\s+([\p{L}\d]+)\s+de/iu)) {
    return { name: "home.rename", slots: { deviceRef: m[1], newName: m[2] } };
  }
  return { name: "chitchat", slots: { text: u } };
}
var PersonalizationAgent = class {
  name = "personalization";
  canHandle(intent) {
    return intent.name.startsWith("personalization.");
  }
  async plan(intent, ctx) {
    let patch = {};
    let key = "greeting";
    if (intent.name === "personalization.setName") {
      patch = { assistantName: intent.slots.name };
      key = "nameSet";
    } else if (intent.name === "personalization.setAddress") {
      patch = { userAddress: intent.slots.address };
      key = "addressSet";
    } else if (intent.name === "personalization.setLanguage") {
      patch = { language: intent.slots.language };
      key = "languageSet";
    }
    const updated = ctx.memory.updatePersonalization(ctx.userId, patch);
    return {
      steps: [],
      text: t(updated.personalization.language, key, updated.personalization)
    };
  }
};
var HomeAgent = class {
  name = "home";
  canHandle(intent) {
    return intent.name === "home.control" || intent.name === "home.controlByName" || intent.name === "home.rename";
  }
  async plan(intent, ctx) {
    if (intent.name === "home.rename") {
      const deviceRef = intent.slots.deviceRef;
      const newName = intent.slots.newName;
      if (ctx.devices) {
        const device = ctx.devices.findByName(deviceRef) ?? ctx.devices.discoverAll().find(
          (d) => d.name.toLowerCase() === deviceRef.toLowerCase() || d.id === deviceRef
        );
        if (device) {
          ctx.devices.names.rename(device.id, newName);
          ctx.devices.names.addAlias(device.id, device.name);
        }
      }
      return {
        steps: [],
        text: t(ctx.personalization.language, "deviceRenamed", ctx.personalization)
      };
    }
    if (intent.name === "home.controlByName" && ctx.devices) {
      const deviceName = intent.slots.deviceName;
      const desiredOn2 = (intent.slots.state ?? "on") === "on";
      const device = ctx.devices.findByName(deviceName);
      if (!device) {
        return { steps: [], text: `No device found with name "${deviceName}".` };
      }
      if (ctx.twin) {
        const twinPlan = resolveLightPlan(ctx.twin, device.room, desiredOn2, ctx.userId);
        const steps = twinPlan.steps.map((s) => ({
          summary: s.summary,
          action: { kind: "device.light.set", risk: 2 /* Medium */, description: `${s.summary} id=${s.params.id}` }
        }));
        return { steps, text: twinPlan.rationale };
      }
      const state2 = desiredOn2 ? "on" : "off";
      const step2 = {
        summary: `Turn ${state2} ${deviceName}`,
        action: { kind: "device.light.set", risk: 2 /* Medium */, description: state2 }
      };
      return {
        steps: [step2],
        text: t(ctx.personalization.language, "greeting", ctx.personalization)
      };
    }
    const desiredOn = (intent.slots.state ?? "on") === "on";
    const room = intent.slots.room ?? "living";
    if (ctx.twin) {
      const twinPlan = resolveLightPlan(ctx.twin, room, desiredOn, ctx.userId);
      const steps = twinPlan.steps.map((s) => ({
        summary: s.summary,
        action: { kind: "device.light.set", risk: 2 /* Medium */, description: `${s.summary} id=${s.params.id}` }
      }));
      return { steps, text: twinPlan.rationale };
    }
    const state = intent.slots.state ?? "on";
    const step = {
      summary: `Turn ${state} the ${intent.slots.device}`,
      action: { kind: "device.light.set", risk: 2 /* Medium */, description: state }
    };
    return {
      steps: [step],
      text: t(ctx.personalization.language, "greeting", ctx.personalization)
    };
  }
};
var PcCommandAgent = class {
  name = "pc";
  pcAgent;
  constructor(pcAgent) {
    this.pcAgent = pcAgent;
  }
  canHandle(intent) {
    return intent.name.startsWith("pc.");
  }
  async plan(intent, ctx) {
    const category = intent.name.replace("pc.", "");
    const params = { ...intent.slots };
    if (params.level && typeof params.level === "string") {
      params.level = parseInt(params.level, 10);
    }
    if (category === "workmode.enter") {
      const result2 = await this.pcAgent.enterWorkMode();
      const pendingSteps = result2.results.filter((r) => r.requiresConfirmation).map((r) => ({
        summary: r.intent.description ?? r.intent.category,
        action: { kind: `pc.${r.intent.category}`, risk: 3 /* High */, description: r.intent.description ?? "" }
      }));
      const executedSteps = result2.results.filter((r) => r.executed).map((r) => ({
        summary: r.intent.description ?? r.intent.category,
        action: { kind: `pc.${r.intent.category}`, risk: 1 /* Low */, description: r.intent.description ?? "" }
      }));
      const text = result2.stepsPending > 0 ? `Work mode activated. ${result2.stepsExecuted} steps executed, ${result2.stepsPending} awaiting confirmation.` : `Work mode fully activated. ${result2.stepsExecuted} steps executed.`;
      return { steps: [...executedSteps, ...pendingSteps], text };
    }
    if (category === "workmode.exit") {
      await this.pcAgent.exitWorkMode();
      return { steps: [], text: "Work mode deactivated." };
    }
    const pcIntent = {
      category,
      params,
      description: intent.slots.appName ? `${category} ${intent.slots.appName}` : intent.slots.path ? `${category} ${intent.slots.path}` : category
    };
    const result = await this.pcAgent.execute(pcIntent);
    if (result.requiresConfirmation) {
      const step = {
        summary: pcIntent.description ?? category,
        action: { kind: `pc.${category}`, risk: 3 /* High */, description: pcIntent.description ?? "" }
      };
      return {
        steps: [step],
        text: t(ctx.personalization.language, "confirmNeeded", ctx.personalization)
      };
    }
    if (result.error) {
      return { steps: [], text: result.error };
    }
    return {
      steps: [],
      text: `Done: ${pcIntent.description ?? category}`
    };
  }
};
var ChitchatAgent = class {
  name = "chitchat";
  canHandle() {
    return true;
  }
  async plan(intent, ctx) {
    const completion = await ctx.provider.complete({
      messages: [
        {
          role: "system",
          content: `You are ${ctx.personalization.assistantName}. Address the user as ${ctx.personalization.userAddress}. Tone: ${ctx.personalization.tone}. Language: ${ctx.personalization.language}.`
        },
        { role: "user", content: intent.slots.text ?? "" }
      ]
    });
    return { steps: [], text: completion.text };
  }
};
var NexusCore = class {
  memory;
  provider;
  security;
  twin;
  routines;
  household;
  authBridge;
  devices;
  voice;
  pc;
  skillStore;
  skillLearning;
  skillExecutor;
  skillConsent;
  agentRouter;
  agents;
  constructor(deps) {
    this.memory = deps.memory;
    this.provider = deps.provider;
    this.security = deps.security ?? new SecurityMiddleware();
    this.twin = deps.twin;
    this.routines = deps.routines;
    this.household = deps.household;
    this.authBridge = deps.authBridge;
    this.devices = deps.devices ?? new DeviceManager();
    this.voice = new VoiceEngine({
      apiKey: deps.voice?.apiKey,
      sttProvider: deps.voice?.sttProvider,
      ttsProvider: deps.voice?.ttsProvider,
      wakePhrase: this.memory.getProfile("default").personalization.assistantName
    });
    this.pc = createPcAgent({
      adapter: deps.platform?.adapter,
      workModeConfig: deps.platform?.workMode
    });
    this.skillStore = new SkillStore();
    this.skillLearning = new SkillLearningEngine(this.skillStore, {
      threshold: deps.skills?.threshold,
      maxPatterns: deps.skills?.maxPatterns
    });
    this.skillExecutor = new SkillExecutor(this.skillStore);
    this.skillConsent = new SkillConsentManager(this.skillStore);
    this.agentRouter = deps.agentRouter ?? this.createDefaultRouter();
    this.agents = [new PersonalizationAgent(), new PcCommandAgent(this.pc), new HomeAgent(), new ChitchatAgent()];
  }
  /** Create a default AgentRouter with all specialized agents registered. */
  createDefaultRouter() {
    const router = new AgentRouter();
    router.register(new MultiHomeAgent());
    router.register(new LifeAgent());
    router.register(new KnowledgeAgent());
    router.register(new SecurityAgent());
    router.register(new FinanceAgent());
    return router;
  }
  /**
   * Authenticated handle: validates a session token before processing.
   * Throws AuthenticationError if the token is invalid or expired (FAZ 14).
   */
  async handleAuthenticated(sessionToken, utterance, options = {}) {
    if (!this.authBridge) throw new Error("authBridge is required for handleAuthenticated");
    const ctx = this.authBridge.requireAuth(sessionToken);
    return this.handle(ctx.account.id, utterance, options);
  }
  async handle(userId, utterance, options = {}) {
    this.memory.remember(userId, { role: "user", text: utterance });
    const routineResponse = this.tryRoutine(userId, utterance, options);
    if (routineResponse) return routineResponse;
    let intent = extractIntent(utterance);
    if (intent.name === "chitchat") {
      const named = this.resolveNamedDevice(utterance);
      if (named) intent = named;
    }
    const agent = this.agents.find((a) => a.canHandle(intent));
    const { steps, text } = await agent.plan(intent, {
      userId,
      personalization: this.memory.getProfile(userId).personalization,
      memory: this.memory,
      provider: this.provider,
      twin: this.twin,
      devices: this.devices
    });
    const executed = [];
    const pending = [];
    const denied = [];
    const approvalTokens = [];
    for (const step of steps) {
      if (this.household && this.isDeviceAction(step.action.kind)) {
        const deviceId = this.extractDeviceId(step);
        const requiredAction = this.mapToHouseholdAction(step.action.kind);
        if (deviceId && !this.household.canAccess(userId, deviceId, requiredAction)) {
          denied.push(step);
          continue;
        }
      }
      const result = this.security.guard(step.action, () => step);
      if (result.status === "denied") continue;
      if (result.status === "pending") {
        if (options.confirm) {
          this.security.approve(result.approval.token, () => {
          });
          executed.push(step);
        } else {
          approvalTokens.push(result.approval.token);
          pending.push(step);
        }
      } else {
        executed.push(step);
      }
    }
    const finalP = this.memory.getProfile(userId).personalization;
    const responseText = pending.length > 0 ? t(finalP.language, "confirmNeeded", finalP) : text;
    this.memory.remember(userId, { role: "assistant", text: responseText });
    this.voice.setWakePhrase(finalP.assistantName);
    this.voice.setLanguage(finalP.language);
    this.voice.setTone(finalP.tone);
    const skillResult = this.skillExecutor.execute(intent.name, intent.slots);
    return {
      text: responseText,
      intent: intent.name,
      agent: agent.name,
      executed,
      pending,
      denied: denied.length > 0 ? denied : void 0,
      approvalTokens: approvalTokens.length > 0 ? approvalTokens : void 0,
      appliedSkills: skillResult.applied ? skillResult.skills : void 0
    };
  }
  /**
   * Process incoming voice audio through the full pipeline:
   * Audio → STT → Wake Word → Speaker ID → handle() → TTS → Audio Response
   */
  async handleVoice(audio, options = {}) {
    const voiceInput = await this.voice.listen(audio);
    if (!voiceInput.wakeDetected) {
      return {
        response: { text: "", intent: "none", agent: "none", executed: [], pending: [] },
        voiceInput
      };
    }
    const userId = voiceInput.speaker.identified ? voiceInput.speaker.userId : "default";
    const command = voiceInput.command ?? voiceInput.transcript;
    const response = await this.handle(userId, command, options);
    const voiceOutput = await this.voice.speak(response.text);
    return { response, voiceInput, voiceOutput };
  }
  /**
   * FAZ 5: Observe a follow-up action after a completed request.
   * When the user adjusts something after a command (e.g. dimming lights
   * after "movie mode"), this records the pattern. After enough repetitions,
   * the system proposes a Skill.
   */
  observeFollowUp(lastIntent, lastSlots, followUpActions) {
    return this.skillLearning.observe({
      intentName: lastIntent,
      slots: lastSlots,
      followUpActions
    });
  }
  // ── FAZ 11: SecurityMiddleware public API ─────────────────────────────────
  /** Read-only view of the hash-chained, tamper-evident audit trail. */
  auditLog() {
    return this.security.auditLog();
  }
  /** Recompute the full hash chain to confirm no entry was altered. */
  verifyAuditIntegrity() {
    return this.security.verifyAuditIntegrity();
  }
  /** Approve a held action by its token (from NexusResponse.approvalTokens). */
  approveAction(token, execute) {
    return this.security.approve(token, execute);
  }
  /** Reject a held action by its token. */
  rejectAction(token) {
    this.security.reject(token);
  }
  /** Number of actions currently awaiting approval. */
  pendingApprovals() {
    return this.security.pendingCount();
  }
  // ── FAZ 12: Household access helpers ──────────────────────────────────────
  /** Determine if a step's action kind targets a device. */
  isDeviceAction(kind) {
    return /^device\.|^light\.|^thermostat\.|^lock\.|^door\./i.test(kind);
  }
  /** Extract device ID from a plan step's params (encoded in summary or action). */
  extractDeviceId(step) {
    const idMatch = step.summary.match(/id=(\S+)/) ?? step.action.description?.match(/id=(\S+)/);
    if (idMatch) return idMatch[1];
    const devMatch = step.summary.match(/\b(dev-\w+|[a-z]\d+)\b/);
    return devMatch?.[1];
  }
  /** Map action kind to the household permission level required. */
  mapToHouseholdAction(kind) {
    if (/manage|config|reset|delete/i.test(kind)) return "manage";
    if (/view|status|get|read/i.test(kind)) return "view";
    return "control";
  }
  /** Match a Scene/Routine to the utterance and gate its steps. */
  tryRoutine(userId, utterance, options) {
    if (!this.routines) return void 0;
    const matched = this.routines.matchVoice(utterance);
    if (matched.length === 0) return void 0;
    const routine = matched[0];
    const executed = [];
    const pending = [];
    for (const action of this.routines.plan(routine)) {
      const step = sceneStep(action);
      const result = this.security.guard(step.action, () => step);
      if (result.status === "denied") continue;
      if (result.status === "pending") {
        if (options.confirm) {
          this.security.approve(result.approval.token, () => {
          });
          executed.push(step);
        } else {
          pending.push(step);
        }
      } else {
        executed.push(step);
      }
    }
    const p = this.memory.getProfile(userId).personalization;
    const text = pending.length > 0 ? t(p.language, "confirmNeeded", p) : t(p.language, "sceneActivated", p);
    this.memory.remember(userId, { role: "assistant", text });
    return { text, intent: "routine.run", agent: "routines", executed, pending };
  }
  /**
   * Second-pass name-based intent resolver. Scans the utterance for any known
   * device alias and produces a home.controlByName intent if found.
   */
  resolveNamedDevice(utterance) {
    const lower = utterance.toLowerCase();
    const names = this.devices.names.allNames();
    if (names.size === 0) return null;
    const sorted = [...names.keys()].sort((a, b) => b.length - a.length);
    for (const alias of sorted) {
      if (!lower.includes(alias)) continue;
      const on = /(?:^|\s|'|\b)(on|aç|yak|başlat)(?:\s|$|\b)/i.test(lower);
      const off = /(?:^|\s|'|\b)(off|kapat|söndür|durdur)(?:\s|$|\b)/i.test(lower);
      const state = off ? "off" : "on";
      if (!on && !off) continue;
      return { name: "home.controlByName", slots: { deviceName: alias, state } };
    }
    return null;
  }
};

// ../ai/src/index.ts
var MockProvider = class {
  name = "mock";
  model = "mock-1";
  async complete(request) {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const text = lastUser ? `mock: ${lastUser.content}` : "mock: (no input)";
    return { text, provider: this.name, model: this.model };
  }
};
var OpenAiProvider = class {
  name = "openai";
  model;
  #apiKey;
  constructor(options) {
    if (!options.apiKey) {
      throw new Error("OpenAiProvider requires a non-empty apiKey");
    }
    this.#apiKey = options.apiKey;
    this.model = options.model ?? "gpt-4o-mini";
  }
  async complete(request) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API failed: ${response.status} ${errorBody}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return { text, provider: this.name, model: this.model };
  }
};
var LocalOllamaProvider = class {
  name = "local-ollama";
  model;
  #baseUrl;
  constructor(options) {
    this.#baseUrl = options?.baseUrl ?? "http://127.0.0.1:11434";
    this.model = options?.model ?? "llama3";
  }
  async complete(request) {
    const response = await fetch(`${this.#baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.7
        },
        stream: false
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API failed: ${response.status} ${errorBody}`);
    }
    const data = await response.json();
    const text = data.message?.content || "";
    return { text, provider: this.name, model: this.model };
  }
};
function selectProvider(input) {
  if (input.provider === "openai" && input.openaiApiKey) {
    return new OpenAiProvider({ apiKey: input.openaiApiKey });
  }
  if (input.provider === "local") {
    return new LocalOllamaProvider({ baseUrl: input.localBaseUrl });
  }
  return new MockProvider();
}

// ../connectors/src/index.ts
var StoreError = class extends Error {
};
var PAID_PLANS = /* @__PURE__ */ new Set(["premium", "family"]);
var ConnectorStore = class {
  constructor(registry, devices) {
    this.registry = registry;
    this.devices = devices;
  }
  registry;
  devices;
  installed = /* @__PURE__ */ new Set();
  /** The catalog as seen by a user on a given plan (installed + lock state). */
  catalog(plan) {
    return this.registry.list().map((manifest) => ({
      manifest,
      installed: this.installed.has(manifest.id),
      locked: this.isLocked(manifest, plan)
    }));
  }
  /** Whether a connector requires a plan the user does not have. */
  isLocked(manifest, plan) {
    return manifest.premium && !PAID_PLANS.has(plan);
  }
  isInstalled(id) {
    return this.installed.has(id);
  }
  listInstalled() {
    return [...this.installed];
  }
  /**
   * Install a connector from the catalog onto the given plan. Throws if the
   * plugin is unknown or the plan is not entitled to a premium connector.
   */
  install(id, plan) {
    const plugin = this.registry.get(id);
    if (!plugin) throw new StoreError(`No connector named ${id} in the catalog.`);
    if (this.installed.has(id)) return;
    if (this.isLocked(plugin.manifest, plan)) {
      throw new StoreError(
        `Connector ${id} requires a paid plan; current plan "${plan}" is not entitled.`
      );
    }
    this.devices.registerConnector(plugin.create());
    this.installed.add(id);
  }
  /** Uninstall a connector, removing its devices from the manager. */
  uninstall(id) {
    if (!this.installed.has(id)) return false;
    this.devices.unregisterConnector(id);
    this.installed.delete(id);
    return true;
  }
};

// ../plugins/src/hue.ts
var hueManifest = {
  id: "hue",
  name: "Philips Hue",
  vendor: "Signify",
  version: "1.0.0",
  protocol: "zigbee",
  capabilities: ["switch", "brightness", "colorTemp"],
  premium: true
  // Requires paid plan according to FAZ 19
};
var HueConnector = class {
  id = "hue";
  devices = [
    {
      id: "hue-lamp-1",
      name: "Living Room Lamp",
      room: "Living Room",
      manufacturer: "Philips",
      model: "Hue White and Color Ambiance",
      imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=150&q=80",
      firmwareVersion: "1.93.11",
      ipAddress: "192.168.1.104",
      macAddress: "00:17:88:01:00:FF",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      updateAvailable: false,
      analytics: {
        dailyUsageWh: [12, 15, 14, 18, 12, 11, 14],
        weeklyUsageWh: [84, 92, 88, 95],
        anomalyDetected: false
      },
      capabilities: [
        { kind: "switch", value: false },
        { kind: "brightness", value: 100, min: 0, max: 100 },
        { kind: "colorTemp", value: 4e3, min: 2e3, max: 6500 }
      ]
    },
    {
      id: "hue-lamp-2",
      name: "Bedroom Ceiling",
      room: "Bedroom",
      manufacturer: "Philips",
      model: "Hue White",
      imageUrl: "https://images.unsplash.com/photo-1563823298642-1e9a2b535870?auto=format&fit=crop&w=150&q=80",
      firmwareVersion: "1.92.0",
      ipAddress: "192.168.1.105",
      macAddress: "00:17:88:01:01:AA",
      connectionStatus: "offline",
      lastSeen: new Date(Date.now() - 36e5).toISOString(),
      updateAvailable: true,
      analytics: {
        dailyUsageWh: [5, 4, 6, 0, 0, 2, 4],
        weeklyUsageWh: [35, 40, 28, 21],
        anomalyDetected: true
      },
      capabilities: [
        { kind: "switch", value: false },
        { kind: "brightness", value: 50, min: 0, max: 100 }
      ]
    }
  ];
  discover() {
    return this.devices;
  }
  supports(deviceId) {
    return deviceId.startsWith("hue-");
  }
  execute(command) {
    const d = this.devices.find((x) => x.id === command.deviceId);
    if (!d) throw new Error("Device not found");
    const cap = d.capabilities.find((x) => x.kind === command.capability);
    if (!cap) throw new Error("Capability not found");
    const updated = {
      ...d,
      capabilities: d.capabilities.map(
        (c) => c.kind === command.capability ? { ...c, value: command.value } : c
      )
    };
    this.devices = this.devices.map((x) => x.id === command.deviceId ? updated : x);
    return { ok: true, device: updated, message: `Set ${command.capability} to ${command.value}` };
  }
};
function createHuePlugin() {
  return {
    manifest: hueManifest,
    create: () => new HueConnector()
  };
}

// ../plugins/src/tuya.ts
var tuyaManifest = {
  id: "tuya",
  name: "Tuya Smart",
  vendor: "Tuya",
  version: "1.0.0",
  protocol: "wifi",
  capabilities: ["switch", "brightness", "colorTemp"],
  premium: true
  // Requires paid plan
};
var TuyaConnector = class {
  id = "tuya";
  devices = [
    {
      id: "tuya-switch-1",
      name: "Kitchen Switch",
      room: "Kitchen",
      manufacturer: "Tuya",
      model: "Smart Wi-Fi Switch",
      imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=150&q=80",
      firmwareVersion: "2.1.4",
      ipAddress: "192.168.1.110",
      macAddress: "DC:4F:22:98:A1:B3",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      updateAvailable: false,
      analytics: {
        dailyUsageWh: [24, 25, 23, 26, 22, 24, 25],
        weeklyUsageWh: [168, 172, 165, 170],
        anomalyDetected: false
      },
      capabilities: [{ kind: "switch", value: false }]
    },
    {
      id: "tuya-bulb-1",
      name: "Office Light",
      room: "Office",
      manufacturer: "Tuya",
      model: "RGB Smart Bulb",
      imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=150&q=80",
      firmwareVersion: "1.0.8",
      ipAddress: "192.168.1.112",
      macAddress: "DC:4F:22:98:C4:F1",
      connectionStatus: "online",
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      updateAvailable: true,
      analytics: {
        dailyUsageWh: [8, 9, 10, 45, 8, 9, 7],
        weeklyUsageWh: [56, 60, 96, 55],
        anomalyDetected: true
      },
      capabilities: [
        { kind: "switch", value: false },
        { kind: "brightness", value: 80, min: 0, max: 100 }
      ]
    }
  ];
  discover() {
    return this.devices;
  }
  supports(deviceId) {
    return deviceId.startsWith("tuya-");
  }
  execute(command) {
    const d = this.devices.find((x) => x.id === command.deviceId);
    if (!d) throw new Error("Device not found");
    const cap = d.capabilities.find((x) => x.kind === command.capability);
    if (!cap) throw new Error("Capability not found");
    const updated = {
      ...d,
      capabilities: d.capabilities.map(
        (c) => c.kind === command.capability ? { ...c, value: command.value } : c
      )
    };
    this.devices = this.devices.map((x) => x.id === command.deviceId ? updated : x);
    return { ok: true, device: updated, message: `Set ${command.capability} to ${command.value}` };
  }
};
function createTuyaPlugin() {
  return {
    manifest: tuyaManifest,
    create: () => new TuyaConnector()
  };
}

// ../plugins/src/index.ts
var PluginError = class extends Error {
};
var PluginRegistry = class {
  plugins = /* @__PURE__ */ new Map();
  register(plugin) {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new PluginError(`Plugin ${plugin.manifest.id} is already registered.`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
  }
  get(id) {
    return this.plugins.get(id);
  }
  has(id) {
    return this.plugins.has(id);
  }
  list() {
    return [...this.plugins.values()].map((p) => p.manifest);
  }
};

// ../billing/src/index.ts
var PLAN_CATALOG = {
  free: { id: "free", priceCents: 0, currency: "USD", maxDevices: 3, allSkills: false, familySeats: 1 },
  premium: {
    id: "premium",
    priceCents: 999,
    currency: "USD",
    maxDevices: Infinity,
    allSkills: true,
    familySeats: 1,
    patreonTierId: "tier_premium"
  },
  family: {
    id: "family",
    priceCents: 1799,
    currency: "USD",
    maxDevices: Infinity,
    allSkills: true,
    familySeats: 6,
    patreonTierId: "tier_family"
  }
};
var SandboxPaymentProvider = class {
  constructor(declineFor = /* @__PURE__ */ new Set()) {
    this.declineFor = declineFor;
  }
  declineFor;
  sandbox = true;
  seq = 0;
  charge(customerId, amountCents) {
    if (amountCents <= 0) return { ok: true, chargeId: `free_${++this.seq}` };
    if (this.declineFor.has(customerId)) {
      return { ok: false, declineReason: "card_declined" };
    }
    return { ok: true, chargeId: `sbx_${++this.seq}` };
  }
};
var BillingError = class extends Error {
};
var BillingService = class {
  constructor(provider, options = {}) {
    this.provider = provider;
    this.now = options.now ?? (() => Date.now());
    this.taxRate = options.taxRate ?? 0;
    this.maxDunning = options.maxDunningAttempts ?? 3;
    this.patreonConfig = options.patreon;
  }
  provider;
  subs = /* @__PURE__ */ new Map();
  invoices = [];
  promoCodes = /* @__PURE__ */ new Map();
  /** Maps Patreon patron ID → NEXUS customer ID for webhook resolution. */
  patronToCustomer = /* @__PURE__ */ new Map();
  now;
  taxRate;
  maxDunning;
  patreonConfig;
  canceledThisPeriod = 0;
  seq = 0;
  // ── Patreon OAuth helpers ────────────────────────────────────────────────
  /** Build the Patreon OAuth authorization URL for account linking. */
  getPatreonAuthUrl(state) {
    if (!this.patreonConfig) throw new BillingError("Patreon not configured.");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.patreonConfig.clientId,
      redirect_uri: this.patreonConfig.redirectUri,
      scope: "identity identity[email] campaigns.members",
      state
    });
    return `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
  }
  /** Get the Patreon tier URL for direct subscription. */
  getCheckoutUrl(plan) {
    if (!this.patreonConfig) throw new BillingError("Patreon not configured.");
    const tier = PLAN_CATALOG[plan];
    if (!tier.patreonTierId) throw new BillingError("This plan has no Patreon tier.");
    return `https://www.patreon.com/join/${this.patreonConfig.campaignId}/checkout?rid=${tier.patreonTierId}`;
  }
  // ── Patreon webhook processing ──────────────────────────────────────────
  /**
   * Process a Patreon webhook event. This is the primary subscription driver:
   * Patreon tells us when a patron pledges, updates, or deletes their pledge.
   */
  handlePatreonWebhook(event) {
    const customerId = this.patronToCustomer.get(event.patronId);
    if (!customerId) return void 0;
    const tierId = event.tierId;
    const plan = this.resolvePlanFromTier(tierId);
    if (event.type === "members:pledge:create") {
      const sub = {
        customerId,
        plan,
        status: "active",
        trialEndsAt: null,
        failedAttempts: 0,
        patreonPatronId: event.patronId,
        patreonPledgeId: event.pledgeId
      };
      this.subs.set(customerId, sub);
      this.writeInvoice(customerId, plan, event.amountCents, event.currency, "patreon");
      return sub;
    }
    if (event.type === "members:pledge:update") {
      if (event.status === "declined_patron") {
        return this.handleDecline(customerId);
      }
      const sub = {
        customerId,
        plan,
        status: "active",
        trialEndsAt: null,
        failedAttempts: 0,
        patreonPatronId: event.patronId,
        patreonPledgeId: event.pledgeId
      };
      this.subs.set(customerId, sub);
      return sub;
    }
    if (event.type === "members:pledge:delete") {
      const existing = this.subs.get(customerId);
      if (existing) {
        const canceled = { ...existing, status: "canceled" };
        this.subs.set(customerId, canceled);
        this.canceledThisPeriod++;
        return canceled;
      }
    }
    return void 0;
  }
  /** Link a NEXUS account to a Patreon patron ID (called after OAuth callback). */
  linkPatron(customerId, patronId) {
    this.patronToCustomer.set(patronId, customerId);
    const sub = this.subs.get(customerId);
    if (sub) {
      this.subs.set(customerId, { ...sub, patreonPatronId: patronId });
    }
  }
  // ── Standard subscription lifecycle ─────────────────────────────────────
  /** Start a subscription, optionally with a free trial. */
  subscribe(customerId, plan, trialDays = 0) {
    if (this.subs.has(customerId)) throw new BillingError("Customer already has a subscription.");
    const trialEndsAt = trialDays > 0 ? this.now() + trialDays * 864e5 : null;
    const sub = {
      customerId,
      plan,
      status: trialEndsAt ? "trialing" : "active",
      trialEndsAt,
      failedAttempts: 0
    };
    if (!trialEndsAt && PLAN_CATALOG[plan].priceCents > 0) {
      return this.charge(sub);
    }
    this.subs.set(customerId, sub);
    return sub;
  }
  /** Renew at period end (or convert an expired trial). */
  renew(customerId) {
    const sub = this.require(customerId);
    if (sub.status === "canceled") throw new BillingError("Subscription is canceled.");
    return this.charge(sub);
  }
  /** Upgrade/downgrade. Downgrade to free stops billing gracefully. */
  changePlan(customerId, plan) {
    const sub = this.require(customerId);
    const updated = { ...sub, plan };
    if (PLAN_CATALOG[plan].priceCents === 0) {
      const settled = { ...updated, status: "active", failedAttempts: 0 };
      this.subs.set(customerId, settled);
      return settled;
    }
    return this.charge(updated);
  }
  /** Self-service cancellation — no hidden barriers. */
  cancel(customerId) {
    const sub = this.require(customerId);
    const canceled = { ...sub, status: "canceled" };
    this.subs.set(customerId, canceled);
    this.canceledThisPeriod++;
    return canceled;
  }
  get(customerId) {
    return this.subs.get(customerId);
  }
  invoicesFor(customerId) {
    return this.invoices.filter((i) => i.customerId === customerId);
  }
  // ── Promo codes ─────────────────────────────────────────────────────────
  addPromoCode(code, discountPercent, validDays, maxUses = 100) {
    const promo = {
      code: code.toUpperCase(),
      discountPercent: Math.min(100, Math.max(0, discountPercent)),
      validUntil: this.now() + validDays * 864e5,
      maxUses,
      usedCount: 0
    };
    this.promoCodes.set(promo.code, promo);
    return promo;
  }
  validatePromo(code) {
    const promo = this.promoCodes.get(code.toUpperCase());
    if (!promo) return void 0;
    if (promo.validUntil < this.now()) return void 0;
    if (promo.usedCount >= promo.maxUses) return void 0;
    return promo;
  }
  redeemPromo(code) {
    const promo = this.validatePromo(code);
    if (!promo) throw new BillingError("Invalid or expired promo code.");
    promo.usedCount++;
    return promo.discountPercent;
  }
  // ── Revenue metrics ─────────────────────────────────────────────────────
  getMetrics() {
    let mrrCents = 0;
    let activeSubscribers = 0;
    const planDistribution = { free: 0, premium: 0, family: 0 };
    for (const sub of this.subs.values()) {
      planDistribution[sub.plan]++;
      if (sub.status === "active" || sub.status === "trialing") {
        const price = PLAN_CATALOG[sub.plan].priceCents;
        if (price > 0) {
          mrrCents += price;
          activeSubscribers++;
        }
      }
    }
    const totalAtStart = activeSubscribers + this.canceledThisPeriod;
    const churnRate = totalAtStart > 0 ? this.canceledThisPeriod / totalAtStart : 0;
    return {
      mrrCents,
      activeSubscribers,
      churned: this.canceledThisPeriod,
      churnRate,
      planDistribution
    };
  }
  /** Reset period metrics (called at the start of each billing period). */
  resetPeriodMetrics() {
    this.canceledThisPeriod = 0;
  }
  // ── Private helpers ─────────────────────────────────────────────────────
  resolvePlanFromTier(tierId) {
    for (const [id, plan] of Object.entries(PLAN_CATALOG)) {
      if (plan.patreonTierId === tierId) return id;
    }
    return "free";
  }
  handleDecline(customerId) {
    const sub = this.subs.get(customerId);
    if (!sub) return { customerId, plan: "free", status: "active", trialEndsAt: null, failedAttempts: 0 };
    const failedAttempts = sub.failedAttempts + 1;
    if (failedAttempts >= this.maxDunning) {
      const downgraded = { ...sub, plan: "free", status: "active", failedAttempts: 0 };
      this.subs.set(customerId, downgraded);
      return downgraded;
    }
    const pastDue = { ...sub, status: "past_due", failedAttempts };
    this.subs.set(customerId, pastDue);
    return pastDue;
  }
  charge(sub) {
    const price = PLAN_CATALOG[sub.plan].priceCents;
    const result = this.provider.charge(sub.customerId, price, PLAN_CATALOG[sub.plan].currency);
    if (result.ok) {
      this.writeInvoice(sub.customerId, sub.plan, price, PLAN_CATALOG[sub.plan].currency, "sandbox");
      const settled = {
        ...sub,
        status: "active",
        trialEndsAt: null,
        failedAttempts: 0
      };
      this.subs.set(sub.customerId, settled);
      return settled;
    }
    const failedAttempts = sub.failedAttempts + 1;
    if (failedAttempts >= this.maxDunning) {
      const downgraded = { ...sub, plan: "free", status: "active", failedAttempts: 0 };
      this.subs.set(sub.customerId, downgraded);
      return downgraded;
    }
    const pastDue = { ...sub, status: "past_due", failedAttempts };
    this.subs.set(sub.customerId, pastDue);
    return pastDue;
  }
  writeInvoice(customerId, plan, subtotalCents, currency, source) {
    const taxCents = Math.round(subtotalCents * this.taxRate);
    this.invoices.push({
      id: `inv_${++this.seq}`,
      customerId,
      plan,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      currency,
      at: new Date(this.now()).toISOString(),
      source
    });
  }
  require(customerId) {
    const sub = this.subs.get(customerId);
    if (!sub) throw new BillingError("No subscription for this customer.");
    return sub;
  }
};

// ../legal/src/service.ts
var LegalError = class extends Error {
};
var LegalService = class {
  documents = /* @__PURE__ */ new Map();
  consents = /* @__PURE__ */ new Map();
  requests = [];
  now;
  seq = 0;
  constructor(options = {}) {
    this.now = options.now ?? (() => /* @__PURE__ */ new Date());
    this.seedDocuments();
  }
  // ── Document Access ───────────────────────────────────────────────────────
  getDocument(type, locale = "en") {
    return this.documents.get(`${type}:${locale}`) ?? this.documents.get(`${type}:en`);
  }
  getTermsOfService(locale = "en") {
    return this.getDocument("terms", locale)?.content ?? "";
  }
  getPrivacyPolicy(locale = "en") {
    return this.getDocument("privacy", locale)?.content ?? "";
  }
  getCookiePolicy(locale = "en") {
    return this.getDocument("cookies", locale)?.content ?? "";
  }
  // ── Consent Management ────────────────────────────────────────────────────
  /** Record that a user granted consent for a category. */
  grantConsent(userId, category) {
    const record = {
      userId,
      category,
      granted: true,
      grantedAt: this.now().toISOString()
    };
    const list = this.consents.get(userId) ?? [];
    const filtered = list.filter((c) => c.category !== category);
    filtered.push(record);
    this.consents.set(userId, filtered);
    return record;
  }
  /** Revoke a previously granted consent. */
  revokeConsent(userId, category) {
    const list = this.consents.get(userId) ?? [];
    const existing = list.find((c) => c.category === category);
    if (!existing) throw new LegalError(`No consent record for ${category}`);
    const revoked = {
      ...existing,
      granted: false,
      revokedAt: this.now().toISOString()
    };
    const filtered = list.filter((c) => c.category !== category);
    filtered.push(revoked);
    this.consents.set(userId, filtered);
    return revoked;
  }
  /** Check if a user has active consent for a category. */
  hasConsent(userId, category) {
    const list = this.consents.get(userId) ?? [];
    const record = list.find((c) => c.category === category);
    return record?.granted === true;
  }
  /** Get all consent records for a user. */
  getConsents(userId) {
    return [...this.consents.get(userId) ?? []];
  }
  // ── Data Subject Requests (GDPR Article 15/17, KVKK) ──────────────────────
  /**
   * Request data export — collects all user data into a portable format.
   * The actual data comes from external sources; this manages the request lifecycle.
   */
  requestDataExport(userId, userData) {
    const request = {
      id: `dsr-${++this.seq}`,
      userId,
      type: "export",
      status: userData ? "completed" : "pending",
      createdAt: this.now().toISOString(),
      completedAt: userData ? this.now().toISOString() : void 0,
      data: userData
    };
    this.requests.push(request);
    return request;
  }
  /**
   * Request data deletion — erases all personal data.
   * Returns completed immediately in dev mode; real impl queues for async processing.
   */
  requestDataDeletion(userId) {
    this.consents.delete(userId);
    const request = {
      id: `dsr-${++this.seq}`,
      userId,
      type: "delete",
      status: "completed",
      createdAt: this.now().toISOString(),
      completedAt: this.now().toISOString()
    };
    this.requests.push(request);
    return request;
  }
  /** Get all data subject requests for a user. */
  getRequests(userId) {
    return this.requests.filter((r) => r.userId === userId);
  }
  /** Get a specific request by ID. */
  getRequest(id) {
    return this.requests.find((r) => r.id === id);
  }
  // ── Voice Recording Consent ───────────────────────────────────────────────
  /** Whether voice processing is allowed — explicit consent required (GDPR Art 7). */
  canProcessVoice(userId) {
    return this.hasConsent(userId, "voice_recording");
  }
  // ── Seed Documents ────────────────────────────────────────────────────────
  seedDocuments() {
    const version = "1.0.0";
    const date = "2026-01-01";
    this.documents.set("terms:en", {
      type: "terms",
      locale: "en",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI \u2014 Terms of Service",
        "",
        "1. Acceptance: By using NEXUS, you agree to these terms.",
        "2. Service: NEXUS provides AI-powered smart home automation.",
        "3. Accounts: You are responsible for your account security.",
        "4. Subscriptions: Paid plans are billed through Patreon.",
        "5. Data: We process data as described in our Privacy Policy.",
        "6. Termination: You may cancel at any time; data deletion available on request.",
        "7. Liability: Service provided as-is; no guarantee of uninterrupted operation.",
        "8. Changes: We may update these terms with 30 days notice."
      ].join("\n")
    });
    this.documents.set("privacy:en", {
      type: "privacy",
      locale: "en",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI \u2014 Privacy Policy",
        "",
        "1. Data Controller: NEXUS AI.",
        "2. Data Collected: Account info, device states, voice commands (with consent), usage patterns.",
        "3. Legal Basis: Consent (voice), legitimate interest (service operation), contract (account).",
        "4. Storage: Data encrypted at rest; cloud memory synced across your devices only.",
        "5. Third Parties: Patreon (payments); no data sold to advertisers.",
        "6. Retention: Active account data retained; deleted within 30 days of deletion request.",
        "7. Your Rights: Access, rectification, erasure, portability, restriction, objection.",
        "8. Contact: privacy@nexus.ai"
      ].join("\n")
    });
    this.documents.set("cookies:en", {
      type: "cookies",
      locale: "en",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI \u2014 Cookie Policy",
        "",
        "1. Essential Cookies: Required for authentication and session management.",
        "2. Analytics Cookies: Used only with your explicit consent.",
        "3. No Tracking: We do not use third-party advertising cookies.",
        "4. Management: You can revoke cookie consent at any time in Settings."
      ].join("\n")
    });
    this.documents.set("terms:tr", {
      type: "terms",
      locale: "tr",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI \u2014 Kullan\u0131m \u015Eartlar\u0131",
        "",
        "1. Kabul: NEXUS'u kullanarak bu \u015Fartlar\u0131 kabul etmi\u015F olursunuz.",
        "2. Hizmet: NEXUS, yapay zek\xE2 destekli ak\u0131ll\u0131 ev otomasyonu sunar.",
        "3. Hesaplar: Hesap g\xFCvenli\u011Finizden siz sorumlusunuz.",
        "4. Abonelikler: \xDCcretli planlar Patreon \xFCzerinden faturaland\u0131r\u0131l\u0131r.",
        "5. Veri: Verileriniz Gizlilik Politikam\u0131zda a\xE7\u0131kland\u0131\u011F\u0131 \u015Fekilde i\u015Flenir.",
        "6. Fesih: \u0130stedi\u011Finiz zaman iptal edebilirsiniz; veri silme talebi olu\u015Fturabilirsiniz.",
        "7. Sorumluluk: Hizmet oldu\u011Fu gibi sunulur; kesintisiz \xE7al\u0131\u015Fma garantisi yoktur.",
        "8. De\u011Fi\u015Fiklikler: Bu \u015Fartlar\u0131 30 g\xFCn \xF6nceden bildirerek g\xFCncelleyebiliriz."
      ].join("\n")
    });
    this.documents.set("privacy:tr", {
      type: "privacy",
      locale: "tr",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI \u2014 Gizlilik Politikas\u0131",
        "",
        "1. Veri Sorumlusu: NEXUS AI.",
        "2. Toplanan Veriler: Hesap bilgileri, cihaz durumlar\u0131, sesli komutlar (onay ile), kullan\u0131m kal\u0131plar\u0131.",
        "3. Hukuki Dayanak: R\u0131za (ses), me\u015Fru menfaat (hizmet), s\xF6zle\u015Fme (hesap).",
        "4. Depolama: Veriler \u015Fifreli saklan\u0131r; bulut haf\u0131za yaln\u0131zca kendi cihazlar\u0131n\u0131z aras\u0131nda senkronlan\u0131r.",
        "5. \xDC\xE7\xFCnc\xFC Taraflar: Patreon (\xF6demeler); reklam verenlerine veri sat\u0131lmaz.",
        "6. Saklama: Aktif hesap verisi saklan\u0131r; silme talebinden sonra 30 g\xFCn i\xE7inde silinir.",
        "7. Haklar\u0131n\u0131z: Eri\u015Fim, d\xFCzeltme, silme, ta\u015F\u0131nabilirlik, k\u0131s\u0131tlama, itiraz (KVKK m.11).",
        "8. \u0130leti\u015Fim: privacy@nexus.ai"
      ].join("\n")
    });
    this.documents.set("cookies:tr", {
      type: "cookies",
      locale: "tr",
      version,
      effectiveDate: date,
      content: [
        "NEXUS AI \u2014 \xC7erez Politikas\u0131",
        "",
        "1. Zorunlu \xC7erezler: Kimlik do\u011Frulama ve oturum y\xF6netimi i\xE7in gereklidir.",
        "2. Analitik \xC7erezler: Yaln\u0131zca a\xE7\u0131k onay\u0131n\u0131zla kullan\u0131l\u0131r.",
        "3. \u0130zleme Yok: \xDC\xE7\xFCnc\xFC taraf reklam \xE7erezleri kullanm\u0131yoruz.",
        "4. Y\xF6netim: \xC7erez onay\u0131n\u0131z\u0131 istedi\u011Finiz zaman Ayarlar'dan geri alabilirsiniz."
      ].join("\n")
    });
  }
};

// src/index.ts
function createNexusApp(opts = {}) {
  const store2 = opts.store ?? new InMemoryKeyValueStore();
  const rateLimiter = new RateLimiter({ maxRequests: 100, windowMs: 15 * 60 * 1e3 });
  const lockout = new LoginLockout();
  const accounts = new AccountService({ store: store2, rateLimiter, lockout, emailBlocklist: true });
  const userData = new UserDataStore(store2);
  const oauth = buildOAuthRegistry();
  const memory2 = opts.memory ?? new InMemoryUserMemory();
  const provider = opts.config ? selectProvider({
    provider: opts.config.ai.provider,
    openaiApiKey: opts.config.ai.openaiApiKey.reveal()
  }) : selectProvider({ provider: "mock" });
  const security = new SecurityEngine(void 0, store2);
  const routines = new RoutineEngine();
  const core = new NexusCore({ memory: memory2, provider, security, routines });
  const plugins = new PluginRegistry();
  plugins.register(createHuePlugin());
  plugins.register(createTuyaPlugin());
  const connectors = new ConnectorStore(plugins, core.devices);
  const billing = new BillingService(new SandboxPaymentProvider());
  const legal = new LegalService();
  const support = opts.support ?? new SupportService();
  const platform3 = opts.platform ?? new PlatformService();
  const handler = createRequestHandler({
    accounts,
    userData,
    staticRoot: opts.staticRoot,
    oauth,
    core,
    connectors,
    billing,
    legal,
    support,
    platform: platform3
  });
  const timer = setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    try {
      const dueRoutines = routines.due(timeString);
      for (const routine of dueRoutines) {
        console.log(`[RoutineRunner] Executing scheduled routine: ${routine.name} at ${timeString}`);
        const actions = routines.plan(routine);
        for (const action of actions) {
          console.log(`[RoutineRunner] -> Action: ${action.kind}`, action.params);
        }
      }
    } catch (e) {
    }
  }, 6e4);
  timer.unref();
  const destroy = () => clearInterval(timer);
  return {
    handler,
    accounts,
    userData,
    staticRoot: opts.staticRoot,
    oauth,
    core,
    connectors,
    billing,
    legal,
    support,
    platform: platform3,
    destroy
  };
}
function startServer(app2, port2) {
  return new Promise((resolve3) => {
    const server = (0, import_node_http.createServer)(app2.handler);
    server.listen(port2, () => {
      const addr = server.address();
      const boundPort = typeof addr === "object" && addr ? addr.port : port2;
      resolve3({ server, port: boundPort });
    });
  });
}

// src/main.ts
var import_meta3 = {};
var config = loadConfig();
var dataDir = process.env.NEXUS_DATA_DIR ?? (0, import_node_path8.join)((0, import_node_os.homedir)(), ".nexus");
var dbFile = (0, import_node_path8.join)(dataDir, "nexus.db");
var memoryDbFile = (0, import_node_path8.join)(dataDir, "memory.db");
var here = (0, import_node_path8.dirname)((0, import_node_url.fileURLToPath)(import_meta3.url));
var publicRoot = (0, import_node_path8.resolve)(here, "../../../public");
var staticRoot = (0, import_node_fs4.existsSync)(publicRoot) ? publicRoot : (0, import_node_path8.resolve)(here, "../../web/dist");
var store = new SqliteKeyValueStore(dbFile);
var memory = new SqliteUserMemoryStore(memoryDbFile);
var app = createNexusApp({ store, memory, staticRoot, config });
var port = Number(process.env.PORT ?? 4178);
void startServer(app, port).then(({ port: bound }) => {
  console.log(`NEXUS sync server listening on http://localhost:${bound}`);
  console.log(`  data: ${dbFile}`);
  console.log(`  static: ${staticRoot}`);
});
