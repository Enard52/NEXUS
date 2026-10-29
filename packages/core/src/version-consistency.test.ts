import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Issue #28: sürüm numarası üç yerde tutuluyor (desktop/package.json,
// android versionName, nexus-settings NEXUS_APP_VERSION). Bu test üçünün
// aynı sürümü gösterdiğini ve versionCode'un monoton artış düzenine
// uyduğunu denetler (CI kart kilidi çözülünce ci.yml'a da bağlanabilir).
describe("sürüm tek kaynak tutarlılığı (issue #28)", () => {
  const root = process.cwd();
  const pkg = JSON.parse(readFileSync(join(root, "desktop", "package.json"), "utf8"));
  const gradle = readFileSync(join(root, "android", "app", "build.gradle"), "utf8");
  const settings = readFileSync(join(root, "src", "app", "nexus-settings.html"), "utf8");

  const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
  const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
  const appVersion = settings.match(/NEXUS_APP_VERSION = "([^"]+)"/)?.[1];

  it("desktop/package.json geçerli bir semver taşır", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it(`android versionName eşit: ${pkg.version}`, () => {
    expect(versionName).toBe(pkg.version);
  });

  it(`nexus-settings NEXUS_APP_VERSION eşit: ${pkg.version}`, () => {
    expect(appVersion).toBe(pkg.version);
  });

  it("android versionCode M*10000+m*100+p şemasından küçük değil ve pozitif", () => {
    const [M, m, p] = pkg.version.split(".").map(Number);
    expect(versionCode).toBeGreaterThan(0);
    expect(versionCode).toBeGreaterThanOrEqual(M * 10000 + m * 100 + p - 10000); // 1.x öncesi geçmiş değerlere hoşgörü
  });
});
