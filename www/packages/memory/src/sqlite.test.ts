import { expect, it } from "vitest";
import { SqliteUserMemoryStore } from "./sqlite.js";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";

it("stores and retrieves profiles", () => {
  const tmp = mkdtempSync(join(tmpdir(), "nexus-test-"));
  const store = new SqliteUserMemoryStore(join(tmp, "mem.db"));
  const p1 = store.getProfile("u1");
  expect(p1.personalization.userAddress).toBe("there");

  store.updatePersonalization("u1", { userAddress: "Alice" });
  const p2 = store.getProfile("u1");
  expect(p2.personalization.userAddress).toBe("Alice");

  store.close();
});

it("stores turns and respects window size", () => {
  const tmp = mkdtempSync(join(tmpdir(), "nexus-test-"));
  const store = new SqliteUserMemoryStore(join(tmp, "mem2.db"), 3);

  store.remember("u1", { role: "user", text: "t1" });
  store.remember("u1", { role: "assistant", text: "t2" });
  store.remember("u1", { role: "user", text: "t3" });

  let recent = store.recent("u1");
  expect(recent.length).toBe(3);
  expect(recent.map((r) => r.text)).toEqual(["t1", "t2", "t3"]);

  store.remember("u1", { role: "assistant", text: "t4" });
  recent = store.recent("u1");
  expect(recent.length).toBe(3);
  expect(recent.map((r) => r.text)).toEqual(["t2", "t3", "t4"]); // t1 should be gone

  store.close();
});
