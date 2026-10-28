import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Yetenek → bildirim eşleşmesi testi (mobil).
//
// Neden var: 1.0.27 ve öncesinde Android manifestinde CAMERA izini BİLDİRİLMEDİ,
// oysa stitch-scan.html eşleştirmenin birincil akışı olarak arkaya bakan kamerayı
// istiyordu (getUserMedia({ video: … })). Android bildirilmeyen yetkiyi otomatik
// reddeder; QR ile eşleştirme telefonda hiç çalışmadı ve kullanıcı yalnız
// "Kamera açılamadı" mesajını gördü. Kod okunarak, manifest okunarak ve tek başına
// test edilerek fark edilemeyen sınıf bu: arayüz bir yetenek istiyor, platform
// bildirimi yok. Bu test o boşluğu kapatır — yeni bir yetenek çağrısı iz
// bildirimi olmadan gelirse kırmızıya döner.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const MANIFEST = path.join(ROOT, "android", "app", "src", "main", "AndroidManifest.xml");
const IOS_PLIST = path.join(ROOT, "ios", "App", "App", "Info.plist");
const APP_DIR = path.join(ROOT, "src", "app");

function appSource(): string {
  return readdirSync(APP_DIR)
    .filter((f) => f.endsWith(".html") || f.endsWith(".js"))
    .map((f) => readFileSync(path.join(APP_DIR, f), "utf8"))
    .join("\n");
}

function declared(permission: string): boolean {
  return readFileSync(MANIFEST, "utf8").includes(`android.permission.${permission}`);
}

function iosKey(key: string): boolean {
  return readFileSync(IOS_PLIST, "utf8").includes(`<key>${key}</key>`);
}

describe("mobile capability declarations", () => {
  const src = appSource();

  it("scans the source bundle (guards against a vacuous pass)", () => {
    // Bu test hiçbir şey okumadan da yeşil yanabilirdi; dosyaların gerçekten
    // bulunduğunu burada sabitliyoruz.
    expect(src.length).toBeGreaterThan(100_000);
    expect(src).toContain("getUserMedia");
  });

  it("declares CAMERA on Android when any screen asks for a video stream", () => {
    const wantsVideo = /getUserMedia\s*\(\s*\{[^}]*video\s*:/s.test(src);
    if (!wantsVideo) return; // yetenek kaldırılırsa bildirim de kaldırılabilir
    expect(declared("CAMERA"), "AndroidManifest.xml: android.permission.CAMERA").toBe(true);
  });

  it("explains the camera to iOS when any screen asks for a video stream", () => {
    const wantsVideo = /getUserMedia\s*\(\s*\{[^}]*video\s*:/s.test(src);
    if (!wantsVideo) return;
    expect(iosKey("NSCameraUsageDescription"), "Info.plist: NSCameraUsageDescription").toBe(true);
  });

  it("declares microphone on Android and iOS when voice capture is used", () => {
    const wantsAudio =
      /getUserMedia\s*\(\s*\{[^}]*audio\s*:\s*true/s.test(src) ||
      /getUserMedia\(\{\s*audio:\s*true\s*\}\)/.test(src);
    if (!wantsAudio) return;
    expect(declared("RECORD_AUDIO"), "AndroidManifest.xml: android.permission.RECORD_AUDIO").toBe(
      true,
    );
    expect(iosKey("NSMicrophoneUsageDescription"), "Info.plist: NSMicrophoneUsageDescription").toBe(
      true,
    );
  });

  it("keeps the camera optional so camera-less devices can still install", () => {
    // QR akışı yoksa bile uygulama kurulabilmeli: tablette/kamerasız cihazda
    // kurulum kodu ve yerel ağ yedeği var.
    const m = readFileSync(MANIFEST, "utf8");
    expect(m).toMatch(/android.hardware.camera"[\s\S]{0,80}required="false"/);
  });

  it("declares geolocation on iOS when location is used", () => {
    const wantsLocation = /geolocation\.getCurrentPosition|navigator\.geolocation/.test(src);
    if (!wantsLocation) return;
    expect(
      iosKey("NSLocationWhenInUseUsageDescription") ||
        iosKey("NSLocationAlwaysAndWhenInUseUsageDescription"),
      "Info.plist: bir NSLocation…UsageDescription anahtarı",
    ).toBe(true);
  });
});
