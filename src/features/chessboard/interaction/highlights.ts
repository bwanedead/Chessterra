import type { BoardInteractionState, BoardSquareHighlight, LastMove } from './types';

const HIGHLIGHT_COLORS: Record<BoardSquareHighlight['kind'], string> = {
  selected: 'rgba(59, 130, 246, 0.45)',
  'legal-move': 'rgba(34, 197, 94, 0.35)',
  'legal-capture': 'rgba(239, 68, 68, 0.35)',
  'last-move-from': 'rgba(234, 179, 8, 0.28)',
  'last-move-to': 'rgba(234, 179, 8, 0.42)',
  check: 'rgba(239, 68, 68, 0.5)',
};

export const getHighlightColor = (kind: BoardSquareHighlight['kind']): string =>
  HIGHLIGHT_COLORS[kind];

export const buildInteractionHighlights = (
  selectedSquare: string | null,
  legalTargets: string[],
  lastMove: LastMove | null,
  checkSquare: string | null,
): Record<string, BoardSquareHighlight> => {
  const highlights: Record<string, BoardSquareHighlight> = {};

  if (lastMove) {
    highlights[lastMove.from] = { kind: 'last-move-from' };
    highlights[lastMove.to] = { kind: 'last-move-to' };
  }

  if (checkSquare) {
    highlights[checkSquare] = { kind: 'check' };
  }

  if (selectedSquare) {
    highlights[selectedSquare] = { kind: 'selected' };
    for (const target of legalTargets) {
      if (!highlights[target]) {
        highlights[target] = { kind: 'legal-move' };
      }
    }
  }

  return highlights;
};

export const createInteractionState = (
  selectedSquare: string | null,
  legalTargets: string[],
  lastMove: LastMove | null = null,
  checkSquare: string | null = null,
): BoardInteractionState => ({
  selectedSquare,
  legalTargets,
  highlights: buildInteractionHighlights(selectedSquare, legalTargets, lastMove, checkSquare),
});
