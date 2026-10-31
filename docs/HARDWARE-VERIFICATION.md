# Gerçek cihazla doğrulama durumu

Sürüm notlarına ve commit mesajına aynen taşınacak satır:

> Tuya (yerel, 3.3/3.4) ve TP-Link Tapo (KLAP / securePassthrough) bağlayıcıları gerçek cihazla doğrulanmadı.
> Paket biçimleri yayımlanmış belgelere (tinytuya, python-kasa) göre yazıldı ve `packages/web/src/lan-secure.test.ts` içinde
> kendi içinde sınanıyor; bu test donanım doğrulaması değildir.

Doğrulama bekleyen bağlayıcılar: `tuya-local`, `tapo`. Gerçek bir cihaz eşleştirilip komut/durum okuması
başarılı olduğunda bu dosya güncellenir.

## Bağlayıcı tablosu

Uygulamadaki "Doğrulandı / Henüz doğrulanmadı" rozeti `src/app/supported-devices.js` içindeki grubun
`verified` alanından gelir. Alan yalnız aşağıdaki tabloda **Doğrulandı** satırı (tarih + cihaz modeli + kim
denedi) olduktan sonra `verified: true` yapılır. Paket testleri (`packages/web/src/lan-*.test.ts`) donanım
doğrulaması sayılmaz.

| Bağlayıcı (`protocol`) | Marka | Platform | Durum | Denenen cihaz / tarih |
| --- | --- | --- | --- | --- |
| `shelly` | Shelly Gen1 | tümü | Henüz doğrulanmadı | — |
| `shelly-rpc` | Shelly Plus / Pro | tümü | Henüz doğrulanmadı | — |
| `tasmota` | Tasmota | tümü | Henüz doğrulanmadı | — |
| `wled` | WLED | tümü | Henüz doğrulanmadı | — |
| `hue` | Philips Hue köprüsü | tümü | Henüz doğrulanmadı | — |
| `homeassistant` | Home Assistant | tümü | Henüz doğrulanmadı | — |
| `esphome` | ESPHome | tümü | Henüz doğrulanmadı | — |
| `nanoleaf` | Nanoleaf | tümü | Henüz doğrulanmadı | — |
| `sonoff` | Sonoff (DIY / LAN) | tümü | Henüz doğrulanmadı | — |
| `wol` | Wake-on-LAN | tümü | Henüz doğrulanmadı | — |
| `mqtt` | MQTT / Zigbee2MQTT | masaüstü | Henüz doğrulanmadı | — |
| `tapo` | TP-Link Tapo | masaüstü | Henüz doğrulanmadı | — |
| `kasa` | TP-Link Kasa | masaüstü | Henüz doğrulanmadı | — |
| `tuya-local` | Tuya (yerel) | masaüstü | Henüz doğrulanmadı | — |
| `yeelight` | Yeelight | masaüstü | Henüz doğrulanmadı | — |
| `wiz` | WiZ | masaüstü | Henüz doğrulanmadı | — |
| `lifx` | LIFX | masaüstü | Henüz doğrulanmadı | — |
| `govee` | Govee (LAN API) | masaüstü | Henüz doğrulanmadı | — |

Tablo canlı testte (yol haritası Aşama 9) doldurulur.
