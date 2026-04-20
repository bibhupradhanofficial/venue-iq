import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFan } from "@/lib/fan-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/order/$stallId")({
  head: () => ({
    meta: [
      { title: "Order · VenueIQ" },
      { name: "description", content: "Browse the menu and place a pickup order." },
    ],
  }),
  component: StallPage,
});

type MenuItem = {
  id: string;
  facility_id: string;
  name: string;
  price_cents: number;
  category: string;
  is_available: boolean;
};

function StallPage() {
  const { stallId } = Route.useParams();
  const fan = useFan();
  const navigate = useNavigate();
  const [stall, setStall] = useState<{ id: string; name: string } | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, m] = await Promise.all([
        supabase.from("facilities").select("id,name").eq("id", stallId).maybeSingle(),
        supabase.from("menu_items").select("*").eq("facility_id", stallId),
      ]);
      if (s.data) setStall(s.data as any);
      if (m.data) setItems(m.data as MenuItem[]);
    })();
  }, [stallId]);

  const total = items.reduce((sum, i) => sum + i.price_cents * (cart[i.id] || 0), 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const place = async () => {
    if (itemCount === 0) return;
    setSubmitting(true);
    const pickup = new Date(Date.now() + (5 + Math.random() * 5) * 60_000).toISOString();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        facility_id: stallId,
        seat_code: fan?.seatCode,
        fan_handle: fan?.handle ?? "Guest",
        total_cents: total,
        pickup_slot: pickup,
      })
      .select()
      .single();
    if (error || !order) {
      toast.error("Order failed");
      setSubmitting(false);
      return;
    }
    const rows = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([menu_item_id, qty]) => {
        const item = items.find((i) => i.id === menu_item_id)!;
        return { order_id: order.id, menu_item_id, qty, price_cents: item.price_cents };
      });
    await supabase.from("order_items").insert(rows);
    toast.success("Order placed", {
      description: `Pickup at ${new Date(pickup).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    });
    navigate({ to: "/order" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/order" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{stall?.name ?? "Stall"}</h1>

      <div className="mt-5 space-y-2">
        {items.map((it) => {
          const qty = cart[it.id] || 0;
          return (
            <Card key={it.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${(it.price_cents / 100).toFixed(2)} · {it.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  disabled={qty === 0}
                  onClick={() => setCart((c) => ({ ...c, [it.id]: Math.max(0, (c[it.id] || 0) - 1) }))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-mono">{qty}</span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setCart((c) => ({ ...c, [it.id]: (c[it.id] || 0) + 1 }))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {itemCount > 0 && (
        <div className="sticky bottom-4 mt-6">
          <Card className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">{itemCount} items</p>
              <p className="text-lg font-semibold">${(total / 100).toFixed(2)}</p>
            </div>
            <Button onClick={place} disabled={submitting}>
              {submitting ? "Placing…" : "Place order"}
            </Button>
          </Card>
        </div>
      )}
    </main>
  );
}
