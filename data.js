const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:4181'
    : (window.location.protocol === 'file:' ? 'http://10.0.2.2:4181' : ''); // 10.0.2.2 is for Android emulator loopback

const SMART_HOME_STORAGE_KEY = 'nexusSelectedSmartHomeCards';
const TAP_TO_RUN_STORAGE_KEY = 'nexusSelectedTapToRunCards';
const HIDDEN_DEVICE_STORAGE_KEY = 'nexusHiddenCards';
const CORE_SMART_HOME_IDS = ['weather', 'energy', 'dnd'];

const CARD_HREFS = {
    weather: 'stitch-map.html',
    energy: 'stitch-energy.html',
    dnd: 'stitch-dnd.html',
    'ai-protect': 'stitch-ai-protect.html',
    'home-schedule': 'stitch-home-schedule.html',
    'privacy-mode': 'stitch-privacy-mode.html',
    'multi-video': 'stitch-multi-video.html',
    'away-home': 'stitch-away-home.html',
    'data-dashboard': 'stitch-logs.html',
    'air-quality': 'stitch-air-quality.html',
    'device-health': 'stitch-device-updates.html',
    'security-summary': 'stitch-account-security.html',
    'room-scenes': 'stitch-room-scenes.html',
    'cleaning-routine': 'stitch-cleaning-start.html',
    'guest-mode': 'stitch-guest-mode.html',
    'leave-home-summary': 'stitch-leave-home-summary.html',
    'sleep-prep': 'stitch-sleep-prep.html',
    'comfort-room': 'stitch-room-comfort.html',
    'home-health': 'stitch-home-health.html',
    'good-morning': 'stitch-good-morning.html',
    'leave-home': 'stitch-leave-home.html',
    'night-security': 'stitch-night-security.html',
    'movie-mode': 'stitch-movie-mode.html',
    'welcome-home': 'stitch-welcome-home.html',
    'sleep-mode': 'stitch-sleep-mode.html',
    'clean-start': 'stitch-cleaning-start.html',
    'energy-check': 'stitch-energy.html',
    'security-scan': 'stitch-account-security.html'
};

const SMART_SCENE_HREFS = {
    'guest-mode-prep': 'stitch-guest-mode.html',
    'leave-home-control': 'stitch-leave-home-summary.html',
    'sleep-prep-center': 'stitch-sleep-prep.html',
    'climate-comfort-panel': 'stitch-room-comfort.html',
    'guest-mode': 'stitch-guest-mode.html',
    'leave-home-summary': 'stitch-leave-home-summary.html',
    'sleep-prep': 'stitch-sleep-prep.html',
    'comfort-room': 'stitch-room-comfort.html',
    'home-health': 'stitch-home-health.html',
    'movie-mode': 'stitch-movie-mode.html',
    'welcome-home': 'stitch-welcome-home.html',
    'welcome-scene': 'stitch-welcome-home.html',
    'clean-start': 'stitch-cleaning-start.html'
};

const NEXUS_CARD_CATALOG = {
    smartHome: [
        { id: 'weather', title: 'Hava Durumu Hizmeti', icon: 'sun', defaultSelected: true },
        { id: 'ai-protect', title: 'AI Koruma', icon: 'shield' },
        { id: 'energy', title: 'AI Enerji Tasarrufu', icon: 'bolt', defaultSelected: true },
        { id: 'dnd', title: 'Rahatsız Etme', icon: 'bell-off', defaultSelected: true },
        { id: 'home-schedule', title: 'Ev Planı', icon: 'calendar' },
        { id: 'privacy-mode', title: 'Gizlilik Modu', icon: 'lock' },
        { id: 'multi-video', title: 'Çoklu Video Önizlemesi', icon: 'video' },
        { id: 'away-home', title: 'Evde ve Dışarıda', icon: 'home-shield' },
        { id: 'data-dashboard', title: 'Veri Paneli', icon: 'chart' },
        { id: 'air-quality', title: 'Hava Kalitesi', icon: 'spark' },
        { id: 'device-health', title: 'Cihaz Sağlığı', icon: 'shield' },
        { id: 'security-summary', title: 'Güvenlik Özeti', icon: 'lock' },
        { id: 'room-scenes', title: 'Oda Sahneleri', icon: 'sun' },
        { id: 'cleaning-routine', title: 'Temizlik Rutini', icon: 'leaf' },
        { id: 'guest-mode', title: 'Misafir Modu', icon: 'home-shield' },
        { id: 'leave-home-summary', title: 'Evden Çıkış Özeti', icon: 'rocket' },
        { id: 'sleep-prep', title: 'Gece Hazırlığı', icon: 'moon' },
        { id: 'comfort-room', title: 'Oda Konforu', icon: 'spark' },
        { id: 'home-health', title: 'Ev Sağlığı Özeti', icon: 'chart' }
    ],
    tapToRun: [
        { id: 'good-morning', title: 'Günaydın Rutini', icon: 'play' },
        { id: 'leave-home', title: 'Evden Çıkış', icon: 'rocket' },
        { id: 'night-security', title: 'Gece Güvenliği', icon: 'moon' },
        { id: 'movie-mode', title: 'Film Modu', icon: 'play' },
        { id: 'welcome-home', title: 'Eve Geldim', icon: 'sun' },
        { id: 'sleep-mode', title: 'Uykuya Geç', icon: 'moon' },
        { id: 'clean-start', title: 'Temizliği Başlat', icon: 'leaf' },
        { id: 'energy-check', title: 'Enerji Kontrolü', icon: 'bolt' },
        { id: 'security-scan', title: 'Güvenlik Taraması', icon: 'shield' }
    ]
};

window.NEXUS_CARD_CATALOG = NEXUS_CARD_CATALOG;

const NEXUS_SMART_APP_TEMPLATES = [
    {
        id: 'whole-home-light-control',
        title: 'Tum Ev Aydinlatma Kontrolu',
        subtitle: 'Isiklari oda bazli yonet, hizli parlaklik sahneleri kur.',
        category: 'lighting',
        deviceTypes: ['lighting'],
        heroImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=256&q=80',
        introduction: 'Evdeki aydinlatma cihazılarini oda bazli tek bir akis icinde yonet. Ac kapıa, parlaklik, renk sicakligi ve hizli sahne kisayollari ayni uygulamada toplansin.',
        features: ['Isik Ac/Kapat', 'Renk Sicakligi', 'Parlaklik Kontrolu', 'Hizli Yuzdeler', 'Oda Bazli Gecis'],
        prompt: 'Tum evi oda bazli kontrol eden bir akilli isik paneli olustur. Her oda icin ac/kapıat, parlaklik ve renk sicakligi kontrolleri olsun. Hemen kullanilabilecek hizli yuzdeler ve tumunu ac/tumunu kapıat aksiyonlari ekle.',
        quickRunLabel: 'Aksam Ortami'
    },
    {
        id: 'climate-comfort-panel',
        title: 'Iklim Konfor Paneli',
        subtitle: 'Klima ve termostatlar icin sicaklik, mod ve konfor kisayollari.',
        category: 'climate',
        deviceTypes: ['climate'],
        heroImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=256&q=80',
        introduction: 'Klima ve termostatlari tek panelden yonet, odalara gore konfor profilleri olustur ve gunluk kullanim icin hazir modlar kullan.',
        features: ['Sicaklik Ayari', 'Eko Modu', 'Oda Bazli Kontrol', 'Hizli Modlar', 'Konfor Profilleri'],
        prompt: 'Evdeki klima ve termostatlari tek panelde yoneten bir iklim konfor uygulamasi olustur. Sicaklik ayari, hizli mod secenekleri, eko modu ve oda bazli kontrol aksiyonlari olsun.',
        quickRunLabel: 'Konfor Modu'
    },
    {
        id: 'home-security-center',
        title: 'Güvenlik Merkezi',
        subtitle: 'Kamera, kilit ve sensor durumlarini tek yerden takip et.',
        category: 'security',
        deviceTypes: ['security'],
        heroImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=256&q=80',
        introduction: 'Kamera, kilit ve sensorleri ayni ekranda gor. Evdeyim ve disardayim modlari, kritik durum ozetleri ve hizli guvenlik aksiyonlari tek yerde toplansin.',
        features: ['Kamera Durumu', 'Kilit Kontrolu', 'Disardayim Modu', 'Hizli Guvenlik', 'Durum Ozeti'],
        prompt: 'Kamera, kilit ve sensorleri tek ekranda gosteren bir ev guvenlik merkezi olustur. Evdeyim ve disardayim modlari, hizli kontrol butonlari ve kritik durum ozetleri ekle.',
        quickRunLabel: 'Guvenlik Kontrolu'
    },
    {
        id: 'cinema-media-mode',
        title: 'Sinema Modu',
        subtitle: 'TV ve medya cihazılari icin tek dokunuslu eglence paneli.',
        category: 'media',
        deviceTypes: ['media'],
        heroImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=256&q=80',
        introduction: 'TV, medya kutusu ve ortam isiklarini tek aksiyonda birlestir. Film baslat, gece modu ve dikkat dagitmayan eglence sahneleri kolayca kurulabilsin.',
        features: ['Film Baslat', 'Ortam Isiklari', 'Ses Seviyesi', 'Gece Modu', 'Eglence Sahnesi'],
        prompt: 'TV ve medya cihazılari icin bir sinema modu uygulamasi olustur. Film baslat, ses seviyesi, ortam isiklari ve dikkat dagitmayan gece eglence kisayollari olsun.',
        quickRunLabel: 'Film Baslat'
    },
    {
        id: 'energy-saver-hub',
        title: 'Enerji Tasarruf Merkezi',
        subtitle: 'Akilli prizler ve enerji odakli cihazılar icin hizli tasarruf akislari.',
        category: 'energy',
        deviceTypes: ['energy'],
        heroImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=256&q=80',
        introduction: 'Akilli prizler ve enerji tuketen cihazılari tek merkezde topla. Hemen uygulanabilen tasarruf profilleri ve zamanli eko aksiyonlari olustur.',
        features: ['Hizli Kapatma', 'Eko Profilleri', 'Zamanıli Tasarruf', 'Tuketim Ozeti', 'Priz Gruplari'],
        prompt: 'Akilli prizleri ve enerji tuketen cihazılari yoneten bir enerji tasarruf paneli olustur. Hizli kapıatma, eko profiller, zamanlanmis tasarruf ve tuketim ozetleri ekle.',
        quickRunLabel: 'Tasarruf Baslat'
    },
    {
        id: 'guest-mode-prep',
        title: 'Misafir Modu Hazirlayici',
        subtitle: 'Misafir geldigi anda kullanilacak isik, erisim ve ortam ayarlari.',
        category: 'general',
        deviceTypes: ['lighting', 'security', 'media'],
        heroImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=256&q=80',
        introduction: 'Misafir gelmeden once giris, aydinlatma, ortak alan ve eglence cihazılarini tek panelde hazirla. Ev icinde rahat ama guvenli bir karşılama akisi olustur.',
        features: ['Karsilama Isigi', 'Ortak Alan Hazirlik', 'Misafir Erişimi', 'Sessiz Bildirim', 'Tek Dokunus Hazirlik'],
        prompt: 'Misafir geldigi anda giris, aydinlatma ve ortak alan cihazılarini hazirlayan bir misafir modu uygulamasi olustur. Karsilama isigi, sessiz bildirim ve misafir erisim adimlari olsun.',
        quickRunLabel: 'Misafir Modu'
    },
    {
        id: 'sleep-prep-center',
        title: 'Uykuya Hazirlik Merkezi',
        subtitle: 'Gece ışık, sessiz mod, kilit ve iklim ayarlarini tek akista topla.',
        category: 'general',
        deviceTypes: ['lighting', 'security', 'climate'],
        heroImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=256&q=80',
        introduction: 'Yatmadan once gerekli tum ev kontrollerini tek merkezde topla. Isik azaltma, rahatsiz etme, kilit kontrolu ve gece iklim ayarlari tek ekranda yonetilsin.',
        features: ['Isik Azaltma', 'Rahatsiz Etme', 'Kilit Kontrolu', 'Gece Sicakligi', 'Son Kontrol Ozeti'],
        prompt: 'Yatmadan once isik, sessiz mod, kilit ve iklim ayarlarini yoneten bir uykuya hazirlik merkezi olustur. Son kontrol ozeti ve tek dokunus gece modu ekle.',
        quickRunLabel: 'Uykuya Gec'
    },
    {
        id: 'leave-home-control',
        title: 'Evden Cikis Kontrolu',
        subtitle: 'Evden cikarken acik cihazılari, kilitleri ve enerji durumunu tek ekranda goster.',
        category: 'general',
        deviceTypes: ['lighting', 'security', 'energy'],
        heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=256&q=80',
        introduction: 'Evden cikmadan once acik kalan isik, priz, klima ve guvenlik ayarlarini tek panelde gor. Hizli kapıatma ve guvenlik aktif etme adimlarini tek akisa topla.',
        features: ['Acik Cihaz Ozeti', 'Hizli Kapatma', 'Kilit Durumu', 'Enerji Kontrolu', 'Cikis Hazirligi'],
        prompt: 'Evden cikarken acik cihazılari, kilit durumunu ve enerji ayarlarini tek ekranda gosteren bir cikis kontrolu uygulamasi olustur. Hizli kapıatma ve guvenlik aktif etme butonlari ekle.',
        quickRunLabel: 'Evden Cikiyorum'
    }
];

window.NEXUS_SMART_APP_TEMPLATES = NEXUS_SMART_APP_TEMPLATES;

function readStoredJson(key, fallback) {
    try {
        const raw = nexusGetItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeStoredJson(key, value) {
    nexusSetItem(key, JSON.stringify(value));
}

// Normalize a single automation/clickrun item to ensure it has all required fields
function normalizeItem(item, type) {
    if (!item) return null;
    return {
        id: item.id || `auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: type || item.type || 'automation',
        title: item.title || 'Yeni Senaryo',
        desc: item.desc || 'Akıllı ev senaryonuzu özelleştirin',
        icon: item.icon || 'zap',
        bgClass: item.bgClass || 'bg-indigo-500/10',
        colorClass: item.colorClass || 'text-indigo-500',
        source: item.source || 'user',
        category: item.category || 'general',
        recommended: item.recommended || false,
        createdAt: item.createdAt || Date.now()
    };
}

// Read and normalize a list of items from storage
function readAndNormalizeItems(key, type) {
    const rawItems = readStoredJson(key, []);
    return Array.isArray(rawItems) ? rawItems.map(item => normalizeItem(item, type)).filter(Boolean) : [];
}

// Write a list of items to storage, ensuring each is normalized
function writeNormalizedItems(key, items, type) {
    const normalized = Array.isArray(items) ? items.map(item => normalizeItem(item, type)) : [];
    writeStoredJson(key, normalized);
}

// Helper to find an item by id in storage
function findItemById(key, id) {
    const items = readAndNormalizeItems(key);
    return items.find(item => item.id === id) || null;
}

// Helper to update an item by id in storage
function updateItemById(key, id, updates) {
    const items = readAndNormalizeItems(key);
    const index = items.findIndex(item => item.id === id);
    if (index >= 0) {
        items[index] = normalizeItem({ ...items[index], ...updates });
        writeNormalizedItems(key, items);
        return items[index];
    }
    return null;
}

window.getPrimaryHouseholdName = function() {
    var name = 'Evim';
    try {
        var homes = JSON.parse(nexusGetItem('nexusHousehold') || 'null');
        if (Array.isArray(homes) && homes.length && homes[0] && homes[0].name) {
            name = String(homes[0].name).trim() || 'Evim';
        }
    } catch (e) {}
    return name;
};

function uniqueIds(list, allowedIds) {
    const allowed = new Set(allowedIds);
    return [...new Set((Array.isArray(list) ? list : []).filter(id => allowed.has(id)))];
}

function getSmartHomeCatalogIds() {
    return NEXUS_CARD_CATALOG.smartHome.map(card => card.id);
}

window.getCustomClickRunCards = function() {
    return typeof readAndNormalizeItems === 'function' ? readAndNormalizeItems('nexusCustomClickRun', 'clickrun') : [];
};

function getTapToRunCatalogIds() {
    return window.getCustomClickRunCards().map(card => card.id);
}

function getSelectedSmartHomeIds() {
    const stored = readStoredJson(SMART_HOME_STORAGE_KEY, null);
    if (stored === null) {
        return NEXUS_CARD_CATALOG.smartHome.filter(card => card.defaultSelected).map(card => card.id);
    }
    return uniqueIds(stored, getSmartHomeCatalogIds());
}

function setSelectedSmartHomeIds(ids) {
    writeStoredJson(SMART_HOME_STORAGE_KEY, uniqueIds(ids, getSmartHomeCatalogIds()));
}

function getSelectedTapToRunIds() {
    return uniqueIds(readStoredJson(TAP_TO_RUN_STORAGE_KEY, []), getTapToRunCatalogIds());
}

function setSelectedTapToRunIds(ids) {
    writeStoredJson(TAP_TO_RUN_STORAGE_KEY, uniqueIds(ids, getTapToRunCatalogIds()));
}

function getHiddenDeviceIds() {
    return readStoredJson(HIDDEN_DEVICE_STORAGE_KEY, []);
}

function setHiddenDeviceIds(ids) {
    writeStoredJson(HIDDEN_DEVICE_STORAGE_KEY, [...new Set(Array.isArray(ids) ? ids : [])]);
}

window.getSelectedSmartHomeCards = function() {
    const selected = new Set(getSelectedSmartHomeIds());
    return NEXUS_CARD_CATALOG.smartHome.filter(card => selected.has(card.id));
};

window.setSmartHomeCardSelected = function(id, selected) {
    const next = new Set(getSelectedSmartHomeIds());
    if (selected) next.add(id);
    else next.delete(id);
    setSelectedSmartHomeIds([...next]);
};

window.getTapToRunCards = function() {
    const selected = new Set(getSelectedTapToRunIds());
    return window.getCustomClickRunCards().filter(card => selected.has(card.id));
};

window.setTapToRunCardSelected = function(id, selected) {
    const next = new Set(getSelectedTapToRunIds());
    if (selected) next.add(id);
    else next.delete(id);
    setSelectedTapToRunIds([...next]);
};

window.isDeviceCardSelected = function(id) {
    return !getHiddenDeviceIds().includes(id);
};

window.setDeviceCardSelected = function(id, selected) {
    const next = new Set(getHiddenDeviceIds());
    if (selected) next.delete(id);
    else next.add(id);
    setHiddenDeviceIds([...next]);
};

function getCardHref(id) {
    return CARD_HREFS[id] || 'stitch-home.html';
}

window.getSmartSceneHref = function(id) {
    return SMART_SCENE_HREFS[id] || null;
};

function getCardIconSvg(icon, sizeClass = 'w-5 h-5') {
    const cls = `${sizeClass} stroke-[1.8]`;
    switch (icon) {
        case 'sun':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'shield':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'bolt':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 12-14h-7l1-6z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'folder':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'note':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 4h10a2 2 0 0 1 2 2v9l-5 5H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 20v-5h5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'checklist':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 6h10M9 12h10M9 18h10M4 6h.01M4 12h.01M4 18h.01" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'spark':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM5 18l.9 2 .9-2 2-.9-2-.9-.9-2-.9 2-2 .9 2 .9zM18 16l1.2 2.6L22 20l-2.8 1.4L18 24l-1.2-2.6L14 20l2.8-1.4L18 16z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'leaf':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 21c6 0 12-6 12-12-6 0-12 6-12 12z"></path><path d="M9 15c2 0 6-2 10-8 0 8-4 12-10 12-2.5 0-4.5-1-6-3" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'bell-off':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.73 5.08A6 6 0 0 1 18 11c0 3 1 5 2 6H8m5 4a2 2 0 0 1-4 0M3 3l18 18" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'calendar':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'lock':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 1 1 8 0v3" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'video':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"></rect><path d="M16 10l5-3v10l-5-3z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'home-shield':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"></path><path d="M5 10v9h5v-5h4v5h5v-9"></path><path d="M12 8l4 1.7v3.3c0 2.2-1.4 3.9-4 5-2.6-1.1-4-2.8-4-5V9.7L12 8z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'chart':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 19h16"></path><path d="M7 16V9M12 16V5M17 16v-3" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'play':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 6l10 6-10 6V6z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'rocket':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 19c2-4 5-7 9-9 2-5 5-6 5-6s1 3-1 5c-2 4-5 7-9 9l-4 1 0-4z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 14l-3 3M14 10l3-3" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        case 'moon':
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        default:
            return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v18M3 12h18" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
    }
}

function getCardAccentClasses(icon) {
    switch (icon) {
        case 'sun':
        case 'note':
        case 'rocket':
            return { wrap: 'bg-amber-50 text-amber-500', text: 'text-amber-500' };
        case 'bolt':
        case 'play':
            return { wrap: 'bg-blue-50 text-[#4C7DFF]', text: 'text-[#4C7DFF]' };
        case 'bell-off':
            return { wrap: 'bg-rose-50 text-rose-500', text: 'text-rose-500' };
        case 'leaf':
        case 'spark':
            return { wrap: 'bg-emerald-50 text-emerald-500', text: 'text-emerald-500' };
        case 'shield':
        case 'home-shield':
        case 'calendar':
        case 'checklist':
        case 'video':
            return { wrap: 'bg-sky-50 text-sky-500', text: 'text-sky-500' };
        case 'chart':
            return { wrap: 'bg-cyan-50 text-cyan-500', text: 'text-cyan-500' };
        case 'lock':
            return { wrap: 'bg-violet-50 text-violet-500', text: 'text-violet-500' };
        case 'moon':
            return { wrap: 'bg-indigo-50 text-indigo-500', text: 'text-indigo-500' };
        case 'folder':
            return { wrap: 'bg-slate-100 text-slate-500', text: 'text-slate-500' };
        default:
            return { wrap: 'bg-slate-100 text-slate-600', text: 'text-slate-600' };
    }
}

async function fetchNexusData() {
    // Backend API is not currently used, returning null directly to avoid console errors.
    return null;
}

async function initNexusData() {
    const data = await fetchNexusData();
    if (!data) {
        // Backend yok (mobil): kullanıcının gerçek yerel cihazılarıyla render et
        renderDevices();
        window.refreshDashboardSupplements();
        document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: null }));
        return;
    }
    
    window.NEXUS_DATA = data;
    
    // Simple 1-way text binding
    document.querySelectorAll('[data-bind]').forEach(el => {
        const keyPath = el.getAttribute('data-bind').split('.');
        let val = data;
        for (const k of keyPath) {
            if (val === undefined || val === null) break;
            val = val[k];
        }
        if (val !== undefined && val !== null) {
            // Check if it's an input or standard element
            if (el.tagName === 'INPUT') {
                el.value = val;
            } else {
                el.textContent = val;
            }
        }
    });
    
    // Let individual pages handle complex rendering (lists, states, etc)
    const userNameElement = document.getElementById('nexus-user-name');
    if (userNameElement) {
        if (userNameElement.tagName === 'INPUT') {
            userNameElement.value = data.displayName || 'Kullanıcı';
        } else {
            userNameElement.textContent = data.displayName || 'Kullanıcı';
        }
    }
    // Realistic Notification Badge Logic
    const discoverBadge = document.getElementById('discover-badge');
    if (discoverBadge) {
        if (window.location.pathname.includes('stitch-discover.html')) {
            nexusSetItem('nexusNotificationsRead', 'true');
        }
        
        // Let's pretend the server returns unread suggestions if we haven't clicked it
        const isRead = nexusGetItem('nexusNotificationsRead') === 'true';
        if (!isRead) {
            discoverBadge.classList.remove('hidden');
        } else {
            discoverBadge.classList.add('hidden');
        }
    }

    renderDevices();
    window.refreshDashboardSupplements();
    document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: data }));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNexusData);
} else {
    initNexusData();
}


window.deleteDynamicCard = function(id) {
    if (getSmartHomeCatalogIds().includes(id)) {
        window.setSmartHomeCardSelected(id, false);
        syncHomeStaticCards();
        renderExtraSmartHomeCards();
    } else if (getTapToRunCatalogIds().includes(id)) {
        window.setTapToRunCardSelected(id, false);
        renderTapToRunCards();
    } else {
        window.setDeviceCardSelected(id, false);
        renderDevices();
    }
    const el = document.getElementById('dyn-card-' + id);
    if (el) el.remove();
};

// Backend yokken tek gerçek kaynak: kullanıcının yerel eşleştirdiği cihazılar
// (nexusDashboardCards + nexusPairedDevices aynı akışta birleşir)
function getLocalDevices() {
    const list = [];
    let cards = [];
    try { cards = JSON.parse(nexusGetItem('nexusDashboardCards') || '[]'); } catch(e){}
    if (Array.isArray(cards)) {
        cards.forEach(c => {
            if (!c || c.visible === false || !c.title) return;
            list.push({ id: c.id, name: c.title, state: c.valDefault || 'Bağlı' });
        });
    }
    let paired = [];
    try { paired = JSON.parse(nexusGetItem('nexusPairedDevices') || '[]'); } catch(e){}
    if (Array.isArray(paired)) {
        paired.forEach((d, i) => {
            if (!d || !d.name) return;
            if (list.some(x => x.name === d.name)) return; // aynı cihazı iki kaynakta sayılmasın
            list.push({ id: 'paired-' + i, name: d.name, state: 'Bağlı', type: d.icon === 'lightbulb' ? 'light' : '' });
        });
    }
    return list;
}

window.getNexusLocalDevices = getLocalDevices;

window.renameNexusDevice = function(id, newName) {
    let paired = getLocalDevices();
    let index = paired.findIndex(d => d.id === id);
    if (index > -1) {
        paired[index].name = newName;
        nexusSetItem('nexusPairedDevices', JSON.stringify(paired));
        return true;
    }
    return false;
};
function getMergedDevices(dataDevices) {
    const merged = [];
    const seenNames = new Set();

    if (Array.isArray(dataDevices)) {
        dataDevices.forEach(device => {
            if (!device || !device.name) return;
            merged.push(device);
            seenNames.add(device.name);
        });
    }

    getLocalDevices().forEach(device => {
        if (!device || !device.name || seenNames.has(device.name)) return;
        merged.push(device);
        seenNames.add(device.name);
    });

    return merged;
}

function inferSmartCategory(device) {
    const type = ((device && device.type) || '').toLowerCase();
    const name = ((device && device.name) || '').toLowerCase();
    const full = `${type} ${name}`;

    if (/light|lamp|ampul|isik|ayd/.test(full)) return 'lighting';
    if (/climate|thermostat|klima|sicak|hava|fan/.test(full)) return 'climate';
    if (/camera|sensor|lock|kilit|guvenlik|protect|doorbell/.test(full)) return 'security';
    if (/tv|media|soundbar|speaker|apple tv|homepod|sinema/.test(full)) return 'media';
    if (/plug|priz|energy|enerji|washer|fridge|purifier/.test(full)) return 'energy';
    return 'general';
}

window.getSmartDeviceProfile = function() {
    const devices = getMergedDevices(window.NEXUS_DATA && Array.isArray(window.NEXUS_DATA.devices) ? window.NEXUS_DATA.devices : []);
    const counts = {
        lighting: 0,
        climate: 0,
        security: 0,
        media: 0,
        energy: 0,
        general: 0
    };

    devices.forEach(device => {
        counts[inferSmartCategory(device)] += 1;
    });

    return {
        devices,
        counts,
        total: devices.length
    };
};

function scoreTemplate(template, profile) {
    const categoryCount = profile.counts[template.category] || 0;
    const deviceBonus = template.deviceTypes.reduce((sum, type) => sum + (profile.counts[type] || 0), 0);
    return (categoryCount * 10) + (deviceBonus * 4);
}

window.getRecommendedSmartApps = function(limit = 3) {
    const profile = window.getSmartDeviceProfile();
    const scored = NEXUS_SMART_APP_TEMPLATES.map((template, index) => ({
        ...template,
        score: scoreTemplate(template, profile),
        order: index
    }));

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.order - b.order;
    });

    return scored.slice(0, limit);
};

window.getSmartPromptById = function(id) {
    const aliases = {
        'tatil-guvenlik-modu': 'home-security-center',
        'vacation-security-mode': 'home-security-center',
        'sinema-modu': 'cinema-media-mode',
        'cinema-mode': 'cinema-media-mode',
        'tum-ev-aydinlatma-kontrolu': 'whole-home-light-control',
        'whole-home-lighting-control': 'whole-home-light-control',
        'misafir-modu': 'guest-mode-prep',
        'guest-mode': 'guest-mode-prep',
        'uykuya-hazirlik': 'sleep-prep-center',
        'sleep-prep': 'sleep-prep-center',
        'evden-cikis-kontrolu': 'leave-home-control',
        'leave-home-control': 'leave-home-control'
    };
    const resolvedId = aliases[id] || id;
    return NEXUS_SMART_APP_TEMPLATES.find(template => template.id === resolvedId) || null;
};

window.getRecommendedQuickRuns = function(limit = 4) {
    const profile = window.getSmartDeviceProfile();
    const actions = [];

    if (profile.counts.lighting > 0) {
        actions.push(
            { id: 'lights-on', title: 'Tum Isiklari Ac', desc: 'Aydinlatma cihazılarini acik moda al.', icon: 'sun', bgClass: 'bg-amber-500/10', colorClass: 'text-amber-500', category: 'lighting', recommended: true, source: 'system' },
            { id: 'lights-evening', title: 'Aksam Ortami', desc: 'Daha sakin bir aydinlatma sahnesi baslat.', icon: 'moon', bgClass: 'bg-blue-500/10', colorClass: 'text-blue-500', category: 'lighting', recommended: true, source: 'system' },
            { id: 'all-lights-off', title: 'Tum Isiklari Kapat', desc: 'Evde acik kalan tum aydinlatma gruplarini kapıat.', icon: 'moon', bgClass: 'bg-slate-500/10', colorClass: 'text-slate-500', category: 'lighting', recommended: true, source: 'system' }
        );
    }
    if (profile.counts.climate > 0) {
        actions.push(
            { id: 'comfort-mode', title: 'Konfor Modu', desc: 'Sicaklik cihazılarini dengeli profile cek.', icon: 'spark', bgClass: 'bg-blue-500/10', colorClass: 'text-blue-500', category: 'climate', recommended: true, source: 'system' },
            { id: 'sleep-climate', title: 'Gece Sicakligi', desc: 'Uyku icin daha dengeli bir gece iklim profili uygula.', icon: 'moon', bgClass: 'bg-indigo-500/10', colorClass: 'text-indigo-500', category: 'climate', recommended: true, source: 'system' }
        );
    }
    if (profile.counts.security > 0) {
        actions.push(
            { id: 'security-check', title: 'Guvenlik Kontrolu', desc: 'Guvenlik cihazılari icin hizli durum kontrolu baslat.', icon: 'shield', bgClass: 'bg-emerald-500/10', colorClass: 'text-emerald-500', category: 'security', recommended: true, source: 'system' },
            { id: 'secure-home', title: 'Guvenligi Aktif Et', desc: 'Kilit ve sensor odakli ev guvenligini hizla devreye al.', icon: 'shield', bgClass: 'bg-sky-500/10', colorClass: 'text-sky-500', category: 'security', recommended: true, source: 'system' }
        );
    }
    if (profile.counts.media > 0) {
        actions.push(
            { id: 'movie-mode', title: 'Film Baslat', desc: 'Medya odakli eglence profilini tetikle.', icon: 'play', bgClass: 'bg-rose-500/10', colorClass: 'text-rose-500', category: 'media', recommended: true, source: 'system' },
            { id: 'welcome-scene', title: 'Eve Geldim', desc: 'Medya ve ortam cihazılariyla karsilama sahnesi calistir.', icon: 'sun', bgClass: 'bg-orange-500/10', colorClass: 'text-orange-500', category: 'media', recommended: true, source: 'system' }
        );
    }
    if (profile.counts.energy > 0) {
        actions.push(
            { id: 'energy-save', title: 'Tasarruf Baslat', desc: 'Enerji tuketen cihazılar icin eko aksiyonunu calistir.', icon: 'bolt', bgClass: 'bg-cyan-500/10', colorClass: 'text-cyan-500', category: 'energy', recommended: true, source: 'system' },
            { id: 'cleaning-start', title: 'Temizligi Baslat', desc: 'Temizlik cihazılarini ve destekleyici ev ayarlarini calistir.', icon: 'leaf', bgClass: 'bg-emerald-500/10', colorClass: 'text-emerald-500', category: 'energy', recommended: true, source: 'system' }
        );
    }

    return actions.slice(0, limit);
};

window.getRecommendedAutomationItems = function(limit = 3) {
    return window.getRecommendedQuickRuns(limit).map(item => ({
        ...item,
        id: `${item.id}-auto`,
        title: `${item.title} Otomasyonu`,
        desc: `${item.desc} Otomatik tetikleyici olarak kullan.`,
        active: false
    }));
};

window.filterSmartCollection = function(items, filterKey) {
    const safeItems = Array.isArray(items) ? items : [];
    switch (filterKey) {
        case 'recommended':
            return safeItems.filter(item => item.recommended);
        case 'user':
            return safeItems.filter(item => item.source === 'user');
        case 'device':
            return safeItems.filter(item => item.category && item.category !== 'general');
        case 'active':
            return safeItems.filter(item => item.active);
        default:
            return safeItems;
    }
};


function hasStoredValue(key) {
    try {
        return nexusGetItem(key) !== null && nexusGetItem(key) !== undefined;
    } catch (e) {
        return false;
    }
}

function getPairedDevicesForCards() {
    try {
        const devices = typeof getLocalDevices === 'function' ? getLocalDevices() : [];
        return Array.isArray(devices) ? devices : [];
    } catch (e) {
        return [];
    }
}

function deviceMatches(device, keywords) {
    const haystack = [device && device.type, device && device.name, device && device.room, device && device.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return keywords.some(keyword => haystack.includes(keyword));
}

function countDevicesByKeywords(keywords) {
    return getPairedDevicesForCards().filter(device => deviceMatches(device, keywords)).length;
}

function getStoredSceneState(sceneId) {
    const states = readStoredJson('nexusSceneStates', {});
    return states && Object.prototype.hasOwnProperty.call(states, sceneId) ? states[sceneId] : null;
}

function emptyCardState(title, detail, iconHtml, colorClass = 'text-slate-500') {
    return `
        <div class="flex items-center justify-between mb-2 ${colorClass}">
            <div class="flex items-center gap-2">
                ${iconHtml.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">${title}</span>
            </div>
        </div>
        <div class="mt-auto">
            <h3 class="font-bold text-slate-900 text-sm mb-0.5">Veri yok</h3>
            <p class="text-[10px] text-slate-500 font-medium">${detail}</p>
        </div>
    `;
}

﻿function buildCustomHomeCard(card) {
    const accent = getCardAccentClasses(card.icon);
    const svg = getCardIconSvg(card.icon);
    const href = getCardHref(card.id);
    const id = `dyn-card-${card.id}`;

    let content = '';

    const aiProtect = hasStoredValue('nexusAiProtectStatus') ? readStoredJson('nexusAiProtectStatus', null) : null;
    const privacyMode = hasStoredValue('nexusPrivacyMode') ? readStoredJson('nexusPrivacyMode', null) : null;
    const airQuality = hasStoredValue('nexusAirQualityData') ? readStoredJson('nexusAirQualityData', null) : null;
    const homeSchedule = hasStoredValue('nexusHomeScheduleData') ? readStoredJson('nexusHomeScheduleData', null) : null;
    const multiVideo = hasStoredValue('nexusMultiVideoStatus') ? readStoredJson('nexusMultiVideoStatus', null) : null;
    const roomScenes = hasStoredValue('nexusRoomScenesActive') ? readStoredJson('nexusRoomScenesActive', null) : null;
    const guestMode = hasStoredValue('nexusGuestModeStatus') ? readStoredJson('nexusGuestModeStatus', null) : null;
    const pairedDevices = getPairedDevicesForCards();
    const cameraCount = countDevicesByKeywords(['camera', 'kamera']);
    const robotCount = countDevicesByKeywords(['robot', 'vacuum', 'süpürge', 'supurge', 'mop']);
    const lockCount = countDevicesByKeywords(['lock', 'kilit', 'door']);
    const climateCount = countDevicesByKeywords(['thermostat', 'klima', 'climate', 'temperature']);
    const storedEvents = readStoredJson('nexusEvents', []);
    const eventCount = Array.isArray(storedEvents) ? storedEvents.length : 0;

    switch(card.id) {
        case 'ai-protect':
            if (!aiProtect) {
                content = emptyCardState('AI KORUMA', 'Koruma durumunu görmek için karta dokun.', svg, 'text-[#4C7DFF]');
            } else {
                const threatCount = Number(aiProtect.threats || 0);
                content = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 text-[#4C7DFF]">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">AI KORUMA</span>
                    </div>
                    ${aiProtect.enabled ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>' : '<span class="w-2 h-2 rounded-full bg-slate-300"></span>'}
                </div>
                <div class="mt-auto">
                    <h3 class="font-extrabold text-slate-900 text-lg leading-tight mb-1">${aiProtect.enabled ? 'Koruma Aktif' : 'Kapalı'}</h3>
                    <p class="text-[10px] font-medium text-slate-500 flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>${threatCount} kayıtlı olay</p>
                </div>
            `;
            }
            break;
        case 'home-schedule':
            if (!homeSchedule) {
                content = emptyCardState('EV PLANI', 'Bir plan oluşturunca burada görünecek.', svg, 'text-sky-500');
            } else {
                content = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 text-sky-500">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">EV PLANI</span>
                    </div>
                </div>
                <div class="mt-auto bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/50">
                    <div class="text-[9px] text-slate-400 font-bold mb-0.5">${homeSchedule.active ? 'SIRADAKİ (' + (homeSchedule.time || '--:--') + ')' : 'PLAN YOK'}</div>
                    <div class="text-xs font-bold text-slate-700">${homeSchedule.active ? (homeSchedule.name || 'Ev planı') : 'Tüm planlar duraklatıldı'}</div>
                </div>
            `;
            }
            break;
        case 'privacy-mode':
            if (!privacyMode) {
                content = emptyCardState('GİZLİLİK', 'Kamera ve mikrofon tercihleri ayarlanmamış.', svg);
            } else {
                const privacyActive = privacyMode.cameras && privacyMode.mics;
                content = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 text-slate-700">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">GİZLİLİK</span>
                    </div>
                    <div class="w-7 h-4 ${privacyActive ? 'bg-rose-500' : 'bg-slate-300'} rounded-full relative"><div class="w-3 h-3 bg-white rounded-full absolute ${privacyActive ? 'right-0.5' : 'left-0.5'} top-0.5 shadow-sm transition-all"></div></div>
                </div>
                <div class="mt-auto">
                    <h3 class="font-bold text-slate-900 text-sm mb-0.5">${privacyActive ? 'Tam Gizlilik' : (privacyMode.cameras ? 'Kameralar Kapalı' : 'Koruma Kapalı')}</h3>
                    <p class="text-[10px] text-slate-500 font-medium">${privacyMode.mics ? 'Mikrofonlar kapalı' : 'Mikrofonlar açık'}</p>
                </div>
            `;
            }
            break;
        case 'multi-video':
            if (!multiVideo && cameraCount === 0) {
                content = emptyCardState('KAMERALAR', 'Canlı görüntü için kamera ekle.', svg, 'text-sky-500');
            } else {
                const live = multiVideo ? !!multiVideo.live : cameraCount > 0;
                const shownCameras = Math.max(1, Math.min(cameraCount || 1, 2));
                content = `
                <div class="flex items-center justify-between mb-2 text-sky-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">KAMERALAR</span>
                    </div>
                    ${live ? '<span class="text-[9px] font-bold bg-sky-100 px-1.5 py-0.5 rounded text-sky-600">CANLI</span>' : '<span class="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">ÇEVRİMDIŞI</span>'}
                </div>
                <div class="grid gap-1.5 mt-auto ${!live ? 'opacity-50 grayscale' : ''}" style="grid-template-columns: repeat(${shownCameras}, minmax(0, 1fr));">
                    ${Array.from({ length: shownCameras }).map((_, index) => `<div class="aspect-[4/3] bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative"><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><div class="absolute bottom-1 left-1 text-[7px] text-slate-500 font-bold bg-white/80 px-1 rounded">Kamera ${index + 1}</div></div>`).join('')}
                </div>
            `;
            }
            break;
        case 'away-home':
        case 'good-morning':
        case 'leave-home':
        case 'night-security':
        case 'sleep-mode': {
            const isActive = getStoredSceneState(card.id) === true;
            content = `
                <div class="flex items-center justify-between mb-2">
                    <div class="w-7 h-7 rounded-full ${isActive ? 'bg-[#4C7DFF] text-white' : accent.wrap} flex items-center justify-center transition-colors">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')}
                    </div>
                    ${isActive ? '<div class="text-[9px] font-bold text-[#4C7DFF] bg-[#4C7DFF]/10 px-2 py-0.5 rounded-full tracking-wider">AKTİF</div>' : ''}
                </div>
                <div class="mt-auto">
                    <h3 class="font-bold text-slate-900 text-sm mb-0.5">${card.title}</h3>
                    <p class="text-[10px] text-slate-500 font-medium">${isActive ? 'Şu an devrede' : 'Çalıştırmak için dokun'}</p>
                </div>
            `;
            break;
        }
        case 'air-quality': {
            if (!airQuality || typeof airQuality.aqi !== 'number') {
                content = emptyCardState('HAVA', 'Hava sensörü bağlanınca ölçüm görünecek.', svg, 'text-emerald-500');
                break;
            }
            let textColor = 'text-emerald-500', badgeText = 'text-emerald-600', badgeBg = 'bg-emerald-50', barBg = 'bg-emerald-500';
            let aqiText = 'İYİ';
            if (airQuality.aqi >= 50 && airQuality.aqi < 100) {
                textColor = 'text-amber-500'; badgeText = 'text-amber-600'; badgeBg = 'bg-amber-50'; barBg = 'bg-amber-500';
                aqiText = 'ORTA';
            } else if (airQuality.aqi >= 100) {
                textColor = 'text-rose-500'; badgeText = 'text-rose-600'; badgeBg = 'bg-rose-50'; barBg = 'bg-rose-500';
                aqiText = 'KÖTÜ';
            }
            content = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 ${textColor}">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">HAVA</span>
                    </div>
                    <span class="text-[9px] font-bold ${badgeText} ${badgeBg} px-1.5 py-0.5 rounded">${aqiText}</span>
                </div>
                <div class="mt-auto">
                    <h3 class="font-extrabold text-slate-900 text-xl leading-tight mb-2">AQI: ${airQuality.aqi}</h3>
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                        <div style="width: ${Math.min(100, airQuality.aqi)}%;" class="h-full ${barBg} rounded-full transition-all"></div>
                    </div>
                </div>
            `;
            break;
        }
        case 'room-scenes':
            if (!roomScenes) {
                content = emptyCardState('SAHNELER', 'Oda sahnesi seçilince burada görünür.', svg, 'text-amber-500');
            } else {
                content = `
                <div class="flex items-center justify-between mb-2 text-amber-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">SAHNELER</span>
                    </div>
                </div>
                <div class="flex gap-1.5 mt-auto">
                    <div class="flex-1 ${roomScenes.salon ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'} rounded-lg py-2 flex flex-col items-center justify-center border transition-colors">
                        <svg class="w-3.5 h-3.5 ${roomScenes.salon ? 'text-amber-500' : 'text-slate-400'} mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <div class="text-[8px] font-bold ${roomScenes.salon ? 'text-amber-700' : 'text-slate-500'}">SALON ${roomScenes.salon ? '(' + roomScenes.salon + ')' : ''}</div>
                    </div>
                    <div class="flex-1 ${roomScenes.mutfak ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-slate-100'} rounded-lg py-2 flex flex-col items-center justify-center border transition-colors">
                        <svg class="w-3.5 h-3.5 ${roomScenes.mutfak ? 'text-sky-500' : 'text-slate-400'} mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"></path></svg>
                        <div class="text-[8px] font-bold ${roomScenes.mutfak ? 'text-sky-700' : 'text-slate-500'}">MUTFAK ${roomScenes.mutfak ? '(' + roomScenes.mutfak + ')' : ''}</div>
                    </div>
                </div>
            `;
            }
            break;
        case 'guest-mode':
            if (!guestMode) {
                content = emptyCardState('MİSAFİR', 'Misafir ağı ayarlanınca burada görünür.', svg, 'text-sky-500');
            } else {
                content = `
                <div class="flex items-center justify-between mb-2 text-sky-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">MİSAFİR</span>
                    </div>
                    <div class="w-7 h-4 ${guestMode.active ? 'bg-sky-500' : 'bg-slate-300'} rounded-full relative"><div class="w-3 h-3 bg-white rounded-full absolute ${guestMode.active ? 'right-0.5' : 'left-0.5'} top-0.5 shadow-sm transition-all"></div></div>
                </div>
                <div class="mt-auto">
                    <h3 class="font-bold text-slate-900 text-sm mb-1">${guestMode.active ? 'Ağ Paylaşımda' : 'Kapalı'}</h3>
                    <div class="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono font-bold text-slate-600">${guestMode.active ? (guestMode.ssid || 'Misafir ağı') : 'Erişim Yok'}</div>
                </div>
            `;
            }
            break;
        case 'data-dashboard':
            content = `
                <div class="flex items-center justify-between mb-2 text-slate-600">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">VERİLER</span>
                    </div>
                </div>
                <div class="mt-auto">
                    <div class="flex items-end gap-1 mb-2">
                        <h3 class="font-extrabold text-slate-900 text-xl leading-none">${eventCount}</h3>
                        <span class="text-[10px] text-slate-500 font-bold mb-0.5">olay</span>
                    </div>
                    <div class="flex gap-1 h-5 items-end">
                        ${[20, 32, 44, eventCount ? 78 : 24, 36].map((height, index) => `<div class="w-full ${eventCount && index === 3 ? 'bg-[#4C7DFF] shadow-[0_0_8px_rgba(76,125,255,0.35)]' : 'bg-sky-100'} rounded-t-sm" style="height: ${height}%"></div>`).join('')}
                    </div>
                </div>
            `;
            break;
        case 'device-health':
            content = `
                <div class="flex items-center justify-between mb-2 text-sky-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">CİHAZLAR</span>
                    </div>
                </div>
                <div class="flex items-center gap-3 mt-auto">
                    <div class="w-9 h-9 rounded-full border-4 ${pairedDevices.length ? 'border-emerald-500' : 'border-slate-200'} flex items-center justify-center font-bold text-slate-900 text-sm">${pairedDevices.length}</div>
                    <div class="text-[10px] font-medium text-slate-500 leading-tight">${pairedDevices.length ? 'Cihaz<br>Kayıtlı' : 'Cihaz<br>Yok'}</div>
                </div>
            `;
            break;
        case 'security-summary':
            if (lockCount === 0 && cameraCount === 0) {
                content = emptyCardState('GÜVENLİK', 'Kilit, sensör veya kamera ekleyince özet oluşur.', svg);
            } else {
                content = `
                <div class="flex items-center justify-between mb-2 text-slate-700">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">GÜVENLİK</span>
                    </div>
                </div>
                <div class="space-y-1.5 mt-auto">
                    <div class="flex items-center gap-2 text-[10px] font-medium text-emerald-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> ${lockCount} kilit/sensör
                    </div>
                    <div class="flex items-center gap-2 text-[10px] font-medium text-emerald-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> ${cameraCount} kamera
                    </div>
                </div>
            `;
            }
            break;
        case 'cleaning-routine':
            if (robotCount === 0) {
                content = emptyCardState('TEMİZLİK', 'Robot süpürge eklenince rutin hazır olur.', svg, 'text-emerald-500');
            } else {
                content = `
                <div class="flex items-center justify-between mb-2 text-emerald-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">TEMİZLİK</span>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-auto">
                    <div>
                        <h3 class="font-bold text-slate-900 text-sm leading-tight mb-0.5">${robotCount} robot bağlı</h3>
                        <p class="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">Rutin ayarla</p>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-[#4C7DFF] text-white flex items-center justify-center shadow-lg">
                        <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                    </div>
                </div>
            `;
            }
            break;
        case 'leave-home-summary':
            if (pairedDevices.length === 0) {
                content = emptyCardState('ÇIKIŞ', 'Çıkış kontrolü için cihaz ekle.', svg, 'text-amber-500');
            } else {
                content = `
                <div class="flex items-center justify-between mb-2 text-amber-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">ÇIKIŞ</span>
                    </div>
                </div>
                <div class="mt-auto bg-slate-50/80 rounded-xl p-2 flex items-center gap-2 border border-slate-100">
                    <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div class="text-[9px] font-semibold text-slate-600 leading-tight">${pairedDevices.length} cihaz<br>kontrol edilecek</div>
                </div>
            `;
            }
            break;
        case 'sleep-prep': {
            const sleepTime = homeSchedule && homeSchedule.time ? homeSchedule.time : null;
            content = `
                <div class="flex items-center justify-between mb-2 text-slate-600">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">UYKU</span>
                    </div>
                    <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </div>
                <div class="mt-auto">
                    <h3 class="font-extrabold text-slate-900 text-2xl">${sleepTime || '--:--'}</h3>
                    <p class="text-[10px] font-bold text-[#4C7DFF]">${sleepTime ? 'Hazırlık başlayacak' : 'Plan yok'}</p>
                </div>
            `;
            break;
        }
        case 'comfort-room':
            if (!airQuality && climateCount === 0) {
                content = emptyCardState('KONFOR', 'Termostat veya hava sensörü bağlanınca görünür.', svg, 'text-emerald-500');
            } else {
                const temp = airQuality && typeof airQuality.temp !== 'undefined' ? airQuality.temp : '--';
                content = `
                <div class="flex items-center justify-between mb-2 text-emerald-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">KONFOR</span>
                    </div>
                </div>
                <div class="mt-auto">
                    <div class="flex items-end gap-1 mb-0.5">
                        <h3 class="font-extrabold text-slate-900 text-[26px] leading-none tracking-tighter">${temp}</h3>
                        <span class="text-xs text-slate-400 font-bold mb-0.5">°C</span>
                    </div>
                    <p class="text-[9px] font-medium text-slate-500 uppercase tracking-wider">${airQuality ? 'SENSÖR ÖLÇÜMÜ' : 'TERMOSTAT BAĞLI'}</p>
                </div>
            `;
            }
            break;
        case 'home-health':
            if (!airQuality && pairedDevices.length === 0) {
                content = emptyCardState('SAĞLIK', 'Ev sağlığı için cihaz veya sensör verisi gerekli.', svg, 'text-sky-500');
            } else {
                const healthScore = airQuality && typeof airQuality.aqi === 'number'
                    ? Math.max(0, Math.min(100, 100 - Math.round(airQuality.aqi / 2)))
                    : Math.min(100, pairedDevices.length * 10);
                const healthLabel = healthScore >= 80 ? 'İyi' : healthScore >= 50 ? 'Kontrol Et' : 'Eksik Veri';
                content = `
                <div class="flex items-center justify-between mb-2 text-sky-500">
                    <div class="flex items-center gap-2">
                        ${svg.replace('w-5 h-5', 'w-4 h-4')} <span class="text-[10px] font-bold uppercase tracking-wider">SAĞLIK</span>
                    </div>
                </div>
                <div class="w-full flex items-center gap-2.5 mt-auto">
                    <svg viewBox="0 0 36 36" class="w-10 h-10 text-emerald-500 transform -rotate-90 shrink-0">
                        <path stroke-dasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" stroke-width="4" />
                        <path stroke-dasharray="${healthScore}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                    </svg>
                    <div>
                        <h3 class="font-extrabold text-slate-900 text-lg leading-none mb-0.5">%${healthScore}</h3>
                        <p class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">${healthLabel}</p>
                    </div>
                </div>
            `;
            }
            break;
        default:
            content = `
                <div class="w-9 h-9 rounded-full ${accent.wrap} flex items-center justify-center mb-2">
                    ${svg.replace('w-5 h-5', 'w-4 h-4')}
                </div>
                <div class="mt-auto">
                    <h3 class="font-bold text-sm leading-tight text-slate-900 mb-0.5">${card.title}</h3>
                    <p class="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Kurulum bekliyor</p>
                </div>
            `;
            break;
    }

    return `
        <a class="bg-white rounded-[1.2rem] p-3.5 card-shadow flex flex-col h-[130px] active:scale-[0.98] transition-transform overflow-hidden relative border border-slate-100" href="${href}" id="${id}">
            ${content}
        </a>
    `;
}


function syncHomeStaticCards() {
    const selected = new Set(getSelectedSmartHomeIds());
    CORE_SMART_HOME_IDS.forEach(id => {
        const el = document.getElementById('card-' + id);
        if (el) {
            el.style.display = selected.has(id) ? 'flex' : 'none';
        }
    });
}

function renderExtraSmartHomeCards() {
    const grid = document.getElementById('extra-smart-home-grid');
    if (!grid) return;

    const extras = window.getSelectedSmartHomeCards().filter(card => !CORE_SMART_HOME_IDS.includes(card.id));
    if (extras.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('hidden');
        return;
    }

    grid.classList.remove('hidden');
    grid.innerHTML = extras.map(card => buildCustomHomeCard(card)).join('');
}

function renderTapToRunCards() {
    const section = document.getElementById('tap-to-run-section');
    const grid = document.getElementById('tap-to-run-grid');
    if (!section || !grid) return;

    const selected = window.getTapToRunCards();
    if (selected.length === 0) {
        section.classList.add('hidden');
        grid.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    grid.innerHTML = selected.map(card => {
        const accent = getCardAccentClasses(card.icon);
        return `
            <a class="bg-white rounded-2xl px-4 py-4 card-shadow flex items-center justify-between gap-3" href="${getCardHref(card.id)}" id="dyn-card-${card.id}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${accent.wrap} flex items-center justify-center">
                        ${getCardIconSvg(card.icon)}
                    </div>
                    <div>
                        <div class="font-semibold text-sm leading-tight">${card.title}</div>
                        <div class="text-xs text-slate-500 mt-1">Dokun Çalıştır</div>
                    </div>
                </div>
                <span class="text-xs font-semibold text-[#4C7DFF]">Çalıştır</span>
            </a>
        `;
    }).join('');
}

window.refreshDashboardSupplements = function() {
    syncHomeStaticCards();
    renderExtraSmartHomeCards();
    renderTapToRunCards();
};

function renderDevices() {
    const data = window.NEXUS_DATA;
    // Backend cihazıları ile kullanıcının yerel eşleştirdiği cihazıları birleştir.
    const devices = getMergedDevices(data && Array.isArray(data.devices) ? data.devices : []);
    
    const grids = document.querySelectorAll('[data-purpose="devices-grid"]');
    if (grids.length === 0) return;
    
    let html = '';
    
    if (devices.length === 0) {
        html = `<div class="col-span-2 text-center pt-8 pb-2 opacity-70">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3 text-slate-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-sm font-medium text-slate-500">Henüz bu eve bir cihazı eklemediniz.</p>
        </div>`;
    } else {
        const hidden = getHiddenDeviceIds();
        
        devices.forEach(device => {
            if (hidden.includes(device.id)) return;
            
            // Icon logic
            let iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>'; // Default power icon
            let color = 'text-slate-700';
            let bg = 'bg-slate-100';
            
            if (device.type === 'light' || device.type === 'lamp' || (device.name && device.name.toLowerCase().includes('ışık'))) {
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>';
                color = 'text-amber-500';
                bg = 'bg-amber-50';
            } else if (device.type === 'ac' || device.type === 'thermostat' || (device.name && device.name.toLowerCase().includes('klima'))) {
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>';
                color = 'text-blue-500';
                bg = 'bg-blue-50';
            } else if (device.type === 'tv' || (device.name && device.name.toLowerCase().includes('tv'))) {
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
                color = 'text-blue-500';
                bg = 'bg-blue-50';
            }
            
            html += `
            <article class="relative bg-white rounded-3xl p-5 card-shadow flex flex-col justify-between h-40" id="dyn-card-${device.id}">
                <div>
                    <div class="w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center mb-3">
                        ${iconSvg}
                    </div>
                    <h3 class="font-bold text-base leading-tight truncate">${device.name || 'Cihaz'}</h3>
                </div>
                <p class="text-slate-500 text-sm font-medium leading-5">${device.state || 'Kapalı'}</p>
            </article>
            `;
        });
    }
    
    grids.forEach(grid => {
        grid.innerHTML = html;
    });
}

window.renderNexusDevices = renderDevices;
