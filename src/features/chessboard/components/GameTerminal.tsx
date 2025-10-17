import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Move } from 'chess.js';
import { createScopedLogger } from '@/shared/utils/logger';

const SPEED_STEP_MS = 200;

interface GameTerminalProps {
  className?: string;
  moves: Move[];
  currentPly: number;
  isAutoPlaying: boolean;
  autoDelay: number;
  consoleLines: string[];
  boardWidth: number;
  marginTop: number;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToPly: (ply: number) => void;
  onToggleAutoplay: () => void;
  onAdjustSpeed: (delta: number) => void;
  onSubmitCommand: (command: string) => void;
}

type MoveRow = {
  turn: number;
  white?: Move;
  black?: Move;
  whiteIndex: number;
  blackIndex: number;
};

const buildMoveRows = (moves: Move[]): MoveRow[] =>
  moves.reduce<MoveRow[]>((rows, move, index) => {
    const rowIndex = Math.floor(index / 2);
    if (!rows[rowIndex]) {
      rows[rowIndex] = {
        turn: rowIndex + 1,
        whiteIndex: rowIndex * 2,
        blackIndex: rowIndex * 2 + 1,
      } as MoveRow;
    }
    if (move.color === 'w') {
      rows[rowIndex].white = move;
    } else {
      rows[rowIndex].black = move;
    }
    return rows;
  }, []);

export const GameTerminal = ({
  className,
  moves,
  currentPly,
  isAutoPlaying,
  autoDelay,
  consoleLines,
  boardWidth,
  marginTop,
  onStepForward,
  onStepBackward,
  onJumpToPly,
  onToggleAutoplay,
  onAdjustSpeed,
  onSubmitCommand,
}: GameTerminalProps) => {
  const [input, setInput] = useState('');
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const activeMoveRef = useRef<HTMLButtonElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const layoutLogger = useMemo(() => createScopedLogger('terminal/layout'), []);

  const rows = useMemo(() => buildMoveRows(moves), [moves]);
  const activeIndex = currentPly - 1;
  const clampedWidth = useMemo(() => Math.max(240, Math.round(boardWidth)), [boardWidth]);

  useEffect(() => {
    if (!consoleRef.current) {
      return;
    }
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleLines]);

  useEffect(() => {
    activeMoveRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeIndex]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }

    const element = terminalRef.current;
    if (!element) {
      layoutLogger.warn('terminal-missing');
      return;
    }

    const logMetrics = (context: string) => {
      const rect = element.getBoundingClientRect();
      layoutLogger.debug('terminal-metrics', {
        context,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        clientWidth: element.clientWidth,
        offsetWidth: element.offsetWidth,
        className: element.className,
        style: element.getAttribute('style'),
      });
    };

    logMetrics('init');

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => logMetrics('resize'));
      observer.observe(element);
      return () => observer.disconnect();
    }

    const handleResize = () => logMetrics('resize');
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutLogger]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          onStepBackward();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          onStepForward();
          break;
        case ' ':
          if (!isTyping) {
            event.preventDefault();
            onToggleAutoplay();
          }
          break;
        case '+':
        case '=':
          if (!isTyping) {
            event.preventDefault();
            onAdjustSpeed(-SPEED_STEP_MS);
          }
          break;
        case '-':
        case '_':
          if (!isTyping) {
            event.preventDefault();
            onAdjustSpeed(SPEED_STEP_MS);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAdjustSpeed, onStepBackward, onStepForward, onToggleAutoplay]);

  const submitCommand = useCallback(() => {
    const command = input.trim();
    if (command) {
      onSubmitCommand(command);
      setInput('');
    }
  }, [input, onSubmitCommand]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitCommand();
      }
    },
    [submitCommand],
  );

  return (
    <aside
      ref={terminalRef}
      className={[
        'relative z-20 mx-auto min-w-[200px] self-center rounded-lg border border-slate-900 bg-[rgb(5,8,18)] p-4 text-slate-200 shadow-[0_14px_28px_rgba(3,8,20,0.55)]',
        'font-mono text-[12px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: clampedWidth, marginTop }}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
        <span>Move Feed</span>
        <span className={isAutoPlaying ? 'text-emerald-300' : 'text-slate-600'}>
          {isAutoPlaying ? `Auto - ${autoDelay}ms` : 'Paused'}
        </span>
      </div>

      <div className="max-h-44 overflow-y-auto rounded-md border border-slate-900/60 bg-slate-950/40 px-3 py-2">
        <button
          type="button"
          onClick={() => onJumpToPly(0)}
          className={[
            'mb-2 w-full cursor-pointer rounded px-2 py-1 text-left transition',
            activeIndex < 0 ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-500 hover:bg-slate-900/70',
          ].join(' ')}
        >
          {'>> Start'}
        </button>
        {rows.length === 0 ? (
          <div className="text-slate-600">No moves recorded.</div>
        ) : (
          rows.map((row) => {
            const whiteActive = activeIndex === row.whiteIndex;
            const blackActive = activeIndex === row.blackIndex;
            return (
              <div key={row.turn} className="flex items-center gap-4 py-0.5">
                <span className="w-8 text-right text-slate-600">{`${row.turn}.`}</span>
                <div className="flex flex-1 items-center gap-4">
                  <button
                    type="button"
                    disabled={!row.white}
                    ref={whiteActive ? activeMoveRef : null}
                    className={[
                      'min-w-[60px] cursor-pointer rounded px-2 py-1 text-left transition',
                      whiteActive
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'text-slate-300 hover:bg-slate-900/70',
                      !row.white ? 'cursor-default opacity-30 hover:bg-transparent' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => row.white && onJumpToPly(row.whiteIndex + 1)}
                  >
                    {row.white?.san ?? '...'}
                  </button>
                  <button
                    type="button"
                    disabled={!row.black}
                    ref={blackActive ? activeMoveRef : null}
                    className={[
                      'min-w-[60px] cursor-pointer rounded px-2 py-1 text-left transition',
                      blackActive
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'text-slate-300 hover:bg-slate-900/70',
                      !row.black ? 'cursor-default opacity-30 hover:bg-transparent' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => row.black && onJumpToPly(row.blackIndex + 1)}
                  >
                    {row.black?.san ?? ''}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        ref={consoleRef}
        className="mt-3 max-h-40 overflow-y-auto rounded-md border border-slate-900/60 bg-black/70 px-3 py-2 text-[11px]"
      >
        {consoleLines.map((line, index) => (
          <div key={`${line}-${index}`} className="whitespace-pre-wrap text-slate-300">
            {line}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-start gap-2 text-[12px] text-emerald-300">
        <span className="select-none text-emerald-400">{'>'}</span>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a command or paste PGN (Enter to run, Shift+Enter for newline)"
          className="h-8 w-full resize-none bg-transparent text-emerald-200 outline-none placeholder:text-slate-600"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </aside>
  );
};

GameTerminal.displayName = 'GameTerminal';

