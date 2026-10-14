"use client";

import Link from "next/link";
import { useState } from "react";
import { FlipBotAvatar, FlipBotBubble } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { ScoreRing } from "@/app/_components/score-ring";
import { Chip } from "@/app/_components/states";
import {
  AnswerBox,
  CriteriaList,
  ReferencePanel,
  TeachHeader,
} from "@/app/_components/teach/teach-parts";
import { countWords } from "@/app/_lib/api";
import {
  LEVEL_LABEL,
  criterionKeyLabel,
  currentCycleText,
  latestAssessed,
  latestAttempt,
  pendingAnswer,
  type SessionView,
} from "@/app/_lib/view";

/** Learner-safe lesson fields the teach flow needs (from toLessonDetail). */
export type LessonInfo = {
  id: string;
  title: string;
  concept: { explanation: string; analogy: string };
  example: { content: string; explanation: string };
  task: { prompt: string; instructions: string };
  next: { id: string; title: string } | null;
};

type Shared = {
  lesson: LessonInfo;
  session: SessionView;
  error: string | null;
};
type Submit = (answer: string) => Promise<boolean>;

function TwoColumn({
  main,
  side,
}: {
  main: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">{main}</div>
      <div className="lg:col-span-4">{side}</div>
    </div>
  );
}

function LearnerBubble({
  text,
  label = "Jawabanmu",
}: {
  text: string;
  label?: string;
}) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary-container p-4 text-on-primary shadow-[0_4px_0_0_#312e81]">
        <p className="mb-1 text-label-ui text-on-primary-container">{label}</p>
        <p className="whitespace-pre-wrap text-body-md">{text}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
        <Icon name="person" />
      </span>
    </div>
  );
}

/* ST-06a: Mulai Penjelasan */
export function StartScreen({
  lesson,
  session,
  error,
  onSubmit,
}: Shared & { onSubmit: Submit }) {
  return (
    <>
      <TeachHeader lesson={lesson} step={2} session={session} />
      <TwoColumn
        main={
          <>
            <div className="card flex items-center gap-4 p-5">
              <FlipBotAvatar status="online" />
              <div className="flex-1">
                <p className="text-headline-sm text-on-surface">
                  FlipBot • Robot Pembelajar
                </p>
                <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Sedang menyimak dan siap mendengar penjelasanmu
                </p>
              </div>
              <Chip tone="primary" icon="school">
                Peranmu: Guru FlipBot
              </Chip>
            </div>
            <FlipBotBubble label="FlipBot bertanya" tone="question">
              <p className="text-headline-sm">“{lesson.task.prompt}”</p>
            </FlipBotBubble>
            <div className="flex items-start gap-3 rounded-2xl bg-secondary-fixed/40 p-4 text-body-sm text-on-surface">
              <Icon name="tips_and_updates" className="text-secondary" />
              <span>
                <strong>Tips:</strong> {lesson.task.instructions}
              </span>
            </div>
            <AnswerBox
              label="Ruang Ketik Penjelasan"
              submitLabel="Kirim Penjelasan"
              onSubmit={onSubmit}
              error={error}
            />
          </>
        }
        side={<ReferencePanel lesson={lesson} />}
      />
    </>
  );
}

/* ST-06d: Loading */
export function EvaluatingScreen({
  lesson,
  session,
  answer,
  stale,
  onReload,
}: Shared & { answer: string; stale: boolean; onReload: () => void }) {
  return (
    <>
      <TeachHeader lesson={lesson} step={2} session={session} />
      <TwoColumn
        main={
          <>
            <div className="card space-y-3 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
                  <Icon name="record_voice_over" className="text-primary" />
                  Penjelasan yang Kamu Kirimkan
                </h2>
                <Chip icon="lock">Tersimpan</Chip>
              </div>
              <blockquote className="whitespace-pre-wrap rounded-2xl bg-surface-container-low p-5 text-body-lg italic text-on-surface">
                “{answer}”
              </blockquote>
            </div>
            <div
              role="status"
              aria-live="polite"
              className="card flex flex-col items-center gap-5 bg-gradient-to-br from-surface-container-lowest to-tertiary-fixed/20 p-8 text-center"
            >
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-primary-fixed motion-safe:animate-ping" />
                <FlipBotAvatar size="lg" status="thinking" />
              </div>
              <h2 className="text-headline-md text-on-surface">
                Robot sedang memahami penjelasanmu…
              </h2>
              <p className="max-w-lg text-body-md text-on-surface-variant">
                FlipBot mencocokkan idemu dengan kriteria rubrik. Biasanya hanya
                beberapa detik. Jawabanmu sudah aman tersimpan.
              </p>
              {stale ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onReload}
                >
                  <Icon name="refresh" />
                  Periksa status lagi
                </button>
              ) : null}
            </div>
          </>
        }
        side={
          <aside className="card space-y-4 p-6">
            <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
              <Icon name="smart_toy" className="text-primary" />
              Apa yang Dilakukan FlipBot?
            </h2>
            <ul className="space-y-3 text-body-sm text-on-surface">
              <li className="flex gap-2">
                <Icon name="visibility" size={18} className="text-primary" />
                Membaca kata-kata dan contoh yang kamu tulis.
              </li>
              <li className="flex gap-2">
                <Icon name="task_alt" size={18} className="text-primary" />
                Memeriksa setiap kriteria rubrik: tepat, sebagian, atau belum
                terlihat.
              </li>
              <li className="flex gap-2">
                <Icon name="verified_user" size={18} className="text-primary" />
                Skornya dihitung oleh aturan tetap, bukan ditebak AI.
              </li>
            </ul>
          </aside>
        }
      />
    </>
  );
}

/* ST-06b/06c: FlipBot asks a clarifying question */
export function ClarifyScreen({
  lesson,
  session,
  error,
  onSubmit,
}: Shared & { onSubmit: Submit }) {
  const last = latestAttempt(session);
  const question =
    last?.outcome.status === "needs_clarification" ? last.outcome.question : "";
  return (
    <>
      <TeachHeader lesson={lesson} step={2} session={session} />
      <TwoColumn
        main={
          <>
            <section aria-label="Percakapan" className="card space-y-6 p-6">
              <FlipBotBubble label="FlipBot">
                “{lesson.task.prompt}”
              </FlipBotBubble>
              {session.attempts.map((a) => (
                <LearnerBubble key={a.number} text={a.answer} />
              ))}
              <div className="flex items-center gap-3 text-label-ui uppercase text-on-surface-variant">
                <span className="h-px flex-1 bg-outline-variant" />
                FlipBot baru saja menjawab
                <span className="h-px flex-1 bg-outline-variant" />
              </div>
              <FlipBotBubble
                label="FlipBot"
                tone="question"
                badge={
                  <span className="chip bg-tertiary-fixed text-on-tertiary-fixed">
                    Pertanyaan Lanjutan
                  </span>
                }
              >
                <p className="mb-2 flex items-center gap-2 text-primary">
                  <Icon name="auto_awesome" size={18} />
                  Aku mulai mengerti, tapi masih ada yang belum kupahami:
                </p>
                <p className="rounded-xl bg-surface-container-lowest p-4 text-headline-sm text-on-surface">
                  “{question}”
                </p>
              </FlipBotBubble>
            </section>
            <AnswerBox
              label="Bantu Jawab Pertanyaan FlipBot"
              hint="Cukup tambahkan 1–2 kalimat. Jawaban sebelumnya ikut dibaca FlipBot."
              submitLabel="Kirim Jawaban ke FlipBot"
              onSubmit={onSubmit}
              error={error}
            />
          </>
        }
        side={<ReferencePanel lesson={lesson} />}
      />
    </>
  );
}

/* ST-07a: not enough evidence after the clarification */
export function NeedsMoreScreen({
  lesson,
  session,
  error,
  onSubmit,
  onFinish,
}: Shared & { onSubmit: Submit; onFinish: () => void }) {
  const previous = currentCycleText(session);
  return (
    <>
      <TeachHeader lesson={lesson} step={3} session={session} />
      <section className="card flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
        <FlipBotAvatar size="lg" tone="secondary" />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip tone="secondary" icon="help">
              Bukti belum cukup untuk dinilai
            </Chip>
            <Chip icon="info">Skor belum dibuat</Chip>
          </div>
          <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            FlipBot Butuh Sedikit Cerita Tambahan!
          </h2>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Penjelasanmu sudah mulai bagus, tapi masih terlalu ringkas sehingga
            FlipBot belum yakin menangkap idemu. Tidak apa-apa! Tidak ada nilai
            merah atau pengurangan poin. Tambahkan 1–2 kalimat lagi.
          </p>
          <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Icon name="info" size={18} />
            FlipBot memeriksa bukti pemikiranmu, bukan kesalahan ejaan.
          </p>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card space-y-3 p-6">
          <h3 className="flex items-center justify-between text-headline-sm text-on-surface">
            Jawaban Terakhirmu
            <span className="chip bg-surface-container font-mono font-normal">
              {countWords(previous)} kata
            </span>
          </h3>
          <blockquote className="rounded-2xl bg-surface-container-low p-4 text-body-lg italic text-on-surface">
            “{previous}”
          </blockquote>
        </div>
        <div className="card space-y-3 p-6">
          <h3 className="text-headline-sm text-on-surface">
            Hal yang Ingin Didengar FlipBot
          </h3>
          <p className="rounded-2xl bg-primary-fixed/50 p-4 text-body-md text-on-surface">
            <Icon name="smart_toy" className="mr-1 align-middle text-primary" />
            {lesson.task.instructions}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            Coba jelaskan <strong>apa</strong> yang terjadi,{" "}
            <strong>mengapa</strong>, dan beri satu contoh.
          </p>
        </div>
      </div>
      <AnswerBox
        label="Lengkapi Penjelasanmu di Sini"
        hint="Teks lamamu sudah kami siapkan. Tinggal tambahkan kalimat penutupmu, ya!"
        initial={previous}
        submitLabel="Kirim Penjelasan Lengkap"
        onSubmit={onSubmit}
        error={error}
        chips={["Contohnya, …", "Karena …", "Kalau tidak, …"]}
      />
      <div className="flex justify-end">
        <button type="button" className="btn-secondary" onClick={onFinish}>
          Selesai dulu untuk sekarang
        </button>
      </div>
    </>
  );
}

/* ST-07: Hasil Evaluasi Pemahaman */
export function ResultScreen({
  lesson,
  session,
  error,
  onRevise,
  onFinish,
}: Shared & { onRevise: () => void; onFinish: () => void }) {
  const assessed = latestAssessed(session);
  if (!assessed) return null;
  const { outcome, attempt } = assessed;
  const solid = outcome.criteria.filter((c) => c.level === "tepat");
  const gaps = outcome.criteria.filter((c) => c.level !== "tepat");
  const perfect = outcome.total === outcome.possible;
  return (
    <>
      <TeachHeader lesson={lesson} step={3} session={session} />
      <section className="card grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Chip tone="secondary" icon="verified_user">
            Hasil penilaian percobaan ke-{attempt.number}
          </Chip>
          <h2 className="text-display-hero-mobile text-on-surface sm:text-display-hero">
            {perfect ? "Luar Biasa, Guru Kecil!" : "Keren, Guru Kecil!"}
            <br />
            <span className="text-primary">
              {perfect ? "FlipBot Paham Semuanya!" : "FlipBot Makin Pintar!"}
            </span>
          </h2>
          <p className="max-w-xl text-body-lg text-on-surface-variant">
            Penjelasanmu tentang{" "}
            <strong className="text-on-surface">{lesson.title}</strong> sudah
            diperiksa per kriteria. Lihat bagian yang sudah tepat dan yang bisa
            ditambah.
          </p>
          <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
            <Icon
              name="sentiment_satisfied"
              className="text-secondary-container"
              size={24}
            />
            <p className="text-body-sm text-on-surface">
              <strong className="block">Catatan ramah untukmu:</strong>
              Nilai ini merangkum percobaan ini saja, bukan label kemampuanmu
              selamanya.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container p-6 text-center lg:col-span-5">
          <ScoreRing total={outcome.total} possible={outcome.possible} />
          <p className="text-label-ui text-on-surface-variant">
            {solid.length} dari {outcome.criteria.length} kriteria tepat
          </p>
        </div>
      </section>

      <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface-container-low p-6 shadow-sm md:flex-row lg:p-8">
        <FlipBotAvatar size="lg" />
        <div className="flex-1 space-y-2 rounded-2xl border-[1.5px] border-bubble-border bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-headline-sm text-primary">FlipBot Berkata:</p>
          <p className="text-body-md text-on-surface">
            “Terima kasih, Guru!{" "}
            {perfect ? "Sekarang aku paham!" : "Bantu aku satu hal lagi, ya:"}{" "}
            {outcome.hint}”
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <FeedbackCard
          tone="tertiary"
          icon="check_circle"
          kicker="Sudah Kamu Pahami"
        >
          {solid.length > 0 ? (
            <ul className="space-y-2">
              {solid.map((c) => (
                <li key={c.label} className="flex gap-2">
                  <Icon
                    name="check_circle"
                    size={18}
                    className="text-tertiary-container"
                  />
                  {c.label}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              Belum ada kriteria yang tepat. Tidak apa-apa, semua guru juga
              berlatih!
            </p>
          )}
        </FeedbackCard>
        <FeedbackCard
          tone="secondary"
          icon="tips_and_updates"
          kicker="Ayo Perbaiki"
        >
          {gaps.length > 0 ? (
            <ul className="space-y-2">
              {gaps.map((c) => (
                <li key={c.label} className="flex gap-2">
                  <Icon name="help" size={18} className="text-secondary" />
                  <span>
                    {c.label}{" "}
                    <em className="text-on-surface-variant">
                      ({LEVEL_LABEL[c.level].toLowerCase()})
                    </em>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Semua kriteria sudah tepat. Hebat!</p>
          )}
        </FeedbackCard>
        <FeedbackCard tone="primary" icon="psychology" kicker="Coba Pikirkan">
          <p>{outcome.hint}</p>
        </FeedbackCard>
      </div>

      <section aria-labelledby="rubrik" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="rubrik"
              className="text-headline-md text-on-surface sm:text-headline-lg"
            >
              Transparansi Rubrik Penilaian
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Skor {outcome.total} dari {outcome.possible} = jumlah poin tiap
              kriteria.
            </p>
          </div>
        </div>
        <CriteriaList outcome={outcome} />
      </section>

      <section className="card space-y-5 p-6 lg:p-8">
        <div>
          <h2 className="text-headline-md text-on-surface">
            {session.canRevise
              ? "Mau menambah penjelasanmu?"
              : "Kesempatan menilai sudah habis"}
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {session.canRevise
              ? `Kamu masih punya ${session.attemptsLeft} kesempatan dinilai. Tambahkan 1–2 kalimat sesuai petunjuk di atas.`
              : "Kamu sudah memakai semua kesempatan. Selesaikan sesi untuk melihat contoh penjelasan."}
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row">
          {session.canRevise ? (
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={onRevise}
            >
              <Icon name="edit_note" />
              Perbaiki Penjelasan
            </button>
          ) : null}
          <button
            type="button"
            className={
              session.canRevise ? "btn-secondary" : "btn-primary flex-1"
            }
            onClick={onFinish}
          >
            Selesaikan Sesi
            <Icon name="arrow_forward" />
          </button>
        </div>
      </section>
    </>
  );
}

function FeedbackCard({
  tone,
  icon,
  kicker,
  children,
}: {
  tone: "tertiary" | "secondary" | "primary";
  icon: string;
  kicker: string;
  children: React.ReactNode;
}) {
  const chip = {
    tertiary: "tertiary",
    secondary: "secondary",
    primary: "primary",
  } as const;
  return (
    <div className="card space-y-4 p-6">
      <Chip tone={chip[tone]} icon={icon}>
        {kicker}
      </Chip>
      <div className="text-body-md text-on-surface">{children}</div>
    </div>
  );
}

/* ST-08: Siklus Revisi (compare attempts) */
export function ReviseScreen({
  lesson,
  session,
  error,
  onSubmit,
  onFinish,
}: Shared & { onSubmit: Submit; onFinish: () => void }) {
  const assessed = latestAssessed(session);
  const targets =
    assessed?.outcome.criteria.filter((c) => c.level !== "tepat") ?? [];
  return (
    <>
      <TeachHeader lesson={lesson} step={3} session={session} />
      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <FlipBotAvatar tone="secondary" />
        <div>
          <h2 className="text-headline-md text-on-surface">
            Siklus Revisi Jawaban
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Bandingkan dengan percobaanmu sebelumnya, lalu tulis versi yang
            lebih lengkap.
          </p>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {assessed ? (
          <div className="card space-y-3 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-headline-sm text-on-surface">
                Percobaan {assessed.attempt.number}
              </h3>
              <Chip tone="secondary">
                Skor {assessed.outcome.total} / {assessed.outcome.possible}
              </Chip>
            </div>
            <blockquote className="whitespace-pre-wrap rounded-2xl bg-surface-container-low p-4 text-body-md italic text-on-surface">
              “{assessed.attempt.answer}”
            </blockquote>
          </div>
        ) : null}
        <div className="card space-y-3 p-6">
          <h3 className="flex items-center gap-2 text-headline-sm text-on-surface">
            <Icon name="flag" className="text-primary" />
            Target Perbaikan
          </h3>
          {targets.length > 0 ? (
            <ul className="space-y-2">
              {targets.map((c) => (
                <li
                  key={c.label}
                  className="flex items-start gap-2 rounded-xl bg-secondary-fixed/40 p-3 text-body-sm text-on-surface"
                >
                  <Icon
                    name="tips_and_updates"
                    size={18}
                    className="text-secondary"
                  />
                  <span>
                    {c.label} <em>({LEVEL_LABEL[c.level].toLowerCase()})</em>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Semua kriteria sudah tepat sebelumnya.
            </p>
          )}
          {assessed ? (
            <p className="rounded-xl bg-primary-fixed/50 p-3 text-body-sm text-on-surface">
              <strong>Petunjuk:</strong> {assessed.outcome.hint}
            </p>
          ) : null}
        </div>
      </div>
      <AnswerBox
        label="Tulis Versi Barumu"
        hint="Jawaban lamamu sudah ada di kotak. Ubah atau tambahkan bagian yang diminta."
        initial={assessed?.attempt.answer ?? ""}
        submitLabel="Kirim Revisi"
        onSubmit={onSubmit}
        error={error}
      />
      <div className="flex justify-end">
        <button type="button" className="btn-secondary" onClick={onFinish}>
          Tidak jadi, selesaikan sesi
        </button>
      </div>
    </>
  );
}

/* ST-07b: AI provider failed; the answer is kept and no score is invented */
export function ProviderErrorScreen({
  lesson,
  session,
  error,
  onRetry,
}: Shared & { onRetry: Submit }) {
  const answer = pendingAnswer(session);
  const last = latestAttempt(session);
  const code = last?.outcome.status === "error" ? last.outcome.code : null;
  const [busy, setBusy] = useState(false);
  return (
    <>
      <TeachHeader lesson={lesson} step={2} session={session} />
      <section
        role="alert"
        className="card flex flex-col gap-6 p-6 sm:flex-row sm:p-8"
      >
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-error-container text-on-error-container">
          <Icon name="cloud_off" size={44} />
        </span>
        <div className="space-y-3">
          <Chip tone="error" icon="info">
            Tidak ada nilai yang dibuat
          </Chip>
          <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            Ups, Antena AI FlipBot Sedang Terputus
          </h2>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            {code === "PROVIDER_TIMEOUT"
              ? "FlipBot terlalu lama berpikir."
              : code === "INVALID_MODEL_OUTPUT"
                ? "FlipBot memberi jawaban yang tidak bisa dipercaya, jadi kami tidak memakainya."
                : "Layanan AI sedang tidak bisa dihubungi."}{" "}
            Penjelasanmu aman tersimpan dan kesempatanmu tidak berkurang.
          </p>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card space-y-3 p-6">
          <h3 className="flex items-center gap-2 text-headline-sm text-on-surface">
            <Icon name="save" className="text-primary" />
            Penjelasanmu yang Tersimpan
          </h3>
          <blockquote className="whitespace-pre-wrap rounded-2xl bg-surface-container-low p-4 text-body-md italic text-on-surface">
            “{answer}”
          </blockquote>
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
            >
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={busy || !answer}
            onClick={async () => {
              setBusy(true);
              await onRetry(answer);
              setBusy(false);
            }}
          >
            <Icon name={busy ? "hourglass_top" : "refresh"} />
            {busy ? "Mencoba lagi…" : "Kirim Ulang ke FlipBot"}
          </button>
        </div>
        <div className="card space-y-3 p-6">
          <h3 className="text-headline-sm text-on-surface">
            Sambil menunggu, kamu bisa:
          </h3>
          <Link
            href="/misi"
            className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-body-md text-on-surface hover:bg-surface-container"
          >
            <Icon name="quiz" className="text-primary" />
            Coba misi tebak kode (tidak butuh AI)
          </Link>
          <Link
            href={`/belajar/${lesson.id}`}
            className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-body-md text-on-surface hover:bg-surface-container"
          >
            <Icon name="menu_book" className="text-primary" />
            Baca lagi konsep pelajaran ini
          </Link>
        </div>
      </div>
    </>
  );
}

/* Completion: final result, comparison and the reference explanation */
export function DoneScreen({ lesson, session }: Shared) {
  const assessed = latestAssessed(session);
  const cmp = session.comparison;
  return (
    <>
      <TeachHeader lesson={lesson} step={3} session={session} />
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-on-primary shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary-container blur-2xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="chip bg-white/10 text-on-primary">
              <Icon name="celebration" size={16} /> Sesi selesai
            </span>
            <h2 className="text-headline-lg-mobile sm:text-headline-lg">
              Terima kasih sudah mengajari FlipBot!
            </h2>
            <p className="max-w-xl text-body-md text-on-primary-container">
              {assessed
                ? `Skor terakhirmu ${assessed.outcome.total} dari ${assessed.outcome.possible}.`
                : "Sesi ini selesai tanpa skor karena penjelasannya belum cukup untuk dinilai. Kamu bisa mencoba lagi kapan saja."}
            </p>
          </div>
          {cmp ? (
            <div className="rounded-2xl bg-white/10 p-5 text-center">
              <p className="text-label-ui text-on-primary-container">
                Perbandingan percobaan
              </p>
              <p className="text-display-hero-mobile">
                {cmp.fromTotal} → {cmp.toTotal}
              </p>
              <p className="text-body-sm text-on-primary-container">
                {cmp.toTotal > cmp.fromTotal
                  ? "Penjelasanmu makin lengkap!"
                  : cmp.changed
                    ? "Ada kriteria yang berubah."
                    : "Belum ada perubahan nilai."}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {cmp && cmp.changes.length > 0 ? (
        <section className="card space-y-3 p-6">
          <h2 className="text-headline-sm text-on-surface">
            Kriteria yang berubah
          </h2>
          <ul className="space-y-2">
            {cmp.changes.map((c) => (
              <li
                key={c.criterionKey}
                className="flex flex-wrap items-center gap-2 text-body-md text-on-surface"
              >
                <Icon name="trending_up" className="text-primary" />
                <span className="font-semibold">
                  {criterionKeyLabel(c.criterionKey)}
                </span>
                : {LEVEL_LABEL[c.from]} → {LEVEL_LABEL[c.to]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {assessed ? (
        <section className="space-y-4">
          <h2 className="text-headline-md text-on-surface">
            Rubrik Percobaan Terakhir
          </h2>
          <CriteriaList outcome={assessed.outcome} />
        </section>
      ) : null}

      {session.referenceExplanation ? (
        <section className="card space-y-3 border-bubble-border p-6">
          <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
            <Icon name="lightbulb" className="text-secondary" />
            Contoh Penjelasan dari Guru
          </h2>
          <p className="text-body-md text-on-surface">
            {session.referenceExplanation}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            Ini hanya salah satu cara menjelaskan. Kata-katamu sendiri boleh
            berbeda.
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-4 sm:flex-row">
        {lesson.next ? (
          <Link
            href={`/belajar/${lesson.next.id}`}
            className="btn-primary flex-1"
          >
            Lanjut: {lesson.next.title}
            <Icon name="arrow_forward" />
          </Link>
        ) : (
          <Link href="/misi" className="btn-primary flex-1">
            Lanjut ke Misi Tebak Kode
            <Icon name="arrow_forward" />
          </Link>
        )}
        <Link href={`/belajar/${lesson.id}`} className="btn-secondary">
          <Icon name="refresh" />
          Ulangi Pelajaran Ini
        </Link>
        <Link href="/perjalanan" className="btn-secondary">
          <Icon name="history" />
          Lihat Perjalananku
        </Link>
      </section>
    </>
  );
}
