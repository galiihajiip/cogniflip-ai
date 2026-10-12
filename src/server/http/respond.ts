import "server-only";
import type { z } from "zod";
import { safeDetailsSchema } from "@/shared/api/errors";
import {
  AppError,
  ERROR_DEFINITIONS,
  type ErrorEnvelope,
} from "@/server/http/errors";
import { logServerEvent } from "@/server/log/logger";

export const CORRELATION_HEADER = "x-correlation-id";
const INCOMING_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Reuses a well-formed incoming request ID, otherwise creates a new one. */
export function getCorrelationId(request: Request): string {
  const incoming =
    request.headers.get("x-request-id") ??
    request.headers.get(CORRELATION_HEADER);
  return incoming && INCOMING_ID.test(incoming)
    ? incoming
    : crypto.randomUUID();
}

export function jsonResponse(
  body: unknown,
  correlationId: string,
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: {
      [CORRELATION_HEADER]: correlationId,
      "cache-control": "no-store",
    },
  });
}

/**
 * Converts any thrown value into the safe error envelope. Diagnostic detail is
 * written to the server log (redacted); the client only sees the stable code,
 * the user-facing message and allowlisted details.
 */
export function errorResponse(error: unknown, correlationId: string): Response {
  const appError =
    error instanceof AppError
      ? error
      : new AppError("INTERNAL_ERROR", "Unhandled error", { cause: error });
  const definition = ERROR_DEFINITIONS[appError.code];
  // Details are allowlisted; anything outside the shared contract is dropped.
  const parsedDetails = safeDetailsSchema.safeParse(appError.details);
  const details =
    appError.details !== undefined && parsedDetails.success
      ? parsedDetails.data
      : undefined;

  logServerEvent(definition.status >= 500 ? "error" : "warn", "api_error", {
    correlationId,
    code: appError.code,
    internalMessage: appError.message,
    cause: appError.cause,
    droppedUnsafeDetails: appError.details !== undefined && !details,
  });

  const body: ErrorEnvelope = {
    error: {
      code: appError.code,
      message: definition.message,
      retryable: definition.retryable,
      correlationId,
      ...(details ? { details } : {}),
    },
  };
  return jsonResponse(body, correlationId, definition.status);
}

/**
 * Sends a success body only after checking it against its response contract.
 * Strict contracts reject unexpected fields, so internal data cannot leak by
 * accident; a mismatch is a server bug and becomes INTERNAL_ERROR.
 */
export function contractResponse<S extends z.ZodType>(
  schema: S,
  body: z.input<S>,
  correlationId: string,
  status = 200,
): Response {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Response did not match its contract",
      { cause: result.error },
    );
  }
  return jsonResponse(result.data, correlationId, status);
}

type Handler<Ctx> = (
  request: Request,
  correlationId: string,
  context: Ctx,
) => Promise<Response> | Response;

/** Wraps a route handler so every failure returns the safe envelope. */
export function withErrorHandling<Ctx = unknown>(handler: Handler<Ctx>) {
  // Static routes are called without a context argument.
  return async (request: Request, context?: Ctx): Promise<Response> => {
    const correlationId = getCorrelationId(request);
    const started = performance.now();
    let response: Response;
    try {
      response = await handler(request, correlationId, context as Ctx);
    } catch (error) {
      response = errorResponse(error, correlationId);
    }
    // Path only: no query string, body, cookies or headers.
    logServerEvent("info", "api_request", {
      correlationId,
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
    });
    return response;
  };
}

/** Adds a Set-Cookie header to a response (e.g. a new guest identity). */
export function withCookie(response: Response, setCookie?: string): Response {
  if (setCookie) response.headers.append("set-cookie", setCookie);
  return response;
}
