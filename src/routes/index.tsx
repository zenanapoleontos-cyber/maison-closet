import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Upload, Shirt } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison — Your Online Wardrobe" },
      { name: "description", content: "Upload your clothes, build looks, and get AI outfit suggestions from your own wardrobe." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-2xl tracking-tight">Maison</Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="rounded-full px-4 py-2 text-sm hover:bg-accent/40">Sign in</Link>
          <Link to="/auth" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI-styled from your own closet
          </span>
          <h1 className="mt-8 font-display text-6xl sm:text-7xl md:text-8xl leading-[0.95]">
            Your wardrobe,
            <br />
            <span className="text-gradient italic">reimagined.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground">
            Photograph every piece you own. Organise it. Then let Maison build outfits from what's already in your closet.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90">
              Create your wardrobe
            </Link>
            <a href="#how" className="rounded-full border bg-card/60 backdrop-blur px-7 py-3 text-sm font-medium hover:bg-accent/40">
              How it works
            </a>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Upload, title: "Upload", body: "Snap a photo of every garment. Tag colour, season, and category." },
              { icon: Shirt, title: "Organise", body: "Your private digital closet — searchable, beautiful, always with you." },
              { icon: Sparkles, title: "Style with AI", body: "Tell Maison the occasion. It builds outfits from what you actually own." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl border bg-card/70 backdrop-blur p-8 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-feminine text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Maison · Your wardrobe, beautifully kept.
      </footer>
    </div>
  );
}
