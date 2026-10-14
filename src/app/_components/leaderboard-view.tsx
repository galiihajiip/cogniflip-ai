"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { useAccount } from "@/app/_components/account";
import { Icon } from "@/app/_components/icon";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/app/_components/states";
import { apiFetch, failureMessage, type ApiFailure } from "@/app/_lib/api";
import { AVATAR_ICON } from "@/app/_lib/view";
import { leaderboardResponseSchema } from "@/shared/api/leaderboard";

type Board = z.infer<typeof leaderboardResponseSchema>;

/** Opt-in leaderboard: pseudonym, preset avatar and XP only. */
export function LeaderboardView() {
  const account = useAccount();
  const [period, setPeriod] = useState<"weekly" | "all">("weekly");
  const [board, setBoard] = useState<Board | null>(null);
  const [failure, setFailure] = useState<ApiFailure | null>(null);

  const load = useCallback(async (p: "weekly" | "all") => {
    setBoard(null);
    setFailure(null);
    const r = await apiFetch(
      `/api/leaderboard?period=${p}&limit=20`,
      leaderboardResponseSchema,
    );
    if (r.ok) setBoard(r.data);
    else setFailure(r);
  }, []);

  useEffect(() => {
    // Reload when the period changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(period);
  }, [period, load, account.status]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-surface-container-low p-6 sm:p-8">
        <p className="text-label-ui uppercase text-primary">Papan Peringkat</p>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Penjelajah Paling Rajin
        </h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Hanya penjelajah yang memilih ikut tampil. Yang terlihat hanya nama
          samaran, avatar, dan XP.
        </p>
      </section>

      <div role="tablist" aria-label="Periode" className="flex gap-2">
        {(["weekly", "all"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`min-h-11 rounded-full px-5 text-body-md font-semibold ${
              period === p
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {p === "weekly" ? "Minggu Ini" : "Sepanjang Waktu"}
          </button>
        ))}
      </div>

      {failure ? (
        <ErrorBlock
          message={failureMessage(failure)}
          onRetry={() => void load(period)}
        />
      ) : null}
      {!board && !failure ? (
        <LoadingBlock label="Memuat papan peringkat…" />
      ) : null}

      {board ? (
        <>
          {board.me ? (
            <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              {board.me.optedIn ? (
                <p className="text-body-md text-on-surface">
                  Posisimu:{" "}
                  <strong>
                    {board.me.rank ? `#${board.me.rank}` : "belum ada"}
                  </strong>{" "}
                  • {board.me.xp} XP
                </p>
              ) : (
                <p className="text-body-md text-on-surface">
                  Kamu belum ikut tampil di papan peringkat.
                </p>
              )}
              <Link href="/profil" className="btn-secondary !min-h-11">
                Atur di Profil
              </Link>
            </div>
          ) : null}
          {board.entries.length === 0 ? (
            <EmptyBlock icon="leaderboard" title="Belum ada yang tampil">
              Jadilah yang pertama! Aktifkan “Tampilkan aku di papan peringkat”
              di profilmu.
            </EmptyBlock>
          ) : (
            <ol className="card divide-y divide-surface-container">
              {board.entries.map((e) => (
                <li
                  key={`${e.rank}-${e.handle}`}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label-ui ${e.rank <= 3 ? "bg-secondary-container text-on-secondary-fixed" : "bg-surface-container text-on-surface-variant"}`}
                  >
                    #{e.rank}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <Icon name={AVATAR_ICON[e.avatarKey] ?? "person"} />
                  </span>
                  <span className="flex-1 truncate text-body-md font-semibold text-on-surface">
                    @{e.handle}
                  </span>
                  <span className="font-semibold text-secondary">
                    {e.xp} XP
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-body-sm text-on-surface-variant">{board.rules}</p>
        </>
      ) : null}
    </div>
  );
}
