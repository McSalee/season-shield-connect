import { useEffect, useRef, useState, type FormEvent } from "react";
import { Info, Layers, LocateFixed, PenLine, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { demo, fmtDay, STATUS_LABEL, type Farmer, type LayerKey, type Status } from "@/data/demo";
import { loadLeaflet, type Leaflet } from "@/lib/leaflet";

const LAYERS: { key: LayerKey; label: string; hint: string }[] = [
  { key: "ndvi", label: "NDVI", hint: "Crop greenness" },
  { key: "ndmi", label: "NDMI", hint: "Crop water content" },
  { key: "rainfall", label: "Rainfall", hint: "30-day rainfall total" },
];
const DATES = Object.keys(demo.map.dates).sort();
const STATUS_DOT: Record<Status, string> = {
  normal: "bg-leaf", stress_detected: "bg-sun", trigger_confirmed: "bg-destructive",
};
const OUTSIDE_MSG = "Live satellite layers are only available for enrolled farmers. Search is available in the real dashboard.";
const [[S, W], [N, E]] = demo.map.bounds;
const inDemoArea = (lat: number, lon: number) => lat >= S && lat <= N && lon >= W && lon <= E;

// colour of the red -> amber -> green ramp at t in [0, 1] (same interpolation Earth Engine uses)
function colorAt(t: number): string {
  const p = demo.palette.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const x = t * (p.length - 1);
  const i = Math.min(p.length - 2, Math.floor(x));
  const a = p[i] ?? [0, 0, 0], b = p[i + 1] ?? a;
  return `rgb(${a.map((c, k) => Math.round(c + ((b[k] ?? c) - c) * (x - i))).join(",")})`;
}

// "10.41, 8.69", "10.41 8.69", "10.41N 8.69E", "10.41°N, 8.69°E"
function parseCoords(text: string): [number, number] | null {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?$/i);
  if (!m) return null;
  let lat = parseFloat(m[1] ?? ""), lon = parseFloat(m[3] ?? "");
  if (m[2] && /s/i.test(m[2])) lat = -Math.abs(lat);
  if (m[4] && /w/i.test(m[4])) lon = -Math.abs(lon);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? [lat, lon] : null;
}

// Area of a small lat/lon polygon in hectares (local equirectangular projection; fine at field scale).
function hectares(pts: [number, number][]): number {
  if (pts.length < 3) return 0;
  const lat0 = (pts.reduce((s, p) => s + p[0], 0) / pts.length) * Math.PI / 180;
  const xy = pts.map(([la, lo]) => [lo * 111320 * Math.cos(lat0), la * 110540] as const);
  let a = 0;
  xy.forEach(([x1, y1], i) => { const [x2, y2] = xy[(i + 1) % xy.length] ?? [x1, y1]; a += x1 * y2 - x2 * y1; });
  return Math.abs(a) / 2 / 10000;
}

type Msg = { text: string; kind: "info" | "warn" | "error" } | null;

export function FieldMap({ farmers, selected, onSelect }: {
  farmers: Farmer[]; selected?: Farmer; onSelect?: (id: number) => void;
}) {
  const [layer, setLayer] = useState<LayerKey>("ndvi");
  const [day, setDay] = useState(DATES[DATES.length - 1] ?? "");
  const [opacity, setOpacity] = useState(0.75);
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [drawing, setDrawing] = useState(false);
  const [field, setField] = useState<[number, number][]>([]);
  const [ready, setReady] = useState(false);
  const data = demo.map.dates[day]?.[layer];
  const info = demo.legend[layer];

  const box = useRef<HTMLDivElement>(null);
  const L = useRef<Leaflet>(null);
  const map = useRef<Leaflet>(null);
  const overlay = useRef<Leaflet>(null);
  const pin = useRef<Leaflet>(null);
  const shape = useRef<Leaflet>(null);
  const drawingRef = useRef(false);
  drawingRef.current = drawing;

  // create the map once (Leaflet is browser-only, so it loads after the page renders)
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(lib => {
      if (cancelled || !box.current) return;
      L.current = lib;
      const m = lib.map(box.current, { scrollWheelZoom: false, zoomControl: true });
      map.current = m;
      // drag, pinch and +/- always work; wheel zoom only while working with the map so the page still scrolls
      m.on("click focus", () => m.scrollWheelZoom.enable());
      m.on("mouseout blur", () => m.scrollWheelZoom.disable());
      const satellite = lib.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, maxNativeZoom: 18, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" }).addTo(m);
      const streets = lib.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" });
      lib.control.layers({ Satellite: satellite, Streets: streets }, null, { position: "topright" }).addTo(m);
      lib.control.scale({ imperial: false }).addTo(m);
      lib.rectangle(demo.map.bounds, { color: "#ffffff", weight: 1.5, dashArray: "6 6", fill: false, interactive: false }).addTo(m);

      farmers.forEach(f => {
        const isSel = selected?.id === f.id;
        const icon = lib.divIcon({
          className: "",
          html: `<span class="demo-map-dot block rounded-full border-2 ${STATUS_DOT[f.status]} ${isSel ? "size-5" : "size-3.5"}"></span>`,
          iconSize: isSel ? [20, 20] : [14, 14],
        });
        const mk = lib.marker([f.lat, f.lon], { icon, title: `${f.name} - ${STATUS_LABEL[f.status]}`, opacity: selected && !isSel ? 0.6 : 1 })
          .bindTooltip(f.name, { direction: "bottom", offset: [0, 8], permanent: isSel || !selected, className: "demo-map-label rounded px-2 py-1 text-[10px] font-semibold" })
          .addTo(m);
        if (onSelect) mk.on("click", () => { if (!drawingRef.current) onSelect(f.id); });
      });

      if (selected) m.setView([selected.lat, selected.lon], 15);
      else m.fitBounds(demo.map.bounds);

      m.on("click", (ev: Leaflet) => {
        if (drawingRef.current) setField(pts => [...pts, [ev.latlng.lat, ev.latlng.lng]]);
      });
      m.on("dblclick", (ev: Leaflet) => {
        if (!drawingRef.current) return;
        lib.DomEvent.stop(ev);
        // the double-click's own two clicks each added a corner at the same spot; keep one
        setField(pts => (pts.length > 3 ? pts.slice(0, -1) : pts));
        setDrawing(false);
      });
      setReady(true);
      new ResizeObserver(() => m.invalidateSize()).observe(box.current);
    }).catch(() => setMsg({ text: "The map library could not load. Check your internet connection and reload.", kind: "error" }));
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // the map is rebuilt per farmer via the parent's key; markers don't change while mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // satellite layer overlay (pre-rendered images, pinned to the Saminaka demo area)
  useEffect(() => {
    if (!ready || !L.current || !map.current) return;
    overlay.current?.remove();
    overlay.current = data
      ? L.current.imageOverlay(data.src, demo.map.bounds, { opacity, zIndex: 10, alt: `${info.title}, ${fmtDay(data.start)} to ${fmtDay(data.end)}` }).addTo(map.current)
      : null;
  }, [ready, data, info.title]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { overlay.current?.setOpacity(opacity); }, [opacity]);

  // outlined field
  useEffect(() => {
    if (!ready || !L.current || !map.current) return;
    shape.current?.remove();
    shape.current = null;
    if (!field.length) return;
    const style = { color: "#ffffff", weight: 2.5, fillColor: "#ffffff", fillOpacity: 0.12 };
    shape.current = (drawing || field.length < 3
      ? L.current.polyline(field, { ...style, dashArray: "5 5" })
      : L.current.polygon(field, style)).addTo(map.current);
  }, [ready, field, drawing]);

  useEffect(() => { map.current?.doubleClickZoom[drawing ? "disable" : "enable"](); }, [ready, drawing]);

  function jumpTo(lat: number, lon: number, label: string) {
    const lib = L.current, m = map.current;
    if (!lib || !m) return;
    pin.current?.remove();
    const icon = lib.divIcon({
      className: "",
      html: '<span class="demo-map-dot block size-5 -rotate-45 rounded-[50%_50%_50%_0] border-2 bg-sky"></span>',
      iconSize: [20, 20], iconAnchor: [10, 20],
    });
    const span = document.createElement("span");
    span.textContent = label;
    pin.current = lib.marker([lat, lon], { icon, title: label }).bindPopup(span).addTo(m);
    m.setView([lat, lon], inDemoArea(lat, lon) ? 15 : 13);
    setMsg(inDemoArea(lat, lon) ? { text: `Showing ${label}.`, kind: "info" } : { text: OUTSIDE_MSG, kind: "warn" });
  }

  async function onSearch(ev: FormEvent) {
    ev.preventDefault();
    const text = query.trim();
    if (!text || !map.current) return;
    const c = parseCoords(text);
    if (c) return jumpTo(c[0], c[1], `${c[0].toFixed(5)}, ${c[1].toFixed(5)}`);
    setMsg({ text: `Searching for “${text}”…`, kind: "info" });
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: text, format: "jsonv2", limit: "1" })}`,
        { headers: { "Accept-Language": "en" } });
      if (!r.ok) throw new Error(`search service returned ${r.status}`);
      const [hit] = (await r.json()) as { lat: string; lon: string; display_name: string }[];
      if (!hit) return setMsg({ text: `No place found for “${text}”. Try adding the state, e.g. “Saminaka, Kaduna”, or enter coordinates.`, kind: "error" });
      jumpTo(Number(hit.lat), Number(hit.lon), hit.display_name.split(",").slice(0, 3).join(","));
    } catch (err) {
      setMsg({ text: `Place search failed: ${(err as Error).message}`, kind: "error" });
    }
  }

  function locate() {
    if (!navigator.geolocation) return setMsg({ text: "This browser cannot share its location.", kind: "error" });
    setMsg({ text: "Finding your location…", kind: "info" });
    navigator.geolocation.getCurrentPosition(
      p => jumpTo(p.coords.latitude, p.coords.longitude, "Your location"),
      e => setMsg({ text: `Could not get your location: ${e.code === 1 ? "permission was denied." : e.message}`, kind: "error" }),
      { enableHighAccuracy: true, timeout: 15000 });
  }

  function backToStart() {
    pin.current?.remove(); pin.current = null; setMsg(null); setQuery("");
    if (selected) map.current?.setView([selected.lat, selected.lon], 15);
    else map.current?.fitBounds(demo.map.bounds);
  }

  const area = hectares(field);
  const tool = "inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted";

  return (
    <section className="min-w-0 border-y bg-card" aria-labelledby="map-title">
      <div className="flex flex-wrap items-start gap-4 py-5">
        <div className="min-w-0 flex-1">
          <h2 id="map-title" className="text-lg font-bold">{selected ? "Field health map" : "Portfolio map"}</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{demo.map.note} Layers cover the dashed demo area; each shows the 30 days up to the chosen date.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div role="group" aria-label="Map layer" className="flex w-full rounded-md bg-muted p-1 sm:w-auto">
            {LAYERS.map(l => (
              <Button key={l.key} variant="ghost" size="sm" type="button" title={l.hint} aria-pressed={layer === l.key} onClick={() => setLayer(l.key)}
                className={cn("h-8 flex-1 rounded px-4 text-xs font-semibold sm:flex-none",
                  layer === l.key ? "bg-card text-primary shadow-sm hover:bg-card" : "text-muted-foreground hover:text-foreground")}>
                {l.label}
              </Button>
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

      <div className="flex flex-wrap items-center gap-2 pb-3">
        <form onSubmit={onSearch} role="search" className="flex min-w-0 flex-[1_1_320px] gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search a place or coordinates"
              placeholder="Search a place, or enter lat, lon (e.g. 10.41, 8.69)"
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm" />
          </label>
          <Button type="submit" size="sm" className="h-auto rounded-md px-4 text-xs font-semibold">Search</Button>
        </form>
        <button type="button" onClick={locate} className={tool} title="Show my location"><LocateFixed className="size-4" />Locate me</button>
        {drawing ? (
          <button type="button" onClick={() => setDrawing(false)} className={cn(tool, "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}>
            Finish outline
          </button>
        ) : (
          <button type="button" onClick={() => { setField([]); setDrawing(true); }} className={tool} title="Click points on the map to outline a field">
            <PenLine className="size-4" />Outline field
          </button>
        )}
        {!!field.length && <button type="button" onClick={() => { setField([]); setDrawing(false); }} className={tool}><Trash2 className="size-4" />Clear</button>}
      </div>

      {(msg || drawing || field.length >= 3) && (
        <div className="pb-3">
          <p role="status" className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-xs",
            msg?.kind === "warn" ? "bg-sun/20 text-foreground" : msg?.kind === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span className="flex-1">
              {msg?.text}{msg && (drawing || field.length >= 3) ? " " : ""}
              {drawing ? `Outlining: click the field corners on the map (${field.length} point${field.length === 1 ? "" : "s"}), double-click or press Finish when done.`
                : field.length >= 3 ? `Outlined field: about ${area < 10 ? area.toFixed(2) : area.toFixed(1)} ha. (Demo only - not saved.)` : ""}
            </span>
            {msg && <button type="button" onClick={backToStart} className="cursor-pointer font-bold underline">
              {selected ? "Back to farm" : "Back to portfolio"}</button>}
            {msg && <button type="button" aria-label="Dismiss" onClick={() => setMsg(null)} className="cursor-pointer"><X className="size-3.5" /></button>}
          </p>
        </div>
      )}

      <div className="grid gap-6 pb-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="demo-map-canvas relative aspect-square w-full overflow-hidden rounded-md lg:aspect-auto lg:h-[520px]">
          <div ref={box} className={cn("absolute inset-0 z-0", drawing && "cursor-crosshair [&_.leaflet-container]:cursor-crosshair")}
            role="region" aria-label="Interactive satellite map" />
          <label className="absolute bottom-7 left-3 z-[500] flex items-center gap-2 rounded-md border bg-card/95 px-3 py-2 text-[11px] font-semibold">
            <Layers className="size-3.5" /> Overlay
            <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
              className="w-20 accent-[var(--color-primary)]" aria-label="Overlay opacity" />
          </label>
        </div>

      {data && (
        <div className="grid content-start gap-4 text-xs lg:border-l lg:pl-6">
          <div className="flex flex-col gap-2">
            <strong className="text-sm">{info.title}</strong>
            <span className="text-[11px] text-muted-foreground">
              {fmtDay(data.start)} – {fmtDay(data.end)} · {data.images} {layer === "rainfall" ? "days" : "scenes"}
            </span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${demo.palette.join(", ")})` }} />
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-1">
            {info.classes.map((name, k) => {
              const n = info.classes.length, step = (data.vmax - data.vmin) / n;
              const lo = data.vmin + k * step, hi = lo + step;
              const f = (v: number) => (data.unit ? `${Math.round(v)} ${data.unit}` : v.toFixed(2));
              const range = k === 0 ? `< ${f(hi)}` : k === n - 1 ? `≥ ${f(lo)}` : `${f(lo)} – ${f(hi)}`;
              return (
                <div key={name} className="grid grid-cols-[10px_1fr_auto] items-center gap-x-2 border-b py-3">
                  <span className="size-2.5 rounded-sm" style={{ background: colorAt((k + 0.5) / n) }} />
                  <span className="text-[11px] font-medium">{name}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{range}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{info.what}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-3 border-t pt-4 text-[11px] text-muted-foreground lg:flex-col">
            {(["normal", "stress_detected", "trigger_confirmed"] as Status[]).map(st => (
              <span key={st} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", STATUS_DOT[st])} />{STATUS_LABEL[st]}
              </span>
            ))}
          </p>
          <p className="text-[11px] text-muted-foreground">Contains modified Copernicus Sentinel data; CHIRPS rainfall.</p>
        </div>
      )}
      </div>
    </section>
  );
}
