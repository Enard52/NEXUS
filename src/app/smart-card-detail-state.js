(function () {
  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getItem(key) {
    try {
      if (typeof nexusGetItem === 'function') return nexusGetItem(key);
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function getDevices() {
    var merged = [];
    ['nexusPairedDevices', 'nexusLocalDevices', 'nexusDevices'].forEach(function (key) {
      var value = safeParse(getItem(key), []);
      if (Array.isArray(value)) merged = merged.concat(value);
    });
    if (typeof getLocalDevices === 'function') {
      try {
        var local = getLocalDevices();
        if (Array.isArray(local)) merged = merged.concat(local);
      } catch (e) {}
    }
    return merged;
  }

  function matchesDevice(device, keywords) {
    var text = [device && device.type, device && device.name, device && device.room, device && device.category, device && device.icon]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return keywords.some(function (keyword) {
      return text.indexOf(keyword) !== -1;
    });
  }

  function hasStoredData(keys) {
    return keys.some(function (key) {
      var raw = getItem(key);
      return raw !== null && raw !== undefined && raw !== '';
    });
  }

  function hasDevice(keywords) {
    if (!keywords || !keywords.length) return getDevices().length > 0;
    return getDevices().some(function (device) {
      return matchesDevice(device, keywords);
    });
  }

  var configs = {
    // Not: nexus-multi-video ve nexus-home-schedule kendi gerçek-veri
    // render'larını (kamera listesi / otomasyon programı) içerir; bu katman
    // o iki sayfada devre dışıdır.
    'nexus-room-scenes.html': {
      title: 'Oda sahnesi seçilmedi',
      text: 'Salon veya mutfak için sahne kaydedince bu sayfa dolacak.',
      icon: 'lucide:layout-dashboard',
      keys: ['nexusRoomScenesActive']
    },
    'nexus-guest-mode.html': {
      title: 'Misafir modu ayarlanmadı',
      text: 'Misafir ağı veya geçici erişim bilgisi olmadan hazır durum göstermiyoruz.',
      icon: 'lucide:users-2',
      keys: ['nexusGuestModeStatus']
    },
    'nexus-cleaning-start.html': {
      title: 'Temizlik cihazı yok',
      text: 'Robot süpürge eşleştirince oda ve rutin bilgileri burada görünecek.',
      icon: 'lucide:sparkles',
      deviceKeywords: ['robot', 'vacuum', 'supurge', 'süpürge', 'mop']
    },
    'nexus-leave-home-summary.html': {
      title: 'Çıkış özeti hazır değil',
      text: 'Kilit, ışık veya klima gibi cihazlar eklenince çıkış kontrolü oluşacak.',
      icon: 'lucide:door-open',
      deviceKeywords: []
    },
    'nexus-sleep-prep.html': {
      title: 'Uyku hazırlığı için uygun cihaz yok',
      text: 'Işık, perde, kilit veya iklim cihazı eklediğinde hazırlık burada listelenir.',
      icon: 'lucide:moon',
      keys: ['nexusHomeScheduleData'],
      deviceKeywords: ['thermostat', 'klima', 'climate', 'temperature']
    },
    'nexus-room-comfort.html': {
      title: 'Konfor verisi yok',
      text: 'Termostat ya da hava sensörü bağlanınca sıcaklık bilgisi burada görünecek.',
      icon: 'lucide:thermometer',
      keys: ['nexusAirQualityData'],
      deviceKeywords: ['thermostat', 'klima', 'climate', 'temperature']
    },
    'nexus-home-health.html': {
      title: 'Ev sağlığı ölçülmedi',
      text: 'Sensör veya cihaz verisi olmadan sağlık skoru üretmiyoruz.',
      icon: 'lucide:heart-pulse',
      keys: ['nexusAirQualityData'],
      deviceKeywords: []
    },
    'nexus-privacy-mode.html': {
      title: 'Kamera cihazı yok',
      text: 'Kamera eklediğinde gizlilik modu her kamera için burada görünür.',
      icon: 'lucide:eye-off',
      deviceKeywords: ['camera', 'kamera']
    },
    'nexus-account-security.html': {
      title: 'Güvenlik cihazı yok',
      text: 'Kilit, sensör veya kamera eklenince güvenlik özeti burada oluşacak.',
      icon: 'lucide:shield',
      deviceKeywords: ['lock', 'kilit', 'door', 'camera', 'kamera']
    }
  };

  function renderEmpty(config) {
    var main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = [
      '<section class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">',
      '<div class="w-20 h-20 rounded-[1.75rem] bg-[#4C7DFF]/10 text-[#4C7DFF] flex items-center justify-center mb-5">',
      '<i data-lucide="' + String(config.icon).replace(/^lucide:/, '') + '" class="w-9 h-9"></i>',
      '</div>',
      '<h2 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">' + config.title + '</h2>',
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-[270px]">' + config.text + '</p>',
      '<a href="nexus-pair.html" class="mt-6 inline-flex h-12 px-6 gap-2 items-center justify-center rounded-2xl bg-[#4C7DFF] text-white text-sm font-bold active:scale-95 transition-transform"><i data-lucide="plus" class="w-4 h-4"></i>Cihaz ekle</a>',
      '</section>'
    ].join('');
    // Veri/cihaz yokken alttaki eylem düğmesi (Başlat, Bitir, Tamamla…) gösterilmez; dürüst adım "Cihaz ekle".
    Array.prototype.forEach.call(document.querySelectorAll('footer'), function (f) { f.remove(); });
    // İkon kütüphanesi Iconify'dan Lucide'a taşındı; boş durum ikonunu da Lucide çizer.
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  // --- Gerçek cihaz verisinden çizilen sayfalar -----------------------------------------------------
  // Önceden bu sayfalar herhangi bir cihaz varken sabit örnek içerik gösteriyordu (82 skor, "4 ışık açık",
  // "klima çalışıyor", "kapılar kilitli"...). Artık yalnızca cihazların gerçek durumu ve okunmuş ölçümleri
  // gösterilir; okunmayan değer için hiçbir şey uydurulmaz.
  function loadEngine(cb) {
    if (window.NX && window.NX.readDevices) return cb();
    var files = ['supported-devices.js', 'lan-connectors.js', 'device-controls.js'].filter(function (f) {
      return !document.querySelector('script[src="' + f + '"]');
    });
    (function next() {
      if (!files.length) return cb();
      var el = document.createElement('script');
      el.src = files.shift();
      el.onload = next;
      el.onerror = next;
      document.head.appendChild(el);
    })();
  }

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function deviceRow(d, index, rightHtml) {
    var NX = window.NX;
    var st = NX.statusOf(d, index);
    return '<div class="bg-white dark:bg-slate-800 rounded-3xl p-4 flex items-center gap-4 nexus-shadow">' +
      '<img src="' + NX.imageUrl(d) + '" alt="" class="w-12 h-12 object-contain" onerror="this.style.visibility=\'hidden\'">' +
      '<div class="flex-1 min-w-0"><p class="text-[15px] font-bold text-slate-900 dark:text-white truncate">' + esc(d.name) + '</p>' +
      '<p class="text-xs font-medium text-slate-500 dark:text-slate-400">' + esc(st.text) + '</p></div>' + (rightHtml || '') + '</div>';
  }

  function sectionHtml(title, rows, emptyText) {
    return '<section class="space-y-3"><h3 class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">' + title + '</h3>' +
      (rows.length ? rows.join('') : '<p class="text-sm text-slate-500 dark:text-slate-400 pl-1">' + emptyText + '</p>') + '</section>';
  }

  function renderLeaveSummary() {
    var NX = window.NX; var main = document.querySelector('main'); if (!main || !NX) return;
    var devices = NX.readDevices();
    var openRows = [], secRows = [];
    devices.forEach(function (d, i) {
      var kind = NX.kindOf(d); var st = NX.stateOf(d);
      var powerKinds = { light: 1, ac: 1, media: 1, purifier: 1, switch: 1, energy: 1 };
      if (powerKinds[kind] && st.switch === true) {
        openRows.push(deviceRow(d, i, '<button type="button" data-off="' + i + '" class="py-2 px-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-[11px] font-bold active:scale-95 transition-transform">Kapat</button>'));
      }
      if (kind === 'lock' || kind === 'contact' || kind === 'motion' || kind === 'alarm' || kind === 'camera') secRows.push(deviceRow(d, i, ''));
    });
    main.innerHTML = '<div class="flex flex-col items-center text-center mt-2 mb-2"><h2 class="text-2xl font-extrabold tracking-tight">Çıkmadan önce</h2>' +
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Cihazlarının son bilinen durumu. Okunmayan bir değer varsa "Durum okunmadı" yazar.</p></div>' +
      '<div class="space-y-6">' +
      sectionHtml('AÇIK GÖRÜNEN CİHAZLAR', openRows, 'Açık görünen cihaz yok.') +
      sectionHtml('GÜVENLİK CİHAZLARI', secRows, 'Kilit, kapı sensörü veya kamera eklenmemiş.') + '</div>';
    Array.prototype.forEach.call(main.querySelectorAll('[data-off]'), function (b) {
      b.addEventListener('click', function () {
        try { NX.setField(parseInt(b.getAttribute('data-off'), 10), 'switch', false); } catch (e) {}
        renderLeaveSummary();
      });
    });
    var foot = document.querySelector('footer p'); if (foot) foot.remove();
  }

  function renderHomeHealth() {
    var NX = window.NX; var main = document.querySelector('main'); if (!main || !NX) return;
    var cards = [];
    NX.readDevices().forEach(function (d) {
      var st = NX.stateOf(d);
      var add = function (label, value) { cards.push('<div class="bg-white dark:bg-slate-800 rounded-3xl p-5 nexus-shadow"><span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">' + label + '</span>' +
        '<p class="text-xl font-bold mt-2">' + value + '</p><p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">' + esc(d.name) + '</p></div>'); };
      var num = function (v) { return typeof v === 'number' && isFinite(v); };
      if (num(st.temperature)) add('Isı', NX.fmtTemp(st.temperature));
      if (num(st.humidity)) add('Nem', '%' + st.humidity);
      if (num(st.pm25)) add('PM2.5', st.pm25 + ' µg/m³');
    });
    if (!cards.length) {
      renderEmpty({ title: 'Ölçüm verisi yok', text: 'Eklediğin cihazlar henüz sıcaklık, nem veya hava kalitesi verisi vermedi. Sensörün açık ve ağda olduğundan emin ol.', icon: 'lucide:heart-pulse' });
      return;
    }
    main.innerHTML = '<div class="text-center mt-2 mb-4"><h2 class="text-2xl font-extrabold tracking-tight">Son okunan ölçümler</h2>' +
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Skor üretmiyoruz; yalnızca cihazlardan okunan gerçek değerler gösterilir.</p></div>' +
      '<section class="grid grid-cols-2 gap-4">' + cards.join('') + '</section>';
  }

  function describeAct(a) {
    var f = a[0], v = a[1];
    switch (f) {
      case 'switch': return v ? 'Açılır' : 'Kapanır';
      case 'brightness': return 'Parlaklık %' + v;
      case 'tone': return v === 'warm' ? 'Sıcak ışık' : 'Işık tonu ayarlanır';
      case 'coverAction': return v === 'open' ? 'Açılır' : 'Kapanır';
      case 'target': return 'Hedef ' + v + '°';
      case 'profile': return v === 'eco' ? 'Eko modu' : 'Konfor modu';
      case 'locked': return 'Kilitlenir';
      case 'notify': return 'Bildirimler açılır';
      case 'sleep': return 'Uyku modu';
      case 'fan': return 'Fan otomatik';
      default: return null;
    }
  }

  // Senaryonun gerçekten uygulayacağı cihazlar (örnek/sabit liste yok)
  function sceneRows(sceneId) {
    var NX = window.NX; var rows = [];
    NX.readDevices().forEach(function (d, i) {
      var acts = NX.sceneActsOf(sceneId, d); if (!acts.length) return;
      var parts = [];
      acts.forEach(function (a) { var t = describeAct(a); if (t && parts.indexOf(t) === -1) parts.push(t); });
      rows.push({ d: d, i: i, text: parts.join(' · ') });
    });
    return rows;
  }
  function sceneRowHtml(r) {
    var NX = window.NX;
    return '<div class="bg-white dark:bg-slate-800 rounded-3xl p-4 flex items-center gap-4 nexus-shadow">' +
      '<img src="' + NX.imageUrl(r.d) + '" alt="" class="w-12 h-12 object-contain" onerror="this.style.visibility=\'hidden\'">' +
      '<div class="flex-1 min-w-0"><p class="text-[15px] font-bold text-slate-900 dark:text-white truncate">' + esc(r.d.name) + '</p>' +
      '<p class="text-xs font-medium text-slate-500 dark:text-slate-400">' + esc(r.text) + '</p></div></div>';
  }

  function renderSleepPrep() {
    var main = document.querySelector('main'); if (!main) return;
    var rows = sceneRows('sleep-prep');
    // Başlık zaten üst çubukta; sayfada ikinci kez tekrarlanmaz.
    main.innerHTML = '<div class="text-center mt-2 mb-4">' +
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Hazırlığı bitirdiğinde şu cihazlara uygulanır.</p></div>' +
      '<div class="space-y-3">' + rows.map(sceneRowHtml).join('') + '</div>';
  }

  function renderRoomComfort() {
    var NX = window.NX; var main = document.querySelector('main'); if (!main) return;
    var kinds = { ac: 1, thermostat: 1, climatesensor: 1, purifier: 1, airsensor: 1 };
    var rows = [];
    NX.readDevices().forEach(function (d, i) {
      if (!kinds[NX.kindOf(d)]) return;
      var st = NX.stateOf(d); var parts = [NX.statusOf(d, i).text];
      var num = function (v) { return typeof v === 'number' && isFinite(v); };
      if (num(st.temperature)) parts.push('Isı ' + NX.fmtTemp(st.temperature));
      if (num(st.humidity)) parts.push('Nem %' + st.humidity);
      if (num(st.pm25)) parts.push('PM2.5 ' + st.pm25);
      rows.push(sceneRowHtml({ d: d, text: parts.join(' · ') }));
    });
    main.innerHTML = '<div class="text-center mt-2 mb-4">' +
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400">İklim cihazlarının son bilinen durumu ve okunan ölçümler.</p></div>' +
      '<div class="space-y-3">' + rows.join('') + '</div>';
    // "Tümünü Optimize Et" yalnızca senaryonun uygulayacağı bir cihaz varsa gösterilir.
    if (NX.sceneAffected('comfort-room') <= 0) Array.prototype.forEach.call(document.querySelectorAll('footer'), function (f) { f.remove(); });
  }

  function renderPrivacy() {
    var NX = window.NX; var main = document.querySelector('main'); if (!main) return;
    var rows = [];
    NX.readDevices().forEach(function (d, i) {
      if (NX.kindOf(d) !== 'camera') return;
      var supported = NX.hasFeature(d, 'privacy');
      var on = NX.stateOf(d).privacy === true;
      var right = supported
        ? '<label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" data-priv="' + i + '" class="sr-only peer"' + (on ? ' checked' : '') + '>' +
          '<div class="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-[#4C7DFF] after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div></label>'
        : '<span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Desteklenmiyor</span>';
      rows.push('<div class="bg-white dark:bg-slate-800 rounded-3xl p-4 flex items-center gap-4 nexus-shadow">' +
        '<img src="' + NX.imageUrl(d) + '" alt="" class="w-12 h-12 object-contain" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="flex-1 min-w-0"><p class="text-[15px] font-bold text-slate-900 dark:text-white truncate">' + esc(d.name) + '</p>' +
        '<p class="text-xs font-medium text-slate-500 dark:text-slate-400">Gizlilik modu · ' + (supported ? (on ? 'Açık' : 'Kapalı') : 'bu kamera için ayarlanamıyor') + '</p></div>' + right + '</div>');
    });
    main.innerHTML = '<div class="text-center mt-2 mb-4"><h2 class="text-2xl font-extrabold tracking-tight">Kamera gizliliği</h2>' +
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Her kameranın gizlilik modunu ayrı ayrı yönet.</p></div><div class="space-y-3">' + rows.join('') + '</div>';
    Array.prototype.forEach.call(main.querySelectorAll('[data-priv]'), function (c) {
      c.addEventListener('change', function () {
        try { NX.setField(parseInt(c.getAttribute('data-priv'), 10), 'privacy', c.checked); } catch (e) {}
        renderPrivacy();
      });
    });
  }

  var renderers = {
    'nexus-privacy-mode.html': { fn: renderPrivacy, needs: function () {
      var NX = window.NX; return NX.readDevices().some(function (d) { return NX.kindOf(d) === 'camera'; });
    } },
    'nexus-leave-home-summary.html': { fn: renderLeaveSummary, needs: function () { return window.NX.readDevices().length > 0; } },
    'nexus-home-health.html': { fn: renderHomeHealth, needs: function () { return window.NX.readDevices().length > 0; } },
    'nexus-sleep-prep.html': { fn: renderSleepPrep, needs: function () { return window.NX.sceneAffected('sleep-prep') > 0; } },
    'nexus-room-comfort.html': { fn: renderRoomComfort, needs: function () {
      var NX = window.NX; var kinds = { ac: 1, thermostat: 1, climatesensor: 1, purifier: 1, airsensor: 1 };
      return NX.readDevices().some(function (d) { return kinds[NX.kindOf(d)]; });
    } }
  };

  function init() {
    var file = location.pathname.split('/').pop();
    var config = configs[file];
    if (!config) return;
    var custom = renderers[file];
    if (custom) {
      loadEngine(function () {
        if (!window.NX || !custom.needs()) return renderEmpty(config);
        custom.fn();
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      });
      return;
    }
    var hasData = hasStoredData(config.keys || []);
    var hasRequiredDevice = config.deviceKeywords ? hasDevice(config.deviceKeywords) : false;
    if (!hasData && !hasRequiredDevice) renderEmpty(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
