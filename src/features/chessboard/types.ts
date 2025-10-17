export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPieceType = Exclude<PieceType, 'p' | 'k'>;

export interface ChessPieceDescriptor {
  color: PieceColor;
  type: PieceType;
}

export interface BoardSquare {
  id: string;
  color: 'light' | 'dark';
  piece?: ChessPieceDescriptor;
}
