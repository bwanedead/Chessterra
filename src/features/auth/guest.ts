const GUEST_STORAGE_KEY = 'endgame-guest-id';

export const getOrCreateGuestId = (): string => {
  if (typeof window === 'undefined') {
    return 'guest-server';
  }

  const existing = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = `guest-${crypto.randomUUID()}`;
  window.localStorage.setItem(GUEST_STORAGE_KEY, nextId);
  return nextId;
};

export const getGuestId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(GUEST_STORAGE_KEY);
};
