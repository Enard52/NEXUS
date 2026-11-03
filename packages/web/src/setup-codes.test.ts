import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/setup-codes.js"), "utf8");

type Parsed = { type: string; host?: string };
type Message = { title: string; text: string };

function load() {
  const win: Record<string, unknown> = {};
  const loc = { href: "" };
  new Function("window", "location", SOURCE)(win, loc);
  return {
    parse: win.nexusParseSetupCode as (raw: unknown) => Parsed,
    message: win.nexusSetupCodeMessage as (type: string) => Message,
    open: win.nexusOpenLanPairing as (host?: string) => void,
    loc,
  };
}

const { parse, message, open, loc } = load();

describe("nexusParseSetupCode", () => {
  it("treats empty / non-string input as unknown", () => {
    for (const v of ["", "   ", null, undefined]) expect(parse(v)).toEqual({ type: "unknown" });
  });

  it("recognises Matter, HomeKit and Wi-Fi QR prefixes case-insensitively", () => {
    expect(parse("MT:Y.K9042C00KA0648G00").type).toBe("matter");
    expect(parse("mt:abc").type).toBe("matter");
    expect(parse("X-HM://0023ISXYZ1234").type).toBe("homekit");
    expect(parse("WIFI:S:home;T:WPA;P:secret;;").type).toBe("wifi");
    expect(parse("wifi:S:x;;").type).toBe("wifi");
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parse("  192.168.1.20 \n")).toEqual({ type: "lan", host: "192.168.1.20" });
  });

  it("accepts private-network URLs and keeps the port", () => {
    expect(parse("http://192.168.1.50/")).toEqual({ type: "lan", host: "192.168.1.50" });
    expect(parse("https://10.0.0.7:8443/path?x=1")).toEqual({ type: "lan", host: "10.0.0.7:8443" });
    expect(parse("http://172.16.0.1")).toEqual({ type: "lan", host: "172.16.0.1" });
    expect(parse("http://172.31.255.254")).toEqual({ type: "lan", host: "172.31.255.254" });
    expect(parse("http://127.0.0.1:3000")).toEqual({ type: "lan", host: "127.0.0.1:3000" });
  });

  it("accepts .local hostnames in URLs", () => {
    expect(parse("http://shelly-plug.local/")).toEqual({ type: "lan", host: "shelly-plug.local" });
    expect(parse("HTTP://WLED.LOCAL:80")).toEqual({ type: "lan", host: "WLED.LOCAL:80" });
  });

  it("accepts bare private IPs with or without a port", () => {
    expect(parse("192.168.0.10")).toEqual({ type: "lan", host: "192.168.0.10" });
    expect(parse("10.1.2.3:80")).toEqual({ type: "lan", host: "10.1.2.3:80" });
  });

  it("rejects public and non-private addresses (only LAN-verifiable hosts are forwarded)", () => {
    expect(parse("http://8.8.8.8/").type).toBe("unknown");
    expect(parse("https://example.com/setup").type).toBe("unknown");
    expect(parse("8.8.8.8").type).toBe("unknown");
    expect(parse("172.15.0.1").type).toBe("unknown");
    expect(parse("172.32.0.1").type).toBe("unknown");
    expect(parse("169.254.1.1").type).toBe("unknown");
    expect(parse("192.169.1.1").type).toBe("unknown");
  });

  it("rejects out-of-range octets that are not valid IPv4 addresses", () => {
    expect(parse("10.999.1.1").type).toBe("unknown");
    expect(parse("192.168.1.256").type).toBe("unknown");
    expect(parse("http://192.168.300.1/").type).toBe("unknown");
  });

  it("does not take credentials-prefixed or malformed hosts as LAN targets", () => {
    expect(parse("http://user@192.168.1.5/").type).toBe("unknown");
    expect(parse("ftp://192.168.1.5").type).toBe("unknown");
  });

  it("recognises 8-digit HomeKit and 11/21-digit Matter manual codes, ignoring spaces and dashes", () => {
    expect(parse("1234 5678")).toEqual({ type: "homekit" });
    expect(parse("123-45-678")).toEqual({ type: "homekit" });
    expect(parse("34970112332")).toEqual({ type: "matter" });
    expect(parse("3497-0112-332")).toEqual({ type: "matter" });
    expect(parse("749701123643095751712")).toEqual({ type: "matter" });
  });

  it("rejects digit strings of other lengths and non-code text", () => {
    for (const v of ["1234567", "123456789", "1234567890", "123456789012", "hello", "abcd1234"]) {
      expect(parse(v)).toEqual({ type: "unknown" });
    }
  });
});

describe("nexusSetupCodeMessage", () => {
  it("gives a distinct honest message for each known type", () => {
    const titles = new Set(["matter", "homekit", "wifi", "unknown"].map((t) => message(t).title));
    expect(titles.size).toBe(4);
    for (const t of ["matter", "homekit", "wifi", "unknown"]) {
      expect(message(t).title.length).toBeGreaterThan(0);
      expect(message(t).text.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the unknown-code message for unrecognised types (including lan)", () => {
    expect(message("lan")).toEqual(message("unknown"));
    expect(message("whatever")).toEqual(message("unknown"));
  });
});

describe("nexusOpenLanPairing", () => {
  it("navigates to the pairing page with the host URL-encoded", () => {
    open("192.168.1.5:8080");
    expect(loc.href).toBe("nexus-pair.html?host=192.168.1.5%3A8080#lan-scan-section");
  });

  it("omits the host parameter when none is given", () => {
    open();
    expect(loc.href).toBe("nexus-pair.html#lan-scan-section");
  });
});
