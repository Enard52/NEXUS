import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const HTML = readFileSync(resolve(REPO_ROOT, "src/app/nexus-energy.html"), "utf8");
const block = HTML.split("// >>> energy-export")[1]?.split("// <<< energy-export")[0] ?? "";
const { energyRows, energyCsv, energyHistory, energyExportCsv, energyExportJson } = new Function(
  `${block}; return { energyRows, energyCsv, energyHistory, energyExportCsv, energyExportJson };`,
)() as {
  energyRows: (d: unknown[]) => { device: string; power_w: number; read_at: string }[];
  energyCsv: (r: unknown[]) => string;
  energyHistory: (
    s: unknown[],
  ) => { at: string; total_w: number; devices: { device: string; power_w: number }[] }[];
  energyExportCsv: (l: unknown[], h: unknown[]) => string;
  energyExportJson: (l: unknown[], h: unknown[]) => string;
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

describe("energy history export", () => {
  const samples = [
    {
      t: 1700000000000,
      w: 15,
      d: [
        ["Plug", 10],
        ['Lamp, "x"', 5],
      ],
    },
    { t: "bad", w: 1, d: [] },
    { t: 1700000300000, w: NaN, d: [] },
    { t: 1700000600000, w: 7, d: [["Plug", 7], ["Junk", "n/a"], "oops"] },
  ];

  it("keeps only valid stored samples and valid per-device entries", () => {
    const h = energyHistory(samples);
    expect(h.map((x) => x.total_w)).toEqual([15, 7]);
    expect(h[0].at).toBe(new Date(1700000000000).toISOString());
    expect(h[1].devices).toEqual([{ device: "Plug", power_w: 7 }]);
  });

  it("is empty for no/garbage history", () => {
    expect(energyHistory([])).toEqual([]);
    expect(energyHistory([null, 3, {}])).toEqual([]);
  });

  it("CSV has latest, history and total rows with escaping", () => {
    const at = new Date(1700000000000).toISOString();
    const csv = energyExportCsv(
      [{ device: "P", power_w: 2, read_at: "r" }],
      energyHistory(samples.slice(0, 1)),
    );
    expect(csv).toBe(
      `kind,device,power_w,at\r\nlatest,P,2,r\r\nhistory,Plug,10,${at}\r\nhistory,"Lamp, ""x""",5,${at}\r\ntotal,,15,${at}\r\n`,
    );
  });

  it("empty history gives latest-only CSV and honest JSON flag", () => {
    const l = [{ device: "P", power_w: 2, read_at: "r" }];
    expect(energyExportCsv(l, [])).toBe("kind,device,power_w,at\r\nlatest,P,2,r\r\n");
    const j = JSON.parse(energyExportJson(l, []));
    expect(j.history).toEqual([]);
    expect(j.history_available).toBe(false);
    expect(j.latest).toEqual(l);
  });

  it("JSON includes history and total series when present", () => {
    const j = JSON.parse(energyExportJson([], energyHistory(samples)));
    expect(j.history_available).toBe(true);
    expect(j.history).toHaveLength(2);
    expect(j.history[0].total_w).toBe(15);
  });
});
