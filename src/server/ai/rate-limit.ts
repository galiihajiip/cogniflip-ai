import "server-only";

/**
 * Fixed-window rate limiter kept in process memory.
 *
 * Limitation: each server instance counts separately, so on serverless hosts
 * the effective limit is per instance. The hosting firewall rule (Vercel WAF)
 * and the provider's own quota remain the outer limits.
 */
export class FixedWindowLimiter {
  private readonly windows = new Map<
    string,
    { start: number; count: number }
  >();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(
    key: string,
  ): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
    const now = this.now();
    if (this.windows.size > 10_000) {
      for (const [k, w] of this.windows)
        if (now - w.start >= this.windowMs) this.windows.delete(k);
    }
    const current = this.windows.get(key);
    if (!current || now - current.start >= this.windowMs) {
      this.windows.set(key, { start: now, count: 1 });
      return { allowed: true };
    }
    if (current.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((current.start + this.windowMs - now) / 1000),
        ),
      };
    }
    current.count++;
    return { allowed: true };
  }
}
