// Runs once when a Next.js server instance starts. Invalid configuration stops
// startup with a list of variable names and problems (never values).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getServerEnv } = await import("@/server/config/env");
    getServerEnv();
  }
}
