import "server-only";
import type pg from "pg";

export type Role = "learner" | "moderator" | "admin";

export interface UserRecord {
  id: string;
  handle: string;
  role: Role;
}

export interface SessionRecord extends UserRecord {
  sessionId: string;
  expiresAt: Date;
}

/** Storage port for accounts and login sessions. */
export interface AuthRepository {
  /** Returns "handle_taken" when the handle already exists. */
  createUser(
    handle: string,
    passwordHash: string,
  ): Promise<UserRecord | "handle_taken">;
  findUserByHandle(
    handle: string,
  ): Promise<(UserRecord & { passwordHash: string }) | undefined>;
  createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  /** Only sessions that are neither revoked nor expired at `now`. */
  findActiveSession(
    tokenHash: string,
    now: Date,
  ): Promise<SessionRecord | undefined>;
  extendSession(sessionId: string, expiresAt: Date): Promise<void>;
  revokeSession(tokenHash: string, now: Date): Promise<void>;
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly pool: pg.Pool) {}

  async createUser(handle: string, passwordHash: string) {
    try {
      const { rows } = await this.pool.query<UserRecord>(
        `insert into users (handle, password_hash) values ($1, $2)
         returning id, handle, role`,
        [handle, passwordHash],
      );
      return rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === "23505")
        return "handle_taken" as const;
      throw error;
    }
  }

  async findUserByHandle(handle: string) {
    const { rows } = await this.pool.query<
      UserRecord & { passwordHash: string }
    >(
      `select id, handle, role, password_hash as "passwordHash" from users where handle = $1`,
      [handle],
    );
    return rows[0];
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date) {
    await this.pool.query(
      `insert into auth_sessions (user_id, token_hash, expires_at) values ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  }

  async findActiveSession(tokenHash: string, now: Date) {
    const { rows } = await this.pool.query<SessionRecord>(
      `select s.id as "sessionId", s.expires_at as "expiresAt", u.id, u.handle, u.role
         from auth_sessions s join users u on u.id = s.user_id
        where s.token_hash = $1 and s.revoked_at is null and s.expires_at > $2`,
      [tokenHash, now],
    );
    return rows[0];
  }

  async extendSession(sessionId: string, expiresAt: Date) {
    await this.pool.query(
      `update auth_sessions set expires_at = $2 where id = $1`,
      [sessionId, expiresAt],
    );
  }

  async revokeSession(tokenHash: string, now: Date) {
    await this.pool.query(
      `update auth_sessions set revoked_at = $2 where token_hash = $1 and revoked_at is null`,
      [tokenHash, now],
    );
  }
}

/**
 * Test adapter for unit tests only. It is never wired into the running app:
 * without a database the app reports accounts as unavailable.
 */
export class InMemoryAuthRepository implements AuthRepository {
  readonly users: Array<UserRecord & { passwordHash: string }> = [];
  readonly sessions: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
  }> = [];

  async createUser(handle: string, passwordHash: string) {
    if (this.users.some((u) => u.handle === handle))
      return "handle_taken" as const;
    const user = {
      id: crypto.randomUUID(),
      handle,
      role: "learner" as Role,
      passwordHash,
    };
    this.users.push(user);
    return { id: user.id, handle, role: user.role };
  }

  async findUserByHandle(handle: string) {
    return this.users.find((u) => u.handle === handle);
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date) {
    this.sessions.push({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
    });
  }

  async findActiveSession(tokenHash: string, now: Date) {
    const s = this.sessions.find(
      (x) => x.tokenHash === tokenHash && !x.revokedAt && x.expiresAt > now,
    );
    const user = s && this.users.find((u) => u.id === s.userId);
    return s && user
      ? {
          sessionId: s.id,
          expiresAt: s.expiresAt,
          id: user.id,
          handle: user.handle,
          role: user.role,
        }
      : undefined;
  }

  async extendSession(sessionId: string, expiresAt: Date) {
    const s = this.sessions.find((x) => x.id === sessionId);
    if (s) s.expiresAt = expiresAt;
  }

  async revokeSession(tokenHash: string, now: Date) {
    for (const s of this.sessions)
      if (s.tokenHash === tokenHash && !s.revokedAt) s.revokedAt = now;
  }
}
