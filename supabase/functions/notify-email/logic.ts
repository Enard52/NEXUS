// NEXUS — notify-email saf mantığı (Deno'ya özgü import YOK; Vitest'te doğrudan test edilir).
// index.ts yalnızca HTTP/Supabase/Resend yapıştırıcısıdır; kararlar burada.

export const MAX_PER_HOUR = 6;
export const HOUR_MS = 3600_000;
export const TITLE_MAX = 120;
export const DETAIL_MAX = 800;
export const PROVIDER_ERROR_MAX = 160;
export const RESEND_URL = "https://api.resend.com/emails";
export const DEFAULT_FROM = "NEXUS <onboarding@resend.dev>";

/** Alıcı HER ZAMAN çağıran oturumun kendi e-postasıdır; gövdedeki adres alanları yok sayılır. */
export function recipientOf(user: { email?: unknown } | null | undefined): string | null {
  if (!user?.email) return null;
  return String(user.email).toLowerCase();
}

/** Saatlik yumuşak tavan. `stamps` değiştirilir; kabul edilirse true. */
export function withinLimit(
  stamps: Map<string, number[]>,
  userId: string,
  now: number,
  max = MAX_PER_HOUR,
): boolean {
  const list = (stamps.get(userId) || []).filter((t) => now - t < HOUR_MS);
  if (list.length >= max) return false;
  list.push(now);
  stamps.set(userId, list);
  return true;
}

/** Gövdeden yalnızca başlık / ayrıntı / dil alınır (uzunluk sınırlı). */
export function parseInput(body: any): { title: string; detail: string; lang: "en" | "tr" } {
  const title = String(body.title || "Uyarı").slice(0, TITLE_MAX);
  const detail = String(body.detail || "").slice(0, DETAIL_MAX);
  const lang = body.lang === "en" ? "en" : "tr";
  return { title, detail, lang };
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

export function buildMessage(title: string, detail: string, lang: "en" | "tr") {
  const label = lang === "en" ? "Alert" : "Uyarı";
  const subject = "NEXUS · " + title;
  const text = [title, detail].filter(Boolean).join("\n") || label;
  const html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">' +
    '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b">NEXUS · ' +
    label +
    "</p>" +
    '<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">' +
    escapeHtml(title) +
    "</h1>" +
    (detail
      ? '<p style="margin:0;font-size:14px;line-height:1.6;color:#334155">' +
        escapeHtml(detail) +
        "</p>"
      : "") +
    "</div>";
  return { subject, text, html };
}

/** Resend isteği: tek alıcı, anahtar yalnızca Authorization başlığında. */
export function buildResendRequest(
  apiKey: string,
  from: string | undefined,
  to: string,
  msg: { subject: string; text: string; html: string },
) {
  return {
    url: RESEND_URL,
    init: {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from || DEFAULT_FROM,
        to: [to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
    },
  };
}

/** Sağlayıcı hata gövdesi istemciye kısaltılarak dürüstçe iletilir. */
export function providerError(bodyText: string): string {
  return bodyText.slice(0, PROVIDER_ERROR_MAX);
}
