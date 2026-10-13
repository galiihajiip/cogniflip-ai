import "server-only";
import { RUBRICS } from "@/server/assessment/content/rubrics";
import { rubricSchema, type Rubric } from "@/server/assessment/rubric-schema";

let registry: Map<string, Rubric> | undefined;

/** Validated rubrics keyed by `id@version` (built once per process). */
function getRegistry(): Map<string, Rubric> {
  registry ??= new Map(
    RUBRICS.map((raw) => {
      const rubric = rubricSchema.parse(raw);
      return [`${rubric.id}@${rubric.version}`, rubric];
    }),
  );
  return registry;
}

/** Exact rubric version captured by an attempt; undefined if unknown. */
export function getRubric(id: string, version: number): Rubric | undefined {
  return getRegistry().get(`${id}@${version}`);
}

export function allRubrics(): Rubric[] {
  return [...getRegistry().values()];
}
