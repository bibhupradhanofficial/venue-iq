import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { VenueMap } from "@/components/venue/VenueMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchPill } from "@/components/MatchPill";
import { supabase } from "@/integrations/supabase/client";
import { densityColor, densityLabel } from "@/lib/venue";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ops/")({
  head: () => ({
    meta: [{ title: "Overview · Ops · VenueIQ" }],
  }),
  component: OpsOverview,
});

type Forecast = {
  id: string;
  zone_id: string;
  horizon_minutes: number;
  predicted_density: number;
  confidence: number;
  recommendation: string | null;
  created_at: string;
};

function OpsOverview() {
  const live = useVenueLive();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [forecasting, setForecasting] = useState(false);

  useEffect(() => {
    supabase
      .from("surge_forecasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => data && setForecasts(data as Forecast[]));
    const ch = supabase
      .channel("forecasts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "surge_forecasts" }, (p) => {
        setForecasts((prev) => [p.new as Forecast, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Anomaly detection — zones with density > 0.85 or trend > 0.15
  const anomalies = live.zones
    .map((z) => ({ z, d: live.density[z.id] }))
    .filter(({ d }) => d && (d.density > 0.85 || d.trend > 0.15));

  const runForecast = async () => {
    setForecasting(true);
    try {
      const resp = await fetch("/api/forecast", { method: "POST" });
      if (!resp.ok) {
        toast.error("Forecast failed");
      } else {
        const j = await resp.json();
        toast.success(`Forecast done: ${j.count ?? 0} zones`);
      }
    } catch {
      toast.error("Forecast error");
    } finally {
      setForecasting(false);
    }
  };

  const topZones = [...live.zones]
    .map((z) => ({ z, d: live.density[z.id]?.density ?? 0 }))
    .sort((a, b) => b.d - a.d)
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live overview</h1>
          <p className="text-sm text-muted-foreground">
            Real-time crowd density and AI surge forecasts.
          </p>
        </div>
        <MatchPill match={live.match} />
      </div>

      {anomalies.length > 0 && (
        <Card className="mb-4 border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {anomalies.length} zone{anomalies.length > 1 ? "s" : ""} flagged
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {anomalies.map((a) => a.z.id).join(", ")} · density spike or critical level
          </p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <VenueMap
          zones={live.zones}
          facilities={live.facilities}
          density={live.density}
        />

        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">AI Surge Forecast</h3>
              <Button size="sm" onClick={runForecast} disabled={forecasting}>
                <TrendingUp className="mr-1 h-3 w-3" />
                {forecasting ? "…" : "Run"}
              </Button>
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {forecasts.length === 0 && (
                <p className="text-xs text-muted-foreground">No forecasts yet. Click Run.</p>
              )}
              {forecasts.map((f) => (
                <div key={f.id} className="rounded-md border border-border bg-secondary/40 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{f.zone_id}</span>
                    <span className="text-muted-foreground">+{f.horizon_minutes}m</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: densityColor(f.predicted_density) }}
                    />
                    <span>{Math.round(f.predicted_density * 100)}% · {densityLabel(f.predicted_density)}</span>
                  </div>
                  {f.recommendation && (
                    <p className="mt-1 text-muted-foreground">{f.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold">Top crowd zones</h3>
            <div className="mt-3 space-y-1.5">
              {topZones.map(({ z, d }) => (
                <div key={z.id} className="flex items-center justify-between text-xs">
                  <span>{z.id} · {z.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: densityColor(d) }}
                    />
                    {Math.round(d * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
