-- create_test_users.sql
--
-- Idempotent SQL script that provisions deterministic Supabase accounts for
-- exercising the RLS policies defined in supabase/migrations/0001_auth_rbac.sql.
-- Run this from the Supabase SQL Editor or via the CLI with a service role key.

do $$
declare
  global_hq_id uuid;
  acme_corp_id uuid;
  superuser_id uuid;
  admin_id uuid;
  member_id uuid;
begin
  insert into public.organisations (name)
    values ('Global HQ')
    on conflict (name) do update set name = excluded.name
    returning id into global_hq_id;

  insert into public.organisations (name)
    values ('Acme Corp')
    on conflict (name) do update set name = excluded.name
    returning id into acme_corp_id;

  -- Superuser account -------------------------------------------------------
  select id into superuser_id from auth.users where email = 'superuser@example.com';
  if superuser_id is not null then
    perform auth.delete_user(superuser_id);
  end if;

  select (auth.create_user(
    email := 'superuser@example.com',
    password := 'SuperUser#123',
    email_confirm := true,
    raw_app_meta_data := jsonb_build_object('role', 'superuser', 'org_id', global_hq_id),
    raw_user_meta_data := jsonb_build_object('full_name', 'Test Superuser')
  )).id
  into superuser_id;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', 'superuser', 'org_id', global_hq_id)
  where id = superuser_id;

  -- Admin account -----------------------------------------------------------
  select id into admin_id from auth.users where email = 'admin@example.com';
  if admin_id is not null then
    perform auth.delete_user(admin_id);
  end if;

  select (auth.create_user(
    email := 'admin@example.com',
    password := 'Admin#123',
    email_confirm := true,
    raw_app_meta_data := jsonb_build_object('role', 'admin', 'org_id', acme_corp_id),
    raw_user_meta_data := jsonb_build_object('full_name', 'Test Admin')
  )).id
  into admin_id;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', 'admin', 'org_id', acme_corp_id)
  where id = admin_id;

  -- Regular member account --------------------------------------------------
  select id into member_id from auth.users where email = 'user@example.com';
  if member_id is not null then
    perform auth.delete_user(member_id);
  end if;

  select (auth.create_user(
    email := 'user@example.com',
    password := 'User#1234',
    email_confirm := true,
    raw_app_meta_data := jsonb_build_object('role', 'user', 'org_id', acme_corp_id),
    raw_user_meta_data := jsonb_build_object('full_name', 'Test User')
  )).id
  into member_id;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', 'user', 'org_id', acme_corp_id)
  where id = member_id;
end;
$$;
