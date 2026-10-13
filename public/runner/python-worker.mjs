// Dedicated module worker that runs learner Python with Pyodide (D-012).
// Served with a strict Content-Security-Policy (next.config.ts): it can load
// scripts and data only from this site and cannot contact other servers.
import { isolatePython, lockDown, runPython } from "./python-core.mjs";

let pyodide = null;
let running = false;

self.onmessage = async (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;

  if (message.type === "init") {
    try {
      const { loadPyodide } = await import("/pyodide/pyodide.mjs");
      pyodide = await loadPyodide({ indexURL: "/pyodide/" });
      isolatePython(pyodide);
      lockDown(self);
      self.postMessage({ type: "ready", version: pyodide.version });
    } catch {
      self.postMessage({ type: "load_failed" });
    }
    return;
  }

  if (message.type === "run" && pyodide && !running) {
    running = true;
    const id = String(message.id);
    const started = performance.now();
    const result = await runPython(pyodide, String(message.code), {
      stdin: typeof message.stdin === "string" ? message.stdin : "",
      onOutput: (stream, text) =>
        self.postMessage({ type: "output", id, stream, text }),
    });
    running = false;
    self.postMessage({
      type: "done",
      id,
      status: result.status,
      error: result.error,
      durationMs: Math.round(performance.now() - started),
    });
  }
};
