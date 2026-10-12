# Mini IDE, Universal Language Support, and Code Execution

## 1. Product promise

CogniFlip aims to accept code input from any language and provide useful analysis. It must not promise native compiler/runtime or version-specific library/framework verification for every ecosystem combination in existence. Broad input acceptance and tool-backed capability are separate concepts.

## 2. Mini IDE UX
- Browser editor with syntax highlighting where available, line numbers, undo/redo, indentation, shortcuts, language status and starter snippets.
- Lazy-load the editor; verify accessibility, browser support, mobile behavior and bundle impact.
- Quick single-file mode and multi-file project mode.
- Let the user explain intended behavior; many bugs cannot be judged reliably without context.
- Beginner and detailed result views.
- Never silently overwrite code; show patches as reviewable diffs.

## 3. Capability registry
Every language/toolchain record identifies:
- Canonical ID, aliases and file extensions.
- Editor syntax mode availability.
- Parser/analyzer and versions.
- Formatter/linter/type checker.
- Compiler/runtime and version range.
- Test runner/package manager adapters.
- Framework integrations if implemented.
- Files/project constraints, enabled checks, resource profile, known limitations, and whether the current deployment has tested the capability.

Capabilities can include `generic_ai_review`, `editor_syntax`, `parser_available`, `static_analysis_available`, `compile_available`, `runtime_available`, `test_runner_available`, `framework_context_available`, `temporarily_unavailable`, and `unsupported`.

## 4. Language support levels

### Level A — universal text intake
Any code may be pasted as text within limits. User may enter a custom language label. Generic AI review may offer conceptual feedback while stating that native syntax/runtime validation is unavailable.

### Level B — editor language support
Syntax highlighting/editor features. Highlighting does not prove that code is valid.

### Level C — parser/static tool support
An actual parser, linter, formatter, type checker or scanner runs in an appropriate environment. Record tool/version/exit status.

### Level D — compiler/runtime/test support
Actual compiler/interpreter/tests run in an isolated environment. Record runtime version, sanitized output, exit code, time/resource status and command profile.

### Level E — framework/library project support
Use manifests and versions to resolve context. Analysis remains partial if dependencies cannot be safely resolved or tools are absent. Do not infer API correctness from package name alone.

## 5. Review categories
Syntax/parser; types/build/compile; runtime errors; tests; logic/edge cases; readability/naming/formatting; complexity/cohesion/duplication/coupling; robustness/error handling; evidenced performance concerns; security concerns; version-aware framework/library/API usage.

Do not collapse all categories into one opaque score. Keep code-quality ratings separate from learner-understanding scores.

## 6. Finding contract
Every finding includes a stable ID, category, severity (`info`, `low`, `medium`, `high`, `critical`), title, plain explanation, validated location when known, evidence/provenance, tool/version when applicable, limitations/confidence, hint, optional patch/diff, and verification state. AI-only findings are labeled “AI suggestion”. Source location must be checked against submitted source before display.

## 7. Code execution security
All execution is external to the web app process. Enforce per-job isolation; CPU/memory/time/output/file/process/concurrency limits; no ambient secrets/production DB/host filesystem; network denied by default; cancellation and termination; safe output rendering; user/IP quotas; path/archive checks; artifact expiration; and a kill switch. Dependency installation is separate and controlled. If isolation/limits cannot be verified, disable execution and keep generic review available.

## 8. Library/framework context
Support context input and relevant manifests (for example `package.json`, lockfiles, `pyproject.toml`, `requirements.txt`, `pom.xml`, `build.gradle`, `Cargo.toml`, `go.mod`, or equivalents where useful). Never install dependencies automatically without documented policy, approval/consent where needed, isolation, and resource control. Registry must distinguish true version-aware adapter support from generic AI context.

## 9. Universal language ambition
No language is rejected only because it is absent from a predefined dropdown; allow custom language labels and generic review. Add tested compiler/tool support through modular adapters. The honest promise is broad intake and extensible verification, not perfect validation for every possible language, framework, library and version.
