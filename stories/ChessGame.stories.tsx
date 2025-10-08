import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';

const BOARD_SIZE = 360;

const ChessboardStory = () => {
  const [fen, setFen] = useState(() => new Chess().fen());

  const handleMove = useCallback((source: string, target: string) => {
    const game = new Chess(fen);
    const piece = game.get(source as Square);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && target.endsWith('8')) || (piece.color === 'b' && target.endsWith('1')));

    const move = game.move({
      from: source,
      to: target,
      ...(isPromotion ? { promotion: 'q' as const } : {}),
    });

    if (!move) {
      return false;
    }

    setFen(game.fen());
    return true;
  }, [fen]);

  return (
    <div
      className="relative"
      style={{
        width: `${BOARD_SIZE}px`,
        height: `${BOARD_SIZE}px`,
      }}
    >
      <CustomChessboard
        fen={fen}
        orientation="white"
        moveMode
        boardSize={BOARD_SIZE}
        onMove={handleMove}
      />
    </div>
  );
};

const meta: Meta<typeof ChessboardStory> = {
  title: 'Components/CustomChessboard',
  component: ChessboardStory,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChessboardStory />,
};
