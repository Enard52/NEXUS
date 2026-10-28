// NEXUS — Ev Üyesi Davet E-postası Edge Function
// ------------------------------------------------
// Aile ekranında "Üye Davet Et" yazılan adrese gerçek bir davet e-postası gider.
// Supabase Auth'un "Invite user" mektubu kullanılır; şablon .Data.lang'e bakıp
// yalnızca davetlinin dilinde gönderir ve .Data.home_invite_code / home_name /
// home_role alanlarıyla ev davet kodunu gösterir.
// Davetlinin hesabı zaten varsa mail atılmaz (kodla katılım zaten mümkün).
// Dağıtım (MANUEL): supabase functions deploy household-invite

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("auth", { status: 401, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const email = String(body.email || "").trim().toLowerCase();
  const homeName = String(body.homeName || "").slice(0, 60);
  const code = String(body.code || "").slice(0, 24);
  const role = String(body.role || "").slice(0, 30);
  const lang = body.lang === "en" ? "en" : "tr";
  if (!email || !code || !homeName) return new Response("empty", { status: 400, headers: CORS });

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Çağıran oturumu doğrula (yalnızca oturum açmış kullanıcı davet gönderebilir)
  const token = authHeader.slice("Bearer ".length);
  const { data: caller, error: callerErr } = await db.auth.getUser(token);
  if (callerErr || !caller?.user) return new Response("auth", { status: 401, headers: CORS });

  // Davetlinin zaten hesabı varsa mail göndermeye gerek yok; kodla katılabilir
  const { data: existing } = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
  const known = (existing?.users || []).find((u) => String(u.email || "").toLowerCase() === email);
  if (known) {
    return new Response(JSON.stringify({ ok: true, alreadyAccount: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const site = Deno.env.get("NEXUS_SITE_URL") || "https://nexus-smarthome.pages.dev/";
  const { error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: site,
    data: {
      lang,
      home_invite_code: code,
      home_name: homeName,
      home_role: role,
      invited_by: caller.user.email || "",
    },
  });
  if (error) {
    // Kullanıcı bu arada kayıt olduysa hata değil: kodla katılım yolunu söyle
    if (/already( been)? registered|user already/i.test(error.message || "")) {
      return new Response(JSON.stringify({ ok: true, alreadyAccount: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false, error: error.message || "invite" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, sent: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
