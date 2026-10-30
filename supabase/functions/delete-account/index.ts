// NEXUS — Hesap Silme Edge Function (issue #11, KVKK/GDPR self-servis)
// ---------------------------------------------------------------------
// Kullanıcının kendi hesabını silmesinin sunucu yarısı.
// - Yalnızca geçerli Supabase JWT'siyle çalışır (kendi hesabı).
// - Aktif NEXUS+ aboneliği varsa uyarı döner (silmeye zorlamaz; kullanıcı
//   önce Whop iptal bağlantısına yönlendirir — istemci tarafı yapar).
// - nexus_user_state, nexus_devices (kendi satırları) ve nexus_entitlements
//   silinir; ardından auth.users satırı silinir (cascade ile session'lar biter).
// - Yedeklerden silme: haftalık yedekler 8 hafta saklanır (gizlilik metninde
//   belgelendi; süre dolunca kendiliğinden düşer).
//
// Dağıtım (MANUEL): supabase functions deploy delete-account --no-verify-jwt=false
// Gerekli migration: 20261025_account_delete.sql (service_role yetkisi için)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { CORS, deleteOwnAccount, hasBearer, isAuthenticated, UNAUTHORIZED, type DeleteResult } from "./logic.ts";

const send = (r: DeleteResult) => new Response(JSON.stringify(r.body), {
  status: r.status, headers: { ...CORS, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const auth = req.headers.get("Authorization") || "";
  if (!hasBearer(auth)) return send(UNAUTHORIZED);

  // Kullanıcıyı anonim istemciyle doğrula (JWT kendi kimliğini taşır)
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: userErr } = await anon.auth.getUser();
  if (!isAuthenticated(user, userErr)) return send(UNAUTHORIZED);

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Aktif abonelik kontrolü (bilgi amaçlı), veri silme sırası ve auth silme logic.ts'te;
  // yalnızca doğrulanmış çağıranın kendi kimliği (user.id) kullanılır.
  return send(await deleteOwnAccount(service, user!.id));
});

