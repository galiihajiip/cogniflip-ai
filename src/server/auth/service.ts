import "server-only";
import { DEMO_ACCOUNT, isDemoHandle } from "@/shared/api/demo";
import { createHash, randomBytes } from "node:crypto";
import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import {
  dummyHash,
  hashPassword,
  verifyPassword,
} from "@/server/auth/password";
import type { AuthRepository, UserRecord } from "@/server/auth/repository";
import { AppError } from "@/server/http/errors";

export const SESSION_COOKIE = "cf_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Extend a session when less than this much lifetime is left (refresh). */
const REFRESH_BELOW_MS = 15 * 24 * 60 * 60 * 1000;

export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface AuthLimiters {
  loginPerHandle: FixedWindowLimiter;
  loginPerIp: FixedWindowLimiter;
  registerPerIp: FixedWindowLimiter;
}

export function defaultLimiters(): AuthLimiters {
  return {
    loginPerHandle: new FixedWindowLimiter(5, 15 * 60_000),
    loginPerIp: new FixedWindowLimiter(20, 15 * 60_000),
    registerPerIp: new FixedWindowLimiter(5, 60 * 60_000),
  };
}

function limited(check: ReturnType<FixedWindowLimiter["check"]>) {
  if (!check.allowed)
    throw new AppError("RATE_LIMITED", "too many attempts", {
      details: { retryAfterSeconds: check.retryAfterSeconds },
    });
}

/**
 * Account service (D-010). Login failures always produce the same neutral
 * error whether or not the handle exists.
 */
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly limiters: AuthLimiters = defaultLimiters(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async issueSession(user: UserRecord) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(this.now().getTime() + SESSION_TTL_MS);
    await this.repo.createSession(user.id, tokenHash(token), expiresAt);
    return { user, token, expiresAt };
  }

  async register(handle: string, password: string, ip: string) {
    limited(this.limiters.registerPerIp.check(ip));
    if (password.toLowerCase().includes(handle))
      throw new AppError("VALIDATION_ERROR", "password contains handle", {
        details: { fields: [{ path: "password", issue: "invalid" }] },
      });
    const created = await this.repo.createUser(
      handle,
      await hashPassword(password),
    );
    if (created === "handle_taken")
      throw new AppError("CONFLICT", "handle taken", {
        details: { field: "handle" },
      });
    return this.issueSession(created);
  }

  async login(handle: string, password: string, ip: string) {
    limited(this.limiters.loginPerIp.check(ip));
    const demo = isDemoHandle(handle);
    // The demo password is public and shared by many visitors, so the
    // per-handle lockout would only lock everyone out (D-014).
    if (!demo) limited(this.limiters.loginPerHandle.check(handle));
    if (demo && password === DEMO_ACCOUNT.password) await this.ensureDemoUser();
    const user = await this.repo.findUserByHandle(handle);
    // Same work whether or not the account exists.
    const ok = await verifyPassword(
      password,
      user?.passwordHash ?? (await dummyHash()),
    );
    if (!user || !ok)
      throw new AppError("INVALID_CREDENTIALS", "invalid credentials");
    return this.issueSession({
      id: user.id,
      handle: user.handle,
      role: user.role,
    });
  }

  /** Creates the public demo account on first use (no deploy-time seeding). */
  private async ensureDemoUser() {
    if (await this.repo.findUserByHandle(DEMO_ACCOUNT.handle)) return;
    // "handle_taken" means a concurrent request created it first.
    await this.repo.createUser(
      DEMO_ACCOUNT.handle,
      await hashPassword(DEMO_ACCOUNT.password),
    );
  }

  /** The signed-in user for a cookie token, refreshing long-lived sessions. */
  async currentUser(
    token: string | undefined,
  ): Promise<UserRecord | undefined> {
    if (!token || !TOKEN_PATTERN.test(token)) return undefined;
    const now = this.now();
    const session = await this.repo.findActiveSession(tokenHash(token), now);
    if (!session) return undefined;
    if (session.expiresAt.getTime() - now.getTime() < REFRESH_BELOW_MS)
      await this.repo.extendSession(
        session.sessionId,
        new Date(now.getTime() + SESSION_TTL_MS),
      );
    return { id: session.id, handle: session.handle, role: session.role };
  }

  async logout(token: string | undefined) {
    if (token && TOKEN_PATTERN.test(token))
      await this.repo.revokeSession(tokenHash(token), this.now());
  }
}
