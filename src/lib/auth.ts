import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase/server";

// Portal roles, as stored in public.profiles.role. A user's portal follows from it.
export type Role = "admin" | "cooperative" | "insurer";

export type Profile = {
  role: Role;
  fullName: string | null;
  organization: { name: string; kind: string } | null;
};

// null = signed out; profile null = signed in but not set up (no portal access).
export type AuthState = { userId: string; email: string | null; profile: Profile | null } | null;

export const ROLE_HOME = {
  admin: "/admin",
  cooperative: "/cooperative",
  insurer: "/insurer",
} as const;

export const ROLE_LABEL: Record<Role, string> = {
  admin: "GonaInsured admin",
  cooperative: "Cooperative",
  insurer: "Insurer",
};

export const fetchAuth = createServerFn({ method: "GET" }).handler(async (): Promise<AuthState> => {
  const supabase = getSupabaseServerClient();
  // getUser() checks the session with Supabase Auth rather than trusting the cookie.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: row } = await supabase
    .from("profiles")
    .select("role, full_name, organizations(name, kind)")
    .eq("id", data.user.id)
    .maybeSingle();
  const org = row?.organizations as unknown as { name: string; kind: string } | null | undefined;
  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    profile: row
      ? { role: row.role as Role, fullName: row.full_name, organization: org ?? null }
      : null,
  };
});

export const authQuery = queryOptions({
  queryKey: ["auth"],
  queryFn: () => fetchAuth(),
  staleTime: 30_000,
});

// For a layout route's beforeLoad: signed out -> /login, no profile -> /no-access,
// wrong role -> that user's own portal.
export async function requireRole(
  queryClient: QueryClient,
  href: string,
  allowed: readonly Role[],
) {
  const auth = await queryClient.ensureQueryData(authQuery);
  if (!auth) throw redirect({ to: "/login", search: { redirect: href } });
  if (!auth.profile) throw redirect({ to: "/no-access" });
  if (!allowed.includes(auth.profile.role)) throw redirect({ to: ROLE_HOME[auth.profile.role] });
  return { ...auth, profile: auth.profile };
}

// Only same-site paths are allowed after sign-in (no open redirects).
export function safeRedirect(target: unknown): string {
  return typeof target === "string" && /^\/(?![/\\])/.test(target) ? target : "/portal";
}

export const PASSWORD_RULES =
  "At least 10 characters, with a lower-case letter, a capital letter and a digit.";

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
    return PASSWORD_RULES;
  return null;
}

// Search params of the invite and password-reset links.
export const tokenSearch = (
  s: Record<string, unknown>,
): { token_hash?: string; code?: string } => ({
  ...(typeof s["token_hash"] === "string" ? { token_hash: s["token_hash"] } : {}),
  ...(typeof s["code"] === "string" ? { code: s["code"] } : {}),
});
