import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, FileDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, Pill } from "@/components/admin/format";
import { ClaimActions } from "@/components/portal/ClaimActions";
import { ReportButtons } from "@/components/portal/ReportButtons";
import type { Json } from "@/lib/farmers";
import { fmtDateTime, naira, num, pct, stageLabel } from "@/lib/format";
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_LABEL,
  fetchClaims,
  type ClaimRow,
  type ClaimStatus,
} from "@/lib/insurer";

type Search = {
  status?: ClaimStatus | undefined;
  coop?: string | undefined;
  stage?: string | undefined;
  q?: string | undefined;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/insurer/claims")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const status = CLAIM_STATUSES.includes(s["status"] as ClaimStatus)
      ? (s["status"] as ClaimStatus)
      : undefined;
    const out: Search = {};
    if (status) out.status = status;
    for (const k of ["coop", "stage", "q"] as const) if (str(s[k])) out[k] = str(s[k]);
    return out;
  },
  loader: () => fetchClaims(),
  head: () => ({ meta: [{ title: "Claims | GonaInsured insurer portal" }] }),
  component: ClaimsPage,
});

const STATUS_TONE: Record<ClaimStatus, "muted" | "good" | "warn" | "bad"> = {
  confirmed: "muted",
  sent_to_insurer: "warn",
  acknowledged: "good",
  disputed: "bad",
  settled: "good",
};

function ClaimsPage() {
  const claims = Route.useLoaderData();
  const search = Route.useSearch();
  const { auth } = Route.useRouteContext();
  const navigate = useNavigate({ from: Route.fullPath });
  const set = (patch: Partial<Search>) =>
    navigate({ search: { ...search, ...patch }, replace: true });

  const coops = [...new Set(claims.map((c) => c.farmer.cooperative ?? "No cooperative"))].sort();
  const stages = [...new Set(claims.map((c) => c.stage).filter((s): s is string => !!s))];
  const needle = (search.q ?? "").trim().toLowerCase();
  const shown = claims.filter(
    (c) =>
      (!search.status || c.status === search.status) &&
      (!search.coop || (c.farmer.cooperative ?? "No cooperative") === search.coop) &&
      (!search.stage || c.stage === search.stage) &&
      (!needle || [c.reference, c.farmer.name].some((v) => v.toLowerCase().includes(needle))),
  );
  const total = shown.reduce((t, c) => t + (c.payoutAmount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Claims"
        intro="One claim per fully confirmed trigger, with the evidence from both legs of the double trigger and its report."
      >
        <Button variant="outline" onClick={() => downloadCsv(shown)} disabled={shown.length === 0}>
          <FileDown /> Export CSV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reference or farmer"
            aria-label="Search claims"
            defaultValue={search.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            className="pl-9"
          />
        </div>
        <Filter
          label="Status"
          value={search.status}
          options={CLAIM_STATUSES.map((s) => [s, CLAIM_STATUS_LABEL[s]])}
          onChange={(v) => set({ status: v as ClaimStatus | undefined })}
        />
        <Filter
          label="Cooperative"
          value={search.coop}
          options={coops.map((c) => [c, c])}
          onChange={(v) => set({ coop: v })}
        />
        <Filter
          label="Stage"
          value={search.stage}
          options={stages.map((s) => [s, stageLabel(s)])}
          onChange={(v) => set({ stage: v })}
        />
      </div>

      <p className="mb-2 mt-4 text-xs text-muted-foreground">
        {shown.length} of {claims.length} claim{claims.length === 1 ? "" : "s"} · payouts{" "}
        {naira(total)}
      </p>
      {shown.length === 0 ? (
        <EmptyState>
          {claims.length === 0
            ? "No claims yet. A claim is created when a trigger is fully confirmed."
            : "No claims match."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <ClaimCard key={c.id} c={c} role={auth.profile.role} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: [string, string][];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="text-xs font-semibold text-muted-foreground">
      {label}
      <select
        className="mt-1 block h-9 rounded-md border bg-background px-2 text-sm font-normal text-foreground"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">All</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClaimCard({ c, role }: { c: ClaimRow; role: string }) {
  const e = c.evidence;
  return (
    <li className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold">{c.reference}</span>
            <Pill tone={STATUS_TONE[c.status]}>{CLAIM_STATUS_LABEL[c.status]}</Pill>
            <Pill tone="bad">{c.severityBand}</Pill>
          </div>
          <p className="text-sm">
            <Link
              to="/insurer/farmers/$id"
              params={{ id: String(c.farmer.id) }}
              className="font-semibold hover:underline"
            >
              {c.farmer.name}
            </Link>{" "}
            <span className="text-muted-foreground">
              · {c.farmer.cooperative ?? "No cooperative"} · {c.stage ? stageLabel(c.stage) : "—"}{" "}
              {c.season ? `${c.season.year}` : ""}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{naira(c.payoutAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {pct(c.payoutFraction, 1)} of {naira(c.sumInsured)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        {c.report ? (
          <ReportButtons pdfPath={c.report.pdfPath} txtPath={c.report.txtPath} />
        ) : (
          <span className="text-xs text-muted-foreground">Report not written yet</span>
        )}
        <ClaimActions claimId={c.id} status={c.status} role={role} />
      </div>

      <details className="group border-t">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-primary">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" /> Evidence and
          history
        </summary>
        <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
          <Leg title="Weather index leg">
            <Fact k="Weather index" v={num(e?.weatherIndex)} />
            {subIndices(e?.weatherDetail).map(([k, v]) => (
              <Fact key={k} k={k} v={v} />
            ))}
            {rainInputs(e?.weatherDetail).map(([k, v]) => (
              <Fact key={k} k={k} v={v} />
            ))}
          </Leg>
          <Leg title="Satellite leg">
            <Fact
              k="Result"
              v={
                e?.cloudGapRule
                  ? `cloud gap: "${e.cloudGapRule}" rule applied`
                  : e?.vegetationConfirms
                    ? "confirms the weather index"
                    : "—"
              }
            />
            <Fact k="NDVI vs normal" v={num(e?.ndviAnomaly, 3)} />
            <Fact k="NDMI vs normal" v={num(e?.ndmiAnomaly, 3)} />
            <Fact k="Soil moisture change" v={pct(e?.soilMoistureChange, 0)} />
            <Fact
              k="Clear scenes"
              v={e?.clearObservations == null ? "—" : String(e.clearObservations)}
            />
            <Fact k="Evaluated" v={fmtDateTime(e?.evaluatedAt)} />
          </Leg>
          <div className="md:col-span-2">
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              History
            </h3>
            <ol className="space-y-1.5 text-sm">
              <li>
                <span className="text-muted-foreground">{fmtDateTime(c.createdAt)}</span> · Claim
                created (trigger fully confirmed)
              </li>
              {c.events.map((ev) => (
                <li key={ev.id}>
                  <span className="text-muted-foreground">{fmtDateTime(ev.at)}</span> ·{" "}
                  {CLAIM_STATUS_LABEL[ev.to]} by {ev.actor ?? "a deleted user"} ({ev.actorRole})
                  {ev.note && <span className="block pl-4 text-muted-foreground">“{ev.note}”</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </details>
    </li>
  );
}

function Leg({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="space-y-1 text-sm">{children}</dl>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right tabular-nums">{v}</dd>
    </div>
  );
}

type Detail = { [key: string]: Json } | null;

const SUB_INDEX: [string, string][] = [
  ["drought", "Drought sub-index"],
  ["excess_rain", "Excess rain sub-index"],
  ["heat", "Heat sub-index"],
];

function subIndices(d: Detail | undefined): [string, string][] {
  if (!d) return [];
  return SUB_INDEX.filter(([k]) => typeof d[k] === "number").map(([k, l]) => [
    l,
    num(d[k] as number),
  ]);
}

function rainInputs(d: Detail | undefined): [string, string][] {
  const i = d?.["inputs"];
  const t = d?.["thresholds"];
  if (!i || typeof i !== "object" || Array.isArray(i)) return [];
  const out: [string, string][] = [];
  const n = (v: unknown, unit: string) => (typeof v === "number" ? `${v} ${unit}` : "—");
  out.push(["Rain in stage", n(i["rain_total_mm"], "mm")]);
  if (t && typeof t === "object" && !Array.isArray(t))
    out.push([
      "Rain attach / exit",
      `${n(t["rain_attach_mm"], "mm")} / ${n(t["rain_exit_mm"], "mm")}`,
    ]);
  out.push(["Longest dry spell", n(i["max_dry_spell_days"], "days")]);
  return out;
}

// CSV of the claims shown (filters applied), for the insurer's own records.
function downloadCsv(rows: ClaimRow[]) {
  const head = [
    "reference",
    "status",
    "farmer",
    "cooperative",
    "season",
    "zone",
    "stage",
    "severity_band",
    "payout_fraction",
    "sum_insured_ngn",
    "payout_amount_ngn",
    "weather_index",
    "ndvi_anomaly",
    "ndmi_anomaly",
    "clear_scenes",
    "satellite_confirms",
    "cloud_gap_rule",
    "evaluated_at",
    "claim_created_at",
    "last_status_change_at",
  ];
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Quote everything; text starting with =, +, - or @ (names, notes) could run as a
    // spreadsheet formula, so it gets a leading apostrophe. Numbers stay as they are.
    const safe = typeof v === "string" && /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = rows.map((c) =>
    [
      c.reference,
      c.status,
      c.farmer.name,
      c.farmer.cooperative,
      c.season?.year,
      c.season?.zone,
      c.stage,
      c.severityBand,
      c.payoutFraction,
      c.sumInsured,
      c.payoutAmount,
      c.evidence?.weatherIndex,
      c.evidence?.ndviAnomaly,
      c.evidence?.ndmiAnomaly,
      c.evidence?.clearObservations,
      c.evidence?.vegetationConfirms,
      c.evidence?.cloudGapRule,
      c.evidence?.evaluatedAt,
      c.createdAt,
      c.events.at(-1)?.at ?? "",
    ]
      .map(cell)
      .join(","),
  );
  const blob = new Blob([[head.join(","), ...lines].join("\r\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `gonainsured-claims-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
