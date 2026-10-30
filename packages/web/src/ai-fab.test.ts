import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/ai-fab.js"), "utf8");

type Listener = (event: unknown) => void;

class FakeElement {
  tag: string;
  className = "";
  innerHTML = "";
  textContent = "";
  style: Record<string, string> = {};
  attrs: Record<string, string> = {};
  listeners: Record<string, Listener[]> = {};
  children: FakeElement[] = [];
  private classes = new Set<string>();
  classList = {
    add: (c: string) => void this.classes.add(c),
    remove: (c: string) => void this.classes.delete(c),
    contains: (c: string) => this.classes.has(c) || this.className.split(/\s+/).includes(c),
  };
  constructor(tag: string) {
    this.tag = tag;
  }
  setAttribute(k: string, v: string) {
    this.attrs[k] = v;
  }
  addEventListener(type: string, fn: Listener) {
    (this.listeners[type] ??= []).push(fn);
  }
  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }
  contains(other: unknown) {
    return other === this;
  }
  fire(type: string, event: unknown = {}) {
    (this.listeners[type] ?? []).forEach((fn) => fn(event));
  }
}

interface Env {
  body: FakeElement;
  head: FakeElement;
  win: FakeElement & { location: { href: string; pathname: string } };
  doc: FakeElement & { readyState: string };
  fab: () => FakeElement | undefined;
}

function load(opts: {
  href: string;
  pathname?: string;
  nexusGetItem?: (k: string) => string | null;
  localStorageValue?: string | null;
  readyState?: string;
  sessionPulsed?: boolean;
}): Env {
  const body = new FakeElement("body");
  const head = new FakeElement("head");
  const doc = Object.assign(new FakeElement("document"), {
    readyState: opts.readyState ?? "complete",
    head,
    body: Object.assign(body, {
      querySelectorAll: () => [] as FakeElement[],
    }),
    createElement: (tag: string) => new FakeElement(tag),
    querySelector: () => null,
  });
  const win = Object.assign(new FakeElement("window"), {
    location: { href: opts.href, pathname: opts.pathname ?? "/nexus-settings.html" },
    innerHeight: 800,
    innerWidth: 400,
    getComputedStyle: () => ({}),
  });
  const store: Record<string, string> = opts.sessionPulsed ? { nexusFabPulsed: "1" } : {};
  const sessionStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => void (store[k] = v),
  };
  const localStorage = { getItem: () => opts.localStorageValue ?? null };
  new Function(
    "window",
    "document",
    "location",
    "nexusGetItem",
    "localStorage",
    "sessionStorage",
    SOURCE,
  )(win, doc, win.location, opts.nexusGetItem, localStorage, sessionStorage);
  const fab = () => body.children.find((c) => c.tag === "button");
  return { body, head, win, doc, fab };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("ai-fab injection", () => {
  const excluded = [
    "nexus-chat.html",
    "nexus-login.html",
    "nexus-onboarding.html",
    "nexus-scan.html",
    "nexus-map.html",
    "nexus-home.html",
    "nexus-smart.html",
    "nexus-register.html",
    "nexus-forgot-password.html",
    "nexus-device.html",
  ];

  it.each(excluded)("is not injected on %s", (page) => {
    const env = load({ href: `https://app.example/${page}?x=1` });
    expect(env.fab()).toBeUndefined();
    expect(env.head.children).toHaveLength(0);
  });

  it("adds exactly one labelled button on a normal page", () => {
    const env = load({ href: "https://app.example/nexus-settings.html" });
    const buttons = env.body.children.filter((c) => c.tag === "button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].className).toBe("nexus-ai-fab");
    expect(buttons[0].attrs["aria-label"]).toBeTruthy();
    expect(env.head.children.filter((c) => c.tag === "style")).toHaveLength(1);
  });

  it("waits for DOMContentLoaded while the document is loading", () => {
    const env = load({ href: "https://app.example/nexus-settings.html", readyState: "loading" });
    expect(env.fab()).toBeUndefined();
    env.doc.fire("DOMContentLoaded");
    expect(env.fab()).toBeDefined();
  });

  it("honors nexusFabAi=false through nexusGetItem", () => {
    const get = vi.fn((k: string) => (k === "nexusFabAi" ? "false" : null));
    const env = load({ href: "https://app.example/nexus-settings.html", nexusGetItem: get });
    expect(get).toHaveBeenCalledWith("nexusFabAi");
    expect(env.fab()).toBeUndefined();
  });

  it("honors nexusFabAi=false through localStorage when nexusGetItem is absent", () => {
    const env = load({
      href: "https://app.example/nexus-settings.html",
      localStorageValue: "false",
    });
    expect(env.fab()).toBeUndefined();
  });

  it("still shows the button for any other preference value", () => {
    const env = load({
      href: "https://app.example/nexus-settings.html",
      nexusGetItem: () => "true",
    });
    expect(env.fab()).toBeDefined();
  });
});

describe("ai-fab behavior", () => {
  const url = "https://app.example/nexus-settings.html";

  it("docks after the idle delay and undocks on scroll, then re-docks", () => {
    const env = load({ href: url, sessionPulsed: true });
    const fab = env.fab()!;
    expect(fab.classList.contains("docked")).toBe(false);
    vi.advanceTimersByTime(2600);
    expect(fab.classList.contains("docked")).toBe(true);
    env.win.fire("scroll");
    expect(fab.classList.contains("docked")).toBe(false);
    vi.advanceTimersByTime(2600);
    expect(fab.classList.contains("docked")).toBe(true);
  });

  it("undocks on a touch outside the button but not on the button itself", () => {
    const env = load({ href: url, sessionPulsed: true });
    const fab = env.fab()!;
    vi.advanceTimersByTime(2600);
    env.doc.fire("touchstart", { target: fab });
    expect(fab.classList.contains("docked")).toBe(true);
    env.doc.fire("touchstart", { target: new FakeElement("div") });
    expect(fab.classList.contains("docked")).toBe(false);
  });

  it("first activation while docked only undocks and does not navigate", () => {
    const env = load({ href: url, sessionPulsed: true });
    const fab = env.fab()!;
    vi.advanceTimersByTime(2600);
    fab.fire("click");
    expect(fab.classList.contains("docked")).toBe(false);
    expect(env.win.location.href).toBe(url);
  });

  it("navigates to the chat page, remembering the origin page", () => {
    const env = load({ href: url, pathname: "/app/nexus-settings.html", sessionPulsed: true });
    env.fab()!.fire("click");
    expect(env.win.location.href).toBe("nexus-chat.html?from=nexus-settings.html");
  });

  it("falls back to the home page name when the path has no file", () => {
    const env = load({ href: url, pathname: "/", sessionPulsed: true });
    env.fab()!.fire("click");
    expect(env.win.location.href).toBe("nexus-chat.html?from=nexus-home.html");
  });

  it("pulses once per session only", () => {
    const first = load({ href: url });
    vi.advanceTimersByTime(1500);
    expect(first.fab()!.classList.contains("pulse")).toBe(true);
    vi.advanceTimersByTime(2500);
    expect(first.fab()!.classList.contains("pulse")).toBe(false);

    const again = load({ href: url, sessionPulsed: true });
    vi.advanceTimersByTime(1500);
    expect(again.fab()!.classList.contains("pulse")).toBe(false);
  });

  it("moves down (no-nav) when the page has no bottom navigation", () => {
    const env = load({ href: url, sessionPulsed: true });
    expect(env.fab()!.classList.contains("no-nav")).toBe(true);
  });
});
