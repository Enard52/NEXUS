import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const HTML = readFileSync(resolve(REPO_ROOT, "src/app/nexus-energy.html"), "utf8");
const block = HTML.split("// >>> energy-history")[1]?.split("// <<< energy-history")[0] ?? "";

type S = { t: number; w: number; d: [string, number][] };
const eh = new Function(
  `${block}; return { ehTrim, ehAppend, ehIntegrate, ehDaily, ehPrice, ehCost, ehChartSvg };`,
)() as {
  ehTrim: (s: S[], now: number) => S[];
  ehAppend: (s: S[], t: number, d: { name: string; w: number }[]) => S[];
  ehIntegrate: (
    s: { t: number; w: number }[],
    a: number,
    b: number,
  ) => { kwh: number; coveredMs: number };
  ehDaily: (
    s: { t: number; w: number }[],
    now: number,
    n: number,
  ) => { start: number; kwh: number | null }[];
  ehPrice: (t: string) => number | null;
  ehCost: (k: number | null, p: number | null) => number | null;
  ehChartSvg: (d: { start: number; kwh: number | null }[], l: string[], a: string) => string;
};

const MIN = 60000;
const H = 3600000;

describe("energy history", () => {
  it("appends a total + per-device sample only from real readings", () => {
    const s = eh.ehAppend([], 1_000_000, [
      { name: "A", w: 10 },
      { name: "B", w: 5.5 },
      { name: "bad", w: NaN },
    ]);
    expect(s).toHaveLength(1);
    expect(s[0].w).toBe(15.5);
    expect(s[0].d).toEqual([
      ["A", 10],
      ["B", 5.5],
    ]);
  });

  it("never records a sample when there is no real reading", () => {
    expect(eh.ehAppend([], 1, [])).toEqual([]);
    expect(eh.ehAppend([], 1, [{ name: "x", w: Infinity }])).toEqual([]);
  });

  it("keeps resolution coarse: skips samples closer than 5 minutes", () => {
    let s = eh.ehAppend([], 10 * H, [{ name: "A", w: 1 }]);
    s = eh.ehAppend(s, 10 * H + 2 * MIN, [{ name: "A", w: 99 }]);
    expect(s).toHaveLength(1);
    s = eh.ehAppend(s, 10 * H + 6 * MIN, [{ name: "A", w: 2 }]);
    expect(s).toHaveLength(2);
  });

  it("drops samples older than 7 days and caps the ring buffer", () => {
    const now = 100 * 86400000;
    const old = { t: now - 8 * 86400000, w: 1, d: [] };
    const fresh = { t: now - 1000, w: 2, d: [] };
    expect(eh.ehTrim([old, fresh], now)).toEqual([fresh]);
    const many = Array.from({ length: 3000 }, (_, i) => ({
      t: now - 6 * 86400000 + i * MIN,
      w: 1,
      d: [],
    }));
    expect(eh.ehTrim(many, now)).toHaveLength(2016);
  });

  it("integrates watts to kWh with the trapezoid rule", () => {
    // 1000 W constant for 1 h = 1 kWh (samples every 15 min)
    const s = [0, 15, 30, 45, 60].map((m) => ({ t: m * MIN, w: 1000 }));
    const r = eh.ehIntegrate(s, 0, H);
    expect(r.kwh).toBeCloseTo(1, 10);
    expect(r.coveredMs).toBe(H);
    // ramp 0 -> 2000 W over 30 min = 0.5 kWh
    expect(
      eh.ehIntegrate(
        [
          { t: 0, w: 0 },
          { t: 30 * MIN, w: 2000 },
        ],
        0,
        H,
      ).kwh,
    ).toBeCloseTo(0.5, 10);
  });

  it("does not invent energy across gaps longer than 30 minutes", () => {
    const s = [
      { t: 0, w: 1000 },
      { t: 3 * H, w: 1000 },
    ];
    const r = eh.ehIntegrate(s, 0, 3 * H);
    expect(r.kwh).toBe(0);
    expect(r.coveredMs).toBe(0);
  });

  it("clips to the window with interpolation", () => {
    const s = [
      { t: 0, w: 1000 },
      { t: 30 * MIN, w: 1000 },
    ];
    expect(eh.ehIntegrate(s, 15 * MIN, H).kwh).toBeCloseTo(0.25, 10);
  });

  it("reports unmeasured days as null, not zero", () => {
    const now = new Date(2026, 5, 10, 12, 0, 0).getTime();
    const s = [
      { t: now - 40 * MIN, w: 600 },
      { t: now - 20 * MIN, w: 600 },
    ];
    const d = eh.ehDaily(s, now, 7);
    expect(d).toHaveLength(7);
    expect(d.slice(0, 6).every((x) => x.kwh === null)).toBe(true);
    expect(d[6].kwh).toBeCloseTo(0.2, 6);
  });

  it("parses tariff input strictly and computes cost only from real kWh", () => {
    expect(eh.ehPrice("2,50")).toBe(2.5);
    expect(eh.ehPrice(" 3.1 ")).toBe(3.1);
    expect(eh.ehPrice("abc")).toBeNull();
    expect(eh.ehPrice("-1")).toBeNull();
    expect(eh.ehPrice("")).toBeNull();
    expect(eh.ehCost(2, 3)).toBe(6);
    expect(eh.ehCost(null, 3)).toBeNull();
    expect(eh.ehCost(2, null)).toBeNull();
  });

  it("draws an accessible SVG chart; empty days get a dash, not a bar", () => {
    const svg = eh.ehChartSvg(
      [
        { start: 0, kwh: null },
        { start: 1, kwh: 2 },
      ],
      ["A", "B"],
      'Daily "x"',
    );
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Daily &quot;x&quot;"');
    expect(svg.match(/<rect/g)).toHaveLength(2);
    expect(svg).toContain('height="1.5"');
  });
});
