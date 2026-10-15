# ADR-006 — Universal Code Intake and Capability-Declared Tools

- Status: baseline accepted.
- Date: 2026-10-12.

## Context
The product aspiration is broad support for all programming languages, libraries and frameworks. No finite installation can guarantee compiler/runtime and version-specific analysis for every ecosystem combination.

## Decision
Allow arbitrary code text and a custom language label for generic AI review. Add real tool support through a registry of independent editor/parser/linter/type-checker/compiler/runtime/test/framework capabilities. State support based on tested reality and include tool/version limitations. Never treat missing tooling as a successful validation.

## Consequences
Input coverage can be broad early; native verified support expands modularly. Users get generic suggestions when toolchains are absent, with explicit limitations.
