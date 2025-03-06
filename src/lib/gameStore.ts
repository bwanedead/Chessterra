'use client';

import { create } from 'zustand';

interface GameState {
  pgn: string;
  setPgn: (pgn: string) => void;
  currentMove: number;
  setCurrentMove: (move: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  pgn: '',
  setPgn: (pgn) => set({ pgn }),
  currentMove: 0,
  setCurrentMove: (move) => set({ currentMove: move }),
})); 