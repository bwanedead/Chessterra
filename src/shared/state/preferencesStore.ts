import { create } from 'zustand';
interface PreferencesState {
  moveMode: boolean;
  boardOrientation: 'white' | 'black';
  toggleMoveMode: () => void;
  setBoardOrientation: (orientation: 'white' | 'black') => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  moveMode: true,
  boardOrientation: 'white',
  toggleMoveMode: () => set((state) => ({ moveMode: !state.moveMode })),
  setBoardOrientation: (orientation) => set({ boardOrientation: orientation }),
}));
