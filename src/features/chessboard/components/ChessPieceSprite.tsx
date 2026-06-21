/* eslint-disable @next/next/no-img-element */
import { CSSProperties } from 'react';
import { ChessPieceDescriptor } from '@/features/chessboard/types';
import type { BoardAppearance } from '@/features/chessboard/themes/types';
import { getPieceSprite } from '@/shared/utils/pieceAssets';

interface ChessPieceSpriteProps {
  piece: ChessPieceDescriptor;
  size: number;
  className?: string;
  style?: CSSProperties;
  appearance?: BoardAppearance;
}

export const ChessPieceSprite = ({ piece, size, className, style, appearance }: ChessPieceSpriteProps) => {
  const key = `${piece.color}${piece.type.toUpperCase()}`;
  const src = getPieceSprite(key);
  const baseClasses = ['pointer-events-none select-none'];

  if (appearance?.mode === 'normalized') {
    const palette = normalizedPiecePalette[piece.color];
    return (
      <img
        src={src}
        alt={key}
        draggable={false}
        className={[...baseClasses, 'mix-blend-screen', className].filter(Boolean).join(' ')}
        style={{
          width: size,
          height: size,
          filter: palette.filter,
          opacity: palette.opacity,
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={key}
      draggable={false}
      className={[...baseClasses, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    />
  );
};

const normalizedPiecePalette: Record<ChessPieceDescriptor['color'], { filter: string; opacity: number }> = {
  w: {
    filter:
      'brightness(0) invert(1) sepia(0.5) saturate(6) hue-rotate(165deg) drop-shadow(0 0 4px rgba(125,211,252,0.65)) drop-shadow(0 0 12px rgba(56,189,248,0.35))',
    opacity: 0.7,
  },
  b: {
    filter:
      'brightness(0) sepia(1) saturate(10) hue-rotate(10deg) drop-shadow(0 0 4px rgba(245,158,11,0.7)) drop-shadow(0 0 10px rgba(245,158,11,0.3))',
    opacity: 0.78,
  },
};
