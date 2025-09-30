-- Adds missing ticket columns accessed by the application UI and backfills submitted_at
-- so that ordering logic on existing data remains consistent.

alter table public.tickets
  add column if not exists submitted_at timestamptz,
  add column if not exists sla_due_at timestamptz,
  add column if not exists linked_process_id uuid,
  add column if not exists requested_by text;

update public.tickets
set submitted_at = created_at
where submitted_at is null;
