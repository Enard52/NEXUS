/**
 * NEXUS — ses / titreşim / hareket geri bildirim merkezi (tüm platformlar).
 *
 * Tasarım ilkeleri:
 *  • Sesler WebAudio ile ANLIK ÜRETİLİR: ses dosyası yok, indirme yok, lisans yok.
 *    Hepsi kısık (kazanç ≤ 0.05), kısa (≤ 0.4 sn) ve markanın sakin tonunda.
 *  • Her tıklamada ses ÇIKMAZ — yalnızca sonuç sesleri: cihaz aç/kapat, senaryo,
 *    başarı/hata, yeni bildirim, kopyalama. Dokunma geri bildirimi titreşimle.
 *    Bunun istisnası nav(): düğmeye/gezinmeye "tap" tıklaması (çok kısık, 0.02
 *    kazanç). Ayarlar → "Dokunma Sesleri" (nexusTapSoundsEnabled) ile kapatılır
 *    ve aynı jestte bir sonuç sesi çalarsa iptal olur (çift ses yok).
 *  • Üç anahtar Ayarlar → "Ses ve Hareket"ten yönetilir ve varsayılanı AÇIKTIR:
 *      nexusSoundEnabled       (mevcut anahtar; Ayarlar'daki "Ses" satırı zaten yazar)
 *      nexusHapticsEnabled     (titreşim)
 *      nexusAnimationsEnabled  (hareketli efektler; html.nx-no-anim ile uygulanır)
 *    anahtarlar kullanıcı önekli saklanır (hesap başına ayrı) ve her oynatmada
 *    taze okunur — sayfalar arası eşitleme gerektirmez.
 *  • İşletim sistemi "hareketi azalt" istiyorsa animasyonlar anahtar ne derse
 *    desin kapanır (css/nexus-ui.css içindeki ortak kural).
 *
 * Kullanım: nexusFeedback.play('scene') · nexusFeedback.power(true, kartElemanı)
 *           nexusFeedback.pulse(el) · nexusFeedback.toastIn(toastElemanı)
 *           nexusFeedback.announce("Salon lambası kapatıldı") · nexusAnnounce(aynı şey)
 *
 * Dördüncü görev (ses/titreşim/harekete ek): EKRAN OKUYUCU DUYURULARI. Uygulamanın
 * durum değişimleri görsel şeritlerle söyleniyor ama hiçbir yerde okunur değildi;
 * tek merkezdeki iki aria-live bölgesi hem doğrudan çağrıları hem de ortak şeritleri
 * ve çevrimdışı/çevrimiçi geçişlerini duyurur.
 */
(function () {
  "use strict";

  if (window.nexusFeedback) return;

  var KEYS = {
    sound: "nexusSoundEnabled",
    taps: "nexusTapSoundsEnabled",
    haptics: "nexusHapticsEnabled",
    motion: "nexusAnimationsEnabled",
  };

  function flag(name) {
    try {
      var v = window.nexusGetItem
        ? window.nexusGetItem(KEYS[name])
        : localStorage.getItem(KEYS[name]);
      return v !== "false"; // anahtar hiç yazılmadıysa açık varsayılır
    } catch (e) {
      return true;
    }
  }

  function motionAllowed() {
    if (!flag("motion")) return false;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    } catch (e) { /* matchMedia yoksa animasyon serbest */ }
    return true;
  }

  // ---------- Ses motoru ----------
  var ctx = null;
  function audio() {
    if (!flag("sound")) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      if (!ctx) ctx = new AC();
      if (ctx.state === "suspended" && ctx.resume) ctx.resume(); // iOS/others ilk jest sonrası
      return ctx;
    } catch (e) {
      return null;
    }
  }

  // Tek nota: { f0: başlangıç Hz, f1: varış Hz (opsiyonel kayma), t0: sn cinsinden gecikme,
  //             dur: sn, type: osc türü, gain: tepe ses düzeyi }
  function tone(c, o) {
    var osc = c.createOscillator();
    var g = c.createGain();
    var t = c.currentTime + (o.t0 || 0);
    var dur = o.dur || 0.1;
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.045, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  // Ses paleti — hepsi marka tonunda, yumuşak sinüs; "hata" bilinçli olarak boğuk.
  var SOUNDS = {
    "tap": [{ f0: 520, f1: 380, dur: 0.05, gain: 0.02 }],
    "toggle-on": [{ f0: 620, f1: 880, dur: 0.1, gain: 0.04 }],
    "toggle-off": [{ f0: 620, f1: 430, dur: 0.1, gain: 0.038 }],
    "scene": [
      { f0: 523, dur: 0.09, gain: 0.038 },
      { f0: 659, t0: 0.07, dur: 0.09, gain: 0.038 },
      { f0: 784, t0: 0.14, dur: 0.18, gain: 0.042 },
    ],
    "success": [{ f0: 523, f1: 784, dur: 0.16, gain: 0.042 }],
    "error": [{ f0: 200, f1: 150, dur: 0.2, type: "triangle", gain: 0.05 }],
    "notify": [
      { f0: 880, dur: 0.1, gain: 0.038 },
      { f0: 1174, t0: 0.09, dur: 0.2, gain: 0.034 },
    ],
    "copy": [{ f0: 980, f1: 1240, dur: 0.05, gain: 0.032 }],
    "pull": [{ f0: 440, f1: 660, dur: 0.08, gain: 0.032 }],
  };

  // Bildirim sesi seçenekleri (soft = varsayılan "notify" paleti).
  var CHIMES = {
    soft: SOUNDS.notify,
    bell: [
      { f0: 1319, dur: 0.35, gain: 0.032 },
      { f0: 1976, t0: 0.02, dur: 0.3, gain: 0.018 },
    ],
    drop: [{ f0: 1100, f1: 520, dur: 0.14, gain: 0.04 }],
  };

  // Sonuç sesi hoparlöre girmeden önce bekleyen tap'i iptal et: cihaz
  // anahtarı çevrilirken "tık + bip" yerine tek anlamlı ses duyulmalı.
  var pendingTap = null;
  var lastTapAt = 0;

  function play(name) {
    if (pendingTap) {
      clearTimeout(pendingTap);
      pendingTap = null;
      lastTapAt = 0; // sonuç sesi tap'ın yerini aldı; yeniden tap hemen serbest
    }
    var spec = SOUNDS[name];
    if (name === "notify") {
      // Uygulama içi bildirim sesi seçimi (Ayarlar → Bildirim Sesi). Sistem bildirim sesi işletim sistemine aittir.
      var pick = "soft";
      try { pick = (window.nexusGetItem ? window.nexusGetItem("nexusChime") : localStorage.getItem("nexusChime")) || "soft"; } catch (e) {}
      spec = CHIMES[pick] || spec;
    }
    if (!spec) return;
    var c = audio();
    if (!c) return;
    for (var i = 0; i < spec.length; i++) {
      try { tone(c, spec[i]); } catch (e) { /* ses asla akışı bozmasın */ }
    }
  }

  // ---------- Dokunma / gezinme sesi ----------
  // theme.js'in global click yakalayıcısından çağrılır. Tonu anında değil
  // ~70 ms sonra çalarız: aynı jestte bir sonuç sesi (cihaz aç/kapat, sahne,
  // kopyala...) çalarsa tap iptal olur — tek ses, biri diğerini ezmez.
  // 70 ms algısal olarak "anında"dir (kazanç 0.02 → ambiyans, dikkat çekmez).
  function nav() {
    if (!flag("taps") || !flag("sound")) return;
    var now = Date.now();
    if (now - lastTapAt < 90) return; // çift tık / liste kaydırma spam'e boğulmasın
    lastTapAt = now;
    if (pendingTap) clearTimeout(pendingTap);
    pendingTap = setTimeout(function () {
      pendingTap = null;
      if (!flag("taps")) return; // kullanıcı bu pencerede kapattıysa sessizlik kazanır
      play("tap");
    }, 70);
  }

  // ---------- Titreşim ----------
  // theme.js triggerHaptic anahtarı kendi içinde denetler; burada yalnızca
  // çağrıyı yönlendiriyoruz (Capacitor Haptics → navigator.vibrate).
  function haptic(style) {
    if (!flag("haptics")) return;
    if (typeof window.nexusHaptic === "function") window.nexusHaptic(style || "light");
  }

  // ---------- Hareket ----------
  // Kart/rozet gibi yüzeylere tek seferlik "komut gitti" nabzı.
  var PULSE_CLASS = "nx-fx-pulse";
  function pulse(el) {
    if (!el || !motionAllowed() || !el.classList) return;
    el.classList.remove(PULSE_CLASS);
    // yeniden tetikleme: zorla reflow sonra sınıf
    void el.offsetWidth;
    el.classList.add(PULSE_CLASS);
    var done = function () {
      el.classList.remove(PULSE_CLASS);
      el.removeEventListener("animationend", done);
    };
    el.addEventListener("animationend", done);
    // animationend yakalanamazsa (ör. sekme arka planda) güvenlik ağı
    setTimeout(done, 900);
  }

  // Cihaz aç/kapat: ses + varsa kartta nabız. Ses motoru anahtarı kendi denetler.
  function power(on, el) {
    play(on ? "toggle-on" : "toggle-off");
    haptic("light");
    pulse(el);
  }

  // Toast'ların (uyarı şeritleri) giriş + zamanı gelince solma animasyonu.
  // Ömür CSS'e --nx-toast-life olarak verilir; öğeyi kaldırmak çağıranın işi
  // (kendi setTimeout'u solmayla aynı anda vurur, görünüm zaten tamamlanmıştır).
  // Animasyonlar kapalıysa sınıf eklenmez: toast anında görünür/eski haliyle kalır.
  //
  // Bu fonksiyon aynı zamanda duyurunun ÇIKTIĞI yerdir: ekranda beliren her ortak
  // şerit, animasyondan bağımsız olarak ekran okuyucuya da okunur (aşağıdaki
  // announce()). Böylece 62 ekranın tek tek işaretlenmesine gerek kalmaz.
  function toastIn(el, lifeMs) {
    if (!el) return;
    announce(el.textContent, { tone: el.classList && el.classList.contains('nx-toast-error') ? "error" : "status" });
    if (!motionAllowed() || !el.classList) return;
    if (el.style && el.style.setProperty) el.style.setProperty("--nx-toast-life", (lifeMs || 2200) + "ms");
    el.classList.add("nx-toast");
  }

  // ---------- Ekran okuyucu duyuruları ----------
  // Uygulama tek sayfalık bir kabuk değil: her ekran kendi başına yükleniyor, bu
  // yüzden tek kalıcı "live region" yeterli. Yalnızca EKRANDA GÖRÜNMEYEN durum
  // değişiklikleri yazılır (ağ, geri alma, ortak şeritler); görsel şeritleri
  // çift okutmamak için aynı metin 1,2 sn içinde yinelenirse atlanır.
  var LIVE_IDS = { status: "nx-live-status", error: "nx-live-error" };
  function liveRegion(tone) {
    var id = LIVE_IDS[tone] || LIVE_IDS.status;
    var el = document.getElementById(id);
    if (el) return el;
    if (!document.body) return null;
    el = document.createElement("div");
    el.id = id;
    el.className = "nx-sr-only";
    el.setAttribute("aria-atomic", "true");
    if (tone === "error") {
      el.setAttribute("role", "alert");
      el.setAttribute("aria-live", "assertive");
    } else {
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
    }
    document.body.appendChild(el);
    return el;
  }

  var lastSpoken = { text: "", at: 0 };
  function announce(text, opts) {
    var s = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (!s) return;
    var tone = (opts && opts.tone) || "status";
    var el = liveRegion(tone);
    if (!el) return;
    var now = Date.now();
    if (lastSpoken.text === s && now - lastSpoken.at < 1200) return;
    lastSpoken = { text: s, at: now };
    // aynı metni yeniden okutmak için bölge önce boşaltılır (bazı okuyucular
    // değişmeyen metni duyuruyu saymaz)
    el.textContent = "";
    var write = function () { el.textContent = s; };
    if (el.textContent === "" && opts && opts.now) write();
    else setTimeout(write, 40);
    return s;
  }

  // Ortak şeritleri yakala: nexusFeedback.toastIn çağırmayan ekranlar da sınıfı
  // kendisi ekliyorsa duyuru yine yapılır. Gözlem yalnızca yeni eklenen düğümlerle
  // sınırlı, metin okumaları ucuz — akışı asla engellemez.
  function watchToasts() {
    if (!window.MutationObserver || !document.body) return;
    var mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (!n || n.nodeType !== 1) continue;
          var t = n.classList && n.classList.contains("nx-toast") ? n : n.querySelector && n.querySelector(".nx-toast");
          if (t && t.textContent) announce(t.textContent, { tone: "status" });
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Ağ durumu: çevrimdışı olmak bu uygulamanın en sık yaşanan durum değişikliği
  // (yerel ağdan çalışıyor) ve görsel rozet dışında hiçbir şey söylemiyordu.
  function watchNetwork() {
    var say = function (online) {
      announce(online ? window.nexusT ? nexusT("Bağlantı geri geldi.", "Back online.") : "Bağlantı geri geldi."
        : window.nexusT ? nexusT("İnternet bağlantısı yok — cihazlar yerel ağdan çalışmaya devam eder.", "You're offline — devices keep working on your local network.") : "İnternet bağlantısı yok.", { tone: "error" });
    };
    window.addEventListener("offline", function () { say(false); });
    window.addEventListener("online", function () { say(true); });
  }

  // Görünmez duyuru bölgelerinin tek kuralı. css/nexus-ui.css'e yazılmadı: bu dosya
  // her sayfaya enjekte ediliyor, kuralı da kendisi taşırsa hiçbir ekranın
  // yüklenme sırasına bağımlı kalmıyor.
  function injectStyle() {
    if (document.getElementById("nx-feedback-style")) return;
    var s = document.createElement("style");
    s.id = "nx-feedback-style";
    s.textContent =
      ".nx-sr-only{position:absolute;left:0;top:0;width:1px !important;height:1px;margin:-1px;padding:0 !important;" +
      "overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}";
    document.head.appendChild(s);
  }

  injectStyle();
  // Bölgeler baştan kurulur: ekran okuyucu kullanıcıları ilk duyuruyu kaçırmaz,
  // denetimler de bölgenin varlığını yüklenme anında doğrulayabilir. Bu dosya
  // theme.js'in head içinde eklediği dinamik betik olarak body'den önce de
  // çalışabilir — o durumda kurulum DOMContentLoaded'a ertelenir.
  if (document.body) {
    liveRegion("status");
    liveRegion("error");
    watchToasts();
  } else {
    var initWhenReady = function () {
      liveRegion("status");
      liveRegion("error");
      watchToasts();
    };
    document.addEventListener("DOMContentLoaded", initWhenReady);
  }
  watchNetwork();

  window.nexusFeedback = {
    play: play,
    power: power,
    pulse: pulse,
    haptic: haptic,
    nav: nav,
    toastIn: toastIn,
    announce: announce,
    motionAllowed: motionAllowed,
    enabled: { sound: function () { return flag("sound"); }, taps: function () { return flag("taps"); }, haptics: function () { return flag("haptics"); }, motion: motionAllowed },
  };
  // Duyuru o kadar ortak bir yetenek ki kısa adı da olsun: geri alma çubuğu,
  // diyaloglar ve ekranlar aynı kapıdan seslenir.
  window.nexusAnnounce = announce;
})();
