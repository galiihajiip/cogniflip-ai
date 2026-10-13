import "server-only";

/**
 * Language/tool capability registry (BLOCK 36, ADR-006, docs/09 §3–4).
 *
 * Each capability is declared separately. A capability may be "available"
 * only if it names a registered adapter whose smoke test passed for the same
 * tool version; validateRegistry() enforces this, so the matrix can never
 * claim more than was actually tested.
 */
export const REGISTRY_VERSION = "capabilities-v1";

export const CAPABILITY_KINDS = [
  "editorHighlighting",
  "parser",
  "linter",
  "typeChecker",
  "compiler",
  "runtime",
  "testRunner",
  "dependencyManager",
] as const;
export type CapabilityKind = (typeof CAPABILITY_KINDS)[number];

export type Capability =
  | { status: "available"; adapterId: string; tool: string; version: string }
  | { status: "unavailable"; reason: string };

export type SupportLevel =
  | "AI_REVIEW_ONLY"
  | "STATIC_ANALYSIS"
  | "COMPILE_VERIFIED"
  | "RUNTIME_VERIFIED";

export interface LanguageEntry {
  id: string;
  label: string;
  aliases: string[];
  extensions: string[];
  capabilities: Record<CapabilityKind, Capability>;
  /** Versions with tested tooling; empty when nothing is tool-verified. */
  supportedVersions: string[];
  timeoutMs: number | null;
  limitations: string[];
}

/** A registered adapter with the evidence that it works (BLOCK 37–39). */
export interface AdapterRecord {
  id: string;
  kind: CapabilityKind;
  tool: string;
  version: string;
  /** Last passing conformance/smoke run; null = never passed. */
  smokeTest: { passedAt: string; toolVersion: string } | null;
}

/** No adapter has been built or tested yet (execution stays disabled, ADR-003). */
export const ADAPTERS: AdapterRecord[] = [];

const NO_ADAPTER = "Belum ada adapter yang teruji untuk bahasa ini.";
const NO_EDITOR = "Pewarnaan sintaks belum tersedia di Mini IDE.";

function aiOnly(
  id: string,
  label: string,
  aliases: string[],
  extensions: string[],
): LanguageEntry {
  const capabilities = Object.fromEntries(
    CAPABILITY_KINDS.map((k) => [
      k,
      {
        status: "unavailable",
        reason: k === "editorHighlighting" ? NO_EDITOR : NO_ADAPTER,
      },
    ]),
  ) as Record<CapabilityKind, Capability>;
  return {
    id,
    label,
    aliases,
    extensions,
    capabilities,
    supportedVersions: [],
    timeoutMs: null,
    limitations: [
      "Hanya saran AI: tidak ada parser, compiler, atau runtime yang dijalankan.",
      "Saran AI bisa salah dan belum diperiksa oleh alat.",
    ],
  };
}

export const LANGUAGES: LanguageEntry[] = [
  aiOnly("python", "Python", ["py", "python3"], [".py"]),
  aiOnly(
    "javascript",
    "JavaScript",
    ["js", "node", "nodejs"],
    [".js", ".mjs", ".cjs"],
  ),
  aiOnly("typescript", "TypeScript", ["ts"], [".ts", ".tsx"]),
  aiOnly("java", "Java", [], [".java"]),
  aiOnly("c", "C", [], [".c", ".h"]),
  aiOnly("cpp", "C++", ["c++", "cplusplus"], [".cpp", ".cc", ".hpp"]),
  aiOnly("csharp", "C#", ["c#", "cs"], [".cs"]),
  aiOnly("go", "Go", ["golang"], [".go"]),
  aiOnly("rust", "Rust", ["rs"], [".rs"]),
  aiOnly("php", "PHP", [], [".php"]),
  aiOnly("ruby", "Ruby", ["rb"], [".rb"]),
  aiOnly("kotlin", "Kotlin", ["kt"], [".kt"]),
  aiOnly("html", "HTML", [], [".html", ".htm"]),
  aiOnly("css", "CSS", [], [".css"]),
  aiOnly("sql", "SQL", [], [".sql"]),
  aiOnly("swift", "Swift", [], [".swift"]),
  aiOnly("dart", "Dart", ["flutter"], [".dart"]),
  aiOnly("scala", "Scala", [], [".scala"]),
  aiOnly("lua", "Lua", [], [".lua"]),
  aiOnly("r", "R", [], [".r"]),
  aiOnly("bash", "Bash", ["shell", "sh", "zsh"], [".sh"]),
  aiOnly("powershell", "PowerShell", ["ps1"], [".ps1"]),
  aiOnly("perl", "Perl", ["pl"], [".pl"]),
  aiOnly("haskell", "Haskell", ["hs"], [".hs"]),
  aiOnly("elixir", "Elixir", ["ex"], [".ex", ".exs"]),
  aiOnly("matlab", "MATLAB", ["octave"], [".m"]),
  aiOnly("julia", "Julia", ["jl"], [".jl"]),
  aiOnly("visual-basic", "Visual Basic", ["vb", "vbnet"], [".vb"]),
  aiOnly("assembly", "Assembly", ["asm"], [".asm", ".s"]),
  aiOnly("json", "JSON", [], [".json"]),
  aiOnly("yaml", "YAML", ["yml"], [".yaml", ".yml"]),
];

/** Any language not in the list: still reviewable by AI, with its own label. */
export function genericEntry(label: string): LanguageEntry {
  return { ...aiOnly("other", label, [], []), label };
}

export function resolveLanguage(input: string): LanguageEntry {
  const key = input.trim().toLowerCase();
  return (
    LANGUAGES.find(
      (l) =>
        l.id === key ||
        l.label.toLowerCase() === key ||
        l.aliases.includes(key) ||
        l.extensions.includes(key.startsWith(".") ? key : `.${key}`),
    ) ?? genericEntry(input.trim().slice(0, 40) || "Lainnya")
  );
}

export function supportLevel(entry: LanguageEntry): SupportLevel {
  const has = (k: CapabilityKind) =>
    entry.capabilities[k].status === "available";
  if (has("runtime")) return "RUNTIME_VERIFIED";
  if (has("compiler")) return "COMPILE_VERIFIED";
  if (has("parser") || has("linter") || has("typeChecker"))
    return "STATIC_ANALYSIS";
  return "AI_REVIEW_ONLY";
}

/** Problems for any capability claim not backed by a passing adapter. */
export function validateRegistry(
  languages: readonly LanguageEntry[] = LANGUAGES,
  adapters: readonly AdapterRecord[] = ADAPTERS,
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const lang of languages) {
    if (ids.has(lang.id)) problems.push(`duplicate language ${lang.id}`);
    ids.add(lang.id);
    for (const kind of CAPABILITY_KINDS) {
      const cap = lang.capabilities[kind];
      if (cap.status !== "available") continue;
      const adapter = adapters.find((a) => a.id === cap.adapterId);
      if (!adapter)
        problems.push(
          `${lang.id}.${kind}: adapter ${cap.adapterId} is not registered`,
        );
      else if (adapter.kind !== kind)
        problems.push(
          `${lang.id}.${kind}: adapter ${adapter.id} is a ${adapter.kind} adapter`,
        );
      else if (!adapter.smokeTest)
        problems.push(
          `${lang.id}.${kind}: adapter ${adapter.id} has no passing smoke test`,
        );
      else if (
        adapter.smokeTest.toolVersion !== cap.version ||
        adapter.version !== cap.version
      )
        problems.push(
          `${lang.id}.${kind}: claimed version ${cap.version} was not the tested version`,
        );
    }
    if (
      supportLevel(lang) === "AI_REVIEW_ONLY" &&
      lang.supportedVersions.length > 0
    )
      problems.push(
        `${lang.id}: lists tested versions but has no tool capability`,
      );
  }
  return problems;
}

/** Learner-facing matrix derived from the registry (never hand-written). */
export function capabilityMatrix() {
  return {
    registryVersion: REGISTRY_VERSION,
    languages: [...LANGUAGES, genericEntry("Bahasa lain")].map((l) => ({
      id: l.id,
      label: l.label,
      supportLevel: supportLevel(l),
      canAnalyzeWithAi: true,
      capabilities: Object.fromEntries(
        CAPABILITY_KINDS.map((k) => {
          const c = l.capabilities[k];
          return [
            k,
            c.status === "available"
              ? { available: true, tool: c.tool, version: c.version }
              : { available: false },
          ];
        }),
      ) as Record<
        CapabilityKind,
        { available: boolean; tool?: string; version?: string }
      >,
      limitations: l.limitations,
    })),
  };
}
