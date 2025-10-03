import { mobilityStrategy } from '@/domain/analysis/strategies/mobilityBasic';
import { InfluenceStrategy } from '@/domain/analysis/types';

const strategies: Record<string, InfluenceStrategy> = {
  [mobilityStrategy.id]: mobilityStrategy,
};

export const getInfluenceStrategy = (id: string): InfluenceStrategy => {
  return strategies[id] ?? mobilityStrategy;
};

export const listInfluenceStrategies = (): InfluenceStrategy[] => Object.values(strategies);
