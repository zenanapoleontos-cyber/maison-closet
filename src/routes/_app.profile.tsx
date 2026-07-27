import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, LayoutGrid, Search, Heart, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Your profile — MyWeekly Wardrobe" }] }),
  component: ProfilePage,
});

type Counts = { items: number; outfits: number; lookbooks: number };

function ProfilePage() {
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
    <div className="-mx-6 -my-10">
      {/* Purple banner */}
      <div className="h-44 sm:h-56 bg-[var(--tile-purple)] relative">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex gap-3">
          <button className="h-11 w-11 rounded-full bg-white shadow-card flex items-center justify-center" aria-label="Saved">
            <Bookmark className="h-5 w-5 text-ink" />
          </button>
          <button className="h-11 w-11 rounded-full bg-white shadow-card flex items-center justify-center" aria-label="Lookbooks">
            <LayoutGrid className="h-5 w-5 text-ink" />
          </button>
        </div>
      </div>

      {/* Avatar + name */}
      <div className="bg-[color-mix(in_oklab,var(--background)_60%,white)] pb-6">
        <div className="mx-auto max-w-5xl px-6 -mt-16 flex flex-col items-center">
          <div
            className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white shadow-card flex items-center justify-center font-chunky text-5xl text-ink"
            style={{ background: "var(--neon)" }}
          >
            {initial}
          </div>
          <h1 className="mt-4 font-chunky text-3xl text-ink">{name}</h1>
          <p className="text-sm text-muted-foreground font-ui">@{handle}</p>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-6 mt-8">
          <div className="flex justify-center gap-10 border-b">
            {([
              ["items", "Items", counts.items],
              ["outfits", "Outfits", counts.outfits],
              ["lookbooks", "Lookbooks", counts.lookbooks],
            ] as const).map(([key, label, n]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`pb-3 font-ui text-sm tracking-wide transition-colors ${
                  tab === key ? "text-ink border-b-2 border-ink -mb-px" : "text-muted-foreground"
                }`}
              >
                <span className="font-semibold mr-1.5">{n}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-3xl bg-white shadow-card p-6 sm:p-10 -mt-2">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="pl-11 h-12 rounded-2xl bg-[color-mix(in_oklab,var(--muted)_60%,white)] border-0"
              />
            </div>
            <button className="h-12 w-12 rounded-2xl border flex items-center justify-center" aria-label="Favourites">
              <Heart className="h-5 w-5 text-ink" />
            </button>
            <button className="h-12 w-12 rounded-2xl border flex items-center justify-center relative" aria-label="Filters">
              <SlidersHorizontal className="h-5 w-5 text-ink" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-400 text-[10px] font-bold text-ink flex items-center justify-center">1</span>
            </button>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 items-center">
            <div className="text-center md:text-left">
              <p className="font-ui text-base text-ink">
                {tab === "items" && "No items yet. Start building your digital wardrobe."}
                {tab === "outfits" && "No outfits yet. Create your first look from your pieces."}
                {tab === "lookbooks" && "No lookbooks yet. Group outfits into curated collections."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground font-ui">
                Upload photos of your clothes, tag them, and let AI style you.
              </p>
              {tab === "items" && (
                <Link
                  to="/wardrobe"
                  className="inline-flex mt-6 items-center justify-center rounded-full px-6 h-11 bg-[var(--neon)] text-[var(--neon-foreground)] font-ui font-semibold shadow-soft"
                >
                  Add your first piece
                </Link>
              )}
              {tab === "outfits" && (
                <Link
                  to="/outfits"
                  className="inline-flex mt-6 items-center justify-center rounded-full px-6 h-11 bg-[var(--neon)] text-[var(--neon-foreground)] font-ui font-semibold shadow-soft"
                >
                  Create an outfit
                </Link>
              )}
              {tab === "lookbooks" && (
                <Link
                  to="/calendar"
                  className="inline-flex mt-6 items-center justify-center rounded-full px-6 h-11 bg-[var(--neon)] text-[var(--neon-foreground)] font-ui font-semibold shadow-soft"
                >
                  Plan your week
                </Link>
              )}
            </div>
            <div className="relative h-64 sm:h-72 rounded-2xl bg-[color-mix(in_oklab,var(--tile-purple)_35%,white)] overflow-hidden flex items-center justify-center">
              <div className="absolute left-4 top-8 h-40 w-24 rounded-2xl bg-white shadow-card -rotate-[8deg] border" />
              <div className="relative h-52 w-28 rounded-2xl bg-white shadow-card border flex flex-col items-center justify-center gap-2 px-2 z-10">
                <div className="h-16 w-16 rounded-lg bg-[var(--neon)]" />
                <div className="h-2 w-16 rounded-full bg-muted" />
                <div className="h-2 w-12 rounded-full bg-muted" />
                <div className="h-8 w-20 rounded-lg bg-[var(--tile-orange)]" />
              </div>
              <div className="absolute right-4 top-6 h-40 w-24 rounded-2xl bg-white shadow-card rotate-[8deg] border" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
