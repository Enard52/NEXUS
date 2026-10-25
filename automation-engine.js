/**
 * NEXUS Otomasyon Motoru (issue #24)
 * ----------------------------------
 * Zaman tetikleyicili otomasyonları ve zamanlama tabanlı enerji
 * stratejilerini DEĞERLENDİRİR ve gerçekten çalıştırır.
 *
 * Nasıl çalışır:
 *  - Her sayfada yüklenir (theme.js ekler). localStorage kalp atışı ile
 *    tek "sahip" seçilir: aynı profildeki sekmeler/pencereler/ masaüstü
 *    arka plan çalışanı arasında motor yalnız bir kez çalışır.
 *  - 30 saniyede bir + sayfa görünürlük değişince tetikleyiciler denetlenir.
 *  - Bir tetikleyici gün içinde henüz çalışmadıysa ve saati geldiyse
 *    (90 dk gecikme payı) çalışır; kaçırıldıysa güne bir kez "kaçırıldı"
 *    olayı yazar (uydurma çalışma gösterilmez).
 *  - Yürütme: nexusCustomAutomations[].sceneId → NX.runScene();
 *    actions[] → cihaz alanları; ikisi de yoksa dürüst olay kaydı
 *    "tanımlı eylem yok" ile yazılır.
 *  - Enerji: "Gece bekleme tüketimini kes" stratejisi etkinse 23:00'te
 *    seçili enerji cihazlarını kapatır (nexusEnergySelectedDevices).
 *
 * Sınırlar (dürüst): uygulama/sekme kapalıyken çalışmaz. Masaüstünde
 * tepsi modunda gizli çalışan pencere (automation-worker.html) sürdürür.
 * Konum (geofence) ve cihaz-durumu tetikleyicileri bu sürümde yok.
 */
(function () {
  if (window.NexusAutomationEngine) return;

  var BEAT_KEY = 'nexusEngineBeat';
  var RUNS_KEY = 'nexusAutomationRuns';
  var EVENTS_KEY = 'nexusEvents';
  var ENERGY_ENABLED_KEY = 'nexusEnergyEnabledMap';
  var ENERGY_DEVICES_KEY = 'nexusEnergySelectedDevices';
  var ENERGY_NIGHT_TITLE = 'Gece bekleme tüketimini kes';
  var NIGHT_TIME = '23:00';
  var TICK_MS = 30000;
  var BEAT_MS = 2500;
  var LATE_LIMIT_MS = 90 * 60 * 1000; // tetikleme saatinden en geç bu kadar gecikmeyle çalışır

  var myId = 'eng-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  var isOwner = false;

  function get(k, f) { try { return JSON.parse(nexusGetItem(k) || 'null') || f; } catch (e) { return f; } }
  function set(k, v) { nexusSetItem(k, JSON.stringify(v)); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function platform() {
    if (document.documentElement.classList.contains('nx-desk')) return 'desktop';
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return 'android';
    return 'web';
  }

  // ---- sahip seçimi (kalp atışı) ----
  function heartbeat() {
    var beat = get(BEAT_KEY, null);
    var now = Date.now();
    if (!beat || now - beat.t > BEAT_MS * 2 || beat.owner === myId) {
      set(BEAT_KEY, { t: now, owner: myId });
      isOwner = true;
    } else {
      isOwner = false;
    }
  }

  // ---- güneş batışı (ev konumundan, NOAA yaklaşımı; konum yoksa tetiklenmez) ----
  function sunsetTime() {
    var coords = get('nexusWeatherCoords', null) || null;
    if (!coords || !isFinite(coords.lat) || !isFinite(coords.lon)) return null;
    var rad = Math.PI / 180, day = new Date();
    var n = Math.floor((day - new Date(Date.UTC(day.getFullYear(), 0, 0))) / 86400000);
    var lat = coords.lat * rad;
    var decl = 0.409 * Math.sin(2 * Math.PI * (n - 81) / 365);
    var ha = Math.acos(-Math.tan(lat) * Math.tan(decl));
    if (!isFinite(ha)) return null; // kutup gecesi/gündüzü
    var solarNoonUTC = 12 - coords.lon / 15;
    var sunsetUTC = solarNoonUTC + ha * 12 / Math.PI;
    var local = new Date();
    local.setUTCHours(Math.floor(sunsetUTC), Math.round((sunsetUTC % 1) * 60), 0, 0);
    return String(local.getHours()).padStart(2, '0') + ':' + String(local.getMinutes()).padStart(2, '0');
  }

  function repeatAllows(repeat, date) {
    var dow = date.getDay(); // 0 Paz .. 6 Cmt
    switch (repeat) {
      case 'weekdays': return dow >= 1 && dow <= 5;
      case 'weekends': return dow === 0 || dow === 6;
      default: return true; // daily / always / weekly / tanımsız
    }
  }

  // ---- bugünün çalıştırma kayıtları ----
  function runInfo(id) {
    var runs = get(RUNS_KEY, {});
    return runs[id] && runs[id].date === today() ? runs[id] : null;
  }
  function markRun(id, extra) {
    var runs = get(RUNS_KEY, {});
    runs[id] = Object.assign({ date: today(), ts: Date.now() }, extra || {});
    // son 200 kaydı tut
    var keys = Object.keys(runs);
    if (keys.length > 200) keys.sort(function (a, b) { return (runs[a].ts || 0) - (runs[b].ts || 0); }).slice(0, keys.length - 200).forEach(function (k) { delete runs[k]; });
    set(RUNS_KEY, runs);
  }

  function logEvent(type, title, detail) {
    var evs = get(EVENTS_KEY, []);
    if (!Array.isArray(evs)) evs = [];
    evs.push({ id: 'auto-' + Date.now(), type: type, title: title, detail: detail, ts: Date.now() });
    set(EVENTS_KEY, evs);
  }

  function toast(msg) {
    try {
      var t = document.createElement('div');
      t.className = 'fixed left-1/2 top-6 z-[120] -translate-x-1/2 rounded-2xl bg-slate-950/90 px-4 py-2.5 text-sm font-semibold text-white shadow-lg text-center';
      t.style.maxWidth = 'min(92vw, 420px)';
      t.setAttribute('role', 'status');
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2600);
    } catch (e) {}
  }
  function tr(trText, enText) { return typeof nexusT === 'function' ? nexusT(trText, enText) : trText; }

  // ---- motor bağımlılıklarını tembel yükle (yalnız çalıştırma anında) ----
  function ensureEngine(cb) {
    if (window.NX && NX.runScene) return cb();
    var files = ['supported-devices.js', 'lan-connectors.js', 'device-controls.js'].filter(function (f) {
      return !document.querySelector('script[src="' + f + '"]');
    });
    (function next() {
      if (!files.length) return cb();
      var el = document.createElement('script');
      el.src = files.shift();
      el.onload = next; el.onerror = next;
      document.head.appendChild(el);
    })();
  }

  // ---- yürütme ----
  function executeAutomation(item) {
    ensureEngine(function () {
      var summary;
      if (item.sceneId && window.NX && NX.SCENES && NX.SCENES[item.sceneId]) {
        var r = NX.runScene(item.sceneId);
        summary = NX.sceneSummary(r);
      } else if (Array.isArray(item.actions) && item.actions.length && window.NX) {
        var devices = NX.readDevices();
        var done = 0;
        item.actions.forEach(function (a) {
          var idx = typeof a.index === 'number' ? a.index : devices.findIndex(function (d) { return d.name === a.name; });
          if (idx >= 0 && devices[idx] && a.field) { NX.setField(idx, a.field, a.value); done++; }
        });
        summary = tr(item.title + ': ' + done + ' cihaz güncellendi.', item.title + ': ' + done + ' device(s) updated.');
      } else {
        // Dürüst kayıt: eylem tanımlı değil; "çalıştı" sanılmasın
        summary = tr(item.title + ' tetiklendi; tanımlı eylem yok (Senaryo Ayarları\'ndan bir senaryo seçebilirsin).',
                     item.title + ' triggered; no action defined (pick a scenario from Scenario Settings).');
      }
      logEvent('automation', item.title, summary);
      markRun(item.id, { summary: summary });
      toast(tr('Otomasyon: ' + summary, 'Automation: ' + summary));
    });
  }

  function executeEnergyNight() {
    ensureEngine(function () {
      var names = get(ENERGY_DEVICES_KEY, []);
      var changed = 0;
      if (window.NX && names.length) {
        var devices = NX.readDevices();
        names.forEach(function (n) {
          var idx = devices.findIndex(function (d) { return d.name === n; });
          if (idx >= 0) { NX.setField(idx, 'switch', false); changed++; }
        });
      }
      var summary = changed
        ? tr('Gece stratejisi: ' + changed + ' cihazın gücü kesildi.', 'Night strategy: ' + changed + ' device(s) powered off.')
        : tr('Gece stratejisi tetiklendi; seçili enerji cihazı yok.', 'Night strategy triggered; no selected energy devices.');
      logEvent('energy', tr('Enerji stratejisi çalıştı', 'Energy strategy ran'), summary);
      markRun('energy-night', { summary: summary });
      if (changed) toast(summary);
    });
  }

  // ---- değerlendirme ----
  function evaluate() {
    var now = new Date();
    var minutesNow = now.getHours() * 60 + now.getMinutes();

    function minutesOf(hhmm) {
      var p = String(hhmm).split(':');
      var h = parseInt(p[0], 10), m = parseInt(p[1] || '0', 10);
      return isFinite(h) ? h * 60 + m : null;
    }

    // 1) otomasyonlar
    var autos = [];
    try { autos = typeof readAndNormalizeItems === 'function' ? readAndNormalizeItems('nexusCustomAutomations', 'automation') : get('nexusCustomAutomations', []); } catch (e) {}
    autos.forEach(function (a) {
      if (!a || !a.id || a.enabled === false) return;
      var t = a.trigger || {};
      if (t.type !== 'time') return; // konum/cihaz tetikleyicileri henüz yok
      var value = t.value;
      if (value === 'sunset') {
        var ss = sunsetTime();
        if (!ss) { if (!runInfo(a.id + ':nosunset')) { markRun(a.id + ':nosunset'); logEvent('automation', a.title, tr('Gün batımı tetikleyicisi: ev konumu seçilmedi.', 'Sunset trigger: no home location set.')); } return; }
        value = ss;
      }
      var due = minutesOf(value);
      if (due === null || !repeatAllows(t.repeat, now)) return;
      if (runInfo(a.id)) return; // bugün çalıştı
      var late = minutesNow - due;
      if (late < 0) return; // saati daha gelmedi
      if (late * 60000 > LATE_LIMIT_MS) {
        markRun(a.id, { missed: true });
        logEvent('automation', a.title, tr('Tetikleme saati kaçırıldı (uygulama kapalıydı).', 'Trigger time missed (app was closed).'));
        return;
      }
      executeAutomation(a);
    });

    // 2) enerji gece stratejisi
    var enabledMap = get(ENERGY_ENABLED_KEY, {});
    if (enabledMap[ENERGY_NIGHT_TITLE]) {
      var due = minutesOf(NIGHT_TIME);
      if (!runInfo('energy-night') && minutesNow >= due && (minutesNow - due) * 60000 <= LATE_LIMIT_MS) {
        executeEnergyNight();
      }
    }
  }

  function tick() {
    heartbeat();
    if (isOwner) evaluate();
  }

  function start() {
    tick();
    setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) tick(); });
    window.addEventListener('storage', function (e) {
      // Kalp atışı başka bir sekme/pencereden güncellendiyse sahipliği yeniden değerlendir
      if (e.key && e.key.indexOf(BEAT_KEY) !== -1) setTimeout(tick, 300);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.NexusAutomationEngine = {
    platform: platform,
    isOwner: function () { return isOwner; },
    evaluate: function () { heartbeat(); if (isOwner) evaluate(); return isOwner; },
    // Test/denemek için: kuralı sahtesiz hemen çalıştırır (günlüğe "elle" yazar)
    runNow: function (id) {
      var autos = get('nexusCustomAutomations', []);
      var item = autos.find(function (a) { return a && a.id === id; });
      if (item) { executeAutomation(item); return true; }
      return false;
    }
  };
})();
