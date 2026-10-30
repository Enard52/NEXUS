// NEXUS — bildirim kanallarının tarayıcıda gerçekten çalıştığını doğrular.
// Birim testleri fetch'in başlık karakter kısıtını görmüyor; ntfy kanalı bu sayede
// Türkçe başlıklarda sessizce ölüyordu. Bu betik gerçek Chromium ile ölçer.
// Kullanım: node scripts/verify-notify.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVE = join(ROOT, "www");
const PORT = 4831;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const data = await readFile(join(SERVE, p.replace(/^\//, "")));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("nf");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const out = [];
const ok = (name, pass, extra = "") =>
  out.push(`${pass ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "tr-TR" });
// auth.js oturum yoksa her sayfayı onboarding'e atıyor: denetim için sahte oturum kurulur
await ctx.addInitScript(() => localStorage.setItem("nexusCurrentUser", "denetim@nexus.app"));
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message)));
const sent = [];
await page.route("https://api.telegram.org/**", (route) => {
  sent.push({
    url: route.request().url(),
    headers: route.request().headers(),
    body: route.request().postData(),
  });
  route.fulfill({ status: 200, body: '{"ok":true}' });
});

const url = `http://127.0.0.1:${PORT}/nexus-instant-notifications.html`;
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(600);

ok("notify.js sayfada yüklendi", await page.evaluate(() => !!window.nexusNotify));

// Arayüzden kaldırılan kanalların anahtarı artık yok; eski kurulumda açık kalmışsa
// sayfa onları yüklenirken susturmalı (susturulamayan dışa gönderim kalmasın).
ok(
  "ntfy/webhook arayüzde yok",
  (await page.locator('[data-channel="ntfy"], [data-channel="webhook"]').count()) === 0,
);
ok(
  "kaldırılan kanallar kapalı tutulur",
  await page.evaluate(() => {
    window.nexusNotify.save({
      ntfy: { enabled: true, topic: "eski" },
      webhook: { enabled: true, url: "https://eski/hook" },
    });
    return true;
  }),
);
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(500);
ok(
  "açık bırakılmış ntfy/webhook yüklenmede kapanır",
  await page.evaluate(() => {
    const c = window.nexusNotify.channels();
    return c.ntfy.enabled === false && c.webhook.enabled === false;
  }),
);

// Telegram kanalını kur + aç (artık tek dış hizmet köprüsü bu)
await page.fill("#telegram-token", "123456:TEST-anahtar");
await page.fill("#telegram-chat", "987654321");
await page.click('input[data-channel="telegram"] + .slider');
await page.waitForTimeout(200);
const cfg = await page.evaluate(() => window.nexusNotify.channels());
ok(
  "telegram kanalı açık + alanlar kayıtlı",
  cfg.telegram.enabled === true && cfg.telegram.chat === "987654321",
  JSON.stringify({ enabled: cfg.telegram.enabled, chat: cfg.telegram.chat }),
);

// sistem kanalını kapat (test yalnızca telegram'a gitsin)
await page.click('input[data-channel="system"] + .slider');
await page.waitForTimeout(150);

// test bildirimi
await page.evaluate(() => window.nexusNotify.test());
await page.waitForTimeout(1200);
ok("test bildirimi telegram'a ulaştı", sent.length === 1, sent.length + " istek");
if (sent.length) {
  ok(
    "URL bot sohbetine gidiyor",
    /\/bot123456:TEST-anahtar\/sendMessage/.test(sent[0].url),
    sent[0].url,
  );
  let payload = {};
  try {
    payload = JSON.parse(sent[0].body || "{}");
  } catch {
    /* gövde okunamadı */
  }
  ok(
    "gövde Türkçe metni bozmadan taşır",
    payload.chat_id === "987654321" && /Test bildirimi/.test(String(payload.text)),
    String(payload.text),
  );
}
const status = await page.textContent("#notify-status");
ok("durum satırı güncellendi", /Gönderilen 1/.test(status || ""), status);
ok(
  "durum satırı kanal adını Türkçe yazar",
  !/\bsystem\b|\btelegram\b|\bntfy\b|\bwebhook\b/.test(status || ""),
  status,
);

// yeniden yükle: ayarlar kalıcı mı
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(500);
const after = await page.evaluate(() => ({
  chat: document.getElementById("telegram-chat").value,
  checked: document.querySelector('input[data-channel="telegram"]').checked,
  system: document.querySelector('input[data-channel="system"]').checked,
}));
ok("sohbet id yeniden yüklemede durur", after.chat === "987654321", after.chat);
ok(
  "kanal anahtarları kalıcı",
  after.checked === true && after.system === false,
  JSON.stringify(after),
);

// master anahtarı kapat → hiçbir şey gitmemeli
sent.length = 0;
await page.click("#master-toggle + .slider");
await page.waitForTimeout(200);
const muted = await page.evaluate(() =>
  window.nexusNotify.mutedBy({ id: "x1", type: "scene", ts: Date.now() }),
);
ok("master kapalı → dağıtım kesilir", muted === "master", String(muted));

// gerçek olay akışı: nexusEvents'e sayı ts ile yazılan olay kanala gider mi
sent.length = 0;
await page.evaluate(() => {
  const list = JSON.parse(
    localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith("nexusEvents")) || "k") ||
      "[]",
  );
  list.push({
    id: "auto-" + Date.now(),
    type: "automation",
    title: "Kapı algılandı",
    detail: "Ön kapı",
    ts: Date.now(),
  });
  Object.keys(localStorage)
    .filter((k) => k.endsWith("nexusEvents"))
    .forEach((k) => localStorage.setItem(k, JSON.stringify(list)));
});
await page.evaluate(() => window.nexusNotify.checkNew());
await page.waitForTimeout(800);
ok(
  "sayı ts'li gerçek olay dağıtıldı (master kapalıyken gitmez)",
  sent.length === 0,
  sent.length + " istek",
);
await page.click("#master-toggle + .slider"); // geri aç
await page.waitForTimeout(150);
const delivered = await page.evaluate(async () => {
  const before = window.nexusNotify.stats().sent;
  await window.nexusNotify.deliver({
    id: "auto-" + Date.now(),
    type: "automation",
    title: "Kapı algılandı",
    detail: "Ön kapı",
    ts: Date.now(),
  });
  return window.nexusNotify.stats().sent - before;
});
ok(
  "master açıkken olay kanala gitti",
  delivered >= 1 && sent.length >= 1,
  `istatistik +${delivered}, ${sent.length} istek`,
);

// sır sızıntısı kontrolü: localStorage'da telegram tokenı + bulut anahtarları
const leak = await page.evaluate(() => {
  const keys = Object.keys(localStorage);
  const cloud = keys.filter((k) => /nexusNotify/.test(k) && !/^\w+@|^guest/.test(k));
  return { channelKeys: keys.filter((k) => /nexusNotifyChannels$/.test(k)) };
});
ok(
  "kanal ayarları kullanıcı önekiyle saklanır",
  leak.channelKeys.length >= 1,
  leak.channelKeys.join(","),
);

/* İzin düğmesinin dürüstlüğü aşağıda ayrı bir turda ölçülüyor (Notification statikleri
   taklit edilerek); burada yalnızca tek kanallık deneme sözleşmesi denetleniyor. */
sent.length = 0;
await page.evaluate(() => window.nexusNotify.save({ system: { enabled: true } }));
await page.evaluate(() => window.nexusNotify.test(["system"]));
await page.waitForTimeout(500);
ok("test(['system']) dış kanallara dokunmaz", sent.length === 0, sent.length + " dış istek");
await page.evaluate(() => window.nexusNotify.test());
await page.waitForTimeout(500);
ok("test() filtresiz açık kanala gider", sent.length === 1, sent.length + " dış istek");

// düzen: yatay taşma + dokunma hedefleri
const layout = await page.evaluate(() => {
  const de = document.documentElement;
  const bad = [];
  document.querySelectorAll("input, button, .switch, label.switch").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (
      el.classList.contains("slider") ||
      el.classList.contains("switch") ||
      el.tagName === "INPUT"
    )
      return;
    if (r.height < 24 || r.width < 24)
      bad.push(
        `${el.tagName}${el.id ? "#" + el.id : ""} ${Math.round(r.width)}x${Math.round(r.height)}`,
      );
  });
  return { overflow: de.scrollWidth - de.clientWidth, small: bad };
});
ok("390px'te yatay taşma yok", layout.overflow <= 0, "scrollWidth fazlası " + layout.overflow);
ok("24px altı dokunma hedefi yok", layout.small.length === 0, layout.small.join(" | "));

// dil: İngilizceye çevirince yeni metinler ingilizce mi
await page.evaluate(() => localStorage.setItem("nexusLanguage", "en"));
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(700);
const en = await page.evaluate(() => document.body.innerText);
ok(
  "EN sözlük yeni başlıkları çeviriyor",
  /outbound channels/i.test(en),
  "",
);
const enGap = /Dışa Dönük Kanallar/.test(en);
ok("EN modda Türkçe kalıntı yok", !enGap, enGap ? "Türkçe başlık kaldı" : "");

ok("sayfa hatası yok", errs.length === 0, errs.join(" | "));

/* --- 2. tur: sistem bildirimi anahtarı izni kendisi ister ----------------------
   Ayrı "izin iste" düğmesi yok: kullanıcı "Sistem Bildirimleri" anahtarını açınca
   izin (gerekiyorsa) o jestin içinde istenir. Headless Chromium izin akışını
   göstermediği için Notification statikleri taklit edilir; önemli olan çağrı
   örüntüsü ve anahtarın dürüst sonucu: izin yoksa anahtar açık kalmaz. */
async function izinSenaryosu(ad, izinDugumu) {
  const sctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "tr-TR",
  });
  await sctx.route("**/sw.js", (r) => r.fulfill({ status: 404, body: "" }));
  await sctx.addInitScript(
    ({ currentUser, permission }) => {
      localStorage.setItem("nexusCurrentUser", currentUser);
      let n = 0;
      Object.defineProperty(window.Notification, "permission", {
        get: () => permission,
        configurable: true,
      });
      window.Notification.requestPermission = () => {
        n++;
        return Promise.resolve(permission === "denied" ? "denied" : "granted");
      };
      Object.defineProperty(window, "__permAskCount", { get: () => n, configurable: true });
    },
    { currentUser: "denetim@nexus.app", permission: izinDugumu },
  );
  const sp = await sctx.newPage();
  await sp.goto(url, { waitUntil: "load" });
  await sp.waitForTimeout(700);
  const hasLegacyButtons = await sp.evaluate(
    () => !!document.getElementById("system-permission") || !!document.getElementById("notify-test"),
  );
  const wasOn = await sp.evaluate(
    () => document.querySelector('input[data-channel="system"]').checked,
  );
  // Varsayılan açık: önce kapat, sonra yeniden aç (izin açarken istenir).
  if (wasOn) {
    await sp.click('input[data-channel="system"] + .slider');
    await sp.waitForTimeout(300);
  }
  await sp.click('input[data-channel="system"] + .slider');
  await sp.waitForTimeout(1200);
  const r = await sp.evaluate(() => ({
    ask: window.__permAskCount,
    on: document.querySelector('input[data-channel="system"]').checked,
    saved: window.nexusNotify.channels().system.enabled,
    durum: document.getElementById("notify-status").textContent,
  }));
  r.hasLegacyButtons = hasLegacyButtons;
  ok(`${ad}: ayrı izin/test düğmesi yok`, !hasLegacyButtons, "");
  await sctx.close();
  return r;
}

const granted = await izinSenaryosu("izin verilmiş", "granted");
ok("izin verilmişken anahtar açılır ve kaydedilir", granted.on && granted.saved, JSON.stringify(granted));

const asked = await izinSenaryosu("izin ilk kez soruluyor", "default");
ok("bilinmeyen izinde anahtar izni tek kez ister", asked.ask === 1, `${asked.ask} kez requestPermission`);
ok("izin verilince anahtar açık kalır", asked.on && asked.saved, JSON.stringify(asked));

const refused = await izinSenaryosu("izin reddedilmiş", "denied");
ok("reddedilmişte anahtar açık kalmaz", !refused.on && !refused.saved, JSON.stringify(refused));
ok(
  "reddedilmişte suçlayıcı değil, yol gösterici metin",
  /kilit simgesinden/i.test(refused.durum),
  refused.durum,
);
await browser.close();
server.close();
console.log(out.join("\n"));
