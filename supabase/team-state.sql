create table if not exists public.team_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  money integer not null default 0 check (money >= 0),
  players jsonb not null default '[]'::jsonb,
  level_up_count integer not null default 0 check (level_up_count between 0 and 25),
  updated_at timestamptz not null default now()
);

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
