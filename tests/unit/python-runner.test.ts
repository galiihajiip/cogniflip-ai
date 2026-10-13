import { afterEach, describe, expect, it, vi } from "vitest";
import { PythonRunner, type WorkerLike } from "@/app/_lib/python-runner";

/** Fake worker driven by a script of replies. */
class FakeWorker implements WorkerLike {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  constructor(
    private readonly reply: (
      msg: Record<string, unknown>,
      w: FakeWorker,
    ) => void,
  ) {}
  postMessage(message: unknown) {
    queueMicrotask(() => this.reply(message as Record<string, unknown>, this));
  }
  send(data: unknown) {
    this.onmessage?.({ data });
  }
  terminate() {
    this.terminated = true;
  }
}

const limits = { timeoutMs: 50, loadTimeoutMs: 1000 };

describe("PythonRunner", () => {
  afterEach(() => vi.useRealTimers());

  it("collects streamed output and the final status", async () => {
    const runner = new PythonRunner(
      () =>
        new FakeWorker((m, w) => {
          if (m.type === "init") w.send({ type: "ready", version: "0.29.5" });
          if (m.type === "run") {
            w.send({
              type: "output",
              id: m.id,
              stream: "stdout",
              text: "Halo\n",
            });
            w.send({
              type: "done",
              id: m.id,
              status: "ok",
              error: null,
              durationMs: 3,
            });
          }
        }),
      limits,
    );
    const seen: string[] = [];
    const r = await runner.run('print("Halo")', "", (_s, t) => seen.push(t));
    expect(r).toEqual({
      status: "ok",
      stdout: "Halo\n",
      stderr: "",
      durationMs: 3,
    });
    expect(seen).toEqual(["Halo\n"]);
    expect(runner.version).toBe("0.29.5");
  });

  it("terminates a run that exceeds the time limit and keeps partial output", async () => {
    const workers: FakeWorker[] = [];
    const runner = new PythonRunner(() => {
      const w = new FakeWorker((m, self) => {
        if (m.type === "init") self.send({ type: "ready", version: "0.29.5" });
        if (m.type === "run")
          self.send({
            type: "output",
            id: m.id,
            stream: "stdout",
            text: "Lompat ke-1\n",
          });
        // never sends "done": an endless loop
      });
      workers.push(w);
      return w;
    }, limits);
    const r = await runner.run("while True: pass");
    expect(r.status).toBe("timeout");
    if (r.status === "timeout") expect(r.stdout).toBe("Lompat ke-1\n");
    expect(workers[0]!.terminated).toBe(true);
    // The next run starts a fresh worker.
    void runner.run("print(1)");
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(workers).toHaveLength(2);
  });

  it("reports unavailable when Python cannot load", async () => {
    const runner = new PythonRunner(
      () =>
        new FakeWorker(
          (m, w) => m.type === "init" && w.send({ type: "load_failed" }),
        ),
      limits,
    );
    expect(await runner.run("print(1)")).toEqual({ status: "unavailable" });
  });

  it("ignores messages that do not match the contract", async () => {
    const runner = new PythonRunner(
      () =>
        new FakeWorker((m, w) => {
          if (m.type === "init") {
            w.send({ type: "ready", version: 7 }); // invalid
            w.send({ type: "ready", version: "0.29.5" });
          }
          if (m.type === "run") {
            w.send({
              type: "done",
              id: m.id,
              status: "hacked",
              error: null,
              durationMs: 1,
            });
            w.send({
              type: "output",
              id: "other-run",
              stream: "stdout",
              text: "bukan milikku",
            });
            w.send({
              type: "done",
              id: m.id,
              status: "ok",
              error: null,
              durationMs: 1,
            });
          }
        }),
      limits,
    );
    const r = await runner.run("pass");
    expect(r).toEqual({ status: "ok", stdout: "", stderr: "", durationMs: 1 });
  });
});
