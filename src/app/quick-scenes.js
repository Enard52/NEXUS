/**
 * Hazır senaryolar (tıkla ve çalıştır) — kullanıcının GERÇEKTEN eşleştirdiği cihazlara göre.
 * Senaryo tanımları ve komutlar device-controls.js (NX.SCENES / sceneActsOf / runScene) içindedir; burası yalnızca
 * görünüm bilgisi (simge, renk, açıklama), "bu senaryo hangi cihazlara ne yapar" önizlemesi ve kayıt yardımcılarıdır.
 * Cihaza uygulanabilir hiçbir adımı olmayan senaryo listelenmez / seçilemez (cihaz yoksa sahte bir "hazır" gösterilmez).
 */
(function () {
  "use strict";

  // Görünüm: yalnızca NX.SCENES'te gerçekten bulunan kimlikler kullanılır. time: otomasyon önerisi için gerçek zaman tetikleyicisi.
  var META = {
    "good-morning": { icon: "sunrise", hex: "#f59e0b", bg: "bg-amber-500/10", color: "text-amber-500", desc: "Işıkları sıcak tonda açar, perdeleri açar, klimayı 22° yapar.", time: { value: "07:00", repeat: "daily", label: "Her sabah 07:00" } },
    "welcome-home": { icon: "door-open", hex: "#10b981", bg: "bg-emerald-500/10", color: "text-emerald-500", desc: "Işıkları ve perdeleri açar, klimayı 22° çalıştırır, süpürgeyi şarja gönderir." },
    "leave-home": { icon: "log-out", hex: "#ef4444", bg: "bg-red-500/10", color: "text-red-500", desc: "Işık, TV ve klimayı kapatır, perdeleri kapatır, kapıyı kilitler." },
    "sleep-mode": { icon: "moon", hex: "#6366f1", bg: "bg-indigo-500/10", color: "text-indigo-500", desc: "Işıkları ve TV'yi kapatır, perdeleri kapatır, kapıyı kilitler.", time: { value: "23:00", repeat: "daily", label: "Her gece 23:00" } },
    "movie-mode": { icon: "clapperboard", hex: "#e11d48", bg: "bg-rose-500/10", color: "text-rose-500", desc: "Işıkları %15 sıcak tona getirir, perdeleri kapatır, TV'yi açar." },
    "night-security": { icon: "shield-check", hex: "#06b6d4", bg: "bg-cyan-500/10", color: "text-cyan-500", desc: "Kapıyı kilitler, perdeleri kapatır.", time: { value: "23:30", repeat: "daily", label: "Her gece 23:30" } },
    "guest-mode": { icon: "users", hex: "#8b5cf6", bg: "bg-violet-500/10", color: "text-violet-500", desc: "Işıkları %70 parlaklıkta açar." },
    "clean-start": { icon: "sparkles", hex: "#4C7DFF", bg: "bg-blue-500/10", color: "text-blue-500", desc: "Robot süpürgeyi başlatır.", time: { value: "10:00", repeat: "weekdays", label: "Hafta içi 10:00" } },
    "comfort-room": { icon: "thermometer", hex: "#0ea5e9", bg: "bg-sky-500/10", color: "text-sky-500", desc: "Klimayı ve termostatı konfor ayarına getirir, hava temizleyiciyi çalıştırır." },
    "sleep-prep": { icon: "bed-double", hex: "#7c3aed", bg: "bg-purple-500/10", color: "text-purple-500", desc: "Işıkları ve TV'yi kapatır, perdeleri kapatır, kapıyı kilitler." },
  };
  var ORDER = ["good-morning", "welcome-home", "leave-home", "sleep-mode", "movie-mode", "night-security", "guest-mode", "clean-start", "comfort-room", "sleep-prep"];

  function NXok() {
    return window.NX && NX.SCENES && NX.readDevices && NX.sceneActsOf;
  }

  // Bir (alan, değer) çiftini cihaz türüne uygun, sade Türkçeyle anlatır.
  function describeAct(act) {
    var f = act[0];
    var v = act[1];
    if (f === "switch") return v ? "açılır" : "kapatılır";
    if (f === "brightness") return "parlaklık %" + v;
    if (f === "tone") return "ton ayarlanır";
    if (f === "color") return "renk ayarlanır";
    if (f === "coverAction") return v === "open" ? "açılır" : "kapatılır";
    if (f === "position") return "%" + v + " konuma gelir";
    if (f === "target") return v + "° hedef";
    if (f === "locked") return v ? "kilitlenir" : "kilit açılır";
    if (f === "mode") return v === "docked" ? "şarja döner" : "temizliğe başlar";
    return "ayarlanır";
  }

  // Senaryonun şu an eşleşmiş cihazlarda yapacakları: [{ name, index, text }]
  function preview(id) {
    if (!NXok() || !NX.SCENES[id]) return [];
    var out = [];
    NX.readDevices().forEach(function (d, i) {
      var acts = NX.sceneActsOf(id, d);
      if (!acts.length) return;
      var parts = [];
      acts.forEach(function (a) {
        var t = describeAct(a);
        if (parts.indexOf(t) === -1) parts.push(t);
      });
      out.push({ name: d.name || "Cihaz", index: i, text: parts.join(", ") });
    });
    return out;
  }

  function entry(id) {
    var m = META[id] || { icon: "zap", hex: "#4C7DFF", bg: "bg-indigo-500/10", color: "text-indigo-500", desc: "" };
    var pv = preview(id);
    return {
      id: id,
      title: NX.SCENES[id].title,
      desc: m.desc,
      icon: m.icon,
      hex: m.hex,
      bg: m.bg,
      color: m.color,
      time: m.time || null,
      affected: pv.length,
      devices: pv,
    };
  }

  // Tüm bilinen senaryolar (uygulanabilirler önce, etkilenen cihaz sayısına göre).
  function list() {
    if (!NXok()) return [];
    var ids = ORDER.filter(function (id) { return NX.SCENES[id]; });
    var seen = {};
    ids.forEach(function (i) { seen[i] = 1; });
    var items = ids.map(entry);
    return items.sort(function (a, b) {
      return (b.affected > 0 ? 1 : 0) - (a.affected > 0 ? 1 : 0) || b.affected - a.affected;
    });
  }
  function available() {
    return list().filter(function (e) { return e.affected > 0; });
  }
  function hasDevices() {
    try { return !!(NXok() && NX.readDevices().length); } catch (e) { return false; }
  }
  function metaFor(id) {
    return META[id] || null;
  }

  // Senaryoyu çalıştırır. Dönüş: { summary, changed, failedNames: Promise<string[]> } — yerel ağ cihazlarının gerçek sonucu birkaç sn sonra gelir.
  function run(id) {
    var r = NX.runScene(id);
    var summary = NX.sceneSummary(r);
    var lan = (r.lanDevices || []).slice();
    var failed = new Promise(function (resolve) {
      if (!lan.length) return resolve([]);
      var tries = 0;
      (function check() {
        tries += 1;
        var pending = lan.filter(function (x) {
          var s = NX.lanStatus ? NX.lanStatus(x.index) : null;
          return s !== "ok" && s !== "error";
        });
        if (pending.length && tries < 8) return setTimeout(check, 700);
        resolve(lan.filter(function (x) {
          return !!(NX.lanError ? NX.lanError(x.index) : (NX.LAN_ERRORS || {})[x.index]);
        }).map(function (x) { return x.name; }));
      })();
    });
    return { summary: summary, changed: r.changed, failedNames: failed };
  }

  // Kayıt: tıkla-çalıştır ("clickrun") ya da otomasyon. Biçim data.js normalizeItem ile uyumludur.
  function save(type, sceneId, opts) {
    opts = opts || {};
    var key = type === "clickrun" ? "nexusCustomClickRun" : "nexusCustomAutomations";
    var m = metaFor(sceneId) || { icon: "zap", bg: "bg-indigo-500/10", color: "text-indigo-500" };
    var title = opts.title || (sceneId && NX.SCENES[sceneId] ? NX.SCENES[sceneId].title : "Yeni senaryo");
    var items = readAndNormalizeItems(key, type);
    var id = "custom-" + Date.now();
    items.push({
      id: id,
      title: title,
      desc: opts.desc || (sceneId ? m.desc : "Bildirim gönderir"),
      icon: opts.icon || m.icon,
      bgClass: m.bg,
      colorClass: m.color,
      room: "Tüm Ev",
      enabled: true,
      showOnHome: true,
      showInRoom: false,
      trigger: opts.trigger || (type === "clickrun" ? { type: "manual" } : { type: "time", value: "", repeat: "daily" }),
      sceneId: sceneId || undefined,
      actions: [],
    });
    writeNormalizedItems(key, items, type);
    return id;
  }

  window.nexusQuickScenes = {
    META: META,
    list: list,
    available: available,
    hasDevices: hasDevices,
    preview: preview,
    run: run,
    save: save,
    metaFor: metaFor,
    describeAct: describeAct,
  };
})();
