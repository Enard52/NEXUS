import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PAGE = readFileSync(resolve(ROOT, "src/app/nexus-household.html"), "utf8");

describe("aile daveti: e-posta uygulaması kendiliğinden açılmaz", () => {
  it("mailto yalnızca bir kez, onay penceresinin düğmesinde kurulur", () => {
    expect(PAGE.match(/["']mailto:/g) || []).toHaveLength(1);
    expect(PAGE).toMatch(
      /primary: \{ label: "Posta Uygulamasını Aç", onClick: function \(\) \{[\s\S]*?window\.location\.href = "mailto:"/,
    );
  });

  it("mailFallback yalnızca sunucu gönderimi başarısız olunca ve kullanıcıya sorularak çağrılır", () => {
    const calls = PAGE.match(/mailFallback\(/g) || [];
    // 1 tanım + 1 başarısızlık dalı
    expect(calls).toHaveLength(2);
    expect(PAGE).toMatch(/else mailFallback\(home, name, email, res\.code\)/);
    expect(PAGE).toContain("E-posta sunucudan gönderilemedi");
    expect(PAGE).toContain('secondary: { label: "Vazgeç" }');
  });
});
