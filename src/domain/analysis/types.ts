import { Chess } from 'chess.js';
import { InfluenceMap } from '@/domain/models/game';

export interface InfluenceStrategy {
  id: string;
  label: string;
  description?: string;
  evaluate(game: Chess): InfluenceMap;
}
