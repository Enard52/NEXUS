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
 * Konum (geofence) ve güvenlik modu tetikleyicileri bu sürümde yok.
 */
(function () {
  if (window.NexusAutomationEngine) return;

  var BEAT_KEY = "nexusEngineBeat";
  var RUNS_KEY = "nexusAutomationRuns";
  var EVENTS_KEY = "nexusEvents";
  var ENERGY_ENABLED_KEY = "nexusEnergyEnabledMap";
  var ENERGY_DEVICES_KEY = "nexusEnergySelectedDevices";
  var ENERGY_NIGHT_TITLE = "Gece bekleme tüketimini kes";
  var NIGHT_TIME = "23:00";
  var TICK_MS = 30000;
  var BEAT_MS = 2500;
  var LATE_LIMIT_MS = 90 * 60 * 1000; // tetikleme saatinden en geç bu kadar gecikmeyle çalışır

  var myId = "eng-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  var isOwner = false;

  function get(k, f) {
    try {
      return JSON.parse(nexusGetItem(k) || "null") || f;
    } catch (e) {
      return f;
    }
  }
  function set(k, v) {
    nexusSetItem(k, JSON.stringify(v));
  }
  function today() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function platform() {
    if (document.documentElement.classList.contains("nx-desk")) return "desktop";
    if (
      window.Capacitor &&
      window.Capacitor.isNativePlatform &&
      window.Capacitor.isNativePlatform()
    )
      return "android";
    return "web";
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

  // ---- güneş doğuşu ve batışı (ev konumundan, NOAA yaklaşımı; konum yoksa tetiklenmez) ----
  function calcSun(isSunrise) {
    var coords = get("nexusWeatherCoords", null) || null;
    if (!coords || !isFinite(coords.lat) || !isFinite(coords.lon)) return null;
    var rad = Math.PI / 180,
      day = new Date();
    var n = Math.floor((day - new Date(Date.UTC(day.getFullYear(), 0, 0))) / 86400000);
    var lat = coords.lat * rad;
    var decl = 0.409 * Math.sin((2 * Math.PI * (n - 81)) / 365);
    var ha = Math.acos(-Math.tan(lat) * Math.tan(decl));
    if (!isFinite(ha)) return null; // kutup gecesi/gündüzü
    var solarNoonUTC = 12 - coords.lon / 15;
    var utcHours = isSunrise
      ? solarNoonUTC - (ha * 12) / Math.PI
      : solarNoonUTC + (ha * 12) / Math.PI;
    var local = new Date();
    local.setUTCHours(Math.floor(utcHours), Math.round((utcHours % 1) * 60), 0, 0);
    return (
      String(local.getHours()).padStart(2, "0") + ":" + String(local.getMinutes()).padStart(2, "0")
    );
  }
  function sunsetTime() {
    return calcSun(false);
  }
  function sunriseTime() {
    return calcSun(true);
  }

  function repeatAllows(repeat, date) {
    var dow = date.getDay(); // 0 Paz .. 6 Cmt
    switch (repeat) {
      case "weekdays":
        return dow >= 1 && dow <= 5;
      case "weekends":
        return dow === 0 || dow === 6;
      default:
        return true; // daily / always / weekly / tanımsız
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
    if (keys.length > 200)
      keys
        .sort(function (a, b) {
          return (runs[a].ts || 0) - (runs[b].ts || 0);
        })
        .slice(0, keys.length - 200)
        .forEach(function (k) {
          delete runs[k];
        });
    set(RUNS_KEY, runs);
  }

  function logEvent(type, title, detail, id) {
    var evs = get(EVENTS_KEY, []);
    if (!Array.isArray(evs)) evs = [];
    evs.push({
      id: id || "auto-" + Date.now(),
      type: type,
      title: title,
      detail: detail,
      ts: Date.now(),
    });
    // Liste sınırsız büyüyerek 2-5 sn'lik yoklamaları ve bulut senkronunu yoruyordu; son 300 olay yeter.
    if (evs.length > 300) evs = evs.slice(-300);
    set(EVENTS_KEY, evs);
  }

  function toast(msg) {
    if (window.nexusToast) window.nexusToast(msg);
  }
  function tr(trText, enText) {
    return typeof nexusT === "function" ? nexusT(trText, enText) : trText;
  }

  // ---- motor bağımlılıklarını tembel yükle (yalnız çalıştırma anında) ----
  function ensureEngine(cb) {
    if (window.NX && NX.runScene) return cb();
    var files = ["supported-devices.js", "lan-connectors.js", "device-controls.js"].filter(
      function (f) {
        return !document.querySelector('script[src="' + f + '"]');
      },
    );
    (function next() {
      if (!files.length) return cb();
      var el = document.createElement("script");
      el.src = files.shift();
      el.onload = next;
      el.onerror = next;
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
          var idx =
            typeof a.index === "number"
              ? a.index
              : devices.findIndex(function (d) {
                  return d.name === a.name;
                });
          if (idx >= 0 && devices[idx] && a.field) {
            NX.setField(idx, a.field, a.value);
            done++;
          }
        });
        summary = tr(
          item.title + ": " + done + " cihaz güncellendi.",
          item.title + ": " + done + " device(s) updated.",
        );
      } else {
        // Dürüst kayıt: eylem tanımlı değil; "çalıştı" sanılmasın
        summary = tr(
          item.title +
            " tetiklendi; tanımlı eylem yok (Senaryo Ayarları'ndan bir senaryo seçebilirsin).",
          item.title + " triggered; no action defined (pick a scenario from Scenario Settings).",
        );
      }
      logEvent("automation", item.title, summary);
      markRun(item.id, { summary: summary });
      toast(tr("Otomasyon: " + summary, "Automation: " + summary));
    });
  }

  function executeEnergyNight() {
    ensureEngine(function () {
      var names = get(ENERGY_DEVICES_KEY, []);
      var changed = 0;
      if (window.NX && names.length) {
        var devices = NX.readDevices();
        names.forEach(function (n) {
          var idx = devices.findIndex(function (d) {
            return d.name === n;
          });
          if (idx >= 0) {
            NX.setField(idx, "switch", false);
            changed++;
          }
        });
      }
      var summary = changed
        ? tr(
            "Gece stratejisi: " + changed + " cihazın gücü kesildi.",
            "Night strategy: " + changed + " device(s) powered off.",
          )
        : tr(
            "Gece stratejisi tetiklendi; seçili enerji cihazı yok.",
            "Night strategy triggered; no selected energy devices.",
          );
      logEvent("energy", tr("Enerji stratejisi çalıştı", "Energy strategy ran"), summary);
      markRun("energy-night", { summary: summary });
      if (changed) toast(summary);
    });
  }

  // ---- değerlendirme ----
  function evaluate() {
    var now = new Date();
    var minutesNow = now.getHours() * 60 + now.getMinutes();

    function minutesOf(hhmm) {
      var p = String(hhmm).split(":");
      var h = parseInt(p[0], 10),
        m = parseInt(p[1] || "0", 10);
      return isFinite(h) ? h * 60 + m : null;
    }

    // 1) otomasyonlar
    var autos = [];
    try {
      autos =
        typeof readAndNormalizeItems === "function"
          ? readAndNormalizeItems("nexusCustomAutomations", "automation")
          : get("nexusCustomAutomations", []);
    } catch (e) {}
    autos.forEach(function (a) {
      if (!a || !a.id || a.enabled === false) return;
      var t = a.trigger || {};
      if (t.type !== "time") return; // konum/cihaz tetikleyicileri henüz yok
      var value = t.value;
      if (value === "sunset") {
        var ss = sunsetTime();
        if (!ss) {
          if (!runInfo(a.id + ":nosunset")) {
            markRun(a.id + ":nosunset");
            logEvent(
              "automation",
              a.title,
              tr(
                "Gün batımı tetikleyicisi: ev konumu seçilmedi.",
                "Sunset trigger: no home location set.",
              ),
            );
          }
          return;
        }
        value = ss;
      } else if (value === "sunrise") {
        var sr = sunriseTime();
        if (!sr) {
          if (!runInfo(a.id + ":nosunrise")) {
            markRun(a.id + ":nosunrise");
            logEvent(
              "automation",
              a.title,
              tr(
                "Gündoğumu tetikleyicisi: ev konumu seçilmedi.",
                "Sunrise trigger: no home location set.",
              ),
            );
          }
          return;
        }
        value = sr;
      }
      var due = minutesOf(value);
      if (due === null || !repeatAllows(t.repeat, now)) return;
      if (runInfo(a.id)) return; // bugün çalıştı
      var late = minutesNow - due;
      if (late < 0) return; // saati daha gelmedi
      if (late * 60000 > LATE_LIMIT_MS) {
        markRun(a.id, { missed: true });
        logEvent(
          "automation",
          a.title,
          tr(
            "Tetikleme saati kaçırıldı (uygulama kapalıydı).",
            "Trigger time missed (app was closed).",
          ),
        );
        return;
      }
      executeAutomation(a);
    });

    // 2) enerji gece stratejisi
    var enabledMap = get(ENERGY_ENABLED_KEY, {});
    if (enabledMap[ENERGY_NIGHT_TITLE]) {
      var due = minutesOf(NIGHT_TIME);
      if (
        !runInfo("energy-night") &&
        minutesNow >= due &&
        (minutesNow - due) * 60000 <= LATE_LIMIT_MS
      ) {
        executeEnergyNight();
      }
    }
  }

  // ---- sensör izleme: gerçek durum değişimi → güvenlik / acil olayı ----
  // Yerel ağa eşli hareket, kapı-pencere ve alarm (duman/su baskını) sensörleri uygulama
  // açıkken motor turuyla (yaklaşık 30 sn'de bir) cihazdan okunur; kısa süreli bir hareket
  // iki okuma arasında kaçabilir (bu bir canlı yayın değil, yoklamadır). Olay YALNIZ okunan durum "kapalı → açık" döndüğünde
  // yazılır; ilk okuma sadece başlangıç durumudur (uygulama kapalıyken olanlar olay sayılmaz,
  // çünkü zamanı bilinmez). Aynı sensör 60 sn içinde ikinci olay üretmez. Okunamayan sensör
  // olay üretmez. Olaylar güvenlik/acil türü taşıdığı için bildirim hattında kritik sayılır.
  var SENSOR_EVERY_MS = 25000;
  var SENSOR_GAP_MS = 60000;
  var SENSOR_KINDS = { motion: 1, contact: 1, alarm: 1 };
  var sensorLast = {};
  var lastSensorPoll = 0;
  var sensorBusy = false;

  function sensorEvent(kind, name) {
    if (kind === "motion")
      return { type: "security", title: tr("Hareket algılandı", "Motion detected"), detail: name };
    if (kind === "contact")
      return {
        type: "security",
        title: tr("Kapı/pencere açıldı", "Door/window opened"),
        detail: name,
      };
    return { type: "emergency", title: tr("Alarm algılandı", "Alarm detected"), detail: name };
  }

  // Sensör tetikleyicili otomasyonlar (trigger.type === 'sensor', value = cihaz anahtarı):
  // sensörün gerçek "kapalı → açık" geçişinde çalışır. Zaman tetikleyicilerinden farklı olarak
  // günde bir kez sınırı yoktur; yinelemeyi sensör başına 60 sn aralığı sınırlar.
  function readAutos() {
    var autos = [];
    try {
      autos =
        typeof readAndNormalizeItems === "function"
          ? readAndNormalizeItems("nexusCustomAutomations", "automation")
          : get("nexusCustomAutomations", []);
    } catch (e) {}
    return Array.isArray(autos) ? autos : [];
  }
  function runSensorAutomations(key) {
    readAutos().forEach(function (a) {
      if (!a || !a.id || a.enabled === false) return;
      var t = a.trigger || {};
      if (t.type === "sensor" && String(t.value) === key) executeAutomation(a);
    });
  }

  // Cihaz durumu tetikleyicisi (trigger.type === 'device', value = cihaz anahtarı,
  // event = 'on' | 'off' | 'any'): izlenen yerel ağ cihazının OKUNAN açık/kapalı durumu
  // değiştiğinde çalışır. İlk okuma yalnız başlangıçtır; okunamayan cihaz tetiklemez.
  // Cihazı bu uygulamadan açıp kapatmak da durum değişimidir ve tetikler.
  var deviceLast = {};
  function runDeviceAutomations(key, dir) {
    readAutos().forEach(function (a) {
      if (!a || !a.id || a.enabled === false) return;
      var t = a.trigger || {};
      if (t.type !== "device" || String(t.value) !== key) return;
      if (!t.event || t.event === "any" || t.event === dir) executeAutomation(a);
    });
  }

  function watchSensors(force) {
    var now = Date.now();
    if (sensorBusy || (!force && now - lastSensorPoll < SENSOR_EVERY_MS)) return Promise.resolve(0);
    var raw = get("nexusPairedDevices", []);
    var hasLan =
      Array.isArray(raw) &&
      raw.some(function (d) {
        return d && d.host && d.protocol && d.protocol !== "unknown";
      });
    if (!hasLan) return Promise.resolve(0);
    lastSensorPoll = now;
    sensorBusy = true;
    return new Promise(function (resolve) {
      ensureEngine(resolve);
    })
      .then(function () {
        if (!window.NX || !NX.refreshFromDevice || !NX.kindOf || !NX.isLan) return 0;
        var jobs = [];
        var devTrig = {};
        readAutos().forEach(function (a) {
          var t = a && a.enabled !== false && a.trigger;
          if (t && t.type === "device" && t.value) devTrig[String(t.value)] = true;
        });
        NX.readDevices().forEach(function (d, i) {
          if (!d || !NX.isLan(d)) return;
          var kind = NX.kindOf(d);
          var key = String(d.id || d.host + "|" + d.name);
          var isSensor = !!SENSOR_KINDS[kind];
          var isDevTrig = !!devTrig[key];
          if (!isSensor && !isDevTrig) return;
          jobs.push(
            NX.refreshFromDevice(i).then(function (st) {
              if (!st) return 0;
              var fired = 0;
              if (isSensor && typeof st.active === "boolean") {
                var prev = sensorLast[key];
                if (
                  prev &&
                  prev.active === false &&
                  st.active === true &&
                  Date.now() - (prev.t || 0) >= SENSOR_GAP_MS
                ) {
                  var ev = sensorEvent(kind, d.name || tr("Sensör", "Sensor"));
                  logEvent(
                    ev.type,
                    ev.title,
                    ev.detail,
                    "sensor-" + key.replace(/[^a-z0-9]+/gi, "") + "-" + Date.now(),
                  );
                  runSensorAutomations(key);
                  fired = 1;
                }
                sensorLast[key] = {
                  active: st.active,
                  t: fired ? Date.now() : (prev && prev.t) || 0,
                };
              }
              if (isDevTrig && typeof st.switch === "boolean") {
                var before = deviceLast[key];
                if (before !== undefined && before !== st.switch) {
                  runDeviceAutomations(key, st.switch ? "on" : "off");
                  fired += 1;
                }
                deviceLast[key] = st.switch;
              }
              return fired;
            }),
          );
        });
        return Promise.all(jobs).then(function (r) {
          return r.reduce(function (a, b) {
            return a + b;
          }, 0);
        });
      })
      .then(
        function (n) {
          sensorBusy = false;
          return n;
        },
        function () {
          sensorBusy = false;
          return 0;
        },
      );
  }

  // ---- hava durumu tetikleyicisi (trigger.type === 'weather') ----
  // trigger = { type:'weather', metric:'temp'|'wind'|'rain', op:'above'|'below', value:<sayı> }
  // Birimler Open-Meteo "current" değerleridir: sıcaklık °C, rüzgâr km/sa, yağış mm (son saat).
  // Veri yalnız ev konumu (nexusWeatherCoords) kayıtlıysa ve Open-Meteo'dan gerçekten
  // okunabiliyorsa kullanılır; konum yoksa ya da okuma başarısızsa hiçbir şey tetiklenmez
  // (uydurma okuma yok). Ölçüt "sağlanmıyor → sağlanıyor" geçişinde bir kez çalışır;
  // ilk okuma yalnız başlangıç durumudur.
  var WEATHER_EVERY_MS = 10 * 60 * 1000;
  var WEATHER_FIELDS = { temp: "temperature_2m", wind: "wind_speed_10m", rain: "precipitation" };
  var weatherLast = {};
  var lastWeatherPoll = 0;
  var weatherBusy = false;

  function weatherMet(t, reading) {
    var f = WEATHER_FIELDS[t && t.metric];
    var v = f && reading ? Number(reading[f]) : NaN;
    var th = Number(t && t.value);
    if (!isFinite(v) || !isFinite(th) || t.value === "" || t.value === null) return null;
    if (t.op === "above") return v > th;
    if (t.op === "below") return v < th;
    return null;
  }

  function watchWeather(force) {
    var now = Date.now();
    if (weatherBusy || (!force && now - lastWeatherPoll < WEATHER_EVERY_MS))
      return Promise.resolve(0);
    var rules = readAutos().filter(function (a) {
      return a && a.id && a.enabled !== false && a.trigger && a.trigger.type === "weather";
    });
    if (!rules.length) return Promise.resolve(0);
    var coords = get("nexusWeatherCoords", null);
    if (!coords || !isFinite(coords.lat) || !isFinite(coords.lon)) {
      rules.forEach(function (a) {
        if (!runInfo(a.id + ":nocoords")) {
          markRun(a.id + ":nocoords");
          logEvent(
            "automation",
            a.title,
            tr(
              "Hava durumu tetikleyicisi: ev konumu seçilmedi.",
              "Weather trigger: no home location set.",
            ),
          );
        }
      });
      return Promise.resolve(0);
    }
    lastWeatherPoll = now;
    weatherBusy = true;
    var url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      coords.lat +
      "&longitude=" +
      coords.lon +
      "&current=temperature_2m,wind_speed_10m,precipitation";
    return Promise.resolve()
      .then(function () {
        return fetch(url);
      })
      .then(function (r) {
        if (!r.ok) throw new Error("http");
        return r.json();
      })
      .then(function (data) {
        var cur = data && data.current;
        var fired = 0;
        rules.forEach(function (a) {
          var met = weatherMet(a.trigger, cur);
          if (met === null) return;
          var before = weatherLast[a.id];
          weatherLast[a.id] = met;
          if (before === false && met === true) {
            executeAutomation(a);
            fired++;
          }
        });
        return fired;
      })
      .then(
        function (n) {
          weatherBusy = false;
          return n;
        },
        function () {
          weatherBusy = false;
          return 0;
        },
      );
  }

  function tick() {
    heartbeat();
    if (isOwner) {
      evaluate();
      watchSensors();
      watchWeather();
    }
  }

  function start() {
    tick();
    setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tick();
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) tick();
    });
    window.addEventListener("storage", function (e) {
      // Kalp atışı başka bir sekme/pencereden güncellendiyse sahipliği yeniden değerlendir
      if (e.key && e.key.indexOf(BEAT_KEY) !== -1) setTimeout(tick, 300);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  window.NexusAutomationEngine = {
    platform: platform,
    isOwner: function () {
      return isOwner;
    },
    evaluate: function () {
      heartbeat();
      if (isOwner) evaluate();
      return isOwner;
    },
    watchSensors: watchSensors,
    watchWeather: watchWeather,
    sunsetTime: sunsetTime,
    sunriseTime: sunriseTime,
    // Test/denemek için: kuralı sahtesiz hemen çalıştırır (günlüğe "elle" yazar)
    runNow: function (id) {
      var autos = get("nexusCustomAutomations", []);
      var item = autos.find(function (a) {
        return a && a.id === id;
      });
      if (item) {
        executeAutomation(item);
        return true;
      }
      return false;
    },
  };
})();
