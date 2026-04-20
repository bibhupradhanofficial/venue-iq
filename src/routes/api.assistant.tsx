import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { densityLabel, PHASE_LABEL } from "@/lib/venue";

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages: Array<{ role: "user" | "assistant"; content: string }>;
            fan?: { handle?: string; seatCode?: string | null; zoneId?: string | null; persona?: string };
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Build a lightweight RAG context from live data
          const [zonesRes, densRes, qRes, facRes, matchRes, evRes] = await Promise.all([
            supabaseAdmin.from("zones").select("id,name,kind,stand,capacity"),
            supabaseAdmin.from("zone_density").select("zone_id,density,head_count,trend"),
            supabaseAdmin.from("queue_states").select("facility_id,wait_minutes,queue_length"),
            supabaseAdmin.from("facilities").select("id,name,kind,zone_id,is_open"),
            supabaseAdmin.from("match_state").select("*").eq("id", 1).maybeSingle(),
            supabaseAdmin.from("match_events").select("kind,minute,team").order("created_at", { ascending: false }).limit(5),
          ]);

          const dMap = new Map((densRes.data ?? []).map((d: any) => [d.zone_id, d]));
          const qMap = new Map((qRes.data ?? []).map((q: any) => [q.facility_id, q]));

          const zoneLines = (zonesRes.data ?? [])
            .map((z: any) => {
              const d = dMap.get(z.id);
              const dens = d?.density ?? 0;
              return `- ${z.id} (${z.name}): ${Math.round(dens * 100)}% capacity, ${densityLabel(dens)}`;
            })
            .join("\n");

          const facilityLines = (facRes.data ?? [])
            .map((f: any) => {
              const q = qMap.get(f.id);
              const wait = q?.wait_minutes ?? 0;
              return `- ${f.kind.toUpperCase()} ${f.id} ${f.name} (zone ${f.zone_id}, ${
                f.is_open ? "open" : "CLOSED"
              }): ${Math.round(wait)} min wait`;
            })
            .join("\n");

          const m = matchRes.data as any;
          const matchLine = m
            ? `${PHASE_LABEL[m.phase as keyof typeof PHASE_LABEL] ?? m.phase}, minute ${m.minute}, ${m.home_team} ${m.home_score}–${m.away_score} ${m.away_team}`
            : "unknown";

          const eventLines = (evRes.data ?? [])
            .map((e: any) => `- ${e.minute}' ${e.kind}${e.team ? ` (${e.team})` : ""}`)
            .join("\n") || "- (no events yet)";

          const fan = body.fan ?? {};
          const fanLine = fan.seatCode
            ? `Fan handle: ${fan.handle ?? "Guest"}, seat ${fan.seatCode} in zone ${fan.zoneId ?? "?"}, persona: ${fan.persona ?? "casual"}.`
            : `Fan handle: ${fan.handle ?? "Guest"}, no seat code on file, persona: ${fan.persona ?? "casual"}.`;

          const system = `You are VenueIQ, the in-stadium AI concierge. Be concise, friendly, and specific. Always recommend a concrete action (a zone, facility id, time). If the fan has a seat code, use it for routing context. Never make up data — if something isn't in the snapshot below, say you don't have that info live.

LIVE STADIUM SNAPSHOT (auto-refreshed):
Match: ${matchLine}
${fanLine}

Recent match events (newest first):
${eventLines}

Zones (id: density, label):
${zoneLines}

Facilities (kind, id, name, zone, status, wait):
${facilityLines}

Tips:
- Wait < 3 min = great, 3-7 = fine, 8-15 = slow, >15 = avoid.
- Concourses CN/CS/CE/CW connect zones along that side.
- For "shortest queue" answers, name the facility id and zone.
- For questions like "did anything happen?" use the recent match events list above.`;

          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              stream: true,
              messages: [
                { role: "system", content: system },
                ...body.messages.map((m) => ({ role: m.role, content: m.content })),
              ],
            }),
          });

          if (!aiResp.ok) {
            if (aiResp.status === 429) {
              return new Response(JSON.stringify({ error: "Rate limited" }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (aiResp.status === 402) {
              return new Response(JSON.stringify({ error: "Credits exhausted" }), {
                status: 402,
                headers: { "Content-Type": "application/json" },
              });
            }
            const text = await aiResp.text();
            return new Response(JSON.stringify({ error: "AI gateway error", detail: text.slice(0, 200) }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(aiResp.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
