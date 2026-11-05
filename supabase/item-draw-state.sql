create table if not exists public.item_draw_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level_up_total integer not null default 0 check (level_up_total between 0 and 25),
  level_up_remaining jsonb not null default '[]'::jsonb,
  blue_remaining jsonb not null default '[]'::jsonb,
  yellow_remaining jsonb not null default '[]'::jsonb,
  sponsorship_money_claimed integer not null default 0 check (sponsorship_money_claimed >= 0),
  updated_at timestamptz not null default now()
);

alter table public.item_draw_state
  add column if not exists sponsorship_money_claimed integer not null default 0
  check (sponsorship_money_claimed >= 0);

create table if not exists public.item_sponsor_draw (
  sponsor_type text not null check (sponsor_type in ('blue', 'yellow')),
  sponsor_index integer not null check (sponsor_index >= 0),
  value integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  drawn_at timestamptz not null default now(),
  primary key (sponsor_type, sponsor_index)
);

create table if not exists public.npc_draw_participants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text,
  created_at timestamptz not null default now()
);

alter table public.npc_draw_participants
  alter column color drop not null;

alter table public.npc_draw_participants enable row level security;

drop policy if exists "Authenticated users can read draw participants" on public.npc_draw_participants;
create policy "Authenticated users can read draw participants"
  on public.npc_draw_participants for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add draw participants" on public.npc_draw_participants;
create policy "Authenticated users can add draw participants"
  on public.npc_draw_participants for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can remove draw participants" on public.npc_draw_participants;
create policy "Authenticated users can remove draw participants"
  on public.npc_draw_participants for delete
  to authenticated
  using (true);

with duplicated_sponsor_draws as (
  select
    ctid,
    row_number() over (
      partition by user_id, sponsor_type
      order by drawn_at desc, ctid desc
    ) as row_number
  from public.item_sponsor_draw
)
delete from public.item_sponsor_draw
where ctid in (
  select ctid
  from duplicated_sponsor_draws
  where row_number > 1
);

create unique index if not exists item_sponsor_draw_one_per_user_type
  on public.item_sponsor_draw (user_id, sponsor_type);

alter table public.item_draw_state enable row level security;
alter table public.item_sponsor_draw enable row level security;

drop policy if exists "Users can read their own item draws" on public.item_draw_state;
create policy "Users can read their own item draws"
  on public.item_draw_state for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own item draws" on public.item_draw_state;
create policy "Users can create their own item draws"
  on public.item_draw_state for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own item draws" on public.item_draw_state;
create policy "Users can update their own item draws"
  on public.item_draw_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own item draws" on public.item_draw_state;
create policy "Users can delete their own item draws"
  on public.item_draw_state for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read sponsor draws" on public.item_sponsor_draw;
create policy "Users can read sponsor draws"
  on public.item_sponsor_draw for select
  to authenticated
  using (true);

drop policy if exists "Users can create sponsor draws" on public.item_sponsor_draw;
create policy "Users can create sponsor draws"
  on public.item_sponsor_draw for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their sponsor draws" on public.item_sponsor_draw;
create policy "Users can delete their sponsor draws"
  on public.item_sponsor_draw for delete
  to authenticated
  using (auth.uid() = user_id);
