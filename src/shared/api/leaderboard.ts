import { z } from "zod";
import { AVATAR_KEYS } from "@/shared/api/profile";

export const leaderboardQuerySchema = z.strictObject({
  period: z.enum(["weekly", "all"]).default("weekly"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const leaderboardResponseSchema = z.strictObject({
  period: z.enum(["weekly", "all"]),
  periodStart: z.string().nullable(),
  rules: z.string(),
  entries: z.array(
    z.strictObject({
      rank: z.number().int().min(1),
      handle: z.string(),
      avatarKey: z.enum(AVATAR_KEYS),
      xp: z.number().int().min(0),
    }),
  ),
  nextOffset: z.number().int().nullable(),
  me: z
    .discriminatedUnion("optedIn", [
      z.strictObject({ optedIn: z.literal(false) }),
      z.strictObject({
        optedIn: z.literal(true),
        rank: z.number().int().nullable(),
        xp: z.number().int(),
      }),
    ])
    .nullable(),
  correlationId: z.string(),
});
