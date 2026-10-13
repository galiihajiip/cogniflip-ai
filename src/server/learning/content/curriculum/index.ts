import "server-only";
import type { RubricInput } from "@/server/assessment/rubric-schema";
import {
  buildTrack,
  type TrackSpec,
} from "@/server/learning/content/curriculum/builder";
import {
  CPP_TRACK,
  JAVA_TRACK,
} from "@/server/learning/content/curriculum/compiled";
import { JAVASCRIPT_TRACK } from "@/server/learning/content/curriculum/javascript";
import { PYTHON_TRACK } from "@/server/learning/content/curriculum/python";
import { SQL_TRACK } from "@/server/learning/content/curriculum/sql";
import {
  CSS_TRACK,
  HTML_TRACK,
} from "@/server/learning/content/curriculum/web";
import type {
  LearningPath,
  LessonVersion,
} from "@/server/learning/lesson-schema";

/** Language tracks, in the order shown on the learning page (D-015). */
export const TRACKS: TrackSpec[] = [
  PYTHON_TRACK,
  JAVASCRIPT_TRACK,
  HTML_TRACK,
  CSS_TRACK,
  SQL_TRACK,
  JAVA_TRACK,
  CPP_TRACK,
];

const built = TRACKS.map((track) => ({ track, ...buildTrack(track) }));

export const CURRICULUM_LESSONS: LessonVersion[] = built.flatMap(
  (b) => b.lessons,
);
export const CURRICULUM_RUBRICS: RubricInput[] = built.flatMap(
  (b) => b.rubrics,
);
export const CURRICULUM_PATHS: LearningPath[] = built.map(
  ({ track, lessons }) => ({
    id: track.id,
    status: "draft",
    title: track.title,
    description: track.description,
    locale: "id-ID",
    lessons: lessons.map((l) => l.id),
  }),
);
