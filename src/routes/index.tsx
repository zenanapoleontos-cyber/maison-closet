import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyWeekly Wardrobe — Your Online Wardrobe" },
      { name: "description", content: "Upload your clothes, build outfits, and plan what to wear every day from your own wardrobe." },
    ],
  }),
  component: Landing,
});

const tiles = [
  { title: "Adding Clothes", body: "Photograph every piece and tag it.", bg: "bg-tile-cyan" },
  { title: "Styling & Outfits", body: "Mix and match looks for any occasion.", bg: "bg-tile-purple" },
  { title: "Weekly Planner", body: "Schedule outfits for the days ahead.", bg: "bg-tile-lime" },
  { title: "My Wardrobe", body: "Your closet, organised and searchable.", bg: "bg-tile-orange" },
];

const faqs = [
  { q: "How do I upload my clothes?", a: "Open Wardrobe, tap Add item, snap a photo and tag the category, colour and season. Each garment is stored privately to your account." },
  { q: "How does the outfit planner work?", a: "Go to Calendar, pick a day and choose one of your saved outfits. Plan a whole week in minutes." },
  { q: "Is MyWeekly Wardrobe free?", a: "Yes — Free includes up to 20 items and 5 AI outfit suggestions. Premium (€4.99/month) unlocks unlimited items and AI suggestions." },
  { q: "Who can see my wardrobe?", a: "Only you. Your wardrobe and outfits are private to your account." },
  { q: "Can I use it on mobile?", a: "Yes — the app is fully responsive and works beautifully on phone, tablet and desktop." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-white text-ink font-ui">
      <Header />
      <main className="mx-auto max-w-6xl px-6">
        <Hero />
        <Tiles />
        <Faq />
        <CtaStrip />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-chunky text-2xl font-extrabold tracking-tight text-ink">
          myweekly<span className="text-ink/60">.</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how" className="text-sm font-medium hover:opacity-70">How it works</a>
          <a href="#tiles" className="text-sm font-medium hover:opacity-70">Features</a>
          <a href="#faq" className="text-sm font-medium hover:opacity-70">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="rounded-full bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/70">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-neon px-5 py-2 text-sm font-semibold text-neon-foreground transition hover:brightness-95"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="how" className="pt-20 pb-16 text-center">
      <h1 className="mx-auto max-w-4xl font-chunky text-6xl font-extrabold leading-[0.95] tracking-tight text-ink sm:text-7xl md:text-8xl">
        Your wardrobe, <span className="italic">organised.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-base text-ink/70 sm:text-lg">
        Photograph every piece you own, build outfits, and plan what to wear every day of the week.
      </p>
      <div className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-ink/15 bg-white p-1.5 shadow-sm">
        <Search className="ml-3 h-5 w-5 text-ink/50" />
        <input
          type="text"
          placeholder="How do I upload my clothes?"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-ink/40"
          readOnly
        />
        <Link
          to="/auth"
          className="rounded-full bg-neon px-5 py-2.5 text-sm font-semibold text-neon-foreground transition hover:brightness-95"
        >
          Get started
        </Link>
      </div>
    </section>
  );
}

function Tiles() {
  return (
    <section id="tiles" className="pb-20">
      <h2 className="mb-6 font-chunky text-3xl font-extrabold tracking-tight text-ink">Popular features</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.title}
            to="/auth"
            className={`group relative overflow-hidden rounded-3xl ${t.bg} p-8 transition hover:scale-[1.01]`}
          >
            <h3 className="font-chunky text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              {t.title}
            </h3>
            <p className="mt-3 max-w-[18rem] text-sm font-medium text-ink/75">{t.body}</p>
            <div className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-ink">
              Explore →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-ink/10 py-20">
      <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="font-chunky text-4xl font-extrabold leading-[1] tracking-tight text-ink sm:text-5xl">
            Your questions <span className="italic">answered.</span>
          </h2>
          <p className="mt-4 text-sm text-ink/70">
            Everything you need to know about getting started with your digital wardrobe.
          </p>
        </div>
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-chunky text-lg font-bold text-ink sm:text-xl">{f.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-ink transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && <p className="pb-5 pr-10 text-sm leading-relaxed text-ink/70">{f.a}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CtaStrip() {
  return (
    <section className="mb-20 rounded-3xl bg-ink px-8 py-16 text-center text-white sm:px-16">
      <h2 className="mx-auto max-w-2xl font-chunky text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        Ready to meet your wardrobe?
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm text-white/70">
        Free for up to 20 items. Upgrade to Premium for unlimited.
      </p>
      <Link
        to="/auth"
        className="mt-8 inline-flex rounded-full bg-neon px-7 py-3 text-sm font-semibold text-neon-foreground transition hover:brightness-95"
      >
        Create your wardrobe
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-ink/60">
        <span>© {new Date().getFullYear()} MyWeekly Wardrobe</span>
        <div className="flex gap-6">
          <a href="#faq" className="hover:text-ink">FAQ</a>
          <Link to="/auth" className="hover:text-ink">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
