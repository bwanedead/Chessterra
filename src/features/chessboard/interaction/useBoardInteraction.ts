import { useCallback, useMemo, useState } from 'react';
import type { PieceColor } from '@/features/chessboard/types';
import type { ChessEngine } from '@/domain/play/chess/engine';
import { createInteractionState } from './highlights';
import type { LastMove } from './types';

interface UseBoardInteractionParams {
  engine: ChessEngine;
  /** Which color the local player controls — null for spectator/both */
  playerColor: PieceColor | null;
  onMove: (from: string, to: string) => boolean;
  lastMove?: LastMove | null;
}

export const useBoardInteraction = ({
  engine,
  playerColor,
  onMove,
  lastMove = null,
}: UseBoardInteractionParams) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const canInteract = playerColor === null || engine.turn() === playerColor;

  const legalTargets = useMemo(() => {
    if (!selectedSquare || !canInteract) {
      return [];
    }
    return engine.legalMoves({ square: selectedSquare }).map((move) => move.to);
  }, [canInteract, engine, selectedSquare]);

  const checkSquare = useMemo(() => {
    if (!engine.isCheck()) {
      return null;
    }
    const fenParts = engine.fen().split(' ');
    const boardPart = fenParts[0];
    const turn = engine.turn();
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        const square = `${file}${rank}`;
        const fileIndex = file.charCodeAt(0) - 97;
        const rankIndex = 8 - rank;
        const rows = boardPart.split('/');
        const row = rows[rankIndex];
        if (!row) continue;
        let col = 0;
        for (const char of row) {
          if (/\d/.test(char)) {
            col += Number(char);
          } else {
            if (col === fileIndex) {
              const isKing = char.toLowerCase() === 'k';
              const isWhite = char === char.toUpperCase();
              if (isKing && ((turn === 'w' && isWhite) || (turn === 'b' && !isWhite))) {
                return square;
              }
            }
            col += 1;
          }
        }
      }
    }
    return null;
  }, [engine]);

  const interaction = useMemo(
    () => createInteractionState(selectedSquare, legalTargets, lastMove, checkSquare),
    [checkSquare, lastMove, legalTargets, selectedSquare],
  );

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
  }, []);

  const handleSquareActivate = useCallback(
    (square: string, hasPiece: boolean, pieceColor?: PieceColor) => {
      if (!canInteract) {
        return;
      }

      if (selectedSquare && legalTargets.includes(square)) {
        const moved = onMove(selectedSquare, square);
        if (moved) {
          setSelectedSquare(null);
        }
        return;
      }

      if (hasPiece && pieceColor && (playerColor === null || pieceColor === playerColor)) {
        setSelectedSquare((current) => (current === square ? null : square));
        return;
      }

      if (selectedSquare) {
        setSelectedSquare(null);
      }
    },
    [canInteract, legalTargets, onMove, playerColor, selectedSquare],
  );

  return {
    interaction,
    selectedSquare,
    legalTargets,
    canInteract,
    handleSquareActivate,
    clearSelection,
  };
};
