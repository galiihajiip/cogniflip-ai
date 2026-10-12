/**
 * Public demo account (D-014). Intentionally hard-coded and shown on the
 * sign-in page so judges and visitors can try every feature. It is an
 * ordinary learner account: no moderator or admin rights.
 */
export const DEMO_ACCOUNT = {
  handle: "demo",
  password: "FlipBot-Juara-2026",
} as const;

export function isDemoHandle(handle: string | null | undefined): boolean {
  return handle?.trim().toLowerCase() === DEMO_ACCOUNT.handle;
}
