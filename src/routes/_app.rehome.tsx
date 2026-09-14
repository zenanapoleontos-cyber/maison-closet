import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Check, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/rehome")({
  head: () => ({ meta: [
    { title: "Sell & Rehome — MyWeekly Wardrobe" },
    { name: "description", content: "Prepare wardrobe pieces to sell or rehome responsibly." },
    { property: "og:title", content: "Sell & Rehome — MyWeekly Wardrobe" },
    { property: "og:description", content: "Prepare wardrobe pieces to sell or rehome responsibly." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: RehomePage,
});

function RehomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Circular wardrobe</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">Sell & Rehome</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Clear your closet with care. Select a piece and prepare it for its next chapter.</p>
      <section className="mt-10 grid gap-8 rounded-md border bg-card p-6 md:grid-cols-2 md:p-10">
        <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-secondary/50 text-center">
          <Camera className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl">Choose a piece</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">Start with an item already saved in your closet.</p>
          <Button asChild className="mt-6 rounded-md"><Link to="/wardrobe">Browse my closet</Link></Button>
        </div>
        <div className="flex flex-col justify-center">
          <RefreshCcw className="h-6 w-6 text-primary" />
          <h2 className="mt-4 font-display text-3xl">We help with the details</h2>
          <ul className="mt-6 space-y-4 text-sm">
            {["Write a polished description", "Suggest a fair price", "Prepare a clean listing"].map((item) => <li key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary"><Check className="h-3.5 w-3.5" /></span>{item}</li>)}
          </ul>
          <p className="mt-8 text-xs leading-5 text-muted-foreground">Publishing to external marketplaces will be added in a future step.</p>
        </div>
      </section>
    </div>
  );
}