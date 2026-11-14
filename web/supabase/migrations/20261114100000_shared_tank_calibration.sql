create table if not exists public.configuracion_tanque (
  id text primary key check (id = 'tanque01'),
  distancia_vacio numeric not null,
  distancia_lleno numeric not null,
  updated_at timestamptz not null default now(),
  constraint configuracion_tanque_distancias_validas
    check (distancia_vacio > distancia_lleno and distancia_lleno >= 0)
);

alter table public.configuracion_tanque enable row level security;

grant select, insert, update on public.configuracion_tanque to anon, authenticated;

drop policy if exists "Public can read tank calibration" on public.configuracion_tanque;
create policy "Public can read tank calibration"
  on public.configuracion_tanque for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can create tank calibration" on public.configuracion_tanque;
create policy "Public can create tank calibration"
  on public.configuracion_tanque for insert
  to anon, authenticated
  with check (id = 'tanque01');

drop policy if exists "Public can update tank calibration" on public.configuracion_tanque;
create policy "Public can update tank calibration"
  on public.configuracion_tanque for update
  to anon, authenticated
  using (id = 'tanque01')
  with check (id = 'tanque01');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'configuracion_tanque'
  ) then
    alter publication supabase_realtime add table public.configuracion_tanque;
  end if;
end
$$;
