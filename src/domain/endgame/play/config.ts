import { DEV_START_FEN } from '@/domain/endgame/devPosition';
import { pickPoolPositionForMatch } from '@/domain/endgame/pool';
import type { PositionId } from '@/platform/ids';
import type { LocalPlayConfig } from './types';

export const createPhase0PlayConfig = (
  overrides: Partial<LocalPlayConfig> = {},
  excludePositionIds: PositionId[] = [],
): LocalPlayConfig => {
  const picked =
    overrides.fen || overrides.positionId
      ? null
      : pickPoolPositionForMatch(excludePositionIds);

  return {
    rulesetId: 'standard-fide',
    fen: overrides.fen ?? picked?.fen ?? DEV_START_FEN,
    positionId: overrides.positionId ?? picked?.positionId,
    timeControlId: 'blitz_3_2',
    playerColor: 'w',
    opponentKind: 'bot',
    ...overrides,
  };
};
