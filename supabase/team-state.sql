create table if not exists public.team_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  money integer not null default 300,
  players jsonb not null default '[]'::jsonb,
  level_up_count integer not null default 0 check (level_up_count between 0 and 25),
  has_claimed_budget_bonus boolean not null default false,
  budget_bonus_active boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.team_state
  alter column money set default 300;

alter table public.team_state
  drop constraint if exists team_state_money_check;

alter table public.team_state
  add column if not exists has_claimed_budget_bonus boolean not null default false;

alter table public.team_state
  add column if not exists budget_bonus_active boolean not null default false;

update public.team_state
set money = 300
where money = 0
  and players = '[]'::jsonb;

alter table public.team_state
  add column if not exists level_up_count integer not null default 0
  check (level_up_count between 0 and 25);

alter table public.team_state enable row level security;

drop policy if exists "Users can read their own team" on public.team_state;
create policy "Users can read their own team"
  on public.team_state for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own team" on public.team_state;
create policy "Users can create their own team"
  on public.team_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own team" on public.team_state;
create policy "Users can update their own team"
  on public.team_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own team" on public.team_state;
create policy "Users can delete their own team"
  on public.team_state for delete
  using (auth.uid() = user_id);
