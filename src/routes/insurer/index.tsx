import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/admin/format";
import { STATUS_LABEL } from "@/lib/farmers";
import { naira, stageLabel } from "@/lib/format";
import { CLAIM_STATUSES, CLAIM_STATUS_LABEL, fetchPortfolio } from "@/lib/insurer";
import { cn } from "@/lib/utils";

const STAGE_ORDER = ["establishment", "vegetative", "flowering", "grain_fill", "maturity"];

export const Route = createFileRoute("/insurer/")({
  loader: () => fetchPortfolio(),
  head: () => ({ meta: [{ title: "Portfolio | GonaInsured insurer portal" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const p = Route.useLoaderData();
  const stages = [...p.byStage].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );
  const priced = p.seasons.filter((s) => s.sumInsured != null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio"
        intro="Cover, fully confirmed triggers and claims across the pilot. Only triggers confirmed by both the weather index and the satellite check (or the agreed cloud-gap rule), on final data, appear here."
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Farmers covered"
          value={String(p.farmers)}
          note={(["normal", "stress_detected", "trigger_confirmed"] as const)
            .map((s) => `${p.farmersByStatus[s]} ${STATUS_LABEL[s].toLowerCase()}`)
            .join(" · ")}
        />
        <Kpi
          label="Total sum insured"
          value={naira(p.sumInsured)}
          note={
            priced.length
              ? priced
                  .map(
                    (s) => `${s.farmers} × ${naira(s.sumInsured)} (${s.year} ${zoneLabel(s.zone)})`,
                  )
                  .join(" · ")
              : "no sum insured set yet"
          }
        />
        <Kpi
          label="Confirmed triggers"
          value={String(p.triggers)}
          note="fully confirmed, all seasons"
        />
        <Kpi
          label="Payouts"
          value={naira(p.payoutTotal)}
          note={
            p.claimsWithoutAmount
              ? `${p.claimsWithoutAmount} claim(s) without an amount yet`
              : `${naira(p.claimsByStatus.settled.amount)} settled`
          }
        />
      </dl>

      <section aria-labelledby="claims-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="claims-heading" className="text-base font-bold">
            Claims by status
          </h2>
          <Link to="/insurer/claims" className="text-sm font-semibold text-primary hover:underline">
            All claims
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CLAIM_STATUSES.map((s) => (
            <Link
              key={s}
              to="/insurer/claims"
              search={{ status: s }}
              className={cn(
                "rounded-xl border bg-card p-4 hover:bg-secondary/40",
                s === "sent_to_insurer" &&
                  p.claimsByStatus[s].n > 0 &&
                  "border-sun ring-1 ring-sun",
              )}
            >
              <span className="block text-xs font-semibold text-muted-foreground">
                {CLAIM_STATUS_LABEL[s]}
              </span>
              <span className="mt-1 block text-2xl font-bold tabular-nums">
                {p.claimsByStatus[s].n}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {naira(p.claimsByStatus[s].amount)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Breakdown
          title="By cooperative"
          head={["Cooperative", "Farmers", "Triggers", "Payouts"]}
          rows={p.byCooperative.map((c) => [c.name, c.farmers, c.triggers, naira(c.payout)])}
          empty="No farmers yet."
        />
        <Breakdown
          title="By growth stage"
          head={["Stage", "Triggers", "Payouts"]}
          rows={stages.map((s) => [stageLabel(s.stage), s.triggers, naira(s.payout)])}
          empty="No confirmed triggers yet."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Sum insured per farmer and season is agreed between GonaInsured and the insurer; a claim
        pays that amount × the payout fraction of its trigger.
      </p>
    </div>
  );
}

const zoneLabel = (zone: string) => zone.replace(/_/g, " ");

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

function Breakdown({
  title,
  head,
  rows,
  empty,
}: {
  title: string;
  head: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-xs font-semibold text-muted-foreground">
              <tr>
                {head.map((h, i) => (
                  <th key={h} className={cn("px-4 py-2.5", i === 0 ? "text-left" : "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r[0])} className="border-b last:border-0">
                  {r.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-4 py-2.5",
                        i === 0 ? "font-medium" : "text-right tabular-nums",
                      )}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
