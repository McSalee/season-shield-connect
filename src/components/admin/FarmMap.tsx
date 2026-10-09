import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { loadLeaflet, type Leaflet } from "@/lib/leaflet";

// Farm location on a satellite / streets basemap, as on the local dashboard
// (gona/dashboard.py). The Earth Engine NDVI / NDMI / rainfall overlays of the local
// dashboard are not available here: they need an Earth Engine sign-in on the server.
type Basemap = "satellite" | "streets";

export function FarmMap({
  lat,
  lon,
  boundary,
  label,
}: {
  lat: number;
  lon: number;
  boundary?: unknown;
  label: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<{ L: Leaflet; m: Leaflet; layers: Record<Basemap, Leaflet> } | null>(null);
  const [base, setBase] = useState<Basemap>("satellite");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !el.current) return;
        const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lon], 16);
        const layers = {
          satellite: L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              maxZoom: 19,
              maxNativeZoom: 18,
              attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
            },
          ),
          streets: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          }),
        };
        layers.satellite.addTo(m);
        L.circleMarker([lat, lon], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#e0a100",
          fillOpacity: 1,
        })
          .addTo(m)
          .bindTooltip(label, { direction: "top", offset: [0, -8] });
        if (boundary && typeof boundary === "object") {
          try {
            const shape = L.geoJSON(boundary, {
              style: { color: "#f5c542", weight: 2, fillOpacity: 0.08 },
            }).addTo(m);
            m.fitBounds(shape.getBounds(), { padding: [24, 24], maxZoom: 17 });
          } catch {
            // a malformed outline should not hide the map
          }
        }
        L.control.scale({ imperial: false }).addTo(m);
        map.current = { L, m, layers };
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      map.current?.m.remove();
      map.current = null;
    };
  }, [lat, lon, boundary, label]);

  useEffect(() => {
    const cur = map.current;
    if (!cur) return;
    const other: Basemap = base === "satellite" ? "streets" : "satellite";
    cur.m.removeLayer(cur.layers[other]);
    cur.layers[base].addTo(cur.m);
  }, [base]);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted">
      <div
        ref={el}
        className="h-72 w-full sm:h-80"
        role="img"
        aria-label={`Map of ${label}'s farm`}
      />
      {failed && (
        <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
          The map could not load (it needs an internet connection). Farm location: {lat.toFixed(4)},{" "}
          {lon.toFixed(4)}
        </p>
      )}
      <div className="absolute right-2 top-2 z-[400] flex rounded-lg border bg-background/95 p-0.5 text-xs font-semibold shadow-sm">
        {(["satellite", "streets"] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBase(b)}
            aria-pressed={base === b}
            className={cn(
              "rounded-md px-2.5 py-1 capitalize",
              base === b
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
