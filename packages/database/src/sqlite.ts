/**
 * NEXUS AI — Durable SQLite backend for {@link KeyValueStore} .
 *
 * This is the production drop-in the persistence layer was designed for: it
 * implements the exact same synchronous {@link KeyValueStore} contract as the
 * in-memory store, so every caller (Database, Repository, AccountService, the
 * API server) works unchanged — only the durability changes.
 *
 * Backend: Node's built-in `node:sqlite` (no third-party dependency, no native
 * build step, no external service, no cost). It is loaded lazily so that merely
 * importing `@nexus/database` stays safe on Node versions that predate
 * `node:sqlite` (the repo's .nvmrc pins 20; `node:sqlite` needs 22.5+). The
 * durable store is only ever constructed by the runtime that actually needs it.
 */

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { KeyValueStore } from "./index.js";

const require = createRequire(import.meta.url);

/** Minimal shape of the parts of `node:sqlite` we rely on. */
interface SqliteStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Array<Record<string, unknown>>;
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
}

/**
 * A durable, file-backed key/value store. Values are JSON strings, exactly as
 * the in-memory store expects. A single `kv(key, value)` table is used; prefix
 * scans use a half-open range query so no LIKE-escaping is required.
 */
export class SqliteKeyValueStore implements KeyValueStore {
  private readonly db: SqliteDatabase;

  /**
   * @param location Absolute file path for the database, or ":memory:" for a
   *   transient store. Parent directories are created automatically.
   */
  constructor(location: string) {
    if (location !== ":memory:") {
      mkdirSync(dirname(location), { recursive: true });
    }
    let DatabaseSync: new (path: string) => SqliteDatabase;
    try {
      ({ DatabaseSync } = require("node:sqlite") as {
        DatabaseSync: new (path: string) => SqliteDatabase;
      });
    } catch (err) {
      throw new Error(
        "SQLite is unavailable — the durable store requires Nexus runtime " +
          "(this environment lacks it). Original error: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
    this.db = new DatabaseSync(location);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);");
  }

  get(key: string): string | undefined {
    const row = this.db.prepare("SELECT value FROM kv WHERE key = ?").get(key);
    return row ? (row.value as string) : undefined;
  }

  set(key: string, value: string): void {
    this.db
      .prepare(
        "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .run(key, value);
  }

  delete(key: string): boolean {
    const before = this.has(key);
    this.db.prepare("DELETE FROM kv WHERE key = ?").run(key);
    return before;
  }

  has(key: string): boolean {
    return this.db.prepare("SELECT 1 FROM kv WHERE key = ?").get(key) !== undefined;
  }

  keys(prefix?: string): string[] {
    if (!prefix) {
      const rows = this.db.prepare("SELECT key FROM kv ORDER BY key").all();
      return rows.map((r) => r.key as string);
    }
    // Half-open range [prefix, prefix+\uffff) — avoids LIKE wildcard escaping.
    const upper = prefix + "\uffff";
    const rows = this.db
      .prepare("SELECT key FROM kv WHERE key >= ? AND key < ? ORDER BY key")
      .all(prefix, upper);
    return rows.map((r) => r.key as string);
  }

  /** Release the underlying file handle. */
  close(): void {
    this.db.close();
  }
}
