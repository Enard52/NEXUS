# FAQ / SSS

## Is NEXUS really free?

Yes. The apps and the local device control are free. No hub and no vendor cloud are needed.

## Does it work without an account?

Yes. Local control, automations and backups work on the device without signing in. An account is only needed for
cloud sync and the Family features.

## Which devices work?

See [COMPATIBILITY.md](COMPATIBILITY.md) and [CONNECTORS.md](CONNECTORS.md). Connectors are written from public protocol
documentation and covered by automated tests, but most are **not verified on real hardware yet**
([HARDWARE-VERIFICATION.md](HARDWARE-VERIFICATION.md)). If your device works or fails, please file a device report.

## My device is not found.

1. Phone/computer and device must be on the same Wi-Fi (guest networks and VPNs often block discovery).
2. Enter the device's IP address by hand in the pairing screen.
3. Some brands (Tuya, Tapo, Kasa, Zigbee2MQTT and others) only work in the desktop app.

## Where are my device passwords and keys stored?

Only on the device you entered them on. They are never synced to the cloud or included in backups. In the desktop
app they are encrypted with the operating-system keychain, on Android with the Android Keystore; in a browser they are stored unencrypted in local storage.

## Is any data sent anywhere?

Cloud sync and Family (if you sign in) use our Supabase project. Error reports are off unless you turn them on in
Settings. The privacy policy on the site names every service that receives data.

## Can I use it away from home?

Yes, with your own VPN such as WireGuard or Tailscale: see [REMOTE-ACCESS.md](REMOTE-ACCESS.md).

## How do I verify a download?

See [VERIFY-DOWNLOAD.md](VERIFY-DOWNLOAD.md).

## iPhone?

There is no App Store build. Use the web app (Add to Home Screen) or sideload with AltStore: [IOS-BUILD.md](IOS-BUILD.md).

---

## Türkçe

- **Ücretsiz mi?** Evet. Uygulamalar ve yerel cihaz kontrolü ücretsizdir; hub veya üretici bulutu gerekmez.
- **Hesapsız çalışır mı?** Evet. Yerel kontrol, otomasyonlar ve yedekleme hesapsız çalışır. Hesap yalnızca bulut eşitleme ve Aile için gerekir.
- **Cihazım bulunamıyor:** Telefon/bilgisayar ve cihaz aynı Wi-Fi'de olmalı (misafir ağı ve VPN keşfi engeller). Eşleştirme ekranında IP'yi elle gir. Tuya, Tapo, Kasa, Zigbee2MQTT gibi markalar yalnızca masaüstü uygulamasında çalışır.
- **Cihaz şifreleri nerede?** Yalnızca girdiğin cihazda. Buluta eşitlenmez, yedeğe girmez. Masaüstünde işletim sistemi anahtarlığıyla, Android'de Android Keystore ile şifrelenir; tarayıcıda yerel depoda şifresiz durur.
- **Veri gönderiliyor mu?** Giriş yaparsan bulut eşitleme ve Aile bizim Supabase projemizi kullanır. Hata raporu, Ayarlar'dan açmadıkça kapalıdır.
- **Evden uzakta?** Kendi VPN'inle (WireGuard/Tailscale): [REMOTE-ACCESS.md](REMOTE-ACCESS.md).
- **iPhone:** App Store sürümü yok; web uygulamasını ana ekrana ekle ya da AltStore ile kur: [IOS-BUILD.md](IOS-BUILD.md).
