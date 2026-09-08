import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — MyWeekly Wardrobe" },
      { name: "description", content: "Set a new password for your MyWeekly Wardrobe account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValid(true);
    });
    if (window.location.hash.includes("type=recovery")) setValid(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/profile" });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-lavender font-ui text-ink">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link to="/" className="font-chunky text-xl font-extrabold uppercase">MyWeekly Wardrobe</Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-xl bg-card px-6 py-10 shadow-card sm:px-10">
          <h1 className="text-center font-display text-3xl">Set a new password</h1>
          {valid ? (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password*"
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
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-lg">
                {loading ? "Please wait..." : "Update password"}
              </Button>
            </form>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              This reset link is invalid or has expired.{" "}
              <Link to="/auth" className="underline text-ink">Request a new one</Link>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
