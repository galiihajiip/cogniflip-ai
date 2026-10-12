import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Module boundaries (docs/implementation/MODULE_BOUNDARIES.md).
const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Leading underscore marks an intentionally unused binding.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Shared schemas run on client and server: no server, framework or UI code.
    files: ["src/shared/**"],
    rules: restrict([
      {
        group: ["@/server/*", "@/app/*", "server-only"],
        message: "src/shared must not depend on server or app code.",
      },
      {
        group: ["next", "next/*", "react", "react-dom", "pg"],
        message: "src/shared must stay framework- and driver-free.",
      },
    ]),
  },
  {
    // Domain and server services: no React, no Next.js, no route modules.
    files: ["src/server/**"],
    rules: restrict([
      {
        group: ["@/app/*", "react", "react-dom", "next", "next/*"],
        message:
          "Keep domain logic out of UI and framework code; route handlers call services, not the reverse.",
      },
    ]),
  },
  {
    // Pages, components and route handlers reach the database only via services.
    files: ["src/app/**"],
    rules: restrict([
      {
        group: ["pg", "@/server/db/migrator*"],
        message:
          "Use a service in src/server instead of the database driver directly.",
      },
    ]),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Pyodide runtime copied from node_modules.
    "public/pyodide/**",
    "public/sqljs/**",
  ]),
]);

export default eslintConfig;
