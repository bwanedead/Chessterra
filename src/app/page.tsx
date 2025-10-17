'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Move, Square } from 'chess.js';
import { HeatmapBoard } from '@/features/chessboard/components/HeatmapBoard';
import { GameTerminal } from '@/features/chessboard/components/GameTerminal';
import type { PromotionPieceType } from '@/features/chessboard/types';
import { createScopedLogger } from '@/shared/utils/logger';

const BOARD_SIZE = 480;
const DEFAULT_FEN = new Chess().fen();

type PendingPromotionState = {
  from: string;
  to: string;
  color: 'w' | 'b';
  beforeFen: string;
  historyBefore: Move[];
};

type PendingCommand =
  | {
      type: 'loadPgn';
      payload: string;
    };

export default function Home() {
  const gameRef = useRef<Chess>(new Chess());

  const initialFenRef = useRef<string>(DEFAULT_FEN);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);

  const [fen, setFen] = useState<string>(DEFAULT_FEN);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [currentPly, setCurrentPly] = useState(0);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotionState | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoDelay, setAutoDelay] = useState(1200);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    '# Controls: Arrow keys navigate, space toggles autoplay, +/- adjust speed.',
    '# Enter PGN or commands (play, pause, speed <ms>, reset).',
  ]);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);

  const gameLogger = useMemo(() => createScopedLogger('app/game'), []);

  const appendConsoleLine = useCallback(
    (line: string) => {
      setConsoleLines((previous) => {
        const next = [...previous, line];
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });

      if (process.env.NODE_ENV === 'development') {
        gameLogger.debug('console-message', { line });
      }
    },
    [gameLogger],
  );

  const logMove = useCallback(
    (move: Move, plyCount: number) => {
      const turn = Math.ceil(plyCount / 2);
      const prefix = move.color === 'w' ? `${turn}.` : `${turn}...`;
      appendConsoleLine(`${prefix} ${move.san}`);
    },
    [appendConsoleLine],
  );

  const handleIllegalMove = useCallback(
    (from: string, to: string, reason: string) => {
      appendConsoleLine(`!! Illegal move ${from}-${to}: ${reason}`);
    },
    [appendConsoleLine],
  );

  const prepareGameAtHistory = useCallback(
    (history: Move[]) => {
      const game = gameRef.current;
      if (!game) {
        return null;
      }

      const initialFen = initialFenRef.current;
      if (initialFen === DEFAULT_FEN) {
        game.reset();
      } else {
        game.load(initialFen);
      }

      history.forEach((move) => {
        game.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
      });

      return game;
    },
    [],
  );

  const computeFenAtPly = useCallback(
    (ply: number, history: Move[]) => {
      const temp = new Chess();
      const initialFen = initialFenRef.current;
      if (initialFen === DEFAULT_FEN) {
        temp.reset();
      } else {
        temp.load(initialFen);
      }

      for (let index = 0; index < ply && index < history.length; index += 1) {
        const move = history[index];
        temp.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
      }

      return temp.fen();
    },
    [],
  );

  const handleMove = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (pendingPromotion) {
        appendConsoleLine('?? Finish promotion before making another move.');
        return false;
      }

      const baseHistory =
        currentPly < moveHistory.length ? moveHistory.slice(0, currentPly) : moveHistory;

      const board = prepareGameAtHistory(baseHistory);
      if (!board) {
        return false;
      }

      const piece = board.get(sourceSquare as Square);
      if (!piece) {
        return false;
      }

      const isPromotion =
        piece.type === 'p' &&
        ((piece.color === 'w' && targetSquare.endsWith('8')) ||
          (piece.color === 'b' && targetSquare.endsWith('1')));

      if (isPromotion) {
        const beforeFen = board.fen();
        let placeholder: Move | null = null;
        try {
          placeholder = board.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
          });
        } catch (error) {
          handleIllegalMove(
            sourceSquare,
            targetSquare,
            error instanceof Error ? error.message : 'promotion rejected',
          );
        }

        if (!placeholder) {
          prepareGameAtHistory(moveHistory);
          return false;
        }

        if (baseHistory.length !== moveHistory.length) {
          appendConsoleLine(
            `>> Branching from move ${currentPly}. Discarded ${moveHistory.length - baseHistory.length} future moves.`,
          );
        }

        setPendingPromotion({
          from: sourceSquare,
          to: targetSquare,
          color: piece.color,
          beforeFen,
          historyBefore: baseHistory,
        });
        setIsAutoPlaying(false);
        setFen(board.fen());
        return true;
      }

      let appliedMove: Move | null = null;
      try {
        appliedMove = board.move({
          from: sourceSquare,
          to: targetSquare,
        });
      } catch (error) {
        handleIllegalMove(
          sourceSquare,
          targetSquare,
          error instanceof Error ? error.message : 'invalid move',
        );
      }

      if (!appliedMove) {
        prepareGameAtHistory(moveHistory);
        return false;
      }

      if (baseHistory.length !== moveHistory.length) {
        appendConsoleLine(
          `>> Branching from move ${currentPly}. Discarded ${moveHistory.length - baseHistory.length} future moves.`,
        );
      }

      const newHistory = [...baseHistory, appliedMove];
      prepareGameAtHistory(newHistory);
      setMoveHistory(newHistory);
      setCurrentPly(newHistory.length);
      setIsAutoPlaying(false);
      logMove(appliedMove, newHistory.length);
      return true;
    },
    [appendConsoleLine, currentPly, handleIllegalMove, logMove, moveHistory, pendingPromotion, prepareGameAtHistory],
  );

  const handlePromotionSelect = useCallback(
    (promotion: PromotionPieceType) => {
      const pending = pendingPromotion;
      if (!pending) {
        return;
      }

      const { from, to, beforeFen, historyBefore } = pending;
      const board = prepareGameAtHistory(historyBefore);
      if (!board) {
        return;
      }

      board.load(beforeFen);

      let applied: Move | null = null;
      try {
        applied = board.move({
          from,
          to,
          promotion,
        });
      } catch (error) {
        appendConsoleLine(
          `!! Promotion rejected (${from}-${to}=${promotion.toUpperCase()}): ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }

      if (!applied) {
        prepareGameAtHistory(moveHistory);
        setPendingPromotion(null);
        setIsAutoPlaying(false);
        return;
      }

      const newHistory = [...historyBefore, applied];
      prepareGameAtHistory(newHistory);
      setMoveHistory(newHistory);
      setCurrentPly(newHistory.length);
      setPendingPromotion(null);
      setIsAutoPlaying(false);
      logMove(applied, newHistory.length);
    },
    [appendConsoleLine, logMove, moveHistory, pendingPromotion, prepareGameAtHistory],
  );

  const handlePromotionCancel = useCallback(() => {
    const pending = pendingPromotion;
    if (!pending) {
      return;
    }

    prepareGameAtHistory(pending.historyBefore);
    setMoveHistory(pending.historyBefore);
    setCurrentPly(pending.historyBefore.length);
    setPendingPromotion(null);
    setIsAutoPlaying(false);
    appendConsoleLine('>> Promotion cancelled.');
  }, [appendConsoleLine, pendingPromotion, prepareGameAtHistory]);

  const loadPgn = useCallback(
    (pgn: string, { silent = false }: { silent?: boolean } = {}) => {
      const trimmed = pgn.trim();
      if (!trimmed) {
        if (!silent) {
          appendConsoleLine('?? Empty PGN input.');
        }
        return false;
      }

      const game = gameRef.current;
      if (!game) {
        return false;
      }

      try {
        game.reset();
        game.loadPgn(trimmed, { strict: false });
      } catch (error) {
        if (!silent) {
          appendConsoleLine(
            `!! PGN import error: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
        game.reset();
        initialFenRef.current = DEFAULT_FEN;
        setMoveHistory([]);
        setCurrentPly(0);
        setPendingPromotion(null);
        setIsAutoPlaying(false);
        setFen(game.fen());
        return false;
      }

      const fenHeader = game.header().FEN;
      initialFenRef.current = fenHeader ?? DEFAULT_FEN;
      const verboseHistory = game.history({ verbose: true }) as Move[];
      setMoveHistory(verboseHistory);
      setCurrentPly(verboseHistory.length);
      setPendingPromotion(null);
      setIsAutoPlaying(false);
      setFen(game.fen());
      if (!silent) {
        appendConsoleLine(`>> Loaded PGN with ${verboseHistory.length} moves.`);
      }
      return true;
    },
    [appendConsoleLine],
  );

  const handleResetGame = useCallback(() => {
    const game = gameRef.current;
    if (!game) {
      return;
    }

    initialFenRef.current = DEFAULT_FEN;
    game.reset();
    setMoveHistory([]);
    setCurrentPly(0);
    setPendingPromotion(null);
    setIsAutoPlaying(false);
    appendConsoleLine('>> Game reset.');
  }, [appendConsoleLine]);

  const handleSetSpeed = useCallback(
    (value: number) => {
      setAutoDelay(() => {
        const next = Math.max(50, value);
        appendConsoleLine(`>> Speed set to ${next}ms per move.`);
        return next;
      });
    },
    [appendConsoleLine],
  );

  const handleAdjustSpeed = useCallback(
    (delta: number) => {
      setAutoDelay((previous) => {
        const next = Math.max(50, previous + delta);
        appendConsoleLine(`>> Speed set to ${next}ms per move.`);
        return next;
      });
    },
    [appendConsoleLine],
  );

  const handleStepForward = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentPly((previous) => Math.min(previous + 1, moveHistory.length));
  }, [moveHistory.length]);

  const handleStepBackward = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentPly((previous) => Math.max(previous - 1, 0));
  }, []);

  const handleJumpToPly = useCallback(
    (ply: number) => {
      const clamped = Math.min(Math.max(ply, 0), moveHistory.length);
      setIsAutoPlaying(false);
      setCurrentPly(clamped);
    },
    [moveHistory.length],
  );

  const handleToggleAutoplay = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      appendConsoleLine('>> Autoplay paused.');
      return;
    }

    if (pendingPromotion) {
      appendConsoleLine('?? Resolve promotion before autoplay.');
      return;
    }

    if (moveHistory.length === 0) {
      appendConsoleLine('?? No moves to play.');
      return;
    }

    if (currentPly >= moveHistory.length) {
      setCurrentPly(0);
    }

    setIsAutoPlaying(true);
    appendConsoleLine(`>> Autoplay started (${autoDelay}ms).`);
  }, [appendConsoleLine, autoDelay, currentPly, isAutoPlaying, moveHistory.length, pendingPromotion]);

  const handleCommand = useCallback(
    (rawCommand: string) => {
      const trimmed = rawCommand.trim();
      if (!trimmed) {
        return;
      }

      if (pendingCommand) {
        const answer = trimmed.toLowerCase();
        const acceptValues = ['y', 'yes'];
        const declineValues = ['n', 'no'];

        if (!acceptValues.includes(answer) && !declineValues.includes(answer)) {
          appendConsoleLine('?? Enter y or n to continue.');
          return;
        }

        if (acceptValues.includes(answer)) {
          if (pendingCommand.type === 'loadPgn') {
            loadPgn(pendingCommand.payload);
          }
        } else {
          appendConsoleLine('>> Import cancelled.');
        }

        setPendingCommand(null);
        return;
      }

      const [command, ...rest] = trimmed.split(/\s+/);
      switch (command.toLowerCase()) {
        case 'play':
          handleToggleAutoplay();
          break;
        case 'pause':
        case 'stop':
          if (isAutoPlaying) {
            setIsAutoPlaying(false);
            appendConsoleLine('>> Autoplay paused.');
          }
          break;
        case 'speed': {
          if (rest.length === 0) {
            appendConsoleLine(`>> Current speed: ${autoDelay}ms per move.`);
            break;
          }
          const value = Number.parseInt(rest[0], 10);
          if (Number.isFinite(value) && value > 0) {
            handleSetSpeed(value);
          } else {
            appendConsoleLine('?? Invalid speed value.');
          }
          break;
        }
        case 'reset':
          handleResetGame();
          break;
        default:
          if (moveHistory.length > 0 || currentPly > 0) {
            setPendingCommand({ type: 'loadPgn', payload: trimmed });
            appendConsoleLine('?? Replace current game with imported PGN? (y/n)');
          } else {
            loadPgn(trimmed);
          }
          break;
      }
    },
    [
      appendConsoleLine,
      autoDelay,
      currentPly,
      handleResetGame,
      handleSetSpeed,
      handleToggleAutoplay,
      isAutoPlaying,
      loadPgn,
      moveHistory.length,
      pendingCommand,
    ],
  );

  useEffect(() => {
    if (pendingPromotion) {
      return;
    }
    setFen(computeFenAtPly(currentPly, moveHistory));
  }, [computeFenAtPly, currentPly, moveHistory, pendingPromotion]);

  useEffect(() => {
    if (!isAutoPlaying || pendingPromotion) {
      return;
    }

    if (currentPly >= moveHistory.length) {
      setIsAutoPlaying(false);
      appendConsoleLine('>> Autoplay complete.');
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentPly((previous) => Math.min(previous + 1, moveHistory.length));
    }, autoDelay);

    return () => window.clearTimeout(timer);
  }, [appendConsoleLine, autoDelay, currentPly, isAutoPlaying, moveHistory.length, pendingPromotion]);

  useEffect(() => {
    if (pendingPromotion && isAutoPlaying) {
      setIsAutoPlaying(false);
      appendConsoleLine('>> Autoplay paused for promotion.');
    }
  }, [appendConsoleLine, isAutoPlaying, pendingPromotion]);

  const terminalMargin = 32 + (isCanvasExpanded ? (BOARD_SIZE * 3) / 8 : 0);

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-slate-950 px-6 pb-20 pt-24"
      style={{ paddingTop: '120px' }}
    >
      <div className="flex w-full max-w-6xl flex-col items-center gap-8">
        <HeatmapBoard
          fen={fen}
          orientation="white"
          moveMode={!pendingPromotion}
          boardSize={BOARD_SIZE}
          onMove={handleMove}
          promotionRequest={
            pendingPromotion ? { square: pendingPromotion.to, color: pendingPromotion.color } : undefined
          }
          onSelectPromotion={handlePromotionSelect}
          onCancelPromotion={handlePromotionCancel}
          onCanvasModeChange={setIsCanvasExpanded}
        />
        <GameTerminal
          moves={moveHistory}
          currentPly={currentPly}
          isAutoPlaying={isAutoPlaying}
          autoDelay={autoDelay}
          consoleLines={consoleLines}
          boardWidth={BOARD_SIZE}
          marginTop={terminalMargin}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          onJumpToPly={handleJumpToPly}
          onToggleAutoplay={handleToggleAutoplay}
          onAdjustSpeed={handleAdjustSpeed}
          onSubmitCommand={handleCommand}
        />
      </div>
    </main>
  );
}
