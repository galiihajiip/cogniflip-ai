# ADR-003 — Isolated Code Execution

- Status: safety constraint accepted; provider selection pending.
- Date: 2026-10-12.

## Context
Code review aims to provide tool-verified compiler/runtime results, but user-submitted code is untrusted and can be malicious or resource-intensive.

## Decision
Never execute arbitrary user code in the primary web application process. Integrate a separate isolated runner through an adapter. Enforce time, memory, output, file, process, concurrency, network and access limits. Store capability/toolchain/version and execution provenance.

## Consequences
Language coverage can expand gradually. Some ecosystems remain generic-AI-only until native tooling is supported. If isolation cannot be verified, execution stays disabled and generic review remains available.

## Provider acceptance criteria
Document isolation model, runtimes/images, resource limits, network policy, secret separation, cancellation, retention, rate limits, price/quotas and test evidence. Do not pick a runner merely because its API is convenient.

## Update 2026-10-14 (D-012)
Python now runs **in the learner's browser**, not on the server: Pyodide 0.29.5 in a dedicated Web Worker with its own CSP, network globals removed, the JavaScript bridge detached, a 5 s termination timeout and an output cap. This satisfies "never in the primary web application process": the server receives no code to run, and `/api/code/run` stays disabled. Evidence: `tests/unit/python-core.test.ts` (real Pyodide), `tests/unit/python-runner.test.ts` (timeout and message validation), and the browser check recorded in `docs/implementation/EXECUTION_THREAT_MODEL.md`. Other languages remain AI-review only.
