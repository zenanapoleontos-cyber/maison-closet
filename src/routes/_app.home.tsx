import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CloudSun, RefreshCcw, Shirt, Sparkles } from "lucide-react";
import editorialLook from "@/assets/editorial-look.jpg";
import { Button } from "@/components/ui/button";

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
  const today = new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{today}</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[0.98] sm:text-6xl">Good morning, Zena.</h1>
          <p className="mt-4 text-muted-foreground">What are you wearing today?</p>
        </div>
        <div className="flex items-center gap-3 rounded-md border bg-card p-4">
          <CloudSun className="h-9 w-9 text-primary" />
          <div><p className="font-medium">24°C · Larnaca</p><p className="text-xs text-muted-foreground">Light layers, warm afternoon</p></div>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[440px] overflow-hidden">
          <img src={editorialLook} alt="White shirt and cream trousers outfit inspiration" width={1024} height={1280} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-cover-shade p-7 text-cover-foreground">
            <p className="text-xs uppercase tracking-[0.18em]">AI outfit of the day</p>
            <h2 className="mt-2 font-display text-4xl">Effortless & Chic</h2>
            <p className="mt-2 max-w-md text-sm text-cover-muted">A polished white shirt and soft tailoring for an easy, elegant day.</p>
          </div>
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your daily edit</p>
          <h2 className="mt-3 font-display text-4xl">Dress with intention.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Create a fresh combination from pieces you already own, shaped around your plans and personal style.</p>
          <Button asChild className="mt-7 h-12 rounded-md"><Link to="/outfits"><Sparkles className="h-4 w-4" />Create my outfit</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["My Closet", "Organise your pieces", Shirt, "/wardrobe"],
          ["AI Stylist", "Get outfit ideas", Sparkles, "/outfits"],
          ["Weekly Planner", "Plan the week", CalendarDays, "/calendar"],
          ["Sell & Rehome", "Give clothes a new life", RefreshCcw, "/rehome"],
        ].map(([title, copy, Icon, to]) => (
          <Link key={String(title)} to={to as "/wardrobe"} className="group rounded-md border bg-card p-5 transition hover:-translate-y-1 hover:shadow-card">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-8 font-display text-2xl">{String(title)}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{String(copy)}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}