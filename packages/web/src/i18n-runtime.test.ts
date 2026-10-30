import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Runtime test for src/app/i18n.js (the Turkish → English translation layer).
 * No DOM library is a dependency, so this uses a tiny hand-written DOM that implements
 * only the node API i18n.js touches. It is not a mock of the translator: the real script
 * runs unmodified against it.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/i18n.js"), "utf8");

class FText {
  nodeType = 3;
  nodeName = "#text";
  parentNode: FEl | null = null;
  constructor(public nodeValue: string) {}
  get nextSibling(): FText | FEl | null {
    const sibs = this.parentNode?.childNodes;
    return sibs ? (sibs[sibs.indexOf(this) + 1] ?? null) : null;
  }
  get textContent() {
    return this.nodeValue;
  }
}

class FEl {
  nodeType = 1;
  parentNode: FEl | null = null;
  nodeName: string;
  tagName: string;
  childNodes: (FText | FEl)[] = [];
  attrs = new Map<string, string>();
  value = "";
  type = "";
  [k: string]: unknown;
  constructor(tag: string) {
    this.nodeName = this.tagName = tag.toUpperCase();
  }
  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  get nextSibling(): FText | FEl | null {
    const sibs = this.parentNode?.childNodes;
    return sibs ? (sibs[sibs.indexOf(this) + 1] ?? null) : null;
  }
  appendChild<T extends FText | FEl>(c: T): T {
    c.parentNode = this;
    this.childNodes.push(c);
    return c;
  }
  removeChild<T extends FText | FEl>(c: T): T {
    this.childNodes.splice(this.childNodes.indexOf(c), 1);
    c.parentNode = null;
    return c;
  }
  hasAttribute(n: string) {
    return this.attrs.has(n);
  }
  getAttribute(n: string) {
    return this.attrs.get(n) ?? null;
  }
  setAttribute(n: string, v: string) {
    this.attrs.set(n, v);
  }
  // Only the selector i18n.js uses: "[data-no-i18n],[translate=no]"
  closest(_sel: string): FEl | null {
    for (let e: FEl | null = this; e; e = e.parentNode) {
      if (e.attrs.has("data-no-i18n") || e.attrs.get("translate") === "no") return e;
    }
    return null;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  get textContent(): string {
    return this.childNodes.map((c) => c.textContent).join("");
  }
  get innerHTML(): string {
    return this.childNodes
      .map((c) => {
        if (c instanceof FText) return c.nodeValue;
        const a = [...c.attrs].map(([k, v]) => ` ${k}="${v}"`).join("");
        return `<${c.tagName.toLowerCase()}${a}>${c.innerHTML}</${c.tagName.toLowerCase()}>`;
      })
      .join("");
  }
}

const text = (s: string) => new FText(s);
function el(tag: string, children: (string | FEl)[] = [], attrs: Record<string, string> = {}) {
  const e = new FEl(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) e.appendChild(typeof c === "string" ? text(c) : c);
  return e;
}

type Dict = {
  text?: Record<string, string>;
  html?: Record<string, string>;
  slots?: Record<string, string>;
  patterns?: [string, string][];
};

const DICT: Dict = {
  text: {
    Kaydet: "Save",
    "Cihaz ekle": "Add device",
    "{0} cihaz": "{0} devices",
    "Önce bir cihaz ekleyin": "Add a device first",
    "Ara...": "Search...",
    Salon: "Living room",
  },
  patterns: [["^Sil: (.+)$", "Delete: {t:1}"]],
  slots: { "Toplam {0} cihaz": "{0} devices in total" },
};

function boot(dict: Dict | null = DICT, build?: (root: FEl, body: FEl) => void) {
  const root = el("html");
  const head = root.appendChild(el("head"));
  const body = root.appendChild(el("body"));
  const titleEl = head.appendChild(el("title", ["Ev Kontrol"]));
  build?.(root, body);
  let observerCb: ((r: unknown[]) => void) | null = null;
  let observed: { target: unknown; opts: Record<string, unknown> } | null = null;
  const dialogs: Record<string, unknown[]> = { alert: [], confirm: [], prompt: [] };
  const win: Record<string, unknown> = { NEXUS_EN: dict };
  for (const n of Object.keys(dialogs)) win[n] = (...a: unknown[]) => dialogs[n].push(a);
  const documentFake = {
    documentElement: root,
    querySelector: (s: string) => (s === "title" ? titleEl : null),
    createTextNode: (s: string) => text(s),
    createElement: (t: string) => el(t),
  };
  class MO {
    constructor(cb: (r: unknown[]) => void) {
      observerCb = cb;
    }
    observe(target: unknown, opts: Record<string, unknown>) {
      observed = { target, opts };
    }
  }
  new Function("window", "document", "MutationObserver", SOURCE)(win, documentFake, MO);
  const w = win as {
    nexusTr: (s: string) => string;
    nexusSrcText: (e: unknown) => string;
    __i18nFlush: () => void;
    __i18nMissing: Record<string, number>;
    __i18nMissingHtml: Record<string, number>;
    __nexusI18n: boolean;
  };
  return {
    root,
    body,
    titleEl,
    win: w,
    dialogs,
    mutate: (records: unknown[]) => {
      observerCb!(records);
      // queue() defers flush to a microtask; run the same flush synchronously
      w.__i18nFlush();
    },
    observed: () => observed,
    rawWin: win,
  };
}

describe("i18n runtime: dictionary lookup (nexusTr)", () => {
  const { win } = boot();

  it("translates an exact entry", () => {
    expect(win.nexusTr("Kaydet")).toBe("Save");
  });

  it("matches on whitespace-normalised text", () => {
    expect(win.nexusTr("  Cihaz \n  ekle ")).toBe("Add device");
  });

  it("returns unknown text unchanged instead of inventing a translation", () => {
    expect(win.nexusTr("Bu metin sözlükte yok")).toBe("Bu metin sözlükte yok");
  });

  it("leaves strings without letters (numbers, symbols) alone", () => {
    expect(win.nexusTr("42 %")).toBe("42 %");
    expect(win.nexusTr("")).toBe("");
  });

  it("fills numbered templates and uses the singular for 1", () => {
    expect(win.nexusTr("3 cihaz")).toBe("3 devices");
    expect(win.nexusTr("1 cihaz")).toBe("1 device");
    expect(win.nexusTr("12,5 cihaz")).toBe("12,5 devices");
  });

  it("applies regex patterns and translates the {t:1} group", () => {
    expect(win.nexusTr("Sil: Kaydet")).toBe("Delete: Save");
    // untranslatable group is kept as-is
    expect(win.nexusTr("Sil: Bilinmeyen")).toBe("Delete: Bilinmeyen");
  });

  it("translates separator-joined parts when every Turkish part is known", () => {
    expect(win.nexusTr("Salon · Kaydet")).toBe("Living room · Save");
    expect(win.nexusTr("Salon: Kaydet, Cihaz ekle")).toBe("Living room: Save, Add device");
  });

  it("does not half-translate when a part with Turkish letters is unknown", () => {
    expect(win.nexusTr("Işık · Kaydet")).toBe("Işık · Kaydet");
  });

  it("keeps untranslated ASCII parts (device names) while translating the rest", () => {
    expect(win.nexusTr("Hue Lamp · Kaydet")).toBe("Hue Lamp · Save");
  });
});

describe("i18n runtime: missing keys", () => {
  it("records each untranslated string once in __i18nMissing", () => {
    const { win } = boot();
    win.nexusTr("Eksik metin");
    win.nexusTr("Eksik metin");
    expect(win.__i18nMissing["Eksik metin"]).toBe(1);
    expect(win.__i18nMissing["Kaydet"]).toBeUndefined();
  });

  it("does not record pure numbers", () => {
    const { win } = boot();
    win.nexusTr("123");
    expect(win.__i18nMissing["123"]).toBeUndefined();
  });

  it("works without any dictionary (everything passes through)", () => {
    const { win } = boot(null);
    expect(win.nexusTr("Kaydet")).toBe("Kaydet");
    expect(win.__i18nMissing["Kaydet"]).toBe(1);
  });

  it("does not reinitialise when loaded twice", () => {
    const b = boot();
    const first = b.win.nexusTr;
    new Function("window", "document", "MutationObserver", SOURCE)(b.rawWin, {}, class {});
    expect(b.win.nexusTr).toBe(first);
  });
});

describe("i18n runtime: DOM translation", () => {
  it("translates text nodes and keeps surrounding whitespace", () => {
    const btn = el("button", ["  Kaydet \n"]);
    boot(DICT, (_r, body) => body.appendChild(btn));
    expect(btn.childNodes[0].nodeValue).toBe("  Save \n");
  });

  it("leaves unknown text nodes untouched", () => {
    const p = el("p", ["Tanımsız cümle"]);
    boot(DICT, (_r, body) => body.appendChild(p));
    expect(p.textContent).toBe("Tanımsız cümle");
  });

  it("translates placeholder, title, aria-label and alt attributes", () => {
    const input = el("input", [], {
      placeholder: "Ara...",
      title: "Kaydet",
      "aria-label": "Cihaz ekle",
      alt: "Salon",
    });
    boot(DICT, (_r, body) => body.appendChild(input));
    expect(input.getAttribute("placeholder")).toBe("Search...");
    expect(input.getAttribute("title")).toBe("Save");
    expect(input.getAttribute("aria-label")).toBe("Add device");
    expect(input.getAttribute("alt")).toBe("Living room");
  });

  it("translates the value of button-type inputs but not text inputs", () => {
    const submit = el("input");
    submit.type = "submit";
    submit.value = "Kaydet";
    const field = el("input");
    field.type = "text";
    field.value = "Kaydet";
    boot(DICT, (_r, body) => {
      body.appendChild(submit);
      body.appendChild(field);
    });
    expect(submit.value).toBe("Save");
    expect(field.value).toBe("Kaydet");
  });

  it("never rewrites textarea content (user text) but translates its placeholder", () => {
    const ta = el("textarea", ["Kaydet"], { placeholder: "Ara..." });
    boot(DICT, (_r, body) => body.appendChild(ta));
    expect(ta.textContent).toBe("Kaydet");
    expect(ta.getAttribute("placeholder")).toBe("Search...");
  });

  it("skips script/style/code/pre content", () => {
    const nodes = ["script", "style", "code", "pre"].map((t) => el(t, ["Kaydet"]));
    boot(DICT, (_r, body) => nodes.forEach((n) => body.appendChild(n)));
    for (const n of nodes) expect(n.textContent).toBe("Kaydet");
  });

  it("skips data-no-i18n and translate=no subtrees, including attributes", () => {
    const a = el("div", [el("span", ["Kaydet"], { title: "Kaydet" })], { "data-no-i18n": "" });
    const b = el("div", [el("span", ["Kaydet"])], { translate: "no" });
    boot(DICT, (_r, body) => {
      body.appendChild(a);
      body.appendChild(b);
    });
    expect(a.textContent).toBe("Kaydet");
    expect((a.childNodes[0] as FEl).getAttribute("title")).toBe("Kaydet");
    expect(b.textContent).toBe("Kaydet");
  });

  it("translates document.title", () => {
    const { titleEl } = boot(null);
    expect(titleEl.textContent).toBe("Ev Kontrol");
    const t = boot({ text: { "Ev Kontrol": "Home Control" } }).titleEl;
    expect(t.textContent).toBe("Home Control");
  });

  it("rebuilds mixed inline content from a slot template, keeping the inner element", () => {
    const strong = el("b", ["5"]);
    const p = el("p", ["Toplam ", strong, " cihaz"]);
    boot(DICT, (_r, body) => body.appendChild(p));
    expect(p.textContent).toBe("5 devices in total");
    expect(p.childNodes.includes(strong)).toBe(true); // same node: listeners survive
  });

  it("reports mixed Turkish content that has no template in __i18nMissingHtml", () => {
    const p = el("p", ["Şu kadar ", el("b", ["çok"]), " var"]);
    const { win } = boot(DICT, (_r, body) => body.appendChild(p));
    expect(p.textContent).toBe("Şu kadar çok var");
    expect(Object.keys(win.__i18nMissingHtml)).toEqual(["Şu kadar {0} var"]);
  });
});

describe("i18n runtime: dynamic updates", () => {
  it("observes the whole document for added nodes, text and translatable attributes", () => {
    const { observed, root } = boot();
    const o = observed()!;
    expect(o.target).toBe(root);
    expect(o.opts).toMatchObject({
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    expect(o.opts.attributeFilter).toEqual([
      "placeholder",
      "title",
      "aria-label",
      "alt",
      "data-tooltip",
      "label",
    ]);
  });

  it("translates nodes added later by JavaScript", () => {
    const b = boot();
    const added = el("div", [el("span", ["Kaydet"])]);
    b.body.appendChild(added);
    b.mutate([{ type: "childList", addedNodes: [added], target: b.body }]);
    expect(added.textContent).toBe("Save");
  });

  it("re-translates text changed by the page (characterData)", () => {
    const span = el("span", ["Salon"]);
    const b = boot(DICT, (_r, body) => body.appendChild(span));
    expect(span.textContent).toBe("Living room");
    span.childNodes[0].nodeValue = "Kaydet";
    b.mutate([{ type: "characterData", target: span.childNodes[0] }]);
    expect(span.textContent).toBe("Save");
  });

  it("translates an attribute set after load", () => {
    const btn = el("button", [], { title: "Salon" });
    const b = boot(DICT, (_r, body) => body.appendChild(btn));
    btn.setAttribute("title", "Kaydet");
    b.mutate([{ type: "attributes", target: btn }]);
    expect(btn.getAttribute("title")).toBe("Save");
  });

  it("does not translate its own output a second time", () => {
    const span = el("span", ["Kaydet"]);
    const b = boot({ text: { Kaydet: "Cihaz ekle", "Cihaz ekle": "WRONG" } }, (_r, body) =>
      body.appendChild(span),
    );
    b.mutate([{ type: "characterData", target: span.childNodes[0] }]);
    expect(span.textContent).toBe("Cihaz ekle");
  });
});

describe("i18n runtime: dialogs and source text", () => {
  it("translates alert/confirm/prompt messages line by line", () => {
    const { rawWin, dialogs } = boot();
    (rawWin.alert as (m: string) => void)("Kaydet\nBilinmeyen satır\nSalon");
    (rawWin.confirm as (m: string) => void)("Cihaz ekle");
    (rawWin.prompt as (m: string, d: string) => void)("Salon", "default");
    expect(dialogs.alert[0]).toEqual(["Save\nBilinmeyen satır\nLiving room"]);
    expect(dialogs.confirm[0]).toEqual(["Add device"]);
    expect(dialogs.prompt[0]).toEqual(["Living room", "default"]);
  });

  it("passes non-string dialog arguments through", () => {
    const { rawWin, dialogs } = boot();
    (rawWin.alert as (m: unknown) => void)(42);
    expect(dialogs.alert[0]).toEqual([42]);
  });

  it("nexusSrcText returns the original Turkish text of a translated element", () => {
    const h = el("h1", ["Kaydet"]);
    const { win } = boot(DICT, (_r, body) => body.appendChild(h));
    expect(h.textContent).toBe("Save");
    expect(win.nexusSrcText(h)).toBe("Kaydet");
    expect(win.nexusSrcText(null)).toBe("");
  });

  it("nexusSrcText returns the current value once the user edited the text", () => {
    const h = el("h1", ["Salon"]);
    const { win } = boot(DICT, (_r, body) => body.appendChild(h));
    h.childNodes[0].nodeValue = "Yatak odası";
    expect(win.nexusSrcText(h)).toBe("Yatak odası");
  });
});
