// Loads Leaflet from its CDN in the browser (it touches `window`, so it can't run during SSR).
// Using the CDN build keeps the map out of the server bundle and needs no extra npm package.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Leaflet = any;

const VERSION = "1.9.4";
const CSS = { href: `https://unpkg.com/leaflet@${VERSION}/dist/leaflet.css`, integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" };
const JS = { src: `https://unpkg.com/leaflet@${VERSION}/dist/leaflet.js`, integrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" };

let loading: Promise<Leaflet> | null = null;

export function loadLeaflet(): Promise<Leaflet> {
  const w = window as unknown as { L?: Leaflet };
  if (w.L) return Promise.resolve(w.L);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: CSS.href, integrity: CSS.integrity, crossOrigin: "" });
    document.head.appendChild(link);
    const script = Object.assign(document.createElement("script"), { src: JS.src, integrity: JS.integrity, crossOrigin: "", async: true });
    script.onload = () => (w.L ? resolve(w.L) : reject(new Error("Leaflet did not initialise")));
    script.onerror = () => { loading = null; reject(new Error("Leaflet failed to load")); };
    document.head.appendChild(script);
  });
  return loading;
}
