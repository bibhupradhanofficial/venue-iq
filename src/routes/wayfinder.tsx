import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { useSimulatorTicker } from "@/hooks/useSimulatorTicker";
import { useFan } from "@/lib/fan-session";
import { VenueMap } from "@/components/venue/VenueMap";
import { RouteOverlay } from "@/components/venue/RouteOverlay";
import { Card } from "@/components/ui/card";
import { findPath, costToMinutes } from "@/lib/routing";
import { densityLabel } from "@/lib/venue";
import { Footprints, MapPin, Navigation } from "lucide-react";

export const Route = createFileRoute("/wayfinder")({
  head: () => ({
    meta: [
      { title: "Smart Route · VenueIQ" },
      { name: "description", content: "Get a crowd-aware walking route to any stall, restroom, or gate." },
      { property: "og:title", content: "Smart Route · VenueIQ" },
      { property: "og:description", content: "Crowd-aware walking directions inside the stadium." },
    ],
  }),
  component: RoutePage,
});

function RoutePage() {
  useSimulatorTicker();
  const live = useVenueLive();
  const fan = useFan();
  const [origin, setOrigin] = useState<string>(fan?.zoneId ?? "");
  const [destFacilityId, setDestFacilityId] = useState<string>("");

  const standZones = live.zones.filter((z) => z.kind === "stand");
  const facilities = live.facilities.filter((f) => f.is_open);
  const destFacility = facilities.find((f) => f.id === destFacilityId) ?? null;

  const result = useMemo(() => {
    if (!origin || !destFacility?.zone_id) return null;
    return findPath(origin, destFacility.zone_id, live.density);
  }, [origin, destFacility, live.density]);

  const walkMin = result ? costToMinutes(result.cost) : null;
  const waitMin = destFacility ? Math.round(live.queues[destFacility.id]?.wait_minutes ?? 0) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart route</h1>
          <p className="text-sm text-muted-foreground">
            Crowd-aware walking directions. Routes around busy zones automatically.
          </p>
        </div>
        <Navigation className="h-6 w-6 text-primary" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="relative">
          <VenueMap
            zones={live.zones}
            facilities={live.facilities}
            density={live.density}
            highlightZone={origin || null}
            onZoneClick={(id) => {
              const z = live.zones.find((zz) => zz.id === id);
              if (z?.kind === "stand") setOrigin(id);
            }}
            onFacilityClick={(id) => setDestFacilityId(id)}
            routeOverlay={
              result
                ? <RouteOverlay path={result.path} zones={live.zones} destFacility={destFacility} />
                : null
            }
          />
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <label className="block text-xs font-medium text-muted-foreground">
              From (your zone)
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
              >
                <option value="">Pick a zone…</option>
                {standZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id} · {z.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-xs font-medium text-muted-foreground">
              To (facility)
              <select
                value={destFacilityId}
                onChange={(e) => setDestFacilityId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
              >
                <option value="">Pick a facility…</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.kind} · {f.name} ({f.zone_id})
                  </option>
                ))}
              </select>
            </label>
          </Card>

          {result && destFacility && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Footprints className="h-3.5 w-3.5" />
                Directions
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Stat label="Walk" value={`${walkMin} min`} />
                <Stat label="Wait" value={`${waitMin} min`} />
              </div>
              <ol className="mt-4 space-y-2 text-sm">
                {result.path.map((zid, i) => {
                  const z = live.zones.find((zz) => zz.id === zid);
                  const d = live.density[zid]?.density ?? 0;
                  const last = i === result.path.length - 1;
                  return (
                    <li key={zid} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[10px] font-mono">
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-medium">
                          {i === 0 ? "Start at " : last ? "Arrive at " : "Walk through "}
                          {z?.name ?? zid}
                        </span>{" "}
                        <span className="text-xs text-muted-foreground">
                          · {densityLabel(d)}
                        </span>
                      </span>
                    </li>
                  );
                })}
                <li className="flex items-start gap-2 pt-1">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium">{destFacility.name}</span>
                </li>
              </ol>
            </Card>
          )}

          {!result && (
            <Card className="p-4 text-sm text-muted-foreground">
              Select your zone and a destination to see a route.
            </Card>
          )}
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
