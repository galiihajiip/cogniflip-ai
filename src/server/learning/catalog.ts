import "server-only";
import { createHash } from "node:crypto";
import {
  learningPathSchema,
  lessonVersionSchema,
  type LearningPath,
  type LessonVersion,
  type RubricRef,
} from "@/server/learning/lesson-schema";

/**
 * Validated, immutable view of all lesson versions and learning paths.
 *
 * Versioning rules:
 * - A lesson version (`id@version`) is never edited after it is published or
 *   archived; its content hash is locked in `content/lessons.lock.json`.
 * - At most one version of a lesson is `published` at a time.
 * - Archived versions stay in the catalog so historical attempts, which store
 *   `id`, `version` and `contentHash`, can always be resolved.
 */

export class CatalogError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid lesson catalog:\n  - ${problems.join("\n  - ")}`);
    this.name = "CatalogError";
  }
}

export type LessonLock = Record<string, string>;

export interface CatalogInput {
  lessons: unknown[];
  paths: unknown[];
  /** Rubric versions that exist; every lesson must reference one of them. */
  rubrics: RubricRef[];
  /** `id@version` → content hash for every published or archived version. */
  lock: LessonLock;
}

export interface LessonCatalog {
  /** The currently published version of a lesson, if any. */
  getPublished(id: string): LessonVersion | undefined;
  /** Any version, including archived ones (for historical attempts). */
  getVersion(id: string, version: number): LessonVersion | undefined;
  contentHash(lesson: LessonVersion): string;
  publishedLessons(): LessonVersion[];
  /** Published paths only; drafts are never shown to learners. */
  paths(): LearningPath[];
}

export const versionKey = (id: string, version: number) => `${id}@${version}`;

/** Stable JSON (sorted keys) so the hash does not depend on key order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashLesson(lesson: LessonVersion): string {
  return createHash("sha256").update(canonical(lesson)).digest("hex");
}

function findCycle(graph: Map<string, string[]>): string[] | undefined {
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const visit = (node: string): string[] | undefined => {
    if (state.get(node) === "done") return undefined;
    if (state.get(node) === "visiting")
      return [...stack.slice(stack.indexOf(node)), node];
    state.set(node, "visiting");
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(node, "done");
    return undefined;
  };
  for (const node of graph.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return undefined;
}

export function buildCatalog(input: CatalogInput): LessonCatalog {
  const problems: string[] = [];
  const versions = new Map<string, LessonVersion>();
  const hashes = new Map<string, string>();

  input.lessons.forEach((raw, index) => {
    const parsed = lessonVersionSchema.safeParse(raw);
    if (!parsed.success) {
      const label =
        raw && typeof raw === "object" && "id" in raw
          ? String((raw as { id: unknown }).id)
          : `#${index}`;
      for (const issue of parsed.error.issues)
        problems.push(
          `lesson ${label}: ${issue.path.join(".") || "(root)"} ${issue.message}`,
        );
      return;
    }
    const lesson = parsed.data;
    const key = versionKey(lesson.id, lesson.version);
    if (versions.has(key)) {
      problems.push(`duplicate lesson version ${key}`);
      return;
    }
    versions.set(key, lesson);
    hashes.set(key, hashLesson(lesson));
  });

  // Exactly one published version per lesson id.
  const published = new Map<string, LessonVersion>();
  for (const lesson of versions.values()) {
    if (lesson.status !== "published") continue;
    if (published.has(lesson.id))
      problems.push(`lesson ${lesson.id} has more than one published version`);
    else published.set(lesson.id, lesson);
  }

  // Locked content must not change; published/archived versions must be locked.
  for (const [key, lesson] of versions) {
    const locked = input.lock[key];
    if (lesson.status === "draft") continue;
    if (locked === undefined)
      problems.push(
        `${key} is ${lesson.status} but missing from the lock file`,
      );
    else if (locked !== hashes.get(key))
      problems.push(
        `${key} changed after it was locked; create a new version instead`,
      );
  }
  for (const key of Object.keys(input.lock)) {
    if (!versions.has(key))
      problems.push(
        `${key} is locked but no longer exists (versions are never deleted)`,
      );
  }

  // References: rubrics and prerequisites.
  const rubricKeys = new Set(
    input.rubrics.map((r) => versionKey(r.rubricId, r.version)),
  );
  for (const lesson of versions.values()) {
    const key = versionKey(lesson.id, lesson.version);
    if (
      !rubricKeys.has(versionKey(lesson.rubric.rubricId, lesson.rubric.version))
    )
      problems.push(
        `${key} references unknown rubric ${versionKey(lesson.rubric.rubricId, lesson.rubric.version)}`,
      );
    if (lesson.status === "published") {
      for (const prerequisite of lesson.prerequisites)
        if (!published.has(prerequisite))
          problems.push(
            `${key} requires ${prerequisite}, which has no published version`,
          );
    }
  }
  const cycle = findCycle(
    new Map([...published.values()].map((l) => [l.id, l.prerequisites])),
  );
  if (cycle) problems.push(`prerequisite cycle: ${cycle.join(" -> ")}`);

  // Learning paths.
  const pathIds = new Set<string>();
  const paths: LearningPath[] = [];
  for (const raw of input.paths) {
    const parsed = learningPathSchema.safeParse(raw);
    if (!parsed.success) {
      problems.push(
        `learning path is invalid: ${parsed.error.issues[0]?.message}`,
      );
      continue;
    }
    const path = parsed.data;
    if (pathIds.has(path.id))
      problems.push(`duplicate learning path ${path.id}`);
    pathIds.add(path.id);
    const seen = new Set<string>();
    path.lessons.forEach((id, position) => {
      if (seen.has(id)) problems.push(`path ${path.id} lists ${id} twice`);
      seen.add(id);
      const lesson =
        published.get(id) ??
        (path.status === "draft"
          ? [...versions.values()].find((l) => l.id === id)
          : undefined);
      if (!lesson) {
        problems.push(
          path.status === "draft"
            ? `path ${path.id} lists unknown lesson ${id}`
            : `path ${path.id} lists ${id}, which has no published version`,
        );
        return;
      }
      for (const prerequisite of lesson.prerequisites)
        if (!path.lessons.slice(0, position).includes(prerequisite))
          problems.push(
            `path ${path.id}: ${id} appears before its prerequisite ${prerequisite}`,
          );
    });
    paths.push(path);
  }

  if (problems.length > 0) throw new CatalogError(problems);

  return {
    getPublished: (id) => published.get(id),
    getVersion: (id, version) => versions.get(versionKey(id, version)),
    contentHash: (lesson) => hashLesson(lesson),
    publishedLessons: () => [...published.values()],
    paths: () => paths.filter((p) => p.status === "published"),
  };
}

/** Lock entries for every published or archived version (used by the lock script). */
export function computeLock(lessons: unknown[]): LessonLock {
  const lock: LessonLock = {};
  for (const raw of lessons) {
    const lesson = lessonVersionSchema.parse(raw);
    if (lesson.status !== "draft")
      lock[versionKey(lesson.id, lesson.version)] = hashLesson(lesson);
  }
  return Object.fromEntries(Object.entries(lock).sort());
}
