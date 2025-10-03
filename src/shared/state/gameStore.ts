import { create } from 'zustand';
import { GameTimeline } from '@/domain/models/game';
import { createEmptyTimeline } from '@/domain/game/timeline';

interface GameStoreState {
  timeline: GameTimeline;
  currentPly: number;
  pgn: string;
  isImporting: boolean;
  setPgn: (pgn: string) => void;
  setTimeline: (timeline: GameTimeline) => void;
  setCurrentPly: (ply: number) => void;
  setIsImporting: (value: boolean) => void;
  resetTimeline: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  timeline: createEmptyTimeline(),
  currentPly: 0,
  pgn: '',
  isImporting: false,
  setPgn: (pgn) => set({ pgn }),
  setTimeline: (timeline) => set({ timeline, currentPly: Math.max(0, timeline.positions.length - 1) }),
  setCurrentPly: (ply) => set({ currentPly: ply }),
  setIsImporting: (value) => set({ isImporting: value }),
  resetTimeline: () => set({ timeline: createEmptyTimeline(), currentPly: 0 }),
}));
