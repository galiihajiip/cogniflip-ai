import "server-only";
import { CODE_LIMITS, findingSchema, type Finding } from "@/shared/api/code";

/**
 * Checks findings against the code they describe (docs/09 §6):
 * - ranges must lie inside the submitted source;
 * - evidence must be text that actually occurs (inside the range, if any);
 * - tool findings must name the tool; AI findings cannot claim confirmation;
 * - ids are unique.
 * Unknown positions stay null; nothing is guessed or repaired.
 */
export function validateFindings(
  raw: unknown,
  source: string,
): { ok: true; findings: Finding[] } | { ok: false; problems: string[] } {
  if (!Array.isArray(raw))
    return { ok: false, problems: ["findings must be an array"] };
  if (raw.length > CODE_LIMITS.maxFindings)
    return {
      ok: false,
      problems: [`more than ${CODE_LIMITS.maxFindings} findings`],
    };

  const lines = source.split("\n");
  const problems: string[] = [];
  const findings: Finding[] = [];
  const ids = new Set<string>();
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

  raw.forEach((item, index) => {
    const parsed = findingSchema.safeParse(item);
    if (!parsed.success) {
      problems.push(
        `finding ${index}: schema ${parsed.error.issues.map((i) => i.path.join(".") || i.code).join(", ")}`,
      );
      return;
    }
    const f = parsed.data;
    const label = `finding ${f.id}`;
    if (ids.has(f.id)) problems.push(`${label}: duplicate id`);
    ids.add(f.id);

    if (f.range) {
      const { startLine, endLine, startColumn, endColumn } = f.range;
      if (endLine > lines.length)
        problems.push(`${label}: range beyond the last line`);
      else {
        if (
          startColumn !== undefined &&
          startColumn > lines[startLine - 1].length + 1
        )
          problems.push(`${label}: start column beyond the line`);
        if (
          endColumn !== undefined &&
          endColumn > lines[endLine - 1].length + 1
        )
          problems.push(`${label}: end column beyond the line`);
        if (
          startLine === endLine &&
          startColumn !== undefined &&
          endColumn !== undefined &&
          endColumn < startColumn
        )
          problems.push(`${label}: end column before start column`);
      }
    }

    if (f.evidence !== null) {
      const scope =
        f.range && f.range.endLine <= lines.length
          ? lines.slice(f.range.startLine - 1, f.range.endLine).join("\n")
          : source;
      if (!normalize(scope).includes(normalize(f.evidence)))
        problems.push(
          `${label}: evidence not found in the ${f.range ? "given range" : "source"}`,
        );
    }

    if (f.provenance === "ai") {
      if (f.verification !== "potential_issue")
        problems.push(`${label}: AI finding claims tool confirmation`);
      if (f.tool !== null) problems.push(`${label}: AI finding names a tool`);
      if (f.confidence === null)
        problems.push(`${label}: AI finding needs a confidence`);
    } else {
      if (f.tool === null)
        problems.push(`${label}: tool finding without tool name/version`);
      if (f.verification !== "confirmed_diagnostic")
        problems.push(`${label}: tool finding must be confirmed_diagnostic`);
    }
    findings.push(f);
  });

  return problems.length > 0 ? { ok: false, problems } : { ok: true, findings };
}
