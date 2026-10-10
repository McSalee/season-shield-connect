import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CLAIM_ACTIONS, transitionClaim, type ClaimAction, type ClaimStatus } from "@/lib/insurer";

// Buttons for the claim moves the signed-in role may make (admins: send to the insurer;
// insurers: acknowledge, dispute with a reason, mark settled). The database function
// public.claim_transition() checks every move again and logs it.
export function ClaimActions({
  claimId,
  status,
  role,
}: {
  claimId: number;
  status: ClaimStatus;
  role: string;
}) {
  const actions = role === "admin" || role === "insurer" ? CLAIM_ACTIONS[role][status] : undefined;
  const move = useServerFn(transitionClaim);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<ClaimAction | null>(null);
  const [note, setNote] = useState("");

  if (!actions?.length) return null;

  async function run(a: ClaimAction, text?: string) {
    if (a.needsReason && !text?.trim()) return setError("Give a reason for the dispute.");
    setBusy(true);
    setError(null);
    try {
      await move({
        data: {
          claimId,
          to: a.to as Exclude<ClaimStatus, "confirmed">,
          ...(text?.trim() ? { note: text.trim() } : {}),
        },
      });
      setReasonFor(null);
      setNote("");
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The claim could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  if (reasonFor)
    return (
      <div className="w-full space-y-2">
        <label className="text-xs font-semibold" htmlFor={`reason-${claimId}`}>
          Reason for the dispute (the cooperative and GonaInsured will see it)
        </label>
        <Textarea
          id={`reason-${claimId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={3}
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => run(reasonFor, note)}
          >
            {busy && <Loader2 className="animate-spin" />} Dispute claim
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReasonFor(null)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <Button
          key={a.to}
          size="sm"
          variant={a.needsReason ? "outline" : "default"}
          disabled={busy}
          onClick={() => (a.needsReason ? (setError(null), setReasonFor(a)) : run(a))}
        >
          {busy && <Loader2 className="animate-spin" />} {a.label}
        </Button>
      ))}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
