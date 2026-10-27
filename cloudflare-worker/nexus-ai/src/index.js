// NEXUS AI — Cloudflare Worker (Workers AI: llama-3.3-70b-instruct-fp8-fast)
// Uygulamanın sohbet ekranı, yerel komut motorunun anlamadığı mesajları buraya sorar.
// Kaynak: nexus-assistant.js -> ask()  |  AI_URL: https://nexus-ai.ensarharmanci52.workers.dev
//
// Origin beyaz listesi: canlı site, masaüstü uygulaması (nexus://app) ve portlu
// localhost sunucuları kabul edilir. Kapanmış eski web uygulaması adresi listede yok.
var ORIGINS = [
  "https://nexus-smarthome.pages.dev",
  "nexus://app",
  "capacitor://localhost",
  "https://localhost",
  "null",
];
// Geliştirme sunucuları: http(s)://localhost:<port> veya http(s)://127.0.0.1:<port>
// (Origin başlığında port taşınır; yerel static sunucular 127.0.0.1'e bağlanabilir.)
var LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function originAllowed(o) {
  return ORIGINS.indexOf(o) !== -1 || LOCAL_ORIGIN.test(o);
}

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...headers, "content-type": "application/json" },
  });
}

// Whisper'a giden ses, base64 metin olarak gelir. 60 sn opus kaydı ~0,5 MB'tır;
// 8 MB üst sınırı kötüye kullanımı ve gereksiz maliyeti engeller.
const MAX_AUDIO_B64 = 8 * 1024 * 1024;
const B64_RE = /^[A-Za-z0-9+/=\r\n]+$/;

async function transcribeRequest(req, env, h) {
  let b;
  try {
    b = await req.json();
  } catch {
    return jsonResponse({ error: "bad_request" }, 400, h);
  }
  const audio = b && typeof b.audio === "string" ? b.audio : "";
  if (audio.length < 64 || audio.length > MAX_AUDIO_B64 || !B64_RE.test(audio)) {
    return jsonResponse({ error: "bad_audio" }, 400, h);
  }
  const lang = b.lang === "tr" ? "tr" : "en";
  if (!env.AI) return jsonResponse({ error: "stt_unavailable" }, 503, h);
  try {
    const out = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio,
      language: lang,
      task: "transcribe",
      vad_filter: true,
    });
    const text = (out && (out.text || out.transcription)) || "";
    return jsonResponse({ text: String(text).trim() }, 200, h);
  } catch (e) {
    // Turbo modeli hesapta yoksa temel Whisper ile tekrar dene.
    try {
      const out = await env.AI.run("@cf/openai/whisper", { audio, task: "transcribe" });
      const text = (out && (out.text || out.transcription)) || "";
      return jsonResponse({ text: String(text).trim() }, 200, h);
    } catch (e2) {
      return jsonResponse({ error: "stt_unavailable" }, 503, h);
    }
  }
}

var FACTS = {
  tr: "Sen NEXUS akıllı ev uygulamasının asistanısın ve NEXUS'un her şeyine hakimsin: tüm ekranlar, özellikler, cihazlar, sahneler, otomasyonlar, enerji, aile ve ev halkı yönetimi, NEXUS+ planı, faturalandırma ve sorun giderme dahil. Karşındaki bir ev sahibi; sıcak, doğal, yardımsever ve arkadaş gibi konuş, robot gibi davranma. Cevapların doyurucu, samimi ve doğrudan amaca yönelik olsun (genellikle 2-4 doğal cümle); laf kalabalığı yapma ama bilgiyi de eksik bırakma, gerektiğinde evdeki cihazlarla ilgili pratik bir adım veya sohbetten çalıştırabileceği bir komut öner. Markdown, madde işareti ve emoji kullanma. SADECE TÜRKÇE YAZ: Kullanıcı başka bir dilde yazsa veya cihaz isimleri yabancı olsa dahi cevabın kesinlikle ve daima akıcı Türkçe olmalıdır, asla başka dile geçme. Kullanıcı bir cihaz komutu yazarsa bunun sohbetten yerel olarak çalıştığını belirt; yeteneksizlik söyleme çünkü NEXUS bu komutları çalıştırır. Bilmediğin güncel bilgi (ör. gerçek zamanlı hava durumu) için dürüst ol ama yardımcı olmaya devam et.",
  en: "You are the assistant of the NEXUS smart home app and you know everything about NEXUS: every screen, feature, device type, scenes, automations, energy, household management, the NEXUS+ plan, billing and troubleshooting. You talk to a home owner: warm, natural, helpful and friendly, not a robot. Your answers should be satisfying, warm, and directly to the point (typically 2-4 natural sentences); avoid unnecessary fluff but never leave the question half-answered, and suggest a practical step or in-chat command with their devices where helpful. No markdown, bullet points or emoji. REPLY IN ENGLISH ONLY: Even if the user writes in Turkish or another language or mentions foreign brand/device names, you must strictly and always reply in fluent English; never switch languages. If the user types a device command, note that it runs locally straight from chat; never say you lack abilities, because NEXUS runs those commands. For live data you cannot see (e.g. real-time weather) be honest but keep helping.",
};
var KNOW = "NEXUS facts you may rely on: NEXUS controls smart devices on the user's own local network, with no hub and no cloud fee. Apps: Windows, Linux, Android, and the site is for account, downloads and billing; iOS is coming soon. Devices: lights, plugs, AC/thermostat, curtains/blinds, smart locks, robot vacuums, cameras and sensors; Shelly, Tasmota, WLED, ESPHome, Philips Hue and Home Assistant over local HTTP, TP-Link Kasa and Yeelight over local TCP in the desktop app; Matter/Zigbee gear joins through the user's own Home Assistant. Local IP discovery pairs devices instantly with no vendor cloud. Features: homes and rooms, one-tap scenes (good morning, movie mode, good night, leaving home, welcome home, night security, guest mode, cleaning), automations and schedules that run on the always-on desktop app in the tray, energy overview with AI saving tips, security dashboard with cameras and privacy modes, household members with per-member permissions and invite codes, instant notification channels (in-app strip, system notifications, ntfy, Telegram, custom webhook), chat that runs commands like 'turn off the living room lights', 'set the AC to 22', 'good night', 'status', voice input, image attachments in chat, multi-language (Turkish and English) UI. For safety the chat never unlocks doors; unlocking happens on the lock's own screen. Plans: Free = 30 NEXUS AI credits per day, unlimited devices. NEXUS+ = 2,000 credits per month and first access to new AI features; price 499.99 TRY/month (3-day free trial) or 3,999.99 TRY/year (7-day trial) in Turkey, 11.99 USD/month or 89.99 USD/year elsewhere; cancel anytime, one click from the app, the site or the order email. Family plan is coming soon (not sold yet). Support: nexus.smarthome.app@gmail.com. Rules: never invent features, prices or device states; if you do not know something, say so briefly and point to the support email. Answer any question in a friendly way; you are not limited to a fixed list of topics, but keep NEXUS and smart homes as your home ground.";

export default {
  async fetch(req, env) {
    const o = req.headers.get("Origin") || "";
    const h = {
      "Access-Control-Allow-Origin": originAllowed(o) ? (o === "null" ? "*" : o) : ORIGINS[0],
      "Access-Control-Allow-Headers": "content-type",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    if (req.method !== "POST" || !originAllowed(o)) return new Response("forbidden", { status: 403, headers: h });
    // Kötü niyetli spam koruması: IP başına dakikada 15 istek. Normal sohbet bunun çok altındadır; yerel komutlar zaten Worker'a gelmez.
    if (env.RL) {
      const rl = await env.RL.limit({ key: req.headers.get("cf-connecting-ip") || "unknown" });
      if (!rl.success) return new Response(JSON.stringify({ reply: "" }), { status: 429, headers: { ...h, "content-type": "application/json" } });
    }
    // Ses → metin: ses kaydı burada işlenir, saklanmaz; yalnızca metin döner.
    const path = new URL(req.url).pathname;
    if (path === "/stt" || path === "/stt/") return transcribeRequest(req, env, h);
    let b;
    try {
      b = await req.json();
    } catch {
      return new Response("bad", { status: 400, headers: h });
    }
    const lang = b.lang === "tr" ? "tr" : "en";
    const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-8).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 600) }));
    if (!msgs.length) return new Response("bad", { status: 400, headers: h });
    let ctx = "";
    if (Array.isArray(b.devices) && b.devices.length) ctx = "\nThe user's paired devices (name, type, room): " + b.devices.slice(0, 25).map((d) => [d.name, d.type, d.room].filter(Boolean).join("/").slice(0, 60)).join("; ") + ".";
    try {
      const r = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: [{ role: "system", content: FACTS[lang] + "\n" + KNOW + ctx }, ...msgs], max_tokens: 380, temperature: 0.6 });
      const text = (typeof r.response === "string" ? r.response : (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\*\*/g, "").replace(/\s*\n[\*\-•]\s*/g, ", ").replace(/\n+/g, " ").replace(/\s+$/, "").trim();
      return new Response(JSON.stringify({ reply: text }), { headers: { ...h, "content-type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ reply: "" }), { status: 503, headers: { ...h, "content-type": "application/json" } });
    }
  },
};
