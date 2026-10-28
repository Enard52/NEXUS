import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteKeyValueStore } from "@nexus/database";
import { AccountService } from "./index.js";

const CRED = { email: "durable@example.com", password: "supersecret" };

const tmpDirs: string[] = [];
function tmpDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "nexus-accounts-"));
  tmpDirs.push(dir);
  return join(dir, "accounts.sqlite");
}

afterEach(() => {
  while (tmpDirs.length) {
    const dir = tmpDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("durable accounts (FAZ 18): data survives a restart", () => {
  it("keeps registered users and lets them log in after reopening the DB", () => {
    const path = tmpDbPath();

    // ── First run: register + pair a device, then "shut down". ──
    const store1 = new SqliteKeyValueStore(path);
    const svc1 = new AccountService({ store: store1 });
    const account = svc1.register(CRED);
    svc1.pairDevice(account.id, "desktop-pc");
    store1.close();

    // ── Second run (simulated app restart): a brand-new service on the same file. ──
    const store2 = new SqliteKeyValueStore(path);
    const svc2 = new AccountService({ store: store2 });

    // The user still exists and can authenticate — nothing was lost.
    const session = svc2.login(CRED.email, CRED.password);
    const me = svc2.validateSession(session.token);
    expect(me?.id).toBe(account.id);
    expect(me?.email).toBe(CRED.email);
    expect(svc2.listDevices(account.id)).toEqual(["desktop-pc"]);

    // Registering the same email again is still rejected (uniqueness persisted).
    expect(() => svc2.register(CRED)).toThrow();
    store2.close();
  });

  it("persists a live session token across a restart", () => {
    const path = tmpDbPath();

    const store1 = new SqliteKeyValueStore(path);
    const svc1 = new AccountService({ store: store1 });
    svc1.register(CRED);
    const session = svc1.login(CRED.email, CRED.password);
    store1.close();

    const store2 = new SqliteKeyValueStore(path);
    const svc2 = new AccountService({ store: store2 });
    // The token issued before the restart is still valid afterwards.
    expect(svc2.validateSession(session.token)?.email).toBe(CRED.email);
    store2.close();
  });
});
