import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/app/_components/code-block";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { Chip, PageFrame } from "@/app/_components/states";
import { LANGUAGE_FILE, LEVEL_NAME, topicLabel } from "@/app/_lib/view";
import { getServerEnv } from "@/server/config/env";
import { toLessonDetail } from "@/server/learning/dto";
import { listLearnerLessons } from "@/server/learning/service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lessonId: string }> };

function findLesson(id: string) {
  const lesson = listLearnerLessons(getServerEnv()).find((l) => l.id === id);
  return lesson ? toLessonDetail(lesson) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = findLesson((await params).lessonId);
  return lesson
    ? { title: lesson.title, description: lesson.summary }
    : { title: "Pelajaran tidak ditemukan" };
}

/** ST-06 Pengenalan Pelajaran: concept, analogy, example, then the task. */
export default async function LessonIntroPage({ params }: Props) {
  const lesson = findLesson((await params).lessonId);
  if (!lesson) notFound();

  return (
    <PageFrame>
      <nav
        aria-label="Lokasi"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 text-label-ui">
          <Link
            href="/belajar"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-container px-4 text-primary hover:bg-surface-container-high"
          >
            <Icon name="arrow_back" size={18} />
            Kembali ke Jalur Belajar
          </Link>
          <span aria-hidden="true" className="text-outline-variant">
            /
          </span>
          <span className="text-on-surface-variant">{lesson.title}</span>
        </div>
        <Chip tone="tertiary" icon="flag">
          Langkah 1 dari 3: Pahami Konsep
        </Chip>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="card space-y-5 p-6 sm:p-8 lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            <Chip tone="secondary" icon="route">
              Topik: {topicLabel(lesson.topic)}
            </Chip>
          </div>
          <h1 className="text-display-hero-mobile text-on-surface sm:text-display-hero">
            {lesson.title}
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">
            {lesson.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip icon="timer">Sekitar 10 menit</Chip>
            <Chip icon="school">
              Tingkat {LEVEL_NAME[lesson.difficulty] ?? lesson.difficulty}
            </Chip>
          </div>
        </section>
        <aside className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-low p-6 text-center lg:col-span-4">
          <span className="chip self-start bg-surface-container-lowest text-primary">
            Sahabat Robot
          </span>
          <Image
            src="/brand/flipbot-belajar.jpg"
            alt="FlipBot duduk di kursi sambil memegang buku catatan"
            width={512}
            height={279}
            className="h-auto w-full max-w-64 rounded-2xl shadow-sm"
          />
          <h2 className="text-headline-sm text-on-surface">
            FlipBot Siap Belajar!
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            “Baca dulu konsepnya ya. Nanti kamu yang mengajariku!”
          </p>
        </aside>
      </div>

      <section aria-labelledby="konsep" className="card space-y-6 p-6 sm:p-8">
        <h2
          id="konsep"
          className="flex items-center gap-3 text-headline-md text-on-surface"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
            <Icon name="menu_book" />
          </span>
          Konsepnya
        </h2>
        <p className="max-w-3xl text-body-lg text-on-surface">
          {lesson.concept.explanation}
        </p>
        <div className="flex items-start gap-4 rounded-2xl bg-secondary-fixed/40 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-secondary">
            <Icon name="lightbulb" />
          </span>
          <div>
            <h3 className="text-headline-sm text-on-surface">Analogi Seru</h3>
            <p className="mt-1 text-body-md text-on-surface">
              {lesson.concept.analogy}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="contoh"
          className="card space-y-4 p-6 lg:col-span-7"
        >
          <h2
            id="contoh"
            className="flex items-center gap-2 text-headline-sm text-on-surface"
          >
            <Icon name="code" className="text-primary" />
            Taman Contoh FlipBot
          </h2>
          {lesson.example.kind === "code" ? (
            <>
              <CodeBlock
                code={lesson.example.content}
                filename={
                  LANGUAGE_FILE[lesson.example.language]?.file ?? "contoh.txt"
                }
                language={`${LANGUAGE_FILE[lesson.example.language]?.label ?? lesson.example.language} ${lesson.example.languageVersion}`}
              />
              {lesson.example.expectedOutput ? (
                <div className="rounded-2xl bg-console p-4">
                  <p className="mb-1 font-mono text-label-code-sm text-surface-container-high">
                    Hasil (sudah dicek dengan menjalankan kodenya)
                  </p>
                  <pre className="overflow-x-auto whitespace-pre font-mono text-label-code-lg text-console-text">
                    {lesson.example.expectedOutput}
                  </pre>
                </div>
              ) : null}
              <Link
                href={`/ide?contoh=${lesson.id}`}
                className="btn-secondary w-fit"
              >
                <Icon name="terminal" />
                Coba di Mini IDE
              </Link>
            </>
          ) : (
            <pre className="whitespace-pre-wrap rounded-2xl bg-inverse-surface p-5 font-mono text-label-code-lg leading-7 text-inverse-on-surface">
              {lesson.example.content}
            </pre>
          )}
          <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface">
            <Icon name="check_circle" className="text-primary" size={18} />
            <span>{lesson.example.explanation}</span>
          </p>
        </section>
        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-3xl bg-primary-fixed/50 p-6">
            <p className="text-label-ui uppercase text-secondary">
              Tujuan belajarmu
            </p>
            <p className="mt-2 text-body-md text-on-surface">
              {lesson.objective}
            </p>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <FlipBotAvatar size="sm" tone="secondary" />
            <div>
              <p className="text-headline-sm text-on-surface">
                Misi Berikutnya Menunggu!
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Giliranmu mengajari FlipBot kata per kata.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="card flex flex-col items-stretch gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-start gap-4">
          <FlipBotAvatar tone="soft" />
          <div className="flex-1 rounded-2xl border-[1.5px] border-bubble-border bg-surface-container-low p-4">
            <p className="flex flex-wrap items-center gap-2 text-headline-sm text-primary">
              FlipBot Berbisik:
              <span className="chip bg-tertiary-fixed text-on-tertiary-fixed">
                Tantangan
              </span>
            </p>
            <p className="mt-1 text-body-md text-on-surface">
              “{lesson.task.prompt}”
            </p>
          </div>
        </div>
        <Link
          href={`/belajar/${lesson.id}/jelaskan`}
          className="btn-primary text-headline-sm"
        >
          <Icon name="smart_toy" />
          Coba Jelaskan ke FlipBot
          <Icon name="arrow_forward" />
        </Link>
      </section>
    </PageFrame>
  );
}
