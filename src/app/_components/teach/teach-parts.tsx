"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "@/app/_components/icon";
import { Chip } from "@/app/_components/states";
import { countWords } from "@/app/_lib/api";
import {
  LEVEL_LABEL,
  LEVEL_STYLE,
  type AssessedOutcome,
  type SessionView,
} from "@/app/_lib/view";
import type { LessonInfo } from "@/app/_components/teach/teach-screens";

const MAX_CHARS = 4000;
const STEPS = ["Pahami Konsep", "Ajari FlipBot", "Lihat Hasil"] as const;

/** Breadcrumb + stage progress shared by every teach screen (ST-06a header). */
export function TeachHeader({
  lesson,
  step,
  session,
}: {
  lesson: LessonInfo;
  step: 1 | 2 | 3;
  session?: SessionView;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <Link
            href={`/belajar/${lesson.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-container px-4 text-label-ui text-primary hover:bg-surface-container-high"
          >
            <Icon name="arrow_back" size={18} />
            Kembali ke Ringkasan Pelajaran
          </Link>
          <h1 className="flex flex-wrap items-center gap-3 text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            <span className="chip bg-secondary-fixed text-on-secondary-fixed">
              <Icon name="school" size={16} />
              Misi Belajar Aktif
            </span>
            Ajari FlipBot: {lesson.title}
          </h1>
        </div>
        <ol
          aria-label="Tahap belajar"
          className="card flex shrink-0 items-center gap-2 px-4 py-3 text-label-ui"
        >
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "now" : "next";
            return (
              <li
                key={label}
                aria-current={state === "now" ? "step" : undefined}
                className="flex items-center gap-2"
              >
                {i > 0 ? (
                  <span
                    aria-hidden="true"
                    className="h-px w-4 bg-outline-variant"
                  />
                ) : null}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    state === "done"
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : state === "now"
                        ? "bg-primary-container text-on-primary"
                        : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {state === "done" ? (
                    <Icon name="check_circle" size={16} />
                  ) : (
                    n
                  )}
                </span>
                <span
                  className={
                    state === "now"
                      ? "text-primary"
                      : "hidden text-on-surface-variant sm:inline"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {session ? <SessionBadges session={session} /> : null}
    </div>
  );
}

export function SessionBadges({ session }: { session: SessionView }) {
  const total = session.attemptsUsed + session.attemptsLeft;
  return (
    <div className="flex flex-wrap gap-2">
      <Chip icon="history">
        Kesempatan dinilai: {session.attemptsUsed} dari {total} terpakai
      </Chip>
      <Chip tone="primary" icon="shield">
        Bebas salah • Tanpa pengurangan XP
      </Chip>
      {session.mockMode ? (
        <Chip tone="error" icon="warning">
          Mode uji: penilaian contoh, bukan AI sungguhan
        </Chip>
      ) : null}
    </div>
  );
}

/** Textarea + word count + submit (ST-06a/06b/06c composer). */
export function AnswerBox({
  label,
  hint,
  initial = "",
  submitLabel,
  onSubmit,
  error,
  chips = [],
}: {
  label: string;
  hint?: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (answer: string) => Promise<boolean>;
  error: string | null;
  chips?: string[];
}) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const id = useId();
  const words = countWords(text);
  const empty = text.trim().length === 0;
  const tooLong = text.length > MAX_CHARS;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (empty || tooLong || busy) return;
    setBusy(true);
    await onSubmit(text.trim());
    setBusy(false);
  }

  return (
    <form onSubmit={send} className="card space-y-4 p-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-headline-sm text-on-surface">
          {label}
        </label>
        <span
          className="font-mono text-label-code-sm text-on-surface-variant"
          aria-live="polite"
        >
          {words} kata • cukup 2–4 kalimat
        </span>
      </div>
      {hint ? (
        <p className="text-body-sm text-on-surface-variant">{hint}</p>
      ) : null}
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-ui text-on-surface-variant">
            Ide kalimat:
          </span>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className="chip min-h-9 bg-surface-container-low text-on-surface hover:bg-surface-container"
              onClick={() =>
                setText((t) => (t.trim() ? `${t.trim()} ${c}` : c))
              }
            >
              <Icon name="edit_note" size={16} className="text-primary" />
              {c}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={MAX_CHARS + 200}
        aria-invalid={touched && (empty || tooLong) ? true : undefined}
        aria-describedby={`${id}-help`}
        placeholder="Tuliskan idemu di sini… Misalnya: “Menurutku …, karena …”"
        className="field min-h-40 resize-y text-body-md"
        disabled={busy}
      />
      <p id={`${id}-help`} className="text-body-sm" aria-live="polite">
        {touched && empty ? (
          <span className="text-error">Tulis dulu penjelasanmu, ya.</span>
        ) : tooLong ? (
          <span className="text-error">
            Terlalu panjang. Maksimal {MAX_CHARS} huruf.
          </span>
        ) : (
          <span className="text-on-surface-variant">
            Tulis dengan kata-katamu sendiri. Ejaan tidak dinilai.
          </span>
        )}
      </p>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
        >
          <Icon name="error" size={18} />
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span
          className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant"
          title="Fitur suara belum tersedia"
        >
          <Icon name="mic_off" size={18} />
          Rekam suara belum tersedia
        </span>
        <button type="submit" className="btn-primary" disabled={busy}>
          <Icon name={busy ? "hourglass_top" : "send"} />
          {busy ? "Mengirim…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Right column: the lesson the learner is explaining (ST-06a reference card). */
export function ReferencePanel({ lesson }: { lesson: LessonInfo }) {
  return (
    <aside className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
          <Icon name="menu_book" className="text-primary" />
          Contekan Konsep
        </h2>
        <p className="text-body-sm text-on-surface">
          {lesson.concept.explanation}
        </p>
        <pre className="whitespace-pre-wrap rounded-2xl bg-inverse-surface p-4 font-mono text-label-code-sm leading-6 text-inverse-on-surface">
          {lesson.example.content}
        </pre>
        <p className="flex items-start gap-2 rounded-xl bg-secondary-fixed/40 p-3 text-body-sm text-on-surface">
          <Icon name="lightbulb" className="text-secondary" size={18} />
          {lesson.concept.analogy}
        </p>
      </div>
      <div className="rounded-3xl bg-surface-container-low p-6">
        <h2 className="flex items-center gap-2 text-headline-sm text-primary">
          <Icon name="verified_user" />
          Catatan Jujur FlipBot
        </h2>
        <p className="mt-2 text-body-sm text-on-surface">
          FlipBot memeriksa bukti pemahamanmu sesuai rubrik, bukan ejaan.
          Jawabanmu bisa saja dinilai kurang tepat. Kamu boleh memperbaiki dan
          mencoba lagi.
        </p>
      </div>
    </aside>
  );
}

/** Rubric transparency list (ST-07). Level is shown as text + icon, not colour only. */
export function CriteriaList({ outcome }: { outcome: AssessedOutcome }) {
  return (
    <ol className="space-y-4">
      {outcome.criteria.map((c, i) => {
        const style = LEVEL_STYLE[c.level];
        const tone = {
          tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
          secondary: "bg-secondary-fixed text-on-secondary-fixed",
          primary: "bg-primary-fixed text-on-primary-fixed-variant",
        }[style.tone];
        return (
          <li key={c.label} className="card space-y-2 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-ui ${tone}`}
                >
                  {i + 1}
                </span>
                <h3 className="text-headline-sm text-on-surface">{c.label}</h3>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <span className={`chip ${tone}`}>
                  {/* Icon + text so the level never depends on colour alone. */}
                  <Icon name={style.icon} size={16} />
                  {LEVEL_LABEL[c.level]}
                </span>
                <span className="chip bg-surface-container text-on-surface">
                  {c.earned} / {c.possible} poin
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
