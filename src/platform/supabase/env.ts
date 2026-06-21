export const getSupabaseUrl = (): string | undefined =>
  process.env.NEXT_PUBLIC_SUPABASE_URL;

export const getSupabaseAnonKey = (): string | undefined =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean =>
  Boolean(getSupabaseUrl() && getSupabaseAnonKey());
