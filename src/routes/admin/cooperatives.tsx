import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/portal/AuthLayout";
import { EmptyState, PageHeader, Pill } from "@/components/admin/format";
import { fmtDate } from "@/lib/format";
import { fetchCooperatives, updateCooperative, type CooperativeRow } from "@/lib/admin";

export const Route = createFileRoute("/admin/cooperatives")({
  loader: () => fetchCooperatives(),
  head: () => ({ meta: [{ title: "Cooperatives | GonaInsured admin" }] }),
  component: CooperativesPage,
});

function CooperativesPage() {
  const coops = Route.useLoaderData();
  const toReview = coops.filter((c) => c.needsReview).length;
  const zones = [...new Set(coops.map((c) => c.zone))];
  return (
    <div>
      <PageHeader
        title="Cooperatives"
        intro="Cooperatives the sync could not match to one set up in the portal arrive as placeholders. Check the name and location, then mark them reviewed."
      />
      {toReview > 0 && (
        <p className="mb-4 rounded-xl border border-sun/40 bg-sun/15 px-4 py-3 text-sm">
          <strong>{toReview}</strong> cooperative{toReview === 1 ? "" : "s"} need
          {toReview === 1 ? "s" : ""} review.
        </p>
      )}
      {coops.length === 0 ? (
        <EmptyState>No cooperatives yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {coops.map((c) => (
            <CooperativeCard key={c.id} coop={c} />
          ))}
        </ul>
      )}
      <datalist id="zone-options">
        {zones.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
    </div>
  );
}

function CooperativeCard({ coop: c }: { coop: CooperativeRow }) {
  const [editing, setEditing] = useState(c.needsReview);
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">{c.name}</h2>
            {c.needsReview ? (
              <Pill tone="warn">Needs review</Pill>
            ) : (
              <Pill tone="good">Reviewed</Pill>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[c.lga, c.state].filter(Boolean).join(", ") || "Location not set"} · zone{" "}
            {c.zone.replace(/_/g, " ")} ·{" "}
            <Link
              to="/admin"
              search={{ q: c.name }}
              className="font-semibold text-primary hover:underline"
            >
              {c.farmers} farmer{c.farmers === 1 ? "" : "s"}
            </Link>{" "}
            · {c.agents} agent{c.agents === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {c.engineName && c.engineName !== c.name
              ? `Engine name: “${c.engineName}” (farmers enrolled under it keep arriving here). `
              : ""}
            Added {fmtDate(c.createdAt)}
          </p>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Edit
          </Button>
        )}
      </div>
      {editing && <CooperativeForm coop={c} onDone={() => setEditing(false)} />}
    </li>
  );
}

function CooperativeForm({ coop: c, onDone }: { coop: CooperativeRow; onDone: () => void }) {
  const router = useRouter();
  const save = useServerFn(updateCooperative);
  const [reviewed, setReviewed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = (k: string) => `coop-${c.id}-${k}`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          id: c.id,
          name: String(form.get("name")),
          lga: String(form.get("lga")),
          state: String(form.get("state")),
          zone: String(form.get("zone")),
          reviewed,
        },
      });
      await router.invalidate();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id("name")}>Name</Label>
        <Input
          id={id("name")}
          name="name"
          defaultValue={c.name}
          required
          minLength={2}
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">
          Renames the cooperative and its organization (used for invites).
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id("lga")}>LGA</Label>
        <Input
          id={id("lga")}
          name="lga"
          defaultValue={c.lga ?? ""}
          maxLength={120}
          placeholder="e.g. Lere"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id("state")}>State</Label>
        <Input
          id={id("state")}
          name="state"
          defaultValue={c.state ?? ""}
          maxLength={120}
          placeholder="e.g. Kaduna"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id("zone")}>Zone</Label>
        <Input id={id("zone")} name="zone" defaultValue={c.zone} required list="zone-options" />
        <p className="text-xs text-muted-foreground">Key under [zones] in config/pilot.toml.</p>
      </div>
      <div className="flex items-center gap-2 self-center">
        <Checkbox
          id={id("reviewed")}
          checked={reviewed}
          onCheckedChange={(v) => setReviewed(v === true)}
        />
        <Label htmlFor={id("reviewed")}>Mark as reviewed</Label>
      </div>
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Save
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
