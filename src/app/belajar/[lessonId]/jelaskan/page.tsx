import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock, PageFrame } from "@/app/_components/states";
import { TeachFlow } from "@/app/_components/teach/teach-flow";
import type { LessonInfo } from "@/app/_components/teach/teach-screens";
import { getServerEnv } from "@/server/config/env";
import { toLessonDetail } from "@/server/learning/dto";
import { listLearnerLessons } from "@/server/learning/service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = listLearnerLessons(getServerEnv()).find(
    (l) => l.id === lessonId,
  );
  return {
    title: lesson
      ? `Ajari FlipBot: ${lesson.title}`
      : "Pelajaran tidak ditemukan",
    robots: { index: false },
  };
}

/** Teach-the-robot flow (Stitch ST-06a…ST-08). Answer keys never reach this page. */
export default async function TeachPage({ params }: Props) {
  const { lessonId } = await params;
  const lessons = listLearnerLessons(getServerEnv());
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const detail = toLessonDetail(lessons[index]!);
  const next = lessons[index + 1];
  const lesson: LessonInfo = {
    id: detail.id,
    title: detail.title,
    concept: detail.concept,
    example: {
      content: detail.example.content,
      explanation: detail.example.explanation,
    },
    task: detail.task,
    next: next ? { id: next.id, title: next.title } : null,
  };

  return (
    <PageFrame>
      <Suspense fallback={<LoadingBlock label="Menyiapkan sesi belajar…" />}>
        <TeachFlow lesson={lesson} />
      </Suspense>
    </PageFrame>
  );
}
