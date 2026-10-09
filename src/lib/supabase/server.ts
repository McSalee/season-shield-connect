import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { supabaseEnv } from "./env";

// Server client for server functions: reads the signed-in user's session cookies and
// queries as that user, so row-level security applies exactly as in the browser.
export function getSupabaseServerClient() {
  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll: () =>
        Object.entries(getCookies()).map(([name, value]) => ({ name, value: value ?? "" })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value, options }) => setCookie(name, value, options)),
    },
  });
}
