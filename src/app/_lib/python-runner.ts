import { z } from "zod";

/**
 * Page-side controller for the in-browser Python runner (D-012). Learner code
 * runs in a dedicated worker (public/runner/python-worker.mjs); this class
 * enforces the time limit by terminating the worker and validates every
 * message it sends back.
 */

export const RUNNER_LIMITS = {
  timeoutMs: 5_000,
  loadTimeoutMs: 90_000,
} as const;

const errorSchema = z.strictObject({
  type: z.string().max(100),
  message: z.string().max(2_000),
  line: z.number().int().nullable(),
  traceback: z.string().max(20_000),
});

const messageSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("ready"), version: z.string().max(40) }),
  z.strictObject({ type: z.literal("load_failed") }),
  z.strictObject({
    type: z.literal("output"),
    id: z.string(),
    stream: z.enum(["stdout", "stderr"]),
    text: z.string().max(25_000),
  }),
  z.strictObject({
    type: z.literal("done"),
    id: z.string(),
    status: z.enum(["ok", "error", "output_limit"]),
    error: errorSchema.nullable(),
    durationMs: z.number().int().min(0),
  }),
]);
type WorkerMessage = z.infer<typeof messageSchema>;

export type RunError = z.infer<typeof errorSchema>;
export type RunResult =
  | {
      status: "ok" | "output_limit";
      stdout: string;
      stderr: string;
      durationMs: number;
    }
  | {
      status: "error";
      stdout: string;
      stderr: string;
      error: RunError;
      durationMs: number;
    }
  | { status: "timeout"; stdout: string; stderr: string; durationMs: number }
  | { status: "unavailable" };

/** The subset of Worker this controller needs (lets tests use a fake). */
export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export function browserWorker(): WorkerLike {
  return new Worker("/runner/python-worker.mjs", {
    type: "module",
    name: "cogniflip-python",
  }) as unknown as WorkerLike;
}

export class PythonRunner {
  private worker: WorkerLike | null = null;
  private loading: Promise<string | null> | null = null;
  private listener: ((message: WorkerMessage) => void) | null = null;
  private busy = false;
  private counter = 0;
  /** Pyodide version once loaded. */
  version: string | null = null;

  constructor(
    private readonly create: () => WorkerLike = browserWorker,
    private readonly limits: {
      timeoutMs: number;
      loadTimeoutMs: number;
    } = RUNNER_LIMITS,
  ) {}

  /** Starts (or reuses) the worker; resolves to the Python version, or null. */
  load(): Promise<string | null> {
    if (this.loading) return this.loading;
    this.loading = new Promise((resolve) => {
      let worker: WorkerLike;
      try {
        worker = this.create();
      } catch {
        resolve(null);
        return;
      }
      this.worker = worker;
      const timer = setTimeout(() => finish(null), this.limits.loadTimeoutMs);
      const finish = (version: string | null) => {
        clearTimeout(timer);
        if (version === null) this.reset();
        this.version = version;
        resolve(version);
      };
      worker.onerror = () => finish(null);
      worker.onmessage = (event) => {
        const parsed = messageSchema.safeParse(event.data);
        if (!parsed.success) return;
        const message = parsed.data;
        if (message.type === "ready") finish(message.version);
        else if (message.type === "load_failed") finish(null);
        else this.listener?.(message);
      };
      worker.postMessage({ type: "init" });
    });
    const loading = this.loading;
    void loading.then((v) => {
      if (v === null && this.loading === loading) this.loading = null;
    });
    return loading;
  }

  async run(
    code: string,
    stdin = "",
    onOutput?: (stream: "stdout" | "stderr", text: string) => void,
  ): Promise<RunResult> {
    if (this.busy) throw new Error("runner busy");
    this.busy = true;
    try {
      const version = await this.load();
      if (!version || !this.worker) return { status: "unavailable" };
      const worker = this.worker;
      const id = String(++this.counter);
      let stdout = "";
      let stderr = "";
      const started = Date.now();

      return await new Promise<RunResult>((resolve) => {
        const timer = setTimeout(() => {
          // A worker cannot be interrupted safely mid-run: stop it entirely.
          this.listener = null;
          this.reset();
          resolve({
            status: "timeout",
            stdout,
            stderr,
            durationMs: Date.now() - started,
          });
        }, this.limits.timeoutMs);

        this.listener = (message) => {
          if (!("id" in message) || message.id !== id) return;
          if (message.type === "output") {
            if (message.stream === "stdout") stdout += message.text;
            else stderr += message.text;
            onOutput?.(message.stream, message.text);
            return;
          }
          if (message.type !== "done") return;
          clearTimeout(timer);
          this.listener = null;
          const base = { stdout, stderr, durationMs: message.durationMs };
          if (message.status === "error" && message.error)
            resolve({ status: "error", ...base, error: message.error });
          else if (message.status === "output_limit")
            resolve({ status: "output_limit", ...base });
          else resolve({ status: "ok", ...base });
        };
        worker.postMessage({ type: "run", id, code, stdin });
      });
    } finally {
      this.busy = false;
    }
  }

  /** Stops the worker; the next run loads a fresh one. */
  reset() {
    this.worker?.terminate();
    this.worker = null;
    this.loading = null;
    this.version = null;
  }
}
