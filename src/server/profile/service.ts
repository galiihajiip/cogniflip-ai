import "server-only";
import { isDemoHandle } from "@/shared/api/demo";
import type pg from "pg";
import { verifyPassword } from "@/server/auth/password";
import type { UserRecord } from "@/server/auth/repository";
import { AppError } from "@/server/http/errors";
import {
  ownProfileSchema,
  preferencesSchema,
  publicProfileSchema,
  type profileUpdateSchema,
} from "@/shared/api/profile";
import type { z } from "zod";

type OwnProfile = z.infer<typeof ownProfileSchema>;
type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/**
 * Profile and account-data service. Every query is scoped to the signed-in
 * user's id taken from the server session, never from the request body.
 */
export class ProfileService {
  constructor(private readonly pool: pg.Pool) {}

  private async ensureRow(userId: string) {
    await this.pool.query(
      `insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`,
      [userId],
    );
  }

  async getOwn(user: UserRecord): Promise<OwnProfile> {
    await this.ensureRow(user.id);
    const { rows } = await this.pool.query<{
      avatar_key: string;
      leaderboard_opt_in: boolean;
      preferences: unknown;
    }>(
      `select avatar_key, leaderboard_opt_in, preferences from profiles where user_id = $1`,
      [user.id],
    );
    // Stored JSON is untrusted too: re-validate on the way out.
    return ownProfileSchema.parse({
      handle: user.handle,
      avatarKey: rows[0].avatar_key,
      leaderboardOptIn: rows[0].leaderboard_opt_in,
      preferences: preferencesSchema.catch({}).parse(rows[0].preferences),
    });
  }

  async update(user: UserRecord, update: ProfileUpdate): Promise<OwnProfile> {
    await this.ensureRow(user.id);
    await this.pool.query(
      `update profiles set
         avatar_key = coalesce($2, avatar_key),
         leaderboard_opt_in = coalesce($3, leaderboard_opt_in),
         preferences = coalesce($4::jsonb, preferences),
         updated_at = now()
       where user_id = $1`,
      [
        user.id,
        update.avatarKey ?? null,
        update.leaderboardOptIn ?? null,
        update.preferences ? JSON.stringify(update.preferences) : null,
      ],
    );
    return this.getOwn(user);
  }

  /** Public view: only for learners who opted in; otherwise NOT_FOUND. */
  async getPublic(handle: string) {
    const { rows } = await this.pool.query<{
      handle: string;
      avatar_key: string;
    }>(
      `select u.handle, p.avatar_key
         from users u join profiles p on p.user_id = u.id
        where u.handle = $1 and p.leaderboard_opt_in`,
      [handle],
    );
    if (!rows[0]) throw new AppError("NOT_FOUND", "profile not public");
    // Validate stored values before they leave the server.
    return publicProfileSchema.parse({
      handle: rows[0].handle,
      avatarKey: rows[0].avatar_key,
    });
  }

  /** Everything stored about the user, for the data-export right (docs/10 §7). */
  async export(user: UserRecord) {
    const profile = await this.getOwn(user);
    const { rows } = await this.pool.query<{ created_at: Date }>(
      `select created_at from users where id = $1`,
      [user.id],
    );
    return {
      exportedAt: new Date().toISOString(),
      account: {
        handle: user.handle,
        role: user.role,
        createdAt: rows[0]?.created_at.toISOString(),
      },
      profile,
      note: "Login sessions are stored only as hashes and are not exported.",
    };
  }

  /**
   * Deletes the account after password confirmation. Cascades remove login
   * sessions and the profile (and learning history once BLOCK 29 adds it).
   */
  async deleteAccount(user: UserRecord, password: string) {
    // The shared demo account must stay available for every visitor (D-014).
    if (isDemoHandle(user.handle))
      throw new AppError("FORBIDDEN", "the demo account cannot be deleted");
    const { rows } = await this.pool.query<{ password_hash: string }>(
      `select password_hash from users where id = $1`,
      [user.id],
    );
    if (!rows[0] || !(await verifyPassword(password, rows[0].password_hash)))
      throw new AppError("INVALID_CREDENTIALS", "password confirmation failed");
    await this.pool.query(`delete from users where id = $1`, [user.id]);
  }
}
