import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests need real services (TEST_DATABASE_URL); see db/README.md.
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
    include: ["tests/integration/**/*.integration.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
