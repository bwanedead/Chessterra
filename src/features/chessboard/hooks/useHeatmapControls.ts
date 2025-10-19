import { useMemo } from 'react';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import type { HeatmapTraceMode } from '@/features/chessboard/overlays/types';
import type { HeatmapSchemeId } from '@/features/chessboard/overlays/schemes';
import type { HeatmapColorOverrides, HeatmapColorProfileId } from '@/features/chessboard/overlays/colors';
import {
  useHeatmapSettingsActions,
  useHeatmapSettingsState,
  buildToggleId,
} from '@/features/chessboard/state/heatmapSettingsContext';

const pieceTypes: ChessPieceDescriptor['type'][] = ['p', 'n', 'b', 'r', 'q', 'k'];
const pieceColors: Array<ChessPieceDescriptor['color']> = ['w', 'b'];

export interface HeatmapToggle {
  id: string;
  piece: ChessPieceDescriptor;
  active: boolean;
  label: string;
}

export interface HeatmapControls {
  toggles: HeatmapToggle[];
  activeToggleIds: string[];
  togglePiece: (id: string) => void;
  clearPieces: () => void;
  schemeId: HeatmapSchemeId;
  setSchemeId: (schemeId: HeatmapSchemeId) => void;
  subScheme: HeatmapTraceMode;
  setSubScheme: (mode: HeatmapTraceMode) => void;
  includeBothSides: boolean;
  setIncludeBothSides: (value: boolean) => void;
  showPieces: boolean;
  setShowPieces: (value: boolean) => void;
  normalizedBoard: boolean;
  setNormalizedBoard: (value: boolean) => void;
  colorProfileId: HeatmapColorProfileId;
  setColorProfileId: (id: HeatmapColorProfileId) => void;
  colorOverrides: HeatmapColorOverrides | null;
  setColorOverrides: (overrides: HeatmapColorOverrides | null) => void;
  checkHighlightsEnabled: boolean;
  setCheckHighlightsEnabled: (value: boolean) => void;
}

export const useHeatmapControls = (): HeatmapControls => {
  const state = useHeatmapSettingsState();
  const actions = useHeatmapSettingsActions();

  if (process.env.NODE_ENV === 'development') {

    console.log(
      `heatmap-controls active=${state.activeToggleIds.size} scheme=${state.schemeId} sub=${state.subScheme} includeBoth=${state.includeBothSides}`,
    );
  }

  const allToggles = useMemo(
    () =>
      pieceColors.flatMap((color) =>
        pieceTypes.map((type) => {
          const id = buildToggleId({ color, type } as ChessPieceDescriptor);
          const label = `${color === 'w' ? 'White' : 'Black'} ${pieceName(type)}`;
          return { id, label, piece: { color, type } as ChessPieceDescriptor };
        }),
      ),
    [],
  );

  const toggles = useMemo<HeatmapToggle[]>(
    () =>
      allToggles.map((toggle) => ({
        ...toggle,
        active: state.activeToggleIds.has(toggle.id),
      })),
    [allToggles, state.activeToggleIds],
  );

  return {
    toggles,
    activeToggleIds: Array.from(state.activeToggleIds),
    togglePiece: actions.togglePiece,
    clearPieces: actions.clearPieces,
    schemeId: state.schemeId,
    setSchemeId: actions.setSchemeId,
    subScheme: state.subScheme,
    setSubScheme: actions.setSubScheme,
    includeBothSides: state.includeBothSides,
    setIncludeBothSides: actions.setIncludeBothSides,
    showPieces: state.showPieces,
    setShowPieces: actions.setShowPieces,
    normalizedBoard: state.normalizedBoard,
    setNormalizedBoard: actions.setNormalizedBoard,
    colorProfileId: state.colorProfileId,
    setColorProfileId: actions.setColorProfileId,
    colorOverrides: state.colorOverrides,
    setColorOverrides: actions.setColorOverrides,
    checkHighlightsEnabled: state.checkHighlightsEnabled,
    setCheckHighlightsEnabled: actions.setCheckHighlightsEnabled,
  };
};

const pieceName = (type: ChessPieceDescriptor['type']) => {
  switch (type) {
    case 'p':
      return 'Pawn';
    case 'n':
      return 'Knight';
    case 'b':
      return 'Bishop';
    case 'r':
      return 'Rook';
    case 'q':
      return 'Queen';
    case 'k':
      return 'King';
    default:
      return 'Piece';
  }
};
