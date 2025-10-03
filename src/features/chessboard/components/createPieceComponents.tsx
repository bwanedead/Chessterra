/* eslint-disable @next/next/no-img-element -- react-chessboard drag preview requires native <img> */
import type { ReactElement } from 'react';
import { getPieceSprite } from '@/shared/utils/pieceAssets';

type PieceComponent = ({ squareWidth }: { squareWidth: number }) => ReactElement;

export const createPieceComponents = (): Record<string, PieceComponent> => {
  const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

  return pieces.reduce<Record<string, PieceComponent>>((acc, piece) => {
    acc[piece] = ({ squareWidth }) => {
      const sprite = getPieceSprite(piece);
      const size = Math.max(1, Math.floor(squareWidth * 0.85));

      return (
        <div className="flex items-center justify-center w-full h-full">
          <img src={sprite} alt={piece} style={{ width: size, height: size }} draggable={false} />
        </div>
      );
    };
    return acc;
  }, {});
};

