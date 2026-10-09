import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchFarmers, SEASON_OVER, STATUS_LABEL, type FarmerStatus } from "@/lib/admin";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/format";
import { fmtDate, stageLabel } from "@/lib/format";

const STATUSES: FarmerStatus[] = ["normal", "stress_detected", "trigger_confirmed"];

type Search = { status?: FarmerStatus | undefined; q?: string | undefined };

export const Route = createFileRoute("/admin/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(STATUSES.includes(s["status"] as FarmerStatus)
      ? { status: s["status"] as FarmerStatus }
      : {}),
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
  }),
  loader: () => fetchFarmers(),
  head: () => ({ meta: [{ title: "Farmers | GonaInsured admin" }] }),
  component: FarmersPage,
});

function FarmersPage() {
  const farmers = Route.useLoaderData();
  const { status, q } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, farmers.filter((f) => f.status === s).length]),
  );
  const needle = (q ?? "").trim().toLowerCase();
  const shown = farmers.filter(
    (f) =>
      (!status || f.status === status) &&
      (!needle ||
        [f.name, f.phone, f.cooperative ?? "", f.agent ?? ""].some((v) =>
          v.toLowerCase().includes(needle),
        )),
  );

  // Stages come from each chart's "today" (the worker's last run), so say how fresh they are.
  const asOf = [...new Set(farmers.map((f) => f.stageAsOf).filter((d): d is string => !!d))].sort();
  const asOfText =
    asOf.length === 0
      ? ""
      : asOf.length === 1
        ? ` · stages as of ${fmtDate(asOf[0])}`
        : ` · stages as of ${fmtDate(asOf[0])} – ${fmtDate(asOf[asOf.length - 1])}`;

  const setSearch = (next: Search) => navigate({ search: next, replace: true });

  return (
    <div>
      <PageHeader
        title="Farmers"
        intro="Every enrolled farmer, their cover status and current growth stage."
      />

      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        role="group"
        aria-label="Filter by status"
      >
        <CountTile
          label="All farmers"
          n={farmers.length}
          active={!status}
          onClick={() => setSearch({ q })}
        />
        {STATUSES.map((s) => (
          <CountTile
            key={s}
            label={STATUS_LABEL[s]}
            n={counts[s] ?? 0}
            status={s}
            active={status === s}
            onClick={() => setSearch({ status: s, q })}
          />
        ))}
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search name, phone, cooperative or agent"
          aria-label="Search farmers"
          defaultValue={q ?? ""}
          onChange={(e) => setSearch({ status, q: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      <div className="mt-4">
        {shown.length === 0 ? (
          <EmptyState>
            {farmers.length === 0 ? "No farmers have reached the portal yet." : "No farmers match."}
          </EmptyState>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {shown.length} of {farmers.length} farmer{farmers.length === 1 ? "" : "s"}
              {asOfText}
            </p>
            {/* Table on wide screens, cards on phones. */}
            <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
              <table className="w-full text-sm">
                <thead className="border-b bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Farmer</th>
                    <th className="px-4 py-2.5">Cooperative</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Stage now</th>
                    <th className="px-4 py-2.5">Planted</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((f) => (
                    <tr key={f.id} className="border-b last:border-0 hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/farmers/$id"
                          params={{ id: String(f.id) }}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {f.name}
                        </Link>
                        <div className="text-xs text-muted-foreground tabular-nums">{f.phone}</div>
                      </td>
                      <td className="px-4 py-3">{f.cooperative ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={f.status} seasonOver={f.stage === SEASON_OVER} />
                      </td>
                      <td className="px-4 py-3">{f.stage ? stageLabel(f.stage) : "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{fmtDate(f.plantingDate)}</td>
                      <td className="pr-3" aria-hidden="true">
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 md:hidden">
              {shown.map((f) => (
                <li key={f.id}>
                  <Link
                    to="/admin/farmers/$id"
                    params={{ id: String(f.id) }}
                    className="block rounded-xl border bg-card p-4 hover:bg-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{f.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {f.cooperative ?? "No cooperative"} · {f.phone}
                        </p>
                      </div>
                      <StatusBadge status={f.status} seasonOver={f.stage === SEASON_OVER} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Stage: {f.stage ? stageLabel(f.stage).toLowerCase() : "—"} · Planted{" "}
                      {fmtDate(f.plantingDate)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function CountTile({
  label,
  n,
  status,
  active,
  onClick,
}: {
  label: string;
  n: number;
  status?: FarmerStatus;
  active: boolean;
  onClick: () => void;
}) {
  const bar = status
    ? { normal: "bg-leaf", stress_detected: "bg-sun", trigger_confirmed: "bg-destructive" }[status]
    : "bg-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-colors hover:bg-secondary/40",
        active && "border-primary ring-1 ring-primary",
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-1", bar)} aria-hidden="true" />
      <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="mt-1 block text-2xl font-bold tabular-nums">{n}</span>
    </button>
  );
}
