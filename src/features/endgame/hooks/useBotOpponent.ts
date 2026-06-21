'use client';

import { useEffect, useRef } from 'react';
import { defaultPhase0Bot, type BotAdapter } from '@/domain/endgame/bot';
import type { LocalPlaySession } from './useLocalPlaySession';
import { getBoardDisplayFen } from './useLocalPlaySession';

const BOT_THINK_DELAY_MS = 450;

export interface UseBotOpponentOptions {
  bot?: BotAdapter;
  thinkDelayMs?: number;
  enabled?: boolean;
}

/** Applies bot moves when it is the opponent's turn. */
export const useBotOpponent = (
  session: Pick<
    LocalPlaySession,
    | 'config'
    | 'matchState'
    | 'boardState'
    | 'activeColor'
    | 'isTerminal'
    | 'commitMove'
  >,
  options: UseBotOpponentOptions = {},
): void => {
  const {
    bot = defaultPhase0Bot,
    thinkDelayMs = BOT_THINK_DELAY_MS,
    enabled = true,
  } = options;

  const commitRef = useRef(session.commitMove);
  commitRef.current = session.commitMove;

  const botRef = useRef(bot);
  botRef.current = bot;

  useEffect(() => {
    if (!enabled || session.config.opponentKind !== 'bot') {
      return undefined;
    }
    if (session.isTerminal) {
      return undefined;
    }
    if (session.activeColor === session.config.playerColor) {
      return undefined;
    }
    if (session.matchState.phase !== 'ready' && session.matchState.phase !== 'active') {
      return undefined;
    }

    const fen = getBoardDisplayFen(session.boardState);
    const botColor = session.activeColor;

    const timerId = window.setTimeout(() => {
      const move = botRef.current.pickMove(fen, botColor);
      if (!move) {
        return;
      }
      commitRef.current(move.from, move.to, move.promotion);
    }, thinkDelayMs);

    return () => window.clearTimeout(timerId);
  }, [
    enabled,
    session.activeColor,
    session.boardState.revision,
    session.config.opponentKind,
    session.config.playerColor,
    session.isTerminal,
    session.matchState.moveCount,
    session.matchState.phase,
    thinkDelayMs,
  ]);
};
