// Copies in-browser runtimes from node_modules into public/ so the browser
// loads them from this site (no third-party CDN). Runs before dev/build.
// - Pyodide (MPL-2.0): Python for the Mini IDE (D-012)
// - sql.js (MIT): SQLite compiled to WebAssembly for SQL (D-015)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function copy(pkg: string, from: string, to: string, files: string[]) {
  const source = join("node_modules", pkg, from);
  const { version } = JSON.parse(
    readFileSync(join("node_modules", pkg, "package.json"), "utf8"),
  ) as { version: string };
  mkdirSync(to, { recursive: true });
  for (const file of files) copyFileSync(join(source, file), join(to, file));
  writeFileSync(
    join(to, "VERSION"),
    `${pkg} ${version}, copied from node_modules by scripts/copy-runtimes.mts\n`,
  );
  console.log(`${pkg} ${version} copied to ${to}`);
}

copy("pyodide", "", join("public", "pyodide"), [
  "pyodide.mjs",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
]);
copy("sql.js", "dist", join("public", "sqljs"), [
  "sql-wasm.js",
  "sql-wasm.wasm",
]);
