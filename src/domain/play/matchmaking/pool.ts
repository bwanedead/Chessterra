import type { MatchmakingPoolKey } from './types';

export const buildPoolKeyString = (key: MatchmakingPoolKey): string => {
  const base = [key.gameModeId, key.timeControlId, key.rated ? 'rated' : 'casual'];
  if (key.subdivision) {
    base.push(key.subdivision);
  }
  return base.join('::');
};

export const poolKeysEqual = (a: MatchmakingPoolKey, b: MatchmakingPoolKey): boolean =>
  buildPoolKeyString(a) === buildPoolKeyString(b);
