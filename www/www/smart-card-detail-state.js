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
      title: 'Ev plani bekliyor',
      text: 'Bir plan olusturdugunda saat ve aksiyonlar burada gercek verilerle gorunecek.',
      icon: 'lucide:calendar-clock',
      keys: ['nexusHomeScheduleData']
    },
    'stitch-multi-video.html': {
      title: 'Kamera yok',
      text: 'Canli goruntu gostermek icin once kamera eslestir.',
      icon: 'lucide:video',
      deviceKeywords: ['camera', 'kamera']
    },
    'stitch-room-scenes.html': {
      title: 'Oda sahnesi secilmedi',
      text: 'Salon veya mutfak icin sahne kaydedince bu sayfa dolacak.',
      icon: 'lucide:layout-dashboard',
      keys: ['nexusRoomScenesActive']
    },
    'stitch-guest-mode.html': {
      title: 'Misafir modu ayarlanmadi',
      text: 'Misafir agi veya gecici erisim bilgisi olmadan hazir durum gostermiyoruz.',
      icon: 'lucide:users-2',
      keys: ['nexusGuestModeStatus']
    },
    'stitch-cleaning-start.html': {
      title: 'Temizlik cihazi yok',
      text: 'Robot supurge eslestirince oda ve rutin bilgileri burada gorunecek.',
      icon: 'lucide:sparkles',
      deviceKeywords: ['robot', 'vacuum', 'supurge', 'mop']
    },
    'stitch-leave-home-summary.html': {
      title: 'Cikis ozeti hazir degil',
      text: 'Kilit, isik veya klima gibi cihazlar eklenince cikis kontrolu olusacak.',
      icon: 'lucide:door-open',
      deviceKeywords: []
    },
    'stitch-sleep-prep.html': {
      title: 'Uyku plani yok',
      text: 'Uyku hazirligi icin plan veya iklim cihazi baglanmamis.',
      icon: 'lucide:moon',
      keys: ['nexusHomeScheduleData'],
      deviceKeywords: ['thermostat', 'klima', 'climate', 'temperature']
    },
    'stitch-room-comfort.html': {
      title: 'Konfor verisi yok',
      text: 'Termostat ya da hava sensoru baglaninca sicaklik bilgisi burada gorunecek.',
      icon: 'lucide:thermometer',
      keys: ['nexusAirQualityData'],
      deviceKeywords: ['thermostat', 'klima', 'climate', 'temperature']
    },
    'stitch-home-health.html': {
      title: 'Ev sagligi olculmedi',
      text: 'Sensor veya cihaz verisi olmadan saglik skoru uretmiyoruz.',
      icon: 'lucide:heart-pulse',
      keys: ['nexusAirQualityData'],
      deviceKeywords: []
    },
    'stitch-account-security.html': {
      title: 'Guvenlik cihazi yok',
      text: 'Kilit, sensor veya kamera eklenince guvenlik ozeti burada olusacak.',
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
      '<iconify-icon icon="' + config.icon + '" class="text-4xl"></iconify-icon>',
      '</div>',
      '<h2 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">' + config.title + '</h2>',
      '<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-[270px]">' + config.text + '</p>',
      '<a href="stitch-pair.html" class="mt-6 inline-flex h-12 px-5 items-center justify-center rounded-2xl bg-[#4C7DFF] text-white text-sm font-bold active:scale-95 transition-transform">Cihaz ekle</a>',
      '</section>'
    ].join('');
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
