import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, AlertTriangle, Sliders, LogOut, MessageCircle } from "lucide-react";
import { useSimulatorTicker } from "@/hooks/useSimulatorTicker";

export const Route = createFileRoute("/ops")({
  head: () => ({
    meta: [
      { title: "Ops Dashboard · VenueIQ" },
      { name: "description", content: "Venue operations command center." },
    ],
  }),
  component: OpsLayout,
});

const NAV = [
  { to: "/ops", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/ops/dispatch", label: "Dispatch", icon: Users },
  { to: "/ops/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/ops/controls", label: "Controls", icon: Sliders },
  { to: "/ops/chat", label: "Chat", icon: MessageCircle },
] as const;

function OpsLayout() {
  useSimulatorTicker(4000);
  const navigate = useNavigate();
  const loc = useLocation();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" });
      else setAuthed(true);
      setChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    sub = data.subscription;
    return () => sub?.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (!checked) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!authed) return null;

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isThis = loc.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isThis
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
