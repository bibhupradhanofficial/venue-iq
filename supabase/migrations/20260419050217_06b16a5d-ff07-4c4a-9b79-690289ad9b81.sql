create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 500),
  sender_handle text not null check (char_length(sender_handle) between 1 and 64),
  sender_role text not null check (sender_role in ('fan','ops')),
  seat_code text,
  zone_id text,
  created_at timestamptz not null default now()
);

create index chat_messages_created_at_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

create policy "chat readable by all"
  on public.chat_messages for select
  using (true);

create policy "fans can post fan messages"
  on public.chat_messages for insert
  to anon, authenticated
  with check (sender_role = 'fan');

create policy "ops can post ops messages"
  on public.chat_messages for insert
  to authenticated
  with check (sender_role = 'ops' and public.has_role(auth.uid(), 'ops_staff'));

alter publication supabase_realtime add table public.chat_messages;
alter table public.chat_messages replica identity full;