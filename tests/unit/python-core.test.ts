import { loadPyodide, type PyodideAPI } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import {
  BLOCKED_GLOBALS,
  cleanTraceback,
  describeError,
  isolatePython,
  lockDown,
  runPython,
} from "../../public/runner/python-core.mjs";

// Real CPython (Pyodide 0.29.5, WebAssembly) running in Node: the same core
// the browser worker uses. Browser-only layers (worker CSP, termination on
// timeout) are covered by tests/unit/python-runner.test.ts and the browser check.
let py: PyodideAPI;

async function run(code: string, stdin = "", maxOutputChars?: number) {
  let out = "";
  const result = await runPython(py, code, {
    stdin,
    maxOutputChars,
    onOutput: (_stream, text) => {
      out += text;
    },
  });
  return { ...result, out };
}

beforeAll(async () => {
  py = await loadPyodide();
  isolatePython(py);
}, 60_000);

describe("runPython (real Pyodide)", () => {
  it("prints output in order", async () => {
    const r = await run(
      'for i in range(3):\n    print("Lompat!")\nprint("Selesai")',
    );
    expect(r.status).toBe("ok");
    expect(r.out).toBe("Lompat!\nLompat!\nLompat!\nSelesai\n");
  });

  it("starts every run with fresh variables", async () => {
    await run("rahasia = 42");
    const r = await run("print(rahasia)");
    expect(r.status).toBe("error");
    expect(r.error?.type).toBe("NameError");
  });

  it("feeds input() from the given stdin and reports EOF when it runs out", async () => {
    const r = await run('nama = input()\nprint("Halo", nama)', "FlipBot");
    expect(r.out).toContain("Halo FlipBot");
    const eof = await run("input()");
    expect(eof.status).toBe("error");
    expect(eof.error?.type).toBe("EOFError");
  });

  it("reports the learner's line and hides Pyodide internals", async () => {
    const r = await run("a = 1\nprint(b)\n");
    expect(r.error).toMatchObject({ type: "NameError", line: 2 });
    expect(r.error?.traceback).not.toMatch(/_pyodide|\/lib\/python/);
    const syntax = await run("for i in range(3)\n    print(i)");
    expect(syntax.error?.type).toBe("SyntaxError");
    expect(syntax.error?.line).toBe(1);
  });

  it("stops an endless printing loop at the output limit", async () => {
    const r = await run('while True:\n    print("x" * 50)', "", 1000);
    expect(r.status).toBe("output_limit");
    expect(r.out.length).toBeLessThanOrEqual(1000);
  });

  it("cannot import the JavaScript bridge", async () => {
    for (const mod of ["js", "pyodide_js"]) {
      const r = await run(`import ${mod}`);
      expect(r.status).toBe("error");
      expect(r.error?.type).toBe("ModuleNotFoundError");
    }
  });
});

describe("lockDown", () => {
  it("removes network globals from the scope and its prototypes", () => {
    const proto = { fetch: () => "network", XMLHttpRequest: class {} };
    const scope = Object.create(proto) as Record<string, unknown>;
    scope.WebSocket = class {};
    scope.importScripts = () => undefined;
    scope.keep = 1;
    const blocked = lockDown(scope);
    expect(blocked).toEqual([...BLOCKED_GLOBALS]);
    expect(scope.fetch).toBeUndefined();
    expect((proto as Record<string, unknown>).fetch).toBeUndefined();
    expect(scope.WebSocket).toBeUndefined();
    expect(scope.keep).toBe(1);
    expect(() => {
      scope.fetch = () => "again";
    }).toThrow();
  });
});

describe("traceback helpers", () => {
  it("keeps only the learner frames", () => {
    const tb = cleanTraceback(
      'Traceback (most recent call last):\n  File "/lib/python3.13/_pyodide/_base.py", line 1\n  File "<exec>", line 3, in <module>\nZeroDivisionError: division by zero\n',
    );
    expect(tb).toBe(
      'Traceback (most recent call last):\n  File "<exec>", line 3, in <module>\nZeroDivisionError: division by zero',
    );
    expect(describeError(tb)).toEqual({
      type: "ZeroDivisionError",
      message: "division by zero",
      line: 3,
    });
  });
});
