import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ops/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch · Ops · VenueIQ" }] }),
  component: DispatchPage,
});

type Staff = { id: string; name: string; role: string; status: string; zone_id: string | null };

const COLS: Array<{ status: string; label: string }> = [
  { status: "available", label: "Available" },
  { status: "dispatched", label: "Dispatched" },
  { status: "on_site", label: "On-site" },
];

function DispatchPage() {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    supabase.from("staff").select("*").order("name").then(({ data }) => data && setStaff(data as Staff[]));
  }, []);

  const move = async (s: Staff, next: string) => {
    setStaff((prev) => prev.map((p) => (p.id === s.id ? { ...p, status: next } : p)));
    await supabase.from("staff").update({ status: next }).eq("id", s.id);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="text-2xl font-bold tracking-tight">Staff dispatch</h1>
      <p className="text-sm text-muted-foreground">Drag through statuses as staff move.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {COLS.map((col) => {
          const items = staff.filter((s) => s.status === col.status);
          return (
            <Card key={col.status} className="p-3">
              <h3 className="text-sm font-semibold">{col.label} <span className="text-muted-foreground">({items.length})</span></h3>
              <div className="mt-2 space-y-2">
                {items.map((s) => {
                  const idx = COLS.findIndex((c) => c.status === col.status);
                  const next = COLS[idx + 1]?.status;
                  const prev = COLS[idx - 1]?.status;
                  return (
                    <div key={s.id} className="rounded-md border border-border bg-secondary/40 p-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.role} · {s.zone_id ?? "—"}
                      </p>
                      <div className="mt-1.5 flex gap-1">
                        {prev && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => move(s, prev)}>
                            ← {COLS.find(c => c.status === prev)?.label}
                          </Button>
                        )}
                        {next && (
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => move(s, next)}>
                            {COLS.find(c => c.status === next)?.label} →
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
