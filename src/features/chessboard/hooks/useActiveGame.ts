import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { getFenAtPly } from '@/domain/game/timeline';
import { useGameStore } from '@/shared/state/gameStore';

export const useActiveFen = () => {
  const timeline = useGameStore((state) => state.timeline);
  const currentPly = useGameStore((state) => state.currentPly);

  return useMemo(() => getFenAtPly(timeline, currentPly), [timeline, currentPly]);
};

export const useActiveGame = () => {
  const fen = useActiveFen();
  return useMemo(() => new Chess(fen), [fen]);
};
