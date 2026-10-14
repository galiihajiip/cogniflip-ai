"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { Icon } from "@/app/_components/icon";
import { apiFetch } from "@/app/_lib/api";
import { progressResponseSchema } from "@/shared/api/history";
import type { z } from "zod";

type Progress = z.infer<typeof progressResponseSchema>;
type LessonCard = { id: string; title: string; summary: string };

/** State of the learner's progress for this browser or account. */
export type ProgressState =
  | { status: "loading" }
  | { status: "new" }
  | { status: "unavailable" }
  | { status: "ready"; data: Progress };

const ProgressContext = createContext<ProgressState>({ status: "loading" });

export function useProgress(): ProgressState {
  return useContext(ProgressContext);
}

/** Loads /api/progress once for every progress widget on the page. */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>({ status: "loading" });
  useEffect(() => {
    let active = true;
    void apiFetch("/api/progress", progressResponseSchema).then((r) => {
      if (!active) return;
      if (r.ok) setState({ status: "ready", data: r.data });
      // No identity yet: a first-time visitor.
      else if (r.status === 401) setState({ status: "new" });
      else setState({ status: "unavailable" });
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <ProgressContext.Provider value={state}>
      {children}
    </ProgressContext.Provider>
  );
}

const KIND_LABEL = {
  start: "Mulai di sini",
  practice_again: "Latihan lagi",
  next: "Lanjut ke berikutnya",
} as const;

/** Recommended-mission banner (Stitch dashboard), driven by /api/progress. */
export function RecommendedLesson({ lessons }: { lessons: LessonCard[] }) {
  const progress = useProgress();
  const rec = progress.status === "ready" ? progress.data.recommendation : null;
  const target =
    (rec && lessons.find((l) => l.id === rec.lessonId)) ?? lessons[0];
  if (!target) return null;

  return (
    <section
      aria-labelledby="rekomendasi"
      className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-on-primary shadow-xl sm:px-10"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-container blur-2xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <span className="chip bg-white/10 text-on-primary">
            <Icon name="flag" size={16} />
            {rec ? KIND_LABEL[rec.kind] : "Misi Pembuka yang Disarankan"}
          </span>
          <h2
            id="rekomendasi"
            className="text-headline-lg-mobile sm:text-headline-lg"
          >
            {target.title}
          </h2>
          <p className="text-body-md text-on-primary-container">
            {target.summary}
          </p>
          {rec ? (
            <p className="flex items-start gap-2 text-body-sm text-on-primary-container">
              <Icon name="info" size={18} />
              <span>Kenapa ini? {rec.rule}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 font-mono text-label-code-sm">
            <span className="chip bg-white/10 font-normal text-on-primary">
              <Icon name="timer" size={16} /> Sekitar 10 menit
            </span>
            <span className="chip bg-white/10 font-normal text-on-primary">
              <Icon name="refresh" size={16} /> Boleh diulang kapan saja
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-center">
          <Link
            href={`/belajar/${target.id}`}
            className="inline-flex min-h-[56px] items-center gap-2 rounded-2xl bg-secondary-container px-8 text-headline-sm text-on-secondary-fixed shadow-[0_4px_0_0_#653e00] transition-transform active:translate-y-0.5"
          >
            Mulai Misi Sekarang
            <Icon name="arrow_forward" />
          </Link>
          {progress.status === "unavailable" ? (
            <span className="text-label-ui text-on-primary-container">
              Progres belum bisa dimuat. Kamu tetap bisa belajar.
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Per-lesson status line for the learning path cards. */
export function LessonProgressBadge({ lessonId }: { lessonId: string }) {
  const progress = useProgress();
  if (progress.status !== "ready") return null;
  const item = progress.data.lessons.find((l) => l.lessonId === lessonId);
  if (!item || item.sessions === 0) return null;
  return (
    <span className="chip bg-tertiary-fixed text-on-tertiary-fixed">
      <Icon
        name={item.bestScore !== null ? "check_circle" : "history"}
        size={16}
      />
      {item.bestScore !== null
        ? `Skor terbaik ${item.bestScore}`
        : "Sudah dimulai"}
    </span>
  );
}
