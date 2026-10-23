/**
 * NEXUS AI — çevrimdışı komut asistanı (Türkçe + İngilizce).
 * Yalnızca gerçekten yapabildiğini söyler: komutlar device-controls.js (NX) üzerinden
 * eşleşmiş cihazlara uygulanır; yerel ağ cihazlarına gerçek komut gider.
 *   - aç/kapat: ışıklar, prizler, klima/ısıtıcı, TV/hoparlör, temizleyici, belirli cihaz ya da oda
 *   - parlaklık (%), sıcaklık (derece), perde/panjur aç-kapat, kilitle, süpürgeyi başlat/şarja gönder
 *   - senaryolar: günaydın, film, iyi geceler, evden çıkış, eve geldim, gece güvenliği, temizlik, misafir
 *   - tema, rahatsız etme, durum özeti
 * Güvenlik: kilit sohbetten AÇILMAZ; "her şeyi kapat" buzdolabı gibi prizleri kapatmaz.
 */
(function () {
  var EN = window.nexusLang === "en";
  function T(tr, en) { return EN ? en : tr; }

  function fold(s) {
    return String(s || "").toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
  }
  function has(text, re) { return re.test(text); }

  var CATS = {
    light: /\b(isik|isiklar|isiklari|isigi|lamba|lambalar|lambayi|lambalari|aydinlatma|ampul|ampulu|serit|light|lights|lamp|lamps|bulb|bulbs|lighting)\b/,
    plug: /\b(priz|prizi|prizler|prizleri|plug|plugs|socket|outlet)\b/,
    climate: /\b(klima|klimayi|isitici|isiticiyi|kombi|kombiyi|termostat|termostati|vantilator|air ?conditioner|a\/c|heater|thermostat|fan|boiler)\b/,
    media: /\b(tv|televizyon|televizyonu|hoparlor|hoparloru|muzik|speaker|speakers|television|music|soundbar)\b/,
    cover: /\b(perde|perdeleri|perdeyi|panjur|panjuru|panjurlari|stor|curtain|curtains|blind|blinds|shade|shades|shutter|shutters)\b/,
    lock: /\b(kilit|kilidi|kapi kilidi|kilitle|lock|locks|door)\b/,
    vacuum: /\b(supurge|supurgeyi|robot|vacuum|hoover)\b/,
    purifier: /\b(temizleyici|temizleyiciyi|hava temizleyici|purifier)\b/
  };
  var ALL = /\b(her sey|herseyi|her seyi|hepsi|hepsini|tum cihaz|tum cihazlari|butun cihaz|butun cihazlari|everything|all devices|all)\b/;
  var ON = /\b(ac|acin|acar misin|yak|yakar misin|calistir|baslat|turn on|switch on|power on|start)\b|\bon\b/;
  var OFF = /\b(kapat|kapatir misin|kapatin|sondur|durdur|turn off|switch off|power off|stop|shut)\b|\boff\b/;

  var SCENE_WORDS = [
    ["good-morning", /\b(gunaydin|sabah rutini|uyandim|good morning|morning routine)\b/],
    ["movie-mode", /\b(film|sinema|movie|cinema)\b/],
    ["sleep-mode", /\b(iyi geceler|uyku modu|uyuyorum|yatiyorum|good night|goodnight|sleep mode|bedtime|going to sleep)\b/],
    ["leave-home", /\b(evden cik|evden cikiyorum|disari cik|disari cikiyorum|cikiyorum|leaving|leave home|going out|heading out)\b/],
    ["welcome-home", /\b(eve geldim|eve dondum|evdeyim|i'?m home|im home|i am home|back home|welcome home)\b/],
    ["night-security", /\b(gece guvenligi|evi guvene al|night security|secure the house|secure home)\b/],
    ["guest-mode", /\b(misafir modu|misafir geliyor|guest mode|guests are coming)\b/],
    ["clean-start", /\b(temizligi baslat|temizlik baslat|supurgeyi calistir|start cleaning|start vacuum)\b/]
  ];
  var SCENE_NAMES = {
    "good-morning": ["Günaydın", "Good morning"], "movie-mode": ["Film modu", "Movie mode"], "sleep-mode": ["Uyku modu", "Sleep mode"],
    "leave-home": ["Evden çıkış", "Leaving home"], "welcome-home": ["Eve geldim", "Welcome home"], "night-security": ["Gece güvenliği", "Night security"],
    "guest-mode": ["Misafir modu", "Guest mode"], "clean-start": ["Temizlik", "Cleaning"]
  };

  function nx() { return window.NX || null; }
  function devices() { try { return nx() ? nx().readDevices() : []; } catch (e) { return []; } }
  function names(list, max) {
    var shown = list.slice(0, max || 3).map(function (x) { return x.device.name; });
    var more = list.length - shown.length;
    return shown.join(", ") + (more > 0 ? T(" ve " + more + " cihaz daha", " and " + more + " more") : "");
  }

  // Metinde geçen cihaz adı / oda / kategori
  function targets(text, all) {
    var list = all.map(function (d, i) { return { device: d, index: i, kind: nx().kindOf(d), folded: fold(d.name), room: fold(d.room) }; });
    // 1) cihaz adı (en uzun eşleşme önce)
    var byName = list.filter(function (x) { return x.folded.length >= 3 && text.indexOf(x.folded) !== -1; });
    if (byName.length) {
      var longest = Math.max.apply(null, byName.map(function (x) { return x.folded.length; }));
      byName = byName.filter(function (x) { return x.folded.length === longest || text.indexOf(x.folded) !== -1; });
      return { list: byName, by: "name" };
    }
    // 2) kategori (+ isteğe bağlı oda)
    var cat = null;
    Object.keys(CATS).some(function (k) { if (CATS[k].test(text)) { cat = k; return true; } return false; });
    var rooms = {};
    list.forEach(function (x) { if (x.room && x.room.length >= 3 && text.indexOf(x.room) !== -1) rooms[x.room] = 1; });
    var inRoom = Object.keys(rooms).length ? list.filter(function (x) { return rooms[x.room]; }) : null;
    var base = inRoom || list;
    if (cat) {
      var match = base.filter(function (x) { return catOf(x) === cat; });
      return { list: match, by: "cat", cat: cat, room: inRoom ? Object.keys(rooms)[0] : null };
    }
    if (inRoom) return { list: inRoom, by: "room", room: Object.keys(rooms)[0] };
    if (ALL.test(text)) return { list: list, by: "all" };
    return { list: [], by: "none" };
  }
  function catOf(x) {
    var k = x.kind, n = x.folded;
    if (k === "light") return "light";
    if (k === "cover") return "cover";
    if (k === "lock") return "lock";
    if (k === "vacuum") return "vacuum";
    if (k === "media") return "media";
    if (k === "purifier") return "purifier";
    if (k === "ac" || k === "thermostat") return "climate";
    if (/priz|plug|socket/.test(n) || k === "energy") return "plug";
    return "other";
  }

  function apply(items, field, value, filter) {
    var N = nx(), changed = [], lan = 0;
    items.forEach(function (x) {
      if (filter && !filter(x)) return;
      N.setField(x.index, field, value);
      changed.push(x);
      if (N.isLan(x.device)) lan += 1;
    });
    return { changed: changed, lan: lan };
  }
  function lanNote(r) {
    return r.lan ? T(" " + r.lan + " cihaza yerel ağdan komut gitti.", " A command was sent over your local network to " + r.lan + " device" + (r.lan > 1 ? "s" : "") + ".") : "";
  }
  function powerable(x) { return nx().hasPower(x.device); }

  function widget(icon, title, sub) {
    var e = nx() ? nx().escapeHtml : function (s) { return s; };
    return '<div class="mt-3 bg-[#F1F7FF] dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-xl p-3 flex items-center gap-3" data-no-i18n>' +
      '<div class="p-2 bg-white dark:bg-slate-800 rounded-lg text-[#4C7DFF]"><i data-lucide="' + icon + '" class="w-5 h-5"></i></div>' +
      '<div class="min-w-0"><p class="text-sm font-semibold text-gray-800 dark:text-white truncate">' + e(title) + '</p><p class="text-xs text-gray-500 dark:text-slate-400 truncate">' + e(sub) + "</p></div></div>";
  }

  function help() {
    return T(
      "Şunları yapabilirim: ışıkları, prizleri, klimayı ya da belirli bir cihazı açıp kapatmak (\"salon ışıklarını kapat\"), parlaklık ayarlamak (\"ışıkları %40 yap\"), sıcaklık ayarlamak (\"klimayı 22 derece yap\"), perdeleri açıp kapatmak, kapıyı kilitlemek, senaryo çalıştırmak (\"günaydın\", \"film modu\", \"iyi geceler\", \"evden çıkıyorum\") ve neyin açık olduğunu söylemek (\"durum\").",
      "Here's what I can do: turn lights, plugs, the AC or a specific device on and off (\"turn off the living room lights\"), set brightness (\"set the lights to 40%\"), set the temperature (\"set the AC to 22 degrees\"), open or close curtains, lock the door, run scenes (\"good morning\", \"movie mode\", \"good night\", \"I'm leaving\") and tell you what's on (\"status\").");
  }

  function status(all) {
    if (!all.length) return { reply: noDevices() };
    var N = nx();
    var on = [], warn = [];
    all.forEach(function (d, i) {
      var st = N.statusOf(d, i);
      if (st.badge === "on") on.push(d.name);
      if (st.badge === "warn") warn.push(d.name + " (" + (window.nexusTr ? nexusTr(st.text) : st.text) + ")");
    });
    var parts = [T(all.length + " cihaz eşleşmiş.", all.length + " devices paired.")];
    parts.push(on.length ? T("Açık olanlar: " + on.slice(0, 6).join(", ") + (on.length > 6 ? "…" : "") + ".", "On right now: " + on.slice(0, 6).join(", ") + (on.length > 6 ? "…" : "") + ".") : T("Şu an açık cihaz yok.", "Nothing is on right now."));
    if (warn.length) parts.push(T("Dikkat: " + warn.slice(0, 4).join(", ") + ".", "Needs attention: " + warn.slice(0, 4).join(", ") + "."));
    return { reply: parts.join(" ") };
  }

  function noDevices() {
    return T("Henüz eşleşmiş cihazın yok. Önce Cihaz Ekle ekranından yerel ağındaki bir cihazı ekle; sonra komutlarını buradan verebilirsin.",
      "You don't have any paired devices yet. Add a device on your local network from the Add Device screen first, then you can control it from here.");
  }

  // İngilizce oda adları → uygulamadaki (Türkçe) oda adları
  var ROOM_EN = [[/\bliving ?room|lounge\b/g, "salon"], [/\bkitchen\b/g, "mutfak"], [/\bbed ?room\b/g, "yatak odasi"], [/\bbath ?room\b/g, "banyo"],
    [/\b(entrance|entry|hallway|hall)\b/g, "giris koridor"], [/\bgarden|yard\b/g, "bahce"], [/\b(kids'? ?room|children'?s room|nursery)\b/g, "cocuk odasi"],
    [/\b(office|study)\b/g, "calisma odasi"], [/\bgarage\b/g, "garaj"], [/\bbalcony\b/g, "balkon"], [/\bdining room\b/g, "yemek odasi"]];
  function reply(raw) {
    var text = fold(raw);
    ROOM_EN.forEach(function (r) { text = text.replace(r[0], function (m) { return m + " " + r[1]; }); });
    var N = nx();
    var all = devices();

    if (!text) return { reply: help() };
    if (/\b(yardim|ne yapabilirsin|neler yapabilirsin|komutlar|help|what can you do|commands)\b/.test(text)) return { reply: help() };

    // Tema
    if (/\b(karanlik tema|koyu tema|karanlik mod|koyu mod|dark mode|dark theme)\b/.test(text)) return { reply: T("Koyu temaya geçtim.", "Switched to the dark theme."), action: "dark" };
    if (/\b(acik tema|aydinlik tema|acik mod|light mode|light theme)\b/.test(text)) return { reply: T("Açık temaya geçtim.", "Switched to the light theme."), action: "light" };
    // Rahatsız etme
    if (/\b(rahatsiz etme|do not disturb|dnd)\b/.test(text)) {
      if (OFF.test(text) && !/bildirimleri kapat/.test(text)) return { reply: T("Rahatsız etme modunu kapattım.", "Do not disturb is off."), action: "dnd-off" };
      return { reply: T("Rahatsız etme modunu açtım; bildirimler sessize alındı.", "Do not disturb is on; notifications are silenced."), action: "dnd-on" };
    }
    // Durum
    if (/\b(durum|durumu|ne acik|neler acik|hangi cihazlar acik|akilli kontrol|status|what'?s on|whats on|which devices are on|smart control)\b/.test(text)) return status(all);

    // Senaryo oluşturma (mevcut akış korunur)
    var wantsCreate = /\b(olustur|kur|ekle|create|make|build|add)\b/.test(text) && /\b(senaryo|otomasyon|rutin|scenario|automation|routine)\b/.test(text);
    if (wantsCreate) return { reply: T("İsteğine göre yeni bir senaryo hazırladım ve listene ekledim.", "I've prepared a new scenario based on your request and added it to your list."), action: "create" };

    if (!N) return { reply: help() };

    // Senaryo çalıştırma
    for (var s = 0; s < SCENE_WORDS.length; s++) {
      if (SCENE_WORDS[s][1].test(text)) {
        if (!all.length) return { reply: noDevices() };
        var id = SCENE_WORDS[s][0];
        var r = N.runScene(id);
        var nm = SCENE_NAMES[id][EN ? 1 : 0];
        if (!r.changed) return { reply: T(nm + " senaryosundan etkilenecek uygun cihaz bulunamadı.", "None of your devices are affected by the " + nm + " scene.") };
        return {
          reply: T(nm + " senaryosunu çalıştırdım: " + r.changed + " cihaz ayarlandı.", "Ran the " + nm + " scene: " + r.changed + " device" + (r.changed > 1 ? "s" : "") + " adjusted.") + lanNote(r),
          widget: widget("sparkles", nm, T(r.changed + " cihaz", r.changed + " device" + (r.changed > 1 ? "s" : "")))
        };
      }
    }

    if (!all.length) return { reply: noDevices() };

    var tg = targets(text, all);
    var pct = text.match(/(?:%|yuzde)\s*(\d{1,3})|(\d{1,3})\s*(?:%|percent|yuzde)/);
    var deg = text.match(/(\d{1,3}(?:[.,]5)?)\s*(derece|°f?|degrees?|deg|fahrenheit|c\b|f\b)/);

    // Kilit: yalnızca kilitleme
    if (/\b(kilidi ac|kilidini ac|unlock)\b/.test(text)) {
      return { reply: T("Güvenlik için kilidi sohbetten açmıyorum; kilidin kontrol ekranından açabilirsin.", "For safety I don't unlock doors from chat; you can unlock from the lock's control screen.") };
    }
    if (/\b(kilitle|kapiyi kilitle|lock)\b/.test(text) && !/\bunlock\b/.test(text)) {
      var locks = all.map(function (d, i) { return { device: d, index: i }; }).filter(function (x) { return N.kindOf(x.device) === "lock"; });
      if (!locks.length) return { reply: T("Eşleşmiş akıllı kilit bulunamadı.", "No paired smart lock was found.") };
      var rl = apply(locks, "locked", true);
      return { reply: T(rl.changed.length + " kilit kilitlendi: " + names(rl.changed) + ".", "Locked " + rl.changed.length + " lock" + (rl.changed.length > 1 ? "s" : "") + ": " + names(rl.changed) + ".") + lanNote(rl), widget: widget("lock", T("Kilitlendi", "Locked"), names(rl.changed)) };
    }

    // Perde / panjur
    if (tg.cat === "cover" || (tg.by === "name" && tg.list.every(function (x) { return x.kind === "cover"; }))) {
      var covers = tg.list.filter(function (x) { return x.kind === "cover"; });
      if (!covers.length) return { reply: T("Eşleşmiş perde ya da panjur bulunamadı.", "No paired curtains or blinds were found.") };
      var open = /\b(ac|open|raise|up)\b/.test(text) && !OFF.test(text);
      if (pct) {
        var p = Math.max(0, Math.min(100, +(pct[1] || pct[2])));
        var rp = apply(covers, "position", p);
        return { reply: T(names(rp.changed) + " %" + p + " konumuna ayarlandı.", names(rp.changed) + " set to " + p + "%.") + lanNote(rp) };
      }
      var rc = apply(covers, "coverAction", open ? "open" : "close");
      return { reply: T(names(rc.changed) + (open ? " açıldı." : " kapatıldı."), names(rc.changed) + (open ? " opened." : " closed.")) + lanNote(rc) };
    }

    // Süpürge
    if (tg.cat === "vacuum" || (tg.by === "name" && tg.list.every(function (x) { return x.kind === "vacuum"; }))) {
      var vac = tg.list.filter(function (x) { return x.kind === "vacuum"; });
      if (!vac.length) return { reply: T("Eşleşmiş robot süpürge bulunamadı.", "No paired robot vacuum was found.") };
      var dock = /\b(sarj|istasyon|eve don|dock|return|stop|durdur)\b/.test(text);
      var rv = apply(vac, "mode", dock ? "docked" : "cleaning");
      return { reply: T(names(rv.changed) + (dock ? " şarj istasyonuna gönderildi." : " temizliğe başladı."), names(rv.changed) + (dock ? " is returning to its dock." : " started cleaning.")) };
    }

    // Sıcaklık
    if (deg || (tg.cat === "climate" && /\b(sicaklik|derece|temperature|degrees)\b/.test(text))) {
      var cl = (tg.list.length ? tg.list : all.map(function (d, i) { return { device: d, index: i, kind: N.kindOf(d) }; }))
        .filter(function (x) { return (x.kind === "ac" || x.kind === "thermostat") && N.hasFeature(x.device, "target"); });
      if (!cl.length) return { reply: T("Sıcaklığı ayarlanabilen eşleşmiş bir klima ya da termostat bulunamadı.", "No paired AC or thermostat with temperature control was found.") };
      if (!deg) return { reply: T("Kaç dereceye ayarlayayım? Örneğin \"klimayı 22 derece yap\".", "What temperature should I set? For example \"set the AC to 22 degrees\".") };
      var t = parseFloat(String(deg[1]).replace(",", "."));
      if (/f/.test(deg[2]) || (N.tempUnit && N.tempUnit() === "F" && t > 40)) t = Math.round((t - 32) * 5 / 9 * 2) / 2; // °F → °C
      t = Math.max(5, Math.min(30, t));
      var rt = apply(cl, "target", t);
      cl.forEach(function (x) { if (x.kind === "ac" && N.hasCap(x.device, "switch")) N.setField(x.index, "switch", true); });
      var shown = N.fmtTemp ? N.fmtTemp(t) : t + "°";
      return { reply: T(names(rt.changed) + " " + shown + " olarak ayarlandı.", names(rt.changed) + " set to " + shown + ".") + lanNote(rt), widget: widget("thermometer", T("Hedef sıcaklık", "Target temperature"), shown) };
    }

    // Parlaklık
    if (pct && (tg.cat === "light" || tg.by === "name" || tg.by === "room" || /\b(parlaklik|brightness|dim)\b/.test(text))) {
      var lights = (tg.list.length ? tg.list : all.map(function (d, i) { return { device: d, index: i, kind: N.kindOf(d) }; }).filter(function (x) { return x.kind === "light"; }))
        .filter(function (x) { return N.hasCap(x.device, "brightness"); });
      if (!lights.length) return { reply: T("Parlaklığı ayarlanabilen eşleşmiş bir ışık bulunamadı.", "No paired light with brightness control was found.") };
      var b = Math.max(1, Math.min(100, +(pct[1] || pct[2])));
      var rb = apply(lights, "brightness", b);
      return { reply: T(names(rb.changed) + " parlaklığı %" + b + " yapıldı.", "Set " + names(rb.changed) + " to " + b + "% brightness.") + lanNote(rb), widget: widget("sun", T("Parlaklık", "Brightness"), "%" + b) };
    }

    // Aç / kapat
    var wantOn = ON.test(text), wantOff = OFF.test(text);
    if (wantOn || wantOff) {
      var turnOn = wantOn && !wantOff;
      if (tg.by === "none") {
        return { reply: T("Hangi cihazı " + (turnOn ? "açayım" : "kapatayım") + "? Cihazın adını, odasını ya da \"ışıklar\", \"prizler\" gibi bir türü yazabilirsin. Eşleşmiş cihazların: " + names(all.map(function (d) { return { device: d }; }), 4) + ".",
          "Which device should I turn " + (turnOn ? "on" : "off") + "? Use a device name, a room or a type like \"lights\" or \"plugs\". Your paired devices: " + names(all.map(function (d) { return { device: d }; }), 4) + ".") };
      }
      var pool = tg.list.filter(powerable);
      if (tg.by === "all" && !turnOn) {
        // "Her şeyi kapat": prizler ve sürekli çalışması gereken cihazlar kapatılmaz
        pool = pool.filter(function (x) { return ["light", "media", "purifier", "ac"].indexOf(x.kind) !== -1; });
      }
      if (!pool.length) {
        var what = tg.cat ? { light: T("ışık", "light"), plug: T("priz", "plug"), climate: T("klima/ısıtıcı", "AC or heater"), media: T("TV/hoparlör", "TV or speaker"), purifier: T("hava temizleyici", "air purifier") }[tg.cat] || T("cihaz", "device") : T("cihaz", "device");
        return { reply: T("Açılıp kapatılabilen eşleşmiş bir " + what + " bulunamadı" + (tg.room ? " (" + tg.room + ")" : "") + ".", "No paired " + what + " that can be switched was found" + (tg.room ? " (" + tg.room + ")" : "") + ".") };
      }
      var already = pool.filter(function (x) { return N.stateOf(x.device).switch === turnOn; });
      var rs = apply(pool, "switch", turnOn);
      var msg = T(names(rs.changed) + (turnOn ? " açıldı." : " kapatıldı."), names(rs.changed) + (turnOn ? " turned on." : " turned off."));
      if (already.length === pool.length) msg = T(names(rs.changed) + " zaten " + (turnOn ? "açıktı" : "kapalıydı") + "; komut yine de gönderildi.", names(rs.changed) + " " + (pool.length > 1 ? "were" : "was") + " already " + (turnOn ? "on" : "off") + "; the command was sent anyway.");
      return { reply: msg + lanNote(rs), widget: widget(turnOn ? "power" : "power-off", turnOn ? T("Açıldı", "Turned on") : T("Kapatıldı", "Turned off"), T(rs.changed.length + " cihaz", rs.changed.length + " device" + (rs.changed.length > 1 ? "s" : ""))) };
    }

    return { reply: T("Bunu tam anlayamadım. ", "I didn't quite get that. ") + help() };
  }

  window.nexusAssistant = { reply: reply, help: help, fold: fold };
})();
