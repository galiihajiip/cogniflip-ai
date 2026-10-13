import "server-only";

/**
 * Gemini's `responseJsonSchema` accepts only a subset of JSON Schema (per the
 * @google/genai 2.25 type docs): $id, $defs, $ref, $anchor, type, format,
 * title, description, enum, items, prefixItems, minItems, maxItems, minimum,
 * maximum, anyOf, oneOf, properties, additionalProperties, required.
 *
 * This converts a zod-generated schema to that subset: `const` becomes a
 * one-value `enum`; unsupported keywords (minLength, maxLength, pattern,
 * maxItems, $schema, …) are dropped. Dropped constraints are still enforced because
 * every response is re-validated with the original zod schema.
 */
const SUPPORTED = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  // maxItems is documented but rejected with 400 INVALID_ARGUMENT by the
  // live API for the code-review schema (verified 2026-10-15); the zod
  // re-validation still enforces it.
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
]);

export function toGeminiJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiJsonSchema);
  if (!schema || typeof schema !== "object") return schema;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(
    schema as Record<string, unknown>,
  )) {
    if (key === "const") {
      out.enum = [value];
      continue;
    }
    if (!SUPPORTED.has(key)) continue;
    if (key === "properties" || key === "$defs") {
      out[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          toGeminiJsonSchema(v),
        ]),
      );
    } else if (key === "additionalProperties" && typeof value === "boolean") {
      out[key] = value;
    } else {
      out[key] = toGeminiJsonSchema(value);
    }
  }
  return out;
}
