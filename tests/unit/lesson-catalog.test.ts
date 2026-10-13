import { describe, expect, it } from "vitest";
import {
  CatalogError,
  buildCatalog,
  computeLock,
  hashLesson,
  type CatalogInput,
} from "@/server/learning/catalog";
import { lessonVersionSchema } from "@/server/learning/lesson-schema";
import { makeLesson } from "../fixtures/lesson-factory";

const rubrics = [
  { rubricId: "contoh-urutan", version: 1 },
  { rubricId: "contoh-ulang", version: 1 },
];

function input(
  lessons: unknown[],
  extra: Partial<CatalogInput> = {},
): CatalogInput {
  return {
    lessons,
    paths: [],
    rubrics,
    lock: computeLock(
      lessons.filter((l) => lessonVersionSchema.safeParse(l).success),
    ),
    ...extra,
  };
}

function problems(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(CatalogError);
    return (error as CatalogError).problems;
  }
  throw new Error("expected CatalogError");
}

const second = makeLesson({
  id: "contoh-ulang",
  topic: "loops",
  title: "Contoh perulangan",
  prerequisites: ["contoh-urutan"],
  rubric: { rubricId: "contoh-ulang", version: 1 },
});

describe("lesson schema", () => {
  it("accepts a valid lesson", () => {
    expect(lessonVersionSchema.safeParse(makeLesson()).success).toBe(true);
  });

  it("rejects a lesson without an objective", () => {
    const { objective: _objective, ...withoutObjective } = makeLesson();
    expect(lessonVersionSchema.safeParse(withoutObjective).success).toBe(false);
  });

  it.each([
    ["an invalid id", { id: "Contoh Urutan" }],
    ["an unsupported locale", { locale: "en-US" }],
    ["difficulty out of range", { difficulty: 4 }],
    ["an inverted grade band", { gradeBand: { min: 6, max: 4 } }],
    ["a self prerequisite", { prerequisites: ["contoh-urutan"] }],
    ["no hints", { hints: [] }],
    ["an unknown field", { secretAnswer: "x" }],
  ])("rejects %s", (_label, override) => {
    expect(
      lessonVersionSchema.safeParse({ ...makeLesson(), ...override }).success,
    ).toBe(false);
  });

  it("does not allow publishing an unreviewed lesson", () => {
    const lesson = makeLesson({
      review: { ...makeLesson().review, status: "unreviewed" },
    });
    expect(lessonVersionSchema.safeParse(lesson).success).toBe(false);
    expect(
      lessonVersionSchema.safeParse({ ...lesson, status: "draft" }).success,
    ).toBe(true);
  });

  it("requires a language version and expected output for code examples", () => {
    const code = makeLesson({
      example: {
        kind: "code",
        language: "python",
        languageVersion: "3.12",
        content: "print('halo')",
        expectedOutput: "halo",
        explanation: "Mencetak halo.",
      },
    });
    expect(lessonVersionSchema.safeParse(code).success).toBe(true);
    const { expectedOutput: _e, ...noOutput } = code.example as Record<
      string,
      unknown
    >;
    expect(
      lessonVersionSchema.safeParse({ ...code, example: noOutput }).success,
    ).toBe(false);
  });
});

describe("buildCatalog", () => {
  it("builds a catalog with published lessons and an ordered path", () => {
    const catalog = buildCatalog(
      input([makeLesson(), second], {
        paths: [
          {
            id: "dasar",
            status: "published",
            title: "Dasar",
            locale: "id-ID",
            lessons: ["contoh-urutan", "contoh-ulang"],
          },
        ],
      }),
    );
    expect(catalog.getPublished("contoh-ulang")?.title).toBe(
      "Contoh perulangan",
    );
    expect(catalog.paths()[0].lessons).toEqual([
      "contoh-urutan",
      "contoh-ulang",
    ]);
  });

  it("rejects duplicate lesson versions", () => {
    expect(
      problems(() => buildCatalog(input([makeLesson(), makeLesson()]))),
    ).toContain("duplicate lesson version contoh-urutan@1");
  });

  it("rejects two published versions of one lesson", () => {
    const v2 = makeLesson({ version: 2, title: "Versi dua" });
    expect(problems(() => buildCatalog(input([makeLesson(), v2])))).toContain(
      "lesson contoh-urutan has more than one published version",
    );
  });

  it("rejects references to unknown rubrics and missing prerequisites", () => {
    const orphan = makeLesson({
      id: "yatim",
      rubric: { rubricId: "tidak-ada", version: 1 },
      prerequisites: ["belum-ada"],
    });
    expect(problems(() => buildCatalog(input([orphan])))).toEqual([
      "yatim@1 references unknown rubric tidak-ada@1",
      "yatim@1 requires belum-ada, which has no published version",
    ]);
  });

  it("rejects prerequisite cycles", () => {
    const a = makeLesson({ id: "a", prerequisites: ["b"] });
    const b = makeLesson({ id: "b", prerequisites: ["a"] });
    expect(problems(() => buildCatalog(input([a, b])))).toContainEqual(
      expect.stringMatching(/^prerequisite cycle: /),
    );
  });

  it("rejects a path that lists a lesson before its prerequisite", () => {
    expect(
      problems(() =>
        buildCatalog(
          input([makeLesson(), second], {
            paths: [
              {
                id: "dasar",
                status: "published",
                title: "Dasar",
                locale: "id-ID",
                lessons: ["contoh-ulang", "contoh-urutan"],
              },
            ],
          }),
        ),
      ),
    ).toContain(
      "path dasar: contoh-ulang appears before its prerequisite contoh-urutan",
    );
  });

  it("keeps archived versions resolvable for historical attempts", () => {
    const v1 = makeLesson({ status: "archived" });
    const v2 = makeLesson({ version: 2, summary: "Versi baru." });
    const catalog = buildCatalog(input([v1, v2]));
    expect(catalog.getPublished("contoh-urutan")?.version).toBe(2);
    const archived = catalog.getVersion("contoh-urutan", 1);
    expect(archived?.status).toBe("archived");
    expect(catalog.contentHash(archived!)).toBe(hashLesson(v1));
  });

  it("refuses edits to a locked version and deletion of a locked version", () => {
    const lock = computeLock([makeLesson()]);
    const edited = makeLesson({ summary: "Diubah diam-diam." });
    expect(
      problems(() => buildCatalog({ ...input([edited]), lock })),
    ).toContain(
      "contoh-urutan@1 changed after it was locked; create a new version instead",
    );
    expect(
      problems(() =>
        buildCatalog({
          ...input([second]),
          lock: { ...lock, ...computeLock([second]) },
        }),
      ),
    ).toContainEqual(
      expect.stringMatching(/contoh-urutan@1 is locked but no longer exists/),
    );
  });

  it("requires every published version to be locked, but not drafts", () => {
    expect(
      problems(() => buildCatalog({ ...input([makeLesson()]), lock: {} })),
    ).toContain("contoh-urutan@1 is published but missing from the lock file");
    expect(() =>
      buildCatalog({
        ...input([makeLesson({ status: "draft" })]),
        lock: {},
      }),
    ).not.toThrow();
  });

  it("hashes content independently of key order", () => {
    const lesson = makeLesson();
    const reordered = Object.fromEntries(Object.entries(lesson).reverse());
    expect(hashLesson(lessonVersionSchema.parse(reordered))).toBe(
      hashLesson(lesson),
    );
  });
});
