create table if not exists public.service_desks (
  id text primary key,
  name text not null,
  purpose text,
  samples text[] default array[]::text[],
  owner_email text,
  owning_team text,
  ai_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.service_desks is 'Stores service desk configuration used by the application UI.';
comment on column public.service_desks.samples is 'Example requests that help describe the desk''s purpose.';

create index if not exists service_desks_name_idx on public.service_desks using btree (lower(name));
