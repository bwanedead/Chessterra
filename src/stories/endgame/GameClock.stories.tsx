import type { Meta, StoryObj } from '@storybook/react';
import { createMatchClock } from '@/domain/play/time-control/clock';
import { getTimeControl } from '@/domain/play/time-control/registry';
import '@/domain/play/time-control';
import { GameClock } from '@/features/endgame/components/GameClock';

const blitz = getTimeControl('blitz_3_2')!;

const idleClock = createMatchClock(blitz, 'w');

const activeWhiteClock = {
  ...idleClock,
  running: true,
  activeColor: 'w' as const,
  white: { ...idleClock.white, remainingMs: 142_000, lastTickAt: Date.now() },
};

const lowTimeClock = {
  ...idleClock,
  running: true,
  activeColor: 'w' as const,
  white: { ...idleClock.white, remainingMs: 8_500, lastTickAt: Date.now() },
};

const flaggedClock = {
  ...idleClock,
  running: false,
  activeColor: 'b' as const,
  white: { ...idleClock.white, remainingMs: 0 },
  black: { ...idleClock.black, remainingMs: 95_000 },
};

const meta: Meta<typeof GameClock> = {
  title: 'Play/Endgame/GameClock',
  component: GameClock,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'slate-950' },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(92vw,360px)] bg-slate-950 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof GameClock>;

export const Idle: Story = {
  args: {
    label: 'White (you)',
    color: 'w',
    clock: idleClock,
    isPlayer: true,
  },
};

export const Active: Story = {
  args: {
    label: 'White (you)',
    color: 'w',
    clock: activeWhiteClock,
    isPlayer: true,
  },
};

export const LowTime: Story = {
  args: {
    label: 'White (you)',
    color: 'w',
    clock: lowTimeClock,
    isPlayer: true,
  },
};

export const Flagged: Story = {
  args: {
    label: 'White (you)',
    color: 'w',
    clock: flaggedClock,
    isTerminal: true,
    endReason: 'timeout',
    winner: 'b',
  },
};

export const OpponentActive: Story = {
  args: {
    label: 'Black',
    color: 'b',
    clock: {
      ...idleClock,
      running: true,
      activeColor: 'b',
      black: { ...idleClock.black, remainingMs: 176_000, lastTickAt: Date.now() },
    },
  },
};
