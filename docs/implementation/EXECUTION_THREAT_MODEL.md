# Code Execution: Threat Model and Enablement Gate (BLOCK 37–38)

**Decision (ADR-003): execution is DISABLED.**
- There is no isolated runner and no recorded isolation evidence.
- `POST /api/code/run` returns `422 UNSUPPORTED_TOOLCHAIN` and never executes anything.
- AI code review (`POST /api/code/review`) remains available.

## Assets to protect
Application secrets (AI key, database URL), the production database, other users' code and outputs, the host filesystem and network, service availability and cost.

## Threats (docs/11 "Unsafe code execution")
| Threat | Example | Required control |
|---|---|---|
| Secret theft | `print(os.environ)` | Runner has **no** app environment variables or credentials; separate account/project |
| Host or database access | Reading files, connecting to Postgres | Separate machine or microVM; no route to the app network; read-only base image; per-job ephemeral filesystem |
| Network abuse | Downloading malware, scanning, mining | Network **denied** by default (egress blocked) |
| Resource exhaustion | `while True: pass`, fork bombs, huge output | CPU and wall-clock kill outside the process, memory cgroup limit, process/PID limit, output cap, concurrency cap per user and global |
| Cross-job leakage | Reading another job's files | Fresh sandbox per job; no shared writable volumes; artefacts expire |
| Escape | Kernel exploit from the container | A strong isolation boundary (microVM such as Firecracker, or gVisor), patched images, no privileged mode |
| Supply chain | Malicious package from a manifest | No dependency installs (pinned allowlisted toolchains only) |
| Abuse at scale | Many free runs | Per-user/IP quotas, auth for execution, kill switch |

## Contract implemented (`src/server/code/execution.ts`)
- Job states: `queued → running → completed | failed | timed_out | cancelled`, plus `rejected`; terminal states are final.
- Default limits:
  - CPU 2 s, wall-clock 5 s;
  - memory 128 MB, output 64 KiB (UTF-8-safe truncation);
  - 5 files, 1 process;
  - **network false** (requests that enable it are rejected).
- Requests reject path traversal, absolute or hidden paths and oversize files.
- Results carry phase (compile/run), exit code, truncation flags, duration and the **adapter's** tool name and version (an adapter cannot misreport its tool).
- A timeout is its own state, never a program error.
- The service runs a language only if an adapter is registered **and** `IsolationEvidence` for that adapter is recorded. Both lists are empty.
- Verified by `tests/unit/execution.test.ts` (10 tests), which uses a clearly labelled **test double** that returns canned output and executes nothing.

## Evidence required before enabling (all must be recorded)
1. Written description of the isolation mechanism and its provider terms.
2. Tests run **against the isolated runner**, never against the app host:
   - known-good program;
   - syntax error and runtime error;
   - infinite loop (killed at the time limit);
   - fork bomb (process limit);
   - memory bomb (memory limit);
   - huge output (truncated);
   - network attempt (blocked);
   - read of environment variables (empty);
   - read of another job's files (impossible).
3. Adapter conformance suite passes (BLOCK 39); the registry entry is updated with the tested tool version (`ADAPTER_GUIDE.md`).
4. Quotas and kill switch configured; costs reviewed.

## BLOCK 38: reference runtime adapter
**Status: BLOCKED.** No isolated sandbox service is configured or verified, so no adapter was implemented. Testing payloads locally or on the app host is forbidden. To unblock:
- choose and provision a runner (for example a microVM- or gVisor-based managed sandbox) with its own credentials;
- record the decision in `docs/20`;
- then implement one Python adapter and run the evidence list above.

## Update 2026-10-14: in-browser Python runner (D-012)
Execution was enabled for **Python only, in the browser**: `public/runner/python-worker.mjs` (module worker) and `public/runner/python-core.mjs`, driven by `src/app/_lib/python-runner.ts`. The server-side contract above is unchanged and stays disabled.

| Threat | Control | Evidence (2026-10-14) |
|---|---|---|
| Endless loop / CPU exhaustion | Page terminates the worker after 5 s; next run loads a fresh worker | Browser: `while True: pass` stopped after 5.35 s with partial output kept; unit test with fake worker |
| Output flood | 20,000-character cap inside the stdout/stderr writer | Unit test (real Pyodide) and browser: `while True: print(...)` stopped in 55 ms |
| Network / exfiltration | Worker CSP (`default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'`); network globals deleted from scope and prototypes; `js`/`pyodide_js` detached | Browser (Chromium headless shell): `import js` → ModuleNotFoundError; in-worker `typeof fetch/XMLHttpRequest/WebSocket/importScripts/Worker/EventSource/indexedDB` all `undefined`, including `WorkerGlobalScope.prototype.fetch`; `import('https://example.com/…')` failed with Playwright `requestfailed: csp` and no response; zero requests to other origins during the run suite |
| Access to secrets / server | Code never leaves the browser for execution; the worker holds no cookies-bearing API access (`fetch`/XHR removed) | Same browser checks; `/api/code/run` still returns 422 (smoke test) |
| State leaking between runs | Fresh `globals` dict per run | Unit test: a variable from run 1 is undefined in run 2 |
| Memory exhaustion | Browser WebAssembly limits only; timeout as backstop | NOT VERIFIED beyond the timeout (accepted risk, D-012) |

Not verified: Firefox and Safari behaviour (only Chromium was tested); slow-network first load (about 12 MB).

## Update 2026-10-15: JavaScript, SQL and HTML/CSS in the browser (D-015)
| Runtime | Isolation | Evidence (2026-10-15, Chromium headless, local dev) |
|---|---|---|
| JavaScript (`public/runner-js/js-worker.mjs`) | Module worker; CSP `default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'none'`; network/code-loading globals removed before learner code; 5 s termination; 20,000-char output cap | `while (true) {}` stopped; `typeof fetch/XMLHttpRequest/WebSocket` = `undefined`; `import("https://example.com/x.js")` → Playwright `requestfailed: csp`, no response |
| SQL (`public/runner/sql-worker.js`) | Classic worker under the `/runner/` CSP; sql.js 1.14.2 self-hosted; fresh in-memory database per run; globals removed after load; output cap | SQL lesson example ran and printed the joined rows |
| HTML/CSS (sandboxed iframe) | `sandbox="allow-scripts"` (opaque origin: no cookies, no access to the app); CSP meta first in the document (`default-src 'none'`, inline style/script only, `img-src data:`); `tests/unit/runtimes.test.ts` checks the CSP precedes learner markup and CSS cannot close its style tag | Inline script handled a click inside the preview |

Residual risk: a link clicked inside the HTML preview can navigate that frame (sites that forbid framing will refuse). Not verified: Firefox/Safari.
