import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  DEFAULT_PERSONALIZATION,
  type MemoryTurn,
  type Personalization,
  type UserMemoryStore,
  type UserProfile,
} from "./index.js";

const require = createRequire(import.meta.url);

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

export class SqliteUserMemoryStore implements UserMemoryStore {
  private readonly db: SqliteDatabase;
  private readonly windowSize: number;

  constructor(location: string, windowSize = 20) {
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
        "node:sqlite is unavailable — the durable store requires Node.js 22.5+ " +
          "(this runtime lacks it). Original error: " +
          (err instanceof Error ? err.message : String(err)),
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

  getProfile(userId: string): UserProfile {
    const row = this.db
      .prepare("SELECT personalization FROM profiles WHERE userId = ?")
      .get(userId);
    if (!row) {
      return { userId, personalization: { ...DEFAULT_PERSONALIZATION } };
    }
    return { userId, personalization: JSON.parse(row.personalization as string) };
  }

  updatePersonalization(userId: string, patch: Partial<Personalization>): UserProfile {
    const current = this.getProfile(userId);
    const updated = {
      userId,
      personalization: { ...current.personalization, ...patch },
    };
    this.db
      .prepare(
        "INSERT INTO profiles (userId, personalization) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET personalization = excluded.personalization",
      )
      .run(userId, JSON.stringify(updated.personalization));
    return updated;
  }

  remember(userId: string, turn: Omit<MemoryTurn, "at">): void {
    const at = new Date().toISOString();
    this.db
      .prepare("INSERT INTO turns (userId, role, text, at) VALUES (?, ?, ?, ?)")
      .run(userId, turn.role, turn.text, at);

    // Prune old turns beyond windowSize
    this.db
      .prepare(
        `
      DELETE FROM turns WHERE userId = ? AND id NOT IN (
        SELECT id FROM turns WHERE userId = ? ORDER BY id DESC LIMIT ?
      )
    `,
      )
      .run(userId, userId, this.windowSize);
  }

  recent(userId: string): readonly MemoryTurn[] {
    const rows = this.db
      .prepare("SELECT role, text, at FROM turns WHERE userId = ? ORDER BY id ASC")
      .all(userId);
    return rows.map((r) => ({
      role: r.role as "user" | "assistant",
      text: r.text as string,
      at: r.at as string,
    }));
  }

  close(): void {
    this.db.close();
  }
}
