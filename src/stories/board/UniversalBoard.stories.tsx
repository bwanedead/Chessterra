import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UniversalBoard } from '@/features/board';
import { DEV_START_FEN } from '@/domain/endgame/devPosition';

const UniversalBoardDemo = () => {
  const [fen, setFen] = useState(DEV_START_FEN);
  const [lastSan, setLastSan] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-950 min-h-[560px]">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-slate-100">Universal Board</h2>
        <p className="text-sm text-slate-400 max-w-lg">
          Graph-backed session · ruleset-driven · progression via move messages.
          Drag or click-to-move.
        </p>
      </div>
      <div className="w-[min(92vw,480px)] aspect-square">
        <UniversalBoard
          fen={fen}
          boardSize={480}
          playerColor="w"
          themeId="endgame-slate"
          onProgress={({ fen: nextFen, message }) => {
            if (nextFen) {
              setFen(nextFen);
            }
            if (message.type === 'move') {
              setLastSan(`${message.from}→${message.to}`);
            }
            if (message.type === 'notation') {
              setLastSan(message.value);
            }
          }}
        />
      </div>
      <p className="text-xs text-slate-500 font-mono break-all max-w-xl text-center">{fen}</p>
      {lastSan ? (
        <p className="text-xs text-slate-400">Last action: {lastSan}</p>
      ) : null}
    </div>
  );
};

const meta: Meta<typeof UniversalBoardDemo> = {
  title: 'Board/UniversalBoard',
  component: UniversalBoardDemo,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof UniversalBoardDemo>;

export const DevEndgame: Story = {};
