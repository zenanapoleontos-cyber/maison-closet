import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, LogOut, RefreshCcw, Shirt, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/wardrobe", label: "Closet", icon: Shirt },
  { to: "/outfits", label: "AI Stylist", icon: Sparkles },
  { to: "/calendar", label: "Planner", icon: CalendarDays },
  { to: "/rehome", label: "Rehome", icon: RefreshCcw },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/home" className="flex flex-col leading-none">
            <span className="font-display text-2xl">MyWeekly</span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Your closet · your style</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {nav.map(({ to, label, icon: Icon }) => (
              <Button key={to} asChild variant="ghost" className={cn("h-10 rounded-md px-3", pathname === to && "bg-secondary text-secondary-foreground")}>
                <Link to={to}><Icon className="h-4 w-4" />{label}</Link>
              </Button>
            ))}
          </nav>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-6 rounded-2xl border border-border/60 bg-nav/95 px-1 py-2 shadow-nav backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={cn("flex min-w-0 flex-col items-center gap-1 py-1 text-nav-muted", pathname === to && "text-nav-active")}>
            <Icon className="h-4 w-4" />
            <span className="max-w-full truncate text-[9px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}