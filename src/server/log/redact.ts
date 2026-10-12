import "server-only";

export const REDACTED = "[REDACTED]";

const SENSITIVE_KEY =
  /(api[_-]?key|secret|token|password|passwd|authorization|cookie|dsn|service[_-]?role|credential|private[_-]?key)/i;

const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/sk-ant-[A-Za-z0-9_-]{8,}/g, REDACTED],
  [/\bsk-[A-Za-z0-9_-]{16,}/g, REDACTED],
  // Google API keys (Gemini), e.g. AIza...
  [/\bAIza[0-9A-Za-z_-]{30,}/g, REDACTED],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g, REDACTED],
  // Credentials inside connection strings: scheme://user:password@host
  [/(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)[^\s@/]+@/gi, `$1${REDACTED}@`],
];

export function redactString(
  input: string,
  secretValues: readonly string[] = [],
): string {
  let output = input;
  for (const secret of secretValues) {
    if (secret) output = output.split(secret).join(REDACTED);
  }
  for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

/** Returns a redacted deep copy suitable for server logs. */
export function redact(
  value: unknown,
  secretValues: readonly string[] = [],
): unknown {
  const seen = new WeakSet<object>();

  const walk = (current: unknown, key?: string): unknown => {
    if (key !== undefined && SENSITIVE_KEY.test(key)) return REDACTED;
    if (typeof current === "string") return redactString(current, secretValues);
    if (current === null || typeof current !== "object") return current;
    if (seen.has(current)) return "[Circular]";
    seen.add(current);

    if (current instanceof Error) {
      return {
        name: current.name,
        message: redactString(current.message, secretValues),
        stack: current.stack
          ? redactString(current.stack, secretValues)
          : undefined,
      };
    }
    if (Array.isArray(current)) return current.map((item) => walk(item));
    return Object.fromEntries(
      Object.entries(current).map(([k, v]) => [k, walk(v, k)]),
    );
  };

  return walk(value);
}
