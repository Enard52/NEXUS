# NEXUS Mobile App

Capacitor tabanli Android ve iOS uygulamasi. Mobil WebView icine repo kokundeki statik NEXUS sayfalari (`stitch-*.html`) paketlenir.

Bu projede mobil onizleme icin guncel kaynak dosyalar repo kokundedir. `mobile-app/www/` klasoru uretilmis cikti klasorudur; eski gorunum gormemek icin kok dosyalar duzenlendikten sonra `npm run build:web` ile yeniden olusturulur.

## Gereksinimler

- Node.js 20 veya uzeri
- Android: Android Studio veya Android SDK command-line tools
- iOS: macOS uzerinde Xcode ve CocoaPods

## Hızlı Başlangıç

```bash
cd mobile-app
npm install
npm run build:web
npx cap sync
```

## Paketleme Mantığı

`scripts/build-web.mjs` su isi yapar:

- `mobile-app/www/` klasorunu temizler.
- Repo kokundeki tum `stitch-*.html` sayfalarini kopyalar.
- Ortak scriptleri (`auth.js`, `theme.js`, `data.js`, `ai-fab.js`, `sheet-gestures.js`, `smart-scene-page.js`, `smart-card-detail-state.js`) ekler.
- Gerekli statik assetleri, ornegin `siri-logo.png`, ekler.
- `index.html` dosyasini `stitch-home.html` ekranina yonlendirecek sekilde uretir.

Bu nedenle `mobile-app/www/` icindeki HTML dosyalari elle ana kaynak gibi dusunulmemeli; onlar mobil paket ve tarayici onizlemesi icin uretilmis kopyalardir.

## Android

```bash
npm run build:web
npx cap sync android
cd android
./gradlew assembleDebug
```

## iOS

```bash
npm run build:web
npx cap sync ios
```

Windows uzerinde `cap sync ios` dosyalari kopyalar, fakat CocoaPods/Xcode adimlari macOS uzerinde tamamlanir.

## Guncelleme Akisi

1. Repo kokundeki `stitch-*.html`, `data.js` veya ortak scriptleri duzenle.
2. `cd mobile-app && npm run build:web` calistir.
3. Native projeleri guncellemek icin `npx cap sync` calistir.

## Lisans

UNLICENSED - NEXUS Technologies Inc.
