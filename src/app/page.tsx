'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Move, Square } from 'chess.js';
import { HeatmapBoard } from '@/features/chessboard/components/HeatmapBoard';
import { GameTerminal } from '@/features/chessboard/components/GameTerminal';
import type { PromotionPieceType } from '@/features/chessboard/types';
import { createScopedLogger } from '@/shared/utils/logger';
import type { HeatmapTraceMode } from '@/features/chessboard/overlays/types';
import {
  HeatmapSettingsProvider,
  useHeatmapSettingsActions,
  useHeatmapSettingsState,
} from '@/features/chessboard/state/heatmapSettingsContext';
import { listHeatmapSchemes } from '@/features/chessboard/overlays/schemes';
import type { HeatmapColorProfileId } from '@/features/chessboard/overlays/colors';
import { listColorProfiles } from '@/features/chessboard/overlays/colors';

const BOARD_SIZE = 480;
const DEFAULT_FEN = new Chess().fen();
const INITIAL_TERMINAL_LINES = [
  '# Ready for playback. Use left/right arrows or A/D to step through moves.',
  '# Type commands below or paste PGN to import.',
  '# Shortcuts: Space toggles autoplay, +/- adjust speed.',
];

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

function HomeContent() {
  const gameRef = useRef<Chess>(new Chess());

  const initialFenRef = useRef<string>(DEFAULT_FEN);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  const [canvasAttachmentHost, setCanvasAttachmentHost] = useState<HTMLElement | null>(null);

  const [fen, setFen] = useState<string>(DEFAULT_FEN);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [currentPly, setCurrentPly] = useState(0);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotionState | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoDelay, setAutoDelay] = useState(1200);
  const [consoleLines, setConsoleLines] = useState<string[]>(INITIAL_TERMINAL_LINES);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const previousOrientationRef = useRef<'white' | 'black'>(boardOrientation);

  const gameLogger = useMemo(() => createScopedLogger('app/game'), []);
  const layoutLogger = useMemo(() => createScopedLogger('app/layout'), []);
  const heatmapActions = useHeatmapSettingsActions();
  const heatmapState = useHeatmapSettingsState();
  const heatmapSchemes = useMemo(() => listHeatmapSchemes(), []);
  const heatmapColorProfiles = useMemo(() => listColorProfiles(), []);
  
  const formatTraceModeLabel = useCallback((mode: string) => (mode === 'absolute' ? 'Absolute' : 'Line of Sight'), []);

  const handleOrientationToggle = useCallback(() => {
    setBoardOrientation((previous) => (previous === 'white' ? 'black' : 'white'));
  }, []);

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

  const attemptTerminalMove = useCallback(
    (raw: string) => {
      const moveToken = raw.trim();
      if (!moveToken) {
        appendConsoleLine('?? Missing move.');
        return true;
      }

      const baseHistory = moveHistory.slice(0, currentPly);
      const sandbox = new Chess();
      const initialFen = initialFenRef.current ?? DEFAULT_FEN;
      if (initialFen === DEFAULT_FEN) {
        sandbox.reset();
      } else {
        try {
          sandbox.load(initialFen);
        } catch {
          appendConsoleLine('!! Unable to restore game state for move command.');
          return true;
        }
      }

      baseHistory.forEach((move) => {
        sandbox.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
      });

      let applied: Move | null = null;
      const compact = moveToken.replace(/\s+/g, '');
      const uciMatch = compact.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/i);

      try {
        if (uciMatch) {
          const [, from, to, promotion] = uciMatch;
          applied = sandbox.move({
            from: from as Square,
            to: to as Square,
            promotion: promotion as PromotionPieceType | undefined,
          });
        } else {
          applied = sandbox.move(compact);
        }
      } catch {
        applied = null;
      }

      if (!applied) {
        appendConsoleLine('?? Illegal or unrecognized move.');
        return true;
      }

      const nextHistory = [...baseHistory, applied];
      setMoveHistory(nextHistory);
      setCurrentPly(nextHistory.length);
      setPendingPromotion(null);
      setIsAutoPlaying(false);
      setFen(sandbox.fen());
      logMove(applied, nextHistory.length);
      return true;
    },
    [appendConsoleLine, currentPly, logMove, moveHistory],
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

  const handleHeatmapCommand = useCallback(
    (rawArgs: string[]): boolean => {
      const tokens = rawArgs.map((token) => token.trim()).filter((token) => token.length > 0);
      const lowerTokens = tokens.map((token) => token.toLowerCase());
      const currentScheme = heatmapSchemes.find((scheme) => scheme.id === heatmapState.schemeId) ?? null;
      const currentProfile =
        heatmapColorProfiles.find((profile) => profile.id === heatmapState.colorProfileId) ?? null;

      const printStatus = () => {
        appendConsoleLine('>> Heatmap status:');
        appendConsoleLine(
          `   Scheme: ${
            currentScheme ? `${currentScheme.label} (${currentScheme.id})` : heatmapState.schemeId
          }`,
        );
        appendConsoleLine(`   Trace mode: ${formatTraceModeLabel(heatmapState.subScheme)}`);
        appendConsoleLine(`   Include both sides: ${heatmapState.includeBothSides ? 'yes' : 'no'}`);
        appendConsoleLine(
          `   Color profile: ${
            currentProfile ? `${currentProfile.label} (${currentProfile.id})` : heatmapState.colorProfileId
          }`,
        );
        appendConsoleLine(`   Check highlights: ${heatmapState.checkHighlightsEnabled ? 'on' : 'off'}`);
        appendConsoleLine(`   Active toggles: ${heatmapState.activeToggleIds.size}`);
      };

      if (lowerTokens.length === 0 || lowerTokens[0] === 'status') {
        printStatus();
        return true;
      }

      const subject = lowerTokens[0];
      switch (subject) {
        case 'scheme': {
          const action = lowerTokens[1];
          if (!action || action === 'list') {
            appendConsoleLine('>> Heatmap schemes:');
            heatmapSchemes.forEach((scheme) => {
              const marker = scheme.id === heatmapState.schemeId ? '*' : '-';
              const description = scheme.description ? ` - ${scheme.description}` : '';
              appendConsoleLine(`   ${marker} ${scheme.id} (${scheme.label})${description}`);
            });
            appendConsoleLine('   * denotes the active scheme.');
            return true;
          }

          if (action === 'set') {
            const targetToken = lowerTokens[2];
            if (!targetToken) {
              appendConsoleLine('?? Usage: heatmap scheme set <scheme-id>');
              return true;
            }

            const target = heatmapSchemes.find((scheme) => scheme.id === targetToken);
            if (!target) {
              appendConsoleLine(
                `?? Unknown heatmap scheme "${tokens[2]}". Type "heatmap scheme list" to inspect options.`,
              );
              return true;
            }

            if (target.id === heatmapState.schemeId) {
              appendConsoleLine(`>> Heatmap scheme already set to ${target.label}.`);
              return true;
            }

            const supportedModes = target.supportedSubSchemes ?? ['line-of-sight'];
            const previousSubScheme = heatmapState.subScheme;
            heatmapActions.setSchemeId(target.id);
            appendConsoleLine(`>> Heatmap scheme set to ${target.label} (${target.id}).`);
            if (!supportedModes.includes(previousSubScheme) && supportedModes.length > 0) {
              const nextSub = supportedModes[0] as HeatmapTraceMode;
              appendConsoleLine(`   Trace mode switched to ${formatTraceModeLabel(nextSub)}.`);
            }
            return true;
          }

          appendConsoleLine('?? Usage: heatmap scheme <list|set>');
          return true;
        }
        case 'sub-scheme':
        case 'subscheme': {
          const action = lowerTokens[1];
          if (action !== 'set') {
            appendConsoleLine('?? Usage: heatmap sub-scheme set <line-of-sight|absolute>');
            return true;
          }

          const targetToken = lowerTokens[2];
          if (!targetToken) {
            appendConsoleLine('?? Usage: heatmap sub-scheme set <line-of-sight|absolute>');
            return true;
          }

          const targetMode = targetToken === 'absolute' ? 'absolute' : 'line-of-sight';
          if (targetMode === heatmapState.subScheme) {
            appendConsoleLine(`>> Trace mode already set to ${formatTraceModeLabel(targetMode)}.`);
            return true;
          }

          const activeScheme =
            heatmapSchemes.find((scheme) => scheme.id === heatmapState.schemeId) ?? null;
          const supported = activeScheme?.supportedSubSchemes ?? ['line-of-sight'];
          if (!supported.includes(targetMode)) {
            appendConsoleLine(
              `?? Trace mode "${tokens[2] ?? targetToken}" is not supported by the ${
                activeScheme?.label ?? 'current'
              } scheme.`,
            );
            return true;
          }

          heatmapActions.setSubScheme(targetMode as HeatmapTraceMode);
          appendConsoleLine(`>> Trace mode set to ${formatTraceModeLabel(targetMode)}.`);
          return true;
        }
        case 'color':
        case 'colors':
        case 'color-profile':
        case 'profile': {
          const action = lowerTokens[1];
          if (!action || action === 'list') {
            appendConsoleLine('>> Heatmap color profiles:');
            heatmapColorProfiles.forEach((profile) => {
              const marker = profile.id === heatmapState.colorProfileId ? '*' : '-';
              const description = profile.description ? ` - ${profile.description}` : '';
              appendConsoleLine(`   ${marker} ${profile.id} (${profile.label})${description}`);
            });
            appendConsoleLine('   * denotes the active profile.');
            return true;
          }

          if (action === 'set') {
            const targetToken = lowerTokens[2];
            if (!targetToken) {
              appendConsoleLine('?? Usage: heatmap colors set <profile-id>');
              return true;
            }

            const target = heatmapColorProfiles.find((profile) => profile.id === targetToken);
            if (!target) {
              appendConsoleLine(
                `?? Unknown color profile "${tokens[2]}". Type "heatmap colors list" to inspect options.`,
              );
              return true;
            }

            if (target.id === heatmapState.colorProfileId) {
              appendConsoleLine(`>> Color profile already set to ${target.label}.`);
              return true;
            }

            heatmapActions.setColorProfileId(target.id as HeatmapColorProfileId);
            appendConsoleLine(`>> Color profile set to ${target.label} (${target.id}).`);
            return true;
          }

          appendConsoleLine('?? Usage: heatmap colors <list|set>');
          return true;
        }
        case 'check':
        case 'check-highlights': {
          const action = lowerTokens[1];
          if (!action) {
            appendConsoleLine(
              `>> Check highlights are ${heatmapState.checkHighlightsEnabled ? 'ON' : 'OFF'}.`,
            );
            return true;
          }

          if (['on', 'enable', 'enabled'].includes(action)) {
            if (heatmapState.checkHighlightsEnabled) {
              appendConsoleLine('>> Check highlights already enabled.');
            } else {
              heatmapActions.setCheckHighlightsEnabled(true);
              appendConsoleLine('>> Check highlights enabled.');
            }
            return true;
          }

          if (['off', 'disable', 'disabled'].includes(action)) {
            if (!heatmapState.checkHighlightsEnabled) {
              appendConsoleLine('>> Check highlights already disabled.');
            } else {
              heatmapActions.setCheckHighlightsEnabled(false);
              appendConsoleLine('>> Check highlights disabled.');
            }
            return true;
          }

          if (action === 'toggle') {
            heatmapActions.setCheckHighlightsEnabled(!heatmapState.checkHighlightsEnabled);
            appendConsoleLine(
              `>> Check highlights ${heatmapState.checkHighlightsEnabled ? 'disabled' : 'enabled'}.`,
            );
            return true;
          }

          appendConsoleLine('?? Usage: heatmap check <on|off|toggle>');
          return true;
        }
        case 'include':
        case 'sides': {
          const action = lowerTokens[1];
          if (!action) {
            appendConsoleLine(
              `>> Including both sides: ${heatmapState.includeBothSides ? 'YES' : 'NO'}.`,
            );
            return true;
          }

          if (['both', 'both-sides', 'on', 'true', 'yes'].includes(action)) {
            if (heatmapState.includeBothSides) {
              appendConsoleLine('>> Already including both sides.');
            } else {
              heatmapActions.setIncludeBothSides(true);
              appendConsoleLine('>> Heatmap will include both sides.');
            }
            return true;
          }

          if (['single', 'one', 'self', 'off', 'false', 'no'].includes(action)) {
            if (!heatmapState.includeBothSides) {
              appendConsoleLine('>> Already showing single-side influence.');
            } else {
              heatmapActions.setIncludeBothSides(false);
              appendConsoleLine('>> Heatmap will show single-side influence totals.');
            }
            return true;
          }

          appendConsoleLine('?? Usage: heatmap include <both|single>');
          return true;
        }
        case 'help': {
          const helpLines = [
            '>> Heatmap command help:',
            '   heatmap status',
            '   heatmap scheme list',
            '   heatmap scheme set <scheme-id>',
            '   heatmap sub-scheme set <line-of-sight|absolute>',
            '   heatmap colors list',
            '   heatmap colors set <profile-id>',
            '   heatmap include <both|single>',
            '   heatmap check <on|off|toggle>',
          ];
          helpLines.forEach((line) => appendConsoleLine(line));
          return true;
        }
        default:
          appendConsoleLine('?? Unknown heatmap command. Type "heatmap help" for available subcommands.');
          return false;
      }
    },
    [
      appendConsoleLine,
      formatTraceModeLabel,
      heatmapActions,
      heatmapColorProfiles,
      heatmapSchemes,
      heatmapState,
    ],
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
      if (trimmed.startsWith('/')) {
        attemptTerminalMove(trimmed.slice(1));
        return;
      }

      if (command.toLowerCase() === 'move') {
        attemptTerminalMove(rest.join(' '));
        return;
      }

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
        case 'heatmap':
          handleHeatmapCommand(rest);
          break;
        case 'commands':
        case 'help': {
          const helpLines = [
            '>> Available commands:',
            '   play',
            '   pause | stop',
            '   speed <ms>',
            '   reset',
            '   heatmap <status|scheme|sub-scheme|colors|include|check>',
            '   commands | help',
            '   controls',
            '   clear | cls',
            '   move <san|uci> or /<san|uci>',
            '   paste PGN to import (respond y/n when prompted)',
          ];
          helpLines.forEach((line) => appendConsoleLine(line));
          break;
        }
        case 'controls': {
          const controlLines = [
            '>> Keyboard shortcuts:',
            '   Left / A: previous move',
            '   Right / D: next move',
            '   Up / Down: navigate move history',
            '   Space: toggle autoplay',
            '   + or =: faster autoplay',
            '   - or _: slower autoplay',
          ];
          controlLines.forEach((line) => appendConsoleLine(line));
          break;
        }
        case 'clear':
        case 'cls': {
          setConsoleLines([...INITIAL_TERMINAL_LINES, '>> Terminal cleared.']);
          break;
        }
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
      handleHeatmapCommand,
      isAutoPlaying,
      attemptTerminalMove,
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

  useEffect(() => {
    const previous = previousOrientationRef.current;
    if (previous !== boardOrientation && heatmapState.friendlyColor === previous) {
      heatmapActions.setFriendlyColor(boardOrientation);
    }
    previousOrientationRef.current = boardOrientation;
  }, [boardOrientation, heatmapActions, heatmapState.friendlyColor]);

  const terminalMargin = isCanvasExpanded ? 0 : 32;
  const workspaceStackClass = [
    'flex w-full max-w-6xl flex-col items-center',
    isCanvasExpanded ? 'gap-0' : 'gap-8',
  ]
    .filter(Boolean)
    .join(' ');

  const logLayoutMetrics = useCallback(
    (element: HTMLElement | null) => {
      if (!element || process.env.NODE_ENV !== 'development') {
        return;
      }

      const rect = element.getBoundingClientRect();
      layoutLogger.debug('main-layout', {
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        paddingBottom: window.getComputedStyle(element).paddingBottom,
      });
    },
    [layoutLogger],
  );

  const logWorkspaceMetrics = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || process.env.NODE_ENV !== 'development') {
        return;
      }

      const rect = element.getBoundingClientRect();
      layoutLogger.debug('workspace-layout', {
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        marginBottom: window.getComputedStyle(element).marginBottom,
        paddingBottom: window.getComputedStyle(element).paddingBottom,
      });
    },
    [layoutLogger],
  );

  return (
    <main
      ref={logLayoutMetrics}
      className="flex min-h-screen flex-col items-center bg-slate-950 px-6"
      style={{ paddingTop: '120px', paddingBottom: '120px' }}
    >
      <div ref={logWorkspaceMetrics} className={workspaceStackClass}>
        <HeatmapBoard
          fen={fen}
          orientation={boardOrientation}
          moveMode={!pendingPromotion}
          boardSize={BOARD_SIZE}
          onMove={handleMove}
          promotionRequest={
            pendingPromotion ? { square: pendingPromotion.to, color: pendingPromotion.color } : undefined
          }
          onSelectPromotion={handlePromotionSelect}
          onCancelPromotion={handlePromotionCancel}
          onCanvasModeChange={setIsCanvasExpanded}
          onExpandedAttachmentTargetChange={setCanvasAttachmentHost}
          onOrientationToggle={handleOrientationToggle}
        />
        <GameTerminal
          moves={moveHistory}
          currentPly={currentPly}
          isAutoPlaying={isAutoPlaying}
          autoDelay={autoDelay}
          consoleLines={consoleLines}
          boardWidth={BOARD_SIZE}
          marginTop={terminalMargin}
          isCanvasExpanded={isCanvasExpanded}
          portalTarget={canvasAttachmentHost}
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



export default function Home() {
  return (
    <HeatmapSettingsProvider>
      <HomeContent />
    </HeatmapSettingsProvider>
  );
}


