# Supabase test user accounts

Run the SQL script in [`supabase/seeds/create_test_users.sql`](../supabase/seeds/create_test_users.sql) to provision one account for each RBAC role. Execute it from the Supabase SQL editor or CLI while authenticated with a service role key so it can manage users.

The script is idempotent: it recreates the users on each execution so the passwords and metadata stay in sync with the documentation below.

## Test credentials

After the script finishes you can sign in with the following accounts:

| Role       | Email                    | Password        | Organisation |
|------------|--------------------------|-----------------|--------------|
| Superuser  | `superuser@example.com` | `SuperUser#123` | Global HQ    |
| Admin      | `admin@example.com`     | `Admin#123`     | Acme Corp    |
| User       | `user@example.com`      | `User#1234`     | Acme Corp    |

Each account has its `app_metadata.role` and `app_metadata.org_id` populated so the RLS policies defined in [`supabase/migrations/0001_auth_rbac.sql`](../supabase/migrations/0001_auth_rbac.sql) can evaluate the correct permissions.
