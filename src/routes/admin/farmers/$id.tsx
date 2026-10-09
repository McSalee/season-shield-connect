import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Download, FileText, Loader2, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonCharts } from "@/components/demo/SeasonCharts";
import { FarmMap } from "@/components/admin/FarmMap";
import { EmptyState, Pill, StatusBadge } from "@/components/admin/format";
import { fmtDate, fmtDateTime, num, pct, stageLabel } from "@/lib/format";
import {
  currentStage,
  fetchFarmer,
  SEASON_OVER,
  isBucketKey,
  signReportUrl,
  STATUS_LABEL,
  type FarmerDetail,
  type FarmerStatus,
  type StageResult,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/farmers/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    const detail = await fetchFarmer({ data: { id } });
    if (!detail) throw notFound();
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.farmer.name ?? "Farmer"} | GonaInsured admin` }],
  }),
  notFoundComponent: () => (
    <div className="space-y-4">
      <EmptyState>That farmer does not exist, or has not reached the portal yet.</EmptyState>
      <BackLink />
    </div>
  ),
  component: FarmerPage,
});

function BackLink() {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
    >
      <ArrowLeft className="size-4" /> All farmers
    </Link>
  );
}

function FarmerPage() {
  const d = Route.useLoaderData();
  const { farmer: f, chart, stages } = d;
  const triggers = stages.filter((s) => s.triggerConfirmed);
  const payout = Math.min(
    1,
    triggers.reduce((sum, s) => sum + (s.payoutFraction ?? 0), 0),
  );
  const provisionalPayout = triggers.some((s) => !s.fullyConfirmed);
  const stageNow = currentStage(chart?.series.stages, chart?.series.today);
  const lastEvaluated = stages.reduce<string | null>(
    (m, s) => (s.evaluatedAt && (!m || s.evaluatedAt > m) ? s.evaluatedAt : m),
    null,
  );

  return (
    <div className="space-y-8">
      <div>
        <BackLink />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{f.name}</h1>
          <StatusBadge status={f.status} seasonOver={stageNow === SEASON_OVER} />
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5" /> <span className="tabular-nums">{f.phone}</span>
          </span>
          <span>
            {f.cooperative ? (
              <>
                {f.cooperative.name}{" "}
                {f.cooperative.needsReview && (
                  <Link to="/admin/cooperatives" className="ml-1 align-middle">
                    <Pill tone="warn">Needs review</Pill>
                  </Link>
                )}
              </>
            ) : (
              "No cooperative"
            )}
          </span>
          {f.agent && <span>Agent {f.agent}</span>}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Status"
          value={STATUS_LABEL[f.status]}
          note={`since ${fmtDate(f.statusUpdatedAt)}${stageNow === SEASON_OVER ? " · season ended" : ""}`}
        />
        <Kpi
          label="Stage now"
          value={stageNow ? stageLabel(stageNow) : "—"}
          note={[
            f.plantingDate ? `planted ${fmtDate(f.plantingDate)}` : "no planting date",
            chart?.series.today ? `as of ${fmtDate(chart.series.today)}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <Kpi
          label="Season payout"
          value={pct(payout, 0)}
          note={
            triggers.length === 0
              ? "no confirmed trigger"
              : provisionalPayout
                ? "includes provisional triggers"
                : `${triggers.length} trigger${triggers.length === 1 ? "" : "s"}`
          }
        />
        <Kpi
          label="Last evaluated"
          value={fmtDate(lastEvaluated)}
          note={chart ? `chart data ${fmtDate(chart.updatedAt)}` : ""}
        />
      </dl>

      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="mb-3 text-base font-bold">
          Farm location
        </h2>
        <FarmMap lat={f.latitude} lon={f.longitude} boundary={f.boundary} label={f.name} />
        <p className="mt-2 text-xs text-muted-foreground">
          {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
          {f.boundary ? " · farm outline shown" : " · no farm outline recorded"}. Satellite NDVI /
          NDMI / rainfall layers are on the local dashboard only (they need an Earth Engine
          sign-in).
        </p>
      </section>

      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="text-base font-bold">
          Season {chart?.seasonYear ?? ""}
        </h2>
        {chart ? (
          <SeasonCharts s={chart.series} />
        ) : (
          <div className="mt-3">
            <EmptyState>
              No chart data yet. It appears after the next worker run (the farmer needs a planting
              date).
            </EmptyState>
          </div>
        )}
      </section>

      <StagesTable stages={stages} />

      <Tabs defaultValue="history">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="history">Status history ({d.history.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({d.messages.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({d.reports.length})</TabsTrigger>
          <TabsTrigger value="claims">Claims ({d.claims.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <HistoryList history={d.history} />
        </TabsContent>
        <TabsContent value="messages">
          <MessageList messages={d.messages} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportList reports={d.reports} />
        </TabsContent>
        <TabsContent value="claims">
          <ClaimList claims={d.claims} />
        </TabsContent>
        <TabsContent value="details">
          <Details f={f} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

// ------------------------------------------------------------------ growth stages

function result(s: StageResult): { label: string; tone: "muted" | "good" | "warn" | "bad" } {
  if (s.triggerConfirmed) return { label: s.severityBand ?? "Trigger", tone: "bad" };
  if (s.advisory) return { label: "Advisory", tone: "warn" };
  return { label: "OK", tone: "good" };
}

function StagesTable({ stages }: { stages: StageResult[] }) {
  return (
    <section aria-labelledby="stages-heading">
      <h2 id="stages-heading" className="text-base font-bold">
        Growth stages
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Double trigger per stage: weather index and satellite confirmation. Rows marked “admin only”
        are not shown to insurers or cooperatives until they are fully confirmed (final rainfall
        data, no cloud-gap provisional payout).
      </p>
      {stages.length === 0 ? (
        <div className="mt-3">
          <EmptyState>No stage has been evaluated yet.</EmptyState>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Stage</th>
                <th className="px-3 py-2.5 text-right">Weather index</th>
                <th className="px-3 py-2.5 text-right">NDVI vs normal</th>
                <th className="px-3 py-2.5 text-right">NDMI vs normal</th>
                <th className="px-3 py-2.5 text-right">Soil moisture</th>
                <th className="px-3 py-2.5 text-right">Clear scenes</th>
                <th className="px-3 py-2.5">Result</th>
                <th className="px-3 py-2.5 text-right">Payout</th>
                <th className="px-3 py-2.5">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => {
                const r = result(s);
                return (
                  <tr key={s.id} className="border-b align-top last:border-0">
                    <td className="px-3 py-2.5">
                      <span className="font-semibold">{stageLabel(s.stage)}</span>
                      {s.notes.length > 0 && (
                        <details className="mt-1 text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">
                            Notes ({s.notes.length})
                          </summary>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {s.notes.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(s.weatherIndex)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(s.ndviAnomaly, 3)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(s.ndmiAnomaly, 3)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {pct(s.soilMoistureChange, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {s.clearObservations ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill tone={r.tone}>{r.label}</Pill>
                      {(s.weatherProvisional || !s.windowComplete) && (
                        <span className="ml-1 text-xs text-muted-foreground">provisional</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {s.triggerConfirmed ? pct(s.payoutFraction, 0) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {s.fullyConfirmed ? <Pill tone="good">Shared</Pill> : <Pill>Admin only</Pill>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ tabs

function HistoryList({ history }: { history: FarmerDetail["history"] }) {
  if (history.length === 0) return <EmptyState>No status changes yet.</EmptyState>;
  return (
    <ol className="space-y-2">
      {history.map((h) => (
        <li key={h.id} className="rounded-xl border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {h.from && (
              <>
                <StatusBadge status={h.from as FarmerStatus} />
                <span aria-hidden="true">→</span>
                <span className="sr-only">to</span>
              </>
            )}
            <StatusBadge status={h.to as FarmerStatus} />
            <span className="text-xs text-muted-foreground">{fmtDateTime(h.at)}</span>
          </div>
          {h.reason && <p className="mt-1 text-muted-foreground">{h.reason}</p>}
        </li>
      ))}
    </ol>
  );
}

function MessageList({ messages }: { messages: FarmerDetail["messages"] }) {
  if (messages.length === 0)
    return (
      <EmptyState>
        No messages sent. Messages are logged only until Africa&apos;s Talking is set up; advisories
        about a stage that ended more than 7 days ago are skipped.
      </EmptyState>
    );
  return (
    <ul className="space-y-2">
      {messages.map((m) => (
        <li key={m.id} className="rounded-xl border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" />
            <span className="font-semibold uppercase">{m.channel}</span>
            <Pill
              tone={
                /deliver|sent|answered|complete/i.test(m.status)
                  ? "good"
                  : /fail/i.test(m.status)
                    ? "bad"
                    : "muted"
              }
            >
              {m.status}
            </Pill>
            <span>{fmtDateTime(m.sentAt)}</span>
            {m.eventKey && <span className="font-mono">{m.eventKey}</span>}
          </div>
          <p className="mt-1.5 whitespace-pre-line">{m.content}</p>
        </li>
      ))}
    </ul>
  );
}

function ReportList({ reports }: { reports: FarmerDetail["reports"] }) {
  const sign = useServerFn(signReportUrl);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(path: string) {
    setBusy(path);
    setError(null);
    // Open the tab during the click (popup blockers allow that), then point it at the
    // short-lived signed link once the server has made it.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await sign({ data: { path } });
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : "Could not open the report.");
    } finally {
      setBusy(null);
    }
  }

  if (reports.length === 0)
    return (
      <EmptyState>
        No trigger reports. A report is written for each fully confirmed trigger.
      </EmptyState>
    );
  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="space-y-2">
        {reports.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-mono font-semibold">{r.reference}</span>
              <span className="text-xs text-muted-foreground">{fmtDateTime(r.createdAt)}</span>
            </div>
            {isBucketKey(r.pdfPath) ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => open(r.pdfPath)}
                  disabled={busy !== null}
                >
                  {busy === r.pdfPath ? <Loader2 className="animate-spin" /> : <Download />} PDF
                </Button>
                {r.txtPath && isBucketKey(r.txtPath) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => open(r.txtPath!)}
                    disabled={busy !== null}
                  >
                    {busy === r.txtPath ? <Loader2 className="animate-spin" /> : <Download />} Text
                  </Button>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                File not uploaded yet (next worker run)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClaimList({ claims }: { claims: FarmerDetail["claims"] }) {
  if (claims.length === 0)
    return <EmptyState>No claims. A claim is created for each fully confirmed trigger.</EmptyState>;
  const naira = (v: number | null) => (v == null ? "not set" : `₦${v.toLocaleString("en-NG")}`);
  return (
    <ul className="space-y-2">
      {claims.map((c) => (
        <li key={c.id} className="rounded-xl border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold">{c.reference}</span>
            <Pill tone="bad">{c.severityBand}</Pill>
            <Pill>{c.status.replace(/_/g, " ")}</Pill>
          </div>
          <p className="mt-1 text-muted-foreground">
            Payout {pct(c.payoutFraction, 0)} of sum insured · sum insured {naira(c.sumInsured)} ·
            amount {naira(c.payoutAmount)} · {fmtDate(c.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Details({ f }: { f: FarmerDetail["farmer"] }) {
  const rows: [string, string][] = [
    ["Crop", f.crop],
    ["Zone", f.zone.replace(/_/g, " ")],
    ["Planting date", fmtDate(f.plantingDate)],
    ["Enrolled", fmtDate(f.enrollmentDate)],
    ["Consent recorded", f.consentAt ? fmtDateTime(f.consentAt) : "Not recorded"],
    ["Advisories by", f.messagePref === "sms" ? "SMS" : "Voice call (SMS fallback)"],
    ["Coordinates", `${f.latitude.toFixed(5)}, ${f.longitude.toFixed(5)}`],
    ["Portal id / engine id", `${f.id} / ${f.engineId ?? "—"}`],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
