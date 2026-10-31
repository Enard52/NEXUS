// Akıllı Senaryolar sayfası (nexus-skills.html): tetikleyici seçimi, senaryo/otomasyon oluşturma, Hızlı Öneriler.
// Satır içi script sınırı nedeniyle ayrı dosyadır (pair-page.js / household-page.js gibi). Sayfanın sonunda yüklenir.
  (function () {
    var TYPE = new URLSearchParams(location.search).get('type') === 'clickrun' ? 'clickrun' : 'automation';
    var KEY = TYPE === 'clickrun' ? 'nexusCustomClickRun' : 'nexusCustomAutomations';
    var TAB = TYPE === 'clickrun' ? 'tab-clickrun' : 'tab-automation';
    var QS = window.nexusQuickScenes;
    // Tetikleyici türü (kart başlığından).
    var TRIGGER_KINDS = {
      'Cihaz Durumu': 'device', 'Zamanlayıcı': 'time', 'Gün Doğumu / Batımı': 'time', 'Hava Durumu': 'weather',
      'Konum': 'location', 'Güvenlik Modu': 'security', 'Alarm Tetiklendiğinde': 'sensor',
      'Hareket Algılandığında': 'sensor', 'Kapı veya Pencere Açıldığında': 'sensor'
    };
    // Sensör tetikleyicilerinde yalnızca o türdeki sensörler listelenir.
    var SENSOR_FILTER = { 'Hareket Algılandığında': 'motion', 'Kapı veya Pencere Açıldığında': 'contact', 'Alarm Tetiklendiğinde': 'alarm' };
    var SENSOR_NAMES = { motion: 'hareket sensörü', contact: 'kapı/pencere sensörü', alarm: 'duman, su ya da gaz sensörü' };
    var SENSOR_KINDS = { motion: 1, contact: 1, alarm: 1 };

    // Cihaz/sensör gerektiren kartlar, uygun cihaz yoksa hiç gösterilmez (basılamayan kart yok); Konum yalnız mobilde.
    (function bindTriggerTiles() {
      var all = [];
      try { all = NX.readDevices().filter(function (d) { return NX.isLan(d); }); } catch (e) { all = []; }
      var has = {
        switch: all.some(function (d) { return NX.hasCap(d, 'switch'); }),
        motion: all.some(function (d) { return NX.kindOf(d) === 'motion'; }),
        contact: all.some(function (d) { return NX.kindOf(d) === 'contact'; }),
        alarm: all.some(function (d) { return NX.kindOf(d) === 'alarm'; }),
        native: window.nexusLocationTrigger.isNative()
      };
      var shownDeviceTiles = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.qs-trig[data-trigger]'), function (b) {
        var need = b.getAttribute('data-need');
        var ok = !need || has[need];
        b.classList.toggle('hidden', !ok);
        if (ok && b.closest('#trigger-group-devices')) shownDeviceTiles++;
        b.addEventListener('click', function () {
          window.openConfigureSheet(b.getAttribute('data-trigger'), b.getAttribute('data-desc'), b.getAttribute('data-icon'), b.getAttribute('data-cc'), b.getAttribute('data-bg'));
        });
      });
      var note = document.getElementById('trigger-devices-note');
      if (note) note.classList.toggle('hidden', shownDeviceTiles > 0);
      // Hızlı Oluştur kartı: yalnız cihazlara uyan, saatli hazır öneri varsa
      var qc = document.getElementById('quick-create-card');
      var sugg = window.nexusQuickScenes ? window.nexusQuickScenes.available().filter(function (s) { return !!s.time; }) : [];
      if (qc) qc.classList.toggle('hidden', !sugg.length);
    })();
    var TIME_PRESETS = [['sunrise', 'Gündoğumu'], ['07:00', 'Sabah 07:00'], ['sunset', 'Gün batımı'], ['19:00', 'Akşam 19:00'], ['23:00', 'Gece 23:00']];
    var REPEATS = [['daily', 'Her gün'], ['weekdays', 'Hafta içi'], ['weekends', 'Hafta sonu']];

    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function toast(m, t) { if (window.nexusToast) window.nexusToast(m, { type: t || 'info' }); }
    function icons() { if (typeof lucide !== 'undefined') lucide.createIcons(); }
    function sensorKey(d) { return String(d.id || (d.host + '|' + d.name)); }
    function readDevices() { try { return NX.readDevices(); } catch (e) { return []; } }
    function chip(attr, val, label, on) {
      return '<button type="button" class="qs-chip' + (on ? ' is-on' : '') + '" ' + attr + '="' + esc(val) + '">' + label + '</button>';
    }
    // Uygun senaryo yokken boş durum: kaydet düğmesi yerine dürüst bir sonraki adım (cihaz ekle).
    var NO_SUGGESTION = '<div class="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm"><div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4C7DFF]/10 text-[#4C7DFF]"><i class="w-7 h-7" data-lucide="sparkles"></i></div><h4 class="text-base font-extrabold text-slate-900">Öneri hazır değil</h4><p class="mt-2 text-sm text-slate-500">Cihaz eklenince hızlı oluşturma önerileri burada görünecek.</p>' +
      '<a href="nexus-pair.html" class="qs-link-btn" style="margin-top:16px"><i data-lucide="plus"></i>Cihaz ekle</a></div>';

    // Tam ekran görünümler quick-scenes.js'te; kayıttan sonra açık görünümün geçmiş adımı yerine geçilir.
    var openSheet = QS.openScreen, closeSheet = QS.closeScreen;
    function finish() { var url = 'nexus-smart.html?tab=' + TAB; if (QS.screens.current) location.replace(url); else location.href = url; }

    // ---------- Tetikleyici ayar sayfası ----------
    var S = null;
    var pending = null;
    var devices = [];

    function fresh(kind) {
      return { kind: kind, scene: null, timeMode: 'preset', time: '07:00', customTime: '07:00', timeTouched: false, repeat: 'daily',
        device: null, event: 'any', sensor: null, sensorKind: null, sunOnly: false, dev: { name: null, value: true },
        secmode: 'away', loc: window.nexusLocationTrigger.fresh(), weather: { metric: 'temp', op: 'above', value: '' } };
    }
    function isSun() { return S.kind === 'time' && S.timeMode === 'preset' && (S.time === 'sunrise' || S.time === 'sunset'); }
    function timeValue() { return S.timeMode === 'custom' ? S.customTime : S.time; }
    function coords() {
      try { var c = JSON.parse(nexusGetItem('nexusWeatherCoords') || 'null'); return c && isFinite(c.lat) && isFinite(c.lon) ? c : null; } catch (e) { return null; }
    }
    function switchable() { return devices.filter(function (d) { return NX.isLan(d) && NX.hasCap(d, 'switch'); }); }
    function sensors() {
      return devices.filter(function (d) { var k = NX.kindOf(d); return NX.isLan(d) && SENSOR_KINDS[k] && (!S.sensorKind || S.sensorKind === k); });
    }
    function sectionHtml(step, label, inner) {
      return '<section class="qs-section"><div class="qs-label"><span class="qs-step">' + step + '</span>' + label + '</div>' + inner + '</section>';
    }
    function link(href, text) { return '<a href="' + href + '">' + text + '</a>'; }

    function triggerHtml() {
      var k = S.kind;
      if (k === 'security') return window.nexusSecurityMode.triggerHtml(S.secmode);
      if (k === 'location') return window.nexusLocationTrigger.triggerHtml(S.loc);
      if (k === 'time') {
        // Gün doğumu/batımı ev konumundan hesaplanır: konum yoksa kurulamaz (motor da çalıştırmaz).
        if (S.sunOnly && !coords()) return '<div class="qs-note">Gün doğumu ve batımı ev konumuna göre hesaplanır; ev konumu seçilmedi. Önce ' + link('nexus-map.html', 'konum seç') + '; sonra bu tetikleyiciyi kurabilirsin.</div>';
        var presets = S.sunOnly ? TIME_PRESETS.filter(function (p) { return p[0] === 'sunrise' || p[0] === 'sunset'; }) : TIME_PRESETS;
        var h = '<div class="qs-chips">' + presets.map(function (p) { return chip('data-time', p[0], p[1], S.timeMode === 'preset' && S.time === p[0]); }).join('') +
          (S.sunOnly ? '' : chip('data-time', 'custom', 'Saat seç', S.timeMode === 'custom')) + '</div>';
        if (isSun() && !coords()) h += '<div class="qs-note" style="margin-top:10px">Gün doğumu/batımı için ev konumu gerekir. ' + link('nexus-map.html', 'Konum seç') + '</div>';
        if (S.timeMode === 'custom') h += '<div class="qs-row2"><input type="time" class="qs-input" id="qs-time" value="' + esc(S.customTime) + '"></div>';
        h += '<div class="qs-chips" style="margin-top:10px">' + REPEATS.map(function (r) { return chip('data-repeat', r[0], r[1], S.repeat === r[0]); }).join('') + '</div>' +
          '<p class="qs-sub" style="margin:10px 0 0">Zamanlamalar uygulama açıkken (masaüstünde tepsideyken de) çalışır.</p>';
        return h;
      }
      if (k === 'device') {
        var sw = switchable();
        if (!sw.length) return '<div class="qs-note">Yerel ağa eşli, açılıp kapanabilen cihaz yok. Önce ' + link('nexus-pair.html', 'bir cihaz ekle') + '; sonra bu tetikleyiciyi kurabilirsin.</div>';
        return '<p class="qs-sub">Cihazın açık/kapalı durumu uygulama açıkken yaklaşık 30 sn\'de bir okunur; değişince çalışır.</p><div class="qs-chips">' +
          sw.map(function (d) { var key = sensorKey(d); return '<button type="button" class="qs-chip' + (S.device && S.device.key === key ? ' is-on' : '') + '" data-device="' + esc(key) + '" data-name="' + esc(d.name || 'Cihaz') + '">' + NX.thumbHtml(d) + esc(d.name || 'Cihaz') + '</button>'; }).join('') +
          '</div><div class="qs-chips" style="margin-top:10px">' +
          [['on', 'Açıldığında'], ['off', 'Kapandığında'], ['any', 'Durumu değişince']].map(function (o) { return chip('data-event', o[0], o[1], S.event === o[0]); }).join('') + '</div>';
      }
      if (k === 'sensor') {
        var se = sensors();
        if (!se.length) return '<div class="qs-note">Yerel ağa eşli ' + (SENSOR_NAMES[S.sensorKind] || 'sensör') + ' yok. Önce ' + link('nexus-pair.html', 'bir sensör ekle') + '; sonra bu tetikleyiciyi kurabilirsin.</div>';
        return '<p class="qs-sub">Sensör kapalıdan açığa geçince çalışır (uygulama açıkken, yaklaşık 30 sn\'de bir okunur).</p><div class="qs-chips">' +
          se.map(function (d) { var key = sensorKey(d); return '<button type="button" class="qs-chip' + (S.sensor && S.sensor.key === key ? ' is-on' : '') + '" data-sensor="' + esc(key) + '" data-name="' + esc(d.name || 'Sensör') + '">' + NX.thumbHtml(d) + esc(d.name || 'Sensör') + '</button>'; }).join('') + '</div>';
      }
      // weather
      if (!coords()) return '<div class="qs-note">Ev konumu seçilmedi, hava verisi okunamaz. Önce ' + link('nexus-map.html', 'konum seç') + '; sonra bu tetikleyiciyi kurabilirsin.</div>';
      return '<p class="qs-sub">Ev konumunun gerçek hava verisi yaklaşık 10 dk\'da bir okunur; koşul sağlanır hale gelince senaryo bir kez çalışır.</p><div class="qs-chips">' +
        [['temp', 'Sıcaklık (°C)'], ['wind', 'Rüzgâr (km/sa)'], ['rain', 'Yağış (mm)']].map(function (m) { return chip('data-metric', m[0], m[1], S.weather.metric === m[0]); }).join('') +
        '</div><div class="qs-chips" style="margin-top:10px">' +
        [['above', 'Üstüne çıkınca'], ['below', 'Altına inince']].map(function (o) { return chip('data-op', o[0], o[1], S.weather.op === o[0]); }).join('') +
        '</div><div class="qs-row2"><input class="qs-input" id="qs-wval" type="number" step="any" inputmode="decimal" placeholder="Eşik değer" value="' + esc(S.weather.value) + '"></div>';
    }

    // Yalnızca eşleşmiş cihazlara gerçekten uygulanabilen senaryolar listelenir; uygun olmayanlar gizlenir.
    // Tek cihaz kontrolü: seçilen yerel ağ cihazını aç/kapat (otomasyon motoru { name, field, value } adımını çalıştırır).
    function deviceActionHtml() {
      var sw = switchable();
      if (!sw.length) return '';
      var on = S.scene === 'device';
      var h = '<button type="button" class="qs-choice' + (on ? ' is-on' : '') + '" data-scene="device">' +
        '<span class="qs-ico" style="background:#4C7DFF1f;color:#4C7DFF"><i data-lucide="power"></i></span>' +
        '<span class="qs-body"><span class="qs-title">Bir cihazı aç ya da kapat</span><span class="qs-meta">Seçtiğin tek cihaza komut gönderir.</span></span><span class="qs-radio"></span></button>';
      if (on) {
        h += '<div class="qs-preview"><h5>Hangi cihaz?</h5><div class="qs-chips">' +
          sw.map(function (d) { return chip('data-devact', d.name || 'Cihaz', NX.thumbHtml(d) + esc(d.name || 'Cihaz'), S.dev.name === (d.name || 'Cihaz')); }).join('') +
          '</div><h5 style="margin-top:12px">Ne yapsın?</h5><div class="qs-chips">' +
          chip('data-devval', 'on', 'Açılsın', S.dev.value === true) + chip('data-devval', 'off', 'Kapansın', S.dev.value === false) + '</div></div>';
      }
      return h;
    }
    function deviceActionTitle() { return S.dev.name + (S.dev.value ? ' açılsın' : ' kapansın'); }

    function sceneHtml() {
      var avail = QS ? QS.available() : [];
      var h = '';
      if (!avail.length && !switchable().length && TYPE === 'clickrun') return NO_SUGGESTION;
      avail.forEach(function (s) {
        var on = S.scene === s.id;
        var names = s.devices.map(function (d) { return d.name; });
        h += '<button type="button" class="qs-choice' + (on ? ' is-on' : '') + '" data-scene="' + esc(s.id) + '">' +
          '<span class="qs-ico" style="background:' + s.hex + '1f;color:' + s.hex + '"><i data-lucide="' + esc(s.icon) + '"></i></span>' +
          '<span class="qs-body"><span class="qs-title">' + esc(s.title) + '</span><span class="qs-meta">' + esc(s.desc) + '</span>' +
          '<span class="qs-thumbs">' + s.devices.slice(0, 4).map(function (d) { return d.thumb; }).join('') + '</span>' +
          '<span class="qs-meta" style="font-weight:700">' + s.affected + ' cihaz · ' + esc(names.slice(0, 2).join(', ') + (names.length > 2 ? ' +' + (names.length - 2) : '')) + '</span></span>' +
          '<span class="qs-radio"></span></button>';
        if (on) h += '<div class="qs-preview"><h5>Çalışınca ne olur</h5><ul>' + s.devices.map(function (d) {
          return '<li><span class="qs-devname">' + d.thumb + esc(d.name) + '</span><span>' + esc(d.text) + '</span></li>';
        }).join('') + '</ul></div>';
      });
      h += deviceActionHtml();
      if (TYPE === 'automation') {
        h += window.nexusSecurityMode.actionChoices(S.scene);
        h += '<button type="button" class="qs-choice' + (S.scene === 'notify' ? ' is-on' : '') + '" data-scene="notify">' +
          '<span class="qs-ico" style="background:#64748b1f;color:#64748b"><i data-lucide="bell-ring"></i></span>' +
          '<span class="qs-body"><span class="qs-title">Yalnızca bildirim</span><span class="qs-meta">Cihazlara dokunmaz, sadece haber verir.</span></span><span class="qs-radio"></span></button>';
        if (!avail.length) h = '<div class="qs-note" style="margin-bottom:10px">Eşleşmiş cihazlarına uyan hazır senaryo yok. ' + link('nexus-pair.html', 'Cihaz ekle') + '</div>' + h;
      }
      return h;
    }

    function problem() {
      if (TYPE === 'automation') {
        if (S.kind === 'location') { var lp = window.nexusLocationTrigger.problem(); if (lp) return lp; }
        if (S.kind === 'device') { if (!switchable().length) return 'Bu tetikleyici için eşleşmiş cihaz yok.'; if (!S.device) return 'İzlenecek cihazı seç.'; }
        if (S.kind === 'sensor') { if (!sensors().length) return 'Bu tetikleyici için eşleşmiş sensör yok.'; if (!S.sensor) return 'Tetikleyen sensörü seç.'; }
        if (S.kind === 'weather') {
          if (!coords()) return 'Önce ev konumunu seç.';
          var v = S.weather.value;
          if (v === '' || !isFinite(Number(v))) return 'Bir eşik değer gir.';
        }
        if (isSun() && !coords()) return 'Önce ev konumunu seç.';
      }
      if (S.scene === 'device' && !S.dev.name) return 'Kontrol edilecek cihazı seç.';
      return S.scene ? '' : 'Ne yapacağını seç.';
    }
    // Tetikleyici bu cihazlarla hiç kurulamıyorsa (cihaz/sensör/konum yok) kaydet düğmesi gösterilmez;
    // boş durum notu bir sonraki adımı söyler.
    function impossible() {
      if (TYPE !== 'automation') return false;
      if (S.kind === 'device') return !switchable().length;
      if (S.kind === 'sensor') return !sensors().length;
      if (S.kind === 'weather') return !coords();
      if (S.sunOnly) return !coords();
      return false;
    }
    // Düğme hiçbir zaman soluk/gri değildir: eksik seçim varsa altında yazar, dokununca da söyler.
    function refresh() {
      document.getElementById('config-foot').style.display = impossible() ? 'none' : '';
      document.getElementById('config-hint').textContent = problem();
    }
    function render() {
      var scroller = document.getElementById('config-scroll');
      var top = scroller.scrollTop;
      var h = '';
      if (TYPE === 'automation') h += sectionHtml(1, 'Ne zaman çalışsın?', triggerHtml());
      if (!impossible()) h += sectionHtml(TYPE === 'automation' ? 2 : 1, 'Ne yapsın?', sceneHtml());
      document.getElementById('config-options').innerHTML = h;
      scroller.scrollTop = top;
      icons();
      refresh();
      if (S.kind === 'location' && TYPE === 'automation') window.nexusLocationTrigger.fillStatus();
    }

    window.openConfigureSheet = function (title, desc, icon, colorClass, bgClass) {
      pending = { title: title, desc: desc, icon: icon, colorClass: colorClass, bgClass: bgClass };
      devices = readDevices();
      S = fresh(TRIGGER_KINDS[title] || 'time');
      S.sensorKind = SENSOR_FILTER[title] || null;
      if (title === 'Gün Doğumu / Batımı') { S.sunOnly = true; S.time = 'sunset'; S.timeMode = 'preset'; S.timeTouched = true; }
      document.getElementById('config-sheet-title').textContent = title;
      document.getElementById('config-sheet-desc').textContent = desc;
      document.getElementById('config-sheet-icon-wrap').className = 'qs-hero-ico ' + colorClass + ' ' + bgClass;
      var iconEl = document.getElementById('config-sheet-icon');
      iconEl.className = '';
      iconEl.setAttribute('data-lucide', icon);
      document.getElementById('config-scroll').scrollTop = 0;
      render();
      openSheet('configure');
    };
    window.closeConfigureSheet = function () { closeSheet('configure'); pending = null; };

    document.getElementById('config-options').addEventListener('click', function (ev) {
      var t = ev.target.closest('button');
      if (!t || !S) return;
      if (t.hasAttribute('data-scene')) {
        S.scene = t.getAttribute('data-scene');
        // Senaryonun önerilen saati varsa, saati elle seçmediysen kendiliğinden dolar.
        var m = TYPE === 'automation' && S.kind === 'time' && !S.timeTouched && QS ? QS.metaFor(S.scene) : null;
        if (m && m.time) {
          if (TIME_PRESETS.some(function (p) { return p[0] === m.time.value; })) { S.timeMode = 'preset'; S.time = m.time.value; }
          else { S.timeMode = 'custom'; S.customTime = m.time.value; }
          S.repeat = m.time.repeat;
        }
      } else if (t.hasAttribute('data-time')) {
        S.timeTouched = true;
        var v = t.getAttribute('data-time');
        if (v === 'custom') S.timeMode = 'custom'; else { S.timeMode = 'preset'; S.time = v; }
      } else if (t.hasAttribute('data-repeat')) { S.timeTouched = true; S.repeat = t.getAttribute('data-repeat'); }
      else if (t.hasAttribute('data-device')) S.device = { key: t.getAttribute('data-device'), name: t.getAttribute('data-name') };
      else if (t.hasAttribute('data-event')) S.event = t.getAttribute('data-event');
      else if (t.hasAttribute('data-sensor')) S.sensor = { key: t.getAttribute('data-sensor'), name: t.getAttribute('data-name') };
      else if (t.hasAttribute('data-devact')) S.dev.name = t.getAttribute('data-devact');
      else if (t.hasAttribute('data-devval')) S.dev.value = t.getAttribute('data-devval') === 'on';
      else if (t.hasAttribute('data-locev')) S.loc.event = t.getAttribute('data-locev');
      else if (t.hasAttribute('data-locrad')) S.loc.radius = Number(t.getAttribute('data-locrad'));
      else if (t.hasAttribute('data-locperm')) { window.nexusLocationTrigger.requestPermission().then(render); return; }
      else if (t.hasAttribute('data-secmode')) S.secmode = t.getAttribute('data-secmode');
      else if (t.hasAttribute('data-setmode')) window.nexusSecurityMode.set(t.getAttribute('data-setmode'));
      else if (t.hasAttribute('data-metric')) S.weather.metric = t.getAttribute('data-metric');
      else if (t.hasAttribute('data-op')) S.weather.op = t.getAttribute('data-op');
      else return;
      render();
      // Seçilen senaryonun "Çalışınca ne olur" kutusu kaydet çubuğunun altında kesik kalmasın.
      var scroller = document.getElementById('config-scroll'), pv = scroller.querySelector('.qs-preview');
      if (pv && t.hasAttribute('data-scene')) {
        var over = pv.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom;
        if (over > 0) scroller.scrollTop += over + 12;
      }
    });
    document.getElementById('config-options').addEventListener('input', function (ev) {
      if (!S) return;
      if (ev.target.id === 'qs-time') { S.timeTouched = true; S.customTime = ev.target.value || S.customTime; }
      else if (ev.target.id === 'qs-wval') S.weather.value = ev.target.value;
      refresh();
    });

    function buildTrigger() {
      if (TYPE === 'clickrun') return { type: 'manual' };
      if (S.kind === 'time') return { type: 'time', value: timeValue(), repeat: S.repeat };
      if (S.kind === 'device') return { type: 'device', value: S.device.key, label: S.device.name, event: S.event };
      if (S.kind === 'sensor') return { type: 'sensor', value: S.sensor.key, label: S.sensor.name, event: 'active' };
      if (S.kind === 'security') return { type: 'security', value: S.secmode };
      if (S.kind === 'location') return { type: 'location', event: S.loc.event, radius: S.loc.radius };
      return { type: 'weather', metric: S.weather.metric, op: S.weather.op, value: Number(S.weather.value), label: 'weather' };
    }
    function triggerSummary() {
      if (S.kind === 'time') {
        var v = timeValue();
        var base = v === 'sunrise' ? 'Gündoğumu' : v === 'sunset' ? 'Gün batımı' : v;
        return REPEATS.filter(function (r) { return r[0] === S.repeat; })[0][1].toLowerCase() + ' ' + base;
      }
      if (S.kind === 'device') return S.device.name + ({ on: ' açılınca', off: ' kapanınca', any: ' değişince' }[S.event]);
      if (S.kind === 'sensor') return S.sensor.name + ' algılayınca';
      if (S.kind === 'security') return window.nexusSecurityMode.whenLabel(S.secmode);
      if (S.kind === 'location') return window.nexusLocationTrigger.summary(S.loc);
      return ({ temp: 'Sıcaklık', wind: 'Rüzgâr', rain: 'Yağış' }[S.weather.metric]) + (S.weather.op === 'above' ? ' üstüne çıkınca' : ' altına inince');
    }
    window.confirmAddAutomation = function () {
      var p = problem();
      if (p) { toast(p, 'error'); return; }
      var sm = /^secmode:(home|away|night)$/.exec(S.scene || '');
      var smLabel = sm ? window.nexusSecurityMode.actionLabel(sm[1]) : '';
      var dev = S.scene === 'device';
      var sceneId = S.scene === 'notify' || sm || dev ? null : S.scene;
      var scene = sceneId ? NX.SCENES[sceneId] : null;
      var what = scene ? scene.title : sm ? smLabel : dev ? deviceActionTitle() : 'bildirim';
      var desc = TYPE === 'automation' ? triggerSummary() + ' · ' + what : QS.descFor(sceneId);
      QS.save(TYPE, sceneId, {
        actions: sm ? [{ kind: 'security-mode', value: sm[1] }] : dev ? [{ name: S.dev.name, field: 'switch', value: S.dev.value }] : [],
        title: scene ? scene.title : sm ? smLabel : dev ? deviceActionTitle() : pending.title,
        desc: desc,
        trigger: buildTrigger(),
        icon: sceneId ? undefined : dev ? 'power' : pending.icon
      });
      finish();
    };

    // ---------- Hızlı Öneriler ----------
    function existingItems() { try { return readAndNormalizeItems(KEY, TYPE); } catch (e) { return []; } }
    function alreadyAdded(items, s) {
      return items.some(function (i) {
        if (i.sceneId !== s.id) return false;
        return TYPE === 'clickrun' || (i.trigger && s.time && i.trigger.type === 'time' && i.trigger.value === s.time.value && i.trigger.repeat === s.time.repeat);
      });
    }
    function quickList() {
      var list = document.getElementById('quick-create-list');
      var sugg = QS ? QS.available().filter(function (s) { return TYPE === 'clickrun' || s.time; }) : [];
      if (!sugg.length) { list.innerHTML = NO_SUGGESTION; icons(); return; }
      var items = existingItems();
      list.innerHTML = sugg.map(function (s) {
        var done = alreadyAdded(items, s);
        var meta = (s.time && TYPE === 'automation' ? s.time.label + ' · ' : '') + s.affected + ' cihaz';
        return '<div class="qs-sugg"><span class="qs-ico" style="background:' + s.hex + '1f;color:' + s.hex + '"><i data-lucide="' + esc(s.icon) + '"></i></span>' +
          '<span class="qs-body"><span class="qs-title">' + esc(s.title) + '</span><span class="qs-meta">' + esc(meta) + '</span>' +
          '<span class="qs-meta">' + esc(s.desc) + '</span></span>' +
          (done ? '<span class="qs-done"><i data-lucide="check"></i>Ekli</span>'
            : '<button type="button" class="qs-link-btn" data-sugg="' + esc(s.id) + '"><i data-lucide="plus"></i>Ekle</button>') + '</div>';
      }).join('');
      icons();
    }
    document.getElementById('quick-create-list').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-sugg]');
      if (!b) return;
      var s = QS.available().filter(function (x) { return x.id === b.getAttribute('data-sugg'); })[0];
      if (!s) return;
      var t = TYPE === 'clickrun' ? { type: 'manual' } : { type: 'time', value: s.time.value, repeat: s.time.repeat };
      QS.save(TYPE, s.id, { title: s.title, desc: TYPE === 'clickrun' ? s.desc : s.time.label + ' · ' + s.title, trigger: t });
      finish();
    });
    window.toggleQuickCreate = function () {
      if (QS.screens.current === 'quick-create') { closeSheet('quick-create'); return; }
      devices = readDevices();
      quickList();
      openSheet('quick-create');
    };

    // ---------- Tıkla ve çalıştır: kendi sayfası (tetikleyici yok; tek dokunuşla çalışan senaryo) ----------
    if (TYPE === 'clickrun') {
      devices = readDevices();
      S = fresh('time');
      var main = document.querySelector('main');
      document.querySelector('header h1').textContent = 'Tıkla ve Çalıştır';
      main.className = 'flex-grow px-5 pt-4 pb-40 qs-wrap qs-form';
      main.innerHTML = '<div class="qs-screen-inner"><div class="text-center" style="margin-bottom:18px"><h2 class="text-2xl font-bold leading-tight tracking-tight mb-1">Yeni Senaryo</h2>' +
        '<p class="text-slate-500 text-sm">Tek dokunuşla eşleşmiş cihazlarında çalışacak bir senaryo seç.</p></div>' +
        '<div id="click-empty"></div>' +
        '<section class="qs-section" id="click-scene-card"><div class="qs-label"><span class="qs-step">1</span>Ne yapsın?</div><div id="click-scenes"></div></section>' +
        '<section class="qs-section" id="click-name-wrap"></section></div>';
      var bar = document.createElement('div');
      bar.className = 'qs-savebar qs-wrap';
      bar.innerHTML = '<button type="button" id="click-save" class="qs-save">Senaryoyu kaydet</button><p class="qs-hint" id="click-hint"></p>';
      document.body.appendChild(bar);
      var nameTouched = false, nameVal = '';
      var clickRender = function () {
        // Uygun senaryo ya da kontrol edilebilir cihaz yoksa kaydet düğmesi hiç gösterilmez; boş durum "Cihaz ekle" der.
        var avail = !!((QS && QS.available().length) || switchable().length);
        document.getElementById('click-empty').innerHTML = avail ? '' : NO_SUGGESTION;
        document.getElementById('click-scene-card').style.display = avail ? '' : 'none';
        bar.style.display = avail ? '' : 'none';
        document.getElementById('click-scenes').innerHTML = avail ? sceneHtml() : '';
        var wrap = document.getElementById('click-name-wrap');
        var has = !!S.scene && avail;
        wrap.style.display = has ? '' : 'none';
        if (has && !document.getElementById('qs-name')) {
          wrap.innerHTML = '<div class="qs-label"><span class="qs-step">2</span>Adı</div><input class="qs-input" id="qs-name" maxlength="40" value="">';
        }
        var nm = document.getElementById('qs-name');
        if (nm) { nm.placeholder = clickTitle(); if (!nameTouched) nm.value = ''; }
        document.getElementById('click-hint').textContent = avail ? problem() : '';
        icons();
      };
      var clickTitle = function () {
        if (S.scene === 'device') return S.dev.name ? deviceActionTitle() : '';
        return S.scene && NX.SCENES[S.scene] ? NX.SCENES[S.scene].title : '';
      };
      document.getElementById('click-scenes').addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-scene],[data-devact],[data-devval]');
        if (!t) return;
        if (t.hasAttribute('data-scene')) S.scene = t.getAttribute('data-scene');
        else if (t.hasAttribute('data-devact')) S.dev.name = t.getAttribute('data-devact');
        else S.dev.value = t.getAttribute('data-devval') === 'on';
        clickRender();
      });
      main.addEventListener('input', function (ev) {
        if (ev.target.id === 'qs-name') { nameTouched = true; nameVal = ev.target.value; }
      });
      document.getElementById('click-save').addEventListener('click', function () {
        var p = problem();
        if (p) { toast(p, 'error'); return; }
        var title = (nameVal || '').trim() || clickTitle();
        if (S.scene === 'device') {
          QS.save('clickrun', null, { title: title, desc: deviceActionTitle() + '.', trigger: { type: 'manual' },
            actions: [{ name: S.dev.name, field: 'switch', value: S.dev.value }], icon: 'power' });
        } else {
          QS.save('clickrun', S.scene, { title: title, desc: QS.descFor(S.scene), trigger: { type: 'manual' } });
        }
        finish();
      });
      clickRender();
    }
  })();
