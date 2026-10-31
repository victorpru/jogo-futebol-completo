create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  wins integer not null default 1 check (wins >= 0),
  created_at timestamptz not null default now()
);

alter table public.winners enable row level security;

drop policy if exists "Authenticated users can read winners" on public.winners;
create policy "Authenticated users can read winners"
  on public.winners for select
  to authenticated
  using (true);

drop policy if exists "Only the administrator can insert winners" on public.winners;
create policy "Only the administrator can insert winners"
  on public.winners for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'prudencio.vic@gmail.com');

drop policy if exists "Only the administrator can update winners" on public.winners;
create policy "Only the administrator can update winners"
  on public.winners for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'prudencio.vic@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'prudencio.vic@gmail.com');

drop policy if exists "Only the administrator can delete winners" on public.winners;
create policy "Only the administrator can delete winners"
  on public.winners for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'prudencio.vic@gmail.com');
