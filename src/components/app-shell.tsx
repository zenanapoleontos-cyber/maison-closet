import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, House, LogOut, Recycle, Shirt, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/home", label: "Home", icon: House },
  { to: "/wardrobe", label: "Closet", icon: Shirt },
  { to: "/outfits", label: "AI Stylist", icon: Sparkles },
  { to: "/calendar", label: "Planner", icon: CalendarDays },
  { to: "/rehome", label: "Sell", icon: Recycle },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link to="/home" className="flex items-center gap-2 leading-none" aria-label="MyWeekly Wardrobe home">
            <span className="text-2xl leading-none">♧</span><span className="font-display text-xl">MyWeekly <i>Wardrobe</i></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {nav.map(({ to, label, icon: Icon }) => (
              <Button key={to} asChild variant="ghost" className={cn("h-10 rounded-md px-3 text-xs", pathname === to && "bg-secondary text-secondary-foreground")}>
                <Link to={to}><Icon className="h-4 w-4" />{label}</Link>
              </Button>
            ))}
          </nav>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

       <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-7 sm:px-6 md:px-8 md:pb-12 md:pt-10">{children}</main>

       <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-border bg-card/95 px-1 py-2 shadow-nav backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={cn("flex min-w-0 flex-col items-center gap-1 py-1 text-nav-muted", pathname === to && "text-nav-active")}>
             <Icon className="h-5 w-5" />
             <span className="max-w-full truncate text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}