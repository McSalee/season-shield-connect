import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { EmptyState, PageHeader, Pill } from "@/components/admin/format";
import { fmtDateTime } from "@/lib/format";
import { fetchJobs, type JobRow } from "@/lib/admin";

export const Route = createFileRoute("/admin/runs")({
  loader: () => fetchJobs(),
  head: () => ({ meta: [{ title: "Worker runs | GonaInsured admin" }] }),
  component: RunsPage,
});

const TONE = { succeeded: "good", failed: "bad", running: "warn", queued: "muted" } as const;

function duration(j: JobRow): string {
  if (!j.startedAt || !j.finishedAt) return j.status === "running" ? "running…" : "—";
  const s = Math.round((Date.parse(j.finishedAt) - Date.parse(j.startedAt)) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)} min ${s % 60}s`;
}

type Summary = {
  farmers?: number;
  baselines_built?: unknown[];
  reports?: unknown[];
  messages?: number;
  uploaded?: unknown[];
  status_changes?: string[];
  errors?: string[];
  sync?: {
    inserted?: Record<string, number>;
    updated?: Record<string, number>;
    placeholder_cooperatives?: string[];
  };
};

function RunsPage() {
  const jobs = Route.useLoaderData();
  return (
    <div>
      <PageHeader
        title="Worker runs"
        intro="The daily engine run on GitHub Actions (04:00 UTC) and manual runs: data fetch, double trigger, messages, reports, sync. Latest 100."
      />
      {jobs.length === 0 ? (
        <EmptyState>No runs recorded yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <RunCard key={j.id} job={j} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RunCard({ job: j }: { job: JobRow }) {
  const r = (j.result ?? {}) as Summary;
  const github =
    typeof j.params["github_run"] === "string" ? (j.params["github_run"] as string) : null;
  const synced = r.sync
    ? Object.entries(r.sync.inserted ?? {})
        .map(([t, n]) => [t, n + (r.sync?.updated?.[t] ?? 0)] as const)
        .filter(([, n]) => n > 0)
    : [];
  const facts: [string, string | number][] = j.result
    ? [
        ["Farmers", r.farmers ?? 0],
        ["Baselines built", r.baselines_built?.length ?? 0],
        ["Reports", r.reports?.length ?? 0],
        ["Messages", r.messages ?? 0],
        ["Uploaded", r.uploaded?.length ?? 0],
      ]
    : [];
  return (
    <li className="rounded-xl border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">#{j.id}</span>
        <Pill tone={TONE[j.status]}>{j.status}</Pill>
        <span className="text-muted-foreground">{j.kind.replace(/_/g, " ")}</span>
        <span className="text-muted-foreground">· {fmtDateTime(j.startedAt ?? j.createdAt)}</span>
        <span className="text-muted-foreground">· {duration(j)}</span>
        {github && (
          <a
            href={github}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            GitHub run <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      {facts.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {facts.map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {(r.status_changes?.length ?? 0) > 0 && (
        <p className="mt-2 text-muted-foreground">Status changes: {r.status_changes!.join("; ")}</p>
      )}
      {synced.length > 0 && (
        <p className="mt-1 text-muted-foreground">
          Synced: {synced.map(([t, n]) => `${t.replace(/_/g, " ")} ${n}`).join(", ")}
        </p>
      )}
      {(r.sync?.placeholder_cooperatives?.length ?? 0) > 0 && (
        <p className="mt-1 text-muted-foreground">
          New placeholder cooperatives: {r.sync!.placeholder_cooperatives!.join(", ")}
        </p>
      )}
      {(j.error || (r.errors?.length ?? 0) > 0) && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {j.error ?? r.errors!.join("\n")}
        </pre>
      )}
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Parameters and full result</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary/60 p-3">
          {JSON.stringify({ params: j.params, result: j.result }, null, 2)}
        </pre>
      </details>
    </li>
  );
}
