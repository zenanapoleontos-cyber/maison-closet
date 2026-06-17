import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Shirt, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) navigate({ to: "/auth" });
  }, [session, navigate]);

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!session) return null;

  const links = [
    { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
    { to: "/outfits", label: "Outfits", icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl">Maison</Link>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                pathname.startsWith(to) ? "bg-primary text-primary-foreground shadow-soft" : "hover:bg-accent/40"
              )}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
              className="ml-2 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
