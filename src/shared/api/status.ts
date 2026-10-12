import { z } from "zod";

/** Integrations whose availability the app reports (GET /api/status). */
export const INTEGRATION_NAMES = [
  "ai",
  "database",
  "speechToText",
  "textToSpeech",
  "codeRunner",
  "errorReporting",
] as const;
export type IntegrationName = (typeof INTEGRATION_NAMES)[number];

export const integrationStatusSchema = z.discriminatedUnion("available", [
  z.strictObject({
    available: z.literal(true),
    /** Present only for the labelled development mock; never in production. */
    mode: z.literal("mock").optional(),
  }),
  z.strictObject({
    available: z.literal(false),
    reason: z.enum([
      "not_configured",
      "not_implemented",
      "unreachable",
      "disabled",
    ]),
  }),
]);
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

const correlationId = z.string().min(8).max(64);

/** GET /api/status */
export const statusResponseSchema = z.strictObject({
  status: z.literal("ok"),
  integrations: z.strictObject(
    Object.fromEntries(
      INTEGRATION_NAMES.map((name) => [name, integrationStatusSchema]),
    ) as Record<IntegrationName, typeof integrationStatusSchema>,
  ),
  correlationId,
});
export type StatusResponse = z.infer<typeof statusResponseSchema>;

/** GET /api/health/database */
export const databaseHealthResponseSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("ok"),
    latencyMs: z.number().int().min(0),
    correlationId,
  }),
  z.strictObject({
    status: z.literal("unavailable"),
    reason: z.enum(["not_configured", "unreachable"]),
    correlationId,
  }),
]);
export type DatabaseHealthResponse = z.infer<
  typeof databaseHealthResponseSchema
>;
