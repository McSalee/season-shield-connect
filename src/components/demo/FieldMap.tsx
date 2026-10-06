import { useState } from "react";
import { Layers, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { demo, fmtDay, STATUS_LABEL, type Farmer, type LayerKey, type Status } from "@/data/demo";

const LAYERS: { key: LayerKey; label: string; hint: string }[] = [
  { key: "ndvi", label: "NDVI", hint: "Crop greenness" },
  { key: "ndmi", label: "NDMI", hint: "Crop water content" },
  { key: "rainfall", label: "Rainfall", hint: "30-day rainfall total" },
];
const DATES = Object.keys(demo.map.dates).sort();
const STATUS_DOT: Record<Status, string> = {
  normal: "bg-leaf", stress_detected: "bg-sun", trigger_confirmed: "bg-destructive",
};

// colour of the red -> amber -> green ramp at t in [0, 1] (same interpolation Earth Engine uses)
function colorAt(t: number): string {
  const p = demo.palette.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const x = t * (p.length - 1);
  const i = Math.min(p.length - 2, Math.floor(x));
  const a = p[i] ?? [0, 0, 0], b = p[i + 1] ?? a;
  return `rgb(${a.map((c, k) => Math.round(c + ((b[k] ?? c) - c) * (x - i))).join(",")})`;
}

function position(lat: number, lon: number) {
  const [[s, w], [n, e]] = demo.map.bounds;
  return { left: `${((lon - w) / (e - w)) * 100}%`, top: `${((n - lat) / (n - s)) * 100}%` };
}

export function FieldMap({ farmers, selected, onSelect }: {
  farmers: Farmer[]; selected?: Farmer; onSelect?: (id: number) => void;
}) {
  const [layer, setLayer] = useState<LayerKey>("ndvi");
  const [day, setDay] = useState(DATES[DATES.length - 1] ?? "");
  const [zoom, setZoom] = useState(selected ? 2 : 1);
  const [opacity, setOpacity] = useState(0.75);
  const data = demo.map.dates[day]?.[layer];
  const info = demo.legend[layer];
  const origin = selected ? position(selected.lat, selected.lon) : { left: "50%", top: "50%" };

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-soft" aria-labelledby="map-title">
      <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <h2 id="map-title" className="text-base font-bold">{selected ? "Field health map" : "Portfolio map"}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{demo.map.note} Each layer covers the 30 days up to the chosen date.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div role="group" aria-label="Map layer" className="flex w-full rounded-full border bg-muted p-1 sm:w-auto">
            {LAYERS.map(l => (
              <button key={l.key} type="button" title={l.hint} aria-pressed={layer === l.key} onClick={() => setLayer(l.key)}
                className={cn("flex-1 cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-colors sm:flex-none",
                  layer === l.key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                {l.label}
              </button>
            ))}
          </div>
          <label className="flex w-full items-center gap-2 text-xs font-semibold text-muted-foreground sm:w-auto">
            Date
            <select value={day} onChange={e => setDay(e.target.value)}
              className="flex-1 cursor-pointer rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground sm:flex-none">
              {DATES.map(d => <option key={d} value={d}>{fmtDay(d)}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-5 px-5 pb-5 sm:px-6 sm:pb-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
          <div className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.left} ${origin.top}` }}>
            <div className="absolute inset-0">
              <img src={demo.map.base} alt="" className="absolute inset-0 size-full object-cover" />
              {data && <img key={data.src} src={data.src} alt={`${info.title}, ${fmtDay(data.start)} to ${fmtDay(data.end)}`}
                className="absolute inset-0 size-full object-cover transition-opacity" style={{ opacity }} />}
              {farmers.map(f => {
                const isSel = selected?.id === f.id;
                return (
                  <button key={f.id} type="button" onClick={() => onSelect?.(f.id)} disabled={!onSelect}
                    title={`${f.name} - ${STATUS_LABEL[f.status]}`} aria-label={`${f.name}, ${STATUS_LABEL[f.status]}`}
                    className={cn("group absolute", onSelect && "cursor-pointer",
                      selected && !isSel && "opacity-60")}
                    style={{ ...position(f.lat, f.lon), transform: `translate(-50%, -50%) scale(${1 / zoom})` }}>
                    <span className={cn("block rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.35)]",
                      STATUS_DOT[f.status], isSel ? "size-5" : "size-3.5")} />
                    {(isSel || !selected) && (
                      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {f.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            <button type="button" aria-label="Zoom in" onClick={() => setZoom(z => Math.min(4, z * 1.5))}
              className="grid size-8 cursor-pointer place-items-center rounded-lg bg-background/95 shadow hover:bg-background"><ZoomIn className="size-4" /></button>
            <button type="button" aria-label="Zoom out" onClick={() => setZoom(z => Math.max(1, z / 1.5))}
              className="grid size-8 cursor-pointer place-items-center rounded-lg bg-background/95 shadow hover:bg-background"><ZoomOut className="size-4" /></button>
          </div>
          <label className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-background/95 px-2.5 py-1.5 text-[11px] font-semibold shadow">
            <Layers className="size-3.5" /> Overlay
            <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
              className="w-20 accent-[var(--color-primary)]" aria-label="Overlay opacity" />
          </label>
          <span className="absolute bottom-3 right-3 hidden rounded bg-background/80 sm:inline px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Contains modified Copernicus Sentinel data; CHIRPS
          </span>
        </div>

      {data && (
        <div className="grid content-start gap-3 text-xs">
          <div className="flex flex-wrap justify-between gap-2">
            <strong className="text-sm">{info.title}</strong>
            <span className="text-muted-foreground">
              {fmtDay(data.start)} – {fmtDay(data.end)} · {data.images} {layer === "rainfall" ? "days" : "scenes"}
            </span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${demo.palette.join(", ")})` }} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-5 lg:grid-cols-1">
            {info.classes.map((name, k) => {
              const n = info.classes.length, step = (data.vmax - data.vmin) / n;
              const lo = data.vmin + k * step, hi = lo + step;
              const f = (v: number) => (data.unit ? `${Math.round(v)} ${data.unit}` : v.toFixed(2));
              const range = k === 0 ? `< ${f(hi)}` : k === n - 1 ? `≥ ${f(lo)}` : `${f(lo)} – ${f(hi)}`;
              return (
                <div key={name} className="grid grid-cols-[14px_1fr_auto] items-center gap-x-2 max-lg:grid-cols-1 max-lg:gap-0.5">
                  <span className="h-1.5 rounded-full lg:size-3.5 lg:rounded" style={{ background: colorAt((k + 0.5) / n) }} />
                  <span className="font-bold">{name}</span>
                  <span className="tabular-nums text-muted-foreground">{range}</span>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground">{info.what}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-muted-foreground">
            {(["normal", "stress_detected", "trigger_confirmed"] as Status[]).map(st => (
              <span key={st} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full border border-white shadow", STATUS_DOT[st])} />{STATUS_LABEL[st]}
              </span>
            ))}
          </p>
        </div>
      )}
      </div>
    </section>
  );
}
