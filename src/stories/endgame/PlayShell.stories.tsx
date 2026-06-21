import type { Meta, StoryObj } from '@storybook/react';
import { PlayShell } from '@/features/endgame';

const meta: Meta<typeof PlayShell> = {
  title: 'Play/Endgame/PlayShell',
  component: PlayShell,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'slate-950' },
  },
};

export default meta;

type Story = StoryObj<typeof PlayShell>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <PlayShell boardSize={480} />
    </div>
  ),
};

/** Fast time control for manual clock / flag-fall testing in Storybook. */
export const BulletClock: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <PlayShell boardSize={480} config={{ timeControlId: 'bullet_1_0' }} />
    </div>
  ),
};
