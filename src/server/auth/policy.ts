import type { RequestActor } from './types';

export const GUEST_RATED_ERROR = 'Rated games require a signed-in account';

/** Guests may play casual invite games; rated play requires verified Supabase users. */
export const assertActorCanPlayRated = (actor: RequestActor, rated: boolean): string | null => {
  if (rated && actor.isGuest) {
    return GUEST_RATED_ERROR;
  }
  return null;
};

export const isGuestUserId = (userId: string): boolean => userId.startsWith('guest-');
