import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { ServerEnv } from "@/server/config/env";
import { AppError } from "@/server/http/errors";

/**
 * Guest identity: a random key in an httpOnly cookie. The server stores only
 * its SHA-256 hash as the owner of guest sessions. No personal data.
 */
export const GUEST_COOKIE = "cf_guest";
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

/** Returns the guest's key hash, creating a new key (and cookie) if needed. */
export function guestIdentity(
  request: Request,
  env: ServerEnv,
): { keyHash: string; setCookie?: string } {
  const existing = readCookie(request, GUEST_COOKIE);
  if (existing && KEY_PATTERN.test(existing))
    return { keyHash: hashKey(existing) };
  const key = randomBytes(32).toString("base64url");
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    keyHash: hashKey(key),
    setCookie: `${GUEST_COOKIE}=${key}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`,
  };
}

/** Existing guest only (reads never create identities). */
export function existingGuestHash(request: Request): string | undefined {
  const key = readCookie(request, GUEST_COOKIE);
  return key && KEY_PATTERN.test(key) ? hashKey(key) : undefined;
}

/**
 * Rejects cross-site state-changing requests. SameSite=Lax already withholds
 * the cookie on cross-site POSTs; this also refuses a foreign Origin header.
 */
export function assertSameOrigin(request: Request, env: ServerEnv): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // same-origin fetches from older browsers / server calls
  const allowed = new Set<string>([new URL(request.url).origin]);
  if (env.APP_BASE_URL) allowed.add(new URL(env.APP_BASE_URL).origin);
  if (!allowed.has(origin))
    throw new AppError("FORBIDDEN", "Cross-origin request refused");
}

/** Client IP for rate limiting (first X-Forwarded-For hop on Vercel). */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
