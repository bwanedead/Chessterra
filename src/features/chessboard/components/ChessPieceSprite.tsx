/* eslint-disable @next/next/no-img-element */
import { CSSProperties } from 'react';
import { ChessPieceDescriptor } from '@/features/chessboard/types';
import { getPieceSprite } from '@/shared/utils/pieceAssets';

interface ChessPieceSpriteProps {
  piece: ChessPieceDescriptor;
  size: number;
  className?: string;
  style?: CSSProperties;
}

export const ChessPieceSprite = ({ piece, size, className, style }: ChessPieceSpriteProps) => {
  const key = `${piece.color}${piece.type.toUpperCase()}`;
  const src = getPieceSprite(key);

  return (
    <img
      src={src}
      alt={key}
      draggable={false}
      className={['pointer-events-none select-none', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    />
  );
};
