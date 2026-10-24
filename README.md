# NEXUS

Akıllı ev asistanı: cihazlarınızla yerel ağda konuşur, hub veya bulut ücreti gerektirmez.

## Platformlar
- **Masaüstü:** Windows ve Linux (\desktop/\, Electron). Sürümler: https://github.com/Enard52/nexus-releases/releases
- **Android:** test APK'sı (\ndroid/\, Capacitor). Kaynak web dosyaları kökte (\www/\ derlenmiş kopya).
- **Web sitesi:** ayrı depo (GitHub Pages).

## Geliştirme
- Kaynak dosyalar kökte (\*.html\, \*.js\, \css/\). Masaüstü paketi \desktop/scripts/prepare-app.cjs\ ile hazırlanır.
- Web kopyası: \
ode scripts/sync-www.mjs\.
- Masaüstü sürümü: \desktop/package.json\ sürümünü artırıp \<sürüm>\ etiketi göndermek, GitHub Actions üzerinden Windows ve Linux kurulum dosyalarını yayınlar.
- Bulut ayarları: \cloud-config.js\ (yerelde, Git'te yok; örnek: \cloud-config.example.js\).

## Yayın ve manuel adımlar
Bkz. \MANUEL-ADIMLAR.md\.

## Lisans
Tüm haklar saklıdır. Bkz. \LICENSE\.
