/** Public (browser-safe) configuration. Only NEXT_PUBLIC_* values; never secrets or service-role keys. */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

/** Names of required variables that are missing (names only, never values). */
export function missingEnv(): string[] {
  const missing: string[] = [];
  if (!env.apiBaseUrl) missing.push("NEXT_PUBLIC_API_BASE_URL");
  return missing;
}
