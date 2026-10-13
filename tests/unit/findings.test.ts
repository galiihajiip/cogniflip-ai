import { describe, expect, it } from "vitest";
import { validateFindings } from "@/server/code/findings";
import { SUGGESTION_CATEGORIES, type Finding } from "@/shared/api/code";

const source = [
  "def luas(p, l):",
  "    return p * l",
  "",
  "print(luas(3, 4))",
].join("\n");

const ai = (overrides: Partial<Finding> = {}): Finding => ({
  id: "f1",
  category: "edge_cases",
  severity: "low",
  title: "Tidak ada cek angka negatif",
  explanation: "Panjang negatif akan menghasilkan luas negatif.",
  evidence: "return p * l",
  range: { startLine: 2, startColumn: 5, endLine: 2, endColumn: 17 },
  provenance: "ai",
  tool: null,
  confidence: "medium",
  remediation: "Periksa apakah p dan l lebih dari nol.",
  verification: "potential_issue",
  ...overrides,
});

const problems = (raw: unknown) => {
  const r = validateFindings(raw, source);
  if (r.ok) throw new Error("expected problems");
  return r.problems;
};

describe("validateFindings", () => {
  it("accepts a well-formed AI suggestion and a tool diagnostic", () => {
    const tool = ai({
      id: "f2",
      category: "syntax",
      severity: "high",
      provenance: "parser",
      tool: { name: "python-ast", version: "3.12.4" },
      confidence: null,
      verification: "confirmed_diagnostic",
    });
    expect(validateFindings([ai(), tool], source)).toMatchObject({ ok: true });
  });

  it("keeps unknown positions unknown", () => {
    const r = validateFindings([ai({ range: null })], source);
    expect(r.ok && r.findings[0].range).toBeNull();
  });

  it.each([
    [
      "a line beyond the source",
      { range: { startLine: 9, endLine: 9 } },
      "range beyond the last line",
    ],
    [
      "a column beyond the line",
      { range: { startLine: 2, startColumn: 99, endLine: 2 } },
      "start column beyond the line",
    ],
    [
      "end before start",
      { range: { startLine: 2, startColumn: 9, endLine: 2, endColumn: 3 } },
      "end column before start column",
    ],
    [
      "evidence not in the code",
      { evidence: "return p + l" },
      "evidence not found",
    ],
    [
      "evidence outside the given range",
      { evidence: "print(luas(3, 4))" },
      "evidence not found in the given range",
    ],
  ])("rejects %s", (_label, override, message) => {
    expect(problems([ai(override as Partial<Finding>)]).join(" ")).toContain(
      message,
    );
  });

  it("separates AI suggestions from confirmed tool diagnostics", () => {
    expect(
      problems([ai({ verification: "confirmed_diagnostic" })]).join(" "),
    ).toContain("AI finding claims tool confirmation");
    expect(
      problems([ai({ tool: { name: "pylint", version: "3" } })]).join(" "),
    ).toContain("AI finding names a tool");
    expect(problems([ai({ confidence: null })]).join(" ")).toContain(
      "needs a confidence",
    );
    expect(
      problems([ai({ provenance: "compiler", confidence: null })]).join(" "),
    ).toContain("tool finding without tool");
  });

  it("rejects schema violations, duplicates and too many findings", () => {
    expect(problems([ai({ category: "style" as never })]).join(" ")).toContain(
      "schema",
    );
    expect(problems([ai({ severity: "fatal" as never })]).join(" ")).toContain(
      "schema",
    );
    expect(problems([{ ...ai(), score: 90 }]).join(" ")).toContain("schema");
    expect(problems([ai(), ai()]).join(" ")).toContain("duplicate id");
    expect(
      problems(Array.from({ length: 21 }, (_, i) => ai({ id: `f${i}` }))),
    ).toEqual(["more than 20 findings"]);
    expect(problems("not an array")).toEqual(["findings must be an array"]);
  });

  it("treats security separately from style suggestions", () => {
    expect(SUGGESTION_CATEGORIES.has("security")).toBe(false);
    expect(SUGGESTION_CATEGORIES.has("naming")).toBe(true);
  });
});
