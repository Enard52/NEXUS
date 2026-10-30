// NEXUS — delete-account saf mantığı (Deno'ya özgü import YOK; vitest ile test edilir).
// index.ts yalnızca HTTP/Supabase istemci bağlamasını yapar; karar ve sıralama burada.

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export interface DeleteResult {
  status: number;
  body: Record<string, unknown>;
}

/** Kullanıcı tablolarından (kendi satırları) silme zinciri; sıra önemlidir. */
export const USER_TABLES = ["nexus_user_state", "nexus_devices", "nexus_entitlements"] as const;

/** `Authorization: Bearer …` biçimi var mı? (JWT'nin geçerliliğini Supabase doğrular.) */
export function hasBearer(authHeader: string | null | undefined): boolean {
  return (authHeader || "").startsWith("Bearer ");
}

export const UNAUTHORIZED: DeleteResult = { status: 401, body: { error: "unauthorized" } };

/** Doğrulanmış kullanıcı yoksa (hata veya boş) 401. */
export function isAuthenticated(
  user: { id?: string } | null | undefined,
  userErr: unknown,
): boolean {
  return !(userErr || !user);
}

/** Servis istemcisinin silme için kullanılan en küçük yüzeyi (testte bellek içi sahte ile doldurulur). */
export interface ServiceClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): { maybeSingle(): PromiseLike<{ data: unknown }> };
    };
    delete(): { eq(col: string, val: string): PromiseLike<unknown> };
  };
  auth: { admin: { deleteUser(id: string): PromiseLike<{ error: { message: string } | null }> } };
}

/** Yalnızca `userId` (doğrulanmış çağıranın kendi kimliği) için verileri ve hesabı siler. */
export async function deleteOwnAccount(
  service: ServiceClient,
  userId: string,
): Promise<DeleteResult> {
  // Aktif abonelik bilgisi (silmeyi engellemez)
  const { data: ent } = await service
    .from("nexus_entitlements")
    .select("plan, period_end")
    .eq("user_id", userId)
    .maybeSingle();

  // 1) kullanıcı verileri
  for (const table of USER_TABLES) await service.from(table).delete().eq("user_id", userId);

  // 2) auth hesabı (admin API)
  const { error: delErr } = await service.auth.admin.deleteUser(userId);
  if (delErr) return { status: 500, body: { error: "delete_failed", detail: delErr.message } };

  return { status: 200, body: { ok: true, hadSubscription: !!ent } };
}
