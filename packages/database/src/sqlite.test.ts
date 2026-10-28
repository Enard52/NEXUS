import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database, type Entity } from "./index.js";
import { SqliteKeyValueStore } from "./sqlite.js";

interface Note extends Entity {
  readonly id: string;
  readonly text: string;
}

const tmpDirs: string[] = [];
function tmpDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "nexus-sqlite-"));
  tmpDirs.push(dir);
  return join(dir, "data.sqlite");
}

afterEach(() => {
  while (tmpDirs.length) {
    const dir = tmpDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("SqliteKeyValueStore", () => {
  it("satisfies the KeyValueStore contract in memory", () => {
    const store = new SqliteKeyValueStore(":memory:");
    store.set("a", "1");
    store.set("b", "2");
    expect(store.get("a")).toBe("1");
    expect(store.has("b")).toBe(true);
    expect(store.has("missing")).toBe(false);
    expect(store.delete("a")).toBe(true);
    expect(store.delete("a")).toBe(false);
    expect(store.get("a")).toBeUndefined();
    store.close();
  });

  it("scans keys by prefix in sorted order", () => {
    const store = new SqliteKeyValueStore(":memory:");
    store.set("accounts:2", "x");
    store.set("accounts:1", "x");
    store.set("sessions:9", "x");
    expect(store.keys("accounts:")).toEqual(["accounts:1", "accounts:2"]);
    expect(store.keys()).toEqual(["accounts:1", "accounts:2", "sessions:9"]);
    store.close();
  });

  it("persists data to disk across reopen (durability)", () => {
    const path = tmpDbPath();

    const first = new SqliteKeyValueStore(path);
    const dbA = new Database(first);
    dbA.collection<Note>("notes").put({ id: "keep", text: "important" });
    first.close();

    // Reopen the same file with a fresh store — the data must still be there.
    const second = new SqliteKeyValueStore(path);
    const dbB = new Database(second);
    expect(dbB.collection<Note>("notes").get("keep")).toEqual({
      id: "keep",
      text: "important",
    });
    second.close();
  });

  it("works as a drop-in Database backend (repository + snapshot)", () => {
    const store = new SqliteKeyValueStore(":memory:");
    const db = new Database(store);
    const notes = db.collection<Note>("notes");
    notes.put({ id: "a", text: "hello" });
    notes.put({ id: "b", text: "world" });
    expect(notes.count()).toBe(2);

    const backup = db.snapshot();
    notes.delete("a");
    expect(notes.count()).toBe(1);
    db.restore(backup);
    expect(notes.count()).toBe(2);
    expect(notes.get("a")?.text).toBe("hello");
    store.close();
  });
});
