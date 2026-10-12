import { z } from "zod";

export const AVATAR_KEYS = [
  "robot-biru",
  "robot-hijau",
  "kucing",
  "burung-hantu",
  "roket",
  "bintang",
] as const;

export const preferencesSchema = z.strictObject({
  reducedMotion: z.boolean().optional(),
  textSize: z.enum(["normal", "besar"]).optional(),
});

/** Own profile: the only fields a learner can see and edit about themselves. */
export const ownProfileSchema = z.strictObject({
  handle: z.string(),
  avatarKey: z.enum(AVATAR_KEYS),
  leaderboardOptIn: z.boolean(),
  preferences: preferencesSchema,
});

/** PATCH body: handle and role are deliberately not editable here. */
export const profileUpdateSchema = z
  .strictObject({
    avatarKey: z.enum(AVATAR_KEYS).optional(),
    leaderboardOptIn: z.boolean().optional(),
    preferences: preferencesSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "empty_update" });

/** Public allowlist: nothing beyond a pseudonym and a preset avatar. */
export const publicProfileSchema = z.strictObject({
  handle: z.string(),
  avatarKey: z.enum(AVATAR_KEYS),
});

export const ownProfileResponseSchema = z.strictObject({
  profile: ownProfileSchema,
  correlationId: z.string(),
});
export const publicProfileResponseSchema = z.strictObject({
  profile: publicProfileSchema,
  correlationId: z.string(),
});

export const deleteAccountRequestSchema = z.strictObject({
  /** Re-entering the password confirms the deletion. */
  password: z.string().min(1).max(128),
  confirm: z.literal("HAPUS"),
});
