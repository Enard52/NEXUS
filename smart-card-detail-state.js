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
    'stitch-home-schedule.html': {
      title: 'Ev planı bekliyor',
      text: 'Bir plan oluşturduğunda saat ve aksiyonlar burada gerçek verilerle görünecek.',
      icon: 'lucide:calendar-clock',
      keys: ['nexusHomeScheduleData']
    },
    'stitch-multi-video.html': {
      title: 'Kamera yok',
      text: 'Canlı görüntü göstermek için önce kamera eşleştir.',
      icon: 'lucide:video',
      deviceKeywords: ['camera', 'kamera']
    },
    'stitch-room-scenes.html': {
      title: 'Oda sahnesi seçilmedi',
      text: 'Salon veya mutfak için sahne kaydedince bu sayfa dolacak.',
      icon: 'lucide:layout-dashboard',
      keys: ['nexusRoomScenesActive']
    },
    'stitch-guest-mode.html': {
      title: 'Misafir modu ayarlanmadı',
      text: 'Misafir ağı veya geçici erişim bilgisi olmadan hazır durum göstermiyoruz.',
      icon: 'lucide:users-2',
      keys: ['nexusGuestModeStatus']
    },
    'stitch-cleaning-start.html': {
      title: 'Temizlik cihazı yok',
      text: 'Robot süpürge eşleştirince oda ve rutin bilgileri burada görünecek.',
      icon: 'lucide:sparkles',
      deviceKeywords: ['robot', 'vacuum', 'supurge', 'mop']
    },
    'stitch-leave-home-summary.html': {
      title: 'Çıkış özeti hazır değil',
      text: 'Kilit, ışık veya klima gibi cihazlar eklenince çıkış kontrolü oluşacak.',
      icon: 'lucide:door-open',
      deviceKeywords: []
    },
    'stitch-sleep-prep.html': {
      title: 'Uyku planı yok',
      text: 'Uyku hazırlığı için plan veya iklim cihazı bağlanmamış.',
      icon: 'lucide:moon',
      keys: ['nexusHomeScheduleData'],
      deviceKeywords: ['thermostat', 'klima', 'climate', 'temperature']
    },
    'stitch-room-comfort.html': {
      title: 'Konfor verisi yok',
      text: 'Termostat ya da hava sensörü bağlanınca sıcaklık bilgisi burada görünecek.',
      icon: 'lucide:thermometer',
      keys: ['nexusAirQualityData'],
      deviceKeywords: ['thermostat', 'klima', 'climate', 'temperature']
    },
    'stitch-home-health.html': {
      title: 'Ev sağlığı ölçülmedi',
      text: 'Sensör veya cihaz verisi olmadan sağlık skoru üretmiyoruz.',
      icon: 'lucide:heart-pulse',
      keys: ['nexusAirQualityData'],
      deviceKeywords: []
    },
    'stitch-account-security.html': {
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
      '<a href="stitch-pair.html" class="mt-6 inline-flex h-12 px-6 gap-2 items-center justify-center rounded-2xl bg-[#4C7DFF] text-white text-sm font-bold active:scale-95 transition-transform"><i data-lucide="plus" class="w-4 h-4"></i>Cihaz ekle</a>',
      '</section>'
    ].join('');
    // İkon kütüphanesi Iconify'dan Lucide'a taşındı; boş durum ikonunu da Lucide çizer.
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  function init() {
    var file = location.pathname.split('/').pop();
    var config = configs[file];
    if (!config) return;
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
