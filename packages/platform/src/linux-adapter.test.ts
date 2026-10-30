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

const { LinuxPlatformAdapter, shq } = await import("./linux-adapter.js");

beforeEach(() => {
  state.commands.length = 0;
  state.stdout = "";
  state.fail = null;
});

describe("shq", () => {
  it("wraps a value in single quotes", () => {
    expect(shq("abc")).toBe("'abc'");
  });

  it("escapes embedded single quotes so the word cannot be closed early", () => {
    expect(shq("it's")).toBe(`'it'\\''s'`);
  });

  it("keeps shell metacharacters literal", () => {
    expect(shq("x; rm -rf ~ && $(id) `id`")).toBe("'x; rm -rf ~ && $(id) `id`'");
  });
});

describe("LinuxPlatformAdapter shell commands", () => {
  const adapter = new LinuxPlatformAdapter();

  it("launchApp never lets an app name add commands", async () => {
    state.stdout = "4242\n";
    const result = await adapter.launchApp("x; touch /tmp/pwned");
    expect(state.commands[0]).toBe("nohup 'x; touch /tmp/pwned' > /dev/null 2>&1 & echo $!");
    expect(result).toMatchObject({ success: true, data: { pid: 4242, running: true } });
  });

  it("closeApp and focusApp quote the name", async () => {
    await adapter.closeApp(`a"; id; "`);
    await adapter.focusApp("it's");
    expect(state.commands[0]).toBe(`pkill -f 'a"; id; "'`);
    expect(state.commands[1]).toBe(`xdotool search --name 'it'\\''s' windowactivate`);
  });

  it("file operations quote every path and stop option parsing with --", async () => {
    await adapter.createFile("/tmp/a b");
    await adapter.createFile("/tmp/dir $(id)", true);
    await adapter.deleteFile("/tmp/x'y");
    await adapter.moveFile("-rf", "/tmp/d est");
    await adapter.copyFile("/tmp/s", "/tmp/d; id");
    await adapter.openFile("/tmp/f `id`");
    expect(state.commands).toEqual([
      "touch '/tmp/a b'",
      "mkdir -p '/tmp/dir $(id)'",
      `gio trash '/tmp/x'\\''y'`,
      "mv -- '-rf' '/tmp/d est'",
      "cp -r -- '/tmp/s' '/tmp/d; id'",
      "xdg-open '/tmp/f `id`'",
    ]);
  });

  it("showNotification quotes title and body", async () => {
    await adapter.showNotification("hi; id", `b"ody`);
    expect(state.commands[0]).toBe(`notify-send -- 'hi; id' 'b"ody'`);
  });

  it("writeClipboard passes the text through printf without shell expansion", async () => {
    await adapter.writeClipboard("a $(id) 'q' \"d\"");
    const cmd = state.commands[0]!;
    expect(cmd.startsWith("printf '%s' 'a $(id) '\\''q'\\'' \"d\"' | xclip")).toBe(true);
    expect(cmd).not.toContain("echo");
  });

  it("killProcess rejects anything that is not a positive integer pid", async () => {
    for (const bad of [0, -1, 1.5, NaN]) {
      const r = await adapter.killProcess(bad);
      expect(r.success).toBe(false);
    }
    expect(state.commands).toEqual([]);
    await adapter.killProcess(123);
    expect(state.commands).toEqual(["kill -9 123"]);
  });

  it("reports a failed command honestly instead of success", async () => {
    state.fail = "boom";
    const r = await adapter.sleep();
    expect(r).toMatchObject({ success: false, error: "boom" });
  });

  it("clamps volume and brightness to 0..100", async () => {
    await adapter.setVolume(250);
    await adapter.setBrightness(-5);
    expect(state.commands[0]).toContain("set-sink-volume @DEFAULT_SINK@ 100%");
    expect(state.commands[1]).toBe("brightnessctl set 0%");
  });

  it("parses processes from ps output", async () => {
    state.stdout =
      "USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND\n" +
      "root 12 3.5 1.2 1 2 ? S 10:00 0:01 /usr/bin/foo --bar\n";
    const r = await adapter.listProcesses();
    expect(r.data).toEqual([{ pid: 12, name: "/usr/bin/foo --bar", cpu: 3.5, memory: 1.2 }]);
  });
});
