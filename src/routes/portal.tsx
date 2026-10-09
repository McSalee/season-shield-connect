import { createFileRoute, redirect } from "@tanstack/react-router";
import { authQuery, ROLE_HOME } from "@/lib/auth";

// Entry point after sign-in: sends each user to their own portal.
export const Route = createFileRoute("/portal")({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(authQuery);
    if (!auth) throw redirect({ to: "/login" });
    if (!auth.profile) throw redirect({ to: "/no-access" });
    throw redirect({ to: ROLE_HOME[auth.profile.role] });
  },
});
