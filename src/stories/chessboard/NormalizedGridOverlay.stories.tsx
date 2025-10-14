import type { Meta, StoryObj } from '@storybook/react';
import { BoardLayerStack } from '@/features/chessboard/components/layers/BoardLayerStack';
import { BoardLayer } from '@/features/chessboard/components/layers/BoardLayer';
import { NormalizedGridOverlay } from '@/features/chessboard/components/layers/NormalizedGridOverlay';
import { createScopedLogger } from '@/shared/utils/logger';

const meta: Meta<typeof BoardLayerStack> = {
  title: 'Chessboard/NormalizedGridOverlay',
  component: BoardLayerStack,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const surfaceLogger = createScopedLogger('storybook/chessboard');

const DummyBoard = () => {
  return (
    <BoardLayerStack style={{ width: 480, height: 480, backgroundColor: '#000000' }}>
      <BoardLayer zIndex={2} pointerEvents="auto">
        <div className="grid h-full w-full" style={{ gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
          {Array.from({ length: 64 }).map((_, index) => {
            const isLight = (Math.floor(index / 8) + (index % 8)) % 2 === 0;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: isLight ? '#111111' : '#050505',
                }}
              />
            );
          })}
        </div>
      </BoardLayer>
      <NormalizedGridOverlay
        innerLineThickness={2}
        edgeLineThickness={4}
        gridColor="rgba(255, 255, 255, 0.5)"
        edgeColor="rgba(255, 255, 255, 0.85)"
        logger={surfaceLogger}
        diagnosticsKey="storybook-normalized-overlay"
      />
    </BoardLayerStack>
  );
};

export const Preview: Story = {
  render: () => <DummyBoard />,
};
