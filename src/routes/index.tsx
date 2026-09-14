import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight, Building2, Check, ChevronRight, CloudRain, Headphones,
  Landmark, Leaf, Menu, Network, Pause, Play, Radio, Satellite, ShieldCheck,
  Smartphone, Sprout, Users, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImage from "@/assets/gonaai-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GonaAI | Climate Takaful for African Agriculture" },
      { name: "description", content: "Protect farming seasons with satellite-driven Takaful, local-language climate advisories and community-owned risk pools." },
      { property: "og:title", content: "GonaAI Climate Takaful" },
      { property: "og:description", content: "A climate shock shouldn’t stop a farming season." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tabs = [
  {
    id: "satellite", number: "01", label: "Satellite-Triggered Takaful", icon: Satellite,
    headline: "Zero Paperwork. Zero Delay.",
    bullets: [
      ["Hyper-Local Tracking", "Tracks rainfall and soil moisture across Nigerian coordinate grids using premium remote-sensing satellite APIs."],
      ["Automated Verification", "Eliminates fraud, administrative delays, and the need for physical on-farm loss adjusters."],
      ["Rapid Mobilization", "Payouts trigger instantly and reach mobile wallets within 48 hours of a climate threshold breach."],
    ],
  },
  {
    id: "pooling", number: "02", label: "Mutual Risk Pooling", icon: ShieldCheck,
    headline: "Community-First Safety Nets.",
    bullets: [
      ["Cooperative Ownership", "Premiums belong to a participant-owned fund built to shield farmers against crop failure."],
      ["Shariah-Compliant", "Eliminates interest, excessive uncertainty and gambling mechanics for historically underserved farming communities."],
      ["Systemic Protection", "Dilutes regional risks across diverse agro-ecological zones to protect entire agricultural supply chains."],
    ],
  },
  {
    id: "voice", number: "03", label: "Local-Language Advisories", icon: Radio,
    headline: "Actionable Insights in Native Voices.",
    bullets: [
      ["Early Warning Systems", "Delivers hyper-local agronomic guidance through automated voice calls to basic feature phones."],
      ["Loss Prevention", "Tells farmers when to plant, fertilize, or harvest using real-time data—preventing loss before it happens."],
      ["Inclusive Design", "Voice-based guidance removes literacy barriers for rural and women smallholders."],
    ],
  },
  {
    id: "dividends", number: "04", label: "Cash-Back Dividends", icon: WalletCards,
    headline: "Rewarding a Successful Season.",
    bullets: [
      ["Surplus Distribution", "If weather behaves and claims stay low, the unspent underwriting surplus returns to the community."],
      ["Direct Cash Returns", "Farmers receive mobile-money dividends or a rollover credit toward next season’s premium."],
      ["The Loyalty Engine", "Creates durable retention for input providers, lenders and outgrower schemes."],
    ],
  },
] as const;

function Brand() {
  return <a href="#top" className="flex items-center gap-3" aria-label="GonaAI home"><span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><Leaf className="size-5" /></span><span><strong className="block text-[15px] leading-none">GonaAI</strong><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Takaful Climate Tech</span></span></a>;
}

function VisualPanel({ id }: { id: string }) {
  const [playing, setPlaying] = useState(false);
  const [weather, setWeather] = useState(72);
  if (id === "satellite") return (
    <div className="panel-enter relative flex min-h-[390px] items-center justify-center overflow-hidden bg-primary p-8 text-primary-foreground">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(var(--color-primary-foreground) 1px,transparent 1px),linear-gradient(90deg,var(--color-primary-foreground) 1px,transparent 1px)", backgroundSize: "34px 34px" }} />
      <div className="relative size-64 rounded-full border border-primary-foreground/25 p-8"><div className="signal-pulse absolute inset-6 rounded-full border border-sun/60" /><div className="absolute inset-14 rounded-full bg-sun/20" /><div className="radar-spin absolute inset-0 origin-center"><span className="absolute left-1/2 top-1/2 h-px w-1/2 origin-left bg-sun" /></div><div className="absolute inset-0 grid place-items-center"><Satellite className="size-9 text-sun" /></div></div>
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-md border border-primary-foreground/20 bg-hero-surface p-4"><span className="text-xs uppercase tracking-[.16em]">Drought threshold</span><span className="flex items-center gap-2 text-sm font-bold text-sun"><span className="size-2 rounded-full bg-sun" /> Alert triggered</span></div>
    </div>
  );
  if (id === "pooling") return (
    <div className="panel-enter flex min-h-[390px] flex-col items-center justify-center bg-secondary p-8">
      <div className="relative grid size-48 place-items-center rounded-full border border-primary/20 bg-card shadow-lg"><ShieldCheck className="size-16 text-primary"/><span className="mt-[-32px] text-center text-xs font-bold uppercase tracking-[.14em]">Participant<br/>Risk Fund</span>{["-top-8 left-1/2","top-1/2 -right-10","-bottom-8 left-1/2","top-1/2 -left-10"].map((p,i)=><span key={p} className={`absolute ${p} grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card shadow`}><Users className="size-5 text-leaf"/><i className="absolute text-xs font-bold text-earth" style={{transform:`translate(${i%2?0:34}px,${i%2?34:0}px)`}}>₦</i></span>)}</div>
      <p className="mt-12 text-center text-sm font-semibold text-primary">Contributions in. Protection shared.</p>
    </div>
  );
  if (id === "voice") return (
    <div className="panel-enter flex min-h-[390px] items-center justify-center bg-sky/20 p-8">
      <div className="w-full max-w-xs rounded-[2rem] border-[6px] border-primary bg-card p-6 shadow-xl"><div className="mx-auto mb-8 h-1.5 w-16 rounded-full bg-muted"/><span className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">Hausa advisory • Kano</span><h4 className="mt-2 font-display text-2xl font-semibold">Ruwan sama yana zuwa</h4><div className="my-8 flex h-16 items-center justify-center gap-1.5">{[35,70,45,90,55,75,40,60,30].map((h,i)=><span key={i} className="sound-bar w-1.5 rounded-full bg-sky" style={{height:h+"%",animationDelay:`${i*.08}s`}}/>)}</div><Button className="w-full" onClick={()=>setPlaying(!playing)}>{playing?<Pause/>:<Play/>}{playing?"Pause sample":"Listen to sample"}</Button></div>
    </div>
  );
  return (
    <div className="panel-enter flex min-h-[390px] flex-col justify-center bg-primary p-8 text-primary-foreground"><div className="mb-8 flex items-end justify-between"><div><span className="text-xs uppercase tracking-[.15em] text-primary-foreground/70">Season outlook</span><p className="font-display text-4xl font-semibold text-sun">{weather}%</p></div><CloudRain className="size-12 text-sky"/></div><input aria-label="Weather quality" type="range" min="10" max="100" value={weather} onChange={e=>setWeather(Number(e.target.value))} className="w-full accent-[var(--color-sun)]"/><div className="mt-3 flex justify-between text-xs"><span>Severe weather</span><span>Good weather year</span></div><div className="mt-10 grid grid-cols-3 gap-2 text-center">{["OPay","Moniepoint","PalmPay"].map((x,i)=><div key={x} className="rounded-md bg-primary-foreground/10 p-3"><WalletCards className={`mx-auto mb-2 size-5 ${weather>55?"text-sun":"text-primary-foreground/40"}`}/><span className="text-[10px] font-bold">{x}</span>{weather>55&&<p className="mt-1 text-xs text-sun">+₦{((weather-50)*(i+1)*85).toLocaleString()}</p>}</div>)}</div></div>
  );
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-earth">{eyebrow}</p><h2 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h2>{copy&&<p className="mt-5 leading-7 text-muted-foreground">{copy}</p>}</div>;
}

function Index() {
  const [active, setActive] = useState(0);
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const item = tabs[active] ?? tabs[0];
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setSent(true); };
  return <div id="top" className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"><Brand/><nav className="hidden items-center gap-8 lg:flex">{[["How It Works","#how"],["Our Impact","#impact"],["Ethical Framework","#ethics"],["FAQs","#faqs"]].map(([x,h])=><a className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" href={h} key={x}>{x}</a>)}</nav><div className="hidden items-center gap-2 lg:flex"><Button variant="ghost" asChild><a href="#how">Demo</a></Button><Button variant="ghost" asChild><a href="#partner">Dashboard Login</a></Button><Button asChild><a href="#partner">Partner With Us <ArrowRight/></a></Button></div><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle navigation" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</Button></div>{menu&&<div className="border-t border-border bg-background p-5 lg:hidden">{[["How It Works","#how"],["Our Impact","#impact"],["Ethical Framework","#ethics"],["FAQs","#faqs"],["Partner With Us","#partner"]].map(([x,h])=><a onClick={()=>setMenu(false)} className="block border-b border-border py-3 font-semibold" href={h} key={x}>{x}</a>)}</div>}</header>

    <main>
      <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-primary text-hero-foreground"><img src={heroImage} alt="Northern Nigerian cooperative leader receiving a climate advisory in a thriving farm" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover object-[62%_center]"/><div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-primary)_0%,color-mix(in_oklab,var(--color-primary)_90%,transparent)_35%,color-mix(in_oklab,var(--color-primary)_12%,transparent)_78%)]"/><div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-center px-5 py-16 lg:px-8"><div className="max-w-3xl"><div className="mb-7 inline-flex items-center gap-2 border-l-2 border-sun pl-3 text-xs font-bold uppercase tracking-[.2em] text-sun"><Satellite className="size-4"/> Climate intelligence for African agriculture</div><h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] sm:text-7xl">A Climate Shock Shouldn’t Stop a Farming Season.</h1><p className="mt-7 max-w-2xl text-base leading-7 text-hero-foreground/80 sm:text-lg">We shield African agriculture from unpredictable weather using satellite-driven Takaful insurance and local-language climate advisories—ensuring rapid recovery while rewarding successful seasons with cash-back dividends.</p><div className="mt-9 flex flex-wrap gap-3"><Button variant="hero" size="lg" asChild><a href="#partner">Partner With Us <ArrowRight/></a></Button><Button variant="heroOutline" size="lg" asChild><a href="#impact">Explore Our Impact</a></Button></div><div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-hero-foreground/20 pt-6 text-xs font-semibold uppercase tracking-[.13em] text-hero-foreground/70"><span>48hr payout target</span><span>Satellite verified</span><span>Shariah-compliant</span></div></div></div>
      </section>

      <section aria-label="Partner ecosystem" className="border-b border-border bg-card"><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><p className="mb-7 text-center text-xs font-bold uppercase tracking-[.2em] text-muted-foreground">Driving resilience across Nigeria’s agricultural ecosystem</p><div className="grid grid-cols-2 gap-6 text-muted-foreground md:grid-cols-4">{([{ icon: Sprout, label: "Farming Cooperatives" },{ icon: Landmark, label: "Islamic Microfinance" },{ icon: Building2, label: "Input Suppliers" },{ icon: Network, label: "Outgrower Networks" }]).map(({icon: Icon,label})=><div key={label} className="flex items-center justify-center gap-3 border-r border-border last:border-0"><Icon className="size-6"/><span className="text-sm font-bold">{label}</span></div>)}</div></div></section>

      <section id="how" className="scroll-mt-20 py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionIntro eyebrow="How it works" title="Protection before, during, and after the shock." copy="One connected system turns climate data into timely advice, rapid protection, and long-term community value."/><div className="mt-14 grid gap-0 overflow-hidden border border-border bg-card lg:grid-cols-[1.05fr_.95fr]"><div><div role="tablist" aria-label="How GonaAI works" className="grid grid-cols-2 border-b border-border xl:grid-cols-4">{tabs.map((tab,i)=><button key={tab.id} role="tab" aria-selected={active===i} onClick={()=>setActive(i)} className={`min-h-28 border-r border-border p-4 text-left transition-colors ${active===i?"bg-primary text-primary-foreground":"bg-card text-muted-foreground hover:bg-muted"}`}><span className="block text-xs opacity-60">{tab.number}</span><span className="mt-4 block text-xs font-bold leading-4">{tab.label}</span></button>)}</div><article key={item.id} className="panel-enter p-7 sm:p-10"><item.icon className="mb-5 size-8 text-earth"/><h3 className="text-3xl font-semibold sm:text-4xl">{item.headline}</h3><div className="mt-8 space-y-6">{item.bullets.map(([heading,copy])=><div key={heading} className="grid grid-cols-[20px_1fr] gap-3"><Check className="mt-1 size-4 text-leaf"/><p className="text-sm leading-6 text-muted-foreground"><strong className="text-foreground">{heading}:</strong> {copy}</p></div>)}</div></article></div><VisualPanel id={item.id}/></div></div></section>

      <section id="ethics" className="scroll-mt-20 bg-primary py-20 text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.75fr_1.25fr] lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sun">Ethical framework</p><h2 className="mt-4 text-4xl font-semibold">Protection built on shared responsibility.</h2></div><div className="grid gap-px bg-primary-foreground/15 sm:grid-cols-3">{[["No Riba","No interest-based mechanisms."],["No Gharar","Clear thresholds and transparent terms."],["No Maisir","Mutual protection, never speculation."]].map(([h,p])=><div className="bg-primary p-6" key={h}><ShieldCheck className="mb-6 size-7 text-sun"/><h3 className="text-xl font-semibold">{h}</h3><p className="mt-2 text-sm leading-6 text-primary-foreground/70">{p}</p></div>)}</div></div></section>

      <section id="impact" className="scroll-mt-20 py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionIntro eyebrow="The grant magnet" title="Our Impact Blueprint" copy="Measurable climate adaptation designed for institutional partners, development funders, and ESG portfolios."/><div className="mt-14 grid gap-5 md:grid-cols-3">{([{metric:"100%",title:"Shariah-Compliant Inclusion",copy:"Opening vital climate protection to farmers previously excluded by religious parameters."},{metric:"0%",title:"Literacy Barriers",copy:"Deep rural adaptation delivered through localized voice-based phone advisories."},{metric:"↻",title:"Circular Financial Retention",copy:"Cash-back dividends keep wealth inside rural economies, not corporate boards."}]).map(({metric,title,copy})=><article key={title} className="border-t-4 border-primary bg-card p-7 shadow-sm"><span className="font-display text-5xl font-semibold text-earth">{metric}</span><h3 className="mt-8 text-2xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}</div><div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-8"><span className="mr-3 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Aligned with</span>{([{number:"1",title:"No Poverty"},{number:"2",title:"Zero Hunger"},{number:"13",title:"Climate Action"}]).map(({number,title})=><div key={number} className="flex items-center gap-3 border border-border bg-card p-3"><span className="grid size-10 place-items-center bg-primary font-display text-xl font-bold text-primary-foreground">{number}</span><span className="text-xs font-bold uppercase">SDG {number}<br/><span className="font-normal text-muted-foreground">{title}</span></span></div>)}</div></div></section>

      <section id="faqs" className="scroll-mt-20 border-y border-border bg-card py-20"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8"><SectionIntro eyebrow="FAQs" title="Built for practical deployment."/><Accordion type="single" collapsible>{[["Who can partner with GonaAI?","Agribusinesses, grant funders, Takaful underwriters, cooperatives, input suppliers, lenders and outgrower networks."],["How are payouts triggered?","Pre-agreed climate thresholds are monitored by satellite data. When a threshold is breached, the verified event starts the payout workflow."],["Do farmers need smartphones?","No. Advisories are delivered through local-language voice calls designed for basic feature phones."],["What happens in a good weather year?","Eligible underwriting surplus can return to participants through mobile money or roll over as a credit for the next season."]].map(([q,a])=><AccordionItem value={q} key={q}><AccordionTrigger className="py-6 text-base hover:no-underline">{q}</AccordionTrigger><AccordionContent className="pr-8 leading-6 text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion></div></section>

      <section id="partner" className="scroll-mt-20 bg-secondary py-24"><div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><SectionIntro eyebrow="Partner with GonaAI" title="Let’s Protect the Season Together." copy="Whether you are deploying a development grant, de-risking an outgrower network, or anchoring an underwriting pool, we have the infrastructure."/><div className="mt-9 space-y-4 text-sm">{["Technical integration brief","Deployment and impact framework","Tailored partnership scoping"].map(x=><p className="flex items-center gap-3" key={x}><Check className="size-4 text-leaf"/>{x}</p>)}</div></div>{sent?<div className="flex min-h-[430px] flex-col items-center justify-center bg-primary p-10 text-center text-primary-foreground"><span className="grid size-14 place-items-center rounded-full bg-sun text-sun-foreground"><Check/></span><h3 className="mt-6 text-3xl font-semibold">Request received.</h3><p className="mt-3 max-w-sm text-sm leading-6 text-primary-foreground/70">Thank you for your interest. Your collaboration scope is ready for the GonaAI partnership team.</p><Button variant="hero" className="mt-8" onClick={()=>setSent(false)}>Send another request</Button></div>:<form onSubmit={submit} className="bg-card p-6 shadow-sm sm:p-9"><div className="grid gap-5 sm:grid-cols-2"><Field label="Name"><input required name="name" autoComplete="name" className="h-12 w-full border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" placeholder="Your full name"/></Field><Field label="Institutional Email"><input required name="email" type="email" autoComplete="email" className="h-12 w-full border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" placeholder="name@organisation.org"/></Field></div><Field label="I am a..."><select required name="role" className="h-12 w-full border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" defaultValue=""><option value="" disabled>Select partnership type</option><option>Agribusiness Grant Donor</option><option>Takaful Underwriter</option></select></Field><Field label="Message / Scope of Collaboration"><textarea required name="message" rows={5} className="w-full resize-none border border-input bg-background p-3 outline-none focus:ring-2 focus:ring-ring" placeholder="Tell us about your programme, portfolio, or target communities."/></Field><Button size="lg" className="mt-3 w-full sm:w-auto">Submit & Request Technical Brief <ArrowRight/></Button></form>}</div></section>
    </main>
    <footer className="bg-primary py-10 text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8"><Brand/><p className="text-xs text-primary-foreground/60">Climate resilience. Mutual protection. Shared prosperity.</p><a href="#top" className="flex items-center gap-2 text-sm font-bold">Back to top <ChevronRight className="size-4 -rotate-90"/></a></div></footer>
  </div>;
}

function Field({label, children}:{label:string;children:ReactNode}) { return <label className="mb-5 block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em]">{label}</span>{children}</label>; }