import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/portal/AuthLayout";
import { SetPasswordForm } from "@/components/portal/SetPasswordForm";
import { tokenSearch } from "@/lib/auth";

// Landing page of the password reset email (sent from /auth/forgot).
export const Route = createFileRoute("/auth/reset")({
  validateSearch: tokenSearch,
  head: () => ({
    meta: [
      { title: "Choose a new password | GonaInsured" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token_hash, code } = Route.useSearch();
  return (
    <AuthLayout title="Choose a new password">
      <SetPasswordForm
        tokenHash={token_hash}
        code={code}
        type="recovery"
        submitLabel="Save password and sign in"
      />
    </AuthLayout>
  );
}
