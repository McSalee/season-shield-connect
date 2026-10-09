import type { VisibleCounts } from "@/lib/portal";

// Stage 5.1 stand-in for each portal's home page: who is signed in, what row-level
// security lets them see, and what the next step adds.
export function PortalPlaceholder({
  heading,
  intro,
  counts,
  next,
}: {
  heading: string;
  intro: string;
  counts: VisibleCounts;
  next: string[];
}) {
  const tiles: [string, number | null][] = [
    ["Farmers", counts.farmers],
    ["Cooperatives", counts.cooperatives],
    ["Claims", counts.claims],
    ["Worker runs", counts.jobs],
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>
      <section aria-labelledby="visible-heading">
        <h2
          id="visible-heading"
          className="text-sm font-bold uppercase tracking-wide text-muted-foreground"
        >
          What your account can see
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(([label, n]) => (
            <div key={label} className="rounded-xl border bg-card p-4">
              <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{n ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-xl border border-dashed bg-card p-5">
        <h2 className="text-sm font-bold">Coming next</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {next.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
