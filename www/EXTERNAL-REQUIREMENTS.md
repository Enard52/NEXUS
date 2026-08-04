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

## Kod İmzalama & Dağıtım — FAZ 18

- **Gereken:** Windows **Authenticode** sertifikası, Apple **notarization** hesabı, CDN.
- **Hazır olan kod:** OS algılama, sürüm bilgisi API'si, SHA-256 checksum, mağaza linki doğrulama, indirme bağlantıları (demoReleases mock).
- **Yapılacak:** Paketleri gerçekten imzalama, CDN'e yükleme, Universal Links/App Links kurulumu. Gerçek kurulum dosyalarını (örn. `NEXUS-Setup-3.14.2.exe`) derleme sonrası `packages/web/dist/downloads/` altına kopyalama veya CDN linklerine yönlendirme (şu anda 404 hatası veriyor).

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
