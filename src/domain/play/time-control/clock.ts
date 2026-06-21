import type { PieceColor } from '@/features/chessboard/types';
import type { MatchClockState, PlayerClock, TimeControlDefinition } from './types';

export const createPlayerClock = (definition: TimeControlDefinition): PlayerClock => ({
  remainingMs: definition.initialMs,
  incrementMs: definition.incrementMs,
  lastTickAt: null,
});

export const createMatchClock = (
  definition: TimeControlDefinition,
  startingColor: PieceColor = 'w',
): MatchClockState => ({
  white: createPlayerClock(definition),
  black: createPlayerClock(definition),
  activeColor: startingColor,
  running: false,
});

const otherColor = (color: PieceColor): PieceColor => (color === 'w' ? 'b' : 'w');

export const startClock = (state: MatchClockState, now: number): MatchClockState => ({
  ...state,
  running: true,
  white: { ...state.white, lastTickAt: state.activeColor === 'w' ? now : state.white.lastTickAt },
  black: { ...state.black, lastTickAt: state.activeColor === 'b' ? now : state.black.lastTickAt },
});

export const stopClock = (state: MatchClockState): MatchClockState => ({
  ...state,
  running: false,
  white: { ...state.white, lastTickAt: null },
  black: { ...state.black, lastTickAt: null },
});

const tickSide = (clock: PlayerClock, now: number): PlayerClock => {
  if (clock.lastTickAt === null) {
    return { ...clock, lastTickAt: now };
  }
  const elapsed = Math.max(0, now - clock.lastTickAt);
  return {
    ...clock,
    remainingMs: Math.max(0, clock.remainingMs - elapsed),
    lastTickAt: now,
  };
};

export const tickClock = (state: MatchClockState, now: number): MatchClockState => {
  if (!state.running) {
    return state;
  }

  const active = state.activeColor;
  const next =
    active === 'w'
      ? { ...state, white: tickSide(state.white, now) }
      : { ...state, black: tickSide(state.black, now) };

  const activeClock = active === 'w' ? next.white : next.black;
  if (activeClock.remainingMs <= 0) {
    return { ...next, running: false };
  }

  return next;
};

export const applyIncrement = (
  state: MatchClockState,
  mover: PieceColor,
): MatchClockState => {
  if (mover === 'w') {
    return {
      ...state,
      white: { ...state.white, remainingMs: state.white.remainingMs + state.white.incrementMs },
    };
  }
  return {
    ...state,
    black: { ...state.black, remainingMs: state.black.remainingMs + state.black.incrementMs },
  };
};

export const switchTurn = (
  state: MatchClockState,
  now: number,
): MatchClockState => {
  const nextColor = otherColor(state.activeColor);
  return {
    ...state,
    activeColor: nextColor,
    white: {
      ...state.white,
      lastTickAt: nextColor === 'w' ? now : null,
    },
    black: {
      ...state.black,
      lastTickAt: nextColor === 'b' ? now : null,
    },
  };
};

export const commitMoveClock = (
  state: MatchClockState,
  mover: PieceColor,
  now: number,
): MatchClockState => {
  const withIncrement = applyIncrement(state, mover);
  return switchTurn(withIncrement, now);
};

export const detectFlagFall = (state: MatchClockState): PieceColor | null => {
  if (state.white.remainingMs <= 0) {
    return 'w';
  }
  if (state.black.remainingMs <= 0) {
    return 'b';
  }
  return null;
};

export const formatClock = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
