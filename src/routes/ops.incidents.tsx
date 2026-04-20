import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVenueLive } from "@/hooks/useVenueLive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/ops/incidents")({
  head: () => ({ meta: [{ title: "Incidents · Ops · VenueIQ" }] }),
  component: IncidentsPage,
});

type Incident = {
  id: string;
  zone_id: string | null;
  kind: string;
  severity: string;
  status: string;
  description: string | null;
  created_at: string;
};

function IncidentsPage() {
  const live = useVenueLive();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zone, setZone] = useState<string>("");
  const [kind, setKind] = useState("medical");
  const [severity, setSeverity] = useState("medium");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => data && setIncidents(data as Incident[]));
    const ch = supabase.channel("incidents-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, (p) => {
        const row = p.new as Incident;
        if (!row?.id) return;
        setIncidents((prev) => [row, ...prev.filter((i) => i.id !== row.id)].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const create = async () => {
    if (!zone) {
      toast.error("Pick a zone");
      return;
    }
    const { error } = await supabase.from("incidents").insert({
      zone_id: zone,
      kind,
      severity,
      description: desc || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Incident logged");
      setDesc("");
    }
  };

  const resolve = async (i: Incident) => {
    await supabase.from("incidents").update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    }).eq("id", i.id);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-[320px_1fr]">
        <Card className="p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Log incident
          </h3>
          <div className="mt-3 space-y-2">
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
              <SelectContent>
                {live.zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.id} · {z.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["medical", "security", "crowd_crush", "other"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Button className="w-full" onClick={create}>Create incident</Button>
          </div>
        </Card>

        <div className="space-y-2">
          {incidents.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No incidents logged.</Card>}
          {incidents.map((i) => (
            <Card key={i.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {i.kind} · {i.severity} · zone {i.zone_id ?? "—"}
                  </p>
                  {i.description && <p className="text-xs text-muted-foreground">{i.description}</p>}
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(i.created_at).toLocaleTimeString()} · {i.status}
                  </p>
                </div>
                {i.status !== "resolved" && (
                  <Button size="sm" variant="outline" onClick={() => resolve(i)}>Resolve</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
