// Python runner core (D-012). Runs inside a dedicated Web Worker and in unit
// tests under Node. Plain ES module: it is served as-is from /runner/.

/** Limits enforced for every run (the worker timeout is enforced by the page). */
export const RUN_LIMITS = Object.freeze({
  timeoutMs: 5000,
  maxOutputChars: 20000,
  maxStdinChars: 2000,
  maxCodeChars: 20000,
});

/** Globals that can reach the network or spawn more code; removed after Python loads. */
export const BLOCKED_GLOBALS = Object.freeze([
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "WebSocketStream",
  "WebTransport",
  "EventSource",
  "importScripts",
  "Worker",
  "SharedWorker",
  "BroadcastChannel",
  "RTCPeerConnection",
  "indexedDB",
  "caches",
]);

/**
 * Removes network-capable globals from the scope and its prototype chain,
 * then pins them to undefined. Returns the names that are now unavailable.
 */
export function lockDown(scope) {
  for (const name of BLOCKED_GLOBALS) {
    let target = scope;
    while (target) {
      if (Object.prototype.hasOwnProperty.call(target, name)) {
        try {
          delete target[name];
        } catch {
          // Non-configurable: shadowed below.
        }
      }
      target = Object.getPrototypeOf(target);
    }
    try {
      Object.defineProperty(scope, name, {
        value: undefined,
        writable: false,
        configurable: false,
      });
    } catch {
      // Already non-configurable on the scope itself.
    }
  }
  return BLOCKED_GLOBALS.filter((name) => scope[name] === undefined);
}

/** Detaches the JavaScript bridge modules so learner code cannot `import js`. */
export function isolatePython(pyodide) {
  for (const name of ["js", "pyodide_js"]) {
    try {
      pyodide.unregisterJsModule(name);
    } catch {
      // Not registered.
    }
  }
  pyodide.runPython(
    "import sys\n" +
      "for _m in [k for k in list(sys.modules) if k in ('js', 'pyodide_js') or k.startswith('js.')]:\n" +
      "    sys.modules.pop(_m, None)\n" +
      "del _m",
  );
}

/** Keeps only the learner's part of a Pyodide traceback. */
export function cleanTraceback(message) {
  const lines = String(message).replace(/\s+$/, "").split("\n");
  const start = lines.findIndex((l) => l.includes('File "<exec>"'));
  const kept = start >= 0 ? lines.slice(start) : lines.slice(-1);
  return ["Traceback (most recent call last):", ...kept].join("\n");
}

/** Error type, message and line number of the learner's code. */
export function describeError(traceback) {
  const lines = traceback.split("\n").filter((l) => l.trim() !== "");
  const last = lines[lines.length - 1] ?? "";
  const match = /^([A-Za-z_][\w.]*)(?::\s?(.*))?$/.exec(last.trim());
  const lineNumbers = [...traceback.matchAll(/File "<exec>", line (\d+)/g)];
  const line = lineNumbers.length
    ? Number(lineNumbers[lineNumbers.length - 1][1])
    : null;
  return {
    type: match ? match[1] : "Error",
    message: match ? (match[2] ?? "") : last.trim(),
    line,
  };
}

const OUTPUT_LIMIT = "COGNIFLIP_OUTPUT_LIMIT";

/**
 * Runs learner code in a fresh global namespace.
 * Output is streamed through `onOutput(stream, text)` and capped.
 */
export async function runPython(pyodide, code, options = {}) {
  const maxOutputChars = options.maxOutputChars ?? RUN_LIMITS.maxOutputChars;
  const onOutput = options.onOutput ?? (() => {});
  let used = 0;
  let truncated = false;

  const sink = (stream) => {
    const decoder = new TextDecoder();
    return {
      write(buffer) {
        const text = decoder.decode(buffer, { stream: true });
        if (truncated) throw new Error(OUTPUT_LIMIT);
        if (used + text.length > maxOutputChars) {
          const rest = text.slice(0, Math.max(0, maxOutputChars - used));
          if (rest) onOutput(stream, rest);
          used = maxOutputChars;
          truncated = true;
          throw new Error(OUTPUT_LIMIT);
        }
        used += text.length;
        if (text) onOutput(stream, text);
        return buffer.length;
      },
    };
  };

  const stdinLines = String(options.stdin ?? "")
    .slice(0, RUN_LIMITS.maxStdinChars)
    .split("\n");
  if (stdinLines.length === 1 && stdinLines[0] === "") stdinLines.length = 0;

  pyodide.setStdout(sink("stdout"));
  pyodide.setStderr(sink("stderr"));
  pyodide.setStdin({
    stdin: () => (stdinLines.length ? stdinLines.shift() : undefined),
  });

  const dict = pyodide.globals.get("dict");
  const globals = dict();
  dict.destroy();
  try {
    if (code.length > RUN_LIMITS.maxCodeChars)
      return {
        status: "error",
        error: {
          type: "CodeTooLong",
          message: `Kode lebih dari ${RUN_LIMITS.maxCodeChars} karakter.`,
          line: null,
          traceback: "",
        },
      };
    await pyodide.runPythonAsync(code, { globals });
    return { status: "ok", error: null };
  } catch (err) {
    if (truncated) return { status: "output_limit", error: null };
    const traceback = cleanTraceback(err && err.message ? err.message : err);
    return {
      status: "error",
      error: { ...describeError(traceback), traceback },
    };
  } finally {
    globals.destroy();
    pyodide.setStdout();
    pyodide.setStderr();
    pyodide.setStdin();
  }
}
