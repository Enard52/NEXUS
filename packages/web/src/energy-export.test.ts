import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const HTML = readFileSync(resolve(REPO_ROOT, "src/app/nexus-energy.html"), "utf8");
const block = HTML.split("// >>> energy-export")[1]?.split("// <<< energy-export")[0] ?? "";
const { energyRows, energyCsv } = new Function(`${block}; return { energyRows, energyCsv };`)() as {
  energyRows: (d: unknown[]) => { device: string; power_w: number; read_at: string }[];
  energyCsv: (r: unknown[]) => string;
};

describe("energy export", () => {
  it("exports only devices with a real numeric power reading", () => {
    const rows = energyRows([
      { name: "Plug", fields: { power: 12.5 } },
      { name: "Lamp", fields: {} },
      { name: "Broken", fields: { power: "n/a" } },
      { name: "Inf", fields: { power: Infinity } },
    ]);
    expect(rows.map((r) => r.device)).toEqual(["Plug"]);
    expect(rows[0].power_w).toBe(12.5);
  });

  it("returns no rows when nothing is measured (no invented data)", () => {
    expect(energyRows([])).toEqual([]);
    expect(energyRows([{ name: "x" }])).toEqual([]);
  });

  it("builds CSV with a header and escapes quotes, commas and newlines", () => {
    const csv = energyCsv([{ device: 'Kitchen, "main"\nplug', power_w: 3, read_at: "t" }]);
    expect(csv).toBe('device,power_w,read_at\r\n"Kitchen, ""main""\nplug",3,t\r\n');
  });
});
