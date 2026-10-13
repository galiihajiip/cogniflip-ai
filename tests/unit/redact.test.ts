import { describe, expect, it } from "vitest";
import { REDACTED, redact, redactString } from "@/server/log/redact";

// Assembled at runtime so repository secret scans do not flag test fixtures.
const anthropicLike = "sk-" + "ant-" + "a1B2c3D4e5F6g7H8i9";
const googleLike = "AI" + "za" + "SyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q";
const jwtLike = [
  "eyJ" + "hbGciOiJIUzI1NiJ9",
  "eyJzdWIiOiIxMjM0NSJ9",
  "c2lnbmF0dXJl",
].join(".");

describe("redactString", () => {
  it("removes known secret values wherever they appear", () => {
    expect(
      redactString("call failed with key my-secret-value!", [
        "my-secret-value",
      ]),
    ).toBe(`call failed with key ${REDACTED}!`);
  });

  it.each([
    ["an Anthropic-style key", `key=${anthropicLike}`],
    ["a Google API key", `key=${googleLike}`],
    ["a bearer token", "Authorization: Bearer abc.def-123"],
    ["a JWT", `token ${jwtLike}`],
  ])("removes %s by pattern", (_label, input) => {
    const output = redactString(input);
    expect(output).toContain(REDACTED);
    expect(output).not.toMatch(/a1B2c3D4|abc\.def-123|c2lnbmF0dXJl|SyA1b2C3/);
  });

  it("removes the password from a connection string but keeps the host", () => {
    expect(redactString("postgresql://app:p4ssw0rd@db.example:5432/app")).toBe(
      `postgresql://app:${REDACTED}@db.example:5432/app`,
    );
  });

  it("leaves ordinary text unchanged", () => {
    expect(redactString("Lesson loops-01 saved")).toBe("Lesson loops-01 saved");
  });
});

describe("redact", () => {
  it("redacts sensitive keys at any depth, including arrays", () => {
    const output = redact({
      code: "PROVIDER_UNAVAILABLE",
      headers: { authorization: "Bearer x", "x-api-key": "k" },
      attempts: [{ password: "p", note: "ok" }],
    });
    expect(output).toEqual({
      code: "PROVIDER_UNAVAILABLE",
      headers: { authorization: REDACTED, "x-api-key": REDACTED },
      attempts: [{ password: REDACTED, note: "ok" }],
    });
  });

  it("serializes errors with redacted message and stack", () => {
    const error = new Error("upstream rejected key topsecret-123456");
    const output = redact({ cause: error }, ["topsecret-123456"]) as {
      cause: { name: string; message: string; stack?: string };
    };
    expect(output.cause.name).toBe("Error");
    expect(output.cause.message).toBe(`upstream rejected key ${REDACTED}`);
    expect(output.cause.stack ?? "").not.toContain("topsecret-123456");
  });

  it("does not loop on circular references", () => {
    const node: Record<string, unknown> = { name: "a" };
    node.self = node;
    expect(redact(node)).toEqual({ name: "a", self: "[Circular]" });
  });
});
