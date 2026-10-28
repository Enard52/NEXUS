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
  // V: birden fazla doğal söyleyişten birini seçer (tekrar eden robot cümlesi olmasın).
  function V(trs, ens) { var a = EN ? ens : trs; return a[Math.floor(Math.random() * a.length)]; }

  function fold(s) {
    return String(s || "").toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
  }
  function has(text, re) { return re.test(text); }

  var CATS = {
    light: /\b(isik|isiklar|isiklari|isiklarini|isigi|lamba|lambalar|lambayi|lambalari|lambalarini|aydinlatma|aydinlatmalari|aydinlatmalarini|ampul|ampulu|ampulleri|ampullerini|serit|light|lights|lamp|lamps|bulb|bulbs|lighting)\b/,
    plug: /\b(priz|prizi|prizler|prizleri|prizlerini|plug|plugs|socket|sockets|outlet|outlets)\b/,
    climate: /\b(klima|klimayi|klimalar|klimalari|klimalarini|isitici|isiticiyi|isiticilar|isiticilari|isiticilarini|kombi|kombiyi|termostat|termostati|termostatlari|termostatlarini|vantilator|air ?conditioner|a\/c|heater|heaters|thermostat|thermostats|fan|fans|boiler)\b/,
    media: /\b(tv|televizyon|televizyonu|televizyonlar|televizyonlari|hoparlor|hoparloru|hoparlorler|hoparlorleri|muzik|speaker|speakers|television|televisions|music|soundbar)\b/,
    cover: /\b(perde|perdeler|perdeleri|perdelerini|perdeyi|panjur|panjurlar|panjuru|panjurlari|panjurlarini|stor|storlari|curtain|curtains|blind|blinds|shade|shades|shutter|shutters)\b/,
    lock: /\b(kilit|kilidi|kilitler|kilitleri|kapi kilidi|kapi kilitleri|kilitle|lock|locks|door|doors)\b/,
    vacuum: /\b(supurge|supurgeyi|supurgeler|supurgeleri|supurgelerini|robot|vacuum|vacuums|hoover)\b/,
    purifier: /\b(temizleyici|temizleyiciyi|temizleyiciler|temizleyicileri|temizleyicilerini|hava temizleyici|hava temizleyicisi|purifier|purifiers)\b/
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
    if (EN && /\bac\b/.test(text)) {
      cat = "climate";
    } else {
      Object.keys(CATS).some(function (k) { if (CATS[k].test(text)) { cat = k; return true; } return false; });
    }
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

  // Son komutta yerel ağa komut giden cihazlar: sohbet gerçek sonucu sonradan doğrulayabilsin.
  var LAST_LAN = [];
  function trackLan(items) {
    var N = nx();
    if (!N || !items) return;
    items.forEach(function (x) {
      if (x && x.device && N.isLan(x.device)) LAST_LAN.push({ index: x.index, name: x.device.name || "" });
    });
  }

  function apply(items, field, value, filter) {
    var N = nx(), changed = [], lan = 0;
    items.forEach(function (x) {
      if (filter && !filter(x)) return;
      N.setField(x.index, field, value);
      changed.push(x);
      if (N.isLan(x.device)) lan += 1;
    });
    trackLan(changed);
    return { changed: changed, lan: lan };
  }
  function lanNote(r) {
    return r.lan ? T(" " + r.lan + " cihaza yerel ağdan komut gitti.", " A command was sent over your local network to " + r.lan + " device" + (r.lan > 1 ? "s" : "") + ".") : "";
  }
  // Komut sonrası durum sorgusu (stitch-chat.html gecikmeli olarak çağırır).
  function lanPending() { return LAST_LAN.slice(); }
  function lanSettled(items) {
    var N = nx();
    if (!N || !items || !items.length) return true;
    return items.every(function (it) {
      var s = N.lanStatus ? N.lanStatus(it.index) : null;
      return s === "ok" || s === "error";
    });
  }
  function lanFailureNote(items) {
    var N = nx();
    if (!N || !items || !items.length) return "";
    var bad = items.filter(function (it) {
      var msg = N.lanError ? N.lanError(it.index) : (N.LAN_ERRORS || {})[it.index];
      return !!msg;
    });
    if (!bad.length) return "";
    var list = bad.slice(0, 3).map(function (it) { return it.name; }).join(", ") +
      (bad.length > 3 ? T(" ve " + (bad.length - 3) + " cihaz daha", " and " + (bad.length - 3) + " more") : "");
    return T("⚠ " + list + " için komut cihaza ulaşamadı — cihazın açık ve aynı Wi-Fi ağında olduğunu doğrula.",
      "⚠ The command did not reach " + list + " — make sure it is on and connected to the same Wi-Fi network.");
  }
  function powerable(x) { return nx().hasPower(x.device); }

  function widget(icon, title, sub) {
    var e = nx() ? nx().escapeHtml : function (s) { return s; };
    return '<div class="mt-3 bg-[#F1F7FF] dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-xl p-3 flex items-center gap-3" data-no-i18n>' +
      '<div class="p-2 bg-white dark:bg-slate-800 rounded-lg text-[#4C7DFF]"><i data-lucide="' + icon + '" class="w-5 h-5"></i></div>' +
      '<div class="min-w-0"><p class="text-sm font-semibold text-gray-800 dark:text-white truncate">' + e(title) + '</p><p class="text-xs text-gray-500 dark:text-slate-400 truncate">' + e(sub) + "</p></div></div>";
  }

  function help() {
    EN = window.nexusLang === "en";
    return T(
      "Evini benimle yönetebilirsin: ışıkları, prizleri, klimayı ya da belirli bir cihazı açıp kapatırım (\"salon ışıklarını kapat\"), parlaklığı (\"ışıkları %40 yap\") ve sıcaklığı (\"klimayı 22 derece yap\") ayarlarım, perdeleri açıp kapatır, kapıyı kilitlerim. \"Günaydın\", \"film modu\", \"iyi geceler\" ya da \"evden çıkıyorum\" dersen senaryoyu çalıştırırım, \"durum\" yazarsan neyin açık olduğunu söylerim. İstersen sadece sohbet edebilir ya da NEXUS hakkında soru sorabilirsin.",
      "You can run your home through me: I turn lights, plugs, the AC or a specific device on and off (\"turn off the living room lights\"), set brightness (\"set the lights to 40%\") and temperature (\"set the AC to 22 degrees\"), open and close curtains and lock the door. Say \"good morning\", \"movie mode\", \"good night\" or \"I'm leaving\" and I will run the scene, or write \"status\" to hear what is on. You can also just chat or ask me anything about NEXUS.");
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
    var parts = [T("Evinde " + all.length + " cihaz var.", "You have " + all.length + " device" + (all.length > 1 ? "s" : "") + " at home.")];
    parts.push(on.length ? T("Şu an açık olanlar: " + on.slice(0, 6).join(", ") + (on.length > 6 ? " ve diğerleri" : "") + ".", "Right now these are on: " + on.slice(0, 6).join(", ") + (on.length > 6 ? " and a few more" : "") + ".") : T("Şu an hiçbiri açık değil, ev sakin.", "Nothing is on right now, the house is quiet."));
    if (warn.length) parts.push(T("Dikkat etmen gerekenler: " + warn.slice(0, 4).join(", ") + ".", "These need your attention: " + warn.slice(0, 4).join(", ") + "."));
    return { reply: parts.join(" ") };
  }

  function noDevices() {
    return T("Henüz bir cihazın yok gibi görünüyor. Cihaz Ekle ekranından yerel ağındaki bir cihazı eklersen, hemen buradan yönetebiliriz.",
      "It looks like you do not have any devices yet. Add one from your local network on the Add Device screen and we can control it from here right away.");
  }

  // İngilizce oda adları → uygulamadaki (Türkçe) oda adları
  var ROOM_EN = [[/\bliving ?room|lounge\b/g, "salon"], [/\bkitchen\b/g, "mutfak"], [/\bbed ?room\b/g, "yatak odasi"], [/\bbath ?room\b/g, "banyo"],
    [/\b(entrance|entry|hallway|hall)\b/g, "giris koridor"], [/\bgarden|yard\b/g, "bahce"], [/\b(kids'? ?room|children'?s room|nursery)\b/g, "cocuk odasi"],
    [/\b(office|study)\b/g, "calisma odasi"], [/\bgarage\b/g, "garaj"], [/\bbalcony\b/g, "balkon"], [/\bdining room\b/g, "yemek odasi"]];
  function reply(raw) {
    EN = window.nexusLang === "en";
    LAST_LAN = [];
    var text = fold(raw);
    ROOM_EN.forEach(function (r) { text = text.replace(r[0], function (m) { return m + " " + r[1]; }); });
    var N = nx();
    var all = devices();

    if (!text) return { reply: help() };
    if (/\b(yardim|ne yapabilirsin|neler yapabilirsin|komutlar|help|what can you do|commands)\b/.test(text)) return { reply: help() };
    if (/\b(sen kimsin|kimsin|ismin ne|adin ne|who are you|what are you|your name)\b/.test(text)) {
      return { reply: T("Ben NEXUS AI, evinin asistanıyım. Işıklardan klimaya cihazlarını yönetir, senaryoları çalıştırır ve NEXUS hakkında sorularını yanıtlarım.",
        "I am NEXUS AI, your home's assistant. I control your devices from lights to the AC, run your scenes and answer questions about NEXUS.") };
    }

    // Tema
    if (/\b(karanlik tema|koyu tema|karanlik mod|koyu mod|dark mode|dark theme)\b/.test(text)) return { reply: V(["Tamamdır, koyu temaya geçtim.", "Koyu tema açıldı, gözlerin rahat etsin.", "Oldu, koyu tema devrede."], ["Done, dark theme is on.", "Switched to dark mode, easier on the eyes.", "Dark theme is on."]), action: "dark" };
    if (/\b(acik tema|aydinlik tema|acik mod|light mode|light theme)\b/.test(text)) return { reply: V(["Tamamdır, açık temaya geçtim.", "Açık tema devrede.", "Oldu, ortalık aydınlandı."], ["Done, light theme is on.", "Switched back to light mode.", "Light theme is on."]), action: "light" };
    // Rahatsız etme
    if (/\b(rahatsiz etme|do not disturb|dnd)\b/.test(text)) {
      if (OFF.test(text) && !/bildirimleri kapat/.test(text)) return { reply: V(["Rahatsız etme modunu kapattım, bildirimler yeniden gelecek.", "Tamam, bildirimler tekrar açık."], ["Do not disturb is off, notifications are back.", "Okay, notifications are on again."]), action: "dnd-off" };
      return { reply: V(["Rahatsız etme modunu açtım, bildirimleri sessize aldım.", "Tamam, seni rahatsız etmeyeceğim; bildirimler sessizde."], ["Do not disturb is on, I silenced your notifications.", "Okay, I will keep quiet; notifications are silenced."]), action: "dnd-on" };
    }
    // Durum ("hava durumu" karışmasın: o bir cihaz durumu değil, gerçek yapay zekâya gider)
    if (/\b(hava durumu|hava nasil|weather|forecast)\b/.test(text)) {
      return { reply: V(["Bunu tam çıkaramadım. ", "Hmm, bunu anlayamadım. ", "Tam anlayamadım ama yardımcı olmak isterim. "], ["I did not quite catch that. ", "Hmm, I am not sure what you mean. ", "I did not get that, but I would love to help. "]), unknown: true };
    }
    if (/\b(durum|durumu|ne acik|neler acik|hangi cihazlar acik|akilli kontrol|status|what is on|what'?s on|whats on|what is running|which devices are on|smart control)\b/.test(text)) return status(all);

    // Senaryo oluşturma (mevcut akış korunur)
    var wantsCreate = (/\b(olustur|kur|ekle|create|make|build|add)\b/.test(text) && /\b(senaryo|otomasyon|rutin|scenario|automation|routine|akilli uygulama|uygulama|smart app|app)\b/.test(text)) ||
      /\b(yeni bir akilli uygulama|yeni akilli uygulama|yeni otomasyon|yeni senaryo|create new automation|create new scenario)\b/.test(text);
    if (wantsCreate) return { reply: V(["İsteğine göre yeni bir senaryo hazırladım ve listene ekledim, bir göz atabilirsin.", "Senaryon hazır! Listene ekledim, istersen düzenleyebilirsin."], ["I built a new scenario from your request and added it to your list, have a look.", "Your scenario is ready! I added it to your list and you can edit it any time."]), action: "create" };

    if (!N) return { reply: help() };

    // Senaryo çalıştırma
    for (var s = 0; s < SCENE_WORDS.length; s++) {
      if (SCENE_WORDS[s][1].test(text)) {
        if (!all.length) return { reply: noDevices() };
        var id = SCENE_WORDS[s][0];
        var r = N.runScene(id);
        LAST_LAN = (r.lanDevices || []).slice();
        var nm = SCENE_NAMES[id][EN ? 1 : 0];
        if (!r.changed) return { reply: V([nm + " için ayarlanabilecek bir cihaz bulamadım.", nm + " senaryosu şu an hiçbir cihazını etkilemiyor."], ["I could not find a device to adjust for " + nm + ".", "The " + nm + " scene does not affect any of your devices right now."]) };
        return {
          reply: V(["Tamamdır, " + nm + " devrede; " + r.changed + " cihazı ayarladım.", nm + " senaryosunu çalıştırdım, " + r.changed + " cihaz hazır."], ["Done, " + nm + " is on; I adjusted " + r.changed + " device" + (r.changed > 1 ? "s" : "") + ".", "Ran " + nm + ", " + r.changed + " device" + (r.changed > 1 ? "s are" : " is") + " set."]) + lanNote(r),
          widget: widget("sparkles", nm, T(r.changed + " cihaz", r.changed + " device" + (r.changed > 1 ? "s" : "")))
        };
      }
    }

    // Cihaz gerektiren istekler cihaz ister; sohbet ve genel sorular cihazsız da akar
    // (bilinmeyen yoluna düşer, gerçek yapay zekâ yanıtlar).
    var wantsDevice = CATS.light.test(text) || CATS.plug.test(text) || CATS.climate.test(text) || CATS.media.test(text) ||
      CATS.cover.test(text) || CATS.lock.test(text) || CATS.vacuum.test(text) || CATS.purifier.test(text) ||
      ON.test(text) || OFF.test(text) || /\b(parlaklik|brightness|derece|degrees?)\b/.test(text);
    if (!all.length) {
      if (wantsDevice) return { reply: noDevices() };
      return { reply: V(["Bunu tam çıkaramadım. ", "Hmm, bunu anlayamadım. ", "Tam anlayamadım ama yardımcı olmak isterim. "], ["I did not quite catch that. ", "Hmm, I am not sure what you mean. ", "I did not get that, but I would love to help. "]), unknown: true };
    }

    var tg = targets(text, all);
    var pct = text.match(/(?:%|yuzde)\s*(\d{1,3})|(\d{1,3})\s*(?:%|percent|yuzde)/);
    var deg = text.match(/(\d{1,3}(?:[.,]5)?)\s*(derece|°f?|degrees?|deg|fahrenheit|c\b|f\b)/);

    // Kilit: yalnızca kilitleme
    if (/\b(kilidi ac|kilidini ac|unlock)\b/.test(text)) {
      return { reply: V(["Güvenliğin için kilidi buradan açmıyorum; kilidin kontrol ekranından açabilirsin.", "Kapı kilitlerini sohbetten açmam, güvenlik için. Kilidin kendi ekranından açabilirsin."], ["For your safety I do not unlock doors from chat; you can do it from the lock's own screen.", "I will not unlock doors from chat, it is a safety thing. Use the lock's control screen instead."]) };
    }
    if (/\b(kilitle|kapiyi kilitle|lock)\b/.test(text) && !/\bunlock\b/.test(text)) {
      var locks = all.map(function (d, i) { return { device: d, index: i }; }).filter(function (x) { return N.kindOf(x.device) === "lock"; });
      if (!locks.length) return { reply: V(["Henüz eşleştirdiğin bir akıllı kilit yok.", "Eşleşmiş bir akıllı kilit göremiyorum."], ["You have not paired a smart lock yet.", "I cannot see a paired smart lock."]) };
      var rl = apply(locks, "locked", true);
      return { reply: V([names(rl.changed) + " kilitlendi, içerisi güvende.", "Kilitledim: " + names(rl.changed) + "."], [names(rl.changed) + " locked, all secure.", "Locked: " + names(rl.changed) + "."]) + lanNote(rl), widget: widget("lock", T("Kilitlendi", "Locked"), names(rl.changed)) };
    }

    // Perde / panjur
    if (tg.cat === "cover" || (tg.by === "name" && tg.list.every(function (x) { return x.kind === "cover"; }))) {
      var covers = tg.list.filter(function (x) { return x.kind === "cover"; });
      if (!covers.length) return { reply: V(["Eşleşmiş bir perde ya da panjur göremiyorum.", "Henüz eşleştirdiğin perde ya da panjur yok."], ["I cannot see any paired curtains or blinds.", "You have not paired any curtains or blinds yet."]) };
      var open = /\b(ac|open|raise|up)\b/.test(text) && !OFF.test(text);
      if (pct) {
        var p = Math.max(0, Math.min(100, +(pct[1] || pct[2])));
        var rp = apply(covers, "position", p);
        return { reply: V([names(rp.changed) + " %" + p + " açıklığa getirildi.", "Tamam, " + names(rp.changed) + " %" + p + " konumunda."], [names(rp.changed) + " moved to " + p + "%.", "Okay, " + names(rp.changed) + " now at " + p + "%."]) + lanNote(rp) };
      }
      var rc = apply(covers, "coverAction", open ? "open" : "close");
      return { reply: V([names(rc.changed) + (open ? " açılıyor." : " kapanıyor."), "Tamam, " + names(rc.changed) + (open ? " açıldı." : " kapandı.")], [names(rc.changed) + (open ? " opening." : " closing."), "Okay, " + names(rc.changed) + (open ? " opened." : " closed.")]) + lanNote(rc) };
    }

    // Süpürge
    if (tg.cat === "vacuum" || (tg.by === "name" && tg.list.every(function (x) { return x.kind === "vacuum"; }))) {
      var vac = tg.list.filter(function (x) { return x.kind === "vacuum"; });
      if (!vac.length) return { reply: V(["Eşleşmiş bir robot süpürge göremiyorum.", "Henüz robot süpürge eşleştirmemişsin."], ["I cannot see a paired robot vacuum.", "You have not paired a robot vacuum yet."]) };
      var dock = /\b(sarj|sarja|sarjina|istasyon|istasyona|eve don|dock|return|stop|durdur)\b/.test(text);
      var rv = apply(vac, "mode", dock ? "docked" : "cleaning");
      return { reply: V([names(rv.changed) + (dock ? " şarj istasyonuna dönüyor." : " temizliğe başladı, merak etme."), (dock ? "Tamam, " : "Hemen, ") + names(rv.changed) + (dock ? " şarja gidiyor." : " işe koyuldu.")], [names(rv.changed) + (dock ? " is heading back to its dock." : " started cleaning, no worries."), (dock ? "Okay, " : "On it, ") + names(rv.changed) + (dock ? " is going to charge." : " is getting to work.")]) };
    }

    // Sıcaklık
    if (deg || (tg.cat === "climate" && /\b(sicaklik|derece|temperature|degrees)\b/.test(text))) {
      var cl = (tg.list.length ? tg.list : all.map(function (d, i) { return { device: d, index: i, kind: N.kindOf(d) }; }))
        .filter(function (x) { return (x.kind === "ac" || x.kind === "thermostat") && N.hasFeature(x.device, "target"); });
      if (!cl.length) return { reply: V(["Sıcaklığını ayarlayabileceğim bir klima ya da termostat bulamadım.", "Eşleşmiş bir klima ya da termostat göremiyorum."], ["I could not find an AC or thermostat I can set the temperature on.", "I cannot see a paired AC or thermostat."]) };
      if (!deg) return { reply: V(["Kaç dereceye ayarlayayım? Mesela \"klimayı 22 derece yap\" diyebilirsin.", "Hangi sıcaklığı istersin? Örneğin \"klimayı 22 derece yap\"."], ["What temperature would you like? For example \"set the AC to 22 degrees\".", "How warm should it be? Try \"set the AC to 22 degrees\"."]) };
      var t = parseFloat(String(deg[1]).replace(",", "."));
      if (/f/.test(deg[2]) || (N.tempUnit && N.tempUnit() === "F" && t > 40)) t = Math.round((t - 32) * 5 / 9 * 2) / 2; // °F → °C
      t = Math.max(5, Math.min(30, t));
      var rt = apply(cl, "target", t);
      cl.forEach(function (x) { if (x.kind === "ac" && N.hasCap(x.device, "switch")) N.setField(x.index, "switch", true); });
      var shown = N.fmtTemp ? N.fmtTemp(t) : t + "°";
      return { reply: V([names(rt.changed) + " artık " + shown + ".", "Tamam, " + names(rt.changed) + " " + shown + " olarak ayarlandı."], [names(rt.changed) + " is now at " + shown + ".", "Okay, " + names(rt.changed) + " set to " + shown + "."]) + lanNote(rt), widget: widget("thermometer", T("Hedef sıcaklık", "Target temperature"), shown) };
    }

    // Parlaklık
    if (pct && (tg.cat === "light" || tg.by === "name" || tg.by === "room" || /\b(parlaklik|brightness|dim)\b/.test(text))) {
      var lights = (tg.list.length ? tg.list : all.map(function (d, i) { return { device: d, index: i, kind: N.kindOf(d) }; }).filter(function (x) { return x.kind === "light"; }))
        .filter(function (x) { return N.hasCap(x.device, "brightness"); });
      if (!lights.length) return { reply: V(["Parlaklığını ayarlayabileceğim bir ışık bulamadım.", "Parlaklık ayarı olan eşleşmiş bir ışık göremiyorum."], ["I could not find a light with brightness control.", "I cannot see a paired light that supports dimming."]) };
      var b = Math.max(1, Math.min(100, +(pct[1] || pct[2])));
      var rb = apply(lights, "brightness", b);
      return { reply: V([names(rb.changed) + " parlaklığını %" + b + " yaptım.", "Tamam, " + names(rb.changed) + " şimdi %" + b + " parlaklıkta."], ["I set " + names(rb.changed) + " to " + b + "% brightness.", "Okay, " + names(rb.changed) + " is now at " + b + "%."]) + lanNote(rb), widget: widget("sun", T("Parlaklık", "Brightness"), "%" + b) };
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
      var isPlural = rs.changed.length > 1;
      var msg = V(
        [
          names(rs.changed) + (turnOn ? " açıldı." : " kapatıldı."),
          "Tamam, " + names(rs.changed) + (turnOn ? " açık." : " kapalı."),
          (turnOn ? "Açtım: " : "Kapattım: ") + names(rs.changed) + "."
        ],
        [
          names(rs.changed) + (turnOn ? (isPlural ? " are on." : " is on.") : (isPlural ? " are off." : " is off.")),
          "Okay, " + names(rs.changed) + (turnOn ? (isPlural ? " are on now." : " is on now.") : (isPlural ? " are off now." : " is off now.")),
          (turnOn ? "Turned on: " : "Turned off: ") + names(rs.changed) + "."
        ]
      );
      if (already.length === pool.length) msg = V([names(rs.changed) + " zaten " + (turnOn ? "açıktı" : "kapalıydı") + ", yine de komutu gönderdim.", "Bu zaten " + (turnOn ? "açıktı" : "kapalıydı") + " (" + names(rs.changed) + "); komutu yine de iletmiş oldum."], [names(rs.changed) + " " + (pool.length > 1 ? "were" : "was") + " already " + (turnOn ? "on" : "off") + ", I sent the command anyway.", "That was already " + (turnOn ? "on" : "off") + " (" + names(rs.changed) + "); I sent it again just in case."]);
      return { reply: msg + lanNote(rs), widget: widget(turnOn ? "power" : "power-off", turnOn ? T("Açıldı", "Turned on") : T("Kapatıldı", "Turned off"), T(rs.changed.length + " cihaz", rs.changed.length + " device" + (rs.changed.length > 1 ? "s" : ""))) };
    }

    return { reply: V(["Bunu tam çıkaramadım. ", "Hmm, bunu anlayamadım. ", "Tam anlayamadım ama yardımcı olmak isterim. "], ["I did not quite catch that. ", "Hmm, I am not sure what you mean. ", "I did not get that, but I would love to help. "]), unknown: true };
  }

    var AI_URL = "https://nexus-ai.nexus-smarthome.workers.dev";
  var hist = [];
  // Komut eşleşmediğinde gerçek yapay zekâya sor (cihaz adı/türü/odası bağlam olarak gider). Hata olursa null döner.
  function ask(raw) {
    if (window.nexusPreview) return Promise.resolve(null);
    var lang = (window.nexusLang === "tr" || (!window.nexusLang && /^tr/i.test(navigator.language || ""))) ? "tr" : "en";
    var devs = [];
    try { devs = devices().map(function (d) { return { name: String(d.name || ""), type: String(d.type || d.kind || ""), room: String(d.room || "") }; }); } catch (e) {}
    hist.push({ role: "user", content: String(raw).slice(0, 600) });
    hist = hist.slice(-8);
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    return fetch(AI_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: lang, messages: hist, devices: devs }), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { clearTimeout(timer); var t = j && j.reply ? String(j.reply).trim() : ""; if (t) { hist.push({ role: "assistant", content: t }); hist = hist.slice(-8); return t; } return null; })
      .catch(function () { clearTimeout(timer); return null; });
  }

  // Ses → metin: MediaRecorder kaydını Worker'daki Whisper'a gönderir. Kayıt cihazda
  // veya sunucuda saklanmaz; yalnızca dönen metin sohbet girdisine yazılır.
  // Tarayıcının kendi konuşma tanıması olmayan/başarısız olan cihazlarda kullanılır.
  function transcribe(blob, lang) {
    if (!blob || !blob.size) return Promise.resolve("");
    if (blob.size > 8 * 1024 * 1024) return Promise.reject(new Error("too_large"));
    var lng = lang === "tr" ? "tr" : "en";
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read_failed")); };
      reader.onload = function () {
        var raw = String(reader.result || "");
        var comma = raw.indexOf(",");
        var audio = comma >= 0 ? raw.slice(comma + 1) : raw;
        if (!audio) { reject(new Error("read_failed")); return; }
        var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
        fetch(AI_URL + "/stt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ audio: audio, lang: lng }),
          signal: ctrl ? ctrl.signal : undefined,
        })
          .then(function (r) {
            clearTimeout(timer);
            if (!r.ok) throw new Error("stt_" + r.status);
            return r.json();
          })
          .then(function (j) { resolve(j && j.text ? String(j.text).trim() : ""); })
          .catch(function (err) { clearTimeout(timer); reject(err); });
      };
      reader.readAsDataURL(blob);
    });
  }

  window.nexusAssistant = {
    reply: reply, help: help, fold: fold, ask: ask, transcribe: transcribe,
    lanPending: lanPending, lanSettled: lanSettled, lanFailureNote: lanFailureNote
  };
})();

