import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Issue #1 kabuk standardı: tüm nexus ekranları tek başlık ritmi (pt/pb
// 48/16) ve tek sütun ailesinde olmalı. scripts/measure-layout.mjs --check
// ihlalde 1 döner; burada sürece bağlanır (CI'sız da koruma sağlar).
// vitest kök dizinden çalışır; betik oraya göre çözülür.
describe("ekran kabuğu tutarlılığı (issue #1)", () => {
  it("measure-layout --check ihlalsiz geçer", () => {
    const script = join(process.cwd(), "scripts", "measure-layout.mjs");
    if (!existsSync(script))
      throw new Error(`betik bulunamadı: ${script} (vitest depo kökünden çalışmalı)`);
    expect(() =>
      execFileSync(process.execPath, [script, "--check"], {
        stdio: "pipe",
        timeout: 30_000,
      }),
    ).not.toThrow();
  });
});
