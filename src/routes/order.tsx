import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { useSimulatorTicker } from "@/hooks/useSimulatorTicker";
import { useFan } from "@/lib/fan-session";
import { rankFacilitiesForFan } from "@/lib/routing";
import { Card } from "@/components/ui/card";
import { ChevronRight, Sparkles, Navigation } from "lucide-react";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Order to Seat · VenueIQ" },
      { name: "description", content: "Browse stalls and order food and drinks for pickup." },
      { property: "og:title", content: "Order to Seat · VenueIQ" },
      { property: "og:description", content: "Browse stalls and order food and drinks for pickup." },
    ],
  }),
  component: OrderIndex,
});

function OrderIndex() {
  useSimulatorTicker();
  const live = useVenueLive();
  const fan = useFan();
  const stalls = live.facilities.filter((f) => f.kind === "stall");

  const best = useMemo(() => {
    if (!fan?.zoneId) return null;
    const r = rankFacilitiesForFan(
      fan.zoneId,
      live.facilities,
      live.zones,
      live.density,
      live.queues,
      "stall",
    );
    return r[0] ?? null;
  }, [fan?.zoneId, live]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Order to seat</h1>
      <p className="text-sm text-muted-foreground">
        Skip the line. Pickup slot assigned automatically.
      </p>
      {best && (
        <Card className="mt-4 border-primary/40 bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Best for you
              </div>
              <p className="mt-1 font-medium">{best.facility.name}</p>
              <p className="text-xs text-muted-foreground">
                {best.walkMin} min walk · {Math.round(best.waitMin)} min wait
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/wayfinder"
                className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <Navigation className="h-3.5 w-3.5" /> Route
              </Link>
              <Link
                to="/order/$stallId"
                params={{ stallId: best.facility.id }}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Order →
              </Link>
            </div>
          </div>
        </Card>
      )}
      <div className="mt-5 space-y-2">
        {stalls.map((f) => {
          const q = live.queues[f.id];
          return (
            <Link key={f.id} to="/order/$stallId" params={{ stallId: f.id }}>
              <Card className="flex items-center justify-between p-3 transition-colors hover:border-primary/60">
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.is_open ? "Open" : "Closed"} ·{" "}
                    {q ? `${Math.round(q.wait_minutes)} min wait` : "—"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
