import type { FenString } from '@/domain/play/chess/types';

/**
 * Stable starting position for Phase 0 development.
 * Position pool (eg-002) is deferred — use this until curated pool ships.
 */
export const DEV_START_FEN: FenString =
  '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1';

export const DEV_POSITION_LABEL = 'K+P vs K+P pawn endgame (dev)';
