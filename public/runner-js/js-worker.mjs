// Dedicated module worker that runs learner JavaScript (D-015). Served with
// its own CSP (next.config.ts): 'unsafe-eval' so the code can run, and
// connect-src 'none' so it can never reach any server. Network and
// code-loading globals are removed before any learner code runs.
const BLOCKED = [
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
];
const MAX_OUTPUT = 20000;
const LIMIT = "COGNIFLIP_OUTPUT_LIMIT";
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

for (const name of BLOCKED) {
  let target = self;
  while (target) {
    if (Object.prototype.hasOwnProperty.call(target, name)) {
      try {
        delete target[name];
      } catch {
        /* shadowed below */
      }
    }
    target = Object.getPrototypeOf(target);
  }
  try {
    Object.defineProperty(self, name, {
      value: undefined,
      writable: false,
      configurable: false,
    });
  } catch {
    /* already fixed */
  }
}

function show(value, nested = false) {
  if (typeof value === "string") return nested ? `'${value}'` : value;
  if (Array.isArray(value))
    return `[ ${value.map((v) => show(v, true)).join(", ")} ]`;
  if (value && typeof value === "object") {
    try {
      const entries = Object.entries(value).map(
        ([k, v]) => `${k}: ${show(v, true)}`,
      );
      return `{ ${entries.join(", ")} }`;
    } catch {
      return String(value);
    }
  }
  return String(value);
}

self.onmessage = async (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;
  if (message.type === "init") {
    self.postMessage({ type: "ready", version: "JavaScript (browser)" });
    return;
  }
  if (message.type !== "run") return;
  const id = String(message.id);
  const started = performance.now();
  let used = 0;
  let truncated = false;
  const write = (stream, args) => {
    if (truncated) throw new Error(LIMIT);
    const text = args.map((a) => show(a)).join(" ") + "\n";
    if (used + text.length > MAX_OUTPUT) {
      truncated = true;
      throw new Error(LIMIT);
    }
    used += text.length;
    self.postMessage({ type: "output", id, stream, text });
  };
  const learnerConsole = {
    log: (...a) => write("stdout", a),
    info: (...a) => write("stdout", a),
    warn: (...a) => write("stderr", a),
    error: (...a) => write("stderr", a),
  };
  let status = "ok";
  let error = null;
  try {
    await new AsyncFunction("console", String(message.code))(learnerConsole);
  } catch (err) {
    if (truncated) status = "output_limit";
    else {
      status = "error";
      const name = (err && err.name) || "Error";
      const text = String((err && err.message) || err);
      const lines = [
        ...String((err && err.stack) || "").matchAll(/<anonymous>:(\d+):\d+/g),
      ];
      // The wrapper function adds two lines before the learner's code.
      const line = lines.length ? Math.max(1, Number(lines[0][1]) - 2) : null;
      error = {
        type: name.slice(0, 100),
        message: text.slice(0, 500),
        line,
        traceback: `${name}: ${text}`.slice(0, 2000),
      };
    }
  }
  self.postMessage({
    type: "done",
    id,
    status,
    error,
    durationMs: Math.round(performance.now() - started),
  });
};
