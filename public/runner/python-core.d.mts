import type { PyodideAPI } from "pyodide";

export declare const RUN_LIMITS: Readonly<{
  timeoutMs: number;
  maxOutputChars: number;
  maxStdinChars: number;
  maxCodeChars: number;
}>;
export declare const BLOCKED_GLOBALS: readonly string[];
export declare function lockDown(scope: object): string[];
export declare function isolatePython(pyodide: PyodideAPI): void;
export declare function cleanTraceback(message: unknown): string;
export declare function describeError(traceback: string): {
  type: string;
  message: string;
  line: number | null;
};
export declare function runPython(
  pyodide: PyodideAPI,
  code: string,
  options?: {
    stdin?: string;
    maxOutputChars?: number;
    onOutput?: (stream: "stdout" | "stderr", text: string) => void;
  },
): Promise<{
  status: "ok" | "error" | "output_limit";
  error: {
    type: string;
    message: string;
    line: number | null;
    traceback: string;
  } | null;
}>;
