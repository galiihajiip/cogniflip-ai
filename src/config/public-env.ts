/**
 * Browser-safe configuration. Only `NEXT_PUBLIC_*` values may be added here;
 * Next.js inlines them into the client bundle at build time, so each must be
 * referenced literally (`process.env.NEXT_PUBLIC_X`) and must never be a secret.
 *
 * No public variables are needed yet (D-006 dropped the Supabase client keys).
 */
export const PUBLIC_VARIABLES = [] as const;
