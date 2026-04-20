import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFan } from "@/lib/fan-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/upgrades")({
  head: () => ({
    meta: [
      { title: "Seat Upgrades · VenueIQ" },
      { name: "description", content: "Bid on premium seats — accepted in 60 seconds." },
      { property: "og:title", content: "Seat Upgrades · VenueIQ" },
      { property: "og:description", content: "Bid on premium seats — accepted in 60 seconds." },
    ],
  }),
  component: UpgradesPage,
});

type Offer = {
  id: string;
  zone_id: string;
  seat_code: string;
  base_price_cents: number;
  is_active: boolean;
};

type Bid = {
  id: string;
  offer_id: string;
  fan_handle: string | null;
  seat_code: string | null;
  bid_cents: number;
  status: string;
  created_at: string;
  decided_at: string | null;
};

function UpgradesPage() {
  const fan = useFan();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [o, b] = await Promise.all([
        supabase.from("seat_upgrade_offers").select("*").eq("is_active", true),
        supabase.from("seat_upgrade_bids").select("*").order("created_at", { ascending: false }),
      ]);
      if (o.data) setOffers(o.data as Offer[]);
      if (b.data) setBids(b.data as Bid[]);
    })();

    const ch = supabase
      .channel("upgrade-bids")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seat_upgrade_bids" },
        (payload) => {
          const row = payload.new as Bid;
          if (!row?.id) return;
          setBids((prev) => {
            const others = prev.filter((b) => b.id !== row.id);
            return [row, ...others];
          });
          if (row.fan_handle === fan?.handle && row.status !== "pending") {
            toast(row.status === "accepted" ? "Bid accepted! 🎉" : "Bid not accepted", {
              description: `$${(row.bid_cents / 100).toFixed(0)} · seat upgrade`,
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fan?.handle]);

  const placeBid = async (offer: Offer) => {
    const dollars = parseFloat(bidAmounts[offer.id] || "");
    if (!dollars || dollars <= 0) {
      toast.error("Enter a valid bid amount");
      return;
    }
    const cents = Math.round(dollars * 100);
    const { data, error } = await supabase
      .from("seat_upgrade_bids")
      .insert({
        offer_id: offer.id,
        fan_handle: fan?.handle ?? "Guest",
        seat_code: fan?.seatCode,
        bid_cents: cents,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Bid failed");
      return;
    }
    toast("Bid placed — waiting up to 60s for decision");
    setBidAmounts((p) => ({ ...p, [offer.id]: "" }));

    // Auto-decide after a short delay (demo)
    setTimeout(async () => {
      const accepted = cents >= offer.base_price_cents * 0.7;
      await supabase
        .from("seat_upgrade_bids")
        .update({
          status: accepted ? "accepted" : "rejected",
          decided_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    }, 6000 + Math.random() * 6000);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Seat upgrades</h1>
      <p className="text-sm text-muted-foreground">
        Premium seats currently empty. Bid below the base price — auto-accepts above 70%.
      </p>

      <div className="mt-5 space-y-2">
        {offers.map((o) => {
          const my = bids.find((b) => b.offer_id === o.id && b.fan_handle === fan?.handle);
          return (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{o.seat_code}</p>
                  <p className="text-xs text-muted-foreground">
                    Zone {o.zone_id} · base ${(o.base_price_cents / 100).toFixed(0)}
                  </p>
                </div>
                {my && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                      my.status === "accepted"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : my.status === "rejected"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {my.status}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={`${(o.base_price_cents / 100).toFixed(0)}`}
                  value={bidAmounts[o.id] ?? ""}
                  onChange={(e) =>
                    setBidAmounts((p) => ({ ...p, [o.id]: e.target.value }))
                  }
                  className="max-w-[120px]"
                />
                <Button size="sm" onClick={() => placeBid(o)}>
                  Place bid
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
