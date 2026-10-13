import "server-only";
import type pg from "pg";
import { publicProfileSchema } from "@/shared/api/profile";

export const LEADERBOARD_RULES =
  "Peringkat dihitung dari XP yang diberikan server untuk penjelasan yang sudah dinilai. " +
  "Hanya pelajar yang memilih tampil di papan peringkat yang muncul, dengan nama samaran dan avatar saja. " +
  "Mingguan dimulai Senin 00.00 WIB. XP sama = peringkat sama.";

/** Ranked view over the ledger; only opted-in learners, allowlisted fields. */
export class LeaderboardService {
  constructor(private readonly pool: pg.Pool) {}

  private periodSql(period: "weekly" | "all") {
    return period === "weekly"
      ? `e.created_at >= (date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')`
      : "true";
  }

  async periodStart(period: "weekly" | "all"): Promise<string | null> {
    if (period === "all") return null;
    const { rows } = await this.pool.query<{ start: Date }>(
      `select date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta' as start`,
    );
    return rows[0].start.toISOString();
  }

  async page(period: "weekly" | "all", limit: number, offset: number) {
    const { rows } = await this.pool.query<{
      handle: string;
      avatar_key: string;
      xp: number;
      rank: number;
    }>(
      `with totals as (
         select u.handle, p.avatar_key, sum(e.delta)::int as xp
           from xp_events e
           join users u on u.id = e.user_id
           join profiles p on p.user_id = u.id and p.leaderboard_opt_in
          where ${this.periodSql(period)}
          group by u.handle, p.avatar_key)
       select handle, avatar_key, xp, dense_rank() over (order by xp desc)::int as rank
         from totals order by xp desc, handle asc
        limit $1 offset $2`,
      [limit + 1, offset],
    );
    return {
      entries: rows.slice(0, limit).map((r) => ({
        rank: r.rank,
        ...publicProfileSchema.parse({
          handle: r.handle,
          avatarKey: r.avatar_key,
        }),
        xp: r.xp,
      })),
      nextOffset: rows.length > limit ? offset + limit : null,
    };
  }

  /** The signed-in learner's own position (only shown if they opted in). */
  async me(userId: string, period: "weekly" | "all") {
    const opt = await this.pool.query<{ leaderboard_opt_in: boolean }>(
      `select leaderboard_opt_in from profiles where user_id = $1`,
      [userId],
    );
    if (!opt.rows[0]?.leaderboard_opt_in) return { optedIn: false as const };
    const { rows } = await this.pool.query<{ xp: number; rank: number | null }>(
      `with totals as (
         select e.user_id, sum(e.delta)::int as xp
           from xp_events e join profiles p on p.user_id = e.user_id and p.leaderboard_opt_in
          where ${this.periodSql(period)}
          group by e.user_id),
       ranked as (select user_id, xp, dense_rank() over (order by xp desc)::int as rank from totals)
       select coalesce((select xp from ranked where user_id = $1), 0) as xp,
              (select rank from ranked where user_id = $1) as rank`,
      [userId],
    );
    return { optedIn: true as const, rank: rows[0].rank, xp: rows[0].xp };
  }
}
