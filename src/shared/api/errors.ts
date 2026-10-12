import { z } from "zod";

/** Stable error codes (docs/07_API_CONTRACTS.md §9). */
export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
  "INVALID_MODEL_OUTPUT",
  "ASSESSMENT_INSUFFICIENT_EVIDENCE",
  "UNSUPPORTED_TOOLCHAIN",
  "EXECUTION_REJECTED",
  "EXECUTION_TIMEOUT",
  "ROOM_EXPIRED",
  "ROOM_VERSION_CONFLICT",
  "CONTENT_RESTRICTED",
  "INTERNAL_ERROR",
] as const;
export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** Machine-readable reasons for a rejected field. Never contains input values. */
export const FIELD_ISSUES = [
  "required",
  "invalid_type",
  "too_short",
  "too_long",
  "too_small",
  "too_large",
  "invalid_format",
  "invalid_value",
  "unknown_field",
  "invalid",
] as const;

export const fieldIssueSchema = z.strictObject({
  /** Dot path of the field, e.g. `answer` or `items.0.title`. */
  path: z.string().max(200),
  issue: z.enum(FIELD_ISSUES),
});
export type FieldIssue = z.infer<typeof fieldIssueSchema>;

export const MAX_FIELD_ISSUES = 20;

/** The only detail keys a client may ever receive. */
export const safeDetailsSchema = z.strictObject({
  integration: z.string().max(40).optional(),
  field: z.string().max(200).optional(),
  fields: z.array(fieldIssueSchema).max(MAX_FIELD_ISSUES).optional(),
  retryAfterSeconds: z.number().int().min(0).max(86_400).optional(),
});
export type SafeDetails = z.infer<typeof safeDetailsSchema>;

export const errorEnvelopeSchema = z.strictObject({
  error: z.strictObject({
    code: errorCodeSchema,
    message: z.string().min(1).max(300),
    retryable: z.boolean(),
    correlationId: z.string().min(8).max(64),
    details: safeDetailsSchema.optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
