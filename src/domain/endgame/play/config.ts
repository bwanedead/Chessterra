import { DEV_START_FEN } from '@/domain/endgame/devPosition';
import type { LocalPlayConfig } from './types';

export const createPhase0PlayConfig = (
  overrides: Partial<LocalPlayConfig> = {},
): LocalPlayConfig => ({
  rulesetId: 'standard-fide',
  fen: DEV_START_FEN,
  timeControlId: 'blitz_3_2',
  playerColor: 'w',
  opponentKind: 'bot',
  ...overrides,
});
