import { createFileRoute, redirect } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/portal/AuthLayout";
import { useSignOut } from "@/components/portal/useSignOut";
import { authQuery } from "@/lib/auth";

// Signed in, but no profile (role + organization) has been set up for this account.
export const Route = createFileRoute("/no-access")({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(authQuery);
    if (!auth) throw redirect({ to: "/login" });
    if (auth.profile) throw redirect({ to: "/portal" });
    return { email: auth.email };
  },
  head: () => ({
    meta: [{ title: "No portal access | GonaInsured" }, { name: "robots", content: "noindex" }],
  }),
  component: NoAccessPage,
});

function NoAccessPage() {
  const { email } = Route.useRouteContext();
  const signOut = useSignOut();
  return (
    <AuthLayout
      title="No portal access yet"
      subtitle={`You're signed in as ${email ?? "an unknown email"}, but this account hasn't been given a portal.`}
    >
      <p className="text-sm text-muted-foreground">
        Ask your GonaInsured contact to set up your access, then sign in again.
      </p>
      <Button variant="outline" className="mt-6 w-full" onClick={signOut}>
        <LogOut /> Sign out
      </Button>
    </AuthLayout>
  );
}
