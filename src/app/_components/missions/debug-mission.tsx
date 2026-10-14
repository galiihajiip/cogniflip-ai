"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { z } from "zod";
import { useAccount } from "@/app/_components/account";
import { CodeBlock } from "@/app/_components/code-block";
import { FlipBotAvatar, FlipBotBubble } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { Chip } from "@/app/_components/states";
import { apiFetch, failureMessage, newIdempotencyKey } from "@/app/_lib/api";
import {
  missionAttemptResponseSchema,
  type missionViewSchema,
} from "@/shared/api/missions";

type View = Extract<z.infer<typeof missionViewSchema>, { kind: "debug" }>;
type Result = Extract<
  z.infer<typeof missionAttemptResponseSchema>["result"],
  { type: "diagnose" }
>;

const OUTCOME = {
  correct: { label: "Bug ditemukan!", tone: "tertiary", icon: "check_circle" },
  partial: {
    label: "Hampir tepat",
    tone: "secondary",
    icon: "tips_and_updates",
  },
  incorrect: { label: "Belum tepat", tone: "secondary", icon: "help" },
  unclear: { label: "FlipBot belum yakin", tone: "primary", icon: "help" },
} as const;

/**
 * Debug Robot (ST-10b fail-state feedback, adapted). The learner explains the
 * bug in words; an AI judges it against the reviewed answer key. Hints come
 * one at a time; the fix is revealed only after solving or three misses.
 */
export function DebugMission({
  mission,
  next,
}: {
  mission: View;
  next: { id: string; title: string } | null;
}) {
  const account = useAccount();
  const id = useId();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Array<{ answer: string; result: Result }>
  >([]);
  const last = history.at(-1)?.result;
  const solved = history.some((h) => h.result.outcome === "correct");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    const r = await apiFetch(
      `/api/missions/${mission.id}/attempts`,
      missionAttemptResponseSchema,
      {
        method: "POST",
        body: {
          type: "diagnose",
          answer: text.trim(),
          idempotencyKey: newIdempotencyKey(),
        },
      },
    );
    setBusy(false);
    if (!r.ok) {
      setError(failureMessage(r));
      return;
    }
    if (r.data.result.type !== "diagnose") return;
    setHistory((h) => [
      ...h,
      { answer: text.trim(), result: r.data.result as Result },
    ]);
    if (r.data.result.outcome !== "correct") setText("");
    if (account.status === "signed_in") void account.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-3xl bg-surface-container-low p-6 sm:flex-row sm:p-8">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-secondary-fixed shadow-md">
          <FlipBotAvatar size="lg" tone="primary" />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip tone="secondary" icon="bug_report">
              Mode Detektif Bug
            </Chip>
            <Chip tone="primary" icon="refresh">
              Coba ulang sepuasnya tanpa potongan XP
            </Chip>
          </div>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            {solved
              ? "Hore! FlipBot Selamat Berkat Kamu!"
              : `Ups! Kode FlipBot Ada Bug-nya`}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            <strong className="text-on-surface">{mission.title}.</strong> Di
            dunia programmer, kesalahan di kode disebut <strong>bug</strong>.
            Bantu FlipBot menemukan baris yang salah dan jelaskan kenapa.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-5">
          <div className="card space-y-4 p-6">
            <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
              <Icon name="flag" className="text-primary" />
              Seharusnya Program Ini…
            </h2>
            <p className="text-body-md text-on-surface">
              {mission.intendedBehavior}
            </p>
            <div className="rounded-2xl bg-console p-4">
              <p className="mb-2 text-label-ui text-surface-container-high">
                Output yang diharapkan
              </p>
              <pre className="whitespace-pre-wrap font-mono text-label-code-lg text-console-text">
                {mission.intendedOutput}
              </pre>
            </div>
          </div>
          <FlipBotBubble label="FlipBot berbisik" tone="question">
            “Aku sudah menjalankan perintahku, tapi hasilnya tidak sesuai
            harapan. Baris mana yang membuatku tersesat?”
          </FlipBotBubble>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <CodeBlock
            code={mission.code}
            filename="kode_flipbot.py"
            language="Python"
          />

          {history.length > 0 && last ? (
            <div className="card space-y-4 p-6" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-headline-sm text-on-surface">
                  Tanggapan FlipBot
                </h2>
                <Chip
                  tone={OUTCOME[last.outcome].tone}
                  icon={OUTCOME[last.outcome].icon}
                >
                  {OUTCOME[last.outcome].label}
                </Chip>
              </div>
              <blockquote className="rounded-2xl bg-surface-container-low p-4 text-body-md italic text-on-surface">
                “{history.at(-1)!.answer}”
              </blockquote>
              {last.feedback ? (
                <p className="text-body-md text-on-surface">
                  <span className="chip mr-2 bg-surface-container text-on-surface-variant">
                    Saran AI
                  </span>
                  {last.feedback}
                </p>
              ) : null}
              {last.hint ? (
                <div className="flex items-start gap-3 rounded-2xl bg-secondary-fixed/40 p-4">
                  <Icon name="lightbulb" className="text-secondary" />
                  <p className="text-body-md text-on-surface">
                    <strong>Pertanyaan pemantik:</strong> {last.hint}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {last?.answerKey ? (
            <div className="card space-y-4 border-bubble-border p-6">
              <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
                <Icon name="task_alt" className="text-tertiary-container" />
                {solved ? "Penjelasan Lengkapnya" : "Ini Kunci Jawabannya"}
              </h2>
              <p className="text-body-md text-on-surface">
                {last.answerKey.explanation}
              </p>
              <CodeBlock
                code={last.answerKey.fixedCode}
                filename="kode_diperbaiki.py"
                language="Python"
              />
              <p className="text-body-sm text-on-surface-variant">
                Kode perbaikan ini sudah dicek dengan Python saat soal dibuat.
              </p>
            </div>
          ) : null}

          {!solved ? (
            <form onSubmit={send} noValidate className="card space-y-4 p-6">
              <label htmlFor={id} className="text-headline-sm text-on-surface">
                Di mana bug-nya, dan kenapa?
              </label>
              <textarea
                id={id}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={1000}
                aria-invalid={touched && !text.trim() ? true : undefined}
                className="field text-body-md"
                placeholder="Menurutku bug-nya di baris … karena …"
                disabled={busy}
              />
              {touched && !text.trim() ? (
                <p className="text-body-sm text-error">
                  Tulis dulu dugaanmu, ya.
                </p>
              ) : null}
              {error ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
                >
                  <Icon name="error" size={18} />
                  {error}
                </p>
              ) : null}
              <p className="text-body-sm text-on-surface-variant">
                Jawabanmu dinilai oleh AI berdasarkan kunci jawaban yang sudah
                diperiksa. AI bisa keliru; kalau ragu, tanyakan pada guru.
              </p>
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
                disabled={busy}
              >
                <Icon name={busy ? "hourglass_top" : "send"} />
                {busy ? "FlipBot memeriksa…" : "Kirim Dugaanku"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              {next ? (
                <Link href={`/misi/${next.id}`} className="btn-primary flex-1">
                  Lanjut: {next.title}
                  <Icon name="arrow_forward" />
                </Link>
              ) : null}
              <Link href="/misi" className="btn-secondary">
                Kembali ke Arena Misi
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
