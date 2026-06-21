export type BoardSquareHighlightKind =
  | 'selected'
  | 'legal-move'
  | 'legal-capture'
  | 'last-move-from'
  | 'last-move-to'
  | 'check';

export interface BoardSquareHighlight {
  kind: BoardSquareHighlightKind;
}

export interface BoardInteractionState {
  selectedSquare: string | null;
  legalTargets: string[];
  highlights: Record<string, BoardSquareHighlight>;
}

export interface LastMove {
  from: string;
  to: string;
}
