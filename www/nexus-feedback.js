/**
 * NEXUS — ses / titreşim / hareket geri bildirim merkezi (tüm platformlar).
 *
 * Tasarım ilkeleri:
 *  • Sesler WebAudio ile ANLIK ÜRETİLİR: ses dosyası yok, indirme yok, lisans yok.
 *    Hepsi kısık (kazanç ≤ 0.05), kısa (≤ 0.4 sn) ve markanın sakin tonunda.
 *  • Her tıklamada ses ÇIKMAZ — yalnızca sonuç sesleri: cihaz aç/kapat, senaryo,
 *    başarı/hata, yeni bildirim, kopyalama. Dokunma geri bildirimi titreşimle.
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
 */
(function () {
  "use strict";

  if (window.nexusFeedback) return;

  var KEYS = {
    sound: "nexusSoundEnabled",
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

  function play(name) {
    var spec = SOUNDS[name];
    if (!spec) return;
    var c = audio();
    if (!c) return;
    for (var i = 0; i < spec.length; i++) {
      try { tone(c, spec[i]); } catch (e) { /* ses asla akışı bozmasın */ }
    }
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
  function toastIn(el, lifeMs) {
    if (!el || !motionAllowed() || !el.classList) return;
    if (el.style && el.style.setProperty) el.style.setProperty("--nx-toast-life", (lifeMs || 2200) + "ms");
    el.classList.add("nx-toast");
  }

  window.nexusFeedback = {
    play: play,
    power: power,
    pulse: pulse,
    haptic: haptic,
    toastIn: toastIn,
    motionAllowed: motionAllowed,
    enabled: { sound: function () { return flag("sound"); }, haptics: function () { return flag("haptics"); }, motion: motionAllowed },
  };
})();
