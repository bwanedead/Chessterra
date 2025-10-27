import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CanvasModeProvider, CanvasViewport, CanvasChrome, useCanvasMode } from '@/features/chessboard/canvas';
import { ExpandCanvasToggle } from '@/features/chessboard/components/ExpandCanvasToggle';
import { BubbleButton } from '@/features/chessboard/components/controls/BubbleButton';
// Backdrop component path changed or removed; drop it from this story to keep build green

const meta: Meta = {
  title: 'Chessboard/Canvas Mode',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const CanvasDemo = () => {
  const { isExpanded } = useCanvasMode();
  const [normalized, setNormalized] = useState(false);

  return (
    <CanvasViewport>
      {/* Backdrop disabled for now in story */}
      <div
        className={[
          'relative z-10 flex min-h-[400px] min-w-[400px] items-center justify-center transition-all duration-500',
          isExpanded
            ? 'h-screen w-screen bg-slate-950 text-slate-200'
            : 'h-[500px] w-[500px] bg-slate-800 text-slate-100',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="rounded-2xl border border-slate-600/50 bg-slate-900/60 px-6 py-4 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Canvas Mode Demo</p>
          <p className="mt-4 text-lg font-semibold text-slate-100">
            {isExpanded ? 'Expanded View Active' : 'Normal Layout'}
          </p>
          <p className="mt-2 text-slate-400">{normalized ? 'Normalized grid backdrop' : 'Classic backdrop'}</p>
        </div>
      </div>
      <CanvasChrome>
        <div className="flex flex-col items-end gap-3">
          <BubbleButton label="Normalized board" active={normalized} onClick={() => setNormalized((prev) => !prev)} />
          <ExpandCanvasToggle />
        </div>
      </CanvasChrome>
    </CanvasViewport>
  );
};

export const Playground: Story = {
  render: () => (
    <CanvasModeProvider>
      <CanvasDemo />
    </CanvasModeProvider>
  ),
};
