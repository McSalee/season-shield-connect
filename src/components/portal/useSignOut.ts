import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// Signs out, drops every cached query (another user's data must not linger), back to /login.
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    await getSupabaseBrowserClient().auth.signOut();
    queryClient.clear();
    await router.navigate({ to: "/login" });
  };
}
