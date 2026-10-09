import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

// Browser client: keeps the session in cookies, so the server sees the same sign-in.
// URL detection is off: the invite and reset pages read their links themselves
// (components/portal/SetPasswordForm.tsx), so no other page acts on URL tokens.
let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    const { url, key } = supabaseEnv();
    client = createBrowserClient(url, key, { auth: { detectSessionInUrl: false } });
  }
  return client;
}

// Used only to request password reset emails. The cookie client above uses PKCE, whose reset
// link works only in the browser that asked for it (it holds the code verifier); people often
// ask on a computer and open the email on a phone. With the implicit flow the link carries the
// session in its #hash, which /auth/reset sets on the cookie client (SetPasswordForm.tsx),
// the same way as the invite link. It stores nothing itself.
let resetClient: SupabaseClient | undefined;

export function getSupabaseResetClient(): SupabaseClient {
  if (!resetClient) {
    const { url, key } = supabaseEnv();
    resetClient = createClient(url, key, {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return resetClient;
}
