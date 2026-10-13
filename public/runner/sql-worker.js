// Classic worker that runs learner SQL in an in-memory SQLite database
// (sql.js 1.14.2, MIT; D-015). Served with the /runner/ CSP: scripts and
// data only from this site. Each run uses a fresh, empty database.
/* global initSqlJs */
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
let SQL = null;
let version = "SQLite";

function lockDown(scope) {
  for (const name of BLOCKED) {
    let target = scope;
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
      Object.defineProperty(scope, name, {
        value: undefined,
        writable: false,
        configurable: false,
      });
    } catch {
      /* already fixed */
    }
  }
}

function cell(value) {
  if (value === null) return "NULL";
  if (value instanceof Uint8Array) return "[blob]";
  return String(value);
}

self.onmessage = async (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;
  if (message.type === "init") {
    try {
      importScripts("/sqljs/sql-wasm.js");
      SQL = await initSqlJs({ locateFile: (file) => "/sqljs/" + file });
      const probe = new SQL.Database();
      version =
        "SQLite " + probe.exec("select sqlite_version()")[0].values[0][0];
      probe.close();
      lockDown(self);
      self.postMessage({ type: "ready", version });
    } catch {
      self.postMessage({ type: "load_failed" });
    }
    return;
  }
  if (message.type !== "run" || !SQL) return;
  const id = String(message.id);
  const started = performance.now();
  let used = 0;
  let status = "ok";
  let error = null;
  const emit = (text) => {
    if (status === "output_limit") return;
    if (used + text.length > MAX_OUTPUT) {
      status = "output_limit";
      return;
    }
    used += text.length;
    self.postMessage({ type: "output", id, stream: "stdout", text });
  };
  const db = new SQL.Database();
  try {
    const results = db.exec(String(message.code));
    if (results.length === 0)
      emit("(Perintah berhasil. Tidak ada baris hasil.)\n");
    results.forEach((result, index) => {
      if (index > 0) emit("\n");
      emit(result.columns.join(" | ") + "\n");
      for (const row of result.values) emit(row.map(cell).join(" | ") + "\n");
    });
  } catch (err) {
    const text = String((err && err.message) || err);
    status = "error";
    error = {
      type: "SQL error",
      message: text.slice(0, 500),
      line: null,
      traceback: text.slice(0, 2000),
    };
  } finally {
    db.close();
  }
  self.postMessage({
    type: "done",
    id,
    status,
    error,
    durationMs: Math.round(performance.now() - started),
  });
};
