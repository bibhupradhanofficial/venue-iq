import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { estimateWaitMinutes } from "@/lib/venue";

/**
 * Crowd simulator tick — advances zone density and queue states one step.
 * Called from the client every ~5s by the live pages (idempotent, cheap).
 * Uses the admin client so it works with no end-user auth (demo mode).
 */
export const tickSimulator = createServerFn({ method: "POST" }).handler(
  async () => {
    // Load match state
    const { data: match } = await supabaseAdmin
      .from("match_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const phase = (match?.phase ?? "pre_game") as string;

    // Phase-driven crowd intensity (0..1 baseline + jitter)
    const intensity =
      phase === "pre_game"
        ? 0.35
        : phase === "first_half"
          ? 0.55
          : phase === "half_time"
            ? 0.85
            : phase === "second_half"
              ? 0.6
              : phase === "full_time"
                ? 0.7
                : 0.3;

    // ----- Zones -----
    const { data: zones } = await supabaseAdmin.from("zones").select("*");
    const { data: density } = await supabaseAdmin.from("zone_density").select("*");
    const dMap = new Map(density?.map((d: any) => [d.zone_id, d]) ?? []);

    const zoneUpdates: Array<any> = [];
    for (const z of zones ?? []) {
      const cur = dMap.get(z.id);
      const prev = cur?.density ?? 0.1;
      const target =
        cur?.manual_override !== null && cur?.manual_override !== undefined
          ? cur.manual_override
          : intensity *
            (z.kind === "concourse" ? 1.1 : 1.0) *
            (z.stand === "N" || z.stand === "S" ? 1.05 : 1.0);
      const noise = (Math.random() - 0.5) * 0.08;
      const next = Math.max(0.02, Math.min(1, prev + (target - prev) * 0.25 + noise));
      const trend = next - prev;
      zoneUpdates.push({
        zone_id: z.id,
        density: Number(next.toFixed(3)),
        head_count: Math.round(next * z.capacity),
        trend: Number(trend.toFixed(3)),
        manual_override: cur?.manual_override ?? null,
        updated_at: new Date().toISOString(),
      });
    }
    if (zoneUpdates.length) {
      await supabaseAdmin.from("zone_density").upsert(zoneUpdates);
    }

    // ----- Facilities / queues -----
    const { data: facilities } = await supabaseAdmin.from("facilities").select("*");
    const { data: queues } = await supabaseAdmin.from("queue_states").select("*");
    const qMap = new Map(queues?.map((q: any) => [q.facility_id, q]) ?? []);
    // Density per zone for facility arrivals
    const dByZone = new Map(zoneUpdates.map((u) => [u.zone_id, u.density]));

    const queueUpdates: Array<any> = [];
    for (const f of facilities ?? []) {
      const zoneDensity = dByZone.get(f.zone_id ?? "") ?? 0.3;
      // Base arrival rate from zone density and facility kind
      const baseArrival =
        f.kind === "gate"
          ? phase === "pre_game"
            ? 35 * zoneDensity
            : 5 * zoneDensity
          : f.kind === "stall"
            ? 12 * zoneDensity * (phase === "half_time" ? 1.8 : 1)
            : f.kind === "restroom"
              ? 18 * zoneDensity * (phase === "half_time" ? 2.0 : 1)
              : 4 * zoneDensity;

      const cur = qMap.get(f.id);
      const arrivals = f.is_open ? Math.max(0, baseArrival + (Math.random() - 0.5) * 4) : 0;
      const wait = f.is_open ? estimateWaitMinutes(arrivals, f.servers, f.service_rate) : 0;
      const queueLen = Math.round(arrivals * wait);
      queueUpdates.push({
        facility_id: f.id,
        arrivals_per_min: Number(arrivals.toFixed(2)),
        wait_minutes: Number(wait.toFixed(2)),
        queue_length: queueLen,
        updated_at: new Date().toISOString(),
      });
      // Track previous queue len for use elsewhere
      void cur;
    }
    if (queueUpdates.length) {
      await supabaseAdmin.from("queue_states").upsert(queueUpdates);
    }

    // Auto-advance match minute (1 minute per tick if in active phase)
    if (match && (match.phase === "first_half" || match.phase === "second_half")) {
      const newMinute = Math.min(
        match.phase === "first_half" ? 45 : 90,
        match.minute + 1,
      );
      await supabaseAdmin
        .from("match_state")
        .update({ minute: newMinute, updated_at: new Date().toISOString() })
        .eq("id", 1);
    }

    return { ok: true, zones: zoneUpdates.length, queues: queueUpdates.length };
  },
);
