import { z } from "zod";

/** Cursor pagination for list endpoints. Cursors are opaque to clients. */
export const PAGE_SIZE = { default: 20, max: 50 } as const;

export const paginationQuerySchema = z.strictObject({
  cursor: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9_-]+$/)
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE.max)
    .default(PAGE_SIZE.default),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function pageSchema<Item extends z.ZodType>(item: Item) {
  return z.strictObject({
    items: z.array(item).max(PAGE_SIZE.max),
    nextCursor: z.string().nullable(),
  });
}
