import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PAGE = readFileSync(resolve(ROOT, "src/app/nexus-household.html"), "utf8");

describe("aile daveti: e-posta uygulaması kendiliğinden açılmaz", () => {
  it("mailto yalnızca mailtoInvite içinde kurulur", () => {
    expect(PAGE.match(/["']mailto:/g) || []).toHaveLength(1);
    expect(PAGE).toMatch(/function mailtoInvite[\s\S]*?window\.location\.href = "mailto:"/);
  });

  it("mailtoInvite yalnızca onay penceresinin düğmesinden çağrılır", () => {
    const calls = PAGE.match(/mailtoInvite\(/g) || [];
    // 1 tanım + 1 onay penceresi düğmesi
    expect(calls).toHaveLength(2);
    expect(PAGE).toMatch(
      /primary: \{ label: "E-posta uygulamasında aç", onClick: function \(\) \{ mailtoInvite/,
    );
  });

  it("gönderim başarısızlığı nedeniyle birlikte kullanıcıya bildirilir", () => {
    expect(PAGE).toContain("askMailFallback(invite, home,");
    expect(PAGE).toContain("e-posta otomatik gönderilemedi");
  });
});
