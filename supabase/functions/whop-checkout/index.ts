// NEXUS+ ödeme oturumu. Kullanıcı kendi JWT'siyle gelir; Whop'ta bir checkout
// configuration açılır ve metadata'ya Supabase kullanıcı kimliği yazılır. Whop bu
// metadata'yı ödeme ve üyeliğe kopyalar; whop-webhook aboneliği bu kimlikle hesaba
// bağlar — kasada başka bir e-posta yazılsa bile. Anahtar vault'tan okunur, tarayıcıya gitmez.
// Oturum kullanıcı JWT'sinden üretildiği için kimse başka bir hesabın kimliğini gömemez.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACCOUNT = "biz_ranF1ypjEyCFev";
// Yalnızca bu planlar satılır; istemci plan kimliği değil plan adı + para birimi gönderir.
const PLANS: Record<string, Record<string, string>> = {
  TRY: { "Aylık": "plan_fAMBHwTVE0hR2", "Yıllık": "plan_UEXO1F5mjIgWB" },
  USD: { "Aylık": "plan_HIySYESquBqlg", "Yıllık": "plan_XlA3SacShoiJU" },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function whopKey(): Promise<string> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/rest/v1/rpc/nexus_whop_api_key`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("key");
  const value = await res.json();
  if (typeof value !== "string" || !value) throw new Error("key");
  return value;
}

async function createConfiguration(token: string, body: Record<string, unknown>) {
  const res = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error: userErr } = await anon.auth.getUser();
  if (userErr || !user?.id || !user.email) return json({ error: "unauthorized" }, 401);

  let body: { plan?: string; currency?: string } = {};
  try { body = await req.json(); } catch { body = {}; }
  const currency = body.currency === "USD" ? "USD" : "TRY";
  const planId = PLANS[currency][String(body.plan || "")];
  if (!planId) return json({ error: "unknown_plan" }, 400);

  let token = "";
  try { token = await whopKey(); } catch { return json({ error: "not_configured" }, 503); }

  const metadata = { nexus_user_id: user.id };
  // Güncel API alanı variant_id; eski sürüm plan_id bekliyordu — ilki reddedilirse ikincisi denenir.
  let created = await createConfiguration(token, { account_id: ACCOUNT, variant_id: planId, metadata });
  if (!created.ok && created.status >= 400 && created.status < 500) {
    created = await createConfiguration(token, { plan_id: planId, metadata });
  }
  const id = String(created.data?.id || "");
  if (!created.ok || !id.startsWith("ch_")) return json({ error: "whop", detail: created.status }, 502);
  return json({ session: id, planId, purchaseUrl: String(created.data?.purchase_url || "") });
});
