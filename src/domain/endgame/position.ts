import type { PositionId } from '@/platform/ids';
import type { FenString } from '@/domain/play/chess/types';

export interface PositionPoolEntry {
  id: PositionId;
  fen: FenString;
  materialSignature: string;
  pieceCount: number;
  tags?: string[];
  note?: string;
}

export interface PositionPool {
  version: number;
  entries: PositionPoolEntry[];
}

export const pickRandomPosition = (
  pool: PositionPool,
  excludeIds: PositionId[] = [],
): PositionPoolEntry | null => {
  const exclude = new Set(excludeIds);
  const candidates = pool.entries.filter((entry) => !exclude.has(entry.id));
  if (candidates.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] ?? null;
};

export const filterByMaterialSignature = (
  pool: PositionPool,
  signature: string,
): PositionPoolEntry[] =>
  pool.entries.filter((entry) => entry.materialSignature === signature);

export const filterByPieceCount = (
  pool: PositionPool,
  min: number,
  max: number,
): PositionPoolEntry[] =>
  pool.entries.filter((entry) => entry.pieceCount >= min && entry.pieceCount <= max);
