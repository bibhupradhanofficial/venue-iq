import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Facility,
  MatchState,
  QueueState,
  Zone,
  ZoneDensity,
} from "@/lib/venue";

type Live = {
  zones: Zone[];
  facilities: Facility[];
  density: Record<string, ZoneDensity>;
  queues: Record<string, QueueState>;
  match: MatchState | null;
  loading: boolean;
};

export function useVenueLive(): Live {
  const [zones, setZones] = useState<Zone[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [density, setDensity] = useState<Record<string, ZoneDensity>>({});
  const [queues, setQueues] = useState<Record<string, QueueState>>({});
  const [match, setMatch] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [zRes, fRes, dRes, qRes, mRes] = await Promise.all([
        supabase.from("zones").select("*").order("id"),
        supabase.from("facilities").select("*").order("id"),
        supabase.from("zone_density").select("*"),
        supabase.from("queue_states").select("*"),
        supabase.from("match_state").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (!mounted) return;
      if (zRes.data) setZones(zRes.data as Zone[]);
      if (fRes.data) setFacilities(fRes.data as Facility[]);
      if (dRes.data) {
        const map: Record<string, ZoneDensity> = {};
        (dRes.data as ZoneDensity[]).forEach((d) => (map[d.zone_id] = d));
        setDensity(map);
      }
      if (qRes.data) {
        const map: Record<string, QueueState> = {};
        (qRes.data as QueueState[]).forEach((q) => (map[q.facility_id] = q));
        setQueues(map);
      }
      if (mRes.data) setMatch(mRes.data as MatchState);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`venue-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "zone_density" },
        (payload) => {
          const row = payload.new as ZoneDensity;
          if (row?.zone_id) {
            setDensity((prev) => ({ ...prev, [row.zone_id]: row }));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_states" },
        (payload) => {
          const row = payload.new as QueueState;
          if (row?.facility_id) {
            setQueues((prev) => ({ ...prev, [row.facility_id]: row }));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_state" },
        (payload) => setMatch(payload.new as MatchState),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "facilities" },
        (payload) => {
          const row = payload.new as Facility;
          if (row?.id) {
            setFacilities((prev) => prev.map((f) => (f.id === row.id ? row : f)));
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { zones, facilities, density, queues, match, loading };
}
