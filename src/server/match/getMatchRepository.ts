import { createSupabaseServiceClient } from '@/platform/supabase/service';
import { createSupabaseMatchRepository } from './supabaseRepository';
import { memoryMatchRepository } from './memoryRepository';
import type { MatchRepository } from './types';

let cachedRepository: MatchRepository | null = null;

export const getMatchRepository = (): MatchRepository => {
  if (cachedRepository) {
    return cachedRepository;
  }

  const serviceClient = createSupabaseServiceClient();
  if (serviceClient) {
    cachedRepository = createSupabaseMatchRepository(serviceClient);
    return cachedRepository;
  }

  cachedRepository = memoryMatchRepository;
  return cachedRepository;
};

/** Test helper — reset cached repository between tests. */
export const resetMatchRepositoryCache = (): void => {
  cachedRepository = null;
};
