# NEXUS AI — Bekleyen Dış Kaynak Gereksinimleri

> Kod tarafında yapılabilecek her şey tamamlandı (23 paket, tümü `implemented = true`,
> tam test kapsamı). Aşağıdaki maddeler **kodla bitirilemez** — senin sağlayacağın
> gerçek hesap/sertifika/servis gerektirir (ROADMAP kural #8: sahteyle "başarılı"
> gösterme). Kaynak hazır olduğunda ilgili faz uçtan uca tamamlanabilir.

## Ödeme — FAZ 15

- **Gereken:** Canlı/sandbox Stripe (ve TR için Iyzico) API anahtarları.
- **Hazır olan kod:** Plan katmanları, abonelik yaşam döngüsü, dunning, sandbox sağlayıcı.
- **Yapılacak:** `SandboxPaymentProvider` yerine gerçek Stripe adapter'ı bağlama;
  deneme→ücret→iptal→fatura akışını gerçek sandbox'ta doğrulama.

## Kod İmzalama & Dağıtım — FAZ 18 (GÜNCELLENDİ 2026-09-26)

- **Karar:** Electron masaüstü uygulaması projeden kaldırıldı (Yol A: mobil-öncelikli
  yayın — bkz. `docs/superpowers/specs/2026-09-26-mobil-oncelikli-yayin-design.md`).
  Masaüstü, Faz 2'de mobil tasarım uyarlanarak sıfırdan üretilecek.
- **Gereken (mobil):** Google Play Console hesabı ($25 tek seferlik). iOS için Apple
  Developer ($99/yıl) — yayın kararı kullanıcıda.
- **Hazır olan kod:** OS algılama, sürüm bilgisi API'si, SHA-256 checksum, mağaza link
  doğrulama, site indirme altyapısı.
- **Yapılacak:** Release APK üretimi + SHA-256; site indirme bölümünün masaüstü
  kartlarından mobil kartlara geçilmesi (Plan 6). Authenticode/notarization maddeleri
  Faz 2'ye ertelendi. `public/downloads/` içindeki eski masaüstü kurulumu dosyaları
  (~486 MB) Faz 2 kararına kadar bekletiliyor.

## Mobil Uygulamalar — FAZ 9

- **Gereken:** Apple Developer + Google Play Console hesapları, native build ortamı.
- **Hazır olan kod:** Paylaşılan mantık paketleri, ekran view-model'leri, design token'ları, i18n.
- **Yapılacak:** iOS/Android native (veya cross-platform) kabuk; masaüstü paritesi.

## Gerçek OS Adapter'ları — FAZ 3 / 8

- **Gereken:** macOS/Windows/Linux üzerinde gerçek çalıştırma & test.
- **Hazır olan kod:** Platform Abstraction Layer + `MockPlatformAgent` + risk sınıflandırma.
- **Yapılacak:** Gerçek PowerShell/AppleScript/Shell adapter'ları (`PlatformAgent` implementasyonu).

## Bağımsız Güvenlik & Yük Testi — FAZ 17

- **Gereken:** Bağımsız pentest firması/aracı, yük testi altyapısı, erişilebilirlik denetçisi.
- **Hazır olan kod:** Entegrasyon + regresyon test paketi, WCAG kontrast doğrulaması.
- **Yapılacak:** Üçüncü taraf pentest, gerçek eşzamanlı yük ölçümü.

## Hukuki Onay — FAZ 19

- **Gereken:** Gerçek hukuk danışmanı onayı.
- **Hazır olan kod:** ToS / Gizlilik / Çerez taslakları (zorunlu "avukat incelemeli" ibaresiyle), rıza akışı, DSAR.
- **Yapılacak:** Avukat incelemesi ve nihai yayın.

## Beta & Mağaza Yayını — FAZ 21

- **Gereken:** Gerçek beta kullanıcı kohortu, App Store / Google Play başvuru & onayı.
- **Hazır olan kod:** Onboarding, destek, opt-in analitik.
- **Yapılacak:** Kapalı beta, geri bildirim düzeltmeleri, mağaza başvurusu.
