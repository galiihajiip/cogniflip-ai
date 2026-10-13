import "server-only";
import { CURRICULUM_PATHS } from "@/server/learning/content/curriculum";
import type { LearningPath } from "@/server/learning/lesson-schema";

/** Draft until its lessons are reviewed and published (D-007). */
const BASE_PATHS: LearningPath[] = [
  {
    id: "dasar-pemrograman",
    status: "draft",
    title: "Dasar Berpikir Komputasi",
    description:
      "Mulai dari sini tanpa bahasa pemrograman: urutan, perulangan, dan percabangan dengan perintah robot.",
    locale: "id-ID",
    lessons: ["urutan-instruksi", "perulangan", "percabangan"],
  },
];

export const PATHS: LearningPath[] = [...BASE_PATHS, ...CURRICULUM_PATHS];
