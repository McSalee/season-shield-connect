import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout, FormError } from "@/components/portal/AuthLayout";
import { hasDemoAccess, unlockDemo } from "@/lib/demo-access";

// Code prompt for the partner demo. /demo sends visitors here until they have the cookie.
export const Route = createFileRoute("/demo-access")({
  beforeLoad: async () => {
    if (await hasDemoAccess()) throw redirect({ to: "/demo" });
  },
  head: () => ({
    meta: [{ title: "Demo access | GonaInsured" }, { name: "robots", content: "noindex" }],
  }),
  component: DemoAccessPage,
});

function DemoAccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setBusy(true);
    setError(null);
    const result = await unlockDemo({ data: { code } });
    if (!result.ok) {
      setBusy(false);
      setError(
        result.reason === "wrong_code"
          ? "That code is not correct. Check it and try again."
          : "The demo is not available right now.",
      );
      return;
    }
    await router.navigate({ to: "/demo" });
  }

  return (
    <AuthLayout
      title="Partner demo"
      subtitle="Enter the demo access code you were given to open the partner dashboard demo."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Demo access code</Label>
          <Input id="code" name="code" type="password" autoComplete="off" required autoFocus />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Open the demo
        </Button>
      </form>
    </AuthLayout>
  );
}
