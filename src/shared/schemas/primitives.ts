import { z } from "zod";

/**
 * Reusable runtime schemas for untrusted input. Shared by server and client;
 * must not import server-only modules. TypeScript types are inferred from these
 * schemas, never declared separately.
 */

/** Database-generated identifiers (sessions, attempts, users, projects). */
export const uuidSchema = z.uuid();
export const sessionIdSchema = uuidSchema;
export type SessionId = z.infer<typeof sessionIdSchema>;

/** Human-readable content identifiers, e.g. lesson slugs: `urutan-instruksi`. */
export const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** ISO 8601 UTC timestamp with a trailing `Z`, e.g. `2026-10-13T01:02:03.000Z`. */
export const timestampSchema = z.iso.datetime();
export type Timestamp = z.infer<typeof timestampSchema>;

export const LOCALES = ["id-ID"] as const;
export const localeSchema = z.enum(LOCALES);

// Control characters except tab (\t), line feed (\n) and carriage return (\r).
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/**
 * Free text from a learner or user: Unicode-normalized (NFC), trimmed, free of
 * control characters, and length-bounded. Length is counted in UTF-16 code
 * units, which is conservative for emoji and other astral characters.
 */
export function boundedText(options: { min?: number; max: number }) {
  return z
    .string()
    .normalize("NFC")
    .trim()
    .min(options.min ?? 1)
    .max(options.max)
    .refine((value) => !CONTROL_CHARACTERS.test(value), {
      message: "control_characters",
    });
}

/** Shared length limits so every layer enforces the same numbers. */
export const TEXT_LIMITS = {
  /** A learner's explanation or revision. */
  explanation: 2_000,
  /** A short label such as a handle or title. */
  shortLabel: 80,
} as const;
