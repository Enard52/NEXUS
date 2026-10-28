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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // Kullanıcıyı anonim istemciyle doğrula (JWT kendi kimliğini taşır)
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: userErr } = await anon.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Aktif abonelik kontrolü: bilgi amaçlı (silme engellenmez; kullanıcı onayı
  // istemci tarafında alınır ve iptal bağlantısı gösterilir)
  const { data: ent } = await service
    .from("nexus_entitlements")
    .select("plan, period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  // 1) kullanıcı verileri
  await service.from("nexus_user_state").delete().eq("user_id", user.id);
  await service.from("nexus_devices").delete().eq("user_id", user.id);
  await service.from("nexus_entitlements").delete().eq("user_id", user.id);

  // 2) auth hesabı (admin API)
  const { error: delErr } = await service.auth.admin.deleteUser(user.id);
  if (delErr) {
    return new Response(JSON.stringify({ error: "delete_failed", detail: delErr.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, hadSubscription: !!ent }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
