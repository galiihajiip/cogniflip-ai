import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { capabilityMatrix } from "@/server/code/capabilities";
import { capabilityMatrixResponseSchema } from "@/shared/api/code";

export const dynamic = "force-dynamic";

/** GET /api/code/capabilities: what CogniFlip can actually do per language. */
export const GET = withErrorHandling((_request, correlationId) =>
  contractResponse(
    capabilityMatrixResponseSchema,
    { ...capabilityMatrix(), correlationId },
    correlationId,
  ),
);
