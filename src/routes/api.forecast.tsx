import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { densityLabel } from "@/lib/venue";

/**
 * AI Surge Forecast endpoint.
 * Reads the last few density snapshots, asks Gemini for a 5/15/30 min forecast
 * per zone with recommended ops actions, persists the result.
 */
export const Route = createFileRoute("/api/forecast")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const [zonesRes, densRes, matchRes] = await Promise.all([
          supabaseAdmin.from("zones").select("id,name,kind,stand,capacity"),
          supabaseAdmin.from("zone_density").select("*"),
          supabaseAdmin.from("match_state").select("*").eq("id", 1).maybeSingle(),
        ]);

        const dMap = new Map((densRes.data ?? []).map((d: any) => [d.zone_id, d]));
        const m = matchRes.data as any;
        const snapshot = (zonesRes.data ?? []).map((z: any) => {
          const d = dMap.get(z.id);
          return `${z.id} (${z.name}, ${z.kind}): density=${d?.density ?? 0}, trend=${d?.trend ?? 0}`;
        }).join("\n");

        const prompt = `Match phase: ${m?.phase ?? "pre_game"} minute ${m?.minute ?? 0}.
Current zone snapshot:
${snapshot}

For each of these zones: ${["CN","CS","CE","CW","N5","S5","E1","W1"].join(", ")},
predict density at +5, +15, +30 minutes. Density is 0..1.
Recommend a one-sentence ops action when predicted density >= 0.8.`;

        const tools = [{
          type: "function",
          function: {
            name: "submit_forecasts",
            description: "Submit surge forecasts",
            parameters: {
              type: "object",
              properties: {
                forecasts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      zone_id: { type: "string" },
                      horizon_minutes: { type: "integer", enum: [5, 15, 30] },
                      predicted_density: { type: "number" },
                      confidence: { type: "number" },
                      recommendation: { type: "string" },
                    },
                    required: ["zone_id", "horizon_minutes", "predicted_density", "confidence"],
                  },
                },
              },
              required: ["forecasts"],
            },
          },
        }];

        let aiData: any = null;
        try {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a stadium crowd forecasting assistant. Use the tool to submit forecasts." },
                { role: "user", content: prompt },
              ],
              tools,
              tool_choice: { type: "function", function: { name: "submit_forecasts" } },
            }),
          });
          if (!aiResp.ok) {
            return new Response(JSON.stringify({ error: `AI ${aiResp.status}` }), {
              status: aiResp.status, headers: { "Content-Type": "application/json" },
            });
          }
          aiData = await aiResp.json();
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
        }

        const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
        let forecasts: any[] = [];
        try {
          const args = JSON.parse(toolCall?.function?.arguments ?? "{}");
          forecasts = Array.isArray(args.forecasts) ? args.forecasts : [];
        } catch {
          forecasts = [];
        }

        // Validate zone_ids exist
        const validZones = new Set((zonesRes.data ?? []).map((z: any) => z.id));
        const rows = forecasts
          .filter((f) => validZones.has(f.zone_id) && [5, 15, 30].includes(f.horizon_minutes))
          .map((f) => ({
            zone_id: f.zone_id,
            horizon_minutes: f.horizon_minutes,
            predicted_density: Math.max(0, Math.min(1, Number(f.predicted_density))),
            confidence: Math.max(0, Math.min(1, Number(f.confidence) || 0.7)),
            recommendation: f.recommendation
              ?? (f.predicted_density >= 0.8
                ? `Surge risk: ${densityLabel(f.predicted_density)} expected in ${f.horizon_minutes}m at ${f.zone_id}`
                : null),
          }));

        if (rows.length) {
          await supabaseAdmin.from("surge_forecasts").insert(rows);
        }

        return new Response(JSON.stringify({ ok: true, count: rows.length }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
