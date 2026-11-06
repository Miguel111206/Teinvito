-- =====================================================================
-- 003 · Registro abierto: cualquier usuario autenticado puede usar el panel
-- Cada usuario solo accede a SUS invitaciones, envíos, sesiones y archivos:
-- las políticas ya filtran por owner_id = auth.uid() (y por carpeta en Storage).
-- Ejecutar después de 001 y 002.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

-- Ya no se usa lista blanca; la tabla se conserva por compatibilidad (puede borrarse).
comment on table public.admin_users is 'En desuso: el registro es abierto y el aislamiento es por owner_id (RLS).';
