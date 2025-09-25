import { createClient, type User } from '@supabase/supabase-js';

/**
 * Configure Supabase clients. The admin client must use the service role key so it can
 * bypass RLS when provisioning organisations and updating user app_metadata.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Ensure NEXT_PUBLIC_SUPABASE_URL is set.');
}

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  throw new Error('Missing Supabase service role key. Ensure SUPABASE_SERVICE_ROLE_KEY is set.');
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseAnonKey() {
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing Supabase anonymous key. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set before calling getCurrentUserClaims.',
    );
  }

  return supabaseAnonKey;
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type Role = 'superuser' | 'admin' | 'user';

type AssignUserRoleInput = {
  userId: string;
  role: Role;
  orgId: string; // UUID from public.organisations
};

/**
 * Ensures an organisation exists (idempotent) and returns its row.
 */
export async function ensureOrganisation(name: string) {
  const { data, error } = await supabaseAdmin
    .from('organisations')
    .upsert({ name }, { onConflict: 'name' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates a user's app_metadata with role/org claims so they appear in JWTs.
 */
export async function assignUserRole({ userId, role, orgId }: AssignUserRoleInput) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role,
      org_id: orgId,
    },
  });

  if (error) throw error;
  return data.user;
}

/**
 * Example handler that could be triggered from a Supabase "auth.user.created" webhook.
 */
export async function handleNewSignup(user: User) {
  // 1. Determine which organisation + role the new user should belong to.
  // This could be based on invite tokens, signup form data, etc.
  const organisation = await ensureOrganisation('Acme Inc.');

  // 2. Decide the correct role for the user.
  const role: Role = user.email?.endsWith('@acme.example') ? 'admin' : 'user';

  // 3. Persist role/org in app_metadata so RLS policies recognise them.
  await assignUserRole({ userId: user.id, role, orgId: organisation.id });
}

/**
 * Frontend helper: read the role + organisation for the current session.
 */
export async function getCurrentUserClaims() {
  const client = createClient(supabaseUrl, getSupabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) throw error;

  return {
    role: user?.app_metadata?.role as Role | undefined,
    orgId: user?.app_metadata?.org_id as string | undefined,
  };
}
