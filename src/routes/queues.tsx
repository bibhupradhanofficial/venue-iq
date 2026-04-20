import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { useSimulatorTicker } from "@/hooks/useSimulatorTicker";
import { useFan } from "@/lib/fan-session";
import { rankFacilitiesForFan } from "@/lib/routing";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Navigation } from "lucide-react";

export const Route = createFileRoute("/queues")({
  head: () => ({
    meta: [
      { title: "Queue Oracle · VenueIQ" },
      { name: "description", content: "Real-time wait times for every gate, food stall, restroom, and merch counter." },
      { property: "og:title", content: "Queue Oracle · VenueIQ" },
      { property: "og:description", content: "Real-time wait times for every gate, food stall, restroom, and merch counter." },
    ],
  }),
  component: QueuesPage,
});

const KIND_LABEL: Record<string, string> = {
  gate: "Gates",
  stall: "Food",
  restroom: "Restrooms",
  merch: "Merch",
};

function waitTone(min: number) {
  if (min < 2) return "text-emerald-400";
  if (min < 5) return "text-amber-300";
  if (min < 12) return "text-orange-400";
  return "text-red-400";
}

function QueuesPage() {
  useSimulatorTicker();
  const live = useVenueLive();
  const fan = useFan();
  const [tab, setTab] = useState<string>("stall");

  const grouped = useMemo(() => {
    const g: Record<string, typeof live.facilities> = {};
    for (const f of live.facilities) {
      (g[f.kind] ||= []).push(f);
    }
    return g;
  }, [live.facilities]);

  const bestForFan = useMemo(() => {
    if (!fan?.zoneId) return null;
    const ranked = rankFacilitiesForFan(
      fan.zoneId,
      live.facilities,
      live.zones,
      live.density,
      live.queues,
      tab as "stall" | "restroom" | "gate" | "merch",
    );
    return ranked[0] ?? null;
  }, [fan?.zoneId, live, tab]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Queue Oracle</h1>
      <p className="text-sm text-muted-foreground">
        Live wait times. Sorted shortest first.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="grid w-full grid-cols-4">
          {(["stall", "restroom", "gate", "merch"] as const).map((k) => (
            <TabsTrigger key={k} value={k}>
              {KIND_LABEL[k]}
            </TabsTrigger>
          ))}
        </TabsList>
        {(["stall", "restroom", "gate", "merch"] as const).map((k) => {
          const items = (grouped[k] ?? [])
            .map((f) => ({ f, q: live.queues[f.id] }))
            .sort((a, b) => (a.q?.wait_minutes ?? 0) - (b.q?.wait_minutes ?? 0));
          return (
            <TabsContent key={k} value={k} className="mt-4 space-y-2">
              {bestForFan && bestForFan.facility.kind === k && (
                <Card className="border-primary/40 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
                        <Sparkles className="h-3 w-3" /> Best for you
                      </div>
                      <p className="mt-1 font-medium">{bestForFan.facility.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {bestForFan.walkMin} min walk · {Math.round(bestForFan.waitMin)} min wait ={" "}
                        <span className="font-medium text-foreground">
                          {Math.round(bestForFan.totalMin)} min total
                        </span>
                      </p>
                    </div>
                    <Link
                      to="/wayfinder"
                      className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Route
                    </Link>
                  </div>
                </Card>
              )}
              {items.length === 0 && (
                <Card className="p-4 text-sm text-muted-foreground">No facilities.</Card>
              )}
              {items.map(({ f, q }) => {
                const wait = q?.wait_minutes ?? 0;
                return (
                  <Card key={f.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.is_open ? `${q?.queue_length ?? 0} in line` : "Closed"} · {f.servers}{" "}
                        servers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-lg font-semibold ${waitTone(wait)}`}>
                        {f.is_open ? `${Math.round(wait)} min` : "—"}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        wait
                      </p>
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
          );
        })}
      </Tabs>
    </main>
  );
}
