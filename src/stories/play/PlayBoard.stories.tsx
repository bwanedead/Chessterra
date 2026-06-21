import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PlayBoard } from '@/features/play';
import { createChessEngine } from '@/domain/play/chess';

const START_FEN = '4k3/8/8/4K3/8/8/8/8 w - - 0 1';

const PlayBoardDemo = () => {
  const [fen, setFen] = useState(START_FEN);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-950 min-h-[520px]">
      <p className="text-sm text-slate-300">
        Foundation play board — drag or click-to-move. King vs king endgame demo.
      </p>
      <div className="w-[min(92vw,480px)] aspect-square">
        <PlayBoard
          fen={fen}
          boardSize={480}
          playerColor={createChessEngine(fen).turn()}
          themeId="endgame-slate"
          onFenChange={(nextFen) => setFen(nextFen)}
        />
      </div>
      <p className="text-xs text-slate-500 font-mono break-all max-w-xl text-center">{fen}</p>
    </div>
  );
};

const meta: Meta<typeof PlayBoardDemo> = {
  title: 'Play/Foundation/PlayBoard',
  component: PlayBoardDemo,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof PlayBoardDemo>;

export const Interactive: Story = {};
