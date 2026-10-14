import type { Metadata } from "next";
import Link from "next/link";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import {
  LessonProgressBadge,
  ProgressProvider,
  RecommendedLesson,
} from "@/app/_components/learn-progress";
import { EmptyBlock, PageFrame } from "@/app/_components/states";
import { LANGUAGE_FILE, LEVEL_NAME, topicLabel } from "@/app/_lib/view";
import { getServerEnv } from "@/server/config/env";
import { toLessonDetail } from "@/server/learning/dto";
import {
  listLearnerLessons,
  listLearnerTracks,
} from "@/server/learning/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Belajar",
  description: "Jalur belajar CogniFlip: urutan, perulangan, dan percabangan.",
};

const HOW = [
  {
    n: 1,
    icon: "menu_book",
    tone: "bg-primary-fixed text-on-primary-fixed-variant",
    title: "Baca Misi & Amati Contoh",
    body: "Buka pelajaran, baca konsep dan analoginya, lalu perhatikan contohnya.",
    tag: "Mudah dipahami lewat contoh",
  },
  {
    n: 2,
    icon: "record_voice_over",
    tone: "bg-secondary-fixed text-on-secondary-fixed",
    title: "Ajari Robot dengan Bahasamu",
    body: "Tulis penjelasan dengan kata-katamu sendiri. FlipBot boleh bertanya balik kalau bingung.",
    tag: "Bebas salah, boleh diperbaiki",
  },
  {
    n: 3,
    icon: "smart_toy",
    tone: "bg-tertiary-fixed text-on-tertiary-fixed",
    title: "Lihat Hasil Rubriknya",
    body: "Kamu melihat kriteria mana yang sudah tepat, petunjuk berikutnya, dan boleh memperbaiki jawaban.",
    tag: "Rubrik terbuka per kriteria",
  },
] as const;

export default function LearnPage() {
  const env = getServerEnv();
  const lessons = listLearnerLessons(env).map(toLessonDetail);
  const tracks = listLearnerTracks(env).map((t) => ({
    ...t,
    lessons: t.lessons.map(toLessonDetail),
  }));

  return (
    <ProgressProvider>
      <PageFrame>
        {/* Welcome hero */}
        <section className="grid grid-cols-1 items-center gap-8 rounded-3xl bg-surface-container-low p-6 shadow-sm sm:p-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <span className="chip bg-surface-container-lowest text-on-surface-variant shadow-sm">
              <span className="h-2 w-2 rounded-full bg-secondary-container" />
              RUANG BELAJAR
            </span>
            <h1 className="text-display-hero-mobile text-on-surface sm:text-display-hero">
              Halo, Teman Belajar!
              <br />
              <span className="text-primary">
                Selamat Datang di Lab Coding.
              </span>
            </h1>
            <p className="max-w-2xl text-body-lg text-on-surface-variant">
              Di sini kamu bukan sekadar mengetik tombol, tapi menjadi{" "}
              <strong className="text-on-surface">Guru bagi FlipBot</strong>.
              Siap memandu robot kita memahami ide-ide coding?
            </p>
          </div>
          <div className="card flex flex-col items-center gap-4 p-6 lg:col-span-4">
            <div className="rounded-2xl border-[1.5px] border-bubble-border bg-tertiary-fixed/50 p-4 text-body-sm text-on-surface">
              <strong className="block">“Halo! Aku FlipBot!”</strong>
              Aku robot kecil yang penasaran. Ajari aku langkah coding, dan kita
              lihat hasilnya bersama!
            </div>
            <FlipBotAvatar size="lg" tone="secondary" />
            <span className="flex items-center gap-2 text-label-ui text-on-surface-variant">
              <Icon name="sentiment_satisfied" size={18} />
              FlipBot menunggu arahanmu
            </span>
          </div>
        </section>

        {lessons.length === 0 ? (
          <EmptyBlock icon="menu_book" title="Belum ada pelajaran yang dibuka">
            Pelajaran sedang diperiksa oleh tim sebelum boleh dipakai anak-anak.
            Coba lagi nanti, ya.
          </EmptyBlock>
        ) : (
          <RecommendedLesson
            lessons={lessons.map(({ id, title, summary }) => ({
              id,
              title,
              summary,
            }))}
          />
        )}

        {/* How it works */}
        <section aria-labelledby="cara-belajar" className="space-y-6">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <p className="text-label-ui uppercase text-primary">
                Cara belajar CogniFlip
              </p>
              <h2
                id="cara-belajar"
                className="text-headline-md text-on-surface"
              >
                3 Langkah Menjadi Guru Coding Cilik
              </h2>
            </div>
            <p className="max-w-md text-body-sm text-on-surface-variant">
              Metode belajar terbalik: kamu yang menjelaskan, robot yang
              mendengarkan.
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW.map((step) => (
              <li key={step.n} className="card flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-headline-sm ${step.tone}`}
                  >
                    {step.n}
                  </span>
                  <Icon name={step.icon} size={24} className="text-primary" />
                </div>
                <h3 className="text-headline-sm text-on-surface">
                  {step.title}
                </h3>
                <p className="flex-1 text-body-sm text-on-surface-variant">
                  {step.body}
                </p>
                <span className="rounded-xl bg-surface-container-low px-3 py-2 font-mono text-label-code-sm text-on-surface-variant">
                  {step.tag}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Learning tracks (D-015) */}
        {tracks.length > 0 ? (
          <section aria-labelledby="jalur" className="space-y-8">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <div>
                <p className="text-label-ui uppercase text-primary">
                  Alur petualangan
                </p>
                <h2 id="jalur" className="text-headline-md text-on-surface">
                  Pilih Jalur Belajarmu
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Dari dasar sekali sampai lanjutan. Urutan topik mengikuti
                  tutorial W3Schools, dijelaskan ulang untuk anak.
                </p>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {tracks.length} jalur • {lessons.length} pelajaran
              </p>
            </div>
            <nav aria-label="Lompat ke jalur" className="flex flex-wrap gap-2">
              {tracks.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="chip min-h-10 bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container"
                >
                  {t.title}
                  <span className="font-mono font-normal text-on-surface-variant">
                    {t.lessons.length}
                  </span>
                </a>
              ))}
            </nav>
            {tracks.map((track) => (
              <section
                key={track.id}
                id={track.id}
                aria-labelledby={`${track.id}-judul`}
                className="scroll-mt-28 space-y-4"
              >
                <div className="flex flex-col gap-1 border-b border-surface-container pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3
                      id={`${track.id}-judul`}
                      className="text-headline-sm text-on-surface"
                    >
                      {track.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      {track.description}
                    </p>
                  </div>
                  <span className="text-label-ui text-on-surface-variant">
                    {track.lessons.length} pelajaran
                  </span>
                </div>
                <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {track.lessons.map((lesson, index) => (
                    <li
                      key={lesson.id}
                      className="card flex flex-col gap-4 p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="chip bg-secondary-fixed text-on-secondary-fixed">
                          <Icon name="play_arrow" size={16} />
                          {topicLabel(lesson.topic)}
                        </span>
                        <span className="font-mono text-label-code-sm text-on-surface-variant">
                          {String(index + 1).padStart(2, "0")} •{" "}
                          {LEVEL_NAME[lesson.difficulty]}
                        </span>
                      </div>
                      <h4 className="text-headline-sm text-on-surface">
                        {lesson.title}
                      </h4>
                      <p className="text-body-sm text-on-surface-variant">
                        {lesson.summary}
                      </p>
                      <pre className="overflow-x-auto whitespace-pre rounded-xl bg-surface-container-low p-3 font-mono text-label-code-sm text-primary">
                        {lesson.example.content
                          .split("\n")
                          .slice(0, 4)
                          .join("\n")}
                      </pre>
                      <div className="flex flex-wrap gap-2">
                        <LessonProgressBadge lessonId={lesson.id} />
                        {lesson.example.kind === "code" ? (
                          <span className="chip bg-surface-container text-on-surface-variant">
                            <Icon name="code" size={16} />
                            {LANGUAGE_FILE[lesson.example.language]?.label ??
                              lesson.example.language}
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={`/belajar/${lesson.id}`}
                        className="btn-primary mt-auto !min-h-12 text-body-md"
                      >
                        Buka Misi Ini
                        <Icon name="arrow_forward" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </section>
        ) : null}

        {/* Explore */}
        <section aria-labelledby="eksplorasi" className="space-y-6">
          <div>
            <p className="text-label-ui uppercase text-secondary">
              Eksplorasi santai
            </p>
            <h2 id="eksplorasi" className="text-headline-md text-on-surface">
              Kamu Juga Bisa Coba Ini
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Explore
              href="/misi"
              icon="quiz"
              tone="bg-secondary-fixed text-secondary"
              title="Tebak Hasil Kode"
              body="Baca program pendek, lalu tebak apa yang akan tercetak sebelum melihat jawabannya."
              cta="Mulai Menebak"
            />
            <Explore
              href="/ide"
              icon="terminal"
              tone="bg-primary-fixed text-primary"
              title="Coba Mini IDE"
              body="Tulis kode Python, jalankan di browsermu, lalu minta saran dari FlipBot."
              cta="Buka Lab Kode"
            />
            <Explore
              href="/misi"
              icon="bug_report"
              tone="bg-tertiary-fixed text-tertiary"
              title="Teka-Teki Debug"
              body="Ada kode robot yang salah. Bantu FlipBot menemukan baris mana masalahnya."
              cta="Mulai Detektif Bug"
            />
          </div>
        </section>
      </PageFrame>
    </ProgressProvider>
  );
}

function Explore({
  href,
  icon,
  tone,
  title,
  body,
  cta,
}: {
  href: string;
  icon: string;
  tone: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-3 p-6 transition-transform motion-safe:hover:-translate-y-1"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon name={icon} size={24} />
      </span>
      <span className="text-headline-sm text-on-surface">{title}</span>
      <span className="flex-1 text-body-sm text-on-surface-variant">
        {body}
      </span>
      <span className="inline-flex items-center gap-1 text-label-ui text-primary">
        {cta}
        <Icon name="chevron_right" size={18} />
      </span>
    </Link>
  );
}
