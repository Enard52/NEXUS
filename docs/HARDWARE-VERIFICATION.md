# Gerçek cihazla doğrulama durumu

Sürüm notlarına ve commit mesajına aynen taşınacak satır:

> Tuya (yerel, 3.3/3.4) ve TP-Link Tapo (KLAP / securePassthrough) bağlayıcıları gerçek cihazla doğrulanmadı.
> Paket biçimleri yayımlanmış belgelere (tinytuya, python-kasa) göre yazıldı ve `packages/web/src/lan-secure.test.ts` içinde
> kendi içinde sınanıyor; bu test donanım doğrulaması değildir.

Doğrulama bekleyen bağlayıcılar: `tuya-local`, `tapo`. Gerçek bir cihaz eşleştirilip komut/durum okuması
başarılı olduğunda bu dosya güncellenir.
