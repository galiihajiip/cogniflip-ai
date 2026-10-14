import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import { getServerEnv } from "@/server/config/env";
import { AppError } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import {
  contractResponse,
  withCookie,
  withErrorHandling,
} from "@/server/http/respond";
import {
  requesterForCreate,
  requesterRateKey,
} from "@/server/learning/service";
import { getMissionService } from "@/server/missions";
import { getMission } from "@/server/missions/service";
import { syncRewardsQuietly } from "@/server/rewards";
import {
  missionAttemptRequestSchema,
  missionAttemptResponseSchema,
} from "@/shared/api/missions";
import { slugSchema } from "@/shared/schemas/primitives";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// Bounds storage growth: 30 mission attempts per learner per minute (per instance).
const attemptLimiter = new FixedWindowLimiter(30, 60_000);

/**
 * POST /api/missions/:id/attempts { type: predict|reflect|diagnose, answer, idempotencyKey }
 * Each attempt is stored separately. Predictions are compared with the
 * reviewed fixture (execution is disabled); diagnoses are judged by AI
 * against the reviewed answer key. XP comes only from stored outcomes.
 */
export const POST = withErrorHandling<Ctx>(
  async (request, correlationId, { params }) => {
    const env = getServerEnv();
    assertSameOrigin(request, env);
    const mission = getMission(env, parseInput(slugSchema, (await params).id));
    const input = parseInput(
      missionAttemptRequestSchema,
      await readJsonBody(request),
    );
    const identity = await requesterForCreate(request, env);
    const owner = {
      ...identity,
      rateKey: await requesterRateKey(request, env, identity.keyHash),
    };
    const limit = attemptLimiter.check(owner.rateKey);
    if (!limit.allowed)
      throw new AppError("RATE_LIMITED", "too many mission attempts", {
        details: { retryAfterSeconds: limit.retryAfterSeconds },
      });
    const service = getMissionService(env);

    let result;
    if (input.type === "reflect") {
      result = {
        type: "reflect" as const,
        ...(await service.reflect(
          owner,
          mission,
          input.answer,
          input.idempotencyKey,
        )),
      };
    } else if (input.type === "predict") {
      if (mission.kind !== "predict")
        throw new AppError("VALIDATION_ERROR", "not a predict mission", {
          details: { field: "type" },
        });
      result = {
        type: "predict" as const,
        ...(await service.predict(
          owner,
          mission,
          input.answer,
          input.idempotencyKey,
        )),
      };
    } else {
      if (mission.kind !== "debug")
        throw new AppError("VALIDATION_ERROR", "not a debug mission", {
          details: { field: "type" },
        });
      result = {
        type: "diagnose" as const,
        ...(await service.diagnose(
          owner,
          mission,
          input.answer,
          input.idempotencyKey,
        )),
      };
    }
    await syncRewardsQuietly(env, owner.userId);
    return withCookie(
      contractResponse(
        missionAttemptResponseSchema,
        { result, correlationId },
        correlationId,
      ),
      owner.setCookie,
    );
  },
);
