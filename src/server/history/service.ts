import "server-only";
import type pg from "pg";
import { AppError } from "@/server/http/errors";
import type { LessonVersion } from "@/server/learning/lesson-schema";

/** Score at or above which the rule suggests moving on (not a mastery claim). */
export const MOVE_ON_SCORE = 60;

interface Cursor {
  updatedAt: string;
  id: string;
}

const encodeCursor = (c: Cursor) =>
  Buffer.from(JSON.stringify(c)).toString("base64url");

function decodeCursor(raw: string | undefined): Cursor | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Cursor;
    if (
      typeof parsed.updatedAt !== "string" ||
      !/^[0-9a-f-]{36}$/.test(parsed.id)
    )
      throw 0;
    if (Number.isNaN(Date.parse(parsed.updatedAt))) throw 0;
    return parsed;
  } catch {
    throw new AppError("VALIDATION_ERROR", "bad cursor", {
      details: { fields: [{ path: "cursor", issue: "invalid_format" }] },
    });
  }
}

/**
 * Learning history and progress for one owner (user or guest key hash).
 * Every query filters by owner_key_hash taken from the server session.
 * Scores come only from attempts whose result_status is 'assessed'.
 */
export class HistoryService {
  constructor(private readonly pool: pg.Pool) {}

  async history(
    ownerKeyHash: string,
    limit: number,
    cursorRaw: string | undefined,
    titles: Map<string, string>,
  ) {
    const cursor = decodeCursor(cursorRaw);
    const { rows } = await this.pool.query<{
      id: string;
      lesson_id: string;
      lesson_version: number;
      state: string;
      created_at: Date;
      updated_at: Date;
      attempts: number;
      best: string | null;
    }>(
      `select s.id, s.lesson_id, s.lesson_version, s.state, s.created_at, s.updated_at,
              count(a.number)::int as attempts,
              max(a.score_total) filter (where a.result_status = 'assessed') as best
         from tutor_sessions s
         left join tutor_attempts a on a.session_id = s.id
        where s.owner_key_hash = $1
          and ($2::timestamptz is null or (s.updated_at, s.id) < ($2::timestamptz, $3::uuid))
        group by s.id
        order by s.updated_at desc, s.id desc
        limit $4`,
      [ownerKeyHash, cursor?.updatedAt ?? null, cursor?.id ?? null, limit + 1],
    );
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map((r) => ({
        sessionId: r.id,
        lesson: {
          id: r.lesson_id,
          version: r.lesson_version,
          title: titles.get(r.lesson_id) ?? r.lesson_id,
        },
        state: r.state,
        startedAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
        attempts: r.attempts,
        bestScore: r.best === null ? null : Math.floor(Number(r.best) + 0.5),
      })),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({
              updatedAt: last.updated_at.toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  async progress(ownerKeyHash: string, lessons: LessonVersion[]) {
    const { rows } = await this.pool.query<{
      lesson_id: string;
      sessions: number;
      assessed: number;
      best: string | null;
      latest: string | null;
    }>(
      `select s.lesson_id,
              count(distinct s.id)::int as sessions,
              count(a.number) filter (where a.result_status = 'assessed')::int as assessed,
              max(a.score_total) filter (where a.result_status = 'assessed') as best,
              (array_agg(a.score_total order by a.submitted_at desc)
                 filter (where a.result_status = 'assessed'))[1] as latest
         from tutor_sessions s
         left join tutor_attempts a on a.session_id = s.id
        where s.owner_key_hash = $1
        group by s.lesson_id`,
      [ownerKeyHash],
    );
    const byLesson = new Map(rows.map((r) => [r.lesson_id, r]));
    const round = (v: string | null) =>
      v === null ? null : Math.floor(Number(v) + 0.5);
    const items = lessons.map((l) => {
      const r = byLesson.get(l.id);
      return {
        lessonId: l.id,
        title: l.title,
        sessions: r?.sessions ?? 0,
        assessedAttempts: r?.assessed ?? 0,
        bestScore: round(r?.best ?? null),
        latestScore: round(r?.latest ?? null),
      };
    });
    return { lessons: items, recommendation: recommend(items) };
  }
}

/**
 * Rule-based next step, in learning-path order: the first lesson not yet
 * tried → "start"; a tried lesson whose best score is below MOVE_ON_SCORE →
 * "practice_again"; otherwise the next lesson.
 */
export function recommend(
  items: Array<{
    lessonId: string;
    title: string;
    assessedAttempts: number;
    bestScore: number | null;
  }>,
) {
  const rule = `Urutan jalur belajar; skor terbaik di bawah ${MOVE_ON_SCORE} disarankan latihan lagi. Ini saran, bukan bukti penguasaan.`;
  for (const item of items) {
    if (item.assessedAttempts === 0)
      return {
        lessonId: item.lessonId,
        title: item.title,
        kind: "start" as const,
        rule,
      };
    if ((item.bestScore ?? 0) < MOVE_ON_SCORE)
      return {
        lessonId: item.lessonId,
        title: item.title,
        kind: "practice_again" as const,
        rule,
      };
  }
  return null;
}
