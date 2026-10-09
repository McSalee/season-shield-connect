import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authQuery, PASSWORD_RULES, passwordProblem } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { FormError } from "./AuthLayout";

const EXPIRED = "This link has expired or was already used. Ask for a new one.";
const INCOMPLETE =
  "This link is incomplete. Open the full link from your email, or ask for a new one.";
const OTHER_BROWSER =
  "This link could not be used. Open it in the same browser where you asked for the reset, or ask for a new one.";

type LinkState =
  | { status: "checking" }
  | { status: "ready"; tokenHash?: string } // tokenHash: still to be spent on submit
  | { status: "error"; message: string };

// Shared by the invite (/auth/accept) and password reset (/auth/reset) pages. The emailed
// link arrives in one of three forms, and each signs the user in before the password is saved:
//   #access_token=...&refresh_token=...  default invite and reset emails (Supabase verified
//                                        the link; resets are requested with the implicit flow)
//   ?code=...                            PKCE reset link, only from emails sent before that
//                                        change; works only in the browser that asked
//   ?token_hash=...                      custom templates in supabase/templates/ (not used on
//                                        the free tier); spent only on submit
// Supabase's own URL detection is off (lib/supabase/browser.ts) so these are handled here.
export function SetPasswordForm({
  tokenHash,
  code,
  type,
  submitLabel,
}: {
  tokenHash: string | undefined;
  code?: string | undefined;
  type: "invite" | "recovery";
  submitLabel: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [link, setLink] = useState<LinkState>({ status: "checking" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false); // a code or token can be used once; never run this twice

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      // Supabase reports an expired or used link in the hash (invite) or query (reset).
      if (hash.get("error_code") || query.get("error_code")) {
        return setLink({ status: "error", message: EXPIRED });
      }
      if (tokenHash) return setLink({ status: "ready", tokenHash });
      const supabase = getSupabaseBrowserClient();
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        window.history.replaceState(null, "", window.location.pathname); // tokens out of history
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return setLink(error ? { status: "error", message: EXPIRED } : { status: "ready" });
      }
      if (code) {
        window.history.replaceState(null, "", window.location.pathname);
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return setLink(error ? { status: "error", message: OTHER_BROWSER } : { status: "ready" });
      }
      setLink({ status: "error", message: INCOMPLETE });
    })();
  }, [tokenHash, code]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (link.status !== "ready") return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm")))
      return setError("The two passwords are different.");
    const problem = passwordProblem(password);
    if (problem) return setError(problem);

    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (link.tokenHash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: link.tokenHash, type });
      if (error) {
        setBusy(false);
        return setError(EXPIRED);
      }
      setLink({ status: "ready" }); // the token is spent now; a retry only needs to save the password
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    queryClient.removeQueries({ queryKey: authQuery.queryKey });
    await router.navigate({ to: "/portal" });
  }

  if (link.status === "checking") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking your link…
      </p>
    );
  }
  if (link.status === "error") return <FormError message={link.message} />;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{PASSWORD_RULES}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Repeat password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <FormError message={error} />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}
