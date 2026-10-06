import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, Info, Search, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldMap } from "@/components/demo/FieldMap";
import { SeasonCharts } from "@/components/demo/SeasonCharts";
import { cap, demo, fmtDay, initials, pct, STATUS_LABEL, type Farmer, type Status } from "@/data/demo";

type DemoSearch = { farmer?: number; status?: Status };
const STATUSES: Status[] = ["normal", "stress_detected", "trigger_confirmed"];

export const Route = createFileRoute("/demo")({
  validateSearch: (s: Record<string, unknown>): DemoSearch => {
    const out: DemoSearch = {};
    const id = Number(s["farmer"]);
    if (Number.isInteger(id) && demo.farmers.some(f => f.id === id)) out.farmer = id;
    if (STATUSES.includes(s["status"] as Status)) out.status = s["status"] as Status;
    return out;
  },
  head: () => ({ meta: [
    { title: "Partner dashboard demo | GonaInsured" },
    { name: "description", content: "See how GonaInsured monitors farms with satellite data: field health maps, double-trigger results, SMS advisories and payout reports." },
    { property: "og:title", content: "GonaInsured partner dashboard demo" },
  ] }),
  component: DemoPage,
});

// --------------------------------------------------------------------------- shared bits

function Logo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-9 shrink-0">
      <defs>
        <linearGradient id="gona-mark-demo" x1="48" y1="7" x2="15" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-leaf)" /><stop offset="1" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      <path d="M4 31C4 16.1 16.1 4 31 4h25v13.5a7.5 7.5 0 0 1-7.5 7.5H39c-7.7 0-14 6.3-14 14v3H4V31Z" fill="url(#gona-mark-demo)" />
      <path d="M4 31v29h27c16 0 29-13 29-29v-6H45v6c0 7.7-6.3 14-14 14h-6V31H4Z" fill="url(#gona-mark-demo)" />
    </svg>
  );
}

const BADGE: Record<Status, { cls: string; icon: ReactNode }> = {
  normal: { cls: "bg-leaf/12 text-leaf", icon: <Check className="size-3" /> },
  stress_detected: { cls: "bg-sun/20 text-earth", icon: <AlertTriangle className="size-3" /> },
  trigger_confirmed: { cls: "bg-destructive/12 text-destructive", icon: <TriangleAlert className="size-3" /> },
};

function StatusBadge({ status }: { status: Status }) {
  const b = BADGE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", b.cls)}>
      {b.icon}{STATUS_LABEL[status]}
    </span>
  );
}

function ResultChip({ result }: { result: string }) {
  const cls = /^Red/.test(result) ? "bg-destructive/12 text-destructive"
    : /^Orange/.test(result) ? "bg-orange-500/15 text-orange-700"
    : /^Yellow|Advisory/.test(result) ? "bg-sun/20 text-earth" : "bg-leaf/12 text-leaf";
  return <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", cls)}>{result}</span>;
}

function Tile({ label, value, note, accent = "bg-primary", small }: {
  label: string; value: ReactNode; note?: string; accent?: string; small?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-4 pl-5 shadow-soft">
      <span className={cn("absolute inset-y-0 left-0 w-1", accent)} />
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-extrabold tabular-nums", small ? "text-lg" : "text-2xl")}>{value}</p>
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

function Avatar({ name, large }: { name: string; large?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-full bg-secondary font-extrabold text-primary",
      large ? "size-14 text-lg" : "size-10 text-sm")}>{initials(name)}</span>
  );
}

const coords = (f: Farmer) => `${f.lat.toFixed(4)}°N, ${f.lon.toFixed(4)}°E`;

// --------------------------------------------------------------------------- page

function DemoPage() {
  const { farmer: farmerId, status } = Route.useSearch();
  const navigate = useNavigate({ from: "/demo" });
  const farmer = demo.farmers.find(f => f.id === farmerId);
  const open = (id?: number) => {
    void navigate({ search: prev => (id ? { ...prev, farmer: id } : { status: prev.status }) as DemoSearch });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="GonaInsured home">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground"><Logo /></span>
            <span className="min-w-0">
              <span className="block text-base font-extrabold leading-tight">Gona<span className="text-sun">Insured</span></span>
              <span className="block truncate text-[11px] text-primary-foreground/75">Protecting farmers. Powering insurers.</span>
            </span>
          </Link>
          <span className="ml-1 hidden rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-extrabold text-sun-foreground sm:inline">DEMO</span>
          <nav className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/"><ArrowLeft />Website</Link>
            </Button>
            <Button variant="hero" size="sm" className="rounded-lg font-bold" asChild>
              <a href="/#partner">Partner with us</a>
            </Button>
          </nav>
        </div>
      </header>

      <div className="border-b border-sun/40 bg-sun/15">
        <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2.5 text-xs text-foreground sm:px-6">
          <Info className="mt-0.5 size-4 shrink-0 text-earth" />
          <span><strong>Demo with fictional farmers.</strong> Map imagery is real Sentinel-2 and CHIRPS satellite data of
            farmland near Saminaka, Kaduna. Farm weather, trigger results, messages and reports are simulated by the
            GonaInsured engine for a {demo.crop} season, as of {fmtDay(demo.asOf)}.</span>
        </p>
      </div>

      <main className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {farmer ? <FarmerDetail f={farmer} onBack={() => open()} /> : <Portfolio status={status} onOpen={open} />}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-[11px] text-muted-foreground sm:px-6">
        GonaInsured partner dashboard (demo) · Satellite data: Copernicus Sentinel-2, CHIRPS via Google Earth Engine ·
        Thresholds shown are pilot placeholders, not calibrated contract terms.
      </footer>
    </div>
  );
}

// --------------------------------------------------------------------------- portfolio (farmer list)

function Portfolio({ status, onOpen }: { status: Status | undefined; onOpen: (id: number) => void }) {
  const [q, setQ] = useState("");
  const all = demo.farmers;
  const counts = Object.fromEntries(STATUSES.map(s => [s, all.filter(f => f.status === s).length])) as Record<Status, number>;
  const shown = all.filter(f => (!status || f.status === status) &&
    (!q || `${f.name} ${f.phone} ${f.cooperative}`.toLowerCase().includes(q.toLowerCase())));
  const payout = all.reduce((sum, f) => sum + f.payout, 0) / all.length;
  const reports = all.reduce((n, f) => n + f.reports.length, 0);

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Farmer portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">{demo.zone} · {cap(demo.crop)} · {all[0]?.cooperative} · as of {fmtDay(demo.asOf)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Enrolled farmers" value={all.length} />
        <Tile label="Normal" value={counts.normal} accent="bg-leaf" />
        <Tile label="Stress detected" value={counts.stress_detected} accent="bg-sun" note="advisory sent" />
        <Tile label="Trigger confirmed" value={counts.trigger_confirmed} accent="bg-destructive" note={`${reports} payout report${reports === 1 ? "" : "s"}`} />
        <Tile label="Avg. season payout" value={pct(payout)} accent="bg-sky" note="of sum insured" />
      </div>

      <FieldMap farmers={all} onSelect={onOpen} />

      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {([undefined, ...STATUSES] as (Status | undefined)[]).map(s => (
            <Link key={s ?? "all"} from="/demo" search={s ? { status: s } : {}} aria-current={status === s ? "true" : undefined}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>
              {s ? STATUS_LABEL[s] : "All"}<span className="tabular-nums opacity-70">{s ? counts[s] : all.length}</span>
            </Link>
          ))}
        </nav>
        <label className="relative w-full sm:ml-auto sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone or cooperative"
            aria-label="Search farmers" className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(f => (
          <button key={f.id} type="button" onClick={() => onOpen(f.id)}
            className="group flex w-full min-w-0 cursor-pointer flex-col gap-4 rounded-2xl border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
            <div className="flex items-start gap-3">
              <Avatar name={f.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">#{f.id} · {f.cooperative}</p>
              </div>
              <StatusBadge status={f.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {([["Location", coords(f)], ["Crop", `${cap(f.crop)} · ${f.stage}`], ["Planted", fmtDay(f.plantingDate)],
                ["Season payout", pct(f.payout)]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="mt-0.5 tabular-nums">{v}</dd></div>
              ))}
            </dl>
            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Last evaluated {f.lastEvaluated ?? "never"}</span>
              <span className="inline-flex items-center gap-1 font-bold text-primary">View <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
            </div>
          </button>
        ))}
        {!shown.length && <p className="col-span-full rounded-2xl border border-dashed bg-card py-10 text-center text-sm text-muted-foreground">No farmers match.</p>}
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- farmer detail

function FarmerDetail({ f, onBack }: { f: Farmer; onBack: () => void }) {
  const rainNow = f.series.rain.at(-1)?.[1];
  const num = (v: number | null | undefined) => (v == null ? "–" : v.toFixed(2));

  return (
    <>
      <div>
        <button type="button" onClick={onBack} className="mb-3 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" /> All farmers
        </button>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={f.name} large />
          <div className="min-w-[12rem] flex-1">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{f.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Farmer #{f.id} · {f.cooperative} · {cap(f.crop)} · {f.zone}</p>
          </div>
          <StatusBadge status={f.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Season payout" value={pct(f.payout)} note="of sum insured" accent={f.payout ? "bg-destructive" : "bg-leaf"} />
        <Tile label="Current stage" value={cap(f.stage)} accent="bg-sky" small />
        <Tile label="Rain this season" value={rainNow == null ? "–" : `${Math.round(rainNow)} mm`} accent="bg-sky" />
        <Tile label="Last evaluated" value={f.lastEvaluated ?? "never"} small />
      </div>

      <FieldMap key={f.id} farmers={demo.farmers} selected={f} />
      <SeasonCharts s={f.series} />

      <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="text-base font-bold">Growth stages</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Double trigger: a payout needs the weather index <em>and</em> satellite crop health to confirm stress in the same stage.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-muted/60 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {["Stage", "Dates", "Drought", "Excess rain", "Heat", "Weather index", "NDVI vs normal", "Scenes", "Result", "Payout"].map((h, i) => (
                  <th key={h} className={cn("px-3 py-2.5 first:rounded-l-lg last:rounded-r-lg", i >= 2 && i <= 7 || i === 9 ? "text-right" : "")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {f.stages.map(st => (
                <tr key={st.name} className="border-b align-top last:border-0">
                  <td className="px-3 py-3 font-bold">{st.name}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{fmtDay(st.start)} – {fmtDay(st.end)}</td>
                  {st.evaluated ? (
                    <>
                      {[st.drought, st.excessRain, st.heat, st.index].map((v, i) => <td key={i} className="px-3 py-3 text-right tabular-nums">{num(v)}</td>)}
                      <td className="px-3 py-3 text-right tabular-nums">{st.ndviAnomaly == null ? "–" : `${st.ndviAnomaly > 0 ? "+" : ""}${st.ndviAnomaly.toFixed(2)}`}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{st.scenes ?? "–"}</td>
                      <td className="px-3 py-3">
                        <ResultChip result={st.result ?? ""} />
                        {st.provisional && <span className="ml-1.5 text-xs text-muted-foreground">provisional</span>}
                        {!!st.notes?.length && <ul className="mt-1.5 min-w-56 list-disc pl-4 text-xs text-muted-foreground">{st.notes.map(n => <li key={n}>{n}</li>)}</ul>}
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{pct(st.payout ?? 0)}</td>
                    </>
                  ) : <td colSpan={8} className="px-3 py-3 text-muted-foreground">Not evaluated yet</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Records f={f} />
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

function Records({ f }: { f: Farmer }) {
  const facts: [string, ReactNode][] = [
    ["Phone", f.phone], ["Cooperative", f.cooperative], ["Enrolled by", f.agent], ["Location", coords(f)],
    ["Zone", f.zone], ["Crop", cap(f.crop)], ["Planting date", fmtDay(f.plantingDate)], ["Status since", f.statusSince ?? "–"],
  ];
  const tab = "rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm font-bold data-[state=active]:border-primary data-[state=active]:shadow-none";
  const count = (n: number) => <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{n}</span>;
  return (
    <section className="rounded-2xl border bg-card shadow-soft">
      <Tabs defaultValue="reports">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none rounded-t-2xl border-b bg-transparent px-3 pt-2">
          <TabsTrigger value="reports" className={tab}>Payout reports{count(f.reports.length)}</TabsTrigger>
          <TabsTrigger value="messages" className={tab}>SMS & voice{count(f.messages.length)}</TabsTrigger>
          <TabsTrigger value="history" className={tab}>Status history{count(f.history.length)}</TabsTrigger>
          <TabsTrigger value="details" className={tab}>Farmer details</TabsTrigger>
        </TabsList>
        <div className="p-5 sm:p-6">
          <TabsContent value="reports" className="mt-0">
            {f.reports.length ? (
              <ul className="grid gap-3">{f.reports.map(r => (
                <li key={r.ref} className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
                  <span className="grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive"><FileText className="size-5" /></span>
                  <div className="min-w-[12rem] flex-1">
                    <p className="font-bold">{r.stage} · <ResultChip result={r.band} /></p>
                    <p className="text-xs text-muted-foreground">{r.ref} · generated {r.created.slice(0, 16).replace("T", " ")} UTC · payout {pct(r.payout)} of sum insured</p>
                  </div>
                  <Button variant="outline" size="sm" asChild><a href={r.pdf} target="_blank" rel="noopener">Open PDF</a></Button>
                </li>
              ))}</ul>
            ) : <Empty>No confirmed triggers this season, so no payout reports.</Empty>}
          </TabsContent>
          <TabsContent value="messages" className="mt-0">
            {f.messages.length ? (
              <ul className="grid gap-3">{f.messages.map((m, i) => (
                <li key={i} className="rounded-xl border p-4">
                  <p className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <span>{m.channel}</span><span>·</span><span>{m.status.replace("_", " ")}</span>
                  </p>
                  <p className="mt-1.5 text-sm">{m.text}</p>
                </li>
              ))}</ul>
            ) : <Empty>No messages - this farm has stayed normal.</Empty>}
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            {f.history.length ? (
              <ol className="grid gap-3">{f.history.map((h, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  {h.from ? <StatusBadge status={h.from} /> : <span className="text-muted-foreground">Enrolled</span>}
                  <ArrowRight className="size-4 text-muted-foreground" /><StatusBadge status={h.to} />
                  <span className="text-muted-foreground">{h.reason}</span>
                </li>
              ))}</ol>
            ) : <Empty>No status changes yet.</Empty>}
          </TabsContent>
          <TabsContent value="details" className="mt-0">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map(([k, v]) => (
                <div key={k}><dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>
              ))}
            </dl>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
