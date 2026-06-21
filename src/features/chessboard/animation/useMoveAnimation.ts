import { useEffect, useRef, useState } from 'react';
import { DEFAULT_MOVE_ANIMATION_MS, type MoveAnimation } from './types';

interface UseMoveAnimationParams {
  fen: string;
  enabled?: boolean;
}

export const useMoveAnimation = ({ fen, enabled = true }: UseMoveAnimationParams) => {
  const previousFenRef = useRef(fen);
  const [animation, setAnimation] = useState<MoveAnimation | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousFenRef.current = fen;
      return;
    }

    const previous = previousFenRef.current;
    if (previous === fen) {
      return;
    }

    const detected = detectMove(previous, fen);
    previousFenRef.current = fen;

    if (!detected) {
      return;
    }

    setAnimation({
      from: detected.from,
      to: detected.to,
      durationMs: DEFAULT_MOVE_ANIMATION_MS,
    });

    const timeout = window.setTimeout(() => {
      setAnimation(null);
    }, DEFAULT_MOVE_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [enabled, fen]);

  return { animation };
};

const detectMove = (
  beforeFen: string,
  afterFen: string,
): { from: string; to: string } | null => {
  if (beforeFen.split(' ')[0] === afterFen.split(' ')[0]) {
    return null;
  }

  const before = parseBoard(beforeFen);
  const after = parseBoard(afterFen);

  let from: string | null = null;
  let to: string | null = null;
  let changed = 0;

  for (const square of Object.keys(before)) {
    if (before[square] !== after[square]) {
      changed += 1;
      if (before[square] && !after[square]) {
        from = square;
      }
      if (after[square] && before[square] !== after[square]) {
        to = square;
      }
    }
  }

  if (changed >= 2 && from && to) {
    return { from, to };
  }

  return null;
};

const parseBoard = (fen: string): Record<string, string> => {
  const board: Record<string, string> = {};
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');

  for (let rankIndex = 0; rankIndex < rows.length; rankIndex += 1) {
    const rank = 8 - rankIndex;
    let fileIndex = 0;
    for (const char of rows[rankIndex]) {
      if (/\d/.test(char)) {
        fileIndex += Number(char);
      } else {
        const file = String.fromCharCode(97 + fileIndex);
        board[`${file}${rank}`] = char;
        fileIndex += 1;
      }
    }
  }

  return board;
};
