/**
 * NEXUS — geri alma katmanı (silme/çıkarma işlemleri için).
 *
 * Sorun: 62 ekranın her biri kendi silme kodunu yazıyor; yanlışlıkla silinen bir
 * cihaz, olay veya kart için tek çare yeniden eklemekti. Her ekrana tek tek "Geri al"
 * yazmak yerine tek mekanizma depo katmanına bağlanır:
 *
 *   • nexusSetItem çağrıları gözlemlenir (çağrı her zaman aynen iletilir; bu katman
 *     yalnızca İZLER, hiçbir yazımı değiştirmez, asla hata fırlatmaz).
 *   • Koleksiyon anahtarlarında eski değerden "saf çıkarma" tespit edilirse — yeni
 *     dizi eskinin sırayı koruyan alt kümesi, yani yalnızca eleman silinmişse —
 *     silinen değer saklanır ve ekranın altında "Geri al" çubuğu çıkar.
 *   • Geri al: eski değer depoya geri yazılır, nexusUndoApplied olayı duyurulur ve
 *     ekran (dinleyicisi olayı iptal etmedikçe) güncel veriyle yeniden yüklenir.
 *
 * Bilinçli sınırlar:
 *   • Sıralama değişiklikleri, toplu temizleme (dizi tamamen boşalırsa) ve salt
 *     okunur anahtarlar geri alma doğurmaz — yanlış pozitif çubuk gürültü olurdu.
 *   • Pencere kapatılırsa/küçülürse bekleyen geri alma düşer; kalıcı bir yedek
 *     değildir, tek amaç yanlış tıklamanın ilk 6 saniyesini kurtarmaktır.
 *
 * Kullanım: ekranların yapması gereken bir şey yok. İleri düzey: nexusUndo.isArmed()
 * ile bir geri almanın beklemede olup olmadığı sorulabilir.
 */
(function () {
  "use strict";
  if (window.nexusUndo) return;

  var T = function (tr, en) { return (window.nexusT || function (a) { return a; })(tr, en); };

  // Geri almanın anlamlı olduğu koleksiyonlar: silinmesi veri kaybı olan listeler.
  // Okuma durumu işaretleri (nexusReadNotifs), anahtarlar (nexusDnd*) ve tema gibi
  // tercihler burada YOK — onların geri alınması gürültü olur.
  var UNDO_KEYS = {
    nexusPairedDevices: { ad: T("cihaz", "device"), cok: T("cihaz", "devices") },
    nexusEvents: { ad: T("olay", "event"), cok: T("olay", "events") },
    nexusSelectedTapToRunCards: { ad: T("kart", "card"), cok: T("kart", "cards") },
    nexusSelectedSmartHomeCards: { ad: T("kart", "card"), cok: T("kart", "cards") },
    nexusDashboardCards: { ad: T("kart", "card"), cok: T("kart", "cards") },
    nexusConnectedServices: { ad: T("bağlantı", "connection"), cok: T("bağlantı", "connections") },
    nexusAiHistory: { ad: T("sohbet", "chat"), cok: T("sohbet", "chats") },
    nexusChatHistory: { ad: T("sohbet", "chat"), cok: T("sohbet", "chats") },
    nexusEnergySelectedDevices: { ad: T("cihaz", "device"), cok: T("cihaz", "devices") },
  };
  var MAX_RESTORABLE = 50; // toplu temizlemeler (tümünü sil) geri alınmaz
  var LIFE_MS = 6000;

  // ---- depo sarmalayıcı ----
  var base = typeof window.nexusSetItem === "function" ? window.nexusSetItem : null;
  var wrapped = null;
  var restoring = false; // kendi geri yazımımızı bir daha "silme" sanmasın

  function isCollectionKey(key) {
    return Object.prototype.hasOwnProperty.call(UNDO_KEYS, key);
  }

  function parseList(raw) {
    if (typeof raw !== "string") return null;
    var c = raw.charAt(0);
    if (c !== "[" && c !== "{") return null;
    try {
      var v = JSON.parse(raw);
      return v && typeof v === "object" ? v : null;
    } catch (e) {
      return null;
    }
  }

  // Yapısal karşılaştırma: eski ve yeni değerler her yazımda JSON'a gidip gelirken
  // yeniden çözüldüğü için nesne kimlikleri (===) asla eşleşmez; anahtar sırası
  // farklılsa bile aynı nesneyi "aynı" saymak için anahtarları sıralı diziyoruz.
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") {
      var ks = Object.keys(v).sort();
      return "{" + ks.map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    }
    return JSON.stringify(v);
  }

  // Yeni dizi, eskinin sırayı koruyan bir alt kümesi mi? (yalnızca çıkarma)
  function pureRemoval(oldArr, newArr) {
    if (!Array.isArray(oldArr) || !Array.isArray(newArr)) return 0;
    var gone = oldArr.length - newArr.length;
    if (gone <= 0 || gone > MAX_RESTORABLE || newArr.length === 0) return 0;
    var i = 0, j = 0;
    while (i < oldArr.length && j < newArr.length) {
      if (stable(oldArr[i]) === stable(newArr[j])) j++;
      i++;
    }
    return j === newArr.length ? gone : 0;
  }

  // Nesne haritaları için: aynı değerlerle anahtar alt kümesi mi?
  function pureKeyRemoval(oldObj, newObj) {
    var gone = 0, k;
    for (k in oldObj) {
      if (!Object.prototype.hasOwnProperty.call(oldObj, k)) continue;
      if (!Object.prototype.hasOwnProperty.call(newObj, k)) gone++;
      else if (stable(oldObj[k]) !== stable(newObj[k])) return 0;
    }
    if (gone === 0 || gone > MAX_RESTORABLE) return 0;
    for (k in newObj) if (stable(oldObj[k]) !== stable(newObj[k])) return 0;
    return gone;
  }

  function removedLabel(oldV, newV) {
    if (Array.isArray(oldV)) {
      var seen = {};
      for (var j = 0; j < newV.length; j++) seen[JSON.stringify(newV[j])] = 1;
      for (var i = 0; i < oldV.length; i++) {
        if (!seen[JSON.stringify(oldV[i])]) {
          var it = oldV[i];
          if (it && typeof it === "object" && it.name) return "«" + it.name + "»";
          if (typeof it === "string" && it) return "«" + it + "»";
          break;
        }
      }
    }
    return null;
  }

  // ---- geri alma çubuğu ----
  var STYLE_ID = "nx-undo-style";
  var bar = null, timer = null, pending = null;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".nx-undo{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);" +
      "z-index:190;display:flex;align-items:center;gap:12px;max-width:min(92vw,420px);" +
      "padding:10px 12px 10px 18px;border-radius:999px;background:#0f172a;color:#f1f5f9;" +
      "box-shadow:0 18px 40px -14px rgba(15,23,42,.55);font:600 13.5px/1.3 Inter,system-ui,sans-serif;" +
      "animation:nxUndoIn .22s cubic-bezier(.2,.9,.3,1.15)}" +
      "html.dark .nx-undo,html[data-theme='dark'] .nx-undo{background:#1e293b}" +
      ".nx-undo-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".nx-undo-btn{flex:none;min-height:38px;padding:0 16px;border:0;border-radius:999px;cursor:pointer;" +
      "font:800 13.5px/1 Inter,system-ui,sans-serif;color:#fff;" +
      "background:linear-gradient(135deg,#6f9bff,var(--nx-accent,#4C7DFF) 60%,#8b7bff);transition:transform .15s ease}" +
      ".nx-undo-btn:active{transform:scale(.96)}" +
      ".nx-undo-btn:focus-visible{outline:2px solid #8fb0ff;outline-offset:2px}" +
      "@keyframes nxUndoIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}";
    document.head.appendChild(s);
  }

  function dismiss() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    bar = null;
    pending = null;
  }

  function showBar(label, oldRaw, key, countAtArm) {
    injectStyle();
    dismiss();
    pending = { key: key, raw: oldRaw, countAtArm: countAtArm };

    bar = document.createElement("div");
    bar.className = "nx-undo";
    bar.setAttribute("role", "status");

    var txt = document.createElement("span");
    txt.className = "nx-undo-text";
    txt.textContent = label;
    bar.appendChild(txt);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nx-undo-btn";
    btn.textContent = T("Geri al", "Undo");
    btn.setAttribute("aria-label", T(label + " — geri al", label + " — undo"));
    btn.addEventListener("click", function () {
      var snap = pending;
      if (!snap) return;
      dismiss();
      restoring = true;
      try {
        base.call(window, snap.key, snap.raw);
      } catch (e) { /* geri yazım başarısızsa ekran olduğu gibi kalır */ }
      restoring = false;
      if (window.nexusFeedback && window.nexusFeedback.announce) {
        window.nexusFeedback.announce(T("Geri alındı.", "Restored."), { tone: "status" });
      }
      var ev;
      try {
        ev = new CustomEvent("nexusUndoApplied", { cancelable: true, detail: { key: snap.key } });
      } catch (e) {
        ev = document.createEvent("CustomEvent");
        ev.initCustomEvent("nexusUndoApplied", true, true, { key: snap.key });
      }
      var prevented = !window.dispatchEvent(ev);
      if (!prevented && !window.__nexusUndoNoReload) location.reload();
    });
    bar.appendChild(btn);

    document.body.appendChild(bar);
    if (window.nexusFeedback && window.nexusFeedback.announce) {
      window.nexusFeedback.announce(label + " — " + T("Geri al seçeneği 6 saniye bekliyor.", "Undo available for 6 seconds."), { tone: "status" });
    }
    timer = setTimeout(dismiss, LIFE_MS);
  }

  function sizeOf(v) {
    if (Array.isArray(v)) return v.length;
    var n = 0;
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) n++;
    return n;
  }

  function armUndo(key, value) {
    if (restoring || !isCollectionKey(key)) return;
    var meta = UNDO_KEYS[key];
    var oldRaw = null;
    try {
      oldRaw = typeof window.nexusGetItem === "function" ? window.nexusGetItem(key) : localStorage.getItem(key);
    } catch (e) {
      return;
    }
    if (typeof oldRaw !== "string" || oldRaw === String(value)) return;
    var oldV = parseList(oldRaw), newV = parseList(String(value));
    if (!oldV || !newV) return;

    var gone = 0, label = null;
    if (Array.isArray(oldV) && Array.isArray(newV)) {
      gone = pureRemoval(oldV, newV);
      if (gone) {
        var what = gone === 1 ? meta.ad : meta.cok;
        var name = gone === 1 ? removedLabel(oldV, newV) : null;
        label = name
          ? name + " " + T("kaldırıldı.", "was removed.")
          : gone + " " + what + " " + T("kaldırıldı.", "removed.");
      }
    } else if (!Array.isArray(oldV) && !Array.isArray(newV)) {
      gone = pureKeyRemoval(oldV, newV);
      if (gone) label = gone + " " + meta.cok + " " + T("kaldırıldı.", "removed.");
    }
    if (gone && label) { showBar(label, oldRaw, key, sizeOf(newV)); return; }
    if (!gone) {
      // Silme sonrası ekranlar aynı anahtara DURUM yazımı yapabilir (anahtarın
      // açık/kapalı bilgisi gibi) — bu yazım çubuğu öldürmemeli. Çubuğu yalnızca
      // doğal geri ekleme (koleksiyon silme anındaki boyutuna geri döndüğünde ya
      // da büyüdüğünde) kapatır.
      if (pending && pending.key === key && sizeOf(newV) >= pending.countAtArm) dismiss();
    }
  }

  function makeWrapper(fn) {
    return function (key, value) {
      try { armUndo(key, value); } catch (e) { /* gözlem akışı asla bozmasın */ }
      return fn.call(this, key, value);
    };
  }

  // Yükleme sırasına dayanıklı sarmalama: auth.js önce de sonra da yüklense,
  // nexusSetItem'ın güncel gerçek gövdesi her çağrıda kullanılır.
  if (base) wrapped = makeWrapper(base);
  try {
    Object.defineProperty(window, "nexusSetItem", {
      configurable: true,
      get: function () { return wrapped; },
      set: function (v) { base = typeof v === "function" ? v : base; wrapped = base ? makeWrapper(base) : null; },
    });
  } catch (e) {
    // property tanımlanamadıysa (kilitli ortam) sessizce vazgeç: uygulama aynen çalışır
  }

  window.nexusUndo = {
    isArmed: function () { return !!pending; },
    dismiss: dismiss,
  };
})();
