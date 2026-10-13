import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LIMITS,
  ExecutionService,
  JOB_STATES,
  canTransition,
  truncateUtf8,
  validateRequest,
  type ExecutionAdapter,
} from "@/server/code/execution";
import { AppError } from "@/server/http/errors";
import { POST } from "@/app/api/code/run/route";

const req = (files = [{ path: "main.py", content: "print(1)" }]) => ({
  language: "python",
  files,
  limits: DEFAULT_LIMITS,
});

/** Test double: returns canned output; it never executes anything. */
const fakeAdapter = (stdout: string): ExecutionAdapter => ({
  id: "fake-python",
  language: "python",
  tool: { name: "fake", version: "0" },
  phases: ["run"],
  run: async () => ({
    state: "completed",
    phase: "run",
    exitCode: 0,
    stdout,
    stderr: "",
    stdoutTruncated: false,
    stderrTruncated: false,
    durationMs: 1,
    tool: { name: "ignored", version: "ignored" },
  }),
});

async function code(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return (e as AppError).code;
  }
  throw new Error("expected error");
}

describe("job lifecycle", () => {
  it("allows only forward transitions to a terminal state", () => {
    expect(canTransition("queued", "running")).toBe(true);
    expect(canTransition("running", "timed_out")).toBe(true);
    expect(canTransition("completed", "running")).toBe(false);
    expect(canTransition("queued", "completed")).toBe(false);
    for (const terminal of [
      "completed",
      "failed",
      "timed_out",
      "cancelled",
      "rejected",
    ] as const)
      for (const to of JOB_STATES)
        expect(canTransition(terminal, to)).toBe(false);
  });
});

describe("truncateUtf8", () => {
  it("keeps short output and cuts long output without splitting characters", () => {
    expect(truncateUtf8("halo", 10)).toEqual({
      text: "halo",
      truncated: false,
    });
    const r = truncateUtf8("aé".repeat(10), 4); // é is 2 bytes
    expect(r.truncated).toBe(true);
    expect(new TextEncoder().encode(r.text).byteLength).toBeLessThanOrEqual(4);
    expect(r.text).toBe("aéa");
  });
});

describe("validateRequest", () => {
  it.each([["../etc/passwd"], ["/abs"], [".env"], ["a/b"]])(
    "rejects path %s",
    (path) => {
      expect(validateRequest(req([{ path, content: "x" }])).join()).toMatch(
        /invalid path/,
      );
    },
  );
  it("rejects enabled network, too many files and oversize files", () => {
    expect(
      validateRequest({
        ...req(),
        limits: { ...DEFAULT_LIMITS, network: true as never },
      }),
    ).toContain("network must be disabled");
    expect(
      validateRequest(
        req(
          Array.from({ length: 6 }, (_, i) => ({
            path: `f${i}`,
            content: "x",
          })),
        ),
      ),
    ).toContain("too many files");
    expect(
      validateRequest(req([{ path: "big", content: "x".repeat(21 * 1024) }])),
    ).toContain("file too large");
  });
});

describe("ExecutionService", () => {
  const signal = new AbortController().signal;

  it("refuses to run without an adapter or without verified isolation", async () => {
    expect(await code(new ExecutionService().run(req(), signal))).toBe(
      "UNSUPPORTED_TOOLCHAIN",
    );
    const noEvidence = new ExecutionService([fakeAdapter("x")], []);
    expect(noEvidence.unavailableReason("python")).toBe(
      "isolation_not_verified",
    );
    expect(await code(noEvidence.run(req(), signal))).toBe(
      "UNSUPPORTED_TOOLCHAIN",
    );
  });

  it("with an adapter and recorded evidence, enforces truncation and real tool provenance", async () => {
    const service = new ExecutionService(
      [fakeAdapter("x".repeat(70 * 1024))],
      [{ adapterId: "fake-python", verifiedAt: "t", checks: ["test"] }],
    );
    const result = await service.run(req(), signal);
    expect(result.stdoutTruncated).toBe(true);
    expect(result.stdout.length).toBe(DEFAULT_LIMITS.outputBytes);
    expect(result.tool).toEqual({ name: "fake", version: "0" });
    expect(
      await code(service.run(req([{ path: "../x", content: "1" }]), signal)),
    ).toBe("EXECUTION_REJECTED");
  });
});

describe("POST /api/code/run", () => {
  it("never executes code today and says so (422 UNSUPPORTED_TOOLCHAIN)", async () => {
    for (const level of ["info", "warn", "error"] as const)
      vi.spyOn(console, level).mockImplementation(() => {});
    const res = await POST(
      new Request("http://localhost:3000/api/code/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: "python",
          code: "import os; print(os.environ)",
        }),
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("UNSUPPORTED_TOOLCHAIN");
    expect(body.error.message).toMatch(/saran AI/);
    vi.restoreAllMocks();
  });
});
