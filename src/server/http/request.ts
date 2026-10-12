import "server-only";
import type { z } from "zod";
import { MAX_FIELD_ISSUES, type FieldIssue } from "@/shared/api/errors";
import { AppError } from "@/server/http/errors";

/** Default maximum JSON body size for API requests. */
export const DEFAULT_MAX_BODY_BYTES = 16 * 1024;

function bodyError(issue: FieldIssue["issue"], internal: string): AppError {
  return new AppError("VALIDATION_ERROR", internal, {
    details: { fields: [{ path: "(body)", issue }] },
  });
}

/**
 * Reads a JSON request body with a hard byte limit. The body is streamed and
 * abandoned as soon as it exceeds the limit, regardless of Content-Length.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(\s*;|$)/i.test(contentType)) {
    throw bodyError("invalid_type", "Content-Type must be application/json");
  }
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw bodyError("too_long", "Declared body exceeds limit");
  }
  if (!request.body) throw bodyError("required", "Missing request body");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw bodyError("too_long", "Body exceeds limit");
    }
    chunks.push(value);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks),
    );
  } catch {
    throw bodyError("invalid_format", "Body is not valid UTF-8");
  }
  if (text.trim() === "") throw bodyError("required", "Empty request body");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw bodyError("invalid_format", "Body is not valid JSON");
  }
}

function toPath(path: readonly PropertyKey[]): string {
  return path.length === 0 ? "(root)" : path.map(String).join(".");
}

/** Converts schema issues into field issues that never contain input values. */
export function toFieldIssues(
  issues: readonly z.core.$ZodIssue[],
): FieldIssue[] {
  const out: FieldIssue[] = [];
  for (const issue of issues) {
    const path = toPath(issue.path);
    switch (issue.code) {
      case "invalid_type":
        out.push({
          path,
          issue: issue.input === undefined ? "required" : "invalid_type",
        });
        break;
      case "too_small":
        out.push({
          path,
          issue:
            issue.origin === "string" || issue.origin === "array"
              ? "too_short"
              : "too_small",
        });
        break;
      case "too_big":
        out.push({
          path,
          issue:
            issue.origin === "string" || issue.origin === "array"
              ? "too_long"
              : "too_large",
        });
        break;
      case "invalid_format":
        out.push({ path, issue: "invalid_format" });
        break;
      case "invalid_value":
        out.push({ path, issue: "invalid_value" });
        break;
      case "unrecognized_keys":
        for (const key of issue.keys)
          out.push({
            path: toPath([...issue.path, key]),
            issue: "unknown_field",
          });
        break;
      default:
        out.push({ path, issue: "invalid" });
    }
  }
  return out.slice(0, MAX_FIELD_ISSUES);
}

/**
 * Validates untrusted input (HTTP body, query, model output) at runtime.
 * Throws VALIDATION_ERROR listing field paths and issue codes only.
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.infer<S> {
  // reportInput lets us tell "missing" from "wrong type"; inputs are never
  // copied into the error that leaves this function.
  const result = schema.safeParse(input, { reportInput: true });
  if (result.success) return result.data;
  throw new AppError("VALIDATION_ERROR", "Request failed validation", {
    details: { fields: toFieldIssues(result.error.issues) },
  });
}
