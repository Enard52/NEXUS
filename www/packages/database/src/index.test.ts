import { describe, expect, it } from "vitest";
import {
  Database,
  DatabaseError,
  InMemoryKeyValueStore,
  type Entity,
  type Migration,
  moduleName,
} from "./index.js";

interface Note extends Entity {
  readonly id: string;
  readonly text: string;
}

describe("@nexus/database", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("database");
  });

  it("stores and retrieves typed entities in a collection", () => {
    const db = new Database();
    const notes = db.collection<Note>("notes");
    notes.put({ id: "a", text: "hello" });
    notes.put({ id: "b", text: "world" });

    expect(notes.get("a")).toEqual({ id: "a", text: "hello" });
    expect(notes.has("b")).toBe(true);
    expect(notes.count()).toBe(2);
    expect(notes.list().map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("isolates collections sharing one backend", () => {
    const store = new InMemoryKeyValueStore();
    const db = new Database(store);
    db.collection<Note>("notes").put({ id: "x", text: "n" });
    db.collection<Note>("drafts").put({ id: "x", text: "d" });

    expect(db.collection<Note>("notes").get("x")?.text).toBe("n");
    expect(db.collection<Note>("drafts").get("x")?.text).toBe("d");
  });

  it("rejects collection names that would break namespacing", () => {
    const db = new Database();
    expect(() => db.collection("bad:name")).toThrow(DatabaseError);
  });

  it("applies migrations once and is idempotent on re-run", () => {
    const db = new Database();
    const migrations: Migration[] = [
      {
        version: 1,
        name: "seed-notes",
        up: (d) => d.collection<Note>("notes").put({ id: "seed", text: "seeded" }),
      },
      {
        version: 2,
        name: "add-welcome",
        up: (d) => d.collection<Note>("notes").put({ id: "welcome", text: "hi" }),
      },
    ];

    const first = db.migrator().run(migrations);
    expect(first).toEqual(["seed-notes", "add-welcome"]);

    const second = db.migrator().run(migrations);
    expect(second).toEqual([]);
    expect(db.migrator().appliedVersions()).toEqual([1, 2]);
    expect(db.collection<Note>("notes").count()).toBe(2);
  });

  it("snapshots and restores all data (backup / disaster recovery)", () => {
    const db = new Database();
    const notes = db.collection<Note>("notes");
    notes.put({ id: "keep", text: "important" });

    const backup = db.snapshot();

    notes.delete("keep");
    notes.put({ id: "junk", text: "corrupt" });
    expect(notes.get("keep")).toBeUndefined();

    db.restore(backup);
    expect(notes.get("keep")).toEqual({ id: "keep", text: "important" });
    expect(notes.get("junk")).toBeUndefined();
  });
});
