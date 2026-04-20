
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP POLICY IF EXISTS "orders insertable by anyone" ON public.orders;
CREATE POLICY "orders insertable by anyone" ON public.orders
  FOR INSERT WITH CHECK (facility_id IS NOT NULL AND total_cents >= 0);

DROP POLICY IF EXISTS "order_items insertable by anyone" ON public.order_items;
CREATE POLICY "order_items insertable by anyone" ON public.order_items
  FOR INSERT WITH CHECK (order_id IS NOT NULL AND qty > 0 AND price_cents >= 0);

DROP POLICY IF EXISTS "bids insertable by anyone" ON public.seat_upgrade_bids;
CREATE POLICY "bids insertable by anyone" ON public.seat_upgrade_bids
  FOR INSERT WITH CHECK (offer_id IS NOT NULL AND bid_cents > 0);
