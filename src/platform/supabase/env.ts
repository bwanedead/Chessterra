export const getSupabaseUrl = (): string | undefined =>
  process.env.NEXT_PUBLIC_SUPABASE_URL;

export const getSupabaseAnonKey = (): string | undefined =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const getSupabaseServiceRoleKey = (): string | undefined =>
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = (): boolean =>
  Boolean(getSupabaseUrl() && getSupabaseAnonKey());

/** Server-side persistence (matches, ratings) requires the service role key. */
export const isSupabasePersistenceEnabled = (): boolean =>
  Boolean(getSupabaseUrl() && getSupabaseAnonKey() && getSupabaseServiceRoleKey());
