# Supabase authentication and RBAC quick-start

This guide explains how to prepare your Supabase project so that Google and Email + Password authentication is enabled, roles/org memberships are stored in `auth.users.app_metadata`, and JWT claims can be used from both your frontend and Row Level Security (RLS) policies.

## 1. Enable authentication providers

1. Open the Supabase dashboard for your project.
2. Navigate to **Authentication → Providers**.
3. Enable **Email** provider. This enables password-based sign-ups/logins.
4. Enable **Google** provider and supply the OAuth Client ID/Secret generated from the Google Cloud Console.
5. Save the provider configuration.

These steps ensure users can sign up with either email/password or Google. Supabase will include any `app_metadata` and `user_metadata` fields you set on the user inside the access token (JWT) that your frontend receives.

## 2. Apply the database migration

Run the SQL in `supabase/migrations/0001_auth_rbac.sql` against your project (via the Supabase SQL editor or `supabase db push`). If you have not already linked the CLI, run `supabase link --project-ref <your-project-ref>` from the repository root so future pushes reuse the connection. The migration creates:

- `public.organisations`: canonical list of tenant organisations.
- `public.processes`: example multi-tenant data model.
- Timestamp trigger function for consistent `updated_at` columns.
- Row Level Security policies that enforce permissions using JWT claims (`role` and `org_id`). Each policy starts with `drop policy if exists` so the migration stays idempotent when re-run locally.

After running the migration, keep RLS **enabled** on both tables. The policies expect JWTs to contain `app_metadata.role` and `app_metadata.org_id` claims for every authenticated user.

## 3. Managing user roles and organisations

Use the Supabase Admin API (service role key) to set the `app_metadata` for users after they sign up. The example code in [`examples/supabase-auth.ts`](../examples/supabase-auth.ts) shows how to:

- Listen for signups (e.g. from a serverless function or webhook).
- Upsert an organisation when necessary.
- Store `role` (`superuser`, `admin`, or `user`) and the organisation UUID in `user.app_metadata`.

Every authenticated request will now include the role/org claims inside the JWT, making them available to both RLS policies and frontend code.

## 4. Reading JWT claims in the frontend

Your frontend can read the role and organisation with the Supabase client (`supabase.auth.getUser()` or `onAuthStateChange`). The `user` object exposes `app_metadata.role` and `app_metadata.org_id`, matching what the RLS policies expect.

```ts
const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error) throw error;

const role = user?.app_metadata?.role; // 'superuser' | 'admin' | 'user'
const orgId = user?.app_metadata?.org_id as string | undefined;
```

## 5. Using JWT claims in SQL / RLS

Inside Postgres policies, Supabase exposes the decoded JWT via `auth.jwt()`. The migration demonstrates how to inspect nested claims:

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
(auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
```

These expressions keep your policies aligned with the values your frontend reads. Superusers bypass tenant scoping, while admins and users are limited to the organisation encoded in the JWT.

## 6. Testing the access control

1. Create three users and assign them the roles `superuser`, `admin`, and `user`, each with an `app_metadata.org_id` referencing an existing organisation row.
2. Authenticate with each account and call Supabase from your frontend or the SQL editor (using the JWT as a bearer token).
3. Verify:
   - The superuser can select/insert/update/delete from any organisation or process.
   - The admin can only manipulate rows where `org_id` matches their `app_metadata.org_id`.
   - The user can select, insert, and update processes from their own organisation, cannot delete processes, and can only view their own organisation record.

When these tests pass you have a minimal working auth + RBAC foundation that you can extend with more tables following the same policy pattern.
