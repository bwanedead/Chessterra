import { Chess } from 'chess.js';
import { InfluenceMap } from '@/domain/models/game';
import { mobilityStrategy } from '@/domain/analysis/strategies/mobilityBasic';
import { InfluenceStrategy } from '@/domain/analysis/types';

export const defaultInfluenceStrategy = mobilityStrategy;

export const buildInfluenceMap = (
  game: Chess,
  strategy: InfluenceStrategy = defaultInfluenceStrategy,
): InfluenceMap => {
  return strategy.evaluate(game);
};
