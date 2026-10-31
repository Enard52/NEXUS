// Güvenlik modu (Evde / Dışarıda / Gece): NEXUS düzeyinde bir mod anahtarı. DÜRÜSTLÜK: gerçek bir alarm paneline
// bağlanmaz ve cihazları kendiliğinden kilitlemez; yalnızca seçilen modu saklar. Otomasyonlar bu modun
// DEĞİŞMESİNİ tetikleyici olarak dinleyebilir (automation-engine.js) ve "modu ayarla" eylemiyle modu değiştirebilir.
// Durum anahtarı: nexusSecurityMode ("home" | "away" | "night"; kayıt yoksa mod seçilmemiş demektir).
(function () {
  if (window.nexusSecurityMode) return;

  var KEY = "nexusSecurityMode";
  var MODES = [
    ["home", "Evde"],
    ["away", "Dışarıda"],
    ["night", "Gece"],
  ];

  function label(v) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i][0] === v) return MODES[i][1];
    return "";
  }
  // Bütün cümleler sabit tutulur ki çeviri sözlüğünde karşılığı olsun (parça birleştirilmez).
  var ACTION_LABEL = { home: "Güvenlik modunu Evde yap", away: "Güvenlik modunu Dışarıda yap", night: "Güvenlik modunu Gece yap" };
  var WHEN_LABEL = { home: "Güvenlik modu Evde olunca", away: "Güvenlik modu Dışarıda olunca", night: "Güvenlik modu Gece olunca" };
  function get() {
    try {
      var v = JSON.parse(nexusGetItem(KEY) || "null");
      return label(v) ? v : null;
    } catch (e) {
      return null;
    }
  }
  function set(v) {
    if (!label(v)) return false;
    nexusSetItem(KEY, JSON.stringify(v));
    // Bu sayfadaki motor sahipse tetikleyiciyi hemen değerlendir (yoksa en geç sonraki turda çalışır).
    try {
      var eng = window.NexusAutomationEngine;
      if (eng && eng.isOwner() && eng.watchSecurity) eng.watchSecurity();
    } catch (e) {}
    return true;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function chips(attr, selected) {
    return (
      '<div class="qs-chips">' +
      MODES.map(function (m) {
        return '<button type="button" class="qs-chip' + (selected === m[0] ? " is-on" : "") + '" ' + attr + '="' + m[0] + '">' + m[1] + "</button>";
      }).join("") +
      "</div>"
    );
  }

  // Tetikleyici bölümü: hangi moda geçince çalışsın + şimdiki modu elle değiştirme.
  function triggerHtml(selected) {
    var cur = get();
    return (
      '<p class="qs-sub">Mod değişince çalışır (uygulama açıkken). Bu mod NEXUS içinde bir anahtardır; gerçek bir alarm paneline bağlanmaz ve cihazları kendiliğinden kilitlemez.</p>' +
      '<p class="qs-sub" style="margin:10px 0 6px"><b>Şu moda geçince çalışsın:</b></p>' +
      chips("data-secmode", selected) +
      '<p class="qs-sub" style="margin:14px 0 6px">Şimdiki mod: <b>' + esc(cur ? label(cur) : "seçilmemiş") + "</b></p>" +
      chips("data-setmode", cur)
    );
  }
  // "Ne yapsın?" bölümüne eklenen seçenekler (data-scene="secmode:<mod>").
  function actionChoices(selectedScene) {
    return MODES.map(function (m) {
      var on = selectedScene === "secmode:" + m[0];
      return (
        '<button type="button" class="qs-choice' + (on ? " is-on" : "") + '" data-scene="secmode:' + m[0] + '">' +
        '<span class="qs-ico" style="background:#06b6d41f;color:#06b6d4"><i data-lucide="shield-check"></i></span>' +
        '<span class="qs-body"><span class="qs-title">' + ACTION_LABEL[m[0]] + "</span>" +
        '<span class="qs-meta">Yalnızca NEXUS modunu değiştirir; cihazlara dokunmaz.</span></span><span class="qs-radio"></span></button>'
      );
    }).join("");
  }

  window.nexusSecurityMode = {
    MODES: MODES,
    get: get,
    set: set,
    label: label,
    actionLabel: function (v) { return ACTION_LABEL[v] || ""; },
    whenLabel: function (v) { return WHEN_LABEL[v] || ""; }, triggerHtml: triggerHtml, actionChoices: actionChoices };
})();
