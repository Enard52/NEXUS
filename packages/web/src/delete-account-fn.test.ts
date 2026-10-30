import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deleteOwnAccount,
  hasBearer,
  isAuthenticated,
  UNAUTHORIZED,
  USER_TABLES,
  type ServiceClient,
} from "../../../supabase/functions/delete-account/logic";

/**
 * delete-account Edge Function: karar/sıralama mantığı logic.ts'te; Supabase servis istemcisi
 * enjekte edilir. Burada bellek içi sahte istemci ÇAĞRILARI kaydeder — gerçek Supabase'e
 * bağlanılmaz; RLS/cascade davranışı sunucuda ve migrasyonda doğrulanır.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INDEX_SRC = readFileSync(
  join(REPO_ROOT, "supabase", "functions", "delete-account", "index.ts"),
  "utf8",
);

function fakeService(opts: { entitlement?: unknown; deleteUserError?: string } = {}) {
  const calls: string[] = [];
  const client: ServiceClient = {
    from(table) {
      return {
        select: () => ({
          eq: (col, val) => ({
            maybeSingle: async () => {
              calls.push(`select ${table} ${col}=${val}`);
              return { data: opts.entitlement ?? null };
            },
          }),
        }),
        delete: () => ({
          eq: async (col, val) => {
            calls.push(`delete ${table} ${col}=${val}`);
            return {};
          },
        }),
      };
    },
    auth: {
      admin: {
        deleteUser: async (id) => {
          calls.push(`deleteUser ${id}`);
          return { error: opts.deleteUserError ? { message: opts.deleteUserError } : null };
        },
      },
    },
  };
  return { client, calls };
}

describe("delete-account — kimlik doğrulama", () => {
  it("Bearer başlığı yoksa / yanlış biçimdeyse reddeder", () => {
    expect(hasBearer(null)).toBe(false);
    expect(hasBearer(undefined)).toBe(false);
    expect(hasBearer("")).toBe(false);
    expect(hasBearer("Basic abc")).toBe(false);
    expect(hasBearer("bearer abc")).toBe(false);
    expect(hasBearer("Bearer")).toBe(false);
    expect(hasBearer("Bearer abc.def.ghi")).toBe(true);
  });

  it("doğrulanmış kullanıcı yoksa veya hata varsa kimlik doğrulanmış sayılmaz", () => {
    expect(isAuthenticated(null, null)).toBe(false);
    expect(isAuthenticated(undefined, null)).toBe(false);
    expect(isAuthenticated({ id: "u1" }, { message: "jwt expired" })).toBe(false);
    expect(isAuthenticated({ id: "u1" }, null)).toBe(true);
  });

  it("401 yanıtı sabit ve ayrıntı sızdırmaz", () => {
    expect(UNAUTHORIZED).toEqual({ status: 401, body: { error: "unauthorized" } });
  });

  it("index.ts: yetkisiz yollar servis istemcisi oluşturulmadan ve silme çağrısından önce döner", () => {
    const bearerAt = INDEX_SRC.indexOf("hasBearer(auth)");
    const getUserAt = INDEX_SRC.indexOf("anon.auth.getUser()");
    const authCheckAt = INDEX_SRC.indexOf("isAuthenticated(user, userErr)");
    const serviceAt = INDEX_SRC.indexOf("SUPABASE_SERVICE_ROLE_KEY");
    const deleteAt = INDEX_SRC.indexOf("deleteOwnAccount(");
    expect(bearerAt).toBeGreaterThan(-1);
    expect(bearerAt).toBeLessThan(getUserAt);
    expect(getUserAt).toBeLessThan(authCheckAt);
    expect(authCheckAt).toBeLessThan(serviceAt);
    expect(serviceAt).toBeLessThan(deleteAt);
  });

  it("index.ts: silme yalnızca doğrulanmış kullanıcının kimliğiyle çağrılır (istekten id alınmaz)", () => {
    expect(INDEX_SRC).toContain("deleteOwnAccount(service, user!.id)");
    expect(INDEX_SRC).not.toMatch(/req\.(json|text|url)|searchParams/);
  });
});

describe("delete-account — silme akışı", () => {
  it("önce abonelik bilgisini okur, sonra tabloları sırayla siler, en son auth hesabını", async () => {
    const { client, calls } = fakeService({ entitlement: { plan: "plus" } });
    await deleteOwnAccount(client, "u1");
    expect(calls).toEqual([
      "select nexus_entitlements user_id=u1",
      "delete nexus_user_state user_id=u1",
      "delete nexus_devices user_id=u1",
      "delete nexus_entitlements user_id=u1",
      "deleteUser u1",
    ]);
    expect([...USER_TABLES]).toEqual(["nexus_user_state", "nexus_devices", "nexus_entitlements"]);
  });

  it("yalnızca çağıranın kendi kimliğine dokunur", async () => {
    const { client, calls } = fakeService();
    await deleteOwnAccount(client, "u1");
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c.endsWith("u1")).toBe(true);
  });

  it("başarıda ok:true ve hadSubscription abonelik satırına göre", async () => {
    const withSub = await deleteOwnAccount(
      fakeService({ entitlement: { plan: "plus", period_end: "x" } }).client,
      "u1",
    );
    expect(withSub).toEqual({ status: 200, body: { ok: true, hadSubscription: true } });
    const without = await deleteOwnAccount(fakeService().client, "u1");
    expect(without).toEqual({ status: 200, body: { ok: true, hadSubscription: false } });
  });

  it("auth silme başarısızsa 500 + delete_failed döner (yutulmaz, ok:true denmez)", async () => {
    const { client } = fakeService({ deleteUserError: "User not found" });
    const r = await deleteOwnAccount(client, "u1");
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: "delete_failed", detail: "User not found" });
    expect(r.body.ok).toBeUndefined();
  });
});
