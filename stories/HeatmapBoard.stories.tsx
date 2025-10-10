import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { HeatmapBoard } from '@/features/chessboard/components/HeatmapBoard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const HeatmapBoardStory = () => {
  const [fen, setFen] = useState(INITIAL_FEN);

  const handleMove = useCallback((from: string, to: string) => {
    const chess = new Chess(fen);
    const piece = chess.get(from as Square);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1')));

    const move = chess.move({
      from: from as Square,
      to: to as Square,
      ...(isPromotion ? { promotion: 'q' as const } : {}),
    });

    if (!move) {
      return false;
    }

    setFen(chess.fen());
    return true;
  }, [fen]);

  return (
    <div className="p-6">
      <HeatmapBoard
        fen={fen}
        orientation="white"
        moveMode
        boardSize={480}
        onMove={handleMove}
      />
    </div>
  );
};

const meta: Meta<typeof HeatmapBoardStory> = {
  title: 'Components/HeatmapBoard',
  component: HeatmapBoardStory,
};

export default meta;

type Story = StoryObj<typeof HeatmapBoardStory>;

export const Default: Story = {
  render: () => <HeatmapBoardStory />,
};

