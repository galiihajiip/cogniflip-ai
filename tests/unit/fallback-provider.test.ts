import { describe, expect, it } from "vitest";
import { FallbackProvider } from "@/server/ai/fallback-provider";
import {
  providerError,
  type AiProvider,
  type ProviderResult,
} from "@/server/ai/provider";

function fake(
  result: ProviderResult,
  calls: string[],
  name: string,
): AiProvider {
  return {
    name: "gemini",
    mode: "live",
    generateStructured: async () => {
      calls.push(name);
      return result;
    },
  };
}
const ok = { ok: true } as unknown as ProviderResult;
const request = { timeoutMs: 60_000 } as Parameters<
  AiProvider["generateStructured"]
>[0];

describe("FallbackProvider", () => {
  it("moves to the next model only when one is overloaded or rate limited", async () => {
    const calls: string[] = [];
    const p = new FallbackProvider([
      fake(providerError("unavailable", 5), calls, "a"),
      fake(providerError("rate_limited", 5), calls, "b"),
      fake(ok, calls, "c"),
    ]);
    expect(await p.generateStructured(request)).toBe(ok);
    expect(calls).toEqual(["a", "b", "c"]);
  });

  it("moves on after a timeout and splits the time budget", async () => {
    const seen: number[] = [];
    const slow: AiProvider = {
      name: "gemini",
      mode: "live",
      generateStructured: async (r) => {
        seen.push(r.timeoutMs);
        return providerError("timeout", r.timeoutMs);
      },
    };
    const calls: string[] = [];
    const p = new FallbackProvider([slow, fake(ok, calls, "b")], () => 0);
    expect(await p.generateStructured(request)).toBe(ok);
    expect(seen).toEqual([30_000]);
    expect(calls).toEqual(["b"]);
  });

  it("does not mask other errors", async () => {
    const calls: string[] = [];
    const p = new FallbackProvider([
      fake(providerError("not_configured", 5), calls, "a"),
      fake(ok, calls, "b"),
    ]);
    expect(await p.generateStructured(request)).toMatchObject({
      ok: false,
      error: "not_configured",
    });
    expect(calls).toEqual(["a"]);
  });

  it("returns the last overload error when every model is busy", async () => {
    const calls: string[] = [];
    const p = new FallbackProvider([
      fake(providerError("unavailable", 5), calls, "a"),
      fake(providerError("unavailable", 5), calls, "b"),
    ]);
    expect(await p.generateStructured(request)).toMatchObject({
      ok: false,
      error: "unavailable",
    });
    expect(calls).toEqual(["a", "b"]);
  });
});
