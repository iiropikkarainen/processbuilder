-- 0001_auth_rbac.sql
-- Migration to set up organisations/processes tables with RBAC-aware RLS policies.

-- Enable required extensions.
create extension if not exists "pgcrypto";

-- Organisations table keeps a canonical list of tenants.
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text generated always as (lower(regexp_replace(name, '[^a-z0-9]+', '-', 'g'))) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.organisations is 'Tenants that Supabase roles and policies reference.';

-- Processes belong to an organisation.
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.processes is 'Sample table showing per-organisation access control.';

-- Automatically manage updated_at timestamps.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists organisations_set_updated_at on public.organisations;
create trigger organisations_set_updated_at
before update on public.organisations
for each row
execute function public.set_updated_at();

drop trigger if exists processes_set_updated_at on public.processes;
create trigger processes_set_updated_at
before update on public.processes
for each row
execute function public.set_updated_at();

-- Enable RLS so that policies apply.
alter table public.organisations enable row level security;
alter table public.processes enable row level security;

-- Convenience helper expressions reused in policies are expressed inline.
-- JWT claims are expected under auth.jwt()->'app_metadata'.

drop policy if exists organisations_superuser_manage_all on public.organisations;
create policy organisations_superuser_manage_all
on public.organisations
for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superuser')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superuser');

drop policy if exists processes_superuser_manage_all on public.processes;
create policy processes_superuser_manage_all
on public.processes
for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superuser')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superuser');

-- Admins may view and update their own organisation entry.
drop policy if exists organisations_admin_read on public.organisations;
create policy organisations_admin_read
on public.organisations
for select
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'user')
  and id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
);

drop policy if exists organisations_admin_update on public.organisations;
create policy organisations_admin_update
on public.organisations
for update
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
);

-- Only superusers can create or delete organisations.
drop policy if exists organisations_superuser_create on public.organisations;
create policy organisations_superuser_create
on public.organisations
for insert
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superuser');

drop policy if exists organisations_superuser_delete on public.organisations;
create policy organisations_superuser_delete
on public.organisations
for delete
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'superuser');

-- Admins can fully manage processes tied to their organisation.
drop policy if exists processes_admin_manage_org on public.processes;
create policy processes_admin_manage_org
on public.processes
for all
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
);

-- Users can read/write (but not delete) processes in their own organisation only.
drop policy if exists processes_user_select_own_org on public.processes;
create policy processes_user_select_own_org
on public.processes
for select
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'user'
  and org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
);

drop policy if exists processes_user_insert_own_org on public.processes;
create policy processes_user_insert_own_org
on public.processes
for insert
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'user'
  and org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
);

drop policy if exists processes_user_update_own_org on public.processes;
create policy processes_user_update_own_org
on public.processes
for update
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'user'
  and org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'user'
  and org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id'))::uuid
);

