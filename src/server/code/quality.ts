import "server-only";
import { QUALITY_DIMENSIONS, type Finding } from "@/shared/api/code";

/**
 * Deterministic code-quality indicators (BLOCK 35), kind `code_quality`,
 * always separate from the learning-understanding score.
 *
 * Each dimension starts at 100 and loses a fixed penalty per finding in its
 * categories: info 0, low 5, medium 15, high 30, critical 50 (floor 0).
 * There is deliberately no single overall grade.
 */
export const QUALITY_VERSION = "quality-v1";

const PENALTY: Record<Finding["severity"], number> = {
  info: 0,
  low: 5,
  medium: 15,
  high: 30,
  critical: 50,
};

const DIMENSION_OF: Record<
  Finding["category"],
  (typeof QUALITY_DIMENSIONS)[number]
> = {
  correctness: "correctness",
  syntax: "correctness",
  types: "correctness",
  edge_cases: "correctness",
  error_handling: "correctness",
  readability: "readability",
  naming: "readability",
  duplication: "maintainability",
  complexity: "maintainability",
  maintainability: "maintainability",
  performance: "performance",
  security: "security",
};

export function qualityIndicators(findings: readonly Finding[]) {
  const toolConfirmed = findings.some(
    (f) => f.verification === "confirmed_diagnostic",
  );
  return {
    kind: "code_quality" as const,
    version: QUALITY_VERSION,
    basis: toolConfirmed
      ? "Dihitung dari temuan alat dan saran AI."
      : "Dihitung dari saran AI saja; belum diperiksa oleh alat. Ini indikator, bukan nilai.",
    dimensions: QUALITY_DIMENSIONS.map((dimension) => {
      const relevant = findings.filter(
        (f) => DIMENSION_OF[f.category] === dimension,
      );
      const penalty = relevant.reduce((sum, f) => sum + PENALTY[f.severity], 0);
      return {
        dimension,
        score: Math.max(0, 100 - penalty),
        findings: relevant.length,
      };
    }),
  };
}
