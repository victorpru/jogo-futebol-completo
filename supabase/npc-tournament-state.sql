create table if not exists public.npc_tournament_global_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.npc_tournament_global_state enable row level security;

drop policy if exists "Authenticated users can read NPC tournaments" on public.npc_tournament_global_state;
drop policy if exists "Authenticated users can create NPC tournaments" on public.npc_tournament_global_state;
drop policy if exists "Authenticated users can update NPC tournaments" on public.npc_tournament_global_state;
drop policy if exists "Authenticated users can delete NPC tournaments" on public.npc_tournament_global_state;

create policy "Authenticated users can read NPC tournaments"
  on public.npc_tournament_global_state for select
  to authenticated
  using (true);

create policy "Authenticated users can create NPC tournaments"
  on public.npc_tournament_global_state for insert
  to authenticated
  with check (id = 'global');

create policy "Authenticated users can update NPC tournaments"
  on public.npc_tournament_global_state for update
  to authenticated
  using (id = 'global')
  with check (id = 'global');

create policy "Authenticated users can delete NPC tournaments"
  on public.npc_tournament_global_state for delete
  to authenticated
  using (id = 'global');
