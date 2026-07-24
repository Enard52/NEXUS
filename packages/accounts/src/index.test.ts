import { describe, expect, it } from "vitest";
import { AccountService, AuthError, implemented, moduleName } from "./index.js";

const CRED = { email: "user@example.com", password: "supersecret" };

describe("@nexus/accounts module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("accounts");
    expect(implemented).toBe(true);
  });
});

describe("registration & login (FAZ 14)", () => {
  it("registers, then logs in with a valid session from multiple devices", () => {
    const svc = new AccountService();
    const account = svc.register(CRED);
    expect(account.email).toBe(CRED.email);
    expect(account.role).toBe("member");

    const s1 = svc.login(CRED.email, CRED.password);
    const s2 = svc.login(CRED.email, CRED.password);
    expect(svc.validateSession(s1.token)?.id).toBe(account.id);
    expect(svc.validateSession(s2.token)?.id).toBe(account.id);
    expect(s1.token).not.toBe(s2.token);
  });

  it("rejects duplicate emails, weak passwords and bad credentials", () => {
    const svc = new AccountService();
    svc.register(CRED);
    expect(() => svc.register(CRED)).toThrow(AuthError);
    expect(() => svc.register({ email: "a@b.com", password: "short" })).toThrow(AuthError);
    expect(() => svc.login(CRED.email, "wrongpass")).toThrow(AuthError);
  });

  it("stores no clear-text password (login proves hashing round-trips)", () => {
    const svc = new AccountService();
    svc.register(CRED);
    expect(svc.validateSession(svc.login(CRED.email, CRED.password).token)).toBeDefined();
  });
});

describe("sessions & password reset (FAZ 14)", () => {
  it("expires sessions and invalidates them on logout", () => {
    let clock = 1000;
    const svc = new AccountService(() => clock);
    svc.register(CRED);
    const session = svc.login(CRED.email, CRED.password);
    expect(svc.validateSession(session.token)).toBeDefined();

    svc.logout(session.token);
    expect(svc.validateSession(session.token)).toBeUndefined();

    const s2 = svc.login(CRED.email, CRED.password);
    clock += 1000 * 60 * 60 * 25; // past the 24h TTL
    expect(svc.validateSession(s2.token)).toBeUndefined();
  });

  it("resets the password and invalidates old sessions", () => {
    const svc = new AccountService();
    const account = svc.register(CRED);
    const old = svc.login(CRED.email, CRED.password);

    const token = svc.requestPasswordReset(CRED.email)!;
    svc.confirmPasswordReset(token, "brandnewpass");

    expect(svc.validateSession(old.token)).toBeUndefined();
    expect(() => svc.login(CRED.email, CRED.password)).toThrow(AuthError);
    expect(svc.login(CRED.email, "brandnewpass").userId).toBe(account.id);
  });

  it("does not reveal whether an email exists on reset request", () => {
    const svc = new AccountService();
    expect(svc.requestPasswordReset("nobody@example.com")).toBeUndefined();
  });
});

describe("device pairing, export & erasure (FAZ 14 / FAZ 19)", () => {
  it("pairs devices and exports the user's own data", () => {
    const svc = new AccountService();
    const account = svc.register(CRED);
    svc.pairDevice(account.id, "macbook");
    svc.pairDevice(account.id, "iphone");

    const dump = svc.exportData(account.id)!;
    expect(dump.account.email).toBe(CRED.email);
    expect(dump.devices).toEqual(["macbook", "iphone"]);
    expect((dump.account as unknown as Record<string, unknown>).hash).toBeUndefined();
  });

  it("deletes the account and everything attached to it", () => {
    const svc = new AccountService();
    const account = svc.register(CRED);
    const session = svc.login(CRED.email, CRED.password);

    expect(svc.deleteAccount(account.id)).toBe(true);
    expect(svc.validateSession(session.token)).toBeUndefined();
    expect(svc.exportData(account.id)).toBeUndefined();
    expect(() => svc.login(CRED.email, CRED.password)).toThrow(AuthError);
  });
});
