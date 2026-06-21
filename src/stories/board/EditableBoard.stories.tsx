import type { Meta, StoryObj } from '@storybook/react';
import { EditableBoard } from '@/features/board';

const meta: Meta<typeof EditableBoard> = {
  title: 'Board/EditableBoard',
  component: EditableBoard,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof EditableBoard>;

export const BoardLab: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-950 p-6">
      <EditableBoard boardSize={440} playerColor={null} />
    </div>
  ),
};
