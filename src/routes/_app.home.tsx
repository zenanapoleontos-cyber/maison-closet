import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CloudSun, Recycle, Shirt, Sparkles, ArrowRight } from "lucide-react";
import dailyLook from "@/assets/daily-look.jpg";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [
    { title: "My Style Home — MyWeekly Wardrobe" },
    { name: "description", content: "Your daily outfit, wardrobe shortcuts, and weekly style plan." },
    { property: "og:title", content: "My Style Home — MyWeekly Wardrobe" },
    { property: "og:description", content: "Your daily outfit, wardrobe shortcuts, and weekly style plan." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: HomePage,
});

function HomePage() {
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState(0);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setName((data.user?.user_metadata?.display_name as string | undefined)?.split(" ")[0] ?? "there"));
    const now = new Date();
    const end = new Date(now); end.setDate(now.getDate() + 7);
    supabase.from("outfit_schedule").select("id", { count: "exact", head: true }).gte("date", now.toLocaleDateString("en-CA")).lte("date", end.toLocaleDateString("en-CA")).then(({ count }) => setPlanned(count ?? 0));
  }, []);
  const today = new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold sm:text-3xl">Good morning, {name || "there"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">What are you wearing today?</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-primary">
          <CloudSun className="h-6 w-6" /><span className="hidden text-xs text-muted-foreground sm:block">{today}</span>
        </div>
      </section>

      <section className="relative h-[420px] overflow-hidden rounded-md sm:h-[540px]">
        <img src={dailyLook} alt="Blue shirt and cream trouser outfit" width={1024} height={1280} className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
        <div className="absolute inset-x-0 bottom-0 bg-cover-shade px-5 pb-6 pt-20 text-cover-foreground sm:px-8">
          <p className="text-xs uppercase tracking-[0.15em]">Your outfit inspiration</p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl">Effortless & Chic</h2>
          <p className="mt-1 text-xs text-cover-muted">A thoughtful look for the day ahead</p>
          <Button asChild className="mt-5 w-full max-w-xs rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"><Link to="/outfits">Create my outfit <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link to="/calendar" className="flex items-center gap-3 rounded-md border bg-card p-4 text-xs"><CalendarDays className="h-5 w-5 text-primary"/><span><strong>This week</strong><br/><span className="text-muted-foreground">{planned} outfits planned</span></span></Link>
        <div className="flex items-center gap-3 rounded-md border bg-card p-4 text-xs"><CloudSun className="h-5 w-5 text-primary"/><span><strong>Today</strong><br/><span className="text-muted-foreground">{today}</span></span></div>
      </section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["My Wardrobe", Shirt, "/wardrobe"],
          ["AI Stylist", Sparkles, "/outfits"],
          ["Weekly Planner", CalendarDays, "/calendar"],
          ["Sell & Rehome", Recycle, "/rehome"],
        ].map(([title, copy, Icon, to]) => (
          <Link key={String(title)} to={to as "/wardrobe"} className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-md bg-secondary/45 p-3 text-center transition hover:bg-secondary">
            <copy className="h-5 w-5 text-foreground" />
            <span className="text-xs font-medium">{String(title)}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}