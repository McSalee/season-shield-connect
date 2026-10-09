import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FormError } from "@/components/portal/AuthLayout";
import { getSupabaseResetClient } from "@/lib/supabase/browser";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [{ title: "Reset password | GonaInsured" }, { name: "robots", content: "noindex" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    // The emailed link returns to /auth/reset#access_token=... (must be in the auth redirect
    // allow-list); it works in any browser, not only this one.
    const { error } = await getSupabaseResetClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    // Same answer whether or not the account exists; only rate limits are reported.
    if (error && error.status === 429)
      return setError("Too many requests. Wait a few minutes and try again.");
    setSent(true);
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={sent ? undefined : "We'll email you a link to choose a new password."}
    >
      {sent ? (
        <div className="space-y-4 text-sm">
          <p className="flex gap-2">
            <MailCheck className="size-5 shrink-0 text-leaf" /> If that email has a GonaInsured
            account, a reset link is on its way. It works once and expires soon.
          </p>
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
          </div>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Send reset link
          </Button>
          <Link
            to="/login"
            className="block text-center text-sm font-semibold text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
