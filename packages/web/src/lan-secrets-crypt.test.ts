import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Cihaz sırlarının (nexusLanSecrets) masaüstünde şifreli saklanması. Şifreleme burada tersine çevrilebilir bir
 * SAHTE işlemle (base64) taklit edilir; gerçek Electron safeStorage ile doğrulanmış DEĞİLDİR. Sınanan: önek,
 * eski düz kaydın taşınması, anahtarlık yokken düz kalma ve şifreli kaydın köprüsüz okunamaması.
 */
const CONNECTORS = readFileSync(resolve(__dirname, "../../../src/app/lan-connectors.js"), "utf8");

function load(crypt: unknown) {
  const store = new Map<string, string>();
  const win: any = {
    nexusGetItem: (k: string) => store.get(k) ?? null,
    nexusSetItem: (k: string, v: string) => void store.set(k, v),
    nexusDesktop: crypt
      ? { http: () => Promise.reject(new Error("http yok")), secretCrypt: crypt }
      : undefined,
  };
  new Function("window", "fetch", CONNECTORS)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: win.nexusLan, store };
}

const crypt = (available = true) => ({
  available: () => available,
  encrypt: (t: string) => (available ? Buffer.from(t, "utf8").toString("base64") : null),
  decrypt: (b: string) => Buffer.from(b, "base64").toString("utf8"),
});

describe("cihaz sırları şifreli depo", () => {
  it("anahtarlık varken şifreli yazılır ve geri okunur", () => {
    const { lan, store } = load(crypt());
    lan.secrets.set("d1", { tuyaKey: "gizli123" });
    const raw = store.get("nexusLanSecrets")!;
    expect(raw.startsWith("enc1:")).toBe(true);
    expect(raw).not.toContain("gizli123");
    expect(lan.secrets.get("d1")).toEqual({ tuyaKey: "gizli123" });
  });

  it("eski düz kayıt ilk okumada şifrelenir, veri kaybolmaz", () => {
    const { lan, store } = load(crypt());
    store.set("nexusLanSecrets", JSON.stringify({ d1: { tapoPass: "eski" } }));
    expect(lan.secrets.get("d1")).toEqual({ tapoPass: "eski" });
    expect(store.get("nexusLanSecrets")!.startsWith("enc1:")).toBe(true);
    expect(lan.secrets.get("d1")).toEqual({ tapoPass: "eski" });
  });

  it("anahtarlık yoksa düz JSON kalır", () => {
    const { lan, store } = load(crypt(false));
    lan.secrets.set("d1", { a: "b" });
    expect(JSON.parse(store.get("nexusLanSecrets")!)).toEqual({ d1: { a: "b" } });
  });

  it("şifreli kayıt köprü olmadan okunamaz (boş döner, çökmez)", () => {
    const a = load(crypt());
    a.lan.secrets.set("d1", { a: "b" });
    const b = load(undefined);
    b.store.set("nexusLanSecrets", a.store.get("nexusLanSecrets")!);
    expect(b.lan.secrets.get("d1")).toBeNull();
  });
});
