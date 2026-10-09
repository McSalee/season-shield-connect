// Supabase project the portals talk to. Only the publishable key belongs in this app:
// it is public by design and row-level security decides what each user can read.
// The service role / secret key must never be added here.
export const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as
  string | undefined;

export function supabaseEnv(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).");
  }
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}
