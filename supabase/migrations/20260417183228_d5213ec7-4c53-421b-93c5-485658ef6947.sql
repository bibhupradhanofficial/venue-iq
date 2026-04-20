
-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('ops_staff');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== Updated-at trigger =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ===== Zones =====
CREATE TABLE public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'stand' | 'concourse' | 'plaza'
  stand TEXT,         -- 'N','S','E','W'
  capacity INT NOT NULL DEFAULT 1000,
  svg_x NUMERIC NOT NULL,
  svg_y NUMERIC NOT NULL,
  svg_w NUMERIC NOT NULL,
  svg_h NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones readable by all" ON public.zones FOR SELECT USING (true);
CREATE POLICY "zones writable by ops" ON public.zones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Facilities =====
CREATE TABLE public.facilities (
  id TEXT PRIMARY KEY,
  zone_id TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'gate' | 'stall' | 'restroom' | 'merch'
  name TEXT NOT NULL,
  servers INT NOT NULL DEFAULT 1,         -- # of parallel servers (M/M/c)
  service_rate NUMERIC NOT NULL DEFAULT 30, -- customers/min per server
  is_open BOOLEAN NOT NULL DEFAULT true,
  svg_x NUMERIC NOT NULL,
  svg_y NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities readable by all" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "facilities writable by ops" ON public.facilities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Live state: zone density =====
CREATE TABLE public.zone_density (
  zone_id TEXT PRIMARY KEY REFERENCES public.zones(id) ON DELETE CASCADE,
  density NUMERIC NOT NULL DEFAULT 0,    -- 0..1
  head_count INT NOT NULL DEFAULT 0,
  trend NUMERIC NOT NULL DEFAULT 0,      -- delta vs previous tick
  manual_override NUMERIC,               -- 0..1 if ops set it
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.zone_density ENABLE ROW LEVEL SECURITY;
CREATE POLICY "density readable by all" ON public.zone_density FOR SELECT USING (true);
CREATE POLICY "density writable by ops" ON public.zone_density FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Live state: queue per facility =====
CREATE TABLE public.queue_states (
  facility_id TEXT PRIMARY KEY REFERENCES public.facilities(id) ON DELETE CASCADE,
  arrivals_per_min NUMERIC NOT NULL DEFAULT 0,
  queue_length INT NOT NULL DEFAULT 0,
  wait_minutes NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.queue_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queues readable by all" ON public.queue_states FOR SELECT USING (true);
CREATE POLICY "queues writable by ops" ON public.queue_states FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Match state (single row) =====
CREATE TABLE public.match_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phase TEXT NOT NULL DEFAULT 'pre_game', -- pre_game|first_half|half_time|second_half|full_time
  minute INT NOT NULL DEFAULT 0,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  home_team TEXT NOT NULL DEFAULT 'Home FC',
  away_team TEXT NOT NULL DEFAULT 'Away United',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.match_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match readable by all" ON public.match_state FOR SELECT USING (true);
CREATE POLICY "match writable by ops" ON public.match_state FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Menu items =====
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  category TEXT NOT NULL DEFAULT 'food',
  is_available BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu readable by all" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "menu writable by ops" ON public.menu_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Orders =====
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id TEXT NOT NULL REFERENCES public.facilities(id),
  seat_code TEXT,
  fan_handle TEXT,
  status TEXT NOT NULL DEFAULT 'placed', -- placed|preparing|ready|picked_up|cancelled
  pickup_slot TIMESTAMPTZ,
  total_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders readable by all" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders insertable by anyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders updatable by ops" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  qty INT NOT NULL DEFAULT 1,
  price_cents INT NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items readable by all" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "order_items insertable by anyone" ON public.order_items FOR INSERT WITH CHECK (true);

-- ===== Seat upgrades =====
CREATE TABLE public.seat_upgrade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL REFERENCES public.zones(id),
  seat_code TEXT NOT NULL,
  base_price_cents INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seat_upgrade_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers readable by all" ON public.seat_upgrade_offers FOR SELECT USING (true);
CREATE POLICY "offers writable by ops" ON public.seat_upgrade_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

CREATE TABLE public.seat_upgrade_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.seat_upgrade_offers(id) ON DELETE CASCADE,
  fan_handle TEXT,
  seat_code TEXT,
  bid_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
ALTER TABLE public.seat_upgrade_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bids readable by all" ON public.seat_upgrade_bids FOR SELECT USING (true);
CREATE POLICY "bids insertable by anyone" ON public.seat_upgrade_bids FOR INSERT WITH CHECK (true);

-- ===== Surge forecasts & ops actions =====
CREATE TABLE public.surge_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  horizon_minutes INT NOT NULL, -- 5, 15, 30
  predicted_density NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.7,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.surge_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forecasts readable by all" ON public.surge_forecasts FOR SELECT USING (true);
CREATE POLICY "forecasts writable by ops" ON public.surge_forecasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

CREATE TABLE public.ops_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID REFERENCES public.surge_forecasts(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ops_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions readable by ops" ON public.ops_actions_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff'));
CREATE POLICY "actions insertable by ops" ON public.ops_actions_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Incidents & staff =====
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT REFERENCES public.zones(id),
  kind TEXT NOT NULL, -- medical|security|crowd_crush|other
  severity TEXT NOT NULL DEFAULT 'medium', -- low|medium|high|critical
  status TEXT NOT NULL DEFAULT 'open', -- open|in_progress|resolved
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents readable by all" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "incidents writable by ops" ON public.incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));
CREATE TRIGGER incidents_touch BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'steward', -- steward|medic|security|food
  status TEXT NOT NULL DEFAULT 'available', -- available|dispatched|on_site
  zone_id TEXT REFERENCES public.zones(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff readable by ops" ON public.staff FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff'));
CREATE POLICY "staff writable by ops" ON public.staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

CREATE TABLE public.dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  zone_id TEXT REFERENCES public.zones(id),
  status TEXT NOT NULL DEFAULT 'dispatched', -- dispatched|on_site|cleared
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dispatch_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dispatch readable by ops" ON public.dispatch_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff'));
CREATE POLICY "dispatch writable by ops" ON public.dispatch_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ops_staff')) WITH CHECK (public.has_role(auth.uid(),'ops_staff'));

-- ===== Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_density;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_upgrade_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.surge_forecasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.facilities;

ALTER TABLE public.zone_density REPLICA IDENTITY FULL;
ALTER TABLE public.queue_states REPLICA IDENTITY FULL;
ALTER TABLE public.match_state REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.seat_upgrade_bids REPLICA IDENTITY FULL;
ALTER TABLE public.surge_forecasts REPLICA IDENTITY FULL;
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER TABLE public.facilities REPLICA IDENTITY FULL;

-- ===== Seed: zones (4 stands x 5 sections + concourses) =====
INSERT INTO public.zones (id, name, kind, stand, capacity, svg_x, svg_y, svg_w, svg_h) VALUES
  ('N1','North Lower 1','stand','N',1500, 200, 60, 80, 60),
  ('N2','North Lower 2','stand','N',1500, 290, 60, 80, 60),
  ('N3','North Upper 1','stand','N',1200, 380, 60, 80, 60),
  ('N4','North Upper 2','stand','N',1200, 470, 60, 80, 60),
  ('N5','North Premium','stand','N', 600, 560, 60, 80, 60),
  ('S1','South Lower 1','stand','S',1500, 200, 480, 80, 60),
  ('S2','South Lower 2','stand','S',1500, 290, 480, 80, 60),
  ('S3','South Upper 1','stand','S',1200, 380, 480, 80, 60),
  ('S4','South Upper 2','stand','S',1200, 470, 480, 80, 60),
  ('S5','South Premium','stand','S', 600, 560, 480, 80, 60),
  ('E1','East Lower','stand','E',1800, 660, 150, 80, 90),
  ('E2','East Mid','stand','E',1500, 660, 250, 80, 90),
  ('E3','East Upper','stand','E',1200, 660, 350, 80, 60),
  ('W1','West Lower','stand','W',1800,  80, 150, 80, 90),
  ('W2','West Mid','stand','W',1500,  80, 250, 80, 90),
  ('W3','West Upper','stand','W',1200,  80, 350, 80, 60),
  ('CN','North Concourse','concourse',NULL,2000, 200, 130, 440, 30),
  ('CS','South Concourse','concourse',NULL,2000, 200, 440, 440, 30),
  ('CE','East Concourse','concourse',NULL,1500, 750, 150, 30, 290),
  ('CW','West Concourse','concourse',NULL,1500,  20, 150, 30, 290);

-- Seed zone_density for each zone
INSERT INTO public.zone_density (zone_id, density, head_count)
  SELECT id, 0.1, (capacity * 0.1)::int FROM public.zones;

-- ===== Seed: facilities =====
-- 8 gates
INSERT INTO public.facilities (id, zone_id, kind, name, servers, service_rate, svg_x, svg_y) VALUES
  ('G1','CN','gate','Gate A',2,40,220,135),
  ('G2','CN','gate','Gate B',2,40,330,135),
  ('G3','CN','gate','Gate C',2,40,440,135),
  ('G4','CN','gate','Gate D',2,40,550,135),
  ('G5','CS','gate','Gate E',2,40,220,455),
  ('G6','CS','gate','Gate F',2,40,330,455),
  ('G7','CS','gate','Gate G',2,40,440,455),
  ('G8','CS','gate','Gate H',2,40,550,455),
  -- 12 stalls
  ('F1','CN','stall','North Burgers',2,8,250,140),
  ('F2','CN','stall','North Pizza',2,8,360,140),
  ('F3','CN','stall','North Drinks',3,12,470,140),
  ('F4','CS','stall','South BBQ',2,8,250,460),
  ('F5','CS','stall','South Tacos',2,8,360,460),
  ('F6','CS','stall','South Beer',3,12,470,460),
  ('F7','CE','stall','East Snacks',2,8,755,180),
  ('F8','CE','stall','East Coffee',2,10,755,280),
  ('F9','CE','stall','East Hot Dogs',2,8,755,380),
  ('F10','CW','stall','West Snacks',2,8, 25,180),
  ('F11','CW','stall','West Coffee',2,10, 25,280),
  ('F12','CW','stall','West Hot Dogs',2,8, 25,380),
  -- 6 restrooms
  ('R1','CN','restroom','North Restroom 1',4,20,290,140),
  ('R2','CN','restroom','North Restroom 2',4,20,510,140),
  ('R3','CS','restroom','South Restroom 1',4,20,290,460),
  ('R4','CS','restroom','South Restroom 2',4,20,510,460),
  ('R5','CE','restroom','East Restroom',4,20,755,230),
  ('R6','CW','restroom','West Restroom',4,20, 25,230),
  -- 4 merch
  ('M1','CN','merch','North Merch',1,4,400,140),
  ('M2','CS','merch','South Merch',1,4,400,460),
  ('M3','CE','merch','East Merch',1,4,755,330),
  ('M4','CW','merch','West Merch',1,4, 25,330);

INSERT INTO public.queue_states (facility_id) SELECT id FROM public.facilities;

-- Seed match_state
INSERT INTO public.match_state (id, phase, minute) VALUES (1, 'pre_game', 0);

-- Seed menu_items (a few per stall)
INSERT INTO public.menu_items (facility_id, name, price_cents, category)
SELECT f.id, m.name, m.price, m.cat FROM public.facilities f
CROSS JOIN (VALUES
  ('Classic Burger', 1200, 'food'),
  ('Loaded Fries', 700, 'food'),
  ('Soft Drink', 400, 'drink'),
  ('Beer', 800, 'drink')
) AS m(name, price, cat)
WHERE f.kind = 'stall';

-- Seed seat upgrade offers (premium zones)
INSERT INTO public.seat_upgrade_offers (zone_id, seat_code, base_price_cents) VALUES
  ('N5','N5-A12',4500),
  ('N5','N5-B07',4500),
  ('S5','S5-C03',4800),
  ('S5','S5-D11',4800),
  ('E1','E1-F22',3500),
  ('W1','W1-A05',3500);

-- Seed staff
INSERT INTO public.staff (name, role, zone_id) VALUES
  ('Alex Chen','steward','CN'),
  ('Maria Lopez','medic','CS'),
  ('Sam Patel','security','CE'),
  ('Jordan Kim','steward','CW'),
  ('Rita Singh','food','CN'),
  ('Tom Becker','security','CS'),
  ('Nina Park','medic','CE'),
  ('Leo Garcia','steward','CW');
