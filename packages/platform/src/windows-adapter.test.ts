import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  calls: [] as { file: string; args: string[] }[],
  stdout: "" as string,
  fail: null as string | null,
}));

vi.mock("node:child_process", async () => {
  const { promisify: p } = await import("node:util");
  const execFile = () => undefined;
  // Real child_process.execFile resolves { stdout, stderr } when promisified; mirror that.
  (execFile as unknown as Record<symbol, unknown>)[p.custom] = async (
    file: string,
    args: string[],
  ) => {
    state.calls.push({ file, args });
    if (state.fail) throw new Error(state.fail);
    return { stdout: state.stdout, stderr: "" };
  };
  return { execFile };
});

const { WindowsPlatformAdapter, psq } = await import("./windows-adapter.js");

/** Decode the script that was handed to powershell via -EncodedCommand. */
function scriptOf(i: number): string {
  const call = state.calls[i]!;
  expect(call.file).toBe("powershell");
  expect(call.args.slice(0, 3)).toEqual(["-NoProfile", "-NonInteractive", "-EncodedCommand"]);
  expect(call.args).toHaveLength(4);
  return Buffer.from(call.args[3]!, "base64").toString("utf16le");
}

beforeEach(() => {
  state.calls.length = 0;
  state.stdout = "";
  state.fail = null;
});

describe("psq", () => {
  it("wraps a value in single quotes", () => {
    expect(psq("abc")).toBe("'abc'");
  });

  it("doubles embedded single quotes", () => {
    expect(psq("it's")).toBe("'it''s'");
    expect(psq("'; calc; '")).toBe("'''; calc; '''");
  });

  it("keeps PowerShell and cmd metacharacters literal", () => {
    const v = 'a"b;c$(id)`d&e|f\r\ng';
    expect(psq(v)).toBe(`'${v}'`);
  });
});

describe("WindowsPlatformAdapter commands", () => {
  const adapter = new WindowsPlatformAdapter();

  it("never goes through cmd.exe: scripts travel as one encoded argument", async () => {
    await adapter.launchApp('x"; calc; "');
    const call = state.calls[0]!;
    expect(call.args.join(" ")).not.toContain("calc");
    expect(scriptOf(0)).toBe(
      `Start-Process 'x"; calc; "' -PassThru | Select-Object -Property Id,Name | ConvertTo-Json`,
    );
  });

  it("launchApp keeps a quote in the name inside the literal", async () => {
    const r = await adapter.launchApp("a'; calc; '");
    expect(scriptOf(0)).toContain("Start-Process 'a''; calc; ''' -PassThru");
    expect(r).toMatchObject({ success: true, data: { name: "a'; calc; '", running: true } });
  });

  it("closeApp and focusApp quote the name", async () => {
    await adapter.closeApp("x' ; calc ; '");
    await adapter.focusApp("it's");
    expect(scriptOf(0)).toBe(
      "Get-Process -Name 'x'' ; calc ; ''' -ErrorAction SilentlyContinue | Stop-Process -Force",
    );
    expect(scriptOf(1)).toContain("Get-Process -Name 'it''s' -ErrorAction SilentlyContinue");
  });

  it("file operations quote every path", async () => {
    await adapter.createFile("C:\\a b\\x'y");
    await adapter.createFile("C:\\dir $(calc)", true);
    await adapter.deleteFile("C:\\x'; calc; '");
    await adapter.moveFile("C:\\s", "C:\\d`; calc");
    await adapter.copyFile("C:\\s'", "C:\\d");
    await adapter.openFile('C:\\f" & calc & "');
    expect([0, 1, 2, 3, 4, 5].map(scriptOf)).toEqual([
      "New-Item -ItemType File -Force -Path 'C:\\a b\\x''y'",
      "New-Item -ItemType Directory -Force -Path 'C:\\dir $(calc)'",
      "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('C:\\x''; calc; ''','OnlyErrorDialogs','SendToRecycleBin')",
      "Move-Item -Path 'C:\\s' -Destination 'C:\\d`; calc' -Force",
      "Copy-Item -Path 'C:\\s''' -Destination 'C:\\d' -Recurse -Force",
      `Start-Process -FilePath 'C:\\f" & calc & "'`,
    ]);
  });

  it("showNotification quotes title and body", async () => {
    await adapter.showNotification("hi'); calc; ('", 'b$(id)\n"x');
    const s = scriptOf(0);
    expect(s).toContain("CreateTextNode('hi''); calc; (''')");
    expect(s).toContain("CreateTextNode('b$(id)\n\"x')");
  });

  it("writeClipboard keeps the text literal", async () => {
    await adapter.writeClipboard("a $(id) 'q' \"d\" `t");
    expect(scriptOf(0)).toBe("Set-Clipboard -Value 'a $(id) ''q'' \"d\" `t'");
  });

  it("killProcess rejects anything that is not a positive integer pid", async () => {
    for (const bad of [0, -1, 1.5, NaN]) {
      expect((await adapter.killProcess(bad)).success).toBe(false);
    }
    expect(state.calls).toEqual([]);
    await adapter.killProcess(123);
    expect(scriptOf(0)).toBe("Stop-Process -Id 123 -Force");
  });

  it("clamps volume and brightness to 0..100 and rejects non-numbers", async () => {
    await adapter.setVolume(250);
    await adapter.setBrightness(-5);
    expect(scriptOf(0)).toContain("1..50 | ForEach-Object { $obj.SendKeys([char]175) }");
    expect(scriptOf(1)).toContain("WmiSetBrightness(1,0)");
    expect((await adapter.setVolume(NaN)).success).toBe(false);
    expect((await adapter.setBrightness(NaN)).success).toBe(false);
    expect(state.calls).toHaveLength(2);
  });

  it("lockScreen runs rundll32 with an argument array", async () => {
    await adapter.lockScreen();
    expect(state.calls[0]).toEqual({ file: "rundll32.exe", args: ["user32.dll,LockWorkStation"] });
  });

  it("reports a failed command honestly instead of success", async () => {
    state.fail = "boom";
    expect(await adapter.sleep()).toMatchObject({ success: false, error: "boom" });
  });

  it("parses processes from PowerShell JSON", async () => {
    state.stdout = JSON.stringify([{ Id: 7, Name: "foo", CPU: 1.5, WorkingSet: 2097152 }]);
    const r = await adapter.listProcesses();
    expect(r.data).toEqual([{ pid: 7, name: "foo", cpu: 1.5, memory: 2 }]);
  });
});
