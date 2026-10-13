import { describe, expect, it } from "vitest";
import {
  ADAPTERS,
  LANGUAGES,
  capabilityMatrix,
  resolveLanguage,
  supportLevel,
  validateRegistry,
  type AdapterRecord,
  type LanguageEntry,
} from "@/server/code/capabilities";
import { GET } from "@/app/api/code/capabilities/route";
import { capabilityMatrixResponseSchema } from "@/shared/api/code";

const python = LANGUAGES.find((l) => l.id === "python")!;
const claiming = (
  overrides: Partial<LanguageEntry["capabilities"]>,
): LanguageEntry => ({
  ...python,
  capabilities: { ...python.capabilities, ...overrides },
});
const adapter = (overrides: Partial<AdapterRecord> = {}): AdapterRecord => ({
  id: "py-runtime",
  kind: "runtime",
  tool: "cpython",
  version: "3.12.4",
  smokeTest: { passedAt: "2026-10-13T00:00:00Z", toolVersion: "3.12.4" },
  ...overrides,
});
const runtimeClaim = {
  runtime: {
    status: "available" as const,
    adapterId: "py-runtime",
    tool: "cpython",
    version: "3.12.4",
  },
};

describe("capability registry", () => {
  it("is consistent today: no adapter exists, so every language is AI review only", () => {
    expect(ADAPTERS).toEqual([]);
    expect(validateRegistry()).toEqual([]);
    expect(LANGUAGES.every((l) => supportLevel(l) === "AI_REVIEW_ONLY")).toBe(
      true,
    );
  });

  it("rejects false capability claims", () => {
    expect(validateRegistry([claiming(runtimeClaim)], [])).toEqual([
      "python.runtime: adapter py-runtime is not registered",
    ]);
    expect(
      validateRegistry(
        [claiming(runtimeClaim)],
        [adapter({ smokeTest: null })],
      ),
    ).toEqual(["python.runtime: adapter py-runtime has no passing smoke test"]);
    expect(
      validateRegistry([claiming(runtimeClaim)], [adapter({ kind: "parser" })]),
    ).toEqual(["python.runtime: adapter py-runtime is a parser adapter"]);
    expect(
      validateRegistry(
        [claiming(runtimeClaim)],
        [adapter({ smokeTest: { passedAt: "x", toolVersion: "3.11.0" } })],
      ),
    ).toEqual([
      "python.runtime: claimed version 3.12.4 was not the tested version",
    ]);
  });

  it("accepts a claim backed by a passing adapter and derives the support level", () => {
    const entry = claiming(runtimeClaim);
    expect(validateRegistry([entry], [adapter()])).toEqual([]);
    expect(supportLevel(entry)).toBe("RUNTIME_VERIFIED");
  });

  it("resolves aliases, extensions and unknown languages", () => {
    expect(resolveLanguage("PY").id).toBe("python");
    expect(resolveLanguage(".ts").id).toBe("typescript");
    expect(resolveLanguage("golang").id).toBe("go");
    const unknown = resolveLanguage("Scratch");
    expect(unknown).toMatchObject({ id: "other", label: "Scratch" });
    expect(supportLevel(unknown)).toBe("AI_REVIEW_ONLY");
  });
});

describe("GET /api/code/capabilities", () => {
  it("publishes a derived matrix that never overstates capability", async () => {
    const body = capabilityMatrixResponseSchema.parse(
      await (await GET(new Request("http://t/"))).json(),
    );
    expect(body.languages.length).toBe(LANGUAGES.length + 1);
    for (const lang of body.languages) {
      expect(lang.supportLevel).toBe("AI_REVIEW_ONLY");
      expect(Object.values(lang.capabilities).every((c) => !c.available)).toBe(
        true,
      );
      expect(lang.limitations.join(" ")).toMatch(/Hanya saran AI/);
    }
    expect(body).toMatchObject({
      registryVersion: capabilityMatrix().registryVersion,
    });
  });
});
