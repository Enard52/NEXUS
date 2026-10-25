const ORIGINS = ["https://nexus-smarthome.pages.dev","https://nexus-web-jre.pages.dev","https://localhost","http://localhost","capacitor://localhost","null"];
const FACTS = {
 tr: "Sen NEXUS akıllı ev uygulamasının asistanısın. Karşındaki bir ev sahibi; sıcak, doğal ve kısa konuş (1-4 cümle), robot gibi değil arkadaş gibi. Markdown, madde işareti ve emoji kullanma. Sadece Türkçe yaz.",
 en: "You are the assistant of the NEXUS smart home app. You talk to a home owner: warm, natural and brief (1-4 sentences), like a friendly person, not a robot. No markdown, bullet points or emoji. Reply in English only."
};
const KNOW = "NEXUS facts you may rely on: NEXUS controls smart devices on the user's own local network, with no hub and no cloud fee. Apps: Windows, Linux, Android (test build), web app; iOS is coming soon. Features: pair devices (lights, plugs, AC/thermostat, curtains, locks, robot vacuum, cameras), homes and rooms, scenes (one tap, e.g. good morning, movie mode, good night, leaving home), automations and schedules, energy overview, household members with per-member permissions, optional free account that syncs settings across devices, NEXUS AI chat that can run commands like 'turn off the living room lights', 'set the AC to 22', 'good night', 'status'. The assistant never unlocks doors from chat for safety. Plans: Free = 30 NEXUS AI credits per day, unlimited devices. NEXUS+ = 2,000 credits per month and first access to new AI features; price 499.99 TRY/month (3-day free trial) or 3,999.99 TRY/year (7-day trial) in Turkey, 11.99 USD/month or 89.99 USD/year elsewhere; cancel anytime. Family plan is coming soon (not sold yet). Support: nexus.smarthome.app@gmail.com. Rules: never invent features, prices or device states; if you do not know, say so briefly and suggest the support email. If the user asks to control a device, tell them to phrase it as a direct command (e.g. 'turn off the bedroom lights'); you cannot operate devices yourself in this reply. Stay on topic of NEXUS and smart homes; politely decline unrelated or harmful requests.";
export default {
 async fetch(req, env) {
  const o = req.headers.get("Origin") || "";
  const h = { "Access-Control-Allow-Origin": ORIGINS.includes(o) ? (o === "null" ? "*" : o) : ORIGINS[0], "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (req.method !== "POST" || !ORIGINS.includes(o)) return new Response("forbidden", { status: 403, headers: h });
  let b; try { b = await req.json(); } catch { return new Response("bad", { status: 400, headers: h }); }
  const lang = b.lang === "tr" ? "tr" : "en";
  const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-8).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 600) }));
  if (!msgs.length) return new Response("bad", { status: 400, headers: h });
  let ctx = "";
  if (Array.isArray(b.devices) && b.devices.length) ctx = "\nThe user's paired devices (name, type, room): " + b.devices.slice(0, 25).map(d => [d.name, d.type, d.room].filter(Boolean).join("/").slice(0, 60)).join("; ") + ".";
  try {
   const r = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: [{ role: "system", content: FACTS[lang] + "\n" + KNOW + ctx }, ...msgs], max_tokens: 260, temperature: 0.6 });
   const text = (typeof r.response === "string" ? r.response : (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\*\*/g, "").replace(/\s+$/, "").trim();
   return new Response(JSON.stringify({ reply: text }), { headers: { ...h, "content-type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ reply: "" }), { status: 503, headers: { ...h, "content-type": "application/json" } }); }
 }
};

