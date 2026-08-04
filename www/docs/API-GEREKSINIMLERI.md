# NEXUS Mobil - API Gereksinimleri

Bu belge, NEXUS mobil uygulamasının tam işlevsellik için ihtiyaç duyduğu API entegrasyonlarını ve_data akışlarını detaylandırır.

---

## 📡 Mevcut API Bağımlılıkları

### 1. Hava Durumu Servisleri

#### Open-Meteo API (Mevcut Kullanım)
- **Amaç**: Hava durumu bilgisi ve tahminler
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Kullanım Yeri**: `stitch-home.html`, `stitch-map.html`
- **Parametreler**:
  - `latitude`
  - `longitude`
  - `current_weather=true`
- **Durum**: ✅ Çalışıyor (Online)
- **Offline Çözüm**: ❌ Yok - Cache mekanizması gerekiyor

#### Geocoding API (Open-Meteo)
- **Amaç**: Konum adından koordinat elde etmek
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Kullanım Yeri**: `stitch-home.html`
- **Parametreler**:
  - `name` (şehir/ilçe adı)
  - `count=1`
  - `language=tr`
  - `format=json`
- **Durum**: ✅ Çalışıyor (Online)
- **Offline Çözüm**: ❌ Yok - Koordinat cache'lenmeli

---

## 🔌 Entegrasyon API'leri

### 1. Home Assistant / IoT Platform Entegrasyonu

#### Cihaz Keşfi ve Kontrol
- **Amaç**: Akıllı ev cihazlarını keşfetmek ve kontrol etmek
- **Gereksinimler**:
  - Cihaz listesi alma (GET /devices)
  - Cihaz durumunu okuma (GET /devices/{id}/state)
  - Cihaz kontrolü (POST /devices/{id}/control)
  - Senaryo/sahne yürütme (POST /scenes/{id}/execute)
  - Gerçek zamanlı durum güncelleme (WebSocket/Server-Sent Events)

#### Oturum ve Kimlik Doğrulama
- **Amaç**: Kullanıcı oturumlarını yönetmek
- **Gereksinimler**:
  - Kullanıcı giriş (POST /auth/login)
  - Token yenileme (POST /auth/refresh)
  - Oturum geçerlilik kontrolü (GET /auth/validate)
  - Çoklu ev/hanehalkı desteği

#### Veri Senkronizasyonu
- **Amaç**: Local değişiklikleri sunucu ile senkronize etmek
- **Gereksinimler**:
  - Cihaz eşleştirme verisi senkronizasyonu
  - Kullanıcı tercihleri senkronizasyonu
  - Kart ve widget konfigürasyonu senkronizasyonu

---

## 🗃️ Local Storage (nexus*) Kullanımı

### Mevcut Storage Key'leri

| Key | Açıklama | Tür | Öncelik |
|-----|----------|----|----------|
| `nexusEvents` | Bildirim ve olay kaydı | Array | 🟢 Düşük |
| `nexusReadNotifs` | Okunmuş bildirim ID'leri | Array | 🟢 Düşük |
| `nexusPairedDevices` | Eşleştirilmiş cihazlar listesi | Array | 🔴 Kritik |
| `nexusSelectedSmartHomeCards` | Seçili akıllı ev kartları | Array | 🟡 Orta |
| `nexusSelectedTapToRunCards` | Seçili dokun-çalıştır kartları | Array | 🟡 Orta |
| `nexusHiddenCards` | Gizlenmiş kart ID'leri | Array | 🟢 Düşük |
| `nexusDndState` | Rahatsız Etme modu durumu | String | 🟡 Orta |
| `nexusDndSchedule` | Rahatsız Etme programı | Object | 🟡 Orta |
| `nexusDndEndTime` | Rahatsız Etme bitiş zamanı | Number | 🟡 Orta |
| `nexusPlusPlan` | Plus abonelik planı | String | 🟡 Orta |
| `nexusPlusSince` | Plus abonelik başlangıç zamanı | String | 🟡 Orta |
| `nexusHouseholdName` | Hanehalkı adı | String | 🟢 Düşük |
| `nexusHousehold` | Hanehalkı verisi | Object | 🟢 Düşük |
| `nexusAvatar` | Kullanıcı avatar URL'si | String | 🟢 Düşük |
| `nexusWeatherLocation` | Hava durumu konumu | String | 🟡 Orta |
| `nexusWeatherCoords` | Hava durumu koordinatları | Object | 🟡 Orta |
| `nexusEnergyEnabledMap` | Enerji tasarruf stratejileri | Object | 🟡 Orta |
| `nexusFavoritesCollapsed` | Favoriler bölüm durumu | Boolean | 🟢 Düşük |
| `nexusSelectedPlan` | Seçili Plus planı | String | 🟡 Orta |

---

## 🎯 API Entegrasyonu Öncelikleri

### Phase 1: Temel İşlevsellik (Kritik)
1. **Cihaz Kontrol API**
   - Cihaz listesi
   - Durum okuma
   - Temel kontrol (aç/kapat, değeri ayarla)
   - **Zaman Çizelgesi**: 1-2 hafta

2. **Oturum Yönetimi API**
   - Kullanıcı giriş/çıkış
   - Token yönetimi
   - **Zaman Çizelgesi**: 1 hafta

### Phase 2: Gelişmiş Özellikler (Orta)
3. **Senaryo ve Otomasyon API**
   - Senaryo listesi
   - Senaryo yürütme
   - Zamanlanmış görevler
   - **Zaman Çizelgesi**: 2-3 hafta

4. **Veri Senkronizasyonu**
   - Local → Sunucu senkronizasyonu
   - Çatışma çözümleme
   - **Zaman Çizelgesi**: 2 hafta

### Phase 3: Premium Özellikler (Düşük)
5. **Gelişmiş Analitik API**
   - Enerji tüketimi verileri
   - Kullanım istatistikleri
   - **Zaman Çizelgesi**: 3-4 hafta

6. **AI Entegrasyonu**
   - Doğal dil komutları
   - Öneri sistemi
   - **Zaman Çizelgesi**: 4+ hafta

---

## 🔄 Offline Çalışma Stratejisi

### 1. Data Caching
- **Hava Durumu**: Son alınan veriyi cache'le + timestamp
- **Cihaz Durumu**: Local storage'da son bilinen durum
- **Konum Verisi**: Koordinat ve konum adı cache'lenmeli

### 2. Queue Mekanizması
- **Offline Değişiklikler**: Local'de queue'lenmeli
- **Online Olduğunda**: Queue'deki değişiklikler sunucuya gönderilmeli
- **Çatışma Çözümleme**: Timestamp bazlı veya kullanıcı onayı

### 3. Fallback UI
- **Offline Modu**: "Çevrimdışı" bannerı
- **Veri Yok**: "Son bilinen veri: [tarih]" göstergesi
- **Eylemler**: "İnternet bağlandığında senkronize edilecek" mesajı

---

## 📋 API Contract Örnekleri

### Cihaz Listesi
```json
GET /api/devices
Response:
{
  "devices": [
    {
      "id": "device_001",
      "name": "Salon Işığı",
      "type": "light",
      "category": "lighting",
      "state": {
        "power": "on",
        "brightness": 75,
        "color_temp": 4000
      },
      "capabilities": ["on_off", "brightness", "color_temp"],
      "last_updated": "2026-08-04T10:00:00Z"
    }
  ]
}
```

### Cihaz Kontrol
```json
POST /api/devices/device_001/control
Body:
{
  "commands": [
    {"capability": "power", "value": "off"},
    {"capability": "brightness", "value": 50}
  ]
}
Response:
{
  "success": true,
  "updated_state": {
    "power": "off",
    "brightness": 50
  }
}
```

### Senaryo Yürütme
```json
POST /api/scenes/scene_001/execute
Response:
{
  "success": true,
  "executed_actions": [
    {"device_id": "device_001", "action": "turn_off"},
    {"device_id": "device_002", "action": "set_brightness", "value": 30}
  ]
}
```

---

## 🔒 Güvenlik Gereksinimleri

### 1. Kimlik Doğrulama
- JWT token kullanımı
- Token süresi: 24 saat
- Refresh token: 30 gün

### 2. Veri Koruma
- Tüm API çağrıları HTTPS üzerinden
- Hassas veriler için end-to-end şifreleme
- Local storage'da hassas veriler saklanmama

### 3. Yetkilendirme
- Kullanıcı bazlı erişim kontrolü
- Cihaz bazlı yetkilendirme
- IP kısıtlaması (opsiyonel)

---

## 📊 Performans Hedefleri

| Metrik | Hedef Değer | Ölçüm Yöntemi |
|--------|-------------|---------------|
| API Yanıt Süresi | < 500ms | Ortalama |
| Hata Oranı | < 0.1% | API çağrıları |
| Offline Senkronizasyon | < 2s | 100 değişiklik |
| Sayfa Yükleme | < 2s | 3G bağlantı |

---

## 🎓 Önerilen API Teknolojileri

### Backend Seçenekleri
1. **Node.js + Express** - Hızlı prototip
2. **Python + FastAPI** - Yüksek performans
3. **Go** - Çok yüksek performans
4. **Firebase** - Hızlı başlangıç

### Real-time Seçenekleri
1. **WebSocket** - Tam kontrol
2. **Server-Sent Events** - Basit tek yönlü
3. **Firebase Realtime Database** - Kolay entegrasyon
4. **Ably/Pusher** - Managed çözüm

---

*Son Güncelleme: 04 Ağustos 2026*
