"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { useAccount } from "@/app/_components/account";
import { Icon } from "@/app/_components/icon";
import {
  Chip,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "@/app/_components/states";
import { apiFetch, failureMessage, type ApiFailure } from "@/app/_lib/api";
import { formatDate } from "@/app/_lib/view";
import {
  historyResponseSchema,
  progressResponseSchema,
} from "@/shared/api/history";
import { rewardsResponseSchema } from "@/shared/api/rewards";

type History = z.infer<typeof historyResponseSchema>;
type Progress = z.infer<typeof progressResponseSchema>;
type Rewards = z.infer<typeof rewardsResponseSchema>;

const STATE_LABEL: Record<string, string> = {
  completed: "Selesai",
  assessed: "Sudah dinilai",
  awaiting_revision: "Menunggu perbaikan",
  needs_clarification: "FlipBot bertanya",
  recoverable_error: "Perlu dikirim ulang",
  awaiting_explanation: "Belum dijawab",
  lesson_chosen: "Baru dimulai",
  concept_viewed: "Baru dimulai",
  evaluating: "Sedang dinilai",
  reassessing: "Sedang dinilai",
};

/** History, progress and (for accounts) XP and achievements. No Stitch screen: design-system adaptation. */
export function JourneyView() {
  const account = useAccount();
  const [history, setHistory] = useState<History | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "new" | "error">(
    "loading",
  );
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [more, setMore] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    const [h, p] = await Promise.all([
      apiFetch("/api/history?limit=20", historyResponseSchema),
      apiFetch("/api/progress", progressResponseSchema),
    ]);
    if (!h.ok && h.status === 401) {
      setStatus("new");
      return;
    }
    if (!h.ok || !p.ok) {
      setFailure(!h.ok ? h : (p as ApiFailure));
      setStatus("error");
      return;
    }
    setHistory(h.data);
    setProgress(p.data);
    setStatus("ready");
  }, []);

  useEffect(() => {
    // Initial load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (account.status !== "signed_in") return;
    void apiFetch("/api/rewards", rewardsResponseSchema).then((r) => {
      if (r.ok) setRewards(r.data);
    });
  }, [account.status]);

  async function loadMore() {
    if (!history?.nextCursor) return;
    setMore(true);
    const r = await apiFetch(
      `/api/history?limit=20&cursor=${encodeURIComponent(history.nextCursor)}`,
      historyResponseSchema,
    );
    setMore(false);
    if (r.ok)
      setHistory({ ...r.data, items: [...history.items, ...r.data.items] });
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-surface-container-low p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-label-ui uppercase text-primary">Perjalananku</p>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            Jejak Belajarmu
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Riwayat ini hanya bisa dilihat olehmu.
            {account.status !== "signed_in"
              ? " Tanpa akun, riwayat tersimpan di browser ini saja."
              : ""}
          </p>
        </div>
        {rewards ? (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary-fixed px-5 py-4 text-on-secondary-fixed">
            <Icon name="bolt" size={32} className="text-secondary" />
            <div>
              <p className="text-headline-md">{rewards.totalXp} XP</p>
              <p className="text-label-ui">Total poin pengalaman</p>
            </div>
          </div>
        ) : account.status === "signed_out" ? (
          <Link href="/daftar" className="btn-secondary">
            <Icon name="bolt" /> Buat akun untuk mengumpulkan XP
          </Link>
        ) : null}
      </section>

      {status === "loading" ? (
        <LoadingBlock label="Memuat perjalananmu…" />
      ) : null}
      {status === "error" && failure ? (
        <ErrorBlock
          message={failureMessage(failure)}
          onRetry={() => void load()}
        />
      ) : null}
      {status === "new" ? (
        <EmptyBlock icon="route" title="Perjalananmu belum dimulai">
          Mulai satu pelajaran, nanti jejakmu muncul di sini.{" "}
          <Link
            href="/belajar"
            className="font-semibold text-primary underline"
          >
            Mulai belajar
          </Link>
        </EmptyBlock>
      ) : null}

      {status === "ready" && progress ? (
        <section className="space-y-4">
          <h2 className="text-headline-md text-on-surface">
            Kemajuan per Pelajaran
          </h2>
          {progress.recommendation ? (
            <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-md text-on-surface">
                <Icon name="flag" className="mr-1 align-middle text-primary" />
                Saran berikutnya:{" "}
                <strong>{progress.recommendation.title}</strong>
                <span className="block text-body-sm text-on-surface-variant">
                  {progress.recommendation.rule}
                </span>
              </p>
              <Link
                href={`/belajar/${progress.recommendation.lessonId}`}
                className="btn-primary !min-h-12"
              >
                Buka <Icon name="arrow_forward" />
              </Link>
            </div>
          ) : null}
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {progress.lessons.map((l) => (
              <li key={l.lessonId} className="card space-y-2 p-5">
                <h3 className="text-headline-sm text-on-surface">{l.title}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {l.sessions} sesi • {l.assessedAttempts} jawaban dinilai
                </p>
                <p className="text-body-md text-on-surface">
                  Skor terbaik: <strong>{l.bestScore ?? "–"}</strong>
                  {" • "}terakhir: <strong>{l.latestScore ?? "–"}</strong>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rewards ? (
        <section className="space-y-4">
          <h2 className="text-headline-md text-on-surface">Lencana</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rewards.achievements.map((a) => (
              <li
                key={a.key}
                className={`card space-y-2 p-5 ${a.earnedAt ? "" : "opacity-70"}`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.earnedAt ? "bg-secondary-container text-on-secondary" : "bg-surface-container text-on-surface-variant"}`}
                >
                  <Icon
                    name={a.earnedAt ? "workspace_premium" : "lock"}
                    size={24}
                  />
                </span>
                <h3 className="text-body-md font-semibold text-on-surface">
                  {a.title}
                </h3>
                <p className="text-body-sm text-on-surface-variant">
                  {a.description}
                </p>
                <Chip tone={a.earnedAt ? "tertiary" : "neutral"}>
                  {a.earnedAt
                    ? `Didapat ${formatDate(a.earnedAt)}`
                    : "Belum didapat"}
                </Chip>
              </li>
            ))}
          </ul>
          {rewards.recentEvents.length > 0 ? (
            <div className="card p-5">
              <h3 className="mb-3 text-headline-sm text-on-surface">
                XP Terbaru
              </h3>
              <ul className="divide-y divide-surface-container">
                {rewards.recentEvents.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-2 text-body-sm"
                  >
                    <span className="text-on-surface">{e.description}</span>
                    <span className="shrink-0 font-semibold text-secondary">
                      +{e.delta} XP
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {status === "ready" && history ? (
        <section className="space-y-4">
          <h2 className="text-headline-md text-on-surface">Riwayat Sesi</h2>
          {history.items.length === 0 ? (
            <EmptyBlock icon="history" title="Belum ada sesi">
              Sesi belajarmu akan muncul di sini.
            </EmptyBlock>
          ) : (
            <ul className="space-y-3">
              {history.items.map((s) => (
                <li
                  key={s.sessionId}
                  className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-body-md font-semibold text-on-surface">
                      {s.lesson.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      {formatDate(s.updatedAt)} • {s.attempts} jawaban
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      tone={s.state === "completed" ? "tertiary" : "neutral"}
                    >
                      {STATE_LABEL[s.state] ?? s.state}
                    </Chip>
                    {s.bestScore !== null ? (
                      <Chip tone="primary">Skor {s.bestScore}</Chip>
                    ) : null}
                    {s.state !== "completed" ? (
                      <Link
                        href={`/belajar/${s.lesson.id}/jelaskan?sesi=${s.sessionId}`}
                        className="chip min-h-9 bg-primary-container text-on-primary"
                      >
                        Lanjutkan <Icon name="arrow_forward" size={16} />
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {history.nextCursor ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void loadMore()}
              disabled={more}
            >
              {more ? "Memuat…" : "Tampilkan lebih banyak"}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
