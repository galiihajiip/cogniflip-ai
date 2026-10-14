import type { Metadata } from "next";
import { MiniIde } from "@/app/_components/ide/mini-ide";
import { PageFrame } from "@/app/_components/states";
import { capabilityMatrix } from "@/server/code/capabilities";
import { getServerEnv } from "@/server/config/env";
import { listLearnerLessons } from "@/server/learning/service";

export const metadata: Metadata = {
  title: "Mini IDE",
  description:
    "Jalankan Python, JavaScript, SQL, HTML, dan CSS di browsermu, dan minta saran FlipBot untuk bahasa apa pun.",
};

type Props = { searchParams: Promise<{ contoh?: string | string[] }> };

/** Mini IDE (ST-10 editor layout). `?contoh=<lessonId>` loads that lesson's example code. */
export default async function IdePage({ searchParams }: Props) {
  const { contoh } = await searchParams;
  const lessonId = typeof contoh === "string" ? contoh.slice(0, 64) : null;
  const lesson = lessonId
    ? listLearnerLessons(getServerEnv()).find((l) => l.id === lessonId)
    : undefined;
  const initial =
    lesson && lesson.example.kind === "code"
      ? {
          language: lesson.example.language,
          code: lesson.example.content,
          title: lesson.title,
        }
      : undefined;
  const languages = capabilityMatrix().languages.map((l) => ({
    id: l.id,
    label: l.label,
    supportLevel: l.supportLevel,
    canAnalyzeWithAi: l.canAnalyzeWithAi,
    limitations: l.limitations,
  }));
  return (
    <PageFrame>
      <MiniIde
        key={lessonId ?? "kosong"}
        languages={languages}
        initial={initial}
      />
    </PageFrame>
  );
}
