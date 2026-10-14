"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "@/app/_components/account";
import { ErrorBlock, LoadingBlock } from "@/app/_components/states";
import {
  ClarifyScreen,
  DoneScreen,
  EvaluatingScreen,
  ProviderErrorScreen,
  ResultScreen,
  ReviseScreen,
  StartScreen,
  NeedsMoreScreen,
  type LessonInfo,
} from "@/app/_components/teach/teach-screens";
import { TeachHeader } from "@/app/_components/teach/teach-parts";
import {
  apiFetch,
  failureMessage,
  newIdempotencyKey,
  type ApiFailure,
} from "@/app/_lib/api";
import { teachPhase, type SessionView } from "@/app/_lib/view";
import { sessionResponseSchema } from "@/shared/api/learning";

type Status =
  | { kind: "loading" }
  | { kind: "fatal"; failure: ApiFailure }
  | { kind: "ready"; session: SessionView };

/**
 * Teach-the-robot flow (ST-06a…ST-08). The server session is the source of
 * truth: every screen is derived from its state, and every action sends the
 * expected version so a stale tab cannot overwrite newer progress.
 */
export function TeachFlow({ lesson }: { lesson: LessonInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const account = useAccount();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ApiFailure | null>(null);
  const started = useRef(false);
  // Session version already being prepared (effects run twice in dev).
  const preparing = useRef<string | null>(null);

  const sessionId = params.get("sesi");

  const load = useCallback(async () => {
    setStatus({ kind: "loading" });
    setActionError(null);
    if (sessionId) {
      const existing = await apiFetch(
        `/api/sessions/${encodeURIComponent(sessionId)}`,
        sessionResponseSchema,
      );
      if (existing.ok && existing.data.session.lesson.id === lesson.id) {
        setStatus({ kind: "ready", session: existing.data.session });
        return;
      }
      if (!existing.ok && existing.status !== 404 && existing.status !== 403) {
        setStatus({ kind: "fatal", failure: existing });
        return;
      }
    }
    const created = await apiFetch("/api/sessions", sessionResponseSchema, {
      method: "POST",
      body: { lessonId: lesson.id },
    });
    if (!created.ok) {
      setStatus({ kind: "fatal", failure: created });
      return;
    }
    router.replace(`${pathname}?sesi=${created.data.session.sessionId}`, {
      scroll: false,
    });
    setStatus({ kind: "ready", session: created.data.session });
  }, [sessionId, lesson.id, pathname, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Initial session load or creation.
    void load();
  }, [load]);

  const session = status.kind === "ready" ? status.session : null;

  const act = useCallback(
    async (
      type: "view_concept" | "begin" | "revise" | "complete",
      current: SessionView,
    ) => {
      setActionError(null);
      const result = await apiFetch(
        `/api/sessions/${current.sessionId}/actions`,
        sessionResponseSchema,
        { method: "POST", body: { type, expectedVersion: current.version } },
      );
      if (result.ok) {
        setStatus({ kind: "ready", session: result.data.session });
        return result.data.session;
      }
      if (result.code === "CONFLICT") {
        await refresh(current.sessionId);
      }
      setActionError(result);
      return null;
    },
    [],
  );

  async function refresh(id: string) {
    const fresh = await apiFetch(`/api/sessions/${id}`, sessionResponseSchema);
    if (fresh.ok) setStatus({ kind: "ready", session: fresh.data.session });
  }

  // The concept was shown on the intro page: move a new session to writing.
  useEffect(() => {
    if (!session || teachPhase(session) !== "prepare") return;
    const key = `${session.sessionId}:${session.version}`;
    if (preparing.current === key) return;
    preparing.current = key;
    // One step per version; the effect runs again for the next state.
    void act(
      session.state === "lesson_chosen" ? "view_concept" : "begin",
      session,
    );
  }, [session, act]);

  async function submit(answer: string): Promise<boolean> {
    if (!session) return false;
    setActionError(null);
    setSubmitting(answer);
    const result = await apiFetch(
      `/api/sessions/${session.sessionId}/actions`,
      sessionResponseSchema,
      {
        method: "POST",
        body: {
          type: "submit",
          expectedVersion: session.version,
          answer,
          idempotencyKey: newIdempotencyKey(),
        },
      },
    );
    setSubmitting(null);
    if (result.ok) {
      setStatus({ kind: "ready", session: result.data.session });
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (account.status === "signed_in") void account.refresh();
      return true;
    }
    if (result.code === "CONFLICT") await refresh(session.sessionId);
    setActionError(result);
    return false;
  }

  if (status.kind === "loading")
    return (
      <>
        <TeachHeader lesson={lesson} step={2} />
        <LoadingBlock label="Menyiapkan sesi belajar bersama FlipBot…" />
      </>
    );
  if (status.kind === "fatal")
    return (
      <>
        <TeachHeader lesson={lesson} step={2} />
        <ErrorBlock
          title="Sesi belajar belum bisa dibuka"
          message={failureMessage(status.failure)}
          onRetry={() => void load()}
        />
      </>
    );

  const current = status.session;
  const phase = submitting !== null ? "evaluating" : teachPhase(current);
  const shared = {
    lesson,
    session: current,
    error: actionError ? failureMessage(actionError) : null,
  };

  switch (phase) {
    case "prepare":
      return (
        <>
          <TeachHeader lesson={lesson} step={2} />
          {actionError ? (
            <ErrorBlock
              message={failureMessage(actionError)}
              onRetry={() => void load()}
            />
          ) : (
            <LoadingBlock label="Membuka ruang ketik…" />
          )}
        </>
      );
    case "start":
      return <StartScreen {...shared} onSubmit={submit} />;
    case "evaluating":
      return (
        <EvaluatingScreen
          {...shared}
          answer={submitting ?? current.attempts.at(-1)?.answer ?? ""}
          onReload={() => void refresh(current.sessionId)}
          stale={submitting === null}
        />
      );
    case "clarify":
      return <ClarifyScreen {...shared} onSubmit={submit} />;
    case "needs_more":
      return (
        <NeedsMoreScreen
          {...shared}
          onSubmit={submit}
          onFinish={() => void act("complete", current)}
        />
      );
    case "result":
      return (
        <ResultScreen
          {...shared}
          onRevise={() => void act("revise", current)}
          onFinish={() => void act("complete", current)}
        />
      );
    case "revise":
      return (
        <ReviseScreen
          {...shared}
          onSubmit={submit}
          onFinish={() => void act("complete", current)}
        />
      );
    case "error":
      return <ProviderErrorScreen {...shared} onRetry={submit} />;
    case "done":
      return <DoneScreen {...shared} />;
  }
}
