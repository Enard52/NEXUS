import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  commands: [] as string[],
  stdout: "" as string,
  fail: null as string | null,
}));

vi.mock("node:child_process", async () => {
  const { promisify: p } = await import("node:util");
  const exec = () => undefined;
  // Real child_process.exec resolves { stdout, stderr } when promisified; mirror that.
  (exec as unknown as Record<symbol, unknown>)[p.custom] = async (command: string) => {
    state.commands.push(command);
    if (state.fail) throw new Error(state.fail);
    return { stdout: state.stdout, stderr: "" };
  };
  return { exec };
});

const { MacosPlatformAdapter } = await import("./macos-adapter.js");
const { asq, shq } = await import("./shell-quote.js");

beforeEach(() => {
  state.commands.length = 0;
  state.stdout = "";
  state.fail = null;
});

describe("shq", () => {
  it("wraps a value in single quotes", () => {
    expect(shq("abc")).toBe("'abc'");
  });

  it("escapes embedded single quotes", () => {
    expect(shq("it's")).toBe(`'it'\\''s'`);
  });

  it("keeps shell metacharacters and newlines literal", () => {
    expect(shq("x; rm -rf ~ && $(id) `id`\n\\")).toBe("'x; rm -rf ~ && $(id) `id`\n\\'");
  });
});

describe("asq", () => {
  it("leaves normal text untouched", () => {
    expect(asq("Safari")).toBe("Safari");
  });

  it("escapes backslashes first, then double quotes", () => {
    expect(asq(`a\\"b`)).toBe(`a\\\\\\"b`);
    expect(asq(`say "hi"`)).toBe(`say \\"hi\\"`);
  });

  it("does not touch single quotes (the osascript wrapper handles those)", () => {
    expect(asq("it's")).toBe("it's");
  });
});

describe("MacosPlatformAdapter shell commands", () => {
  const adapter = new MacosPlatformAdapter();

  it("launchApp quotes the app name as one shell word", async () => {
    await adapter.launchApp("Visual Studio Code");
    await adapter.launchApp(`x"; touch /tmp/pwned; "`);
    await adapter.launchApp("it's $(id)");
    expect(state.commands).toEqual([
      "open -a 'Visual Studio Code'",
      `open -a 'x"; touch /tmp/pwned; "'`,
      `open -a 'it'\\''s $(id)'`,
    ]);
  });

  it("closeApp and focusApp keep the name inside the AppleScript string", async () => {
    await adapter.closeApp("Safari");
    await adapter.closeApp(`a" & (do shell script "id") & "`);
    await adapter.focusApp("it's");
    await adapter.focusApp("back\\slash");
    expect(state.commands).toEqual([
      `osascript -e 'tell application "Safari" to quit'`,
      `osascript -e 'tell application "a\\" & (do shell script \\"id\\") & \\"" to quit'`,
      `osascript -e 'tell application "it'\\''s" to activate'`,
      `osascript -e 'tell application "back\\\\slash" to activate'`,
    ]);
  });

  it("file operations quote every path and stop option parsing where supported", async () => {
    await adapter.createFile("/tmp/a b");
    await adapter.createFile("/tmp/dir $(id)", true);
    await adapter.moveFile("-rf", "/tmp/d est");
    await adapter.copyFile("/tmp/s", `/tmp/d"; id; "`);
    await adapter.openFile("/tmp/f `id`");
    expect(state.commands).toEqual([
      "touch '/tmp/a b'",
      "mkdir -p '/tmp/dir $(id)'",
      "mv -- '-rf' '/tmp/d est'",
      `cp -R -- '/tmp/s' '/tmp/d"; id; "'`,
      "open '/tmp/f `id`'",
    ]);
  });

  it("deleteFile escapes the path for AppleScript, then for the shell", async () => {
    await adapter.deleteFile("/Users/me/a b.txt");
    await adapter.deleteFile(`/tmp/x" & (do shell script "id") & "`);
    await adapter.deleteFile("/tmp/it's\nnew\\line");
    expect(state.commands).toEqual([
      `osascript -e 'tell application "Finder" to delete POSIX file "/Users/me/a b.txt"'`,
      `osascript -e 'tell application "Finder" to delete POSIX file "/tmp/x\\" & (do shell script \\"id\\") & \\""'`,
      `osascript -e 'tell application "Finder" to delete POSIX file "/tmp/it'\\''s\nnew\\\\line"'`,
    ]);
  });

  it("showNotification escapes title and body", async () => {
    await adapter.showNotification("Hello", "World");
    await adapter.showNotification(`t" & (do shell script "id") & "`, `b'ody\\`);
    expect(state.commands).toEqual([
      `osascript -e 'display notification "World" with title "Hello"'`,
      `osascript -e 'display notification "b'\\''ody\\\\" with title "t\\" & (do shell script \\"id\\") & \\""'`,
    ]);
  });

  it("writeClipboard passes the text through printf without shell expansion", async () => {
    await adapter.writeClipboard("plain");
    await adapter.writeClipboard("a $(id) `id` 'q' \"d\"; id\n");
    expect(state.commands).toEqual([
      "printf '%s' 'plain' | pbcopy",
      "printf '%s' 'a $(id) `id` '\\''q'\\'' \"d\"; id\n' | pbcopy",
    ]);
  });

  it("killProcess rejects anything that is not a positive integer pid", async () => {
    for (const bad of [0, -1, 1.5, NaN, Infinity]) {
      const r = await adapter.killProcess(bad);
      expect(r.success).toBe(false);
    }
    expect(state.commands).toEqual([]);
    await adapter.killProcess(123);
    expect(state.commands).toEqual(["kill -9 123"]);
  });

  it("setVolume and setBrightness reject non-numbers and clamp the rest", async () => {
    expect((await adapter.setVolume(NaN)).success).toBe(false);
    expect((await adapter.setBrightness(Infinity)).success).toBe(false);
    expect(state.commands).toEqual([]);
    await adapter.setVolume(250);
    await adapter.setBrightness(-5);
    expect(state.commands).toEqual([
      `osascript -e 'set volume output volume 100'`,
      "brightness 0.00",
    ]);
  });

  it("reports a failed command honestly instead of success", async () => {
    state.fail = "boom";
    const r = await adapter.sleep();
    expect(r).toMatchObject({ success: false, error: "boom" });
  });
});
