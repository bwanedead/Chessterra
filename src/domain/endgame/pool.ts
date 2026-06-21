import { asPositionId, type PositionId } from '@/platform/ids';
import poolData from '@/data/position-pool.json';
import { pickRandomPosition, type PositionPool, type PositionPoolEntry } from './position';

export const POSITION_POOL = poolData as PositionPool & {
  generatedAt?: string;
  count?: number;
};

export const POSITION_POOL_SIZE = POSITION_POOL.entries.length;

export const getPoolEntry = (id: PositionId): PositionPoolEntry | undefined =>
  POSITION_POOL.entries.find((entry) => entry.id === id);

export const pickPoolPosition = (
  excludeIds: PositionId[] = [],
): PositionPoolEntry | null => pickRandomPosition(POSITION_POOL, excludeIds);

export const pickPoolPositionForMatch = (
  excludeIds: PositionId[] = [],
): { fen: string; positionId: PositionId; entry: PositionPoolEntry } | null => {
  const entry = pickPoolPosition(excludeIds);
  if (!entry) {
    return null;
  }
  return {
    fen: entry.fen,
    positionId: asPositionId(entry.id),
    entry,
  };
};
