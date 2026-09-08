import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Apple, Play } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MyWeekly Wardrobe" },
      { name: "description", content: "Sign in or create your MyWeekly Wardrobe account to plan outfits from your own wardrobe." },
      { property: "og:title", content: "Sign in — MyWeekly Wardrobe" },
      { property: "og:description", content: "Sign in or create your MyWeekly Wardrobe account to plan outfits from your own wardrobe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.61l4 3.1c.94-2.84 3.59-4.95 6.71-4.95z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/profile" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { display_name: name },
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/profile" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const socialSignIn = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error(error.message ?? "Social sign-in failed");
      setSocialLoading(null);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for the reset link");
  };

  return (
    <div className="flex min-h-screen flex-col bg-lavender font-ui text-ink">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link to="/" className="font-chunky text-xl font-extrabold uppercase">MyWeekly Wardrobe</Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg rounded-xl bg-card px-6 py-10 shadow-card sm:px-12">
          <h1 className="text-center font-display text-3xl sm:text-4xl">
            {mode === "signin" ? "Welcome back!" : "Join us!"}
          </h1>

          <div className="mt-7 grid grid-cols-2 border-b">
            {([
              ["signin", "Sign in"],
              ["signup", "Sign up"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
                  mode === key ? "border-ink text-ink" : "border-transparent text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-lg bg-background"
              onClick={() => socialSignIn("google")}
              disabled={socialLoading !== null}
              aria-label="Continue with Google"
            >
              <GoogleMark />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-lg bg-background"
              onClick={() => socialSignIn("apple")}
              disabled={socialLoading !== null}
              aria-label="Continue with Apple"
            >
              <Apple className="h-6 w-6" fill="currentColor" />
            </Button>
          </div>

          <div className="mt-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "signup" && (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name*"
                required
                className="h-12 rounded-lg bg-background"
              />
            )}
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email*"
              className="h-12 rounded-lg bg-background"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password*"
                className="h-12 rounded-lg bg-background pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={forgotPassword} className="underline hover:opacity-60">
                Forgot password?
              </button>
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded-full border accent-[var(--primary)]"
                />
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs">
            New here? Download the free app for the full MyWeekly Wardrobe experience
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <div className="flex h-11 items-center gap-2 rounded-lg bg-ink px-4 text-card">
              <Apple className="h-5 w-5" fill="currentColor" />
              <div className="leading-tight">
                <p className="text-[8px] uppercase">Download on the</p>
                <p className="text-sm font-semibold">App Store</p>
              </div>
            </div>
            <div className="flex h-11 items-center gap-2 rounded-lg bg-ink px-4 text-card">
              <Play className="h-5 w-5" fill="currentColor" />
              <div className="leading-tight">
                <p className="text-[8px] uppercase">Get it on</p>
                <p className="text-sm font-semibold">Google Play</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
