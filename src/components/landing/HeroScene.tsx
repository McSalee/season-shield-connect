/**
 * Animated landing-page hero background: a maize field at dusk with a breathing sun,
 * drifting hills, crops swaying in the wind and a satellite hovering overhead,
 * scanning the farms. Pure SVG + CSS (animations in styles.css, `hero-*`), so it is
 * sharp at any size and needs no image download. Decorative only (aria-hidden).
 * Motion stops for visitors who ask for reduced motion (global rule in styles.css).
 */

type Crop = { kind: "maize" | "sorghum" | "leafy"; x: number; y: number; scale: number; delay: number; duration: number };

// Deterministic pseudo-random so server and browser render the same scene.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const KINDS: Crop["kind"][] = ["maize", "sorghum", "maize", "leafy", "maize", "sorghum"];

// Crops stay short on the left, behind the headline, and grow taller towards the right.
const heightAt = (x: number) => (x < 620 ? 0.42 : x < 900 ? 0.42 + ((x - 620) / 280) * 0.58 : 1);

// Back row (smaller, on the far hill) and front row (larger).
const CROPS: Crop[] = [
  ...Array.from({ length: 22 }, (_, i) => {
    const x = 20 + i * 68 + rand(i) * 24;
    return { kind: KINDS[i % KINDS.length], x, y: 600 + rand(i + 40) * 8,
             scale: (0.62 + rand(i + 80) * 0.14) * heightAt(x), delay: -rand(i + 120) * 5,
             duration: 5 + rand(i + 160) * 2.2 };
  }),
  ...Array.from({ length: 16 }, (_, i) => {
    const x = 40 + i * 94 + rand(i + 200) * 30;
    return { kind: KINDS[(i + 3) % KINDS.length], x, y: 664 + rand(i + 240) * 6,
             scale: (0.95 + rand(i + 280) * 0.2) * heightAt(x), delay: -rand(i + 320) * 5,
             duration: 5.4 + rand(i + 360) * 2 };
  }),
];

function Maize() {
  return <g>
    <path d="M0 0 Q 3 -70 1 -150" stroke="#2f9d5c" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M1 -28 Q 30 -46 52 -24" stroke="#3dbb6e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M1 -58 Q -30 -78 -54 -54" stroke="#2f9d5c" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M2 -90 Q 30 -110 50 -86" stroke="#3dbb6e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M1 -118 Q -24 -136 -42 -116" stroke="#2f9d5c" strokeWidth="4" fill="none" strokeLinecap="round" />
    <ellipse cx="9" cy="-72" rx="6" ry="16" fill="#f4c95d" transform="rotate(14 9 -72)" />
    <path d="M6 -86 Q 12 -80 14 -62" stroke="#d9a33b" strokeWidth="1.6" fill="none" />
    <g stroke="#e8cf86" strokeWidth="2" strokeLinecap="round">
      <path d="M1 -150 L -7 -166" /><path d="M1 -150 L 1 -170" /><path d="M1 -150 L 9 -165" />
    </g>
  </g>;
}

function Sorghum() {
  return <g>
    <path d="M0 0 Q -2 -80 6 -138" stroke="#2f9d5c" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M-1 -34 Q -28 -52 -46 -30" stroke="#3dbb6e" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M0 -70 Q 26 -88 44 -66" stroke="#2f9d5c" strokeWidth="4" fill="none" strokeLinecap="round" />
    {Array.from({ length: 7 }, (_, i) => (
      <ellipse key={i} cx={6 + (i % 2 ? 5 : -5)} cy={-140 - i * 7} rx="5" ry="7.5"
               fill={i % 3 === 0 ? "#e9a23b" : "#f4c95d"} transform={`rotate(${i % 2 ? 18 : -18} ${6 + (i % 2 ? 5 : -5)} ${-140 - i * 7})`} />
    ))}
  </g>;
}

function Leafy() {
  return <g>
    <path d="M0 0 Q -4 -30 -30 -46 Q -10 -22 0 0" fill="#3dbb6e" />
    <path d="M0 0 Q 6 -38 34 -52 Q 12 -26 0 0" fill="#2f9d5c" />
    <path d="M0 0 Q -2 -44 2 -66 Q 8 -40 0 0" fill="#4cc277" />
  </g>;
}

const DRAW = { maize: Maize, sorghum: Sorghum, leafy: Leafy };

function Satellite() {
  return <g>
    {/* Scanning beam down to the fields; moves with the satellite. */}
    <path d="M0 18 L -130 340 L 130 340 Z" fill="url(#hero-beam)" className="hero-beam" />
    <ellipse cx="0" cy="340" rx="130" ry="14" fill="var(--color-sun)" className="hero-footprint" />
    <g className="hero-tilt">
      {/* Solar panels */}
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 50} 0)`}>
          <rect x="-34" y="-13" width="68" height="26" rx="2" fill="#1d4f7a" stroke="#9fd0ff" strokeWidth="1.5" />
          {[-17, 0, 17].map((x) => <path key={x} d={`M${x} -13 V13`} stroke="#9fd0ff" strokeWidth="1" opacity=".7" />)}
          <path d="M-34 0 H34" stroke="#9fd0ff" strokeWidth="1" opacity=".7" />
        </g>
      ))}
      <path d="M-16 0 H-18 M16 0 H18" stroke="#cfd8e3" strokeWidth="3" />
      {/* Body */}
      <rect x="-16" y="-18" width="32" height="36" rx="5" fill="#f2d27a" stroke="#c99a35" strokeWidth="1.5" />
      <path d="M-16 -6 H16 M-16 6 H16" stroke="#c99a35" strokeWidth="1" />
      {/* Dish and antenna */}
      <path d="M-11 18 Q 0 30 11 18 Z" fill="#e8edf3" stroke="#aab6c4" strokeWidth="1.2" />
      <path d="M0 -18 V-34" stroke="#cfd8e3" strokeWidth="2" />
      <circle cx="0" cy="-36" r="3" fill="var(--color-sun)" className="hero-blink" />
    </g>
  </g>;
}

export function HeroScene() {
  return (
    <svg viewBox="0 0 1440 680" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 h-full w-full"
         aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b2a1f" />
          <stop offset=".55" stopColor="#14432f" />
          <stop offset="1" stopColor="#1f5a3c" />
        </linearGradient>
        <radialGradient id="hero-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe6a3" />
          <stop offset=".55" stopColor="#f4c95d" />
          <stop offset="1" stopColor="#f4c95d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe6a3" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffe6a3" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1440" height="680" fill="url(#hero-sky)" />

      {/* Stars */}
      {Array.from({ length: 34 }, (_, i) => (
        <circle key={i} cx={rand(i + 500) * 1440} cy={rand(i + 560) * 260} r={rand(i + 620) * 1.3 + 0.5}
                fill="#fff" className="hero-twinkle" style={{ animationDelay: `${-rand(i + 680) * 4}s` }} />
      ))}

      {/* Sun */}
      <g className="hero-breathe" style={{ transformOrigin: "1250px 400px" }}>
        <circle cx="1250" cy="400" r="170" fill="url(#hero-sun)" opacity=".35" />
        <circle cx="1250" cy="400" r="78" fill="#f4c95d" opacity=".9" />
        <circle cx="1250" cy="400" r="52" fill="#ffe6a3" opacity=".75" />
      </g>

      {/* Hills */}
      <path className="hero-drift" d="M-80 520 Q 180 450 420 500 T 900 480 T 1520 470 V 680 H -80 Z" fill="#0f3d2a" />
      <path d="M-40 580 Q 260 530 560 570 T 1120 550 T 1500 560 V 680 H -40 Z" fill="#12482f" />
      <path d="M-40 636 Q 300 606 640 630 T 1260 620 T 1500 628 V 680 H -40 Z" fill="#155637" />

      {/* Satellite, hovering over the field */}
      <g className="hero-orbit">
        <g className="hero-hover">
          <Satellite />
        </g>
      </g>

      {/* Crops swaying in the wind */}
      {CROPS.map((c, i) => {
        const Draw = DRAW[c.kind];
        return <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.scale})`}>
          <g className="hero-sway" style={{ animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s` }}>
            <Draw />
          </g>
        </g>;
      })}

      {/* Front soil line */}
      <path d="M-40 660 Q 400 640 800 655 T 1500 650 V 680 H -40 Z" fill="#0f3d2a" />
    </svg>
  );
}
