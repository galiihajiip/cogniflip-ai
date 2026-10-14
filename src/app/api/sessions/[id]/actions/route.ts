import { getServerEnv } from "@/server/config/env";
import { syncRewardsQuietly } from "@/server/rewards";
import { assertSameOrigin } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { resolveSessionContent } from "@/server/learning/session-content";
import {
  getOwnedSession,
  getTutor,
  requesterOwnerHash,
  requesterRateKey,
} from "@/server/learning/service";
import { toLearnerView } from "@/server/learning/session/view";
import {
  sessionActionRequestSchema,
  sessionResponseSchema,
} from "@/shared/api/learning";
import { sessionIdSchema } from "@/shared/schemas/primitives";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/sessions/:id/actions
 * { type: view_concept | begin | revise | complete, expectedVersion }
 * { type: submit, expectedVersion, answer, idempotencyKey }
 */
export const POST = withErrorHandling<Ctx>(
  async (request, correlationId, { params }) => {
    const env = getServerEnv();
    assertSameOrigin(request, env);
    const id = parseInput(sessionIdSchema, (await params).id);
    const action = parseInput(
      sessionActionRequestSchema,
      await readJsonBody(request),
    );
    // Ownership first: a non-owner learns nothing about the session.
    const owner = await requesterOwnerHash(request, env);
    await getOwnedSession(env, id, owner);
    const { engine } = getTutor(env);

    const session =
      action.type === "submit"
        ? await engine.submit(id, {
            ...action,
            rateLimitKey: await requesterRateKey(request, env, owner!),
          })
        : action.type === "view_concept"
          ? await engine.viewConcept(id, action.expectedVersion)
          : action.type === "begin"
            ? await engine.beginExplanation(id, action.expectedVersion)
            : action.type === "revise"
              ? await engine.startRevision(id, action.expectedVersion)
              : await engine.complete(id, action.expectedVersion);

    // Rewards come only from the server's own stored results (BLOCK 31).
    await syncRewardsQuietly(env, session.ownerUserId);

    const { lesson, rubric } = resolveSessionContent(session);
    return contractResponse(
      sessionResponseSchema,
      { session: toLearnerView(session, lesson, rubric), correlationId },
      correlationId,
    );
  },
);
