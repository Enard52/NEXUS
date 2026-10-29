// NEXUS — Ev Üyesi Davet E-postası Edge Function
// ------------------------------------------------
// Aile ekranında "Üye Davet Et" yazılan adrese gerçek bir davet e-postası gider.
// Davet ve kod SUNUCUDA (create_household_invite RPC'si) üretilir; bu fonksiyon yalnızca
// o davetin e-postasını gönderir ve istemcinin gönderdiği alanlara GÜVENMEZ:
//   • çağıran oturumlu bir kullanıcı olmalı ve davetin sahibi (invited_by) olmalı,
//   • davet bekliyor ve süresi dolmamış olmalı, e-posta ve kod davetle eşleşmeli,
//   • ev adı / rol veritabanından okunur (rastgele içerikle NEXUS adına posta gönderilemez).
// Supabase Auth'un "Invite user" mektubu kullanılır; şablon .Data.lang'e bakıp
// yalnızca davetlinin dilinde gönderir ve .Data.home_invite_code / home_name /
// home_role alanlarıyla ev davet kodunu gösterir.
// Davetlinin hesabı zaten varsa mail atılmaz: uygulamayı açtığında Aile ekranında davet
// kartı (my_household_invites) görünür ve kodsuz kabul eder.
// Dağıtım (MANUEL): supabase functions deploy household-invite

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};
const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

function reply(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

// listUsers sayfalıdır: yalnızca ilk sayfaya bakmak "hesap var mı" kontrolünü yanlış yapıyordu.
// E-posta bulunana ya da sayfalar bitene kadar gezilir.
async function accountExists(db: any, email: string): Promise<boolean> {
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    if (users.some((u: any) => String(u.email || "").toLowerCase() === email)) return true;
    if (users.length < perPage) return false;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("auth", { status: 401, headers: CORS });

  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const inviteId = String(body.inviteId || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim().slice(0, 24);
  const lang = body.lang === "en" ? "en" : "tr";
  if (!inviteId || !email || !code) return new Response("empty", { status: 400, headers: CORS });

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Çağıran oturumu doğrula (yalnızca oturum açmış kullanıcı davet gönderebilir)
  const token = authHeader.slice("Bearer ".length);
  const { data: caller, error: callerErr } = await db.auth.getUser(token);
  if (callerErr || !caller?.user) return new Response("auth", { status: 401, headers: CORS });

  // Davet gerçek mi, bu kullanıcının mı, bekliyor mu, e-posta ve kod eşleşiyor mu?
  const { data: invite } = await db
    .from("household_invites")
    .select("id, email, role, status, expires_at, invited_by, households(name)")
    .eq("id", inviteId)
    .maybeSingle();
  if (
    !invite || invite.invited_by !== caller.user.id || invite.status !== "pending" ||
    new Date(invite.expires_at).getTime() <= Date.now() || String(invite.email).toLowerCase() !== email
  ) {
    return reply({ ok: false, error: "invite_invalid" }, 400);
  }
  const { data: matches } = await db.rpc("household_invite_code_matches", { p_invite: inviteId, p_code: code });
  if (matches !== true) return reply({ ok: false, error: "invite_invalid" }, 400);

  // Davetlinin zaten hesabı varsa mail gönderilmez; uygulamada davet kartı görür.
  let known = false;
  try { known = await accountExists(db, email); } catch (e) {
    return reply({ ok: false, error: "lookup_failed" }, 500);
  }
  if (known) return reply({ ok: true, alreadyAccount: true });

  const site = Deno.env.get("NEXUS_SITE_URL") || "https://nexus-smarthome.pages.dev/";
  const homeName = String((invite as any).households?.name || "").slice(0, 60);
  const { error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: site,
    data: {
      lang,
      home_invite_code: code,
      home_name: homeName,
      home_role: (lang === "en"
        ? { owner: "Owner", member: "Member", guest: "Guest" }
        : { owner: "Ev Sahibi", member: "Üye", guest: "Misafir" })[String(invite.role)] || "",
      invited_by: caller.user.email || "",
    },
  });
  if (error) {
    // Kullanıcı bu arada kayıt olduysa hata değil: uygulamada davet kartı görür
    if (/already( been)? registered|user already/i.test(error.message || "")) {
      return reply({ ok: true, alreadyAccount: true });
    }
    return reply({ ok: false, error: error.message || "invite" }, 500);
  }
  return reply({ ok: true, sent: true });
});
