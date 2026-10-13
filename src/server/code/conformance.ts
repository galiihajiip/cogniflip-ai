import "server-only";
import {
  DEFAULT_LIMITS,
  type ExecutionAdapter,
  type ExecutionLimits,
  type ExecutionResult,
} from "@/server/code/execution";

/**
 * Adapter conformance suite (BLOCK 39). Every adapter must pass all checks
 * against the isolated runner before the capability registry may mark it
 * available (ADAPTER_GUIDE.md). Programs are supplied per language.
 */
export interface ConformancePrograms {
  hello: { code: string; stdout: string };
  syntaxError: string;
  runtimeError: string;
  infiniteLoop: string;
  outputFlood: string;
  /** Prints the value of the environment variable CANARY_SECRET, if any. */
  readEnv: string;
}

export interface CheckResult {
  check: string;
  pass: boolean;
  detail: string;
}

export interface ConformanceReport {
  adapterId: string;
  tool: { name: string; version: string };
  passed: boolean;
  checks: CheckResult[];
}

const LIMITS: ExecutionLimits = {
  ...DEFAULT_LIMITS,
  wallMs: 3_000,
  outputBytes: 4_096,
};
const CANARY = "conformance-canary-7f3a";

async function run(
  adapter: ExecutionAdapter,
  code: string,
  signal?: AbortSignal,
) {
  return adapter.run(
    {
      language: adapter.language,
      files: [{ path: "main", content: code }],
      limits: LIMITS,
    },
    signal ?? new AbortController().signal,
  );
}

export async function runConformance(
  adapter: ExecutionAdapter,
  programs: ConformancePrograms,
): Promise<ConformanceReport> {
  const checks: CheckResult[] = [];
  const check = (name: string, pass: boolean, detail: string) =>
    checks.push({ check: name, pass, detail });
  const safe = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      check(name, false, `threw: ${(error as Error).message}`);
    }
  };

  check(
    "declares capabilities and tool version",
    adapter.phases.length > 0 &&
      adapter.tool.name.length > 0 &&
      /\d/.test(adapter.tool.version),
    `${adapter.tool.name} ${adapter.tool.version}; phases ${adapter.phases.join(",")}`,
  );

  await safe("runs a known-good program", async () => {
    const r = await run(adapter, programs.hello.code);
    check(
      "runs a known-good program",
      r.state === "completed" &&
        r.exitCode === 0 &&
        r.stdout.trim() === programs.hello.stdout,
      `${r.state}/${r.exitCode}`,
    );
  });
  await safe("reports a syntax error as a failure, not success", async () => {
    const r = await run(adapter, programs.syntaxError);
    check(
      "reports a syntax error as a failure, not success",
      r.state === "failed" && r.exitCode !== 0,
      `${r.state}/${r.phase}`,
    );
  });
  await safe("reports a runtime error as a failure", async () => {
    const r = await run(adapter, programs.runtimeError);
    check(
      "reports a runtime error as a failure",
      r.state === "failed" && r.phase === "run",
      `${r.state}/${r.phase}`,
    );
  });
  await safe(
    "stops an infinite loop as timed_out within the limit",
    async () => {
      const started = Date.now();
      const r: ExecutionResult = await run(adapter, programs.infiniteLoop);
      const elapsed = Date.now() - started;
      check(
        "stops an infinite loop as timed_out within the limit",
        r.state === "timed_out" && elapsed < LIMITS.wallMs + 2_000,
        `${r.state} after ${elapsed} ms`,
      );
    },
  );
  await safe("caps output", async () => {
    const r = await run(adapter, programs.outputFlood);
    check(
      "caps output",
      r.stdoutTruncated &&
        new TextEncoder().encode(r.stdout).byteLength <= LIMITS.outputBytes,
      `truncated=${r.stdoutTruncated}`,
    );
  });
  await safe("honours cancellation", async () => {
    const controller = new AbortController();
    const pending = run(adapter, programs.infiniteLoop, controller.signal);
    setTimeout(() => controller.abort(), 50);
    const r = await pending;
    check("honours cancellation", r.state === "cancelled", r.state);
  });
  await safe("does not expose host environment", async () => {
    process.env.CANARY_SECRET = CANARY;
    try {
      const r = await run(adapter, programs.readEnv);
      check(
        "does not expose host environment",
        !r.stdout.includes(CANARY) && !r.stderr.includes(CANARY),
        "canary not visible",
      );
    } finally {
      delete process.env.CANARY_SECRET;
    }
  });

  return {
    adapterId: adapter.id,
    tool: adapter.tool,
    passed: checks.every((c) => c.pass),
    checks,
  };
}
