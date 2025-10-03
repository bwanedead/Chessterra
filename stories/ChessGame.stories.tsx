import type { Meta, StoryObj } from '@storybook/react';
import { ChessboardPanel } from '@/features/chessboard/components/ChessboardPanel';

const meta: Meta<typeof ChessboardPanel> = {
  title: 'Components/ChessboardPanel',
  component: ChessboardPanel,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChessboardPanel />,
};
