// client-error için SAF mantık (Deno/ağ yok): hız sınırı ve kayıt satırının
// doğrulanması/kırpılması. Ayrı dosyada durur ki vitest ile
// (packages/web/src/client-error.test.ts) sınanabilsin.

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export const RATE_WINDOW_MS = 10 * 60 * 1000;
export const RATE_MAX = 5;

export const MAX_PAGE = 120;
export const MAX_VERSION = 20;
export const MAX_PLATFORM = 20;
export const MAX_MESSAGE = 500;

export interface ClientErrorRow {
  page: string;
  version: string;
  platform: string;
  message: string;
}

/** Basit bellek-içi hız sınırı: IP başına pencere içinde en çok RATE_MAX kayıt. */
export function createRateLimiter(): (ip: string, now?: number) => boolean {
  const hits = new Map<string, number[]>();
  return (ip, now = Date.now()) => {
    const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (arr.length >= RATE_MAX) {
      hits.set(ip, arr);
      return false;
    }
    arr.push(now);
    hits.set(ip, arr);
    return true;
  };
}

/** Gövdeden kayıt satırını üretir; mesaj boşsa null (istek "empty" ile reddedilir). */
// deno-lint-ignore no-explicit-any
export function buildRow(body: any): ClientErrorRow | null {
  const row = {
    page: String(body.page || "").slice(0, MAX_PAGE),
    version: String(body.version || "").slice(0, MAX_VERSION),
    platform: String(body.platform || "").slice(0, MAX_PLATFORM),
    message: String(body.message || "").slice(0, MAX_MESSAGE),
    // Bilinçli olarak kişi verisi toplanmaz (gizlilik metniyle uyumlu)
  };
  return row.message ? row : null;
}
