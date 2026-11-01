create table if not exists public.item_draw_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level_up_total integer not null default 0 check (level_up_total between 0 and 25),
  level_up_remaining jsonb not null default '[]'::jsonb,
  blue_remaining jsonb not null default '[]'::jsonb,
  yellow_remaining jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.item_draw_state enable row level security;

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
