import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { InfluenceMap } from '@/domain/models/game';
import { getInfluenceStrategy } from '@/domain/analysis/strategyCatalog';

export interface HeatmapComputationOptions {
  strategyId: string;
}

export const useHeatmapData = (fen: string, { strategyId }: HeatmapComputationOptions): InfluenceMap => {
  return useMemo(() => {
    const strategy = getInfluenceStrategy(strategyId);
    const game = new Chess(fen);
    return strategy.evaluate(game);
  }, [fen, strategyId]);
};
