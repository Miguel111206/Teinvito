-- =====================================================================
-- 001 · Modelo de datos
-- Ejecutar en Supabase > SQL Editor (o con supabase db push).
-- =====================================================================
create extension if not exists pgcrypto;

-- Lista blanca de administradores. Solo quien esté aquí puede usar el panel,
-- aunque alguien lograra crear una cuenta en Auth.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- Invitaciones (cada una con su token y respuestas propias)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  internal_name text not null check (char_length(internal_name) between 1 and 120),
  recipient_name text not null default '' check (char_length(recipient_name) <= 120),
  token text not null unique default encode(gen_random_bytes(12), 'hex'),
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','disabled','archived')),
  draft_config jsonb not null,
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz
);
create index if not exists invitations_owner_idx on public.invitations(owner_id, created_at desc);

-- Versiones publicadas (instantáneas inmutables de la configuración)
create table if not exists public.invitation_versions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  version_number int not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  unique (invitation_id, version_number)
);

alter table public.invitations
  drop constraint if exists invitations_published_version_fk;
alter table public.invitations
  add constraint invitations_published_version_fk
  foreign key (published_version_id) references public.invitation_versions(id) on delete set null;

-- Envíos registrados MANUALMENTE por el administrador ("Marcar como enviada").
-- No prueba entrega ni lectura: solo que el administrador afirma haberla enviado.
create table if not exists public.invitation_sends (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','instagram','telegram','sms','email','en_persona','otro')),
  note text check (char_length(note) <= 500),
  sent_at timestamptz not null default now(),
  confirmed_by_admin boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists sends_invitation_idx on public.invitation_sends(invitation_id, sent_at desc);

-- Sesiones de invitados (sin cuenta). El id es un UUID aleatorio que actúa como secreto
-- de la sesión: solo quien lo conoce puede leer/escribir su propio progreso.
create table if not exists public.invite_sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  version_id uuid not null references public.invitation_versions(id) on delete cascade,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  last_activity_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists sessions_invitation_idx on public.invite_sessions(invitation_id, created_at desc);

-- Respuestas por paso. step_id se conserva y se guarda una copia del texto mostrado
-- (pregunta y opciones) para que sigan siendo comprensibles si luego se edita la invitación.
create table if not exists public.invite_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.invite_sessions(id) on delete cascade,
  step_id text not null,
  step_type text not null,
  question_text text not null default '',
  answer jsonb not null,
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, step_id)
);

-- Vista de resumen para el panel (respeta RLS del usuario que consulta)
create or replace view public.invitation_overview
with (security_invoker = true) as
select
  i.id, i.owner_id, i.internal_name, i.recipient_name, i.token,
  i.publication_status, i.created_at, i.published_at, i.updated_at,
  i.first_opened_at, i.last_opened_at, i.published_version_id,
  (select max(s.sent_at) from public.invitation_sends s where s.invitation_id = i.id) as last_sent_at,
  (select s.channel from public.invitation_sends s where s.invitation_id = i.id order by s.sent_at desc limit 1) as last_channel,
  (select count(*) from public.invitation_sends s where s.invitation_id = i.id) as sends_count,
  (select count(*) from public.invite_sessions x where x.invitation_id = i.id) as sessions_count,
  (select count(*) from public.invite_sessions x where x.invitation_id = i.id and x.started_at is not null) as started_count,
  (select max(x.confirmed_at) from public.invite_sessions x where x.invitation_id = i.id) as confirmed_at,
  (select count(*) from public.invite_answers a join public.invite_sessions x on x.id = a.session_id where x.invitation_id = i.id) as answers_count
from public.invitations i;
