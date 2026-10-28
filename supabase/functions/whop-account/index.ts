// NEXUS+ hesap işlemleri. Anahtar vault'tan okunur; tarayıcıya hiç gitmez.
// Kullanıcı kendi JWT'siyle gelir. Yalnızca kendi e-postasına ait NEXUS planı okunur veya iptal edilir.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACCOUNT = "biz_ranF1ypjEyCFev";
const PLANS: Record<string, { plan: "Aylık" | "Yıllık"; currency: "TRY" | "USD" }> = {
  plan_fAMBHwTVE0hR2: { plan: "Aylık", currency: "TRY" },
  plan_UEXO1F5mjIgWB: { plan: "Yıllık", currency: "TRY" },
  plan_HIySYESquBqlg: { plan: "Aylık", currency: "USD" },
  plan_XlA3SacShoiJU: { plan: "Yıllık", currency: "USD" },
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

async function whop(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.whop.com/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function emailOf(row: Record<string, unknown>): string {
  const user = row.user as Record<string, unknown> | undefined;
  const member = row.member as Record<string, unknown> | undefined;
  const nested = member?.user as Record<string, unknown> | undefined;
  return String(row.email ?? user?.email ?? nested?.email ?? "").trim().toLowerCase();
}

function planIdOf(row: Record<string, unknown>): string {
  const plan = row.plan;
  if (plan && typeof plan === "object" && "id" in plan) return String((plan as { id: string }).id);
  return String(row.plan_id ?? plan ?? "");
}

function moneyOf(row: Record<string, unknown>) {
  const raw = (row.usd_total ?? row.total ?? row.subtotal ?? row.amount) as Record<string, unknown> | string | undefined;
  if (raw && typeof raw === "object") {
    return { amount: String(raw.amount ?? raw.display ?? ""), currency: String(raw.currency ?? "") };
  }
  return { amount: raw == null ? "" : String(raw), currency: String(row.currency ?? "") };
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
  const email = user?.email?.trim().toLowerCase() || "";
  if (userErr || !email) return json({ error: "unauthorized" }, 401);

  let body: { action?: string } = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = body.action === "cancel" ? "cancel" : "status";

  let token = "";
  try { token = await whopKey(); } catch { return json({ error: "not_configured" }, 503); }

  const listed = await whop(`/memberships?account_id=${ACCOUNT}`, token);
  if (!listed.ok) return json({ error: "whop", detail: listed.status }, 502);
  const rows = Array.isArray(listed.data?.data) ? listed.data.data as Record<string, unknown>[] : [];

  // İki aşamalı eşleşme: önce yetki tablosunda saklanan Whop kullanıcı kimliği
  // (webhook yazar; Whop'ta e-posta değiştirilse bile aynı üyeliği bulur), sonra e-posta.
  let storedWhopUser = "";
  let service: ReturnType<typeof createClient> | null = null;
  try {
    service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: ent } = await service.from("nexus_entitlements").select("whop_user_id").eq("email", email).maybeSingle();
    storedWhopUser = String(ent?.whop_user_id || "");
  } catch { /* yetki kaydı yoksa e-posta eşleşmesi yeter */ }
  function whopUserIdOf(row: Record<string, unknown>): string {
    const user = row.user as Record<string, unknown> | undefined;
    const member = row.member as Record<string, unknown> | undefined;
    return String(row.user_id ?? user?.id ?? member?.user?.id ?? "").trim();
  }
  const mine =
    (storedWhopUser ? rows.find((row) => whopUserIdOf(row) === storedWhopUser && PLANS[planIdOf(row)]) : undefined) ??
    rows.find((row) => emailOf(row) === email && PLANS[planIdOf(row)]);

  if (action === "cancel") {
    if (!mine) return json({ error: "no_membership" }, 404);
    const id = String(mine.id || "");
    const canceled = await whop(`/memberships/${encodeURIComponent(id)}/cancel`, token, {
      method: "POST",
      body: JSON.stringify({ cancel_at_period_end: true }),
    });
    if (!canceled.ok) return json({ error: "cancel_failed", detail: canceled.status }, 502);
    if (service) {
      await service.from("nexus_entitlements").update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      }).eq("email", email);
    }
  }

  const current = action === "cancel"
    ? (await whop(`/memberships?account_id=${ACCOUNT}`, token)).data?.data?.find((row: Record<string, unknown>) => String(row.id) === String(mine?.id)) ?? mine
    : mine;

  let payments: { id: string; status: string; amount: string; currency: string; createdAt: string }[] = [];
  if (current?.id) {
    const paid = await whop(`/payments?account_id=${ACCOUNT}&membership_id=${encodeURIComponent(String(current.id))}`, token);
    const list = Array.isArray(paid.data?.data) ? paid.data.data as Record<string, unknown>[] : [];
    payments = list.slice(0, 8).map((row) => {
      const money = moneyOf(row);
      return {
        id: String(row.id || ""),
        status: String(row.status || row.substatus || ""),
        amount: money.amount,
        currency: money.currency,
        createdAt: String(row.created_at || row.paid_at || ""),
      };
    });
  }

  const def = current ? PLANS[planIdOf(current)] : undefined;
  return json({
    email,
    membership: current
      ? {
          id: String(current.id),
          plan: def?.plan || "",
          currency: def?.currency || "",
          status: String(current.status || ""),
          cancelAtPeriodEnd: Boolean(current.cancel_at_period_end),
          periodEnd: current.renewal_period_end || current.expires_at || null,
        }
      : null,
    payments,
  });
});
