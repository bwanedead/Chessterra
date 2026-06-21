import { createChessEngine } from '@/domain/play/chess/chessJsEngine';
import type { PieceColor } from '@/features/chessboard/types';
import type { BotAdapter, BotMove } from './types';

const pickRandom = <T>(items: T[]): T | null => {
  if (items.length === 0) {
    return null;
  }
  return items[Math.floor(Math.random() * items.length)] ?? null;
};

/** Interim Phase 0 bot — random legal move. Replace before calling Phase 0 fully done. */
export const randomLegalBot: BotAdapter = {
  id: 'random-legal',
  label: 'Random legal',
  pickMove(fen: string, color: PieceColor): BotMove | null {
    const engine = createChessEngine();
    engine.load(fen);

    if (engine.turn() !== color) {
      return null;
    }

    const legal = engine.legalMoves();
    const choice = pickRandom(legal);
    if (!choice) {
      return null;
    }

    return {
      from: choice.from,
      to: choice.to,
      promotion: choice.promotion,
    };
  },
};

export const defaultPhase0Bot = randomLegalBot;
