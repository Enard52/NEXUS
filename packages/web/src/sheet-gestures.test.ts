import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/sheet-gestures.js"), "utf8");

/* eslint-disable @typescript-eslint/no-explicit-any */
type Listener = (e: any) => void;

// Minimal fake DOM: only what sheet-gestures.js touches (listeners, style, closest, contains, rect).
class FakeEl {
  style: Record<string, string> = {};
  listeners: Record<string, Listener[]> = {};
  children: FakeEl[] = [];
  parentElement: FakeEl | null = null;
  clicks = 0;
  constructor(
    public id = "",
    public tag = "div",
    public rect = { top: 100, bottom: 500, width: 300, height: 400 },
  ) {}
  add(child: FakeEl) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  addEventListener(type: string, fn: Listener) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  fire(type: string, ev: Record<string, unknown> = {}) {
    const e = { type, target: this, cancelable: true, defaultPrevented: false, ...ev };
    (e as any).preventDefault = () => ((e as any).defaultPrevented = true);
    for (const fn of this.listeners[type] ?? []) fn(e);
    return e as any;
  }
  contains(t: FakeEl | null): boolean {
    for (let n: FakeEl | null = t; n; n = n.parentElement) if (n === this) return true;
    return false;
  }
  closest(sel: string): FakeEl | null {
    const tags = sel.split(",").map((s) => s.trim());
    for (let n: FakeEl | null = this; n; n = n.parentElement) {
      if (tags.includes(n.tag) || (n as any).noSwipe) return n;
    }
    return null;
  }
  getBoundingClientRect() {
    return this.rect;
  }
  click() {
    this.clicks++;
  }
}

function setup(withPointer = false) {
  const win = new FakeEl("window");
  const doc = new FakeEl("document");
  const body = new FakeEl("body");
  const byId: Record<string, FakeEl> = {};
  let now = 1000;
  const fakeDate = { now: () => now };
  const w: any = win;
  if (withPointer) w.PointerEvent = function () {};
  w.innerHeight = 800;
  const d: any = doc;
  d.body = body;
  d.readyState = "complete";
  d.getElementById = (id: string) => byId[id] ?? null;
  d.querySelectorAll = () => [];
  new Function("window", "document", "Date", "setTimeout", "getComputedStyle", SOURCE)(
    w,
    d,
    fakeDate,
    () => 0,
    () => ({}),
  );
  return {
    win,
    doc,
    body,
    api: w.NexusSheetGestures,
    byId,
    tick: (ms: number) => (now += ms),
    sheet(id = "sheet", handleId?: string, backdropId?: string) {
      const sheet = (byId[id] = new FakeEl(id));
      const handle = handleId ? (byId[handleId] = sheet.add(new FakeEl(handleId))) : undefined;
      const backdrop = backdropId ? (byId[backdropId] = new FakeEl(backdropId)) : undefined;
      return { sheet, handle, backdrop };
    },
  };
}

const touch = (y: number) => ({ touches: [{ clientY: y }], changedTouches: [{ clientY: y }] });
const touchEnd = (y: number) => ({ touches: [], changedTouches: [{ clientY: y }] });

describe("sheet gestures: bottom sheet", () => {
  it("exports the public API", () => {
    const env = setup();
    expect(Object.keys(env.api).sort()).toEqual(["autoBind", "bindBottomSheet", "bindTopSheet"]);
  });

  it("follows the finger downward and only closes past the distance threshold", () => {
    const env = setup();
    const { sheet, backdrop } = env.sheet("s", undefined, "b");
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "s", backdropId: "b", close: () => closed++ });

    sheet.fire("touchstart", touch(150));
    expect(sheet.style.transition).toBe("none");
    env.tick(500);
    const move = env.win.fire("touchmove", touch(200));
    expect(sheet.style.transform).toBe("translateY(50px)");
    expect(move.defaultPrevented).toBe(true); // stops page scroll while dragging
    expect(backdrop!.style.opacity).toBe(String(1 - 50 / 180));

    env.win.fire("touchend", touchEnd(200)); // 50px < 88px, slow
    expect(closed).toBe(0);
    expect(sheet.style.transform).toBe(""); // snapped back
    expect(sheet.style.transition).toBe("");
    expect(backdrop!.style.opacity).toBe("");
  });

  it("closes after a slow drag beyond the 88px default threshold", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(120));
    env.tick(1000);
    env.win.fire("touchmove", touch(120 + 89));
    env.win.fire("touchend", touchEnd(209));
    expect(closed).toBe(1);
    expect(sheet.style.transform).toBe("");
  });

  it("does not close at exactly the threshold distance", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(120));
    env.tick(1000);
    env.win.fire("touchmove", touch(120 + 88));
    env.win.fire("touchend", touchEnd(208));
    expect(closed).toBe(0);
  });

  it("honours a custom threshold", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", threshold: 20, close: () => closed++ });
    sheet.fire("touchstart", touch(120));
    env.tick(1000);
    env.win.fire("touchmove", touch(145));
    env.win.fire("touchend", touchEnd(145));
    expect(closed).toBe(1);
  });

  it("dismisses on a fast flick even when short, but not a fast flick under 24px", () => {
    const flick = (dist: number) => {
      const env = setup();
      const { sheet } = env.sheet();
      let closed = 0;
      env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
      sheet.fire("touchstart", touch(120));
      env.tick(20); // dist/20ms is well above 0.6 px/ms
      env.win.fire("touchmove", touch(120 + dist));
      env.win.fire("touchend", touchEnd(120 + dist));
      return closed;
    };
    expect(flick(40)).toBe(1); // 2 px/ms, 40 > 24
    expect(flick(24)).toBe(0); // velocity high but not > 24px
    expect(flick(30)).toBe(1);
  });

  it("does not dismiss a slow short drag even at moderate speed (<0.6 px/ms)", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(120));
    env.tick(100);
    env.win.fire("touchmove", touch(120 + 50)); // 0.5 px/ms
    env.win.fire("touchend", touchEnd(170));
    expect(closed).toBe(0);
  });

  it("ignores upward movement for a bottom sheet (no negative offset)", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(200));
    env.tick(50);
    const move = env.win.fire("touchmove", touch(100));
    expect(sheet.style.transform).toBeUndefined();
    expect(move.defaultPrevented).toBe(false); // lets the page scroll normally
    env.win.fire("touchend", touchEnd(100));
    expect(closed).toBe(0);
  });

  it("a non-cancelable move still drags without calling preventDefault", () => {
    const env = setup();
    const { sheet } = env.sheet();
    env.api.bindBottomSheet({ sheetId: "sheet" });
    sheet.fire("touchstart", touch(100));
    env.tick(50);
    const move = env.win.fire("touchmove", { ...touch(160), cancelable: false });
    expect(sheet.style.transform).toBe("translateY(60px)");
    expect(move.defaultPrevented).toBe(false);
  });

  it("works without a close callback (snaps back, no throw)", () => {
    const env = setup();
    const { sheet } = env.sheet();
    env.api.bindBottomSheet({ sheetId: "sheet" });
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(400));
    expect(() => env.win.fire("touchend", touchEnd(400))).not.toThrow();
    expect(sheet.style.transform).toBe("");
  });

  it("restores text selection after the drag", () => {
    const env = setup();
    const { sheet } = env.sheet();
    env.api.bindBottomSheet({ sheetId: "sheet" });
    sheet.fire("touchstart", touch(100));
    env.tick(100);
    env.win.fire("touchmove", touch(140));
    expect(env.body.style.userSelect).toBe("none");
    env.win.fire("touchend", touchEnd(140));
    expect(env.body.style.userSelect).toBe("");
  });

  it("clamps backdrop opacity to 0 when dragged beyond maxOffset", () => {
    const env = setup();
    const { sheet, backdrop } = env.sheet("s", undefined, "b");
    env.api.bindBottomSheet({ sheetId: "s", backdropId: "b", maxOffset: 100 });
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(500));
    expect(backdrop!.style.opacity).toBe("0");
  });

  it("touchcancel ends the drag like touchend", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(300));
    env.win.fire("touchcancel", touchEnd(300));
    expect(closed).toBe(1);
  });

  it("moves before a start, or after the drag ended, do nothing", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    env.win.fire("touchmove", touch(500));
    env.win.fire("touchend", touchEnd(500));
    expect(sheet.style.transform).toBeUndefined();
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(300));
    env.win.fire("touchend", touchEnd(300));
    expect(closed).toBe(1);
    env.win.fire("touchend", touchEnd(300)); // second end must not re-close
    expect(closed).toBe(1);
  });

  it("a second drag starts clean (no leftover offset or velocity)", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(100));
    env.tick(10);
    env.win.fire("touchmove", touch(200)); // fast -> would dismiss
    env.win.fire("touchmove", touch(100)); // back to start
    env.win.fire("touchend", touchEnd(100));
    expect(closed).toBe(0); // final deltaY is 0
    sheet.fire("touchstart", touch(100));
    env.win.fire("touchend", touchEnd(100)); // tap, no move
    expect(closed).toBe(0);
  });
});

describe("sheet gestures: where a drag may start", () => {
  it("ignores drags that start on inputs, buttons, links or [data-no-swipe-close]", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    const targets: FakeEl[] = [];
    for (const tag of ["input", "textarea", "select", "button", "a", "label"]) {
      targets.push(sheet.add(new FakeEl("", tag)));
    }
    const noSwipe = sheet.add(new FakeEl());
    (noSwipe as any).noSwipe = true;
    targets.push(noSwipe);
    // child of a button also counts (closest walks up)
    targets.push(targets[3].add(new FakeEl("", "span")));
    for (const t of targets) {
      t.fire("touchstart", touch(150)); // bubbles to the sheet listener in a real DOM
      for (const fn of sheet.listeners["touchstart"])
        fn({ type: "touchstart", target: t, ...touch(150) });
      env.tick(1000);
      env.win.fire("touchmove", touch(400));
      env.win.fire("touchend", touchEnd(400));
    }
    expect(closed).toBe(0);
    expect(sheet.style.transform).toBeUndefined();
  });

  it("with no handle, a plain area of the sheet can be dragged", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    const plain = sheet.add(new FakeEl("", "div"));
    for (const fn of sheet.listeners["touchstart"])
      fn({ type: "touchstart", target: plain, ...touch(300) });
    env.tick(1000);
    env.win.fire("touchmove", touch(450));
    env.win.fire("touchend", touchEnd(450));
    expect(closed).toBe(1);
  });

  it("with a handle: handle drags always work, sheet content only inside the top grab zone", () => {
    const env = setup();
    const { sheet, handle } = env.sheet("s", "h");
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "s", handleId: "h", close: () => closed++ });
    expect(handle!.style.touchAction).toBe("none");
    expect(handle!.style.cursor).toBe("grab");
    const body = sheet.add(new FakeEl("", "div"));
    const start = (target: FakeEl, y: number) => {
      for (const fn of sheet.listeners["touchstart"])
        fn({ type: "touchstart", target, ...touch(y) });
    };
    const drag = (to: number) => {
      env.tick(1000);
      env.win.fire("touchmove", touch(to));
      env.win.fire("touchend", touchEnd(to));
    };

    // content below the 56px grab zone (rect.top = 100 → zone is 100..156): ignored
    start(body, 300);
    drag(500);
    expect(closed).toBe(0);
    // above the sheet's top edge: ignored
    start(body, 90);
    drag(500);
    expect(closed).toBe(0);
    // inside the zone: allowed
    start(body, 130);
    drag(300);
    expect(closed).toBe(1);
    // the handle itself, regardless of y
    start(handle!, 400);
    expect(handle!.style.cursor).toBe("grabbing");
    drag(600);
    expect(closed).toBe(2);
    expect(handle!.style.cursor).toBe("grab");
    // a target outside the sheet entirely
    start(new FakeEl("", "div"), 120);
    drag(600);
    expect(closed).toBe(2);
  });

  it("does not start when isOpen() says the sheet is closed", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let open = false;
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", isOpen: () => open, close: () => closed++ });
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(400));
    env.win.fire("touchend", touchEnd(400));
    expect(closed).toBe(0);
    open = true;
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(400));
    env.win.fire("touchend", touchEnd(400));
    expect(closed).toBe(1);
  });

  it("ignores non-primary mouse buttons", () => {
    const env = setup(false);
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("mousedown", { button: 2, clientY: 100 });
    env.tick(1000);
    env.win.fire("mousemove", { clientY: 400 });
    env.win.fire("mouseup", { clientY: 400 });
    expect(closed).toBe(0);
    sheet.fire("mousedown", { button: 0, clientY: 100 });
    env.tick(1000);
    env.win.fire("mousemove", { clientY: 400 });
    env.win.fire("mouseup", { clientY: 400 });
    expect(closed).toBe(1);
  });
});

describe("sheet gestures: input modes", () => {
  it("without PointerEvent it listens to touch + mouse, never pointer events", () => {
    const env = setup(false);
    const { sheet } = env.sheet();
    env.api.bindBottomSheet({ sheetId: "sheet" });
    expect(Object.keys(sheet.listeners).sort()).toEqual(["mousedown", "touchstart"]);
    expect(Object.keys(env.win.listeners).sort()).toEqual([
      "mousemove",
      "mouseup",
      "touchcancel",
      "touchend",
      "touchmove",
    ]);
    expect(Object.keys(env.doc.listeners).sort()).toEqual(Object.keys(env.win.listeners).sort());
  });

  it("with PointerEvent it uses pointer events and ignores the duplicate mouse/touch-pointer events", () => {
    const env = setup(true);
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    expect(Object.keys(sheet.listeners).sort()).toEqual(["pointerdown", "touchstart"]);

    // pen/mouse pointer drag works
    sheet.fire("pointerdown", { pointerType: "mouse", button: 0, clientY: 100 });
    env.tick(1000);
    env.win.fire("pointermove", { pointerType: "mouse", clientY: 300 });
    expect(sheet.style.transform).toBe("translateY(200px)");
    env.win.fire("pointerup", { pointerType: "mouse", clientY: 300 });
    expect(closed).toBe(1);

    // touch pointer events are skipped (touch events handle those)
    sheet.fire("pointerdown", { pointerType: "touch", button: 0, clientY: 100 });
    env.tick(1000);
    env.win.fire("pointermove", { pointerType: "touch", clientY: 300 });
    env.win.fire("pointerup", { pointerType: "touch", clientY: 300 });
    expect(closed).toBe(1);
    expect(sheet.style.transform).toBe("");

    // a touch drag finished by pointerup(touch)/pointercancel(touch) must wait for the touch end
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(300));
    env.win.fire("pointerup", { pointerType: "touch", clientY: 300 });
    env.win.fire("pointercancel", { pointerType: "touch", clientY: 300 });
    expect(closed).toBe(1); // still dragging
    env.win.fire("touchend", touchEnd(300));
    expect(closed).toBe(2);

    // legacy mouse events are ignored when pointer events exist
    sheet.fire("mousedown", { button: 0, clientY: 100 });
    expect(sheet.style.transition).toBe("");
  });
});

describe("sheet gestures: top sheet", () => {
  it("closes by dragging up, and ignores downward movement", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindTopSheet({ sheetId: "sheet", close: () => closed++ });
    sheet.fire("touchstart", touch(300));
    env.tick(1000);
    env.win.fire("touchmove", touch(400)); // down: nothing
    expect(sheet.style.transform).toBeUndefined();
    env.win.fire("touchmove", touch(200));
    expect(sheet.style.transform).toBe("translateY(-100px)");
    env.win.fire("touchend", touchEnd(200));
    expect(closed).toBe(1);
  });

  it("with a handle, content grab zone is the bottom 56px of the sheet", () => {
    const env = setup();
    const { sheet } = env.sheet("s", "h"); // rect: top 100, bottom 500
    let closed = 0;
    env.api.bindTopSheet({ sheetId: "s", handleId: "h", close: () => closed++ });
    const body = sheet.add(new FakeEl("", "div"));
    const go = (y: number, to: number) => {
      for (const fn of sheet.listeners["touchstart"])
        fn({ type: "touchstart", target: body, ...touch(y) });
      env.tick(1000);
      env.win.fire("touchmove", touch(to));
      env.win.fire("touchend", touchEnd(to));
    };
    go(150, 0); // near the top: not the grab zone for a top sheet
    expect(closed).toBe(0);
    go(480, 300);
    expect(closed).toBe(1);
  });
});

describe("sheet gestures: binding lifecycle", () => {
  it("binds a sheet only once, so a drag is not processed twice", () => {
    const env = setup();
    const { sheet } = env.sheet();
    let closed = 0;
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    env.api.bindBottomSheet({ sheetId: "sheet", close: () => closed++ });
    expect(sheet.listeners["touchstart"].length).toBe(1);
    sheet.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(300));
    env.win.fire("touchend", touchEnd(300));
    expect(closed).toBe(1);
  });

  it("silently skips a sheet id that is not in the DOM (no listeners added)", () => {
    const env = setup();
    expect(() => env.api.bindBottomSheet({ sheetId: "missing" })).not.toThrow();
    expect(Object.keys(env.win.listeners)).toEqual([]);
  });

  it("two sheets drag independently", () => {
    const env = setup();
    const a = env.sheet("a").sheet;
    env.sheet("b");
    const closed: string[] = [];
    env.api.bindBottomSheet({ sheetId: "a", close: () => closed.push("a") });
    env.api.bindBottomSheet({ sheetId: "b", close: () => closed.push("b") });
    a.fire("touchstart", touch(100));
    env.tick(1000);
    env.win.fire("touchmove", touch(400));
    env.win.fire("touchend", touchEnd(400));
    expect(closed).toEqual(["a"]);
  });

  it("autoBind with no matching handles is a harmless no-op", () => {
    const env = setup();
    expect(() => env.api.autoBind()).not.toThrow();
  });
});
