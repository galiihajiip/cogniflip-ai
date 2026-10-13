import "server-only";
import type pg from "pg";
import {
  ACHIEVEMENTS,
  XP_RULES,
  XP_RULE_VERSION,
  eligibleAwards,
  type MissionSuccess,
  type SessionScores,
} from "@/server/rewards/rules";

/**
 * Applies the reward rules to a user's persisted sessions. Safe to call any
 * number of times: awards are inserted with ON CONFLICT DO NOTHING on their
 * idempotency keys, so replays, refreshes and concurrent calls never
 * duplicate XP or achievements.
 */
export class RewardService {
  constructor(private readonly pool: pg.Pool) {}

  private async sessionScores(userId: string): Promise<SessionScores[]> {
    const { rows } = await this.pool.query<{
      id: string;
      lesson_id: string;
      scores: string[] | null;
    }>(
      `select s.id, s.lesson_id,
              array_agg(a.score_total order by a.number)
                filter (where a.result_status = 'assessed') as scores
         from tutor_sessions s
         left join tutor_attempts a on a.session_id = s.id
        where s.owner_user_id = $1
        group by s.id`,
      [userId],
    );
    return rows.map((r) => ({
      sessionId: r.id,
      lessonId: r.lesson_id,
      assessedScores: (r.scores ?? []).map((v) => Math.floor(Number(v) + 0.5)),
    }));
  }

  private async missionSuccesses(userId: string): Promise<MissionSuccess[]> {
    const { rows } = await this.pool.query<{
      id: string;
      mission_id: string;
      kind: "predict" | "diagnose";
    }>(
      `select distinct on (mission_id, kind) id, mission_id, kind
         from mission_attempts
        where owner_user_id = $1 and outcome = 'correct' and kind in ('predict', 'diagnose')
        order by mission_id, kind, created_at`,
      [userId],
    );
    return rows.map((r) => ({
      missionId: r.mission_id,
      kind: r.kind,
      attemptId: r.id,
    }));
  }

  async sync(userId: string): Promise<void> {
    const { xp, achievements } = eligibleAwards(
      await this.sessionScores(userId),
      await this.missionSuccesses(userId),
    );
    for (const a of xp)
      await this.pool.query(
        `insert into xp_events (user_id, event_type, source_session, source_mission_attempt,
           delta, rule_version, idempotency_key)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (user_id, idempotency_key) do nothing`,
        [
          userId,
          a.type,
          a.source.kind === "session" ? a.source.id : null,
          a.source.kind === "mission_attempt" ? a.source.id : null,
          a.delta,
          XP_RULE_VERSION,
          a.idempotencyKey,
        ],
      );
    for (const key of achievements)
      await this.pool.query(
        `insert into user_achievements (user_id, achievement_key, rule_version)
         values ($1, $2, $3) on conflict do nothing`,
        [userId, key, XP_RULE_VERSION],
      );
  }

  async summary(userId: string) {
    const total = await this.pool.query<{ total: number }>(
      `select coalesce(sum(delta), 0)::int as total from xp_events where user_id = $1`,
      [userId],
    );
    const events = await this.pool.query<{
      event_type: keyof typeof XP_RULES;
      delta: number;
      created_at: Date;
    }>(
      `select event_type, delta, created_at from xp_events
        where user_id = $1 order by created_at desc limit 20`,
      [userId],
    );
    const earned = await this.pool.query<{
      achievement_key: keyof typeof ACHIEVEMENTS;
      awarded_at: Date;
    }>(
      `select achievement_key, awarded_at from user_achievements where user_id = $1`,
      [userId],
    );
    const earnedAt = new Map(
      earned.rows.map((r) => [r.achievement_key, r.awarded_at]),
    );
    return {
      totalXp: total.rows[0].total,
      ruleVersion: XP_RULE_VERSION,
      recentEvents: events.rows.map((e) => ({
        type: e.event_type,
        delta: e.delta,
        description: XP_RULES[e.event_type].description,
        at: e.created_at.toISOString(),
      })),
      achievements: (
        Object.keys(ACHIEVEMENTS) as Array<keyof typeof ACHIEVEMENTS>
      ).map((key) => ({
        key,
        ...ACHIEVEMENTS[key],
        earnedAt: earnedAt.get(key)?.toISOString() ?? null,
      })),
    };
  }
}
