import { z } from "zod";

/**
 * Pseudonymous handle (D-010): 3–20 characters, starts with a letter, only
 * a–z, 0–9 and underscore. Stored lower-case. Rejects strings that look like
 * contact details (long digit runs) and reserved staff-like names.
 */
const RESERVED = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "cogniflip",
  "robi",
  "flipbot",
  // Reserved for the public demo account (D-014); created by the server.
  "demo",
  "guru",
  "system",
  "support",
]);

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z][a-z0-9_]{2,19}$/)
  .refine((h) => !/\d{6,}/.test(h), { message: "looks_like_contact_details" })
  .refine((h) => !RESERVED.has(h.replace(/_/g, "")), { message: "reserved" });

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "qwertyui",
  "qwerty123",
  "11111111",
  "00000000",
  "abcdefgh",
  "iloveyou",
  "sayangku",
  "rahasia1",
  "katasandi",
]);

export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), {
    message: "too_common",
  });

export const credentialsRequestSchema = z.strictObject({
  handle: handleSchema,
  password: passwordSchema,
});

/** Login does not apply password-strength rules (they may have changed). */
export const loginRequestSchema = z.strictObject({
  handle: z.string().trim().toLowerCase().min(1).max(40),
  password: z.string().min(1).max(128),
});

export const authUserSchema = z.strictObject({
  handle: z.string(),
  role: z.enum(["learner", "moderator", "admin"]),
});

export const meResponseSchema = z.strictObject({
  user: authUserSchema.nullable(),
  correlationId: z.string(),
});
