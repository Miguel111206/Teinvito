-- =====================================================================
-- 002 · RLS, funciones públicas (RPC) y almacenamiento
-- =====================================================================

alter table public.admin_users        enable row level security;
alter table public.invitations        enable row level security;
alter table public.invitation_versions enable row level security;
alter table public.invitation_sends   enable row level security;
alter table public.invite_sessions    enable row level security;
alter table public.invite_answers     enable row level security;

-- admin_users: cada admin solo puede ver su propia fila (se inserta desde el SQL Editor).
drop policy if exists admin_users_self on public.admin_users;
create policy admin_users_self on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- invitations: solo el administrador propietario
drop policy if exists inv_owner_all on public.invitations;
create policy inv_owner_all on public.invitations
  for all to authenticated
  using (public.is_admin() and owner_id = auth.uid())
  with check (public.is_admin() and owner_id = auth.uid());

-- versiones: solo lectura/inserción del propietario de la invitación
drop policy if exists ver_owner_select on public.invitation_versions;
create policy ver_owner_select on public.invitation_versions
  for select to authenticated
  using (public.is_admin() and exists (
    select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));
drop policy if exists ver_owner_insert on public.invitation_versions;
create policy ver_owner_insert on public.invitation_versions
  for insert to authenticated
  with check (public.is_admin() and exists (
    select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- envíos registrados
drop policy if exists send_owner_all on public.invitation_sends;
create policy send_owner_all on public.invitation_sends
  for all to authenticated
  using (public.is_admin() and owner_id = auth.uid())
  with check (public.is_admin() and owner_id = auth.uid()
    and exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- sesiones y respuestas: el admin propietario solo lee y borra. Nadie escribe directo: todo va por RPC.
drop policy if exists ses_owner_select on public.invite_sessions;
create policy ses_owner_select on public.invite_sessions
  for select to authenticated
  using (public.is_admin() and exists (
    select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));
drop policy if exists ans_owner_select on public.invite_answers;
create policy ans_owner_select on public.invite_answers
  for select to authenticated
  using (public.is_admin() and exists (
    select 1 from public.invite_sessions s join public.invitations i on i.id = s.invitation_id
    where s.id = session_id and i.owner_id = auth.uid()));

-- anon no tiene acceso directo a ninguna tabla
revoke all on all tables in schema public from anon;
grant select on public.invitation_overview to authenticated;

-- ---------------------------------------------------------------------
-- RPCs públicas (security definer, con validación y límites)
-- ---------------------------------------------------------------------

-- Estado de la sesión + configuración de SU versión + SUS respuestas
create or replace function public._session_payload(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare s record; inv record; cfg jsonb; ans jsonb;
begin
  select * into s from invite_sessions where id = p_session;
  if not found then return jsonb_build_object('state','not_found'); end if;
  select * into inv from invitations where id = s.invitation_id;
  if inv.publication_status <> 'published' then
    return jsonb_build_object('state','disabled');
  end if;
  select config into cfg from invitation_versions where id = s.version_id;
  select coalesce(jsonb_agg(jsonb_build_object(
      'step_id', a.step_id, 'answer', a.answer, 'answered_at', a.answered_at)), '[]'::jsonb)
    into ans from invite_answers a where a.session_id = p_session;
  return jsonb_build_object(
    'state','ok','session_id', s.id, 'version_id', s.version_id, 'config', cfg,
    'started', s.started_at is not null, 'confirmed', s.confirmed_at is not null,
    'answers', ans);
end $$;

-- Consulta pública de una invitación (sin crear sesión; no registra apertura)
create or replace function public.get_public_invitation(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare inv record; cfg jsonb;
begin
  if p_token is null or char_length(p_token) > 64 then
    return jsonb_build_object('state','not_found');
  end if;
  select * into inv from invitations where token = p_token;
  if not found or inv.publication_status in ('draft','archived') or inv.published_version_id is null then
    return jsonb_build_object('state','not_found');
  end if;
  if inv.publication_status = 'disabled' then
    return jsonb_build_object('state','disabled');
  end if;
  select config into cfg from invitation_versions where id = inv.published_version_id;
  return jsonb_build_object('state','ok','version_id', inv.published_version_id, 'config', cfg);
end $$;

-- Crea una sesión anclada a la versión publicada actual y registra la apertura
create or replace function public.start_invite_session(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare inv record; sid uuid;
begin
  select * into inv from invitations where token = p_token;
  if not found or inv.publication_status in ('draft','archived') or inv.published_version_id is null then
    return jsonb_build_object('state','not_found');
  end if;
  if inv.publication_status = 'disabled' then
    return jsonb_build_object('state','disabled');
  end if;
  -- límite anti-abuso: máx. 120 sesiones nuevas por invitación por hora
  if (select count(*) from invite_sessions
        where invitation_id = inv.id and created_at > now() - interval '1 hour') >= 120 then
    return jsonb_build_object('state','rate_limited');
  end if;
  insert into invite_sessions(invitation_id, version_id)
    values (inv.id, inv.published_version_id) returning id into sid;
  update invitations
     set first_opened_at = coalesce(first_opened_at, now()), last_opened_at = now()
   where id = inv.id;
  return public._session_payload(sid);
end $$;

-- Retomar sesión (mismo navegador). La sesión conserva SU versión aunque se publique otra.
create or replace function public.resume_invite_session(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare r jsonb;
begin
  r := public._session_payload(p_session);
  if r->>'state' = 'ok' then
    update invite_sessions set last_activity_at = now() where id = p_session;
    update invitations set last_opened_at = now()
      where id = (select invitation_id from invite_sessions where id = p_session);
  end if;
  return r;
end $$;

-- "Sí" inicial: marca inicio del recorrido (idempotente)
create or replace function public.mark_session_started(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  update invite_sessions
     set started_at = coalesce(started_at, now()), last_activity_at = now()
   where id = p_session
     and exists (select 1 from invitations i where i.id = invitation_id and i.publication_status = 'published');
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Guardar/actualizar la respuesta de un paso (upsert idempotente)
create or replace function public.save_answer(
  p_session uuid, p_step_id text, p_step_type text, p_question text, p_answer jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare s record; cfg jsonb; found_step boolean;
begin
  if p_step_id is null or char_length(p_step_id) > 64 then return jsonb_build_object('ok', false, 'error','invalid'); end if;
  if p_answer is null or char_length(p_answer::text) > 6000 then return jsonb_build_object('ok', false, 'error','too_large'); end if;
  select * into s from invite_sessions where id = p_session;
  if not found then return jsonb_build_object('ok', false, 'error','not_found'); end if;
  if not exists (select 1 from invitations i where i.id = s.invitation_id and i.publication_status = 'published') then
    return jsonb_build_object('ok', false, 'error','disabled');
  end if;
  if s.confirmed_at is not null then return jsonb_build_object('ok', false, 'error','already_confirmed'); end if;
  select config into cfg from invitation_versions where id = s.version_id;
  select exists (select 1 from jsonb_array_elements(cfg->'steps') e where e->>'id' = p_step_id) into found_step;
  if not found_step then return jsonb_build_object('ok', false, 'error','unknown_step'); end if;
  if (select count(*) from invite_answers where session_id = p_session) >= 100
     and not exists (select 1 from invite_answers where session_id = p_session and step_id = p_step_id) then
    return jsonb_build_object('ok', false, 'error','limit');
  end if;
  insert into invite_answers(session_id, step_id, step_type, question_text, answer)
    values (p_session, p_step_id, left(coalesce(p_step_type,''), 40), left(coalesce(p_question,''), 600), p_answer)
  on conflict (session_id, step_id)
  do update set answer = excluded.answer, question_text = excluded.question_text,
                step_type = excluded.step_type, updated_at = now();
  update invite_sessions set started_at = coalesce(started_at, now()), last_activity_at = now() where id = p_session;
  return jsonb_build_object('ok', true);
end $$;

-- Confirmación final: exige que los pasos obligatorios visibles tengan respuesta
create or replace function public.confirm_session(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare s record; cfg jsonb; missing text;
begin
  select * into s from invite_sessions where id = p_session;
  if not found then return jsonb_build_object('ok', false, 'error','not_found'); end if;
  if not exists (select 1 from invitations i where i.id = s.invitation_id and i.publication_status = 'published') then
    return jsonb_build_object('ok', false, 'error','disabled');
  end if;
  if s.confirmed_at is not null then return jsonb_build_object('ok', true, 'already', true); end if;
  select config into cfg from invitation_versions where id = s.version_id;
  select e->>'id' into missing
    from jsonb_array_elements(cfg->'steps') e
   where coalesce((e->>'hidden')::boolean, false) = false
     and coalesce((e->>'required')::boolean, false) = true
     and e->>'type' in ('single_choice','multi_choice','cards','datetime','text','question_buttons')
     and not exists (select 1 from invite_answers a where a.session_id = p_session and a.step_id = e->>'id')
   limit 1;
  if missing is not null then
    return jsonb_build_object('ok', false, 'error','missing_required', 'step_id', missing);
  end if;
  update invite_sessions set confirmed_at = now(), started_at = coalesce(started_at, now()), last_activity_at = now()
   where id = p_session;
  return jsonb_build_object('ok', true);
end $$;

-- Salud ligera para keep alive / comprobación de disponibilidad (no expone datos)
create or replace function public.health_check()
returns jsonb
language sql security definer set search_path = public
as $$ select jsonb_build_object('ok', true, 'at', now()); $$;

revoke all on function public._session_payload(uuid) from public, anon, authenticated;
grant execute on function public.get_public_invitation(text)  to anon, authenticated;
grant execute on function public.start_invite_session(text)   to anon, authenticated;
grant execute on function public.resume_invite_session(uuid)  to anon, authenticated;
grant execute on function public.mark_session_started(uuid)   to anon, authenticated;
grant execute on function public.save_answer(uuid,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.confirm_session(uuid)        to anon, authenticated;
grant execute on function public.health_check()               to anon, authenticated;

-- ---------------------------------------------------------------------
-- Almacenamiento: bucket público de lectura (los invitados deben ver fotos/audio),
-- escritura solo para administradores y solo bajo su propia carpeta.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitation-media', 'invitation-media', true, 15728640,
  array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm','audio/x-m4a'])
on conflict (id) do update set public = true, file_size_limit = 15728640,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'invitation-media' and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'invitation-media' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'invitation-media' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
-- Lectura pública de objetos del bucket (necesaria para URLs públicas)
drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'invitation-media');
