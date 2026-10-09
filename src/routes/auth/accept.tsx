import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/portal/AuthLayout";
import { SetPasswordForm } from "@/components/portal/SetPasswordForm";
import { tokenSearch } from "@/lib/auth";

// Landing page of the invite email. tools/invite_user.py (gonainsured-mvp) sends invites
// with redirect_to = <portal>/auth/accept.
export const Route = createFileRoute("/auth/accept")({
  validateSearch: tokenSearch,
  head: () => ({
    meta: [{ title: "Accept invitation | GonaInsured" }, { name: "robots", content: "noindex" }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token_hash } = Route.useSearch();
  return (
    <AuthLayout
      title="Welcome to GonaInsured"
      subtitle="Choose a password to finish setting up your account."
    >
      <SetPasswordForm
        tokenHash={token_hash}
        type="invite"
        submitLabel="Set password and continue"
      />
    </AuthLayout>
  );
}
