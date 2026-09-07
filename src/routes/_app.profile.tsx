import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, CalendarDays, Grid2X2, Heart, LogOut, Search, SlidersHorizontal, Sparkles, Shirt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — MyWeekly Wardrobe" },
      { name: "description", content: "View your wardrobe, outfits, and weekly collections in your MyWeekly Wardrobe profile." },
      { property: "og:title", content: "Your Profile — MyWeekly Wardrobe" },
      { property: "og:description", content: "View your wardrobe, outfits, and weekly collections in your MyWeekly Wardrobe profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Counts = { items: number; outfits: number; lookbooks: number };

function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("You");
  const [handle, setHandle] = useState("you");
  const [tab, setTab] = useState<"items" | "outfits" | "lookbooks">("items");
  const [counts, setCounts] = useState<Counts>({ items: 0, outfits: 0, lookbooks: 0 });
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const display = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "You";
      setName(display);
      setHandle((display as string).toLowerCase().replace(/[^a-z0-9]/g, ""));

      const [{ count: items }, { count: outfits }] = await Promise.all([
        supabase.from("clothing_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("outfits").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setCounts({ items: items ?? 0, outfits: outfits ?? 0, lookbooks: 0 });
    })();
  }, []);

  const initial = name.trim().charAt(0).toUpperCase() || "Y";

  return (
    <div className="min-h-screen bg-background font-ui text-ink">
      <header className="border-b bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-6 px-5 py-5 md:grid-cols-[1fr_auto_1fr]">
          <nav className="hidden items-center gap-7 md:flex">
            <Link to="/wardrobe" className="text-xs font-semibold hover:opacity-60">Wardrobe</Link>
            <Link to="/outfits" className="text-xs font-semibold hover:opacity-60">Outfits</Link>
            <Link to="/calendar" className="text-xs font-semibold hover:opacity-60">Calendar</Link>
          </nav>
          <Link to="/" className="font-chunky text-xl font-extrabold uppercase md:text-2xl">MyWeekly Wardrobe</Link>
          <div className="flex justify-end gap-1.5">
            <Button asChild variant="ghost" size="icon" aria-label="Open wardrobe" className="md:hidden"><Link to="/wardrobe"><Shirt /></Link></Button>
            <Button asChild variant="ghost" size="icon" aria-label="Open outfits" className="md:hidden"><Link to="/outfits"><Sparkles /></Link></Button>
            <Button asChild variant="ghost" size="icon" aria-label="Open calendar" className="md:hidden"><Link to="/calendar"><CalendarDays /></Link></Button>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}><LogOut /></Button>
          </div>
        </div>
      </header>

      <section className="relative h-32 bg-tile-purple sm:h-40" aria-label="Profile cover" />

      <section className="border-b bg-background pb-0">
        <div className="mx-auto max-w-5xl px-5">
          <div className="relative -mt-14 flex flex-col items-center sm:-mt-16">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-card bg-neon font-chunky text-5xl font-extrabold text-neon-foreground shadow-card sm:h-32 sm:w-32">
              {initial}
            </div>
            <div className="absolute right-0 top-2 hidden gap-3 sm:flex">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-full bg-card" aria-label="Saved outfits"><Bookmark /></Button>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-full bg-card" aria-label="Lookbooks"><Grid2X2 /></Button>
            </div>
            <h1 className="mt-3 font-chunky text-2xl font-bold">{name}</h1>
            <p className="text-xs text-muted-foreground">@{handle}</p>
          </div>

          <div className="mt-8 flex justify-center gap-5 sm:gap-14">
            {([
              ["items", "Items", counts.items],
              ["outfits", "Outfits", counts.outfits],
              ["lookbooks", "Lookbooks", counts.lookbooks],
            ] as const).map(([key, label, n]) => (
              <Button
                key={key}
                type="button"
                variant="ghost"
                onClick={() => setTab(key)}
                className={`h-auto rounded-none border-b-2 px-1 pb-3 pt-1 text-xs transition-colors ${
                  tab === key ? "border-ink text-ink" : "border-transparent text-muted-foreground"
                }`}
              >
                <span className="mr-1.5 font-bold">{n}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-lg border bg-card p-4 shadow-card sm:p-6">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-10 rounded-md bg-background pl-11"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="Favourites">
              <Heart />
            </Button>
            <Button variant="outline" size="icon" className="relative h-10 w-10 shrink-0" aria-label="Filters">
              <SlidersHorizontal />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-400 text-[10px] font-bold text-ink flex items-center justify-center">1</span>
            </Button>
          </div>

          <div className="grid min-h-80 items-center gap-8 py-8 md:grid-cols-[0.9fr_1.1fr] md:py-3">
            <div className="flex flex-col items-center text-center">
              <p className="max-w-sm text-sm text-ink">
                {tab === "items" && "No items yet. Add items exclusively on the MyWeekly Wardrobe app."}
                {tab === "outfits" && "No outfits yet. Create your first look from your pieces."}
                {tab === "lookbooks" && "No lookbooks yet. Group outfits into curated collections."}
              </p>

              {tab === "items" && (
                <div className="mt-7 flex flex-col items-center gap-3">
                  <div className="rounded-md bg-card p-2">
                    <QRCodeSVG value={`${window.location.origin}/wardrobe`} size={142} level="M" fgColor="var(--ink)" bgColor="var(--card)" />
                  </div>
                  <p className="text-[11px] text-ink">
                    Scan the QR code to style in app
                  </p>
                  <Button asChild className="mt-1 h-9 rounded-full bg-neon px-5 text-neon-foreground hover:bg-neon/90"><Link to="/wardrobe">Add pieces here</Link></Button>
                </div>
              )}

              {tab === "outfits" && (
                <Link
                  to="/outfits"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-neon px-6 font-semibold text-neon-foreground shadow-soft"
                >
                  Create an outfit
                </Link>
              )}
              {tab === "lookbooks" && (
                <Link
                  to="/calendar"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-neon px-6 font-semibold text-neon-foreground shadow-soft"
                >
                  Plan your week
                </Link>
              )}

            </div>

            <div className="relative mx-auto flex h-72 w-full max-w-sm items-center justify-center sm:h-80">
              <PhoneMock className="absolute left-[5%] top-8 -rotate-[10deg] scale-90 opacity-95" accent="bg-tile-cyan" />
              <PhoneMock className="absolute right-[5%] top-8 rotate-[10deg] scale-90 opacity-95" accent="bg-tile-orange" />
              <PhoneMock className="relative z-10" accent="bg-neon" featured />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PhoneMock({ className = "", accent, featured = false }: { className?: string; accent: string; featured?: boolean }) {
  return (
    <div className={`h-64 w-36 rounded-[1.75rem] bg-ink p-1.5 shadow-card sm:h-72 sm:w-40 ${className}`}>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.4rem] bg-card">
        <div className="h-5 flex items-center justify-center">
          <div className="h-1.5 w-10 rounded-full bg-ink/70" />
        </div>
        <div className="px-2 flex items-center gap-1.5">
          <div className={`h-6 w-6 rounded-full ${accent}`} />
          <div className="flex-1">
            <div className="h-1.5 w-12 rounded-full bg-muted mb-1" />
            <div className="h-1.5 w-8 rounded-full bg-muted" />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 px-2">
          <div className={`aspect-square rounded-lg ${accent}`} />
          <div className="aspect-square rounded-lg bg-tile-purple" />
          <div className="aspect-square rounded-lg bg-tile-orange" />
          <div className="aspect-square rounded-lg bg-tile-cyan" />
          {featured && <div className="aspect-square rounded-lg bg-pink-300" />}
          {featured && <div className="aspect-square rounded-lg bg-[var(--neon)]" />}
        </div>
      </div>
    </div>
  );
}
