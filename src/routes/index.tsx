import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { useSimulatorTicker } from "@/hooks/useSimulatorTicker";
import { useFan, saveFan, seatToZone, type FanProfile } from "@/lib/fan-session";
import { MatchPill } from "@/components/MatchPill";
import { MatchTicker } from "@/components/MatchTicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { densityLabel, densityColor } from "@/lib/venue";
import { Map, Coffee, MessageCircle, ArrowUpRight, Activity, Sparkles, Navigation } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VenueIQ — Your Stadium, Smarter" },
      {
        name: "description",
        content:
          "Skip the queues, find the action. Live crowd map, AI assistant, and instant concession ordering at your seat.",
      },
      { property: "og:title", content: "VenueIQ — Your Stadium, Smarter" },
      {
        property: "og:description",
        content: "Live crowd map, AI assistant, and instant concession ordering at your seat.",
      },
    ],
  }),
  component: FanLanding,
});

const PERSONAS: Array<{ id: FanProfile["persona"]; label: string; emoji: string; hint: string }> = [
  { id: "casual", label: "Casual", emoji: "🎟️", hint: "I'm here for the match" },
  { id: "foodie", label: "Foodie", emoji: "🌮", hint: "Show me the best stalls" },
  { id: "vip", label: "VIP", emoji: "🥂", hint: "Premium upgrades & low-wait paths" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", hint: "Quiet routes, restrooms close" },
];

function FanLanding() {
  useSimulatorTicker();
  const fan = useFan();
  const live = useVenueLive();
  const navigate = useNavigate();
  const [seat, setSeat] = useState(fan?.seatCode ?? "");
  const [handle, setHandle] = useState(fan?.handle ?? "");
  const [persona, setPersona] = useState<FanProfile["persona"]>(fan?.persona ?? "casual");

  const submit = (skip: boolean) => {
    const seatCode = skip ? null : seat.trim().toUpperCase() || null;
    saveFan({
      handle: handle.trim() || `Fan-${Math.floor(Math.random() * 9000 + 1000)}`,
      seatCode,
      zoneId: seatToZone(seatCode),
      persona,
    });
    navigate({ to: "/map" });
  };

  // Show the dashboard if already onboarded
  if (fan) return <FanDashboard />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="relative">
          {/* Subtle glow backdrop behind text */}
          <div className="absolute -inset-x-6 -inset-y-6 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
            <Sparkles className="h-3 w-3 animate-pulse" />
            AI-powered stadium companion
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Your stadium,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-sm">
              decoded.
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            See live crowd density. Skip the queues. Order from your seat. Ask the
            stadium anything.
          </p>
          <div className="mt-8">
            <MatchPill match={live.match} />
          </div>
        </div>

        <Card className="glass-panel p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
          <h2 className="text-lg font-bold">Get going</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop your seat code for a personalised experience — or skip and explore.
          </p>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Display name
              <Input
                className="mt-1 bg-background/50 border-border/50 focus:border-primary transition-colors hover:bg-background/80"
                placeholder="e.g. Sam"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Seat code
              <Input
                className="mt-1 uppercase bg-background/50 border-border/50 focus:border-primary transition-colors hover:bg-background/80"
                placeholder="N5-A12"
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
              />
            </label>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Pick a vibe</p>
              <div className="grid grid-cols-2 gap-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`group flex flex-col items-start rounded-lg border p-3 text-left transition-all duration-300 ${
                      persona === p.id
                        ? "border-primary bg-primary/20 shadow-[0_0_15px_rgba(var(--color-primary),0.2)]"
                        : "border-border/40 bg-card/40 hover:border-primary/50 hover:bg-card/60"
                    }`}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span className="mt-1 text-sm font-medium">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">{p.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => submit(false)} className="flex-1 shadow-lg shadow-primary/20">
                Enter venue
              </Button>
              <Button variant="outline" onClick={() => submit(true)} className="border-border/60">
                Skip
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <section className="mt-16 grid gap-3 md:grid-cols-4">
        {[
          { icon: Map, title: "Live map", body: "Real-time crowd heatmap" },
          { icon: Activity, title: "Queue Oracle", body: "Wait times for every stall" },
          { icon: Coffee, title: "Order to seat", body: "Skip the food queue" },
          { icon: MessageCircle, title: "AI assistant", body: "Ask anything, instantly" },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title} className="glass p-4 transition-all duration-300 hover:-translate-y-1 hover:glow-border hover:shadow-[0_10px_20px_rgba(var(--color-primary),0.15)] group">
              <div className="mb-3 inline-flex rounded-full bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-sm font-semibold">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.body}</p>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function FanDashboard() {
  useSimulatorTicker();
  const fan = useFan();
  const live = useVenueLive();
  const myZone = fan?.zoneId ? live.density[fan.zoneId] : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey, {fan?.handle ?? "Fan"} 👋
          </h1>
        </div>
        <MatchPill match={live.match} />
      </div>

      {fan?.seatCode && myZone && (
        <Card className="glass-panel mt-6 flex items-center justify-between gap-4 p-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground">Your zone</p>
            <p className="text-lg font-semibold">
              {fan.zoneId} · seat {fan.seatCode}
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <span
              className="inline-block h-3 w-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
              style={{ background: densityColor(myZone.density) }}
            />
            <span className="text-sm font-medium">{densityLabel(myZone.density)}</span>
          </div>
        </Card>
      )}

      <Card className="glass mt-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Live match feed</h3>
          <Link to="/map" className="text-xs text-primary hover:underline">
            Open map →
          </Link>
        </div>
        <div className="mt-3">
          <MatchTicker />
        </div>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/map" as const, icon: Map, title: "Live map", desc: "See the crowd flow now" },
          { to: "/wayfinder" as const, icon: Navigation, title: "Smart route", desc: "Crowd-aware directions" },
          { to: "/queues" as const, icon: Activity, title: "Queue Oracle", desc: "Find the shortest line" },
          { to: "/order" as const, icon: Coffee, title: "Order food", desc: "Pickup from your stall" },
          { to: "/upgrades" as const, icon: ArrowUpRight, title: "Seat upgrades", desc: "Bid on premium seats" },
          { to: "/assistant" as const, icon: MessageCircle, title: "Ask VenueIQ", desc: "Natural language helper" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="block h-full">
              <Card className="glass group h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300" />
                <div className="relative z-10">
                  <div className="inline-flex rounded-full bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 shadow-sm shadow-primary/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-lg text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors">{item.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
