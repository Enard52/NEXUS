/**
 * NEXUS AI — Persistence layer & migrations (FAZ 0 foundation, used by 16/18)
 *
 * A dependency-free persistence abstraction so the rest of the system talks to
 * "a database" through one seam. FAZ 16 (cloud memory) and FAZ 18 (backup /
 * disaster recovery) build on this: swap the backend without touching callers.
 *
 * What is real here: a key/value contract, an in-memory backend, typed
 * collections (repository pattern), an idempotent migration runner, and a
 * snapshot/restore path that FAZ 18 backups rely on.
 *
 * External boundary: a durable driver (SQLite/Postgres/managed cloud DB) is a
 * production dependency (FAZ 18). It implements `KeyValueStore` and drops in
 * with no caller changes. We never pretend an in-memory store is durable.
 */

/** The lowest-level contract every backend must satisfy. Values are JSON-safe. */
export interface KeyValueStore {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  /** All keys, optionally restricted to a prefix. */
  keys(prefix?: string): string[];
}

/** Deterministic, in-process backend for dev/test. NOT durable (see header). */
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly data = new Map<string, string>();

  get(key: string): string | undefined {
    return this.data.get(key);
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }

  delete(key: string): boolean {
    return this.data.delete(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  keys(prefix?: string): string[] {
    const all = [...this.data.keys()];
    const filtered = prefix ? all.filter((k) => k.startsWith(prefix)) : all;
    return filtered.sort();
  }
}

/** A record stored in a collection must carry a stable string id. */
export interface Entity {
  readonly id: string;
}

/**
 * A typed collection over a namespaced slice of a KeyValueStore. Serialization
 * is JSON; ids are namespaced as `${collection}:${id}` so one backend can hold
 * many collections without key collisions.
 */
export class Repository<T extends Entity> {
  constructor(
    private readonly store: KeyValueStore,
    private readonly collection: string,
  ) {}

  private keyOf(id: string): string {
    return `${this.collection}:${id}`;
  }

  put(entity: T): T {
    this.store.set(this.keyOf(entity.id), JSON.stringify(entity));
    return entity;
  }

  get(id: string): T | undefined {
    const raw = this.store.get(this.keyOf(id));
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }

  has(id: string): boolean {
    return this.store.has(this.keyOf(id));
  }

  delete(id: string): boolean {
    return this.store.delete(this.keyOf(id));
  }

  /** All entities in this collection, ordered by id. */
  list(): T[] {
    return this.store
      .keys(`${this.collection}:`)
      .map((k) => JSON.parse(this.store.get(k) as string) as T);
  }

  count(): number {
    return this.store.keys(`${this.collection}:`).length;
  }
}

// ── Migrations ───────────────────────────────────────────────────────────────

export interface Migration {
  /** Monotonic version; runner applies in ascending order, each at most once. */
  readonly version: number;
  readonly name: string;
  up(db: Database): void;
}

const MIGRATION_META = "__migrations__";

/**
 * Applies pending migrations idempotently. Applied versions are recorded in a
 * reserved collection so re-running is a no-op — the property production and
 * disaster-recovery restores both depend on.
 */
export class MigrationRunner {
  constructor(private readonly db: Database) {}

  private applied(): Set<number> {
    const raw = this.db.raw.get(MIGRATION_META);
    return new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);
  }

  private record(versions: Set<number>): void {
    this.db.raw.set(MIGRATION_META, JSON.stringify([...versions].sort((a, b) => a - b)));
  }

  /** Runs all not-yet-applied migrations in version order. Returns applied names. */
  run(migrations: readonly Migration[]): string[] {
    const done = this.applied();
    const pending = [...migrations]
      .filter((m) => !done.has(m.version))
      .sort((a, b) => a.version - b.version);
    const ran: string[] = [];
    for (const m of pending) {
      m.up(this.db);
      done.add(m.version);
      ran.push(m.name);
    }
    if (ran.length > 0) this.record(done);
    return ran;
  }

  appliedVersions(): number[] {
    return [...this.applied()].sort((a, b) => a - b);
  }
}

// ── Snapshot / restore (FAZ 18 backup & disaster recovery seam) ───────────────

export interface DatabaseSnapshot {
  readonly takenAt: string;
  readonly entries: Readonly<Record<string, string>>;
}

/** Facade tying a backend together with collections, migrations and backups. */
export class Database {
  /** Escape hatch for the migration runner and snapshotting. */
  readonly raw: KeyValueStore;

  constructor(
    store: KeyValueStore = new InMemoryKeyValueStore(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.raw = store;
  }

  collection<T extends Entity>(name: string): Repository<T> {
    if (name.includes(":")) {
      throw new DatabaseError(`Collection name must not contain ':' (got "${name}")`);
    }
    return new Repository<T>(this.raw, name);
  }

  migrator(): MigrationRunner {
    return new MigrationRunner(this);
  }

  /** Point-in-time copy of every key. FAZ 18 persists this off-box. */
  snapshot(): DatabaseSnapshot {
    const entries: Record<string, string> = {};
    for (const key of this.raw.keys()) {
      entries[key] = this.raw.get(key) as string;
    }
    return { takenAt: this.now().toISOString(), entries };
  }

  /** Replaces all current data with a snapshot (disaster recovery restore). */
  restore(snapshot: DatabaseSnapshot): void {
    for (const key of this.raw.keys()) this.raw.delete(key);
    for (const [key, value] of Object.entries(snapshot.entries)) this.raw.set(key, value);
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export const moduleName = "database" as const;
export const implemented = true;

// Durable, file-backed backend (Node's built-in node:sqlite). Lazily loads
// node:sqlite only when constructed, so importing this package stays safe on
// runtimes without it.
export { SqliteKeyValueStore } from "./sqlite.js";
