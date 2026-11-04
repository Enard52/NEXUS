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
  function nexusT(tr, en) {
    if (typeof window !== "undefined" && typeof window.nexusT === "function") {
      return window.nexusT(tr, en);
    }
    return (typeof window !== "undefined" && window.nexusLang === "en") ? en : tr;
  }
  var T = nexusT;
  function format(template, args) {
    return String(template || "").replace(/\{(\d+)\}/g, function (_, i) {
      return args[i] !== undefined ? args[i] : "{" + i + "}";
    });
  }
  // V: birden fazla doğal söyleyişten birini seçer (tekrar eden robot cümlesi olmasın).
  function V(trs, ens) {
    var en = typeof window !== "undefined" && window.nexusLang === "en";
    var a = en ? ens : trs;
    return a[Math.floor(Math.random() * a.length)];
  }

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
    return shown.join(", ") + (more > 0 ? format(nexusT(" ve {0} cihaz daha", " and {0} more"), [more]) : "");
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
    if (!r.lan) return "";
    return r.lan > 1
      ? format(nexusT(" {0} cihaza yerel ağdan komut gitti.", " A command was sent over your local network to {0} devices."), [r.lan])
      : nexusT(" 1 cihaza yerel ağdan komut gitti.", " A command was sent over your local network to 1 device.");
  }
  // Komut sonrası durum sorgusu (nexus-chat.html gecikmeli olarak çağırır).
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
      (bad.length > 3 ? format(nexusT(" ve {0} cihaz daha", " and {0} more"), [bad.length - 3]) : "");
    return format(
      nexusT("⚠ {0} için komut cihaza ulaşamadı — cihazın açık ve aynı Wi-Fi ağında olduğunu doğrula.",
        "⚠ The command did not reach {0} — make sure it is on and connected to the same Wi-Fi network."),
      [list]
    );
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
    var parts = [
      format(
        all.length > 1
          ? nexusT("Evinde {0} cihaz var.", "You have {0} devices at home.")
          : nexusT("Evinde {0} cihaz var.", "You have {0} device at home."),
        [all.length]
      )
    ];
    parts.push(
      on.length
        ? format(
            nexusT("Şu an açık olanlar: {0}.", "Right now these are on: {0}."),
            [on.slice(0, 6).join(", ") + (on.length > 6 ? nexusT(" ve diğerleri", " and a few more") : "")]
          )
        : nexusT("Şu an hiçbiri açık değil, ev sakin.", "Nothing is on right now, the house is quiet.")
    );
    if (warn.length) {
      parts.push(
        format(
          nexusT("Dikkat etmen gerekenler: {0}.", "These need your attention: {0}."),
          [warn.slice(0, 4).join(", ")]
        )
      );
    }
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
    // Senaryo/uygulama oluşturma isteği, "oluştur" cümlesindeki yan sözcüklere (komut, yardım, durum, rahatsız etme…) takılmasın.
    var CREATE_VERB = /\b(olustur\w*|kur|kurun|ekle|create|make|build|add)\b/;
    var CREATE_NOUN = /\b(senaryo\w*|otomasyon\w*|rutin\w*|akis\w*|panel\w*|sahne\w*|merkez\w*|uygulama\w*|scenario|automation|routine|scene|panel|smart app|app)\b/;
    var wantsCreate = (CREATE_VERB.test(text) && CREATE_NOUN.test(text)) || /\byapay zeka ile olustur/.test(text) ||
      /\b(yeni bir akilli uygulama|yeni akilli uygulama|yeni otomasyon|yeni senaryo|create new automation|create new scenario)\b/.test(text);
    if (wantsCreate) { var made = create(text, all); made.action = "create"; return made; }
    // SSS / destek: konuyu gerçekten yanıtlayan ekranı gösterir (genel komut listesi değil)
    if (/\b(sss|sikca sorulan|geri bildirim|sorun bildir|faq|feedback|destek ekib\w*|destek al\w*|destek istiyorum|musteri hizmetleri|customer support|contact support|contact us)\b/.test(text) || /\bsss ve destek\b/.test(text)) {
      return { reply: T("SSS ve Geri Bildirim ekranında sık sorulan soruların yanıtları ve geri bildirim formu var (Ayarlar'dan ya da Enerji ekranının altından ulaşabilirsin). Takıldığın konuyu buraya yazarsan bildiğim kadarıyla yardımcı olurum; çözemezsem formdan bize iletebilirsin.",
        "The FAQ and Feedback screen has answers to common questions and a feedback form. Tell me what you are stuck on and I will help as far as I can; if I cannot solve it, send it to us through the form.") };
    }
    // Genel yardım: yalnızca "yardım", "ne yapabilirsin", "komutlar", "hazır komutlar/öneriler" gibi çıplak istekler
    if (/^(bana )?(yardim( et)?( eder misin)?|help( me)?|komutlar|commands|ne yapabilirsin|neler yapabilirsin|what can you do)\??$/.test(text) ||
      /\b(ne yapabilirsin|neler yapabilirsin|what can you do)\b/.test(text) ||
      /\b(hazir komut\w*|ready commands)\b/.test(text)) return { reply: help() };
    if (/\b(sen kimsin|kimsin|ismin ne|adin ne|who are you|what are you|your name)\b/.test(text)) {
      return { reply: T("Ben NEXUS AI, evinin asistanıyım. Işıklardan klimaya cihazlarını yönetir, senaryoları çalıştırır ve NEXUS hakkında sorularını yanıtlarım.",
        "I am NEXUS AI, your home's assistant. I control your devices from lights to the AC, run your scenes and answer questions about NEXUS.") };
    }

    // Tema
    if (/\b(karanlik tema|koyu tema|karanlik mod|koyu mod|dark mode|dark theme)\b/.test(text)) return { reply: V(["Tamamdır, koyu temaya geçtim.", "Koyu tema açıldı, gözlerin rahat etsin.", "Oldu, koyu tema devrede."], ["Done, dark theme is on.", "Switched to dark mode, easier on the eyes.", "Dark theme is on."]), action: "dark" };
    if (/\b(acik tema|aydinlik tema|acik mod|light mode|light theme)\b/.test(text)) return { reply: V(["Tamamdır, açık temaya geçtim.", "Açık tema devrede.", "Oldu, ortalık aydınlandı."], ["Done, light theme is on.", "Switched back to light mode.", "Light theme is on."]), action: "light" };
    // Rahatsız etme
    if (/\b(rahatsiz etme\w*|do not disturb|dnd)\b/.test(text)) {
      if (OFF.test(text) && !/bildirimleri kapat/.test(text)) return { reply: V(["Rahatsız etme modunu kapattım, bildirimler yeniden gelecek.", "Tamam, bildirimler tekrar açık."], ["Do not disturb is off, notifications are back.", "Okay, notifications are on again."]), action: "dnd-off" };
      return { reply: V(["Rahatsız etme modunu açtım, bildirimleri sessize aldım.", "Tamam, seni rahatsız etmeyeceğim; bildirimler sessizde."], ["Do not disturb is on, I silenced your notifications.", "Okay, I will keep quiet; notifications are silenced."]), action: "dnd-on" };
    }
    // Durum ("hava durumu" karışmasın: o bir cihaz durumu değil, gerçek yapay zekâya gider)
    if (/\b(hava durumu|hava nasil|weather|forecast)\b/.test(text)) {
      return { reply: V(["Bunu tam çıkaramadım. ", "Hmm, bunu anlayamadım. ", "Tam anlayamadım ama yardımcı olmak isterim. "], ["I did not quite catch that. ", "Hmm, I am not sure what you mean. ", "I did not get that, but I would love to help. "]), unknown: true };
    }
    // Yalnızca çıplak "durum" (en çok 3 kelime) ya da açık cihaz durumu sorusu; "kargo durumu" gibi cümleler yapay zekâya gider.
    if ((text.split(" ").length <= 3 && /\b(durum|durumu|status|akilli kontrol|smart control)\b/.test(text) && !/\b(kargo|siparis|odeme|hesap|abonelik|order|payment|account|shipping)\b/.test(text)) ||
      /\b(ne acik|neler acik|hangi cihazlar acik|cihaz durumu|ev durumu|what is on|what'?s on|whats on|what is running|which devices are on|device status|home status)\b/.test(text)) return status(all);

    if (!N) return { reply: help() };

    // Bilgi / öneri soruları ("klimayı nasıl açarım", "bana film öner") komut değildir: cihaza dokunulmaz, yapay zekâya gider.
    if (/\b(nasil|neden|niye|nedir|ne demek|hangi|kimdir|oner\w*|tavsiye\w*|sence|why|how|what is|what are|which|who|recommend\w*|suggest\w*)\b/.test(text)) {
      return { reply: V(["Bunu tam çıkaramadım. ", "Hmm, bunu anlayamadım. "], ["I did not quite catch that. ", "Hmm, I am not sure what you mean. "]), unknown: true };
    }

    // Senaryo çalıştırma
    for (var s = 0; s < SCENE_WORDS.length; s++) {
      if (SCENE_WORDS[s][1].test(text)) {
        if (!all.length) return { reply: noDevices() };
        var id = SCENE_WORDS[s][0];
        var r = N.runScene(id);
        LAST_LAN = (r.lanDevices || []).slice();
        var nm = window.nexusT ? nexusT(SCENE_NAMES[id][0], SCENE_NAMES[id][1]) : SCENE_NAMES[id][(typeof window !== "undefined" && window.nexusLang === "en") ? 1 : 0];
        if (!r.changed) return { reply: V([nm + " için ayarlanabilecek bir cihaz bulamadım.", nm + " senaryosu şu an hiçbir cihazını etkilemiyor."], ["I could not find a device to adjust for " + nm + ".", "The " + nm + " scene does not affect any of your devices right now."]) };
        return {
          reply: V(["Tamamdır, " + nm + " devrede; " + r.changed + " cihazı ayarladım.", nm + " senaryosunu çalıştırdım, " + r.changed + " cihaz hazır."], ["Done, " + nm + " is on; I adjusted " + r.changed + " device" + (r.changed > 1 ? "s" : "") + ".", "Ran " + nm + ", " + r.changed + " device" + (r.changed > 1 ? "s are" : " is") + " set."]) + lanNote(r),
          widget: widget("sparkles", nm, format(r.changed > 1 ? nexusT("{0} cihaz", "{0} devices") : nexusT("{0} cihaz", "{0} device"), [r.changed]))
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
      if (!locks.length) return { reply: V(["Henüz eşleştirdiğin bir akıllı kilit cihazı yok.", "Eşleşmiş bir akıllı kilit cihazı göremiyorum."], ["You have not paired a smart lock yet.", "I cannot see a paired smart lock."]) };
      var rl = apply(locks, "locked", true);
      return { reply: V([names(rl.changed) + " kilitlendi, içerisi güvende.", "Kilitledim: " + names(rl.changed) + "."], [names(rl.changed) + " locked, all secure.", "Locked: " + names(rl.changed) + "."]) + lanNote(rl), widget: widget("lock", T("Kilitlendi", "Locked"), names(rl.changed)) };
    }

    // Perde / panjur
    if (tg.cat === "cover" || (tg.by === "name" && tg.list.every(function (x) { return x.kind === "cover"; }))) {
      var covers = tg.list.filter(function (x) { return x.kind === "cover"; });
      if (!covers.length) return { reply: V(["Eşleşmiş bir perde ya da panjur cihazı göremiyorum.", "Henüz eşleştirdiğin perde ya da panjur cihazı yok."], ["I cannot see any paired curtains or blinds.", "You have not paired any curtains or blinds yet."]) };
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
      if (!cl.length) return { reply: V(["Sıcaklığını ayarlayabileceğim eşleşmiş bir klima ya da termostat cihazı bulamadım.", "Eşleşmiş bir klima ya da termostat cihazı göremiyorum."], ["I could not find an AC or thermostat I can set the temperature on.", "I cannot see a paired AC or thermostat."]) };
      if (!deg) return { reply: V(["Kaç dereceye ayarlayayım? Mesela \"klimayı 22 derece yap\" diyebilirsin.", "Hangi sıcaklığı istersin? Örneğin \"klimayı 22 derece yap\"."], ["What temperature would you like? For example \"set the AC to 22 degrees\".", "How warm should it be? Try \"set the AC to 22 degrees\"."]) };
      var t = parseFloat(String(deg[1]).replace(",", "."));
      if (/f/.test(deg[2]) || (N.tempUnit && N.tempUnit() === "F" && t > 40)) t = Math.round((t - 32) * 5 / 9 * 2) / 2; // °F → °C
      t = Math.max(5, Math.min(30, t));
      var rt = apply(cl, "target", t);
      cl.forEach(function (x) { if (x.kind === "ac" && N.hasCap(x.device, "switch")) N.setField(x.index, "switch", true); });
      var shown = N.fmtTemp ? N.fmtTemp(t) : t + "°";
      return { reply: V([names(rt.changed) + " artık " + shown + ".", "Tamam, " + names(rt.changed) + " " + shown + " olarak ayarlandı."], [names(rt.changed) + " is now at " + shown + ".", "Okay, " + names(rt.changed) + " set to " + shown + "."]) + lanNote(rt), widget: widget("thermometer", nexusT("Hedef sıcaklık", "Target temperature"), shown) };
    }

    // Parlaklık
    if (pct && (tg.cat === "light" || tg.by === "name" || tg.by === "room" || /\b(parlaklik|brightness|dim)\b/.test(text))) {
      var lights = (tg.list.length ? tg.list : all.map(function (d, i) { return { device: d, index: i, kind: N.kindOf(d) }; }).filter(function (x) { return x.kind === "light"; }))
        .filter(function (x) { return N.hasCap(x.device, "brightness"); });
      if (!lights.length) return { reply: V(["Parlaklığını ayarlayabileceğim eşleşmiş bir ışık cihazı bulamadım.", "Parlaklık ayarı olan eşleşmiş bir ışık cihazı göremiyorum."], ["I could not find a light with brightness control.", "I cannot see a paired light that supports dimming."]) };
      var b = Math.max(1, Math.min(100, +(pct[1] || pct[2])));
      var rb = apply(lights, "brightness", b);
      return { reply: V([names(rb.changed) + " parlaklığını %" + b + " yaptım.", "Tamam, " + names(rb.changed) + " şimdi %" + b + " parlaklıkta."], ["I set " + names(rb.changed) + " to " + b + "% brightness.", "Okay, " + names(rb.changed) + " is now at " + b + "%."]) + lanNote(rb), widget: widget("sun", nexusT("Parlaklık", "Brightness"), "%" + b) };
    }

    // Aç / kapat
    var wantOn = ON.test(text), wantOff = OFF.test(text);
    if (wantOn || wantOff) {
      var turnOn = wantOn && !wantOff;
      if (tg.by === "none") {
        return {
          reply: format(
            turnOn
              ? nexusT(
                  "Hangi cihazı açayım? Cihazın adını, odasını ya da \"ışıklar\", \"prizler\" gibi bir türü yazabilirsin. Eşleşmiş cihazların: {0}.",
                  "Which device should I turn on? Use a device name, a room or a type like \"lights\" or \"plugs\". Your paired devices: {0}."
                )
              : nexusT(
                  "Hangi cihazı kapatayım? Cihazın adını, odasını ya da \"ışıklar\", \"prizler\" gibi bir türü yazabilirsin. Eşleşmiş cihazların: {0}.",
                  "Which device should I turn off? Use a device name, a room or a type like \"lights\" or \"plugs\". Your paired devices: {0}."
                ),
            [names(all.map(function (d) { return { device: d }; }), 4)]
          )
        };
      }
      var pool = tg.list.filter(powerable);
      if (tg.by === "all" && !turnOn) {
        // "Her şeyi kapat": prizler ve sürekli çalışması gereken cihazlar kapatılmaz
        pool = pool.filter(function (x) { return ["light", "media", "purifier", "ac"].indexOf(x.kind) !== -1; });
      }
      if (!pool.length) {
        var what = tg.cat
          ? {
              light: nexusT("ışık", "light"),
              plug: nexusT("priz", "plug"),
              climate: nexusT("klima/ısıtıcı", "AC or heater"),
              media: nexusT("TV/hoparlör", "TV or speaker"),
              purifier: nexusT("hava temizleyici", "air purifier")
            }[tg.cat] || nexusT("cihaz", "device")
          : nexusT("cihaz", "device");
        return {
          reply: format(
            nexusT(
              "Eşleşmiş cihazlar arasında açılıp kapatılabilen bir {0} cihazı bulunamadı{1}.",
              "No paired {0} that can be switched was found{1}."
            ),
            [what, tg.room ? " (" + tg.room + ")" : ""]
          )
        };
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
      return { reply: msg + lanNote(rs), widget: widget(turnOn ? "power" : "power-off", turnOn ? nexusT("Açıldı", "Turned on") : nexusT("Kapatıldı", "Turned off"), format(rs.changed.length > 1 ? nexusT("{0} cihaz", "{0} devices") : nexusT("{0} cihaz", "{0} device"), [rs.changed.length])) };
    }

    return { reply: V(["Bunu tam çıkaramadım. ", "Hmm, bunu anlayamadım. ", "Tam anlayamadım ama yardımcı olmak isterim. "], ["I did not quite catch that. ", "Hmm, I am not sure what you mean. ", "I did not get that, but I would love to help. "]), unknown: true };
  }

  // ---------- Sohbetten oluşturma: GERÇEK, çalışan bir senaryo / otomasyon kaydı ----------
  // Kayıt yalnızca eşleşmiş cihazlarda gerçekten uygulanabilen bir hazır senaryo (sceneId) ya da cihaz adımları (actions)
  // bulunduğunda, otomasyonda ayrıca gerçek bir zaman tetikleyicisi olduğunda yapılır. Biri eksikse HİÇBİR ŞEY kaydedilmez,
  // kullanıcıya neyin eksik olduğu söylenir. Yazma, Akıllı ekranının kullandığı nexusQuickScenes.save ile yapılır
  // (otomasyon motoru sceneId'yi ya da {name, field, value} adımlarını çalıştırır).
  // Oluşturma isteklerinde ek ipuçları: yalnızca NX.SCENES'te gerçekten bulunan senaryolara eşlenir.
  var CREATE_HINTS = [
    ["movie-mode", /\b(sinema\w*|film\w*|movie|cinema)\b/],
    ["guest-mode", /\b(misafir\w*|guests?)\b/],
    ["good-morning", /\b(gunaydin\w*|uyanma\w*|sabah rutin\w*|wake ?up|morning routine)\b/],
    ["welcome-home", /\b(eve geldi\w*|karsilama\w*|welcome)\b/],
    ["leave-home", /\b(evden cik\w*|cikis kontrol\w*|leaving)\b/],
    ["sleep-prep", /\b(uykuya hazirlik\w*|yatmadan|bedtime)\b/],
    ["sleep-mode", /\b(uyku\w*|iyi geceler|good night|sleep)\b/],
    ["clean-start", /\b(temizlik\w*|supurge\w*|cleaning|vacuum)\b/],
    ["comfort-room", /\b(iklim\w*|konfor\w*|climate|comfort)\b/]
  ];
  var REPEAT_NAMES = { daily: ["Her gün", "Every day"], weekdays: ["Hafta içi", "Weekdays"], weekends: ["Hafta sonu", "Weekends"] };
  // Sohbetten kurulamayan tetikleyiciler (sensör, cihaz durumu, konum, hava): Akıllı Senaryolar ekranına yönlendirilir.
  var OTHER_TRIGGER = /\b(gelince|geldigimde|girince|ciktigimda|cikinca|ayrilinca|algilayinca|algiladiginda|acilinca|acildiginda|kapaninca|kapandiginda|hareket|sensor\w*|yagmur yagin\w*|sicaklik \w+ (ustune|altina)|when i (arrive|leave|get home)|when motion|when (it|the \w+) (opens|closes|rains))\b/;

  function createType(text) {
    if (mode === "automation") return "automation";
    if (mode === "scenario") return "clickrun";
    if (/\b(otomasyon\w*|automation|her (gun|gece|sabah|aksam)|every (day|night|morning|evening)|hafta (ici|sonu)|weekdays?|weekends?|saat \d|\d{1,2}[:.]\d{2})\b/.test(text)) return "automation";
    return window.__nexusAiCreateType === "automation" ? "automation" : "clickrun";
  }

  // Metinden gerçek zaman tetikleyicisi: "23:00", "saat 7", "7'de", "8 pm", "gün batımında", "her sabah"…
  function parseTime(text) {
    var repeat = /\b(hafta ici|weekdays?)\b/.test(text) ? "weekdays" : /\b(hafta sonu|weekends?)\b/.test(text) ? "weekends" : "daily";
    if (/\b(gun ?batimi\w*|aksam ustu|sunset)\b/.test(text)) return { value: "sunset", repeat: repeat };
    if (/\b(gun ?dogumu\w*|sunrise)\b/.test(text)) return { value: "sunrise", repeat: repeat };
    var h = null, min = 0, m;
    if ((m = text.match(/\b(\d{1,2})[:.](\d{2})\b/))) { h = +m[1]; min = +m[2]; }
    else if ((m = text.match(/\b(\d{1,2}) ?(am|pm)\b/))) { h = +m[1] % 12 + (m[2] === "pm" ? 12 : 0); }
    else if ((m = text.match(/\bsaat (\d{1,2})\b|\b(\d{1,2}) ?'?(?:de|da|te|ta)\b|\bat (\d{1,2})\b/))) { h = +(m[1] || m[2] || m[3]); }
    if (h !== null) {
      // "akşam 8" → 20:00; "gece 11" → 23:00 ama "gece 1" → 01:00
      if (/\b(aksam|evening|tonight)\b/.test(text) && h >= 1 && h < 12) h += 12;
      else if (/\b(gece|night)\b/.test(text) && h >= 6 && h < 12) h += 12;
    } else if (/\b(sabah|morning)\b/.test(text)) h = 7;
    else if (/\b(ogle\w*|noon)\b/.test(text)) h = 12;
    else if (/\b(aksam|evening)\b/.test(text)) h = 19;
    else if (/\b(gece|night|tonight)\b/.test(text)) h = 23;
    if (h === null || h > 23 || min > 59) return null;
    return { value: (h < 10 ? "0" : "") + h + ":" + (min < 10 ? "0" : "") + min, repeat: repeat };
  }
  function timeLabel(t) {
    var base = t.value === "sunset" ? T("gün batımı", "sunset") : t.value === "sunrise" ? T("gün doğumu", "sunrise") : t.value;
    return REPEAT_NAMES[t.repeat][EN ? 1 : 0] + " " + base;
  }

  // Metindeki cihaz isteğini otomasyon motorunun çalıştırabileceği adımlara çevirir (cihaza o an dokunmaz).
  function deviceSteps(text, all) {
    var N = nx();
    var tg = targets(text, all);
    if (!tg.list.length) return null;
    var pct = text.match(/(?:%|yuzde)\s*(\d{1,3})|(\d{1,3})\s*(?:%|percent|yuzde)/);
    var deg = text.match(/(\d{1,2}(?:[.,]5)?)\s*(derece|°|degrees?)/);
    // Oluşturma cümlelerinde fiil çekimli gelir: "ışıkları kapatan / kapansın", "perdeleri açan / açılsın"
    var offWord = OFF.test(text) || /\b(kapa(tan|tsin|nsin|nacak|tir)|sondur\w*)\b/.test(text);
    var onWord = ON.test(text) || /\b(acan|acsin|acilsin|acilacak|yakan|yaksin)\b/.test(text);
    // "aç/kapat kontrolleri olsun" gibi iki yönlü istek tek bir adıma çevrilmez (yanlışlıkla "kapat" kaydedilmesin)
    if (onWord && offWord && !/\b(her sey|herseyi|her seyi|everything)\b/.test(text)) return null;
    var turnOff = offWord, turnOn = onWord && !offWord;
    var pick = function (fn, field, value) {
      return tg.list.filter(fn).map(function (x) { return { name: x.device.name, field: field, value: value }; });
    };
    var steps = [];
    if (/\b(kilitle|lock)\b/.test(text) && !/\b(kilidi ac|unlock)\b/.test(text)) steps = pick(function (x) { return x.kind === "lock"; }, "locked", true);
    else if (tg.cat === "cover" || tg.list.every(function (x) { return x.kind === "cover"; })) steps = pick(function (x) { return x.kind === "cover"; }, "coverAction", turnOff ? "close" : "open");
    else if (tg.cat === "vacuum") steps = pick(function (x) { return x.kind === "vacuum"; }, "mode", /\b(sarj|dock|durdur|stop)\b/.test(text) ? "docked" : "cleaning");
    else if (deg) steps = pick(function (x) { return (x.kind === "ac" || x.kind === "thermostat") && N.hasFeature(x.device, "target"); }, "target", Math.max(5, Math.min(30, parseFloat(deg[1].replace(",", ".")))));
    else if (pct) steps = pick(function (x) { return N.hasCap(x.device, "brightness"); }, "brightness", Math.max(1, Math.min(100, +(pct[1] || pct[2]))));
    else if (turnOn || turnOff) {
      steps = pick(function (x) {
        if (!powerable(x)) return false;
        // "Her şeyi kapat": prizler ve sürekli çalışması gereken cihazlar kapatılmaz (sohbet komutuyla aynı kural)
        return !(tg.by === "all" && turnOff) || ["light", "media", "purifier", "ac"].indexOf(x.kind) !== -1;
      }, "switch", turnOn);
    }
    return steps.length ? steps : null;
  }
  function stepsTitle(steps) {
    var s = steps[0], who = names(steps.map(function (x) { return { device: { name: x.name } }; }), 2);
    if (s.field === "switch") return who + (s.value ? T(" açılsın", " on") : T(" kapansın", " off"));
    if (s.field === "brightness") return who + " %" + s.value;
    if (s.field === "target") return who + " " + s.value + "°";
    if (s.field === "locked") return who + T(" kilitlensin", " locked");
    if (s.field === "coverAction") return who + (s.value === "open" ? T(" açılsın", " open") : T(" kapansın", " closed"));
    return who + (s.value === "docked" ? T(" şarja dönsün", " docks") : T(" temizlesin", " cleans"));
  }

  function createdWidget(icon, title, sub, type) {
    var e = nx() ? nx().escapeHtml : function (s) { return s; };
    var tab = type === "automation" ? "tab-automation" : "tab-clickrun";
    return '<div class="mt-3 bg-[#F1F7FF] dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-xl p-3 flex items-center justify-between gap-3" data-no-i18n>' +
      '<div class="flex items-center gap-3 min-w-0"><div class="p-2 bg-white dark:bg-slate-800 rounded-lg text-[#4C7DFF]"><i data-lucide="' + e(icon) + '" class="w-5 h-5"></i></div>' +
      '<div class="min-w-0"><p class="text-sm font-semibold text-gray-800 dark:text-white truncate">' + e(title) + '</p><p class="text-xs text-gray-500 dark:text-slate-400 truncate">' + e(sub) + "</p></div></div>" +
      '<a href="nexus-smart.html?tab=' + tab + '" class="shrink-0 text-xs font-bold text-[#4C7DFF] bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-slate-600">' + T("Görüntüle", "View") + "</a></div>";
  }

  function create(text, all) {
    text = text.replace(/^yapay zeka ile olustur:?\s*/, "");
    var type = createType(text);
    var QS = window.nexusQuickScenes, N = nx();
    if (!all.length) return { reply: T("Senaryo kurmak için önce bir cihaz eklemen gerekiyor; cihaz olmadan çalışacak bir şey kaydetmem. Cihaz Ekle ekranından başlayabilirsin.", "To build a scene you first need a device; I will not save something that cannot run. Start from the Add Device screen.") };
    if (!QS || !QS.save || !N) return { reply: T("Senaryo şu an kaydedilemedi. Akıllı ekranından oluşturabilirsin.", "The scene could not be saved right now. You can create it from the Smart screen.") };
    if (type === "automation" && OTHER_TRIGGER.test(text)) {
      return { reply: T("Sensör, cihaz durumu, konum ya da hava tetikleyicisini sohbetten kuramıyorum; bunlar Akıllı Senaryolar ekranında (Akıllı › Otomasyon › Yeni Otomasyon) seçiliyor. Sohbetten saatli otomasyon kurabilirim, örneğin \"her gece 23:00'te ışıkları kapat\".",
        "I cannot set up sensor, device-state, location or weather triggers from chat; you pick those on the Smart Scenarios screen (Smart › Automations › New Automation). From chat I can set up timed automations, e.g. \"turn off the lights every night at 23:00\".") };
    }
    // 1) Hazır senaryo (yalnızca eşleşmiş cihazlarda gerçekten bir şey değiştiriyorsa)
    var sceneId = null, byHint = false;
    for (var s = 0; s < SCENE_WORDS.length; s++) if (SCENE_WORDS[s][1].test(text)) { sceneId = SCENE_WORDS[s][0]; break; }
    if (!sceneId) for (var c = 0; c < CREATE_HINTS.length; c++) if (CREATE_HINTS[c][1].test(text)) { sceneId = CREATE_HINTS[c][0]; byHint = true; break; }
    var scene = sceneId ? QS.available().filter(function (x) { return x.id === sceneId; })[0] : null;
    // Senaryo adı açıkça söylendiyse ve cihazlarda bir şey değiştirmiyorsa söylenir; yalnızca ipucuyla eşleştiyse cihaz adımlarına bakılır.
    if (sceneId && !scene && !byHint) {
      var nm0 = SCENE_NAMES[sceneId] ? (window.nexusT ? nexusT(SCENE_NAMES[sceneId][0], SCENE_NAMES[sceneId][1]) : SCENE_NAMES[sceneId][0]) : (N.SCENES && N.SCENES[sceneId] ? N.SCENES[sceneId].title : sceneId);
      return {
        reply: format(
          nexusT(
            "{0} senaryosu eşleşmiş cihazlarında hiçbir şeyi değiştirmiyor, bu yüzden kaydetmedim. Uygun bir cihaz ekleyince tekrar dene.",
            "The {0} scene does not change any of your paired devices, so I did not save it. Try again after adding a suitable device."
          ),
          [nm0]
        )
      };
    }
    // 2) Yoksa cihaz adımları ("salon ışığını kapat", "klimayı 22 derece yap")
    var steps = scene ? null : deviceSteps(text, all);
    if (!scene && !steps && /\b(panel\w*|merkez\w*|ekran\w*|dashboard|hub|uygulama\w*|app)\b/.test(text)) {
      return { reply: T("Ayrı bir panel ya da uygulama ekranı kuramıyorum, bu yüzden bir şey kaydetmedim; cihazlarını Ana ekrandaki kartlardan ve Akıllı ekranından yönetirsin. Sohbetten tek dokunuşla çalışan bir senaryo ya da saatli otomasyon kurabilirim, örneğin \"film modu\", \"salon ışıklarını %40 yap\" ya da \"her gece 23:00'te ışıkları kapat\".",
        "I cannot build a separate panel or app screen, so I did not save anything; you manage your devices from the Home cards and the Smart screen. From chat I can set up a one-tap scene or a timed automation, e.g. \"movie mode\", \"set the living room lights to 40%\" or \"turn off the lights every night at 23:00\".") };
    }
    if (!scene && !steps) {
      return { reply: T("Bu istekten eşleşmiş cihazlarına uygulanabilecek bir adım çıkaramadım, bu yüzden bir şey kaydetmedim. Örneğin \"film modu\", \"salon ışıklarını kapat\" ya da \"her sabah 7'de perdeleri aç\" diyebilirsin.",
        "I could not turn this into a step your paired devices can run, so I did not save anything. Try e.g. \"movie mode\", \"turn off the living room lights\" or \"open the curtains every morning at 7\".") };
    }
    // 3) Otomasyonda gerçek zaman tetikleyicisi (yoksa senaryonun önerilen saati; o da yoksa sorulur)
    var trigger = { type: "manual" };
    if (type === "automation") {
      var t = parseTime(text);
      var meta = scene && QS.metaFor ? QS.metaFor(scene.id) : null;
      if (!t && meta && meta.time) t = { value: meta.time.value, repeat: meta.time.repeat };
      if (!t) return { reply: T("Ne zaman çalışsın? Saatini de yaz, örneğin \"her gece 23:00'te\", \"hafta içi sabah 7'de\" ya da \"gün batımında\".", "When should it run? Add a time, e.g. \"every night at 23:00\", \"weekdays at 7 am\" or \"at sunset\".") };
      trigger = { type: "time", value: t.value, repeat: t.repeat };
    }
    var title = scene ? scene.title : stepsTitle(steps);
    var what = scene ? QS.descFor(scene.id) : steps.map(function (x) { return x.name + " " + (QS.describeAct ? QS.describeAct([x.field, x.value]) : ""); }).join(", ") + ".";
    var when = type === "automation" ? timeLabel(trigger) : "";
    QS.save(type, scene ? scene.id : null, {
      title: title,
      desc: (when ? when + " · " : "") + what,
      trigger: trigger,
      actions: steps || [],
      icon: scene ? undefined : (steps[0].field === "switch" ? "power" : "sliders-horizontal")
    });
    var count = scene ? scene.affected : steps.length;
    var listName = type === "automation" ? T("Otomasyonlar", "Automations") : T("Tıkla ve Çalıştır", "Tap to Run");
    return {
      reply: type === "automation"
        ? format(
            count > 1
              ? nexusT(
                  "\"{0}\" otomasyonunu kurdum: {1} çalışacak ve {2} cihazı ayarlayacak. Otomasyonlar uygulama açıkken (masaüstünde tepsideyken de) çalışır.",
                  "I set up the \"{0}\" automation: it runs {1} and adjusts {2} devices. Automations run while the app is open (also from the tray on desktop)."
                )
              : nexusT(
                  "\"{0}\" otomasyonunu kurdum: {1} çalışacak ve {2} cihazı ayarlayacak. Otomasyonlar uygulama açıkken (masaüstünde tepsideyken de) çalışır.",
                  "I set up the \"{0}\" automation: it runs {1} and adjusts {2} device. Automations run while the app is open (also from the tray on desktop)."
                ),
            [title, when.toLocaleLowerCase("tr-TR"), count]
          )
        : format(
            count > 1
              ? nexusT(
                  "\"{0}\" senaryosunu Tıkla ve Çalıştır listene ekledim; dokununca {1} cihazı ayarlar.",
                  "I added \"{0}\" to Tap to Run; one tap adjusts {1} devices."
                )
              : nexusT(
                  "\"{0}\" senaryosunu Tıkla ve Çalıştır listene ekledim; dokununca {1} cihazı ayarlar.",
                  "I added \"{0}\" to Tap to Run; one tap adjusts {1} device."
                ),
            [title, count]
          ),
      widget: createdWidget(scene ? (QS.metaFor(scene.id) || {}).icon || "sparkles" : "zap", title, listName + (when ? " · " + when : ""), type),
      created: type
    };
  }

    var AI_URL = "https://nexus-ai.nexus-smarthome.workers.dev";
  var hist = [];
  // Topluluk dili seçiliyse yapay zekâ o dilde yanıtlar (taban dil İngilizce kalır; yalnızca yanıt dili değişir).
  function replyLangName() {
    var ui = window.nexusUiLang, reg = window.NEXUS_COMMUNITY_LANGS || {};
    return ui && ui !== "tr" && ui !== "en" && reg[ui] ? (reg[ui].en || reg[ui].name) : "English";
  }
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
    // Sistem talimatı geçmişe yazılmaz; her istekte taze gönderilir. Dil karışması ve
    // eski/başka site adresleri için modeli baştan bağlar.
    var sysMsg = { role: "system", content: T(
      "Yanıtlarını her koşulda yalnızca Türkçe yaz; kullanıcı başka dilde yazsa bile Türkçe sürer. " +
      "NEXUS web sitesi yalnızca şudur: https://nexus-smarthome.pages.dev — bağlantı verirsen yalnızca bu adresi kullan, başka adres uydurma. " +
      "Cihaz türlerinden bahsederken 'ışık cihazı', 'priz cihazı' gibi 'cihazı' ekini kullan; tek bir cihazın yok olmuş gibi konuşma.",
      "Always reply in " + replyLangName() + " only, even if the user writes in another language. " +
      "The NEXUS website is exactly: https://nexus-smarthome.pages.dev — if you share a link, use only this URL; never invent another. " +
      "When referring to device types, use the 'device' noun (e.g. 'light device'); never speak as if a kind of device ceased to exist."
    ) };
    var targetLang = replyLangName();
    return fetch(AI_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: lang, targetLang: targetLang, messages: [sysMsg].concat(hist), devices: devs }), signal: ctrl ? ctrl.signal : undefined })
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
    var lng =
      typeof lang === "string" && lang
        ? lang
        : (typeof window !== "undefined" && (window.nexusUiLang || window.nexusLang)) || "en";
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

  // Asistan modları: her mod mesajın nasıl işleneceğini gerçekten değiştirir (süs değil).
  //  chat       : her şeyi sorar (yerel komut, bilinmezse yapay zekâ sohbeti)
  //  device     : yalnız cihaz/durum komutları; anlaşılmazsa yapay zekâya (krediye) gitmez, örnek komut önerir
  //  scenario   : mesajı "Tıkla ve çalıştır" senaryosu oluşturma isteği olarak işler
  //  automation : mesajı otomasyon oluşturma isteği olarak işler
  var MODES = [
    { id: "chat", tr: "Sohbet", en: "Chat", hintTr: "Nasıl yardımcı olabilirim?", hintEn: "How can I help you?" },
    { id: "device", tr: "Cihaz kontrolü", en: "Device control", hintTr: "Örn. salon ışığını kapat", hintEn: "e.g. turn off the living room light" },
    { id: "scenario", tr: "Senaryo oluştur", en: "Create scenario", hintTr: "Tek dokunuşla ne olsun? Örn. film modu", hintEn: "What should one tap do? e.g. movie mode" },
    { id: "automation", tr: "Otomasyon oluştur", en: "Create automation", hintTr: "Ne zaman ne olsun? Örn. her gece ışıkları kapat", hintEn: "When should what happen? e.g. lights off every night" }
  ];
  var mode = "chat";
  function modeInfo(id) { return MODES.filter(function (m) { return m.id === id; })[0] || MODES[0]; }
  var modes = {
    list: function () {
      return MODES.map(function (m) {
        return {
          id: m.id,
          label: window.nexusT ? nexusT(m.tr, m.en) : ((typeof window !== "undefined" && window.nexusLang === "en") ? m.en : m.tr),
          hint: window.nexusT ? nexusT(m.hintTr, m.hintEn) : ((typeof window !== "undefined" && window.nexusLang === "en") ? m.hintEn : m.hintTr)
        };
      });
    },
    get: function () { return mode; },
    set: function (id) {
      mode = modeInfo(id).id;
      window.__nexusAiCreateType = mode === "automation" ? "automation" : "clickrun";
      return mode;
    },
    hint: function () {
      var m = modeInfo(mode);
      return window.nexusT ? nexusT(m.hintTr, m.hintEn) : ((typeof window !== "undefined" && window.nexusLang === "en") ? m.hintEn : m.hintTr);
    },
    // Motora giden metin: oluşturma modlarında istek "oluştur" niyetiyle işaretlenir (kullanıcıya gösterilen metin değişmez).
    query: function (text) { return mode === "scenario" || mode === "automation" ? "yapay zeka ile olustur: " + text : text; },
    // Cihaz modunda anlaşılmayan mesaj yapay zekâya gitmez.
    local: function () { return mode === "device"; },
    notUnderstood: function () {
      return window.nexusT
        ? nexusT("Bu bir cihaz komutu gibi anlaşılmadı. Örneğin: \"salon ışığını kapat\" ya da \"klimayı 22 yap\".", "That does not look like a device command. Try: \"turn off the living room light\" or \"set the AC to 22\".")
        : ((typeof window !== "undefined" && window.nexusLang === "en")
          ? "That does not look like a device command. Try: \"turn off the living room light\" or \"set the AC to 22\"."
          : "Bu bir cihaz komutu gibi anlaşılmadı. Örneğin: \"salon ışığını kapat\" ya da \"klimayı 22 yap\".");
    }
  };

  window.nexusAssistant = {
    reply: reply, help: help, fold: fold, ask: ask, transcribe: transcribe,
    lanPending: lanPending, lanSettled: lanSettled, lanFailureNote: lanFailureNote,
    modes: modes
  };
})();

