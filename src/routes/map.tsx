import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { useSimulatorTicker } from "@/hooks/useSimulatorTicker";
import { useFan } from "@/lib/fan-session";
import { VenueMap } from "@/components/venue/VenueMap";
import { MatchPill } from "@/components/MatchPill";
import { MatchTicker } from "@/components/MatchTicker";
import { Card } from "@/components/ui/card";
import { densityColor, densityLabel } from "@/lib/venue";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Venue Map · VenueIQ" },
      { name: "description", content: "Real-time crowd heatmap of the stadium." },
      { property: "og:title", content: "Live Venue Map · VenueIQ" },
      { property: "og:description", content: "Real-time crowd heatmap of the stadium." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  useSimulatorTicker();
  const live = useVenueLive();
  const fan = useFan();
  const [selectedZone, setSelectedZone] = useState<string | null>(fan?.zoneId ?? null);

  const zone = selectedZone ? live.zones.find((z) => z.id === selectedZone) : null;
  const zoneDensity = selectedZone ? live.density[selectedZone] : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live venue map</h1>
          <p className="text-sm text-muted-foreground">
            Crowd density updates every few seconds.
          </p>
        </div>
        <MatchPill match={live.match} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <VenueMap
          zones={live.zones}
          facilities={live.facilities}
          density={live.density}
          highlightZone={selectedZone}
          onZoneClick={setSelectedZone}
        />

        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-sm font-semibold">Legend</h3>
            <div className="mt-3 space-y-1.5">
              {[0.1, 0.4, 0.65, 0.85, 0.98].map((d) => (
                <div key={d} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-3 w-6 rounded"
                    style={{ background: densityColor(d) }}
                  />
                  <span className="text-muted-foreground">{densityLabel(d)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
              {[
                { c: "var(--color-primary)", l: "Gate" },
                { c: "var(--color-accent)", l: "Stall" },
                { c: "var(--color-chart-5)", l: "Restroom" },
                { c: "var(--color-chart-4)", l: "Merch" },
              ].map((x) => (
                <div key={x.l} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: x.c }} />
                  {x.l}
                </div>
              ))}
            </div>
          </Card>

          {zone && zoneDensity && (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Selected zone</p>
              <h3 className="text-lg font-semibold">{zone.name}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Stat label="Density" value={`${Math.round(zoneDensity.density * 100)}%`} />
                <Stat label="Heads" value={zoneDensity.head_count.toLocaleString()} />
                <Stat label="Capacity" value={zone.capacity.toLocaleString()} />
                <Stat
                  label="Trend"
                  value={`${zoneDensity.trend > 0 ? "+" : ""}${(zoneDensity.trend * 100).toFixed(0)}%`}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: densityColor(zoneDensity.density) }}
                />
                <span className="text-sm">{densityLabel(zoneDensity.density)}</span>
              </div>
            </Card>
          )}

          {!zone && (
            <Card className="p-4 text-sm text-muted-foreground">
              Tap a zone for live details.
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-sm font-semibold">Match feed</h3>
            <div className="mt-3">
              <MatchTicker />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/50 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-medium">{value}</p>
    </div>
  );
}
