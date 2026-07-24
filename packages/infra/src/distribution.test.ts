import { describe, expect, it } from "vitest";
import {
  computeChecksum,
  detectOs,
  validateStoreLink,
  VersionInfoService,
  type ReleaseInfo,
} from "./index.js";

const UA = {
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36",
  bot: "curl/8.4.0",
};

describe("detectOs (FAZ 18)", () => {
  it("detects each desktop and mobile platform from the User-Agent", () => {
    expect(detectOs(UA.windows)).toBe("windows");
    expect(detectOs(UA.mac)).toBe("macos");
    expect(detectOs(UA.linux)).toBe("linux");
    expect(detectOs(UA.iphone)).toBe("ios");
    expect(detectOs(UA.android)).toBe("android");
  });

  it("returns undefined for an unknown UA so the site falls back to manual choice", () => {
    expect(detectOs(UA.bot)).toBeUndefined();
  });

  it("prefers mobile over the desktop hints a mobile UA also contains", () => {
    // Android UAs contain "Linux"; iOS UAs contain "Mac OS X".
    expect(detectOs(UA.android)).toBe("android");
    expect(detectOs(UA.iphone)).toBe("ios");
  });
});

describe("computeChecksum (FAZ 18)", () => {
  it("produces the real SHA-256 hex of the contents", () => {
    // Known SHA-256 of the empty string.
    expect(computeChecksum("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(computeChecksum("nexus")).toHaveLength(64);
  });
});

describe("VersionInfoService (FAZ 18)", () => {
  function seeded() {
    const svc = new VersionInfoService();
    const win: ReleaseInfo = {
      platform: "windows",
      version: "1.0.0",
      minOs: "Windows 10 and later",
      checksumSha256: computeChecksum("windows-installer"),
      downloadUrl: "https://cdn.example.com/nexus-1.0.0.msi",
    };
    svc.publish(win);
    return { svc, win };
  }

  it("serves version, min-OS and checksum (never hardcoded in the site)", () => {
    const { svc, win } = seeded();
    const info = svc.get("windows")!;
    expect(info.version).toBe("1.0.0");
    expect(info.minOs).toBe("Windows 10 and later");
    expect(info.checksumSha256).toBe(win.checksumSha256);
  });

  it("features the release matching the visitor's UA", () => {
    const { svc } = seeded();
    expect(svc.featuredFor(UA.windows)?.platform).toBe("windows");
    // No macOS release published yet ⇒ nothing to feature, manual list is used.
    expect(svc.featuredFor(UA.mac)).toBeUndefined();
  });
});

describe("validateStoreLink (FAZ 18)", () => {
  it("accepts real App Store and Google Play links over https", () => {
    expect(validateStoreLink("https://apps.apple.com/app/id123")).toBe(true);
    expect(validateStoreLink("https://play.google.com/store/apps/details?id=ai.nexus")).toBe(true);
  });

  it("rejects non-store or insecure links", () => {
    expect(validateStoreLink("http://apps.apple.com/app/id123")).toBe(false);
    expect(validateStoreLink("https://evil.example.com/app")).toBe(false);
    expect(validateStoreLink("not a url")).toBe(false);
  });
});
