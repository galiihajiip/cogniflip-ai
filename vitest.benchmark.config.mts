import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Assessment benchmark (docs/implementation/BENCHMARK.md). Not part of `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["benchmark/**/*.run.ts"],
    environment: "node",
    fileParallelism: false,
  },
});
