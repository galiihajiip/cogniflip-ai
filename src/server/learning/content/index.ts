import "server-only";
import { RUBRICS } from "@/server/assessment/content/rubrics";
import { buildCatalog, type LessonCatalog } from "@/server/learning/catalog";
import { LESSONS } from "@/server/learning/content/lessons";
import lock from "@/server/learning/content/lessons.lock.json";
import { PATHS } from "@/server/learning/content/paths";

let catalog: LessonCatalog | undefined;

/** The validated lesson catalog (built once per server process). */
export function getLessonCatalog(): LessonCatalog {
  catalog ??= buildCatalog({
    lessons: LESSONS,
    paths: PATHS,
    rubrics: RUBRICS.map((r) => ({ rubricId: r.id, version: r.version })),
    lock,
  });
  return catalog;
}
