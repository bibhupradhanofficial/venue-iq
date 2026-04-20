import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ops Login · VenueIQ" },
      { name: "description", content: "Venue operations team login." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/ops" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/ops" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "sign_in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/ops" },
      });
      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Grant ops_staff role to first signups (demo). In production this would be admin-controlled.
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "ops_staff" } as any);
        toast.success("Account created. You're an ops staff.");
      }
    }
    setBusy(false);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
        ← Back to fan view
      </Link>
      <Card className="mt-4 p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Ops Console</h1>
            <p className="text-xs text-muted-foreground">Venue operations team only</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Email
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Password
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "…" : mode === "sign_in" ? "Sign in" : "Create ops account"}
          </Button>
        </form>
        <button
          onClick={() => setMode((m) => (m === "sign_in" ? "sign_up" : "sign_in"))}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "sign_in"
            ? "First time? Create an ops account →"
            : "Already have an account? Sign in →"}
        </button>
      </Card>
    </main>
  );
}
