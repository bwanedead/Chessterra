import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabasePersistenceEnabled,
} from './env';

let serviceClient: SupabaseClient | null = null;

/** Service-role client for server-side writes (bypasses RLS). Never expose to the browser. */
export const createSupabaseServiceClient = (): SupabaseClient | null => {
  if (!isSupabasePersistenceEnabled()) {
    return null;
  }

  if (!serviceClient) {
    serviceClient = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceClient;
};
