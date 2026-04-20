import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MatchEvent = {
  id: string;
  kind: string;
  minute: number;
  team: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  goal: "⚽ GOAL",
  yellow_card: "🟨 Yellow",
  red_card: "🟥 Red",
  half_time: "⏸ Half-time",
  full_time: "🏁 Full-time",
  sub: "🔄 Sub",
  kick_off: "▶ Kick-off",
};

export function useMatchEvents(limit = 8): MatchEvent[] {
  const [events, setEvents] = useState<MatchEvent[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("match_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (mounted && data) setEvents(data as MatchEvent[]);
    })();

    const ch = supabase
      .channel("match-events-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_events" },
        (payload) => {
          setEvents((prev) => [payload.new as MatchEvent, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [limit]);

  return events;
}

export function MatchTicker({ compact = false }: { compact?: boolean }) {
  const events = useMatchEvents(6);
  if (events.length === 0) {
    return (
      <div className="rounded-md glass px-3 py-2 text-xs text-muted-foreground border border-border/30">
        No match events yet — waiting for kick-off.
      </div>
    );
  }
  if (compact) {
    const e = events[0];
    return (
      <div className="flex items-center gap-2 rounded-md glass px-3 py-1.5 text-xs border border-border/40 hover:border-primary/30 transition-all">
        <span className="font-mono text-primary font-bold">{e.minute}'</span>
        <span className="font-medium text-foreground">{KIND_LABEL[e.kind] ?? e.kind}</span>
        {e.team && <span className="text-muted-foreground">· {e.team}</span>}
      </div>
    );
  }
  return (
    <ol className="space-y-1.5">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 rounded-md glass px-3 py-1.5 text-xs border border-border/30 hover:shadow-md hover:border-primary/20 transition-all group"
        >
          <span className="w-8 font-mono text-primary font-bold group-hover:drop-shadow-sm transition-all">{e.minute}'</span>
          <span className="font-medium text-foreground">{KIND_LABEL[e.kind] ?? e.kind}</span>
          {e.team && <span className="ml-auto text-muted-foreground font-medium">{e.team}</span>}
        </li>
      ))}
    </ol>
  );
}
