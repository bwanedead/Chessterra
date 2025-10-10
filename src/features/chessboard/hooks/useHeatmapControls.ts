import { useCallback, useMemo, useState } from 'react';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';
import type { HeatmapScheme } from '@/features/chessboard/overlays/types';

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
  scheme: HeatmapScheme;
  setScheme: (scheme: HeatmapScheme) => void;
  includeBothSides: boolean;
  setIncludeBothSides: (value: boolean) => void;
  showPieces: boolean;
  setShowPieces: (value: boolean) => void;
}

const buildToggleId = (color: ChessPieceDescriptor['color'], type: ChessPieceDescriptor['type']) => `${color}-${type}`;

export const useHeatmapControls = (): HeatmapControls => {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [scheme, setScheme] = useState<HeatmapScheme>('line-of-sight');
  const [includeBothSides, setIncludeBothSides] = useState<boolean>(true);
  const [showPieces, setShowPieces] = useState<boolean>(true);

  const allToggles = useMemo(
    () =>
      pieceColors.flatMap((color) =>
        pieceTypes.map((type) => {
          const id = buildToggleId(color, type);
          const label = `${color === 'w' ? 'White' : 'Black'} ${pieceName(type)}`;
          return { id, label, piece: { color, type } as ChessPieceDescriptor };
        }),
      ),
    [],
  );

  const togglePiece = useCallback((id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearPieces = useCallback(() => {
    setActiveIds(new Set());
  }, []);

  const toggles = useMemo<HeatmapToggle[]>(
    () =>
      allToggles.map((toggle) => ({
        ...toggle,
        active: activeIds.has(toggle.id),
      })),
    [allToggles, activeIds],
  );

  return {
    toggles,
    activeToggleIds: Array.from(activeIds),
    togglePiece,
    clearPieces,
    scheme,
    setScheme,
    includeBothSides,
    setIncludeBothSides,
    showPieces,
    setShowPieces,
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

