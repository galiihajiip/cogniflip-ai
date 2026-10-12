import "server-only";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import {
  PostgresAuthRepository,
  type UserRecord,
} from "@/server/auth/repository";
import {
  AuthService,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "@/server/auth/service";
import { getPool } from "@/server/db/client";
import { AppError } from "@/server/http/errors";
import { readCookie } from "@/server/http/guest";

const globalForAuth = globalThis as typeof globalThis & {
  cogniflipAuth?: AuthService;
};

/** Accounts need the database; without it they are honestly unavailable. */
export function getAuthService(env: ServerEnv): AuthService {
  if (!isIntegrationConfigured(env, "database"))
    throw new AppError("PROVIDER_UNAVAILABLE", "accounts need a database", {
      details: { integration: "database" },
    });
  globalForAuth.cogniflipAuth ??= new AuthService(
    new PostgresAuthRepository(getPool()),
  );
  return globalForAuth.cogniflipAuth;
}

export const sessionToken = (request: Request) =>
  readCookie(request, SESSION_COOKIE);

export function sessionCookie(token: string, env: ServerEnv): string {
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure}`;
}

export function clearSessionCookie(env: ServerEnv): string {
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** Signed-in user, or undefined (also when accounts are unavailable). */
export async function getCurrentUser(
  request: Request,
  env: ServerEnv,
): Promise<UserRecord | undefined> {
  if (!isIntegrationConfigured(env, "database")) return undefined;
  return getAuthService(env).currentUser(sessionToken(request));
}

export async function requireUser(
  request: Request,
  env: ServerEnv,
): Promise<UserRecord> {
  getAuthService(env); // reports PROVIDER_UNAVAILABLE without a database
  const user = await getCurrentUser(request, env);
  if (!user) throw new AppError("UNAUTHENTICATED", "sign-in required");
  return user;
}
