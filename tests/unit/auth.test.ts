import { describe, expect, it } from "vitest";
import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { InMemoryAuthRepository } from "@/server/auth/repository";
import {
  AuthService,
  SESSION_TTL_MS,
  tokenHash,
  type AuthLimiters,
} from "@/server/auth/service";
import { AppError } from "@/server/http/errors";
import { handleSchema, passwordSchema } from "@/shared/api/auth";
import { DEMO_ACCOUNT, isDemoHandle } from "@/shared/api/demo";

const generous = (): AuthLimiters => ({
  loginPerHandle: new FixedWindowLimiter(100, 60_000),
  loginPerIp: new FixedWindowLimiter(100, 60_000),
  registerPerIp: new FixedWindowLimiter(100, 60_000),
});

function setup(limiters = generous()) {
  let now = new Date("2026-10-13T00:00:00Z");
  const repo = new InMemoryAuthRepository();
  const service = new AuthService(repo, limiters, () => now);
  return {
    repo,
    service,
    advance: (ms: number) => (now = new Date(now.getTime() + ms)),
  };
}

async function code(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    return (e as AppError).code;
  }
  throw new Error("expected AppError");
}

describe("handle and password rules", () => {
  it.each(["robi_kecil", "Anak_Hebat", "  pelangi7  "])(
    "accepts %j (normalized to lower case)",
    (h) => {
      expect(handleSchema.parse(h)).toBe(h.trim().toLowerCase());
    },
  );

  it.each([
    ["too short", "ab"],
    ["starts with a digit", "7pelangi"],
    ["contains @ (email-like)", "budi@mail"],
    ["contains a phone-like digit run", "budi081234"],
    ["a space", "budi santoso"],
    ["reserved", "admin"],
    ["reserved with underscores", "cogni_flip"],
    ["too long", "a".repeat(21)],
  ])("rejects a handle that is %s", (_label, h) => {
    expect(handleSchema.safeParse(h).success).toBe(false);
  });

  it("rejects short and very common passwords", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("password").success).toBe(false);
    expect(passwordSchema.safeParse("Sayangku").success).toBe(false);
    expect(passwordSchema.safeParse("kucing-terbang-9").success).toBe(true);
  });
});

describe("password hashing", () => {
  it("stores scrypt parameters with a random salt and verifies in constant time", async () => {
    const a = await hashPassword("kucing-terbang-9");
    const b = await hashPassword("kucing-terbang-9");
    expect(a).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain("kucing");
    expect(await verifyPassword("kucing-terbang-9", a)).toBe(true);
    expect(await verifyPassword("kucing-terbang-8", a)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("AuthService", () => {
  it("registers, stores only hashes, and signs the user in", async () => {
    const { repo, service } = setup();
    const { user, token } = await service.register(
      "robi_kecil",
      "kucing-terbang-9",
      "1.1.1.1",
    );
    expect(user).toMatchObject({ handle: "robi_kecil", role: "learner" });
    expect(repo.users[0].passwordHash).not.toContain("kucing");
    expect(repo.sessions[0].tokenHash).toBe(tokenHash(token));
    expect(JSON.stringify(repo.sessions)).not.toContain(token);
    expect(await service.currentUser(token)).toMatchObject({
      handle: "robi_kecil",
    });
  });

  it("rejects a taken handle and a password containing the handle", async () => {
    const { service } = setup();
    await service.register("robi_kecil", "kucing-terbang-9", "ip");
    expect(
      await code(service.register("robi_kecil", "lain-lagi-123", "ip")),
    ).toBe("CONFLICT");
    expect(await code(service.register("pelangi", "pelangi123x", "ip"))).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("gives the same neutral error for an unknown handle and a wrong password", async () => {
    const { service } = setup();
    await service.register("robi_kecil", "kucing-terbang-9", "ip");
    expect(
      await code(service.login("tidak_ada", "kucing-terbang-9", "ip")),
    ).toBe("INVALID_CREDENTIALS");
    expect(await code(service.login("robi_kecil", "salah-sandi-1", "ip"))).toBe(
      "INVALID_CREDENTIALS",
    );
    const { token } = await service.login(
      "robi_kecil",
      "kucing-terbang-9",
      "ip",
    );
    expect(await service.currentUser(token)).toMatchObject({
      handle: "robi_kecil",
    });
  });

  it("rate-limits repeated login attempts per handle and registrations per IP", async () => {
    const { service } = setup({
      loginPerHandle: new FixedWindowLimiter(2, 60_000),
      loginPerIp: new FixedWindowLimiter(100, 60_000),
      registerPerIp: new FixedWindowLimiter(1, 60_000),
    });
    await service.register("robi_kecil", "kucing-terbang-9", "ip");
    expect(
      await code(service.register("lain_lagi", "kucing-terbang-9", "ip")),
    ).toBe("RATE_LIMITED");
    await code(service.login("robi_kecil", "salah-1-salah", "x"));
    await code(service.login("robi_kecil", "salah-2-salah", "y"));
    expect(
      await code(service.login("robi_kecil", "kucing-terbang-9", "z")),
    ).toBe("RATE_LIMITED");
  });

  it("refreshes long-lived sessions, expires old ones and revokes on logout", async () => {
    const { repo, service, advance } = setup();
    const { token } = await service.register(
      "robi_kecil",
      "kucing-terbang-9",
      "ip",
    );
    const firstExpiry = repo.sessions[0].expiresAt.getTime();
    advance(20 * 24 * 60 * 60 * 1000); // 20 days: < 15 days left → refresh
    expect(await service.currentUser(token)).toBeDefined();
    expect(repo.sessions[0].expiresAt.getTime()).toBeGreaterThan(firstExpiry);
    advance(SESSION_TTL_MS + 1);
    expect(await service.currentUser(token)).toBeUndefined();

    const second = await service.login("robi_kecil", "kucing-terbang-9", "ip");
    await service.logout(second.token);
    expect(await service.currentUser(second.token)).toBeUndefined();
  });

  it("ignores malformed tokens without touching storage", async () => {
    const { service } = setup();
    expect(await service.currentUser(undefined)).toBeUndefined();
    expect(await service.currentUser("short")).toBeUndefined();
    expect(await service.currentUser("x".repeat(43))).toBeUndefined();
  });
});

describe("public demo account (D-014)", () => {
  const { handle, password } = DEMO_ACCOUNT;

  it("is created on the first correct demo login and is a plain learner", async () => {
    const { repo, service } = setup();
    expect(await repo.findUserByHandle(handle)).toBeUndefined();
    const session = await service.login(handle, password, "1.1.1.1");
    expect(session.user).toMatchObject({ handle, role: "learner" });
    // Second login reuses the same account.
    const again = await service.login(handle, password, "2.2.2.2");
    expect(again.user.id).toBe(session.user.id);
  });

  it("is not created by a wrong demo password", async () => {
    const { repo, service } = setup();
    expect(await code(service.login(handle, "salah-sandi-1", "1.1.1.1"))).toBe(
      "INVALID_CREDENTIALS",
    );
    expect(await repo.findUserByHandle(handle)).toBeUndefined();
  });

  it("is never locked by the per-handle limit, while other handles still are", async () => {
    const { service } = setup({
      ...generous(),
      loginPerHandle: new FixedWindowLimiter(2, 60_000),
    });
    for (let i = 0; i < 6; i++)
      await service.login(handle, password, `10.0.0.${i}`);
    await service.register("anak_lain", "pelangi-biru-77", "9.9.9.9");
    await service.login("anak_lain", "pelangi-biru-77", "9.9.9.1");
    await service.login("anak_lain", "pelangi-biru-77", "9.9.9.2");
    expect(
      await code(service.login("anak_lain", "pelangi-biru-77", "9.9.9.3")),
    ).toBe("RATE_LIMITED");
  });

  it("keeps the per-IP limit for the demo account", async () => {
    const { service } = setup({
      ...generous(),
      loginPerIp: new FixedWindowLimiter(2, 60_000),
    });
    await service.login(handle, password, "5.5.5.5");
    await service.login(handle, password, "5.5.5.5");
    expect(await code(service.login(handle, password, "5.5.5.5"))).toBe(
      "RATE_LIMITED",
    );
  });

  it("cannot be registered by anyone else", () => {
    expect(handleSchema.safeParse(handle).success).toBe(false);
    expect(isDemoHandle(" Demo ")).toBe(true);
    expect(isDemoHandle("demo2")).toBe(false);
  });
});
