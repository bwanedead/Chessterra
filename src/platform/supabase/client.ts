import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export const createSupabaseBrowserClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(getSupabaseUrl()!, getSupabaseAnonKey()!);
};
