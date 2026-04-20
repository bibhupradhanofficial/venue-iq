import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useVenueLive } from "@/hooks/useVenueLive";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import type { MatchPhase } from "@/lib/venue";

export const Route = createFileRoute("/ops/controls")({
  head: () => ({ meta: [{ title: "Controls · Ops · VenueIQ" }] }),
  component: ControlsPage,
});

const PHASES: Array<{ phase: MatchPhase; label: string; minute: number }> = [
  { phase: "pre_game", label: "Pre-game", minute: 0 },
  { phase: "first_half", label: "Kick-off (1H)", minute: 1 },
  { phase: "half_time", label: "Half-time", minute: 45 },
  { phase: "second_half", label: "2nd Half", minute: 46 },
  { phase: "full_time", label: "Full-time", minute: 90 },
];

function ControlsPage() {
  const live = useVenueLive();
  const [selectedZone, setSelectedZone] = useState<string>(live.zones[0]?.id ?? "");
  const [override, setOverride] = useState<number>(0.5);

  const setPhase = async (phase: MatchPhase, minute: number) => {
    await supabase.from("match_state").update({ phase, minute }).eq("id", 1);
    await supabase.from("match_events").insert({
      kind: phase === "first_half" ? "kick_off" : phase,
      minute,
    });
    toast.success(`Match: ${phase}`);
  };

  const goal = async (side: "home" | "away") => {
    const { data } = await supabase.from("match_state").select("*").eq("id", 1).maybeSingle();
    if (!data) return;
    await supabase.from("match_state").update({
      home_score: side === "home" ? data.home_score + 1 : data.home_score,
      away_score: side === "away" ? data.away_score + 1 : data.away_score,
    }).eq("id", 1);
    await supabase.from("match_events").insert({
      kind: "goal",
      minute: data.minute,
      team: side === "home" ? data.home_team : data.away_team,
    });
    toast.success(`Goal — ${side}!`);
  };

  const card = async (color: "yellow" | "red", side: "home" | "away") => {
    const { data } = await supabase.from("match_state").select("*").eq("id", 1).maybeSingle();
    if (!data) return;
    await supabase.from("match_events").insert({
      kind: color === "yellow" ? "yellow_card" : "red_card",
      minute: data.minute,
      team: side === "home" ? data.home_team : data.away_team,
    });
    toast(`${color === "yellow" ? "🟨" : "🟥"} ${side} card`);
  };

  const applyOverride = async () => {
    if (!selectedZone) return;
    await supabase.from("zone_density").update({ manual_override: override }).eq("zone_id", selectedZone);
    toast.success(`${selectedZone} pinned at ${Math.round(override * 100)}%`);
  };

  const clearOverride = async () => {
    if (!selectedZone) return;
    await supabase.from("zone_density").update({ manual_override: null }).eq("zone_id", selectedZone);
    toast("Override cleared");
  };

  const toggleFacility = async (id: string, isOpen: boolean) => {
    await supabase.from("facilities").update({ is_open: !isOpen }).eq("id", id);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      <h1 className="text-2xl font-bold tracking-tight">Demo controls</h1>
      <p className="text-sm text-muted-foreground">Drive the match timeline and override crowd state.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Match timeline</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PHASES.map((p) => (
              <Button key={p.phase} variant="outline" size="sm" onClick={() => setPhase(p.phase, p.minute)}>
                {p.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => goal("home")}>Goal — Home</Button>
            <Button size="sm" variant="secondary" onClick={() => goal("away")}>Goal — Away</Button>
            <Button size="sm" variant="outline" onClick={() => card("yellow", "home")}>🟨 Home</Button>
            <Button size="sm" variant="outline" onClick={() => card("yellow", "away")}>🟨 Away</Button>
            <Button size="sm" variant="outline" onClick={() => card("red", "home")}>🟥 Home</Button>
            <Button size="sm" variant="outline" onClick={() => card("red", "away")}>🟥 Away</Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold">Zone density override</h3>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="mt-3 w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
          >
            {live.zones.map((z) => <option key={z.id} value={z.id}>{z.id} · {z.name}</option>)}
          </select>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Pin at: {Math.round(override * 100)}%</p>
            <Slider value={[override]} onValueChange={(v) => setOverride(v[0])} min={0} max={1} step={0.05} className="mt-2" />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={applyOverride}>Apply</Button>
            <Button size="sm" variant="outline" onClick={clearOverride}>Clear</Button>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <h3 className="text-sm font-semibold">Facility status</h3>
        <p className="text-xs text-muted-foreground">Click to open/close.</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {live.facilities.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFacility(f.id, f.is_open)}
              className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                f.is_open
                  ? "border-border bg-secondary/40 hover:bg-secondary"
                  : "border-destructive/50 bg-destructive/10 text-destructive"
              }`}
            >
              <p className="font-medium">{f.name}</p>
              <p className="text-[10px] opacity-70">{f.is_open ? "Open" : "Closed"}</p>
            </button>
          ))}
        </div>
      </Card>
    </main>
  );
}
