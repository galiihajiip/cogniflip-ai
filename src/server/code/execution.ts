import "server-only";
import { AppError } from "@/server/http/errors";

/**
 * Isolated execution contract (BLOCK 37, ADR-003, EXECUTION_THREAT_MODEL.md).
 *
 * The web app never executes submitted code. An adapter talks to an external
 * isolated runner. Execution is enabled only when an adapter is registered
 * AND its isolation evidence is recorded as verified. Today neither is true,
 * so every request ends as "execution unavailable".
 */

export const JOB_STATES = [
  "queued",
  "running",
  "completed",
  "failed",
  "timed_out",
  "cancelled",
  "rejected",
] as const;
export type JobState = (typeof JOB_STATES)[number];

const TRANSITIONS: Record<JobState, JobState[]> = {
  queued: ["running", "cancelled", "rejected"],
  running: ["completed", "failed", "timed_out", "cancelled"],
  completed: [],
  failed: [],
  timed_out: [],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: JobState, to: JobState): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Limits enforced by the runner outside the submitted process. */
export interface ExecutionLimits {
  cpuMs: number;
  wallMs: number;
  memoryMb: number;
  outputBytes: number;
  maxFiles: number;
  maxProcesses: number;
  /** Always false: network access is denied by default. */
  network: false;
}

export const DEFAULT_LIMITS: ExecutionLimits = {
  cpuMs: 2_000,
  wallMs: 5_000,
  memoryMb: 128,
  outputBytes: 64 * 1024,
  maxFiles: 5,
  maxProcesses: 1,
  network: false,
};

export interface ExecutionRequest {
  language: string;
  files: Array<{ path: string; content: string }>;
  stdin?: string;
  limits: ExecutionLimits;
}

/** Provenance-carrying result. A timeout is not a program error. */
export interface ExecutionResult {
  state: Extract<
    JobState,
    "completed" | "failed" | "timed_out" | "cancelled" | "rejected"
  >;
  phase: "compile" | "run";
  exitCode: number | null;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  durationMs: number;
  tool: { name: string; version: string };
}

export interface ExecutionAdapter {
  id: string;
  language: string;
  tool: { name: string; version: string };
  phases: Array<"compile" | "run">;
  run(request: ExecutionRequest, signal: AbortSignal): Promise<ExecutionResult>;
}

/** Recorded evidence that an adapter's isolation was verified (see threat model). */
export interface IsolationEvidence {
  adapterId: string;
  verifiedAt: string;
  checks: string[];
}

/** Truncates to at most `maxBytes` of UTF-8 without splitting a character. */
export function truncateUtf8(
  text: string,
  maxBytes: number,
): { text: string; truncated: boolean } {
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength <= maxBytes) return { text, truncated: false };
  let end = maxBytes;
  // Step back over UTF-8 continuation bytes (10xxxxxx).
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--;
  return {
    text: new TextDecoder().decode(bytes.slice(0, end)),
    truncated: true,
  };
}

const MAX_PATH = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$/;

/** Rejects path traversal, absolute paths, hidden files and oversize input. */
export function validateRequest(request: ExecutionRequest): string[] {
  const problems: string[] = [];
  if (request.files.length === 0) problems.push("no files");
  if (request.files.length > request.limits.maxFiles)
    problems.push("too many files");
  for (const f of request.files) {
    if (!MAX_PATH.test(f.path) || f.path.includes(".."))
      problems.push(`invalid path ${JSON.stringify(f.path).slice(0, 40)}`);
    if (new TextEncoder().encode(f.content).byteLength > 20 * 1024)
      problems.push("file too large");
  }
  if (request.limits.network !== false)
    problems.push("network must be disabled");
  return problems;
}

export class ExecutionService {
  constructor(
    private readonly adapters: readonly ExecutionAdapter[] = [],
    private readonly isolation: readonly IsolationEvidence[] = [],
  ) {}

  /** Why execution is unavailable for this language, or null if it is enabled. */
  unavailableReason(language: string): string | null {
    const adapter = this.adapters.find((a) => a.language === language);
    if (!adapter) return "no_adapter";
    if (!this.isolation.some((e) => e.adapterId === adapter.id))
      return "isolation_not_verified";
    return null;
  }

  async run(
    request: ExecutionRequest,
    signal: AbortSignal,
  ): Promise<ExecutionResult> {
    const reason = this.unavailableReason(request.language);
    if (reason)
      throw new AppError(
        "UNSUPPORTED_TOOLCHAIN",
        `execution unavailable: ${reason}`,
        {
          details: { field: reason },
        },
      );
    const problems = validateRequest(request);
    if (problems.length > 0)
      throw new AppError(
        "EXECUTION_REJECTED",
        `rejected: ${problems.join("; ")}`,
      );
    const adapter = this.adapters.find((a) => a.language === request.language)!;
    const result = await adapter.run(request, signal);
    const stdout = truncateUtf8(result.stdout, request.limits.outputBytes);
    const stderr = truncateUtf8(result.stderr, request.limits.outputBytes);
    return {
      ...result,
      stdout: stdout.text,
      stderr: stderr.text,
      stdoutTruncated: result.stdoutTruncated || stdout.truncated,
      stderrTruncated: result.stderrTruncated || stderr.truncated,
      tool: adapter.tool,
    };
  }
}

/** The app's execution service: no adapters, no verified isolation (ADR-003). */
export const executionService = new ExecutionService([], []);
