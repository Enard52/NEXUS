// Whop ödeme webhook'u -> nexus_entitlements (NEXUS+ abonelik durumu).
// Kimlik doğrulama JWT ile değil, Whop'un imzasıyla yapılır (Standard Webhooks: HMAC-SHA256).
// Gerekli sır: WHOP_WEBHOOK_SECRET (Supabase > Edge Functions > Secrets). SUPABASE_URL ve
// SUPABASE_SERVICE_ROLE_KEY platform tarafından otomatik sağlanır.
// Dağıtım: verify_jwt=false (webhook kendi imzasını doğrular).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Yalnızca bu planlar NEXUS+ sayılır; başka ürün/plan olayları yok sayılır.
const PLANS: Record<string, { plan: "Aylık" | "Yıllık"; currency: "TRY" | "USD" }> = {
  plan_fAMBHwTVE0hR2: { plan: "Aylık", currency: "TRY" },
  plan_UEXO1F5mjIgWB: { plan: "Yıllık", currency: "TRY" },
  plan_HIySYESquBqlg: { plan: "Aylık", currency: "USD" },
  plan_XlA3SacShoiJU: { plan: "Yıllık", currency: "USD" },
};

const enc = new TextEncoder();

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64encode(buf: ArrayBuffer): string {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

async function hmacB64(key: Uint8Array, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64encode(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Standard Webhooks: imzalı içerik = `${id}.${timestamp}.${body}`; başlık = "v1,<base64> v1,<base64>".
// Anahtar biçimi sağlayıcıya göre değişebildiği için iki yorum denenir (base64 çözülmüş / ham metin).
async function verify(req: Request, body: string, secret: string): Promise<boolean> {
  const id = req.headers.get("webhook-id") ?? req.headers.get("svix-id") ?? "";
  const ts = req.headers.get("webhook-timestamp") ?? req.headers.get("svix-timestamp") ?? "";
  const sigHeader = req.headers.get("webhook-signature") ?? req.headers.get("svix-signature") ?? "";
  if (!id || !ts || !sigHeader) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const candidates: Uint8Array[] = [];
  const stripped = secret.replace(/^(whsec_|ws_)/, "");
  try { candidates.push(b64decode(stripped)); } catch { /* ham metin denenecek */ }
  candidates.push(enc.encode(secret));
  const provided = sigHeader.split(" ").map((p) => p.split(",")[1]).filter(Boolean);
  for (const key of candidates) {
    const expected = await hmacB64(key, `${id}.${ts}.${body}`);
    if (provided.some((p) => safeEqual(p, expected))) return true;
  }
  return false;
}

// deno-lint-ignore no-explicit-any
type Json = any;

function pick(d: Json) {
  const email = String(d?.user?.email ?? d?.email ?? d?.user_email ?? d?.member?.user?.email ?? "").trim().toLowerCase();
  const planRaw = d?.plan?.id ?? d?.plan_id ?? (typeof d?.plan === "string" ? d.plan : "");
  const memRaw = d?.membership?.id ?? d?.membership_id ?? (typeof d?.id === "string" && d.id.startsWith("mem_") ? d.id : "");
  const end = d?.renewal_period_end ?? d?.renewal_period_end_at ?? d?.expires_at ?? d?.membership?.renewal_period_end ?? null;
  const cancel = d?.cancel_at_period_end ?? d?.membership?.cancel_at_period_end;
  return { email, planId: String(planRaw || ""), membershipId: String(memRaw || ""), periodEnd: end ? new Date(end).toISOString() : null, cancel: typeof cancel === "boolean" ? cancel : undefined };
}

async function rest(path: string, init: RequestInit): Promise<Response> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

// Discord bildirimi (isteğe bağlı): adres yalnızca DISCORD_WEBHOOK_URL ortam değişkeninden okunur; e-posta maskelenir.
function mask(email: string): string {
  const [u, d] = email.split("@");
  if (!u || !d) return "?";
  return `${u.slice(0, 2)}***@${d}`;
}
async function notify(text: string): Promise<void> {
  const hook = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!hook) return;
  try { await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "NEXUS", content: text }) }); } catch { /* bildirim başarısızsa ödeme işlenmesini etkilemesin */ }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const secret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  if (!secret) return new Response("webhook secret not configured", { status: 503 });
  const body = await req.text();
  if (!(await verify(req, body, secret))) return new Response("invalid signature", { status: 401 });

  let evt: Json;
  try { evt = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
  const type = String(evt.type ?? evt.action ?? "");
  const p = pick(evt.data ?? {});
  const def = PLANS[p.planId];

  const activates = /(activated|went_valid|payment[._]succeeded)/.test(type);
  const deactivates = /(deactivated|went_invalid)/.test(type);
  const cancelChange = /cancel_at_period_end/.test(type);

  if (!activates && !deactivates && !cancelChange) return Response.json({ ok: true, ignored: type });

  if (activates) {
    if (!def || !p.email) return Response.json({ ok: true, ignored: "unknown plan or email" });
    const row = { email: p.email, plan: def.plan, currency: def.currency, status: "active", cancel_at_period_end: p.cancel ?? false, whop_membership_id: p.membershipId || null, whop_plan_id: p.planId, period_end: p.periodEnd, updated_at: new Date().toISOString() };
    const res = await rest("nexus_entitlements?on_conflict=email", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(row) });
    if (!res.ok) return new Response("db error", { status: 500 });
    await notify(`💳 NEXUS+ ${type.includes("payment") ? "ödeme alındı" : "üyelik başladı"}: ${def.plan} · ${def.currency} · ${mask(p.email)}`);
    return Response.json({ ok: true, active: p.email, plan: def.plan, currency: def.currency });
  }

  // Kapanış / iptal bilgisi: önce üyelik kimliğiyle, yoksa e-postayla eşleştir.
  const filter = p.membershipId ? `whop_membership_id=eq.${encodeURIComponent(p.membershipId)}` : p.email ? `email=eq.${encodeURIComponent(p.email)}` : "";
  if (!filter) return Response.json({ ok: true, ignored: "no identifier" });
  const patch = deactivates
    ? { status: "inactive", plan: "none", cancel_at_period_end: false, updated_at: new Date().toISOString() }
    : { cancel_at_period_end: p.cancel ?? true, updated_at: new Date().toISOString() };
  const res = await rest(`nexus_entitlements?${filter}`, { method: "PATCH", body: JSON.stringify(patch) });
  if (!res.ok) return new Response("db error", { status: 500 });
  await notify(deactivates ? `⚠️ NEXUS+ üyelik sona erdi: ${p.email ? mask(p.email) : p.membershipId}` : `ℹ️ NEXUS+ iptal talebi (dönem sonunda biter): ${p.email ? mask(p.email) : p.membershipId}`);
  return Response.json({ ok: true, updated: type });
});

