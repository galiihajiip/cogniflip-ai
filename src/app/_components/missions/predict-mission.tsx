"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { z } from "zod";
import { CodeBlock } from "@/app/_components/code-block";
import { FlipBotAvatar, FlipBotBubble } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { Chip } from "@/app/_components/states";
import { useAccount } from "@/app/_components/account";
import { apiFetch, failureMessage, newIdempotencyKey } from "@/app/_lib/api";
import {
  missionAttemptResponseSchema,
  type missionViewSchema,
} from "@/shared/api/missions";

type View = Extract<z.infer<typeof missionViewSchema>, { kind: "predict" }>;
type Result = Extract<
  z.infer<typeof missionAttemptResponseSchema>["result"],
  { type: "predict" }
>;

const FEELINGS = [
  "Makin paham cara kerja kodenya",
  "Rasanya seperti memecahkan teka-teki",
  "Aku masih bingung, mau coba lagi",
];

/**
 * Predict-before-run (ST-09) and verification (ST-09a). The correct output
 * is a reviewed fixture; nothing is executed. A wrong guess gets a hint
 * first; the correct output is shown only when the learner asks for it.
 */
export function PredictMission({
  mission,
  next,
}: {
  mission: View;
  next: { id: string; title: string } | null;
}) {
  const account = useAccount();
  const id = useId();
  const [prediction, setPrediction] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<{ guess: string; data: Result } | null>(
    null,
  );
  const [revealed, setRevealed] = useState(false);
  const [tries, setTries] = useState(0);
  const [reflected, setReflected] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!prediction.trim() || busy) return;
    setBusy(true);
    setError(null);
    const r = await apiFetch(
      `/api/missions/${mission.id}/attempts`,
      missionAttemptResponseSchema,
      {
        method: "POST",
        body: {
          type: "predict",
          answer: prediction,
          idempotencyKey: newIdempotencyKey(),
        },
      },
    );
    if (r.ok && r.data.result.type === "predict") {
      setResult({ guess: prediction, data: r.data.result });
      setRevealed(r.data.result.outcome === "correct");
      setTries((t) => t + 1);
      if (reason.trim()) void reflect(`Alasan tebakan: ${reason.trim()}`);
      if (account.status === "signed_in") void account.refresh();
    } else if (!r.ok) setError(failureMessage(r));
    setBusy(false);
  }

  async function reflect(text: string) {
    const r = await apiFetch(
      `/api/missions/${mission.id}/attempts`,
      missionAttemptResponseSchema,
      {
        method: "POST",
        body: {
          type: "reflect",
          answer: text.slice(0, 1000),
          idempotencyKey: newIdempotencyKey(),
        },
      },
    );
    return r.ok;
  }

  function retry() {
    setResult(null);
    setRevealed(false);
    setError(null);
  }

  return (
    <div className="space-y-8">
      {/* Header (ST-09) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="card space-y-3 p-6 sm:p-8 lg:col-span-8">
          <p className="flex items-center gap-2 text-label-ui uppercase text-primary">
            <Icon name="psychology" size={18} />
            Tahap 2: Uji Mental Model Komputasi
          </p>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            {mission.title}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Sebelum melihat jawabannya, latih imajinasi programmer-mu. Baca
            kodenya baris demi baris, lalu tulis apa yang akan tercetak di
            layar.
          </p>
        </section>
        <aside className="flex flex-col justify-between gap-4 rounded-3xl bg-surface-container-low p-6 lg:col-span-4">
          <div className="flex items-start gap-3">
            <FlipBotAvatar status="online" />
            <div>
              <p className="text-label-ui text-primary">FlipBot</p>
              <p className="text-body-sm text-on-surface">
                “Pikirkan jalannya kode sebelum dijalankan! Bantu aku menebak
                dulu, ya.”
              </p>
            </div>
          </div>
          <Chip tone="secondary" icon="lightbulb">
            Bebas coba tanpa takut salah
          </Chip>
        </aside>
      </div>

      {result ? (
        <ResultView
          mission={mission}
          guess={result.guess}
          data={result.data}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onRetry={retry}
          tries={tries}
          next={next}
          reflected={reflected}
          onReflect={async (text) => {
            if (await reflect(text)) setReflected(text);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <section className="card space-y-4 p-6 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
                <Icon name="terminal" className="text-primary" />
                Target Kode
              </h2>
              <span className="rounded-lg bg-surface-container px-2 py-1 font-mono text-label-code-sm text-on-surface-variant">
                misi.py
              </span>
            </div>
            <CodeBlock code={mission.code} language="Python" />
            <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
              <Icon name="info" size={18} className="text-primary" />
              Baca dari atas ke bawah. Perhatikan baris yang menjorok ke dalam.
            </p>
          </section>

          <form
            onSubmit={send}
            noValidate
            className="card space-y-5 p-6 lg:col-span-6"
          >
            <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
              <Icon name="help" className="text-secondary" />
              Hipotesis Prediksimu
            </h2>
            <div className="space-y-2">
              <label
                htmlFor={`${id}-out`}
                className="text-body-md font-semibold text-on-surface"
              >
                1. Apa teks yang tercetak di layar?
              </label>
              <p
                id={`${id}-out-help`}
                className="text-body-sm text-on-surface-variant"
              >
                Tulis satu baris output per baris, persis seperti yang muncul.
              </p>
              <textarea
                id={`${id}-out`}
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                rows={5}
                maxLength={1000}
                spellCheck={false}
                aria-describedby={`${id}-out-help`}
                aria-invalid={touched && !prediction.trim() ? true : undefined}
                className="field bg-console font-mono text-label-code-lg text-console-text placeholder:text-outline"
                placeholder={"Contoh:\nHalo\nHalo"}
                disabled={busy}
              />
              {touched && !prediction.trim() ? (
                <p className="text-body-sm text-error">
                  Tulis dulu tebakanmu, ya.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label
                htmlFor={`${id}-why`}
                className="text-body-md font-semibold text-on-surface"
              >
                2. Alasan prediksimu{" "}
                <span className="font-normal text-on-surface-variant">
                  (boleh dikosongkan)
                </span>
              </label>
              <textarea
                id={`${id}-why`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={900}
                className="field text-body-md"
                placeholder="Karena kodenya …"
                disabled={busy}
              />
            </div>
            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
              >
                <Icon name="error" size={18} />
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="btn-primary" disabled={busy}>
                <Icon name={busy ? "hourglass_top" : "rocket_launch"} />
                {busy ? "Memeriksa…" : "Cocokkan Tebakanku!"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPrediction("");
                  setReason("");
                  setTouched(false);
                }}
              >
                Hapus Tebakan
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="flex flex-col items-start gap-4 rounded-3xl bg-surface-container-low p-6 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-sm">
          <Icon name="verified_user" size={26} />
        </span>
        <div className="flex-1">
          <h2 className="text-headline-sm text-on-surface">
            Zona Eksperimen Aman &amp; Bebas Penalti
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Kalau tebakanmu berbeda, tidak ada pengurangan XP. Perbedaan itulah
            kesempatan belajar yang paling berharga.
          </p>
        </div>
      </section>
    </div>
  );
}

function ResultView({
  mission,
  guess,
  data,
  revealed,
  onReveal,
  onRetry,
  tries,
  next,
  reflected,
  onReflect,
}: {
  mission: View;
  guess: string;
  data: Result;
  revealed: boolean;
  onReveal: () => void;
  onRetry: () => void;
  tries: number;
  next: { id: string; title: string } | null;
  reflected: string | null;
  onReflect: (text: string) => Promise<void>;
}) {
  const correct = data.outcome === "correct";
  return (
    <div className="space-y-6" aria-live="polite">
      <section
        className={`relative overflow-hidden rounded-3xl p-6 shadow-xl sm:p-10 ${
          correct ? "bg-primary text-on-primary" : "card"
        }`}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {correct ? (
              <span className="chip bg-secondary-container text-on-secondary-fixed">
                <Icon name="check_circle" size={16} /> Hasil prediksi: cocok
              </span>
            ) : (
              <Chip tone="secondary" icon="tips_and_updates">
                Hasil prediksi: belum cocok
              </Chip>
            )}
            <span
              className={`chip ${correct ? "bg-white/10 text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
            >
              <Icon name="shield" size={16} /> Bebas penalti
            </span>
          </div>
          <h2
            className={`text-headline-lg-mobile sm:text-display-hero ${correct ? "" : "text-on-surface"}`}
          >
            {correct ? "Tebakanmu Tepat Sasaran!" : "Hampir! Yuk Telusuri Lagi"}
          </h2>
          <p
            className={
              correct
                ? "text-body-lg text-on-primary-container"
                : "text-body-lg text-on-surface-variant"
            }
          >
            {correct
              ? "Cara berpikirmu persis seperti komputer membaca kodenya. Hebat!"
              : "Tebakanmu berbeda dari hasil yang benar. Coba ikuti petunjuk FlipBot dulu sebelum melihat jawabannya."}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-6">
          <h3 className="flex items-center gap-2 text-headline-sm text-on-surface">
            <Icon name="compare_arrows" className="text-primary" />
            Pemeriksaan Hasil Prediksi
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-2xl bg-surface-container-low p-4">
              <p className="text-label-ui text-on-surface-variant">Tebakanmu</p>
              <pre className="whitespace-pre-wrap font-mono text-label-code-lg text-on-surface">
                {guess}
              </pre>
            </div>
            <div className="space-y-2 rounded-2xl bg-console p-4">
              <p className="text-label-ui text-surface-container-high">
                Hasil yang benar
              </p>
              {revealed ? (
                <pre className="whitespace-pre-wrap font-mono text-label-code-lg text-console-text">
                  {data.expectedOutput}
                </pre>
              ) : (
                <button
                  type="button"
                  onClick={onReveal}
                  className="chip min-h-10 bg-white/10 text-inverse-on-surface hover:bg-white/20"
                >
                  <Icon name="visibility" size={16} />
                  Lihat hasil yang benar
                </button>
              )}
            </div>
          </div>
          <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
            <Icon name="verified_user" size={18} className="text-primary" />
            Hasil yang benar berasal dari kunci jawaban yang sudah dicek dengan
            Python. Kodenya tidak dijalankan sekarang.
          </p>
        </section>

        <section className="space-y-4">
          {!correct && data.hint ? (
            <FlipBotBubble label="Petunjuk FlipBot" tone="question">
              {data.hint}
            </FlipBotBubble>
          ) : null}
          {revealed ? (
            <div className="card space-y-2 p-6">
              <h3 className="flex items-center gap-2 text-headline-sm text-on-surface">
                <Icon name="lightbulb" className="text-secondary" />
                Kenapa hasilnya begitu?
              </h3>
              <p className="text-body-md text-on-surface">{data.explanation}</p>
              {!correct && data.nextStep ? (
                <p className="text-body-sm text-on-surface-variant">
                  {data.nextStep}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="card space-y-3 p-6">
            <h3 className="text-body-md font-semibold text-on-surface">
              Bagaimana perasaanmu setelah mencoba?
            </h3>
            {reflected ? (
              <p
                className="flex items-center gap-2 text-body-sm text-primary"
                role="status"
              >
                <Icon name="check_circle" size={18} /> Tersimpan: “{reflected}”.
                Terima kasih!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {FEELINGS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="chip min-h-10 bg-surface-container-low text-on-surface hover:bg-surface-container"
                    onClick={() => void onReflect(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-variant">
          Percobaan ke-{tries} untuk misi “{mission.title}”.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-secondary" onClick={onRetry}>
            <Icon name="refresh" />
            {correct ? "Ulangi Tebakan" : "Coba Tebak Lagi"}
          </button>
          {next ? (
            <Link href={`/misi/${next.id}`} className="btn-primary">
              Lanjut: {next.title}
              <Icon name="arrow_forward" />
            </Link>
          ) : (
            <Link href="/misi" className="btn-primary">
              Kembali ke Arena Misi
              <Icon name="arrow_forward" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
