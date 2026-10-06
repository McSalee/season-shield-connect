import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight, Building2, Check, ChevronDown, CloudRain, Globe2, Headphones,
  Landmark, LogIn, Mail, Menu, Network, Pause, Play, Radio, Satellite,
  ShieldCheck, Sprout, Users, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImage from "@/assets/gonaai-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "GonaAI | Climate Takaful for African Agriculture" },
    { name: "description", content: "Satellite-driven Takaful protection and local-language climate advisories for African agriculture." },
    { property: "og:title", content: "GonaAI Climate Takaful" },
    { property: "og:description", content: "Protecting African farming seasons with mutual protection and climate intelligence." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const tabs = [
  { id: "satellite", label: "Satellite-triggered Takaful", icon: Satellite, headline: "Zero paperwork. Zero delay.", points: [
    ["Hyper-local tracking", "Rainfall and soil moisture are tracked across specific Nigerian coordinate grids using remote-sensing satellite data."],
    ["Automated verification", "No physical loss adjusters, administrative delays, or room for fraud."],
    ["Rapid mobilization", "Payouts are pushed to mobile wallets within 48 hours of a climate threshold breach."],
  ] },
  { id: "pooling", label: "Mutual risk pooling", icon: ShieldCheck, headline: "Community-first safety nets.", points: [
    ["Cooperative ownership", "Contributions belong to a fund owned by the participating farmers—not to corporate balance sheets."],
    ["Shariah-compliant", "Free of Riba, Gharar, and Maisir, opening protection to underserved Muslim farming communities."],
    ["Systemic protection", "Risk is spread across agro-ecological zones to shield entire agribusiness supply chains."],
  ] },
  { id: "voice", label: "Local-language advisories", icon: Radio, headline: "Actionable insights in native voices.", points: [
    ["Early warning system", "Automated voice calls push hyper-local agronomic guidance straight to basic feature phones."],
    ["Loss prevention", "Farmers learn exactly when to plant, fertilize, or harvest—before losses happen."],
    ["Inclusive design", "Voice-first delivery removes barriers for non-literate farmers and women smallholders."],
  ] },
  { id: "dividends", label: "Cash-back dividends", icon: WalletCards, headline: "Rewarding a successful season.", points: [
    ["Surplus distribution", "When the weather behaves and no claims are triggered, unspent surplus belongs to the community."],
    ["Direct cash returns", "Dividends land via OPay, Moniepoint, or PalmPay—or roll over into next season’s contribution."],
    ["The loyalty engine", "A lasting retention tool for input providers, lenders, and outgrower schemes."],
  ] },
] as const;

// Demo = static partner dashboard with fictional farmers. Placeholder until the partner portal is live.
const DEMO_URL = "/demo";
const DASHBOARD_URL = "#partner";

const grid = [
  "M20 30 L95 22 L110 80 L35 92 Z", "M95 22 L175 28 L180 85 L110 80 Z", "M175 28 L250 20 L262 78 L180 85 Z",
  "M35 92 L110 80 L118 140 L42 150 Z", "M110 80 L180 85 L188 145 L118 140 Z", "M180 85 L262 78 L268 138 L188 145 Z",
];

function SatelliteVisual() {
  const [drought, setDrought] = useState(false);
  return <div className="rounded-xl bg-primary-foreground/10 p-4">
    <div className="relative overflow-hidden rounded-lg bg-primary/60">
      <svg viewBox="0 0 288 170" className="relative z-10 w-full" role="img" aria-label={drought ? "Geofenced farm plots turning amber as a drought is detected" : "Geofenced farm plots with healthy rainfall"}>
        {grid.map((d, i) => <path key={d} d={d} className="stroke-primary-foreground/40 transition-[fill] duration-700" strokeWidth="1.5" style={{ fill: drought && i % 3 !== 0 ? "color-mix(in oklab, var(--color-sun) 70%, transparent)" : "color-mix(in oklab, var(--color-leaf) 55%, transparent)", transitionDelay: `${i * 120}ms` }} />)}
        <circle cx="149" cy="112" r="5" className="fill-sun signal-pulse" />
      </svg>
      <span className="radar-spin pointer-events-none absolute left-1/2 top-1/2 size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,color-mix(in_oklab,var(--color-sun)_22%,transparent)_40deg,transparent_60deg)]" />
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
      <span className="flex items-center gap-2"><CloudRain className="size-4 text-sun" />{drought ? "Rainfall 38% below threshold · payout queued" : "Rainfall within normal range"}</span>
      <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => setDrought(!drought)}>{drought ? "Reset season" : "Simulate drought"}</Button>
    </div>
  </div>;
}

function PoolVisual() {
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-primary-foreground/10 p-6">
    <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map(i => <span key={i} className="grid size-11 place-items-center rounded-full bg-primary-foreground/15"><Users className="size-5 text-sun" /></span>)}</div>
    <div className="flex flex-1 flex-col gap-2">{[0, 1, 2].map(i => <span key={i} className="signal-pulse h-0.5 rounded-full bg-sun/70" style={{ animationDelay: `${i * 300}ms` }} />)}</div>
    <div className="grid place-items-center text-center"><span className="grid size-20 place-items-center rounded-2xl bg-sun text-primary shadow-soft"><ShieldCheck className="size-10" /></span><span className="mt-3 max-w-28 text-[11px] font-extrabold uppercase leading-4">Participant Risk Fund</span></div>
  </div>;
}

function VoiceVisual({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  const [lang, setLang] = useState<"Hausa" | "Yoruba">("Hausa");
  return <div className="mx-auto w-full max-w-60 rounded-[1.75rem] border-4 border-primary-foreground/25 bg-primary/70 p-5">
    <div className="flex justify-center gap-1 text-[11px] font-bold">{(["Hausa", "Yoruba"] as const).map(l => <button key={l} type="button" onClick={() => setLang(l)} className={`rounded-full px-3 py-1 ${lang === l ? "bg-sun text-primary" : "bg-primary-foreground/10"}`}>{l}</button>)}</div>
    <p className="mt-4 text-center text-[11px] text-primary-foreground/70">Incoming advisory · {lang}</p>
    <div className="mt-3 flex h-12 items-center justify-center gap-1" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <span key={i} className="sound-bar w-1 rounded-full bg-sun" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${i * 70}ms`, animationPlayState: playing ? "running" : "paused" }} />)}</div>
    <Button variant="secondary" size="sm" className="mt-4 w-full rounded-lg" onClick={onToggle}>{playing ? <Pause /> : <Play />}{playing ? "Pause sample" : "Listen to sample"}</Button>
  </div>;
}

function DividendVisual() {
  const [weather, setWeather] = useState(40);
  const pool = 10_000_000, claims = Math.round(pool * 0.85 * (1 - weather / 100)), surplus = pool - claims;
  const good = weather >= 80;
  const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
  return <div className="rounded-xl bg-primary-foreground/10 p-5">
    <div className="flex justify-between text-[11px] font-bold uppercase text-primary-foreground/70"><span>Drought year</span><span>Good weather year</span></div>
    <input type="range" min={0} max={100} value={weather} onChange={e => setWeather(Number(e.target.value))} aria-label="Season weather quality" className="mt-2 w-full accent-[var(--color-sun)]" />
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-lg bg-primary/60 p-3"><p className="text-[11px] text-primary-foreground/70">Claims paid</p><strong>{naira(claims)}</strong></div>
      <div className={`rounded-lg p-3 transition-colors ${good ? "bg-sun text-primary" : "bg-primary/60"}`}><p className="text-[11px] opacity-70">Surplus to farmers</p><strong>{naira(surplus)}</strong></div>
    </div>
    {good && <p key="win" className="panel-enter mt-4 flex items-center gap-2 text-xs font-bold text-sun"><WalletCards className="size-4" /> Dividends sent to 1,000 farmer wallets · {naira(Math.round(surplus / 1000))} each</p>}
  </div>;
}

const featureRows = [
  { icon: Satellite, title: "Satellite-verified protection without paperwork", copy: "Independent climate data verifies weather events automatically, removing delays and expensive field assessments." },
  { icon: ShieldCheck, title: "Ethical protection built around shared responsibility", copy: "No interest, hidden uncertainty, or speculation—only transparent mutual protection for farming communities." },
  { icon: Headphones, title: "Practical guidance delivered in local languages", copy: "Voice calls bring hyper-local weather and agronomic advice to farmers using any kind of mobile phone." },
  { icon: WalletCards, title: "A successful season returns value to farmers", copy: "Eligible surplus is shared as a cash-back dividend or rolled into protection for the next farming season." },
] as const;

function Brand({ inverted = false }: { inverted?: boolean }) {
  return <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="GonaInsured home">
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-10 shrink-0">
      <defs>
        <linearGradient id={inverted ? "gona-mark-footer" : "gona-mark-header"} x1="48" y1="7" x2="15" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-leaf)" />
          <stop offset="1" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      <path d="M4 31C4 16.1 16.1 4 31 4h25v13.5a7.5 7.5 0 0 1-7.5 7.5H39c-7.7 0-14 6.3-14 14v3H4V31Z" fill={`url(#${inverted ? "gona-mark-footer" : "gona-mark-header"})`} />
      <path d="M4 31v29h27c16 0 29-13 29-29v-6H45v6c0 7.7-6.3 14-14 14h-6V31H4Z" fill={`url(#${inverted ? "gona-mark-footer" : "gona-mark-header"})`} />
    </svg>
    <span className="whitespace-nowrap text-[1.35rem] font-extrabold leading-none sm:text-[1.65rem]">
      <span className={inverted ? "text-primary-foreground" : "text-foreground"}>Gona</span><span className="text-sun">Insured</span>
    </span>
  </a>;
}

function Index() {
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sent, setSent] = useState(false);
  const item = tabs[active] ?? tabs[0];
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setSent(true); };

  return <div id="top" className="min-h-screen bg-background text-foreground">
    <div className="bg-announcement text-announcement-foreground"><div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-5 text-[11px] font-semibold lg:px-8"><span>Climate protection made for African agriculture <a href="#how" className="ml-2 underline">Learn more</a></span><span className="hidden items-center gap-5 sm:flex"><span className="flex items-center gap-1"><Mail className="size-3"/> partners@gona.ai</span><span>Nigeria <ChevronDown className="inline size-3"/></span><span>EN <ChevronDown className="inline size-3"/></span></span></div></div>
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8"><Brand/><nav className="hidden items-center gap-2 lg:flex">{[["Home","#top"],["How It Works","#how"],["Our Impact","#impact"],["Ethical Framework","#ethics"],["FAQs","#faqs"]].map(([x,h],i)=><a key={x} href={h} className={`rounded-xl px-4 py-3 text-xs font-bold transition-colors ${i===0?"bg-secondary text-primary":"hover:bg-secondary"}`}>{x}</a>)}</nav><div className="hidden items-center gap-1 lg:flex"><Button variant="ghost" className="rounded-xl text-xs font-bold" asChild><a href={DEMO_URL}><Play/>Demo</a></Button><Button variant="ghost" className="rounded-xl text-xs font-bold" asChild><a href={DASHBOARD_URL}><LogIn/>Dashboard Login</a></Button><Button className="ml-2 rounded-xl" asChild><a href="#partner">Partner With Us</a></Button></div><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle navigation" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</Button></div>{menu&&<div className="border-t bg-background px-5 py-3 lg:hidden">{[["Home","#top"],["How It Works","#how"],["Our Impact","#impact"],["Ethical Framework","#ethics"],["FAQs","#faqs"],["Demo",DEMO_URL],["Dashboard Login",DASHBOARD_URL],["Partner With Us","#partner"]].map(([x,h])=><a key={x} href={h} onClick={()=>setMenu(false)} className="block border-b py-3 text-sm font-bold">{x}</a>)}</div>}</header>

    <main>
      <section className="relative overflow-hidden bg-primary text-primary-foreground"><div className="pointer-events-none absolute -bottom-32 right-1/3 size-72 rounded-full border-[30px] border-sun/15"/><div className="mx-auto grid min-h-[580px] max-w-7xl items-center lg:grid-cols-2"><div className="relative z-10 px-6 py-16 lg:px-14"><p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sun"><Satellite className="size-4"/> Climate intelligence for every season</p><h1 className="text-4xl font-bold leading-tight sm:text-6xl">A climate shock shouldn’t stop a farming season.</h1><p className="mt-6 max-w-lg text-sm leading-7 text-primary-foreground/85 sm:text-base">Satellite-driven Takaful protection and local-language advisories help African farmers recover quickly—and share in the value of a successful season.</p><div className="mt-8 flex flex-wrap gap-3"><Button variant="secondary" size="lg" className="rounded-xl px-7" asChild><a href="#partner">Partner with us <ArrowRight/></a></Button><Button variant="outline" size="lg" className="rounded-xl border-primary-foreground/40 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild><a href="#impact">Explore our impact</a></Button></div></div><div className="h-full min-h-[420px] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"><img src={heroImage} alt="A northern Nigerian farmer using GonaAI climate guidance in her field" className="h-full w-full object-cover object-center"/></div></div></section>

      <section aria-label="Partner ecosystem" className="overflow-hidden bg-background py-11"><p className="mb-8 text-center text-xs font-bold">They’re building climate resilience with us</p><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-14 gap-y-7 px-5 text-muted-foreground">{[{icon:Sprout,label:"Farming cooperatives"},{icon:Landmark,label:"Islamic finance"},{icon:Building2,label:"Input suppliers"},{icon:Network,label:"Outgrower networks"}].map(({icon:Icon,label})=><div className="flex items-center gap-2 text-sm font-extrabold" key={label}><Icon className="size-6 text-primary"/>{label}</div>)}</div></section>

      <section id="how" className="scroll-mt-28 bg-secondary py-20"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.78fr_1.22fr] lg:px-8"><div><h2 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">Quick and easy climate protection for every farmer</h2><p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">We’re modernizing agricultural protection to remove the barriers that keep smallholder farmers exposed to unpredictable weather.</p></div><div className="space-y-4">{featureRows.map(({icon:Icon,title,copy})=><article key={title} className="flex gap-5 rounded-2xl bg-card p-6 shadow-soft"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-primary"><Icon className="size-5"/></span><div><h3 className="font-sans text-sm font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div></article>)}</div></div></section>

      <section className="py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase text-primary">The protection journey</p><h2 className="mt-3 text-4xl font-bold sm:text-5xl">One connected system, four clear advantages.</h2></div><div className="mt-10 grid gap-7 lg:grid-cols-[.78fr_1.22fr]"><div className="grid gap-2">{tabs.map((tab,i)=><Button key={tab.id} variant="ghost" onClick={()=>setActive(i)} className={`h-auto justify-start rounded-xl px-5 py-5 text-left ${active===i?"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground":"bg-secondary hover:bg-secondary/70"}`}><span className="mr-4 grid size-9 place-items-center rounded-full bg-background/90 text-primary"><tab.icon className="size-4"/></span><span>{tab.label}</span><ArrowRight className="ml-auto size-4"/></Button>)}</div><article key={item.id} className="panel-enter relative min-h-[340px] overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12"><span className="absolute -bottom-16 -right-16 size-52 rounded-full border-[34px] border-sun/30"/><div className="relative grid gap-8 xl:grid-cols-[1fr_1.05fr] xl:items-center"><div><item.icon className="size-10 text-sun"/><h3 className="mt-8 max-w-lg text-3xl font-bold sm:text-4xl">{item.headline}</h3><ul className="mt-6 space-y-4">{item.points.map(([t,p])=><li key={t} className="flex gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-sun"/><span><strong className="font-extrabold">{t}:</strong> <span className="text-primary-foreground/75">{p}</span></span></li>)}</ul></div>{item.id==="satellite"?<SatelliteVisual/>:item.id==="pooling"?<PoolVisual/>:item.id==="voice"?<VoiceVisual playing={playing} onToggle={()=>setPlaying(!playing)}/>:<DividendVisual/>}</div></article></div></div></section>

      <section id="impact" className="scroll-mt-28 bg-primary py-20 text-primary-foreground"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-extrabold uppercase text-sun">Our impact</p><h2 className="mt-3 text-4xl font-bold sm:text-5xl">Protection that keeps value in rural communities.</h2></div><div className="grid gap-4 sm:grid-cols-3">{[["100%","Shariah-compliant inclusion","Climate protection for millions of farmers previously excluded on religious grounds."],["0%","Literacy barriers","Deep rural adaptation through localized, voice-based phone advisories."],["↻","Circular financial retention","Cash-back dividends keep wealth inside rural economies, not corporate boards."]].map(([metric,label,desc])=><div className="rounded-2xl bg-primary-foreground/10 p-6" key={label}><strong className="text-4xl text-sun">{metric}</strong><p className="mt-8 text-sm font-bold leading-5">{label}</p><p className="mt-2 text-xs leading-5 text-primary-foreground/70">{desc}</p></div>)}</div></div><div className="mt-12 flex flex-wrap gap-3">{["SDG 1 · No Poverty","SDG 2 · Zero Hunger","SDG 13 · Climate Action"].map(x=><span key={x} className="rounded-full border border-primary-foreground/25 px-5 py-3 text-xs font-bold">{x}</span>)}</div></div></section>

      <section id="ethics" className="scroll-mt-28 bg-secondary py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid gap-12 lg:grid-cols-2"><div><p className="text-xs font-extrabold uppercase text-primary">Ethical framework</p><h2 className="mt-3 text-4xl font-bold sm:text-5xl">Shared responsibility, clearly defined.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">GonaAI is built around mutual protection—not interest, speculation, or hidden uncertainty.</p></div><div className="space-y-3">{[["No Riba","No interest-based mechanisms."],["No Gharar","Clear thresholds and transparent terms."],["No Maisir","Mutual protection, never speculation."]].map(([h,p])=><div key={h} className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-soft"><Check className="size-5 text-primary"/><div><h3 className="font-sans text-sm font-extrabold">{h}</h3><p className="mt-1 text-sm text-muted-foreground">{p}</p></div></div>)}</div></div></div></section>

      <section id="faqs" className="scroll-mt-28 py-20"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8"><div><p className="text-xs font-extrabold uppercase text-primary">Frequently asked questions</p><h2 className="mt-3 text-4xl font-bold sm:text-5xl">Quick answers for practical deployment.</h2></div><Accordion type="single" collapsible>{([ ["Who can partner with GonaAI?","Agribusinesses, grant funders, Takaful underwriters, cooperatives, input suppliers, lenders, and outgrower networks."], ["How are payouts triggered?","Pre-agreed climate thresholds are monitored by satellite. A verified breach starts the payout workflow."], ["Do farmers need smartphones?","No. Advisories are delivered through local-language voice calls designed for basic feature phones."], ["What happens in a good weather year?","Eligible surplus can return through mobile money or roll over into the next season’s protection."] ] as const).map(([q,a])=><AccordionItem value={q} key={q}><AccordionTrigger className="py-6 text-left font-extrabold hover:no-underline">{q}</AccordionTrigger><AccordionContent className="pr-8 leading-6 text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion></div></section>

      <section id="partner" className="scroll-mt-28 bg-secondary py-20"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><p className="text-xs font-extrabold uppercase text-primary">Partner with GonaAI</p><h2 className="mt-3 text-4xl font-bold sm:text-5xl">Let’s protect the season together.</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">Deploy a development grant, de-risk an outgrower network, or anchor an underwriting pool with infrastructure built for the field.</p></div>{sent?<div className="grid min-h-[420px] place-items-center rounded-2xl bg-primary p-10 text-center text-primary-foreground"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-sun text-primary"><Check/></span><h3 className="mt-5 text-3xl font-bold">Request received.</h3><p className="mt-3 text-sm text-primary-foreground/70">Thank you. Your collaboration scope is ready for our partnership team.</p><Button variant="secondary" className="mt-7 rounded-xl" onClick={()=>setSent(false)}>Send another request</Button></div></div>:<form onSubmit={submit} className="rounded-2xl bg-card p-6 shadow-soft sm:p-9"><div className="grid gap-x-5 sm:grid-cols-2"><Field label="Name"><input required name="name" className="h-12 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" placeholder="Your full name"/></Field><Field label="Institutional email"><input required type="email" name="email" className="h-12 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" placeholder="name@organisation.org"/></Field></div><Field label="I am a..."><select required name="role" defaultValue="" className="h-12 w-full rounded-xl border bg-background px-4"><option value="" disabled>Select partnership type</option><option>Agribusiness Grant Donor</option><option>Takaful Underwriter</option></select></Field><Field label="Message / scope of collaboration"><textarea required name="message" rows={4} className="w-full resize-none rounded-xl border bg-background p-4" placeholder="Tell us about your programme or target communities."/></Field><Button size="lg" className="mt-2 rounded-xl">Submit & Request Technical Brief <ArrowRight/></Button></form>}</div></section>
    </main>

    <footer className="bg-primary py-14 text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:grid-cols-3 lg:px-8"><div><Brand inverted/><p className="mt-5 max-w-xs text-xs leading-6 text-primary-foreground/65">Climate resilience, mutual protection, and shared prosperity for African agriculture.</p></div><div><p className="text-xs font-extrabold uppercase text-sun">Explore</p><div className="mt-4 space-y-3 text-sm"><a className="block" href="#how">How it works</a><a className="block" href="#impact">Our impact</a><a className="block" href="#faqs">FAQs</a></div></div><div><p className="text-xs font-extrabold uppercase text-sun">Contact</p><p className="mt-4 flex items-center gap-2 text-sm"><Mail className="size-4"/> partners@gona.ai</p><p className="mt-3 flex items-center gap-2 text-sm"><Globe2 className="size-4"/> Nigeria</p></div></div><div className="mx-auto mt-10 flex max-w-7xl justify-between border-t border-primary-foreground/15 px-5 pt-6 text-[11px] text-primary-foreground/55 lg:px-8"><span>© 2026 GonaInsured. All rights reserved.</span><a href="#top">Back to top</a></div></footer>
  </div>;
}

function Field({label, children}:{label:string;children:ReactNode}) { return <label className="mb-5 block"><span className="mb-2 block text-xs font-extrabold">{label}</span>{children}</label>; }