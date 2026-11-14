-- Wiseit v0.2 · Esquema inicial (CONTEXT.md §3)
-- profiles · roadmaps · nodes, con RLS restringido al dueño y trigger de alta de perfil.

-- ─── Tipos ────────────────────────────────────────────────────────────────────
create type public.difficulty_level as enum ('Básico', 'Intermedio', 'Avanzado');

-- ─── Tablas ───────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create table public.roadmaps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  topic      text not null check (char_length(topic) between 2 and 200),
  title      text not null check (char_length(title) between 1 and 200),
  created_at timestamptz not null default now()
);

create table public.nodes (
  id          uuid primary key default gen_random_uuid(),
  roadmap_id  uuid not null references public.roadmaps (id) on delete cascade,
  -- Escalabilidad a grafos: nodo padre opcional (mismo roadmap) + metadatos visuales.
  parent_id   uuid,
  title       text not null check (char_length(title) between 1 and 200),
  description text not null,
  difficulty  public.difficulty_level not null,
  order_index integer not null check (order_index >= 0),
  metadata    jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at  timestamptz not null default now(),
  constraint nodes_roadmap_order_key unique (roadmap_id, order_index),
  constraint nodes_roadmap_id_id_key unique (roadmap_id, id),
  -- FK compuesta: el padre DEBE pertenecer al mismo roadmap.
  constraint nodes_parent_same_roadmap_fkey
    foreign key (roadmap_id, parent_id) references public.nodes (roadmap_id, id)
    on delete set null (parent_id),
  constraint nodes_not_self_parent check (parent_id is null or parent_id <> id)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
-- Listado "Mis Rutas" (filtra por usuario, ordena por fecha) y política RLS de roadmaps.
create index roadmaps_user_id_created_at_idx on public.roadmaps (user_id, created_at desc);
-- nodes(roadmap_id) ya está cubierto por el índice único (roadmap_id, order_index).
create index nodes_parent_id_idx on public.nodes (parent_id) where parent_id is not null;

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.nodes    enable row level security;

-- Defensa en profundidad: el rol anónimo no tiene ningún privilegio sobre estas tablas.
revoke all on public.profiles, public.roadmaps, public.nodes from anon;

-- profiles: solo lectura del propio perfil. Lo crea el trigger, nunca el cliente.
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- roadmaps: CRUD restringido al dueño. `(select auth.uid())` se evalúa una vez por query.
create policy roadmaps_select_own on public.roadmaps
  for select to authenticated using ((select auth.uid()) = user_id);
create policy roadmaps_insert_own on public.roadmaps
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy roadmaps_update_own on public.roadmaps
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy roadmaps_delete_own on public.roadmaps
  for delete to authenticated using ((select auth.uid()) = user_id);

-- nodes: no tiene user_id; la pertenencia se resuelve vía el roadmap padre.
create function public.owns_roadmap(target_roadmap_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.roadmaps r
    where r.id = target_roadmap_id and r.user_id = (select auth.uid())
  );
$$;

create policy nodes_select_own on public.nodes
  for select to authenticated using (public.owns_roadmap(roadmap_id));
create policy nodes_insert_own on public.nodes
  for insert to authenticated with check (public.owns_roadmap(roadmap_id));
create policy nodes_update_own on public.nodes
  for update to authenticated
  using (public.owns_roadmap(roadmap_id)) with check (public.owns_roadmap(roadmap_id));
create policy nodes_delete_own on public.nodes
  for delete to authenticated using (public.owns_roadmap(roadmap_id));

-- ─── Trigger: alta automática de profiles ─────────────────────────────────────
-- SECURITY DEFINER para poder escribir en profiles saltando RLS; search_path vacío
-- y nombres totalmente calificados para evitar secuestro de objetos.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
