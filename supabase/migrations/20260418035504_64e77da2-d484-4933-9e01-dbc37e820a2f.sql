create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  minute int not null default 0,
  team text,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.match_events enable row level security;

create policy "events readable by all"
  on public.match_events for select
  using (true);

create policy "events writable by ops"
  on public.match_events for all
  to authenticated
  using (public.has_role(auth.uid(), 'ops_staff'::public.app_role))
  with check (public.has_role(auth.uid(), 'ops_staff'::public.app_role));

alter publication supabase_realtime add table public.match_events;

create index match_events_created_at_idx on public.match_events (created_at desc);