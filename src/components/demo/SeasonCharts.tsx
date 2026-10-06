import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDay, type Point, type Series } from "@/data/demo";

const DAY = 86400000;
const toT = (iso: string) => Date.parse(iso + "T00:00:00Z");
const pts = (p: Point[]) => p.map(([d, v]) => ({ t: toT(d), v }));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthTicks(x0: number, x1: number) {
  const d = new Date(x0);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const out: number[] = [];
  for (; d.getTime() <= x1; d.setUTCMonth(d.getUTCMonth() + 1)) out.push(d.getTime());
  return out;
}

function Chart({ s, title, hint, season, normal, seasonLabel, normalLabel, color, fmt, yMin, dots, note }: {
  s: Series; title: string; hint: string; season: Point[]; normal: Point[]; seasonLabel: string; normalLabel: string;
  color: string; fmt: (v: number) => string; yMin?: number; dots?: boolean; note?: string | undefined;
}) {
  const x0 = toT(s.xMin), x1 = toT(s.xMax), today = toT(s.today);
  const a = pts(season), b = pts(normal);
  return (
    <section className="min-w-0 border-t py-6">
      <h2 className="text-base font-bold">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: color }} />{seasonLabel}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed border-muted-foreground" />{normalLabel}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-destructive/15" />Confirmed trigger</span>
      </div>
      <div className="mt-2 h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 22, right: 12, bottom: 0, left: -8 }}>
            {s.stages.map((st, i) => {
              const trig = /Trigger/.test(st.result);
              return (
                <ReferenceArea key={st.name} x1={toT(st.start)} x2={toT(st.end) + DAY} ifOverflow="hidden"
                  fill={trig ? "var(--color-destructive)" : "var(--color-foreground)"} fillOpacity={trig ? 0.12 : i % 2 ? 0.035 : 0}
                  label={{ value: st.name.replace(/ \(.*\)/, ""), position: "top", fontSize: 10, fill: "var(--color-muted-foreground)" }} />
              );
            })}
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="t" type="number" domain={[x0, x1]} ticks={monthTicks(x0, x1)} allowDuplicatedCategory={false}
              tickFormatter={t => MONTHS[new Date(t).getUTCMonth()] ?? ""} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
            <YAxis domain={[yMin ?? "auto", "auto"]} tickFormatter={fmt} width={44}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
            {today > x0 && today < x1 && <ReferenceLine x={today} stroke="var(--color-muted-foreground)" strokeDasharray="2 3"
              label={{ value: "today", position: "insideBottomRight", fontSize: 10, fill: "var(--color-muted-foreground)" }} />}
            <Tooltip labelFormatter={t => fmtDay(new Date(Number(t)).toISOString().slice(0, 10))}
              formatter={(v: number, name: string) => [fmt(v), name]}
              contentStyle={{ borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-foreground)", fontSize: 12 }} />
            <Line data={b} dataKey="v" name={normalLabel} stroke="var(--color-muted-foreground)" strokeDasharray="5 4"
              strokeWidth={1.75} dot={false} isAnimationActive={false} />
            <Line data={a} dataKey="v" name={seasonLabel} stroke={color} strokeWidth={2.25}
              dot={dots ? { r: 3, fill: color, strokeWidth: 0 } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </section>
  );
}

export function SeasonCharts({ s }: { s: Series }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
      <Chart s={s} title="Crop greenness (NDVI)" hint="Cloud-free satellite scenes this season vs. this farm's normal for each growth stage."
        season={s.ndvi} normal={s.ndviNormal} seasonLabel="This season" normalLabel="Farm normal" color="var(--color-leaf)"
        fmt={v => v.toFixed(2)} dots />
      <Chart s={s} title="Rainfall, cumulative (mm)" hint="Running total since planting vs. this farm's normal."
        season={s.rain} normal={s.rainNormal} seasonLabel="This season" normalLabel="Farm normal" color="var(--color-sky)"
        fmt={v => `${Math.round(v)}`} yMin={0}
        note={s.rainProvisionalFrom ? `Rain from ${fmtDay(s.rainProvisionalFrom)} is provisional until final satellite rainfall is published.` : undefined} />
    </div>
  );
}
