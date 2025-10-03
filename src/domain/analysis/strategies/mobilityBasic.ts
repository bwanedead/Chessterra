import { Chess, Move } from 'chess.js';
import { InfluenceMap } from '@/domain/models/game';
import { InfluenceStrategy } from '@/domain/analysis/types';

const BOARD_SQUARES = 64;

const squareToIndex = (square: string): number => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1], 10) - 1;
  return rank * 8 + file;
};

const buildInfluenceForColor = (game: Chess, color: 'w' | 'b') => {
  const fenParts = game.fen().split(' ');
  fenParts[1] = color;
  const perspectiveGame = new Chess(fenParts.join(' '));
  const moves = perspectiveGame.moves({ verbose: true }) as Move[];
  const influence = new Array<number>(BOARD_SQUARES).fill(0);

  moves.forEach((move) => {
    const index = squareToIndex(move.to);
    if (index >= 0 && index < BOARD_SQUARES) {
      influence[index] += 1;
    }
  });

  return influence;
};

const evaluate = (game: Chess): InfluenceMap => {
  const white = buildInfluenceForColor(game, 'w');
  const black = buildInfluenceForColor(game, 'b');
  const net = white.map((value, index) => value - black[index]);

  return {
    white,
    black,
    net,
  };
};

export const mobilityStrategy: InfluenceStrategy = {
  id: 'mobility-basic',
  label: 'Mobility (Legal Moves)',
  description: 'Counts legal destinations for each color as an influence heatmap.',
  evaluate,
};
